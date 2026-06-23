import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // ── User Tickets ────────────────────────────────────────

  async findTicketsByUser(userId: string, page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async createTicket(userId: string, dto: { subject: string; description: string; priority?: string }) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        priority: (dto.priority as any) || 'NORMAL',
      },
    });
    return { data: ticket };
  }

  // ── Seller Product Queries ──────────────────────────────

  async findQueriesBySeller(sellerId: string, page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    // Get all product IDs owned by seller
    const shop = await this.prisma.shop.findUnique({ where: { userId: sellerId } });
    if (!shop) return { data: [], meta: { total: 0, page, perPage, lastPage: 0 } };

    const where = { productId: { in: (await this.prisma.product.findMany({ where: { shopId: shop.id }, select: { id: true } })).map(p => p.id) } };

    const [data, total] = await Promise.all([
      this.prisma.productQuery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.productQuery.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async sellerAnswerQuery(sellerId: string, queryId: string, answer: string) {
    const query = await this.prisma.productQuery.findUnique({ where: { id: queryId } });
    if (!query) throw new NotFoundException('Question introuvable');

    // Verify seller owns the product
    const shop = await this.prisma.shop.findUnique({ where: { userId: sellerId } });
    if (!shop) throw new NotFoundException('Boutique introuvable');

    const product = await this.prisma.product.findFirst({ where: { id: query.productId, shopId: shop.id } });
    if (!product) throw new NotFoundException('Question introuvable');

    const updated = await this.prisma.productQuery.update({
      where: { id: queryId },
      data: { answer },
    });

    return { data: updated };
  }

  // ── Admin Tickets ───────────────────────────────────────

  async findAllTickets(page = 1, perPage = 15, status?: string) {
    const skip = (page - 1) * perPage;
    const where = status ? { status: status as any } : {};

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async updateTicketStatus(id: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: status as any },
    });

    return { data: updated };
  }

  // ── Product Queries ───────────────────────────────────────

  async findAllQueries(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.productQuery.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.productQuery.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async answerQuery(id: string, answer: string) {
    const query = await this.prisma.productQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundException('Question introuvable');

    const updated = await this.prisma.productQuery.update({
      where: { id },
      data: { answer },
    });

    return { data: updated };
  }
}
