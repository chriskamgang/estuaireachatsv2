import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class SellerPackagesService {
  constructor(private prisma: PrismaService) {}

  // ── PUBLIC ───────────────────────────────────────────────

  async listPackages() {
    const packages = await this.prisma.sellerPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return { result: true, data: packages };
  }

  async getPackage(id: string) {
    const pkg = await this.prisma.sellerPackage.findUnique({ where: { id } });
    if (!pkg || !pkg.isActive)
      throw new NotFoundException('Package introuvable');
    return { result: true, data: pkg };
  }

  // ── ADMIN ────────────────────────────────────────────────

  async createPackage(dto: CreatePackageDto) {
    const pkg = await this.prisma.sellerPackage.create({
      data: {
        name: dto.name,
        price: dto.price,
        productLimit: dto.productLimit,
        duration: dto.duration,
        logo: dto.logo,
      },
    });
    return { result: true, data: pkg };
  }

  async updatePackage(id: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.sellerPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package introuvable');

    const updated = await this.prisma.sellerPackage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.productLimit !== undefined && {
          productLimit: dto.productLimit,
        }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
      },
    });
    return { result: true, data: updated };
  }

  async deletePackage(id: string) {
    const pkg = await this.prisma.sellerPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package introuvable');

    await this.prisma.sellerPackage.update({
      where: { id },
      data: { isActive: false },
    });
    return { result: true, data: { message: 'Package desactive' } };
  }

  async listPayments(page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [payments, total] = await Promise.all([
      this.prisma.sellerPackagePayment.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { sellerPackage: true },
      }),
      this.prisma.sellerPackagePayment.count(),
    ]);

    return {
      result: true,
      data: payments,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async approvePayment(paymentId: string) {
    const payment = await this.prisma.sellerPackagePayment.findUnique({
      where: { id: paymentId },
      include: { sellerPackage: true },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');

    if (payment.paymentStatus === 'PAID') {
      throw new BadRequestException('Ce paiement est deja approuve');
    }

    // Update payment status + activate package on the shop
    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.sellerPackagePayment.update({
        where: { id: paymentId },
        data: { paymentStatus: 'PAID' },
      }),
      this.prisma.shop.update({
        where: { userId: payment.sellerId },
        data: { sellerPackageId: payment.sellerPackageId },
      }),
    ]);

    return { result: true, data: updatedPayment };
  }

  // ── SELLER ───────────────────────────────────────────────

  async subscribe(
    userId: string,
    packageId: string,
    paymentMethod?: string,
  ) {
    const pkg = await this.prisma.sellerPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg || !pkg.isActive)
      throw new NotFoundException('Package introuvable');

    const shop = await this.prisma.shop.findUnique({
      where: { userId },
    });
    if (!shop) throw new BadRequestException('Vous devez avoir une boutique');

    const isFree = pkg.price === 0;

    const payment = await this.prisma.sellerPackagePayment.create({
      data: {
        sellerId: userId,
        sellerPackageId: packageId,
        amount: pkg.price,
        paymentMethod: paymentMethod ?? null,
        paymentStatus: isFree ? 'PAID' : 'PENDING',
      },
    });

    // If package is free, auto-activate on the shop
    if (isFree) {
      await this.prisma.shop.update({
        where: { userId },
        data: { sellerPackageId: packageId },
      });
    }

    return { result: true, data: payment };
  }

  async getMyPurchases(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [payments, total] = await Promise.all([
      this.prisma.sellerPackagePayment.findMany({
        where: { sellerId: userId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { sellerPackage: true },
      }),
      this.prisma.sellerPackagePayment.count({ where: { sellerId: userId } }),
    ]);

    const data = payments.map((p) => ({
      id: p.id,
      package: p.sellerPackage?.name || 'N/A',
      montant: p.amount,
      date: p.createdAt,
      expiration: p.sellerPackage
        ? new Date(new Date(p.createdAt).getTime() + p.sellerPackage.duration * 86400000)
        : null,
      statut: p.paymentStatus,
    }));

    return {
      result: true,
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async getMySubscription(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { sellerPackage: true },
    });
    if (!shop) throw new NotFoundException('Boutique introuvable');

    // Find the latest approved payment for expiry calculation
    let expiresAt: Date | null = null;
    if (shop.sellerPackageId) {
      const lastPayment = await this.prisma.sellerPackagePayment.findFirst({
        where: {
          sellerId: userId,
          sellerPackageId: shop.sellerPackageId,
          paymentStatus: 'PAID',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastPayment && shop.sellerPackage) {
        const expiry = new Date(lastPayment.createdAt);
        expiry.setDate(expiry.getDate() + shop.sellerPackage.duration);
        expiresAt = expiry;
      }
    }

    return {
      result: true,
      data: {
        package: shop.sellerPackage ?? null,
        expiresAt,
      },
    };
  }
}
