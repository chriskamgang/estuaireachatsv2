import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  // ── PUBLIC ────────────────────────────────────────────────────

  async findAll(verified?: boolean) {
    const shops = await this.prisma.shop.findMany({
      where: {
        status: 'ACTIVE',
        // Seules les boutiques avec package paye (ou admin) sont visibles
        OR: [
          { sellerPackageId: { not: null } },
          { user: { role: 'ADMIN' } },
        ],
        ...(verified !== undefined && { verified }),
      },
      include: {
        products: verified ? {
          where: { status: 'ACTIVE', isPublished: true, isApproved: true },
          include: { images: { where: { isMain: true }, take: 1 } },
          orderBy: { totalSold: 'desc' },
          take: 4,
        } : false,
        _count: { select: { products: true, followers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { result: true, data: shops };
  }

  async findBySlug(slug: string) {
    let shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        user: { select: { role: true } },
        products: {
          where: { status: 'ACTIVE', isPublished: true },
          include: {
            images: { where: { isMain: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { products: true, followers: true } },
      },
    });
    // Fallback: chercher par ID si le slug n'a rien donne
    if (!shop) {
      shop = await this.prisma.shop.findUnique({
        where: { id: slug },
        include: {
          user: { select: { role: true } },
          products: {
            where: { status: 'ACTIVE', isPublished: true },
            include: {
              images: { where: { isMain: true }, take: 1 },
              category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { products: true, followers: true } },
        },
      });
    }
    if (!shop) throw new NotFoundException('Boutique introuvable');

    // Boutique sans package paye et non-admin = invisible
    if (!shop.sellerPackageId && shop.user?.role !== 'ADMIN') {
      throw new NotFoundException('Boutique introuvable');
    }

    return { result: true, data: shop };
  }

  // ── SELLER ────────────────────────────────────────────────────

  async getMyShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: {
        _count: { select: { products: true, followers: true } },
      },
    });
    if (!shop) throw new NotFoundException('Vous n\'avez pas de boutique');

    // Stats supplementaires
    const [totalOrders, totalRevenue] = await Promise.all([
      this.prisma.order.count({ where: { sellerId: userId } }),
      this.prisma.order.aggregate({
        where: { sellerId: userId, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    return {
      result: true,
      data: {
        ...shop,
        stats: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
        },
      },
    };
  }

  async getSellerDashboard(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: {
        sellerPackage: true,
        _count: { select: { products: true, followers: true } },
      },
    });
    if (!shop) throw new NotFoundException('Vous n\'avez pas de boutique');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      activeProducts,
      monthRevenue,
      recentOrders,
      topProducts,
      avgRating,
    ] = await Promise.all([
      this.prisma.order.count({ where: { sellerId: userId } }),
      this.prisma.order.aggregate({
        where: { sellerId: userId, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { sellerId: userId, status: 'PENDING' } }),
      this.prisma.product.count({ where: { shop: { userId }, status: 'ACTIVE' } }),
      this.prisma.order.aggregate({
        where: { sellerId: userId, paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          buyer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { shop: { userId }, status: 'ACTIVE' },
        orderBy: { totalSold: 'desc' },
        take: 5,
        select: { name: true, totalSold: true, price: true },
      }),
      this.prisma.review.aggregate({
        where: { product: { shop: { userId } } },
        _avg: { rating: true },
      }),
    ]);

    // Balance: total paid - total withdrawn
    const [paidTotal, withdrawnTotal] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { order: { sellerId: userId }, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawRequest.aggregate({
        where: { sellerId: userId, status: { in: ['COMPLETED', 'APPROVED', 'PROCESSING', 'PENDING'] } },
        _sum: { amount: true },
      }),
    ]);

    const balance = (paidTotal._sum.amount || 0) - (withdrawnTotal._sum.amount || 0);

    return {
      result: true,
      data: {
        totalProducts: shop._count.products,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        avgRating: avgRating._avg.rating || 0,
        pendingOrders,
        activeProducts,
        balance,
        monthRevenue: monthRevenue._sum.total || 0,
        recentOrders: recentOrders.map((o) => ({
          code: o.orderNumber,
          date: o.createdAt,
          client: `${o.buyer.firstName} ${o.buyer.lastName}`,
          montant: o.total,
          statut: o.status,
        })),
        topProducts: topProducts.map((p) => ({
          name: p.name,
          ventes: p.totalSold,
          montant: (p.price || 0) * p.totalSold,
        })),
      },
    };
  }

  async updateMyShop(userId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException('Vous n\'avez pas de boutique');

    const updated = await this.prisma.shop.update({
      where: { userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.staffCount !== undefined && { staffCount: dto.staffCount }),
        ...(dto.factoryArea !== undefined && { factoryArea: dto.factoryArea }),
        ...(dto.annualRevenue !== undefined && { annualRevenue: dto.annualRevenue }),
        ...(dto.capabilities !== undefined && { capabilities: dto.capabilities }),
        ...(dto.certifications !== undefined && { certifications: dto.certifications }),
        ...(dto.factoryImages !== undefined && { factoryImages: dto.factoryImages }),
        ...(dto.yearsActive !== undefined && { yearsActive: dto.yearsActive }),
        ...(dto.responseTime !== undefined && { responseTime: dto.responseTime }),
        ...(dto.deliveryRate !== undefined && { deliveryRate: dto.deliveryRate }),
      },
    });
    return { result: true, data: updated };
  }

  // ── FOLLOW / UNFOLLOW ─────────────────────────────────────────

  async followShop(shopId: string, userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Boutique introuvable');
    if (shop.userId === userId) throw new BadRequestException('Vous ne pouvez pas suivre votre propre boutique');

    const existing = await this.prisma.shopFollower.findUnique({
      where: { shopId_userId: { shopId, userId } },
    });
    if (existing) throw new BadRequestException('Vous suivez deja cette boutique');

    await this.prisma.shopFollower.create({
      data: { shopId, userId },
    });
    return { result: true, data: { message: 'Boutique suivie' } };
  }

  async unfollowShop(shopId: string, userId: string) {
    const existing = await this.prisma.shopFollower.findUnique({
      where: { shopId_userId: { shopId, userId } },
    });
    if (!existing) throw new NotFoundException('Vous ne suivez pas cette boutique');

    await this.prisma.shopFollower.delete({
      where: { shopId_userId: { shopId, userId } },
    });
    return { result: true, data: { message: 'Boutique retirée des suivis' } };
  }

  // ── ADMIN ─────────────────────────────────────────────────────

  async findAllAdmin() {
    const shops = await this.prisma.shop.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { products: true, followers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { result: true, data: shops };
  }

  async adminCreateShop(dto: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    logo?: string;
    banner?: string;
    factoryImages?: string[];
    userId?: string;
    sellerEmail?: string;
    sellerFirstName?: string;
    sellerLastName?: string;
    sellerPhone?: string;
    sellerPassword?: string;
  }) {
    let userId = dto.userId;

    if (!userId) {
      if (!dto.sellerEmail || !dto.sellerFirstName || !dto.sellerLastName) {
        throw new BadRequestException('Veuillez fournir un vendeur existant ou les infos pour en creer un');
      }

      const existing = await this.prisma.user.findUnique({ where: { email: dto.sellerEmail } });
      if (existing) {
        const existingShop = await this.prisma.shop.findUnique({ where: { userId: existing.id } });
        if (existingShop) throw new BadRequestException('Cet utilisateur a deja une boutique');
        userId = existing.id;
        if (existing.role !== 'SELLER' && existing.role !== 'ADMIN') {
          await this.prisma.user.update({ where: { id: existing.id }, data: { role: 'SELLER' } });
        }
      } else {
        const bcrypt = await import('bcrypt');
        const hash = await bcrypt.hash(dto.sellerPassword || 'password123', 10);
        const user = await this.prisma.user.create({
          data: {
            email: dto.sellerEmail,
            firstName: dto.sellerFirstName,
            lastName: dto.sellerLastName,
            phone: dto.sellerPhone || null,
            passwordHash: hash,
            role: 'SELLER',
            emailVerified: true,
          },
        });
        userId = user.id;
      }
    } else {
      const existingShop = await this.prisma.shop.findUnique({ where: { userId } });
      if (existingShop) throw new BadRequestException('Cet utilisateur a deja une boutique');
    }

    const baseSlug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.shop.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const shop = await this.prisma.shop.create({
      data: {
        userId: userId!,
        name: dto.name,
        slug,
        description: dto.description || null,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        city: dto.city || null,
        logo: dto.logo || null,
        banner: dto.banner || null,
        factoryImages: dto.factoryImages || [],
        status: 'ACTIVE',
        verified: true,
        verifiedAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return { result: true, data: shop };
  }

  async verifyShop(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Boutique introuvable');

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { verified: true, verifiedAt: new Date() },
    });
    return { result: true, data: updated };
  }

  async updateShopStatus(shopId: string, status: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Boutique introuvable');

    const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs acceptees: ${validStatuses.join(', ')}`);
    }

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { status: status as any },
    });
    return { result: true, data: updated };
  }
}
