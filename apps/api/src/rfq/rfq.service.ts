import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { QuoteRfqDto } from './dto/quote-rfq.dto';

@Injectable()
export class RfqService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ── Buyer: Creer une demande de devis ──────────────────────
  async create(userId: string, dto: CreateRfqDto) {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Produit non trouve');
      }
    }

    const rfq = await this.prisma.rFQ.create({
      data: {
        userId,
        productId: dto.productId ?? null,
        quantity: dto.quantity,
        details: dto.details,
        attachments: dto.attachments ?? [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Notifier les vendeurs
    const sellers = await this.prisma.user.findMany({
      where: { role: 'SELLER', status: 'ACTIVE' },
      select: { id: true },
    });

    const buyerName = `${rfq.user.firstName} ${rfq.user.lastName}`.trim();
    const detail = dto.details ? dto.details.substring(0, 80) : `${dto.quantity} unite(s)`;

    for (const seller of sellers) {
      this.notificationsService
        .create(
          seller.id,
          'Nouvelle demande de devis',
          `${buyerName} recherche: ${detail}`,
          'SYSTEM',
          { rfqId: rfq.id },
        )
        .catch(() => undefined);
    }

    return { result: true, data: rfq };
  }

  // ── Buyer: Mes demandes ────────────────────────────────────
  async findByUser(userId: string) {
    const rfqs = await this.prisma.rFQ.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
    });

    return { result: true, data: rfqs };
  }

  // ── Buyer: Detail d'une demande ────────────────────────────
  async findOne(userId: string, rfqId: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
            shop: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException('Demande de devis non trouvee');
    }
    if (rfq.userId !== userId) {
      throw new ForbiddenException('Acces refuse');
    }

    return { result: true, data: rfq };
  }

  // ── Seller: Liste des demandes entrantes ───────────────────
  async findForSeller(sellerId: string, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const rfqs = await this.prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: { where: { isMain: true }, select: { url: true }, take: 1 },
          },
        },
      },
    });

    return { result: true, data: rfqs };
  }

  // ── Seller: Detail d'une demande ───────────────────────────
  async findOneForSeller(rfqId: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: { where: { isMain: true }, select: { url: true }, take: 1 },
            shop: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException('Demande de devis non trouvee');
    }

    return { result: true, data: rfq };
  }

  // ── Seller: Repondre avec un devis ─────────────────────────
  async quote(sellerId: string, rfqId: string, dto: QuoteRfqDto) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        product: { select: { shopId: true, shop: { select: { userId: true } } } },
      },
    });

    if (!rfq) {
      throw new NotFoundException('Demande de devis non trouvee');
    }

    if (!rfq.product || rfq.product.shop.userId !== sellerId) {
      throw new ForbiddenException('Acces refuse');
    }

    const updated = await this.prisma.rFQ.update({
      where: { id: rfqId },
      data: {
        quotedPrice: dto.quotedPrice,
        quotedAt: new Date(),
        status: 'QUOTED',
      },
    });

    return { result: true, data: updated };
  }

  // ── Seller: Repondre par message ───────────────────────────
  async respond(sellerId: string, rfqId: string, message: string, quotedPrice?: number) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!rfq) {
      throw new NotFoundException('Demande de devis non trouvee');
    }

    // Update RFQ status
    const updateData: any = { status: 'QUOTED' };
    if (quotedPrice) {
      updateData.quotedPrice = quotedPrice;
      updateData.quotedAt = new Date();
    }
    await this.prisma.rFQ.update({ where: { id: rfqId }, data: updateData });

    // Create or find conversation between seller and buyer
    const [id1, id2] = [sellerId, rfq.userId].sort();
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          senderId: sellerId,
          receiverId: rfq.userId,
          subject: `Devis #${rfqId.substring(0, 8)}`,
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    // Create the message
    const chatMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: sellerId,
        receiverId: rfq.userId,
        content: message,
      },
    });

    // Notify the buyer
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { firstName: true, lastName: true },
    });
    const sellerName = seller ? `${seller.firstName} ${seller.lastName}`.trim() : 'Un vendeur';

    await this.notificationsService.create(
      rfq.userId,
      'Reponse a votre demande de devis',
      `${sellerName} a repondu a votre demande de devis`,
      'MESSAGE',
      { rfqId, conversationId: conversation.id },
    );

    return {
      result: true,
      data: {
        rfqId,
        conversationId: conversation.id,
        message: chatMessage,
      },
    };
  }
}
