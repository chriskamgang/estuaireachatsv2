import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            discountType: true,
            rating: true,
            totalSold: true,
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

    return { result: true, data: wishlists };
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    const wishlist = await this.prisma.wishlist.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {},
      create: { userId, productId },
    });

    return { result: true, data: wishlist };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({
      where: { userId, productId },
    });

    return { result: true, data: null };
  }

  async check(userId: string, productId: string) {
    const exists = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return { result: true, data: { inWishlist: !!exists } };
  }
}
