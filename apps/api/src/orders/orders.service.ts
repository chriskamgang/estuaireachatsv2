import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateDeliveryStatusDto, UpdatePaymentStatusDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creer une commande depuis le panier de l'utilisateur.
   * - Recupere les items du panier
   * - Cree un CombinedOrder
   * - Regroupe les items par sellerId (ownerId)
   * - Pour chaque seller : cree Order + OrderDetails
   * - Reduit le stock (ProductStock.qty)
   * - Vide le panier
   */
  async createFromCart(userId: string, dto: CreateOrderDto) {
    console.log('[createFromCart] userId:', userId, 'dto:', JSON.stringify(dto));
    try {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, shopId: true, images: { where: { isMain: true }, take: 1 } },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Le panier est vide');
    }

    // Grouper par seller (ownerId)
    const groupedBySeller = new Map<string, typeof cartItems>();
    for (const item of cartItems) {
      const sellerId = item.ownerId;
      if (!groupedBySeller.has(sellerId)) {
        groupedBySeller.set(sellerId, []);
      }
      groupedBySeller.get(sellerId)!.push(item);
    }

    // Construire shippingAddress
    let shippingAddress: any = null;
    let validAddressId: string | null = null;
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (address) {
        shippingAddress = address;
        validAddressId = address.id;
      }
    }

    // Transaction atomique
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Creer CombinedOrder
      const combinedOrder = await tx.combinedOrder.create({
        data: {
          userId,
          shippingAddress,
        },
      });

      const orderIds: string[] = [];
      let firstOrderNumber = '';

      // 2. Pour chaque seller, creer un Order
      for (const [sellerId, items] of groupedBySeller) {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const totalTax = items.reduce((sum, i) => sum + i.tax * i.quantity, 0);
        const totalShipping = items.reduce((sum, i) => sum + i.shippingCost, 0);
        const totalDiscount = items.reduce((sum, i) => sum + i.discount * i.quantity, 0);
        const total = subtotal + totalTax + totalShipping - totalDiscount;

        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const order = await tx.order.create({
          data: {
            combinedOrderId: combinedOrder.id,
            orderNumber,
            userId,
            sellerId,
            addressId: validAddressId,
            shippingType: (dto.shippingType as any) || 'HOME_DELIVERY',
            pickupPointId: dto.pickupPointId || null,
            paymentMethod: (dto.paymentMethod as any) || null,
            note: dto.note || null,
            subtotal,
            tax: totalTax,
            shippingFee: totalShipping,
            discount: totalDiscount,
            total,
          },
        });

        orderIds.push(order.id);
        if (!firstOrderNumber) firstOrderNumber = orderNumber;

        // 3. Creer OrderDetails
        for (const item of items) {
          const mainImage = item.product.images[0]?.url || null;

          await tx.orderDetail.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              sellerId,
              name: item.product.name,
              image: mainImage,
              price: item.price,
              quantity: item.quantity,
              tax: item.tax,
              variation: item.variation,
              shippingType: item.shippingType,
              shippingCost: item.shippingCost,
              total: item.price * item.quantity,
            },
          });

          // 4. Reduire le stock
          if (item.variation) {
            await tx.productStock.updateMany({
              where: {
                productId: item.productId,
                variant: item.variation,
              },
              data: {
                qty: { decrement: item.quantity },
              },
            });
          } else {
            // Reduire le premier stock disponible
            const stock = await tx.productStock.findFirst({
              where: { productId: item.productId, qty: { gt: 0 } },
            });
            if (stock) {
              await tx.productStock.update({
                where: { id: stock.id },
                data: { qty: { decrement: item.quantity } },
              });
            }
          }
        }
      }

      // 5. Vider le panier
      await tx.cartItem.deleteMany({ where: { userId } });

      return { combinedOrderId: combinedOrder.id, orderIds, orderNumber: firstOrderNumber };
    });

    return {
      result: true,
      message: 'Commande creee avec succes',
      data: result,
    };
    } catch (error) {
      console.error('[createFromCart] ERROR:', error);
      throw error;
    }
  }

  /**
   * Historique commandes acheteur (pagine)
   */
  async findBuyerOrders(userId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          details: {
            select: { id: true, name: true, image: true, price: true, quantity: true, variation: true, total: true },
          },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      result: true,
      data: orders,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Detail d'une commande (acheteur)
   */
  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: { product: { select: { id: true, slug: true, images: { where: { isMain: true }, take: 1 } } } },
        },
        address: true,
        seller: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        combinedOrder: true,
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Acces refuse');
    }

    return { result: true, data: order };
  }

  /**
   * Annuler une commande si PENDING
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId) throw new ForbiddenException('Acces refuse');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Seules les commandes en attente peuvent etre annulees');
    }

    // Restaurer les stocks
    const details = await this.prisma.orderDetail.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      for (const detail of details) {
        if (detail.variation) {
          await tx.productStock.updateMany({
            where: { productId: detail.productId, variant: detail.variation },
            data: { qty: { increment: detail.quantity } },
          });
        } else {
          const stock = await tx.productStock.findFirst({
            where: { productId: detail.productId },
          });
          if (stock) {
            await tx.productStock.update({
              where: { id: stock.id },
              data: { qty: { increment: detail.quantity } },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
    });

    return { result: true, message: 'Commande annulee' };
  }

  /**
   * Admin: toutes les commandes (pagine + filtres)
   */
  async findAllAdmin(page: number, perPage: number, status?: string, paymentStatus?: string) {
    const skip = (page - 1) * perPage;
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          details: {
            select: { id: true, name: true, image: true, price: true, quantity: true, total: true },
          },
          buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      result: true,
      data: orders,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Admin: detail d'une commande
   */
  async findOneAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: { product: { select: { id: true, slug: true, images: { where: { isMain: true }, take: 1 } } } },
        },
        address: true,
        buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        seller: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        combinedOrder: true,
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    return { result: true, data: order };
  }

  /**
   * Admin: changer le statut d'une commande
   */
  async updateStatusAdmin(orderId: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const statusMap: Record<string, any> = {
      PENDING: { status: 'PENDING' as const },
      PICKED_UP: { status: 'PROCESSING' as const },
      ON_THE_WAY: { status: 'SHIPPED' as const, shippedAt: new Date() },
      DELIVERED: { status: 'DELIVERED' as const, deliveredAt: new Date() },
      CANCELLED: { status: 'CANCELLED' as const, cancelledAt: new Date() },
    };

    const updateData = statusMap[dto.deliveryStatus];
    if (!updateData) throw new BadRequestException('Statut invalide');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return { result: true, data: updated };
  }

  /**
   * Commandes recues par le vendeur (pagine)
   */
  async findSellerOrders(sellerId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          details: {
            select: { id: true, name: true, image: true, price: true, quantity: true, variation: true, total: true },
          },
          buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          address: true,
        },
      }),
      this.prisma.order.count({ where: { sellerId } }),
    ]);

    return {
      result: true,
      data: orders,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Seller met a jour le delivery_status (via Order.status pour les etapes de livraison)
   */
  async updateDeliveryStatus(orderId: string, sellerId: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Acces refuse');

    const statusMap: Record<string, any> = {
      PENDING: { status: 'PENDING' as const },
      PICKED_UP: { status: 'PROCESSING' as const },
      ON_THE_WAY: { status: 'SHIPPED' as const, shippedAt: new Date() },
      DELIVERED: { status: 'DELIVERED' as const, deliveredAt: new Date() },
      CANCELLED: { status: 'CANCELLED' as const, cancelledAt: new Date() },
    };

    const updateData = statusMap[dto.deliveryStatus];
    if (!updateData) throw new BadRequestException('Statut de livraison invalide');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return { result: true, data: updated };
  }

  /**
   * Seller met a jour le payment_status
   */
  async updatePaymentStatus(orderId: string, sellerId: string, dto: UpdatePaymentStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Acces refuse');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: dto.paymentStatus as any },
    });

    return { result: true, data: updated };
  }

  // ─── REPORTS / ANALYTICS ──────────────────────────────────────────

  /**
   * Rapports admin : top produits, top vendeurs, revenus mensuels, commandes par statut
   */
  async getReports(dateFrom?: string, dateTo?: string) {
    const whereDate: any = {};
    if (dateFrom || dateTo) {
      whereDate.createdAt = {};
      if (dateFrom) whereDate.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereDate.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [
      topProducts,
      topSellers,
      monthlyRevenue,
      ordersByStatus,
      totalRevenue,
      totalOrders,
    ] = await Promise.all([
      // Top 10 produits les plus vendus
      this.prisma.orderDetail.groupBy({
        by: ['productId', 'name'],
        where: { order: whereDate },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      // Top 5 vendeurs (le plus de commandes)
      this.prisma.order.groupBy({
        by: ['sellerId'],
        where: whereDate,
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      // Revenus mensuels (12 derniers mois)
      this.prisma.$queryRawUnsafe<Array<{ mois: string; montant: number }>>(
        `SELECT TO_CHAR(o."createdAt", 'YYYY-MM') as mois, COALESCE(SUM(o.total), 0)::float as montant
         FROM orders o
         WHERE o."createdAt" >= NOW() - INTERVAL '12 months'
         ${dateFrom ? `AND o."createdAt" >= '${dateFrom}'::timestamp` : ''}
         ${dateTo ? `AND o."createdAt" <= '${dateTo}T23:59:59.999Z'::timestamp` : ''}
         GROUP BY TO_CHAR(o."createdAt", 'YYYY-MM')
         ORDER BY mois ASC`,
      ),
      // Commandes par statut
      this.prisma.order.groupBy({
        by: ['status'],
        where: whereDate,
        _count: { id: true },
      }),
      // Total revenus
      this.prisma.order.aggregate({
        where: { ...whereDate, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      // Total commandes
      this.prisma.order.count({ where: whereDate }),
    ]);

    // Enrichir les top vendeurs avec le nom de la boutique
    const sellerIds = topSellers.map((s) => s.sellerId);
    const sellers = await this.prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, firstName: true, lastName: true, shop: { select: { name: true } } },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    const statusColorMap: Record<string, string> = {
      DELIVERED: '#00A06A',
      SHIPPED: '#3390f3',
      PROCESSING: '#3390f3',
      CONFIRMED: '#3390f3',
      PENDING: '#F5A623',
      CANCELLED: '#E82328',
      REFUNDED: '#8B5CF6',
    };

    const avgBasket = totalOrders > 0
      ? (totalRevenue._sum.total || 0) / totalOrders
      : 0;

    return {
      result: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        avgBasket,
        topProduits: topProducts.map((p) => ({
          nom: p.name,
          ventes: p._sum.quantity || 0,
          montant: p._sum.total || 0,
        })),
        topVendeurs: topSellers.map((s) => {
          const seller = sellerMap.get(s.sellerId);
          return {
            nom: seller?.shop?.name || `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() || 'Vendeur',
            commandes: s._count.id,
            revenus: s._sum.total || 0,
          };
        }),
        revenusMensuels: monthlyRevenue.map((r) => {
          const [year, month] = r.mois.split('-');
          const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
          return {
            mois: monthNames[parseInt(month, 10) - 1] || month,
            montant: r.montant,
          };
        }),
        commandesParStatut: ordersByStatus.map((s) => ({
          statut: s.status,
          count: s._count.id,
          color: statusColorMap[s.status] || '#999',
        })),
      },
    };
  }

  // ─── SELLER COMMISSIONS ─────────────────────────────────────────

  async getSellerCommissions(sellerId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    // Commission rate (default 10%)
    const commissionRate = 10;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId, paymentStatus: 'PAID' },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where: { sellerId, paymentStatus: 'PAID' } }),
    ]);

    const data = orders.map((o) => ({
      id: o.id,
      commande: o.orderNumber,
      montantVente: o.total,
      tauxCommission: commissionRate,
      commission: Math.round(o.total * commissionRate / 100),
      date: o.createdAt,
    }));

    return {
      result: true,
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }
}
