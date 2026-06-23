import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiSourcingService {
  constructor(private prisma: PrismaService) {}

  async search(dto: {
    query: string;
    category?: string;
    quantity?: number;
    budgetMin?: number;
    budgetMax?: number;
  }) {
    const { query, category, quantity, budgetMin, budgetMax } = dto;

    // Tokenize the query for broader matching
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const orConditions: Prisma.ProductWhereInput[] = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { hasSome: keywords } },
    ];

    // Also search individual keywords in name/description
    for (const keyword of keywords.slice(0, 5)) {
      orConditions.push({ name: { contains: keyword, mode: 'insensitive' } });
      orConditions.push({
        description: { contains: keyword, mode: 'insensitive' },
      });
    }

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      status: 'ACTIVE',
      shop: {
        OR: [
          { sellerPackageId: { not: null } },
          { user: { role: 'ADMIN' } },
        ],
      },
      OR: orConditions,
      ...(category && {
        category: {
          OR: [
            { name: { contains: category, mode: 'insensitive' } },
            { slug: { contains: category, mode: 'insensitive' } },
          ],
        },
      }),
      ...((budgetMin !== undefined || budgetMax !== undefined) && {
        price: {
          ...(budgetMin !== undefined && { gte: budgetMin }),
          ...(budgetMax !== undefined && { lte: budgetMax }),
        },
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          discountType: true,
          discount: true,
          discountStart: true,
          discountEnd: true,
          minOrderQty: true,
          origin: true,
          rating: true,
          totalReviews: true,
          totalSold: true,
          images: {
            where: { isMain: true },
            select: { id: true, url: true, alt: true },
            take: 1,
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              city: true,
              country: true,
              verified: true,
              yearsActive: true,
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          priceTiers: {
            select: { minQty: true, maxQty: true, price: true },
            orderBy: { minQty: 'asc' as const },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { totalSold: 'desc' }],
        take: 20,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      result: true,
      data: products,
      meta: {
        total,
        query,
        filters: { category, quantity, budgetMin, budgetMax },
      },
    };
  }
}
