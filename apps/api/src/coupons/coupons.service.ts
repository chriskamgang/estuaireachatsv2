import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  // ── Buyer: Mes coupons disponibles ────────────────────────
  async getMyCoupons(userId: string) {
    const now = new Date();

    // Coupons deja utilises par cet utilisateur
    const usedCouponIds = (
      await this.prisma.couponUsage.findMany({
        where: { userId },
        select: { couponId: true },
      })
    ).map((u) => u.couponId);

    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        id: { notIn: usedCouponIds.length ? usedCouponIds : undefined },
      },
      orderBy: { endDate: 'asc' },
    });

    return { result: true, data: coupons };
  }

  // ── Buyer: Appliquer un coupon ─────────────────────────────
  async apply(userId: string, code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Coupon invalide ou inactif');
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new BadRequestException('Coupon expire ou pas encore valide');
    }

    // Verifier si deja utilise par cet utilisateur
    const alreadyUsed = await this.prisma.couponUsage.findFirst({
      where: { couponId: coupon.id, userId },
    });
    if (alreadyUsed) {
      throw new BadRequestException('Vous avez deja utilise ce coupon');
    }

    // Verifier montant minimum du panier
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
    });
    const cartTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (cartTotal < coupon.minBuy) {
      throw new BadRequestException(
        `Montant minimum requis: ${coupon.minBuy} FCFA`,
      );
    }

    // Calculer la reduction
    let discountAmount: number;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = (cartTotal * coupon.discount) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discount;
    }

    // Appliquer sur les items du panier
    await this.prisma.cartItem.updateMany({
      where: { userId },
      data: { couponCode: code, couponApplied: true },
    });

    return {
      result: true,
      data: {
        couponCode: code,
        discountAmount,
        cartTotal,
        newTotal: cartTotal - discountAmount,
      },
    };
  }

  // ── Buyer: Retirer un coupon ───────────────────────────────
  async remove(userId: string) {
    await this.prisma.cartItem.updateMany({
      where: { userId, couponApplied: true },
      data: { couponCode: null, couponApplied: false },
    });

    return { result: true, data: null };
  }

  // ── Seller CRUD ────────────────────────────────────────────
  async findBySeller(sellerId: string) {
    const coupons = await this.prisma.coupon.findMany({
      where: { userId: sellerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });

    return { result: true, data: coupons };
  }

  async create(sellerId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('Ce code coupon existe deja');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        userId: sellerId,
        code: dto.code,
        type: dto.type as any,
        discountType: dto.discountType as any,
        discount: dto.discount,
        minBuy: dto.minBuy ?? 0,
        maxDiscount: dto.maxDiscount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

    return { result: true, data: coupon };
  }

  async update(sellerId: string, couponId: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon non trouve');
    }
    if (coupon.userId !== sellerId) {
      throw new ForbiddenException('Acces refuse');
    }

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.discountType !== undefined && {
          discountType: dto.discountType as any,
        }),
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.minBuy !== undefined && { minBuy: dto.minBuy }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });

    return { result: true, data: updated };
  }

  async deleteCoupon(sellerId: string, couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon non trouve');
    }
    if (coupon.userId !== sellerId) {
      throw new ForbiddenException('Acces refuse');
    }

    await this.prisma.coupon.delete({ where: { id: couponId } });

    return { result: true, data: null };
  }

  // ── Admin: Lister tous les coupons ─────────────────────────
  async findAllAdmin() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });

    return { result: true, data: coupons };
  }
}
