import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewStatusDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Avis d'un produit (pagine, public)
   */
  async findByProduct(productId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: 1 }, // uniquement approuves
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where: { productId, status: 1 } }),
    ]);

    return {
      result: true,
      data: reviews,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Soumettre un avis
   */
  async create(userId: string, dto: CreateReviewDto) {
    // Verifier que le produit existe
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produit introuvable');

    // Verifier si l'utilisateur a deja laisse un avis sur ce produit
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) throw new BadRequestException('Vous avez deja laisse un avis sur ce produit');

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images || [],
      },
    });

    // Mettre a jour la moyenne du produit
    await this.updateProductRating(dto.productId);

    return { result: true, data: review };
  }

  /**
   * Admin : approuver ou rejeter un avis
   */
  async updateStatus(reviewId: string, dto: UpdateReviewStatusDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Avis introuvable');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: dto.status },
    });

    // Recalculer la moyenne si le statut change
    await this.updateProductRating(review.productId);

    return { result: true, data: updated };
  }

  /**
   * Avis sur les produits du vendeur (SELLER)
   */
  async findBySeller(sellerId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { product: { shop: { userId: sellerId } } },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where: { product: { shop: { userId: sellerId } } } }),
    ]);

    return {
      result: true,
      data: reviews,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  /**
   * Recalculer Product.rating et Product.totalReviews
   */
  private async updateProductRating(productId: string) {
    const aggregation = await this.prisma.review.aggregate({
      where: { productId, status: 1 },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: aggregation._avg.rating || 0,
        totalReviews: aggregation._count.id,
      },
    });
  }
}
