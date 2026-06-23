import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KPayService } from '../payments/kpay.service';
import { CreatePosSaleDto, PosPaymentMethod } from './dto/create-pos-sale.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PosService {
  private readonly logger = new Logger('PosService');

  constructor(
    private prisma: PrismaService,
    private kpay: KPayService,
  ) {}

  /**
   * Creer une vente POS.
   * - Verifie le stock de chaque produit
   * - Cree une commande Order avec orderFrom = 'pos'
   * - Decremente le stock
   * - Si especes/virement : marque directement comme PAID
   * - Si MTN/Orange : initie le paiement KPay USSD
   */
  async createSale(adminUserId: string, dto: CreatePosSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Le panier est vide');
    }

    // Valider phone si mobile money
    if (
      (dto.paymentMethod === PosPaymentMethod.MTN_MOMO ||
        dto.paymentMethod === PosPaymentMethod.ORANGE_MONEY) &&
      !dto.phoneNumber
    ) {
      throw new BadRequestException(
        'Le numero de telephone est requis pour le paiement Mobile Money',
      );
    }

    // Recuperer les produits avec leur stock
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        stocks: true,
        category: { select: { name: true } },
        images: { where: { isMain: true }, take: 1 },
        shop: { select: { id: true, userId: true } },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont introuvables');
    }

    // Verifier les stocks
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      const totalStock = product.stocks.reduce((sum, s) => sum + s.qty, 0);
      if (totalStock < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour "${product.name}" (disponible: ${totalStock}, demande: ${item.quantity})`,
        );
      }
    }

    // Calculs
    const subtotal = dto.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = dto.discount || 0;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * 0.1925);
    const total = taxableAmount + tax;

    // Determiner le sellerId (premier produit, ou l'admin lui-meme)
    const firstProduct = products[0];
    const sellerId = firstProduct.shop?.userId || adminUserId;

    // Mapper le mode de paiement vers PaymentMethod enum
    const paymentMethodMap: Record<string, PaymentMethod | null> = {
      MTN_MOMO: PaymentMethod.MTN_MOMO,
      ORANGE_MONEY: PaymentMethod.ORANGE_MONEY,
      ESPECES: PaymentMethod.COD,
      VIREMENT: PaymentMethod.COD,
      GFS_PAYMENT: PaymentMethod.GFS_PAYMENT,
    };

    const dbPaymentMethod = paymentMethodMap[dto.paymentMethod] || PaymentMethod.COD;
    const isPaidDirectly =
      dto.paymentMethod === PosPaymentMethod.ESPECES ||
      dto.paymentMethod === PosPaymentMethod.VIREMENT;

    const orderNumber = `POS-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Transaction atomique
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Creer la commande
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: adminUserId,
          sellerId,
          status: isPaidDirectly ? 'CONFIRMED' : 'PENDING',
          paymentStatus: isPaidDirectly ? 'PAID' : 'PENDING',
          paymentMethod: dbPaymentMethod,
          subtotal,
          discount,
          tax,
          total,
          note: dto.customerName
            ? `POS — Client: ${dto.customerName}`
            : 'POS — Vente au comptoir',
          orderFrom: 'pos',
        },
      });

      // 2. Creer les OrderDetails
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.productId)!;
        const mainImage = product.images[0]?.url || null;

        await tx.orderDetail.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            sellerId,
            name: product.name,
            image: mainImage,
            price: item.price,
            quantity: item.quantity,
            tax: Math.round(item.price * item.quantity * 0.1925),
            total: item.price * item.quantity,
          },
        });

        // 3. Decrementer le stock
        const stocksToDecrement = product.stocks.filter((s) => s.qty > 0);
        let remaining = item.quantity;

        for (const stock of stocksToDecrement) {
          if (remaining <= 0) break;
          const decrement = Math.min(remaining, stock.qty);
          await tx.productStock.update({
            where: { id: stock.id },
            data: { qty: { decrement } },
          });
          remaining -= decrement;
        }
      }

      // 4. Creer le Payment
      if (isPaidDirectly) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: dbPaymentMethod,
            amount: total,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });
      }

      return order;
    });

    // 5. Si mobile money, initier le paiement KPay
    let kpayData: any = null;
    if (
      dto.paymentMethod === PosPaymentMethod.MTN_MOMO ||
      dto.paymentMethod === PosPaymentMethod.ORANGE_MONEY
    ) {
      try {
        const provider = this.kpay.resolveProvider(dto.paymentMethod);
        if (!provider) {
          throw new BadRequestException(`Provider introuvable pour ${dto.paymentMethod}`);
        }

        const externalId = `POS-${result.id}-${uuidv4().slice(0, 8)}`;

        const kpayResult = await this.kpay.initPaymentUssd({
          amount: total,
          provider,
          phoneNumber: dto.phoneNumber!,
          externalId,
          description: `Vente POS ${orderNumber}`,
          metadata: { orderId: result.id, orderNumber },
        });

        // Creer le Payment avec les infos KPay
        await this.prisma.payment.create({
          data: {
            orderId: result.id,
            method: dbPaymentMethod,
            amount: total,
            status: PaymentStatus.PENDING,
            kpayId: kpayResult.id,
            externalId,
            provider,
            phoneNumber: dto.phoneNumber,
            providerRef: kpayResult.reference,
          },
        });

        kpayData = {
          kpayId: kpayResult.id,
          reference: kpayResult.reference,
          message: kpayResult.message || 'Confirmez le paiement sur votre telephone.',
        };

        this.logger.log(
          `[POS] Paiement KPay initie pour ${orderNumber}: ${kpayResult.id}`,
        );
      } catch (err: any) {
        this.logger.error(`[POS] Erreur KPay pour ${orderNumber}: ${err.message}`);
        kpayData = { error: err.message };
      }
    }

    // Construire le recu
    const receiptItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        productId: item.productId,
        name: product.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      };
    });

    this.logger.log(
      `[POS] Vente ${orderNumber} — ${total} FCFA — ${dto.paymentMethod} — ${isPaidDirectly ? 'PAID' : 'PENDING'}`,
    );

    return {
      result: true,
      message: isPaidDirectly
        ? 'Vente enregistree avec succes'
        : 'Vente enregistree. En attente de confirmation du paiement.',
      data: {
        orderId: result.id,
        orderNumber,
        customerName: dto.customerName || null,
        items: receiptItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: isPaidDirectly ? 'PAID' : 'PENDING',
        kpay: kpayData,
        createdAt: result.createdAt,
      },
    };
  }
}
