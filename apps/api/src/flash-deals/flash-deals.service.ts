import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFlashDealDto,
  UpdateFlashDealDto,
  AddFlashDealProductDto,
} from './dto/create-flash-deal.dto';

@Injectable()
export class FlashDealsService {
  constructor(private prisma: PrismaService) {}

  // ── Public: ventes flash actives ────────────────────────────
  async getActiveDeals() {
    const now = new Date();

    const deals = await this.prisma.flashDeal.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: true,
      },
      orderBy: { endDate: 'asc' },
    });

    return { result: true, data: deals };
  }

  // ── Public: detail d'une vente flash ────────────────────────
  async getDealDetail(id: string) {
    const deal = await this.prisma.flashDeal.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Vente flash non trouvee');
    }

    return { result: true, data: deal };
  }

  // ── Admin: creer une vente flash ────────────────────────────
  async createDeal(dto: CreateFlashDealDto) {
    const deal = await this.prisma.flashDeal.create({
      data: {
        title: dto.title,
        banner: dto.banner,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
    });

    return { result: true, data: deal };
  }

  // ── Admin: modifier une vente flash ─────────────────────────
  async updateDeal(id: string, dto: UpdateFlashDealDto) {
    const existing = await this.prisma.flashDeal.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Vente flash non trouvee');
    }

    const deal = await this.prisma.flashDeal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return { result: true, data: deal };
  }

  // ── Admin: supprimer une vente flash ────────────────────────
  async deleteDeal(id: string) {
    const existing = await this.prisma.flashDeal.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Vente flash non trouvee');
    }

    await this.prisma.flashDeal.delete({ where: { id } });

    return { result: true, data: null };
  }

  // ── Admin: ajouter un produit a la vente flash ──────────────
  async addProduct(dealId: string, dto: AddFlashDealProductDto) {
    const deal = await this.prisma.flashDeal.findUnique({
      where: { id: dealId },
    });
    if (!deal) {
      throw new NotFoundException('Vente flash non trouvee');
    }

    const entry = await this.prisma.flashDealProduct.create({
      data: {
        flashDealId: dealId,
        productId: dto.productId,
        discount: dto.discount,
        discountType: dto.discountType as any,
      },
    });

    return { result: true, data: entry };
  }

  // ── Admin: retirer un produit de la vente flash ─────────────
  async removeProduct(dealId: string, productId: string) {
    const entry = await this.prisma.flashDealProduct.findFirst({
      where: { flashDealId: dealId, productId },
    });
    if (!entry) {
      throw new NotFoundException('Produit non trouve dans cette vente flash');
    }

    await this.prisma.flashDealProduct.delete({ where: { id: entry.id } });

    return { result: true, data: null };
  }

  // ── Admin: lister toutes les ventes flash (pagine) ──────────
  async listAllDeals(page: number = 1, perPage: number = 15) {
    const skip = (page - 1) * perPage;

    const [deals, total] = await Promise.all([
      this.prisma.flashDeal.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.flashDeal.count(),
    ]);

    return {
      result: true,
      data: deals,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }
}
