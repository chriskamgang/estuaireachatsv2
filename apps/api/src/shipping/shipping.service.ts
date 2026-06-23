import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MerciEService } from './merci-e.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { EstimateShippingDto } from './dto/estimate-shipping.dto';
import {
  ShippingEstimate,
  TrackingInfo,
  TrackingEvent,
  ShippingAddress,
} from './interfaces/shipping.interfaces';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private prisma: PrismaService,
    private merciE: MerciEService,
  ) {}

  // ─── ENDPOINTS EXISTANTS (carriers, pickup points, calculate) ────

  async getCarriers() {
    const carriers = await this.prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return { result: true, data: carriers };
  }

  async getPickupPoints() {
    const points = await this.prisma.pickupPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return { result: true, data: points };
  }

  async calculate(userId: string, dto: CalculateShippingDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvee');
    }

    // Recuperer les produits
    const productIds = dto.cartItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        estShippingDays: true,
        shop: { select: { id: true, city: true } },
      },
    });

    // Recuperer les transporteurs actifs
    const carriers = await this.prisma.carrier.findMany({
      where: { isActive: true },
    });

    // Calculer les frais par article
    const shippingDetails = dto.cartItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        // Logique simple: baseCost * quantite si costMultiplyQty
        const carrierOptions = carriers.map((carrier) => {
          const cost = carrier.costMultiplyQty
            ? carrier.baseCost * item.quantity
            : carrier.baseCost;

          return {
            carrierId: carrier.id,
            carrierName: carrier.name,
            cost,
          };
        });

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          estShippingDays: product.estShippingDays,
          carriers: carrierOptions,
        };
      })
      .filter(Boolean);

    // Total minimum
    const totalShipping = shippingDetails.reduce((sum, detail) => {
      const minCost = detail!.carriers.reduce(
        (min, c) => Math.min(min, c.cost),
        Infinity,
      );
      return sum + (minCost === Infinity ? 0 : minCost);
    }, 0);

    return {
      result: true,
      data: {
        address: {
          id: address.id,
          city: address.city,
          region: address.region,
        },
        items: shippingDetails,
        totalShipping,
      },
    };
  }

  // ─── MERCI E : ESTIMATION ─────────────────────────────────────

  /**
   * Estimer les frais de livraison via Merci E (coordonnees GPS)
   */
  async estimateShipping(dto: EstimateShippingDto): Promise<{ result: boolean; data: ShippingEstimate }> {
    // Si orderId fourni, recuperer les coordonnees du shop (pickup)
    let pickLat = dto.pickLat;
    let pickLng = dto.pickLng;

    if (dto.orderId && (!pickLat || !pickLng)) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        include: {
          seller: {
            include: { shop: true },
          },
          address: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }

      // Utiliser l'adresse du shop comme point de pickup
      // Note: Le shop n'a pas de lat/lng dans le schema actuel,
      // on utilise les coordonnees fournies dans le DTO
      if (!pickLat || !pickLng) {
        throw new BadRequestException(
          'Coordonnees de pickup (pickLat, pickLng) requises',
        );
      }
    }

    const estimate = await this.merciE.calculateShippingFee({
      pickLat,
      pickLng,
      dropLat: dto.dropLat,
      dropLng: dto.dropLng,
      packageType: dto.packageType,
    });

    return { result: true, data: estimate };
  }

  // ─── MERCI E : DISPATCH (declencher livraison) ────────────────

  /**
   * Declencher la livraison apres paiement d'une commande.
   * - Produit local : cree directement la livraison Merci E
   * - Produit international : marque comme "en transit international"
   */
  async dispatchOrder(orderId: string): Promise<{ result: boolean; message: string; data?: any }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: {
            product: {
              select: { id: true, origin: true, shop: { select: { address: true, city: true, phone: true, name: true, user: { select: { firstName: true, lastName: true, phone: true } } } } },
            },
          },
        },
        address: true,
        buyer: { select: { firstName: true, lastName: true, phone: true } },
        seller: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            shop: { select: { address: true, city: true, phone: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException('La commande doit etre payee avant expedition');
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Impossible d'expedier une commande au statut ${order.status}`,
      );
    }

    // Verifier si c'est un produit international (origine hors CM)
    const isInternational = order.details.some(
      (d) => d.product.origin && d.product.origin !== 'CM',
    );

    if (isInternational) {
      // Produit international : marquer comme en transit, la livraison Merci E
      // sera creee quand le colis arrive a l'entrepot local
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          note: order.note
            ? `${order.note}\n[Transit international - en attente d'arrivee a l'entrepot]`
            : '[Transit international - en attente d\'arrivee a l\'entrepot]',
        },
      });

      this.logger.log(
        `Commande ${orderId} marquee en transit international`,
      );

      return {
        result: true,
        message:
          'Commande marquee en transit international. La livraison Merci E sera declenchee a l\'arrivee a l\'entrepot.',
      };
    }

    // Produit local : creer la livraison Merci E directement
    const dropAddress = order.address;
    if (!dropAddress) {
      throw new BadRequestException(
        'Adresse de livraison manquante sur la commande',
      );
    }

    if (!dropAddress.latitude || !dropAddress.longitude) {
      throw new BadRequestException(
        'Coordonnees GPS de l\'adresse de livraison manquantes',
      );
    }

    // Recuperer l'adresse du shop (pickup)
    const shop = order.seller?.shop;
    if (!shop || !shop.address) {
      throw new BadRequestException('Adresse de la boutique du vendeur manquante');
    }

    // Note: Le shop n'a pas de lat/lng dans le schema Prisma.
    // On utilise des coordonnees par defaut pour Douala/Yaounde
    // ou les coordonnees devront etre ajoutees au shop plus tard.
    // Pour l'instant, on log un warning.
    this.logger.warn(
      `Shop ${shop.name} n'a pas de coordonnees GPS. Utilisation des coordonnees de l'adresse de livraison comme fallback temporaire.`,
    );

    try {
      const sellerName = `${order.seller.firstName} ${order.seller.lastName}`;
      const sellerPhone = order.seller.phone || shop.phone || '';
      const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`;
      const buyerPhone = order.buyer.phone || dropAddress.phone || '';

      const deliveryRequest = await this.merciE.createDeliveryRequest({
        pickAddress: shop.address,
        pickLat: dropAddress.latitude, // TODO: remplacer par shop.latitude quand disponible
        pickLng: dropAddress.longitude, // TODO: remplacer par shop.longitude quand disponible
        pickPocName: sellerName,
        pickPocMobile: sellerPhone,
        dropAddress: dropAddress.address,
        dropLat: dropAddress.latitude,
        dropLng: dropAddress.longitude,
        dropPocName: buyerName,
        dropPocMobile: buyerPhone,
      });

      // Mettre a jour la commande avec le trackingNumber Merci E
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          trackingNumber: deliveryRequest.requestId,
          note: order.note
            ? `${order.note}\n[Merci E: ${deliveryRequest.requestId}]`
            : `[Merci E: ${deliveryRequest.requestId}]`,
        },
      });

      this.logger.log(
        `Livraison Merci E creee pour commande ${orderId}: ${deliveryRequest.requestId}`,
      );

      return {
        result: true,
        message: 'Livraison Merci E creee avec succes',
        data: {
          merciERequestId: deliveryRequest.requestId,
          trackingUrl: deliveryRequest.trackingUrl,
          estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
          totalFee: deliveryRequest.totalFee,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur creation livraison Merci E pour commande ${orderId}: ${error.message}`,
        error.stack,
      );

      // Mettre quand meme la commande en processing
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          note: order.note
            ? `${order.note}\n[Erreur Merci E: ${error.message}]`
            : `[Erreur Merci E: ${error.message}]`,
        },
      });

      throw error;
    }
  }

  // ─── MERCI E : WEBHOOK (mise a jour statut) ───────────────────

  /**
   * Mettre a jour le statut de livraison suite a un webhook Merci E
   */
  async updateDeliveryStatus(
    requestId: string,
    status: string,
  ): Promise<{ result: boolean; message: string }> {
    this.logger.log(
      `Webhook Merci E: requestId=${requestId}, status=${status}`,
    );

    // Trouver la commande par trackingNumber (= Merci E requestId)
    const order = await this.prisma.order.findFirst({
      where: { trackingNumber: requestId },
    });

    if (!order) {
      this.logger.warn(
        `Webhook Merci E: commande non trouvee pour requestId=${requestId}`,
      );
      return { result: false, message: 'Commande non trouvee' };
    }

    // Mapper les statuts Merci E vers les statuts EstuaireAchats
    const statusMapping: Record<string, { status: any; extra?: any }> = {
      PENDING: { status: 'PROCESSING' },
      ACCEPTED: { status: 'PROCESSING' },
      PICKED_UP: { status: 'SHIPPED', extra: { shippedAt: new Date() } },
      ON_THE_WAY: { status: 'SHIPPED' },
      DELIVERED: { status: 'DELIVERED', extra: { deliveredAt: new Date() } },
      CANCELLED: { status: 'CANCELLED', extra: { cancelledAt: new Date() } },
    };

    const mapping = statusMapping[status.toUpperCase()];
    if (!mapping) {
      this.logger.warn(`Webhook Merci E: statut inconnu '${status}'`);
      return { result: false, message: `Statut inconnu: ${status}` };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: mapping.status,
        ...mapping.extra,
      },
    });

    this.logger.log(
      `Commande ${order.id} mise a jour: ${mapping.status} (Merci E: ${status})`,
    );

    return {
      result: true,
      message: `Statut mis a jour: ${mapping.status}`,
    };
  }

  // ─── MERCI E : TRACKING ───────────────────────────────────────

  /**
   * Recuperer le suivi d'une commande
   */
  async getOrderTracking(orderId: string): Promise<{ result: boolean; data: TrackingInfo }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    // Construire la timeline de base
    const timeline: TrackingEvent[] = [
      {
        status: 'PENDING',
        label: 'Commande creee',
        timestamp: order.createdAt.toISOString(),
        isCompleted: true,
      },
      {
        status: 'PROCESSING',
        label: 'En preparation',
        timestamp: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
          ? order.updatedAt.toISOString()
          : null,
        isCompleted: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
      },
      {
        status: 'SHIPPED',
        label: 'Expedie',
        timestamp: order.shippedAt?.toISOString() || null,
        isCompleted: ['SHIPPED', 'DELIVERED'].includes(order.status),
      },
      {
        status: 'DELIVERED',
        label: 'Livre',
        timestamp: order.deliveredAt?.toISOString() || null,
        isCompleted: order.status === 'DELIVERED',
      },
    ];

    // Si annule, ajouter l'evenement
    if (order.status === 'CANCELLED') {
      timeline.push({
        status: 'CANCELLED',
        label: 'Annule',
        timestamp: order.cancelledAt?.toISOString() || null,
        isCompleted: true,
      });
    }

    const trackingInfo: TrackingInfo = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      deliveryStatus: order.status,
      merciERequestId: order.trackingNumber || undefined,
      timeline,
    };

    // Si on a un requestId Merci E, recuperer le statut en temps reel
    if (order.trackingNumber) {
      try {
        const merciEStatus = await this.merciE.getDeliveryStatus(
          order.trackingNumber,
        );

        trackingInfo.deliveryStatus = merciEStatus.status;
        trackingInfo.driverName = merciEStatus.driverName;
        trackingInfo.driverPhone = merciEStatus.driverPhone;
        trackingInfo.currentLat = merciEStatus.currentLat;
        trackingInfo.currentLng = merciEStatus.currentLng;
      } catch (error) {
        this.logger.warn(
          `Impossible de recuperer le statut Merci E pour ${order.trackingNumber}: ${error.message}`,
        );
        // On continue sans les infos Merci E
      }
    }

    return { result: true, data: trackingInfo };
  }

  // ─── MERCI E : TYPES ──────────────────────────────────────────

  /**
   * Types de colis Merci E
   */
  async getPackageTypes() {
    const types = await this.merciE.getPackageTypes();
    return { result: true, data: types };
  }

  /**
   * Types de marchandises Merci E
   */
  async getGoodsTypes() {
    const types = await this.merciE.getGoodsTypes();
    return { result: true, data: types };
  }
}
