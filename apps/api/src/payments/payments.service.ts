import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KPayService } from './kpay.service';
import { GfsService } from './gfs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MerciEService } from '../delivery/merci-e.service';
import { CouponsService } from '../coupons/coupons.service';
import { InitPaymentDto, PaymentMode } from './dto/init-payment.dto';
import { PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    private prisma: PrismaService,
    private kpay: KPayService,
    private gfs: GfsService,
    private notifications: NotificationsService,
    private merciE: MerciEService,
    private coupons: CouponsService,
  ) {}

  /**
   * Initier le paiement d'une commande groupee (CombinedOrder).
   * Supporte: MTN_MOMO, ORANGE_MONEY (via KPay USSD),
   *           KPAY_GATEWAY (page hebergee KPay), PAYPAL, COD, WALLET
   */
  async initPayment(userId: string, dto: InitPaymentDto) {
    // Verifier que le CombinedOrder appartient au user
    const combinedOrder = await this.prisma.combinedOrder.findUnique({
      where: { id: dto.combinedOrderId },
      include: {
        orders: {
          include: { payment: true },
        },
      },
    });

    if (!combinedOrder) throw new NotFoundException('Commande introuvable');
    if (combinedOrder.userId !== userId) throw new ForbiddenException('Acces refuse');

    // Calculer le montant total
    const totalAmount = combinedOrder.orders.reduce((sum, o) => sum + o.total, 0);
    if (totalAmount <= 0) throw new BadRequestException('Montant de commande invalide');

    // Verifier qu'aucune commande n'est deja payee
    const alreadyPaid = combinedOrder.orders.some(
      (o) => o.payment && o.payment.status === 'PAID',
    );
    if (alreadyPaid) throw new BadRequestException('Cette commande est deja payee');

    const method = dto.method as PaymentMethod;

    // ==================== COD (paiement a la livraison) ====================
    if (method === PaymentMethod.COD) {
      return this.handleCOD(combinedOrder, method);
    }

    // ==================== KPAY: MTN_MOMO / ORANGE_MONEY (mode USSD) ====================
    if ((method === PaymentMethod.MTN_MOMO || method === PaymentMethod.ORANGE_MONEY) && dto.mode !== PaymentMode.GATEWAY) {
      if (!dto.phoneNumber) {
        throw new BadRequestException('phoneNumber requis pour le paiement Mobile Money');
      }
      return this.handleKPayUssd(combinedOrder, totalAmount, method, dto.phoneNumber);
    }

    // ==================== KPAY GATEWAY (page hebergee) ====================
    if (method === PaymentMethod.KPAY_GATEWAY || dto.mode === PaymentMode.GATEWAY) {
      if (!dto.returnUrl) {
        throw new BadRequestException('returnUrl requis pour le mode GATEWAY');
      }
      return this.handleKPayGateway(combinedOrder, totalAmount, dto.returnUrl, dto.cancelUrl);
    }

    // ==================== GFS PAYMENT (GFSolutions) ====================
    if (method === PaymentMethod.GFS_PAYMENT) {
      if (!dto.returnUrl) {
        throw new BadRequestException('returnUrl requis pour GFSolutions');
      }
      return this.handleGfsPayment(combinedOrder, totalAmount, dto.returnUrl);
    }

    // ==================== PAYPAL ====================
    if (method === PaymentMethod.PAYPAL) {
      // TODO: Integration PayPal REST API
      throw new BadRequestException('PayPal sera disponible prochainement');
    }

    throw new BadRequestException(`Methode de paiement non supportee: ${method}`);
  }

  // ==================== COD ====================

  private async handleCOD(combinedOrder: any, method: PaymentMethod) {
    for (const order of combinedOrder.orders) {
      if (order.payment) continue;

      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          method,
          amount: order.total,
          status: PaymentStatus.PENDING,
        },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: method, paymentStatus: PaymentStatus.PENDING },
      });
    }

    // Notifier vendeur et admins pour commande COD
    for (const order of combinedOrder.orders) {
      this.notifyNewOrder(order.id).catch(() => {});
    }

    return {
      result: true,
      message: 'Paiement a la livraison enregistre',
      data: { method: 'COD', status: 'PENDING' },
    };
  }

  // ==================== KPAY MODE USSD ====================

  private async handleKPayUssd(
    combinedOrder: any,
    totalAmount: number,
    method: PaymentMethod,
    phoneNumber: string,
  ) {
    const provider = this.kpay.resolveProvider(method);
    if (!provider) throw new BadRequestException(`Provider introuvable pour ${method}`);

    const externalId = `EA-${combinedOrder.id}-${uuidv4().slice(0, 8)}`;

    const kpayResult = await this.kpay.initPaymentUssd({
      amount: totalAmount,
      provider,
      phoneNumber,
      externalId,
      description: `Commande EstuaireAchats ${combinedOrder.id}`,
      metadata: { combinedOrderId: combinedOrder.id },
    });

    for (const order of combinedOrder.orders) {
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            method,
            kpayId: kpayResult.id,
            externalId,
            provider,
            phoneNumber,
            providerRef: kpayResult.reference,
            status: PaymentStatus.PENDING,
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            method,
            amount: order.total,
            kpayId: kpayResult.id,
            externalId,
            provider,
            phoneNumber,
            providerRef: kpayResult.reference,
            status: PaymentStatus.PENDING,
            metadata: { isTest: kpayResult.isTest },
          },
        });
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: method, paymentStatus: PaymentStatus.PENDING },
      });
    }

    return {
      result: true,
      message: kpayResult.message || 'Paiement initie. Confirmez sur votre telephone.',
      data: {
        method,
        status: 'PENDING',
        kpayId: kpayResult.id,
        reference: kpayResult.reference,
        provider,
        phoneNumber,
        isTest: kpayResult.isTest,
      },
    };
  }

  // ==================== KPAY MODE GATEWAY ====================

  private async handleKPayGateway(
    combinedOrder: any,
    totalAmount: number,
    returnUrl: string,
    cancelUrl?: string,
  ) {
    const externalId = `EA-${combinedOrder.id}-${uuidv4().slice(0, 8)}`;

    const kpayResult = await this.kpay.initPaymentGateway({
      amount: totalAmount,
      externalId,
      returnUrl,
      cancelUrl,
      description: `Commande EstuaireAchats ${combinedOrder.id}`,
      metadata: { combinedOrderId: combinedOrder.id },
    });

    // Creer les Payment en PENDING
    for (const order of combinedOrder.orders) {
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            method: PaymentMethod.KPAY_GATEWAY,
            kpayId: kpayResult.id,
            externalId,
            providerRef: kpayResult.reference,
            gatewayUrl: kpayResult.gatewayUrl,
            status: PaymentStatus.PENDING,
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            method: PaymentMethod.KPAY_GATEWAY,
            amount: order.total,
            kpayId: kpayResult.id,
            externalId,
            providerRef: kpayResult.reference,
            gatewayUrl: kpayResult.gatewayUrl,
            status: PaymentStatus.PENDING,
            metadata: { isTest: kpayResult.isTest },
          },
        });
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: PaymentMethod.KPAY_GATEWAY, paymentStatus: PaymentStatus.PENDING },
      });
    }

    return {
      result: true,
      message: kpayResult.message || 'Redirigez le client vers gatewayUrl pour payer.',
      data: {
        method: 'KPAY_GATEWAY',
        status: 'PENDING',
        kpayId: kpayResult.id,
        reference: kpayResult.reference,
        gatewayUrl: kpayResult.gatewayUrl,
        isTest: kpayResult.isTest,
      },
    };
  }

  // ==================== GFS PAYMENT (GFSolutions) ====================

  private async handleGfsPayment(
    combinedOrder: any,
    totalAmount: number,
    returnUrl: string,
  ) {
    const orderId = combinedOrder.id;

    const gfsResult = await this.gfs.createPayment({
      amount: totalAmount,
      orderId,
      description: `Commande EstuaireAchats ${orderId}`,
      returnUrl,
      callbackUrl: `${process.env.API_URL}/api/v1/payments/webhook/gfs`,
      metadata: JSON.stringify({ combinedOrderId: orderId }),
    });

    for (const order of combinedOrder.orders) {
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            method: PaymentMethod.GFS_PAYMENT,
            providerRef: gfsResult.paymentRef,
            gatewayUrl: gfsResult.paymentUrl,
            externalId: gfsResult.paymentRef,
            status: PaymentStatus.PENDING,
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            method: PaymentMethod.GFS_PAYMENT,
            amount: order.total,
            providerRef: gfsResult.paymentRef,
            gatewayUrl: gfsResult.paymentUrl,
            externalId: gfsResult.paymentRef,
            status: PaymentStatus.PENDING,
          },
        });
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: PaymentMethod.GFS_PAYMENT, paymentStatus: PaymentStatus.PENDING },
      });
    }

    return {
      result: true,
      message: 'Redirigez le client vers paymentUrl pour payer avec GFSolutions.',
      data: {
        method: 'GFS_PAYMENT',
        status: 'PENDING',
        paymentRef: gfsResult.paymentRef,
        paymentUrl: gfsResult.paymentUrl,
        expiresAt: gfsResult.expiresAt,
      },
    };
  }

  // ==================== VERIFIER STATUT ====================

  async checkPaymentStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { userId: true, sellerId: true } } },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.order.userId !== userId) throw new ForbiddenException('Acces refuse');

    // Si deja termine, pas besoin de polling
    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.FAILED) {
      return { result: true, data: this.formatPaymentResponse(payment) };
    }

    // Si KPay, poll le statut
    if (payment.kpayId) {
      const kpayStatus = await this.kpay.getPaymentStatus(payment.kpayId);
      await this.processKPayStatus(payment, kpayStatus);

      // Re-lire apres mise a jour
      const updated = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      return { result: true, data: this.formatPaymentResponse(updated!) };
    }

    return { result: true, data: this.formatPaymentResponse(payment) };
  }

  // ==================== WEBHOOK KPAY ====================

  async handleKPayWebhook(event: any, rawBody: Buffer, signature: string) {
    // Verifier la signature
    if (!this.kpay.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('[Webhook] Signature invalide');
      throw new BadRequestException('Signature webhook invalide');
    }

    this.logger.log(`[Webhook] Evenement recu: ${event.event} — ${event.paymentId}`);

    // 1. Verifier si c'est un retrait (withdrawal)
    const withdraw = await this.prisma.withdrawRequest.findFirst({
      where: {
        OR: [
          { kpayId: event.paymentId },
          ...(event.externalId ? [{ id: { contains: event.externalId.split('-')[1] || '' } }] : []),
        ],
      },
    });

    if (withdraw) {
      return this.handleKPayWithdrawWebhook(withdraw, event);
    }

    // 2. Sinon, traiter comme un paiement
    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          { kpayId: event.paymentId },
          { externalId: event.externalId },
        ],
      },
    });

    if (payments.length === 0) {
      this.logger.warn(`[Webhook] Aucun paiement/retrait trouve: ${event.paymentId} / ${event.externalId}`);
      return { received: true };
    }

    const kpayStatus = {
      status: event.status,
      completedAt: event.completedAt,
      failedAt: event.failedAt,
      failureReason: event.failureReason,
    };

    for (const payment of payments) {
      await this.processKPayStatus(payment, kpayStatus as any);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { webhookReceived: true },
      });
    }

    return { received: true };
  }

  /**
   * Traite un webhook KPay pour un retrait vendeur
   */
  private async handleKPayWithdrawWebhook(withdraw: any, event: any) {
    this.logger.log(`[Webhook] Retrait detecte: ${withdraw.id} — status: ${event.status}`);

    if (withdraw.status === 'COMPLETED' || withdraw.status === 'REJECTED') {
      this.logger.log(`[Webhook] Retrait ${withdraw.id} deja ${withdraw.status}, ignore`);
      return { received: true };
    }

    if (event.status === 'COMPLETED') {
      await this.prisma.withdrawRequest.update({
        where: { id: withdraw.id },
        data: { status: 'COMPLETED' },
      });
      this.logger.log(`[Webhook] Retrait COMPLETE: ${withdraw.id}`);
    } else if (event.status === 'FAILED' || event.status === 'CANCELLED') {
      await this.prisma.withdrawRequest.update({
        where: { id: withdraw.id },
        data: {
          status: 'REJECTED',
          failureReason: event.failureReason || event.status,
        },
      });
      this.logger.warn(`[Webhook] Retrait ECHEC: ${withdraw.id} — ${event.failureReason || event.status}`);
    }

    return { received: true };
  }

  // ==================== RETOUR GATEWAY ====================

  async handleGatewayReturn(query: {
    status: string;
    reference: string;
    externalId?: string;
    ts: string;
    sig: string;
  }) {
    // Verifier la signature
    const valid = this.kpay.verifyGatewayReturn(query);
    if (!valid) {
      this.logger.warn('[GatewayReturn] Signature invalide ou expiree');
      throw new BadRequestException('Signature de retour invalide');
    }

    // Trouver le paiement et confirmer via GET status
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { providerRef: query.reference },
          { externalId: query.externalId },
        ],
      },
    });

    if (!payment || !payment.kpayId) {
      throw new NotFoundException('Paiement introuvable');
    }

    // Toujours confirmer via API (regle d'or KPay)
    const kpayStatus = await this.kpay.getPaymentStatus(payment.kpayId);
    await this.processKPayStatus(payment, kpayStatus);

    const updated = await this.prisma.payment.findUnique({ where: { id: payment.id } });

    return {
      result: true,
      data: this.formatPaymentResponse(updated!),
    };
  }

  // ==================== WEBHOOK GFS ====================

  async handleGfsWebhook(event: any, rawBody: Buffer, signature: string) {
    if (!this.gfs.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('[GFS Webhook] Signature invalide');
      throw new BadRequestException('Signature webhook GFS invalide');
    }

    this.logger.log(`[GFS Webhook] Evenement: ${event.event} — ${event.paymentRef}`);

    const payments = await this.prisma.payment.findMany({
      where: { providerRef: event.paymentRef },
    });

    if (payments.length === 0) {
      this.logger.warn(`[GFS Webhook] Aucun paiement pour ref: ${event.paymentRef}`);
      return { received: true };
    }

    for (const payment of payments) {
      if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.FAILED) continue;

      if (event.status === 'COMPLETED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: event.paidAt ? new Date(event.paidAt) : new Date(),
            transactionId: event.transactionId,
            webhookReceived: true,
          },
        });
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.PAID, status: 'CONFIRMED' },
        });
        this.logger.log(`[GFS Webhook] Paiement COMPLETE: ${payment.id}`);
        this.notifyPaymentCompleted(payment.orderId, payment.amount).catch(() => {});

        const gfsOrder = await this.prisma.order.findUnique({ where: { id: payment.orderId }, select: { userId: true } });
        if (gfsOrder?.userId) {
          this.coupons.generateLoyaltyCoupon(gfsOrder.userId).catch((err) => {
            this.logger.warn(`[Loyalty] Erreur generation coupon: ${err.message}`);
          });
        }
      } else if (event.status === 'FAILED' || event.status === 'EXPIRED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: event.status,
            webhookReceived: true,
          },
        });
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
        this.logger.warn(`[GFS Webhook] Paiement ECHEC: ${payment.id}`);
      }
    }

    return { received: true };
  }

  // ==================== POLLING DES TRANSACTIONS PENDING ====================

  /**
   * Appelee par un cron: verifie les paiements KPay PENDING de moins de 24h
   */
  async pollPendingPayments() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        kpayId: { not: null },
        createdAt: { gte: cutoff },
      },
    });

    if (pendingPayments.length === 0) return { checked: 0 };

    this.logger.log(`[Poll] ${pendingPayments.length} paiement(s) PENDING a verifier`);

    let updated = 0;
    for (const payment of pendingPayments) {
      try {
        const kpayStatus = await this.kpay.getPaymentStatus(payment.kpayId!);
        const changed = await this.processKPayStatus(payment, kpayStatus);
        if (changed) updated++;
      } catch (err: any) {
        this.logger.warn(`[Poll] Erreur ${payment.id}: ${err.message}`);
      }
    }

    this.logger.log(`[Poll] ${updated}/${pendingPayments.length} mis a jour`);
    return { checked: pendingPayments.length, updated };
  }

  /**
   * Expire les paiements PENDING de plus de 24h
   */
  async expireOldPayments() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expired = await this.prisma.payment.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        kpayId: { not: null },
        createdAt: { lt: cutoff },
      },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: 'Expire: pas de confirmation dans les 24h',
      },
    });

    if (expired.count > 0) {
      this.logger.log(`[Expire] ${expired.count} paiement(s) expire(s)`);
    }

    return { expired: expired.count };
  }

  // ==================== INTERNAL ====================

  /**
   * Met a jour le statut du paiement et des commandes en fonction de la reponse KPay
   */
  private async processKPayStatus(payment: any, kpayStatus: any): Promise<boolean> {
    const status = kpayStatus.status;

    // Statuts non terminaux — on attend
    if (!status || status === 'PENDING' || status === 'PROCESSING' || status === 'SUBMITTED') {
      return false;
    }

    // Deja traite
    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.FAILED) {
      return false;
    }

    if (status === 'COMPLETED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: kpayStatus.completedAt ? new Date(kpayStatus.completedAt) : new Date(),
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.PAID, status: 'CONFIRMED' },
      });

      this.logger.log(`[KPay] Paiement COMPLETE: ${payment.id}`);

      // Notifier le vendeur et les admins
      this.notifyPaymentCompleted(payment.orderId, payment.amount).catch(() => {});

      // Generer un coupon fidelite si applicable
      const order = await this.prisma.order.findUnique({ where: { id: payment.orderId }, select: { userId: true } });
      if (order?.userId) {
        this.coupons.generateLoyaltyCoupon(order.userId).catch((err) => {
          this.logger.warn(`[Loyalty] Erreur generation coupon: ${err.message}`);
        });
      }

      return true;
    }

    if (status === 'FAILED' || status === 'CANCELLED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: kpayStatus.failureReason || status,
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });

      this.logger.warn(`[KPay] Paiement ECHEC: ${payment.id} — ${kpayStatus.failureReason || status}`);
      return true;
    }

    return false;
  }

  /**
   * Notifie le vendeur et les admins pour une nouvelle commande COD
   */
  private async notifyNewOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        sellerId: true,
        total: true,
        buyer: { select: { firstName: true, lastName: true } },
      },
    });
    if (!order) return;

    const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`;
    const formattedAmount = new Intl.NumberFormat('fr-FR').format(order.total) + ' FCFA';

    if (order.sellerId) {
      await this.notifications.create(
        order.sellerId,
        'Nouvelle commande (paiement a la livraison)',
        `${buyerName} a commande pour ${formattedAmount} — ${order.orderNumber}. Paiement a la livraison.`,
        NotificationType.ORDER,
        { orderId, orderNumber: order.orderNumber },
      );
    }

    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await this.notifications.create(
        admin.id,
        'Nouvelle commande COD',
        `Commande ${order.orderNumber} — ${formattedAmount} par ${buyerName} (paiement a la livraison).`,
        NotificationType.ORDER,
        { orderId, orderNumber: order.orderNumber },
      );
    }
  }

  /**
   * Notifie le vendeur et les admins quand un paiement est confirme
   */
  private async notifyPaymentCompleted(orderId: string, amount: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        sellerId: true,
        userId: true,
        total: true,
        buyer: { select: { firstName: true, lastName: true } },
      },
    });

    if (!order) return;

    const orderNum = order.orderNumber;
    const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`;
    const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount || order.total) + ' FCFA';

    // 1. Notifier le vendeur
    if (order.sellerId) {
      await this.notifications.create(
        order.sellerId,
        'Nouvelle commande payee',
        `${buyerName} a paye ${formattedAmount} pour la commande ${orderNum}. Preparez la commande.`,
        NotificationType.ORDER,
        { orderId, orderNumber: orderNum },
      );
    }

    // 2. Notifier l'acheteur
    if (order.userId) {
      await this.notifications.create(
        order.userId,
        'Paiement confirme',
        `Votre paiement de ${formattedAmount} pour la commande ${orderNum} a ete confirme.`,
        NotificationType.ORDER,
        { orderId, orderNumber: orderNum },
      );
    }

    // 3. Notifier les admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notifications.create(
        admin.id,
        'Paiement recu',
        `Commande ${orderNum} — ${formattedAmount} paye par ${buyerName}.`,
        NotificationType.ORDER,
        { orderId, orderNumber: orderNum },
      );
    }

    this.logger.log(`[Notify] Notifications envoyees pour commande ${orderNum}`);

    // 4. Creer automatiquement la livraison Merci E
    this.requestMerciEDelivery(orderId).catch((err) => {
      this.logger.warn(`[MerciE] Echec creation livraison auto pour ${orderNum}: ${err.message}`);
    });
  }

  /**
   * Cree automatiquement une demande de livraison Merci E apres paiement
   */
  private async requestMerciEDelivery(orderId: string): Promise<void> {
    if (!(await this.merciE.isConfigured())) {
      this.logger.log('[MerciE] Non configure — livraison manuelle requise');
      return;
    }

    const order: any = await (this.prisma.order as any).findUnique({
      where: { id: orderId },
      include: {
        address: true,
        buyer: { select: { firstName: true, lastName: true, phone: true } },
        seller: {
          select: {
            firstName: true, lastName: true, phone: true,
            shop: { select: { name: true, address: true, city: true, latitude: true, longitude: true } },
          },
        },
        details: { include: { product: { select: { name: true } } }, take: 3 },
      },
    });

    if (!order || !order.address) {
      this.logger.warn(`[MerciE] Commande ${orderId} sans adresse — pas de livraison auto`);
      return;
    }

    const shop = order.seller.shop;

    // Verifier que le client et la boutique sont dans la meme ville
    const shopCity = (shop?.city || '').trim().toLowerCase();
    const clientCity = (order.address.city || '').trim().toLowerCase();

    if (!shopCity || !clientCity) {
      this.logger.warn(`[MerciE] Ville manquante (boutique: "${shopCity}", client: "${clientCity}") — livraison manuelle requise`);
      return;
    }

    if (shopCity !== clientCity) {
      this.logger.log(`[MerciE] Villes differentes (boutique: "${shopCity}", client: "${clientCity}") — livraison inter-ville, Merci E non applicable`);
      return;
    }

    // Coordonnees GPS de la boutique (fallback par ville)
    const pickupLat = shop?.latitude || this.getCityDefaultLat(shopCity);
    const pickupLng = shop?.longitude || this.getCityDefaultLng(shopCity);
    const dropLat = order.address.latitude || this.getCityDefaultLat(clientCity);
    const dropLng = order.address.longitude || this.getCityDefaultLng(clientCity);

    const productNames = (order.details || []).map((i: any) => i.product?.name || i.name).join(', ');
    const packageDesc = productNames.length > 100 ? productNames.slice(0, 97) + '...' : productNames;

    const result = await this.merciE.createDeliveryRequest({
      pickupAddress: shop?.address || shop?.name || 'Boutique vendeur',
      pickupLat,
      pickupLng,
      pickupContactName: `${order.seller.firstName} ${order.seller.lastName}`,
      pickupContactPhone: order.seller.phone || '',
      dropAddress: order.address.address,
      dropLat,
      dropLng,
      dropContactName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      dropContactPhone: order.buyer.phone || '',
      packageDescription: packageDesc || `Commande ${order.orderNumber}`,
      orderId: order.id,
    });

    // Mettre a jour la commande
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
      },
    });

    this.logger.log(`[MerciE] Livraison creee pour commande ${order.orderNumber} (ville: ${clientCity}) — requestId: ${result.requestId}`);
  }

  /**
   * Coordonnees GPS par defaut pour les grandes villes du Cameroun
   */
  private getCityDefaultLat(city: string): number {
    const coords: Record<string, number> = {
      douala: 4.0511,
      yaounde: 3.8480,
      bafoussam: 5.4764,
      bamenda: 5.9527,
      garoua: 9.3014,
      maroua: 10.5956,
      bertoua: 4.5772,
      ngaoundere: 7.3167,
      ebolowa: 2.9000,
      kribi: 2.9400,
      limbe: 4.0242,
      buea: 4.1560,
    };
    return coords[city] || 4.0511;
  }

  private getCityDefaultLng(city: string): number {
    const coords: Record<string, number> = {
      douala: 9.7679,
      yaounde: 11.5021,
      bafoussam: 10.4217,
      bamenda: 10.1460,
      garoua: 13.3984,
      maroua: 14.3246,
      bertoua: 13.6846,
      ngaoundere: 13.5833,
      ebolowa: 11.1500,
      kribi: 9.9100,
      limbe: 9.2149,
      buea: 9.2413,
    };
    return coords[city] || 9.7679;
  }

  private formatPaymentResponse(payment: any) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      phoneNumber: payment.phoneNumber,
      kpayId: payment.kpayId,
      reference: payment.providerRef,
      gatewayUrl: payment.gatewayUrl,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt,
    };
  }

  // ==================== HISTORIQUE VENDEUR ====================

  async getSellerPayments(sellerId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { order: { sellerId } },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { orderNumber: true, total: true, buyer: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.payment.count({ where: { order: { sellerId } } }),
    ]);

    return {
      result: true,
      data: payments,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  // ==================== ADMIN STATS ====================

  async getPaymentStats() {
    const [total, paid, failed, byMethod] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      result: true,
      data: {
        totalPayments: total,
        paidCount: paid._count.id,
        paidVolume: paid._sum.amount || 0,
        failedCount: failed,
        byMethod: byMethod.map((m) => ({
          method: m.method,
          count: m._count.id,
          volume: m._sum.amount || 0,
        })),
      },
    };
  }
}
