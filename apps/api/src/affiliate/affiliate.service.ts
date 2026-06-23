import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  /* ------------------------------------------------------------------ */
  /*  BUYER: register as affiliate                                      */
  /* ------------------------------------------------------------------ */
  async register(userId: string) {
    const existing = await this.prisma.affiliateUser.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Vous etes deja inscrit au programme affilie');
    }

    const referralCode = randomBytes(6).toString('hex'); // 12-char unique code

    const affiliate = await this.prisma.affiliateUser.create({
      data: {
        userId,
        referralCode,
      },
    });

    return {
      result: true,
      data: affiliate,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  BUYER: get my affiliate profile                                   */
  /* ------------------------------------------------------------------ */
  async getMyAffiliate(userId: string) {
    const affiliate = await this.prisma.affiliateUser.findUnique({
      where: { userId },
      include: {
        _count: { select: { logs: true } },
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Profil affilie introuvable');
    }

    const totalEarnings = await this.prisma.affiliateLog.aggregate({
      where: { affiliateUserId: affiliate.id, type: 'CONVERSION' },
      _sum: { amount: true },
    });

    return {
      result: true,
      data: {
        id: affiliate.id,
        userId: affiliate.userId,
        referralCode: affiliate.referralCode,
        referralLink: `/affiliate/click/${affiliate.referralCode}`,
        status: affiliate.status,
        walletBalance: affiliate.walletBalance,
        totalEarnings: totalEarnings._sum.amount ?? 0,
        totalLogs: affiliate._count.logs,
        createdAt: affiliate.createdAt,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC: log a referral click                                      */
  /* ------------------------------------------------------------------ */
  async logClick(referralCode: string, ip: string, userAgent: string) {
    const affiliate = await this.prisma.affiliateUser.findFirst({
      where: { referralCode },
    });

    if (!affiliate) {
      throw new NotFoundException('Code de parrainage invalide');
    }

    await this.prisma.affiliateLog.create({
      data: {
        affiliateUserId: affiliate.id,
        type: 'CLICK',
        amount: 0,
        ip,
        userAgent,
      },
    });

    return {
      result: true,
      message: 'Click enregistre',
      referralCode,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  INTERNAL: log a conversion (called after order placement)         */
  /* ------------------------------------------------------------------ */
  async logConversion(referralCode: string, orderId: string, amount: number) {
    const affiliate = await this.prisma.affiliateUser.findFirst({
      where: { referralCode },
    });

    if (!affiliate) {
      throw new NotFoundException('Code de parrainage invalide');
    }

    // Get commission rate from BusinessSetting, default 5%
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: 'affiliate_commission_rate' },
    });
    const commissionRate = setting?.value ? parseFloat(setting.value) : 5;
    const commission = (amount * commissionRate) / 100;

    const log = await this.prisma.affiliateLog.create({
      data: {
        affiliateUserId: affiliate.id,
        type: 'CONVERSION',
        orderId,
        amount: commission,
      },
    });

    // Credit the affiliate wallet
    await this.prisma.affiliateUser.update({
      where: { id: affiliate.id },
      data: { walletBalance: { increment: commission } },
    });

    return {
      result: true,
      data: log,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  BUYER: paginated affiliate logs                                   */
  /* ------------------------------------------------------------------ */
  async getMyLogs(userId: string, page = 1, perPage = 20) {
    const affiliate = await this.prisma.affiliateUser.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Profil affilie introuvable');
    }

    const skip = (page - 1) * perPage;

    const [logs, total] = await Promise.all([
      this.prisma.affiliateLog.findMany({
        where: { affiliateUserId: affiliate.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.affiliateLog.count({
        where: { affiliateUserId: affiliate.id },
      }),
    ]);

    return {
      result: true,
      data: logs,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  BUYER: request withdrawal of affiliate earnings                   */
  /* ------------------------------------------------------------------ */
  async requestWithdraw(userId: string, amount: number) {
    const affiliate = await this.prisma.affiliateUser.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Profil affilie introuvable');
    }

    if (amount <= 0) {
      throw new BadRequestException('Le montant doit etre superieur a 0');
    }

    if (affiliate.walletBalance < amount) {
      throw new BadRequestException('Solde insuffisant');
    }

    // Debit the affiliate wallet
    await this.prisma.affiliateUser.update({
      where: { id: affiliate.id },
      data: { walletBalance: { decrement: amount } },
    });

    // Log the withdrawal
    await this.prisma.affiliateLog.create({
      data: {
        affiliateUserId: affiliate.id,
        type: 'WITHDRAWAL',
        amount: -amount,
      },
    });

    return {
      result: true,
      message: 'Demande de retrait enregistree',
      data: { amount, newBalance: affiliate.walletBalance - amount },
    };
  }

  /* ================================================================== */
  /*  ADMIN ENDPOINTS                                                   */
  /* ================================================================== */

  /* ------------------------------------------------------------------ */
  /*  ADMIN: list all affiliates with stats                             */
  /* ------------------------------------------------------------------ */
  async listAffiliates(page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [affiliates, total] = await Promise.all([
      this.prisma.affiliateUser.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.affiliateUser.count(),
    ]);

    return {
      result: true,
      data: affiliates,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN: approve affiliate                                          */
  /* ------------------------------------------------------------------ */
  async approveAffiliate(affiliateId: string) {
    const affiliate = await this.prisma.affiliateUser.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affilie introuvable');
    }

    const updated = await this.prisma.affiliateUser.update({
      where: { id: affiliateId },
      data: { status: 'APPROVED' },
    });

    return { result: true, data: updated };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN: reject affiliate                                           */
  /* ------------------------------------------------------------------ */
  async rejectAffiliate(affiliateId: string) {
    const affiliate = await this.prisma.affiliateUser.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affilie introuvable');
    }

    const updated = await this.prisma.affiliateUser.update({
      where: { id: affiliateId },
      data: { status: 'REJECTED' },
    });

    return { result: true, data: updated };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN: get commission config                                      */
  /* ------------------------------------------------------------------ */
  async getConfig() {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: 'affiliate_commission_rate' },
    });

    return {
      result: true,
      data: {
        commissionRate: setting?.value ? parseFloat(setting.value) : 5,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN: update commission config                                   */
  /* ------------------------------------------------------------------ */
  async updateConfig(commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 100) {
      throw new BadRequestException(
        'Le taux de commission doit etre entre 0 et 100',
      );
    }

    const setting = await this.prisma.businessSetting.upsert({
      where: { type: 'affiliate_commission_rate' },
      update: { value: commissionRate.toString() },
      create: { type: 'affiliate_commission_rate', value: commissionRate.toString() },
    });

    return {
      result: true,
      data: { commissionRate: parseFloat(setting.value || '5') },
    };
  }
}
