import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MerciEService } from './merci-e.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CreateDeliveryRequestDto, EstimateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger('DeliveryService');

  constructor(
    private prisma: PrismaService,
    private merciE: MerciEService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Estimer le cout de livraison entre vendeur et acheteur
   */
  async estimate(dto: EstimateDeliveryDto) {
    const estimate = await this.merciE.estimate({
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropLat: dto.dropLat,
      dropLng: dto.dropLng,
    });

    return { result: true, data: estimate };
  }

  /**
   * Creer une demande de livraison pour une commande (SELLER)
   */
  async createDelivery(sellerId: string, dto: CreateDeliveryRequestDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        address: true,
        buyer: { select: { firstName: true, lastName: true, phone: true } },
        seller: {
          select: {
            firstName: true, lastName: true, phone: true,
            shop: { select: { name: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Acces refuse');
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      throw new BadRequestException('Commande ne peut pas etre livree');
    }

    // Adresse de livraison
    const dropAddress = order.address;
    if (!dropAddress) {
      throw new BadRequestException('Adresse de livraison manquante');
    }

    // Pour l'instant on utilise des coordonnees par defaut pour le pickup
    // (a ameliorer quand les boutiques auront des coordonnees GPS)
    const result = await this.merciE.createDeliveryRequest({
      pickupAddress: order.seller.shop?.name || 'Boutique vendeur',
      pickupLat: 4.0511,  // Douala centre par defaut
      pickupLng: 9.7679,
      pickupContactName: `${order.seller.firstName} ${order.seller.lastName}`,
      pickupContactPhone: order.seller.phone || '',
      dropAddress: dropAddress.address,
      dropLat: dropAddress.latitude || 4.0511,
      dropLng: dropAddress.longitude || 9.7679,
      dropContactName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      dropContactPhone: order.buyer.phone || '',
      packageDescription: `Commande ${order.orderNumber}`,
      orderId: order.id,
    });

    // Mettre a jour la commande avec l'ID de livraison Merci E
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
    });

    return {
      result: true,
      message: 'Livraison demandee via Merci E',
      data: {
        orderId: order.id,
        deliveryRequestId: result.requestId,
        status: result.status,
        estimatedTime: result.estimatedTime,
      },
    };
  }

  /**
   * Suivre une livraison (status depuis Merci E)
   */
  async trackDelivery(requestId: string) {
    const status = await this.merciE.getDeliveryStatus(requestId);
    return { result: true, data: status };
  }

  /**
   * Annuler une livraison
   */
  async cancelDelivery(sellerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Acces refuse');

    // TODO: recuperer le requestId Merci E depuis les metadata de la commande
    // Pour l'instant on marque juste la commande
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    return { result: true, message: 'Livraison annulee' };
  }

  // ==================== WEBHOOK MERCI E ====================

  /**
   * Traite les callbacks de Merci E quand le statut de livraison change.
   * Evenements: driver_assigned, picked_up, in_transit, delivered, cancelled
   */
  async handleWebhook(event: {
    request_id: string;
    status: string;
    driver_name?: string;
    driver_phone?: string;
    driver_photo?: string;
    vehicle_number?: string;
    order_id?: string;
  }) {
    this.logger.log(`[MerciE Webhook] Evenement: ${event.status} — request: ${event.request_id}`);

    // Trouver la commande liée
    const order: any = await (this.prisma.order as any).findFirst({
      where: {
        OR: [
          { id: event.order_id || '' },
          { note: { contains: event.request_id } },
        ],
      },
      include: {
        buyer: { select: { firstName: true, lastName: true } },
        seller: { select: { firstName: true, lastName: true, shop: { select: { name: true } } } },
      },
    });

    if (!order) {
      this.logger.warn(`[MerciE Webhook] Commande introuvable pour request: ${event.request_id}`);
      return { received: true };
    }

    const orderNum = order.orderNumber;
    const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`;
    const shopName = order.seller.shop?.name || 'la boutique';
    const driverInfo = event.driver_name ? `${event.driver_name} (${event.driver_phone || ''})` : 'Un livreur';

    switch (event.status) {
      case 'driver_assigned':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        });

        // Notifier le vendeur : un livreur arrive
        await this.notifications.create(
          order.sellerId,
          'Livreur assigne',
          `${driverInfo} va recuperer la commande ${orderNum}. Preparez le colis.`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum, driverName: event.driver_name || '' },
        );

        // Notifier le client
        await this.notifications.create(
          order.userId,
          'Livreur en route vers la boutique',
          `Un livreur Merci E va recuperer votre commande ${orderNum} chez ${shopName}.`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );
        break;

      case 'picked_up':
      case 'in_transit':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'SHIPPED', shippedAt: new Date() },
        });

        // Notifier le vendeur
        await this.notifications.create(
          order.sellerId,
          'Colis recupere',
          `Le livreur a recupere la commande ${orderNum}. En route vers ${buyerName}.`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );

        // Notifier le client
        await this.notifications.create(
          order.userId,
          'Votre colis est en route',
          `Votre commande ${orderNum} a ete recuperee et est en route vers vous.`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );

        // Notifier les admins
        await this.notifyAdmins(
          'Colis en livraison',
          `Commande ${orderNum} recuperee par le livreur — en route vers ${buyerName}.`,
          order.id, orderNum,
        );
        break;

      case 'delivered':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'DELIVERED', deliveredAt: new Date() },
        });

        // Notifier le vendeur
        await this.notifications.create(
          order.sellerId,
          'Commande livree',
          `La commande ${orderNum} a ete livree a ${buyerName}. Merci !`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );

        // Notifier le client
        await this.notifications.create(
          order.userId,
          'Commande livree',
          `Votre commande ${orderNum} a ete livree. Merci pour votre achat sur EstuaireAchats !`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );

        // Notifier les admins
        await this.notifyAdmins(
          'Commande livree',
          `Commande ${orderNum} livree a ${buyerName}.`,
          order.id, orderNum,
        );
        break;

      case 'cancelled':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });

        // Notifier le vendeur
        await this.notifications.create(
          order.sellerId,
          'Livraison annulee',
          `La livraison de la commande ${orderNum} a ete annulee. Veuillez relancer une livraison.`,
          NotificationType.DELIVERY,
          { orderId: order.id, orderNumber: orderNum },
        );

        // Notifier les admins
        await this.notifyAdmins(
          'Livraison annulee',
          `Livraison annulee pour commande ${orderNum}.`,
          order.id, orderNum,
        );
        break;

      default:
        this.logger.log(`[MerciE Webhook] Statut non gere: ${event.status}`);
    }

    return { received: true };
  }

  private async notifyAdmins(title: string, body: string, orderId: string, orderNumber: string) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await this.notifications.create(
        admin.id, title, body,
        NotificationType.DELIVERY,
        { orderId, orderNumber },
      );
    }
  }

  // ─── DELIVERY BOYS CRUD ──────────────────────────────────────────

  /**
   * Liste des livreurs (delivery boys)
   */
  async findAllDeliveryBoys(page = 1, perPage = 20, search?: string) {
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [boys, total] = await Promise.all([
      this.prisma.deliveryBoy.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              status: true,
              avatar: true,
              createdAt: true,
            },
          },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.deliveryBoy.count({ where }),
    ]);

    // Also count in-progress orders per delivery boy
    const data = await Promise.all(
      boys.map(async (b) => {
        const activeOrders = await this.prisma.order.count({
          where: {
            deliveryBoyId: b.id,
            status: { in: ['PROCESSING', 'SHIPPED'] },
          },
        });
        return {
          id: b.id,
          userId: b.userId,
          nom: b.user.lastName,
          prenom: b.user.firstName,
          telephone: b.user.phone || '',
          email: b.user.email || '',
          statut: b.user.status,
          avatar: b.user.avatar,
          earning: b.earning,
          livraisonsTotal: b._count.orders,
          livraisonsEnCours: activeOrders,
          dateInscription: b.user.createdAt.toISOString(),
        };
      }),
    );

    return {
      result: true,
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Creer un livreur (cree un User + DeliveryBoy)
   */
  async createDeliveryBoy(dto: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password?: string;
  }) {
    // Check if email/phone already exists
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Cet email est deja utilise');
    }
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new BadRequestException('Ce telephone est deja utilise');
    }

    // Hash password (simple for now, should use bcrypt in auth service)
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(dto.password || 'delivery123', 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email || null,
        phone: dto.phone || null,
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        deliveryBoy: {
          create: { earning: 0 },
        },
      },
      include: {
        deliveryBoy: true,
      },
    });

    return {
      result: true,
      data: {
        id: user.deliveryBoy!.id,
        userId: user.id,
        nom: user.lastName,
        prenom: user.firstName,
        telephone: user.phone || '',
        email: user.email || '',
        statut: user.status,
        earning: 0,
        livraisonsTotal: 0,
        livraisonsEnCours: 0,
        dateInscription: user.createdAt.toISOString(),
      },
    };
  }

  /**
   * Modifier un livreur
   */
  async updateDeliveryBoy(deliveryBoyId: string, dto: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
  }) {
    const boy = await this.prisma.deliveryBoy.findUnique({
      where: { id: deliveryBoyId },
      include: { user: true },
    });
    if (!boy) throw new NotFoundException('Livreur introuvable');

    const updatedUser = await this.prisma.user.update({
      where: { id: boy.userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
    });

    return {
      result: true,
      data: {
        id: boy.id,
        userId: updatedUser.id,
        nom: updatedUser.lastName,
        prenom: updatedUser.firstName,
        telephone: updatedUser.phone || '',
        email: updatedUser.email || '',
        statut: updatedUser.status,
      },
    };
  }

  /**
   * Supprimer un livreur
   */
  async removeDeliveryBoy(deliveryBoyId: string) {
    const boy = await this.prisma.deliveryBoy.findUnique({
      where: { id: deliveryBoyId },
    });
    if (!boy) throw new NotFoundException('Livreur introuvable');

    // Remove the DeliveryBoy record (keep the User but remove delivery boy association)
    await this.prisma.deliveryBoy.delete({ where: { id: deliveryBoyId } });

    return { result: true, data: { message: 'Livreur supprime' } };
  }

  /**
   * Toggle actif/inactif un livreur
   */
  async toggleDeliveryBoyStatus(deliveryBoyId: string) {
    const boy = await this.prisma.deliveryBoy.findUnique({
      where: { id: deliveryBoyId },
      include: { user: true },
    });
    if (!boy) throw new NotFoundException('Livreur introuvable');

    const newStatus = boy.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.prisma.user.update({
      where: { id: boy.userId },
      data: { status: newStatus as any },
    });

    return { result: true, data: { id: boy.id, status: newStatus } };
  }
}
