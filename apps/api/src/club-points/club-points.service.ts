import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClubPointsService {
  constructor(private prisma: PrismaService) {}

  // ─── BUYER ───────────────────────────────────────────────

  async getMyPoints(userId: string) {
    const result = await this.prisma.clubPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const balance = result._sum.points ?? 0;

    const recent = await this.prisma.clubPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      result: true,
      data: { balance, recentHistory: recent },
    };
  }

  async earnPoints(userId: string, orderId: string, amount: number) {
    const earnRate = await this.getPointsEarnRate();
    const pointsEarned = Math.floor(amount / earnRate);

    if (pointsEarned <= 0) {
      return { result: true, data: { pointsEarned: 0 } };
    }

    const entry = await this.prisma.clubPoint.create({
      data: {
        userId,
        points: pointsEarned,
        note: `Gain commande #${orderId} — ${amount} FCFA`,
      },
    });

    return {
      result: true,
      data: { pointsEarned, entry },
    };
  }

  async convertToWallet(userId: string, points: number) {
    // Verifier le solde
    const balanceResult = await this.prisma.clubPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const currentBalance = balanceResult._sum.points ?? 0;

    if (points <= 0) {
      throw new BadRequestException('Le nombre de points doit etre superieur a 0');
    }
    if (points > currentBalance) {
      throw new BadRequestException(
        `Solde insuffisant. Vous avez ${currentBalance} points disponibles.`,
      );
    }

    const conversionRate = await this.getConversionRate();
    const walletAmount = points * conversionRate;

    // Transaction atomique : debiter les points + crediter le wallet
    const [clubPointEntry, walletEntry] = await this.prisma.$transaction([
      this.prisma.clubPoint.create({
        data: {
          userId,
          points: -points,
          note: `Conversion de ${points} points en ${walletAmount} FCFA wallet`,
        },
      }),
      this.prisma.wallet.create({
        data: {
          userId,
          amount: walletAmount,
          paymentMethod: 'club_points',
          note: `Conversion de ${points} Club Points`,
        },
      }),
    ]);

    // Nouveau solde
    const newBalanceResult = await this.prisma.clubPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return {
      result: true,
      data: {
        pointsDebited: points,
        walletCredited: walletAmount,
        newPointsBalance: newBalanceResult._sum.points ?? 0,
        clubPointEntry,
        walletEntry,
      },
    };
  }

  async getPointsHistory(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [entries, total] = await Promise.all([
      this.prisma.clubPoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.clubPoint.count({ where: { userId } }),
    ]);

    return {
      result: true,
      data: entries,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  // ─── ADMIN — CONFIG ──────────────────────────────────────

  /** Taux de conversion : 1 point = X FCFA (defaut 10) */
  async getConversionRate(): Promise<number> {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: 'club_points_rate' },
    });
    return setting?.value ? parseFloat(setting.value) : 10;
  }

  async updateConversionRate(rate: number) {
    const setting = await this.prisma.businessSetting.upsert({
      where: { type: 'club_points_rate' },
      update: { value: String(rate) },
      create: { type: 'club_points_rate', value: String(rate) },
    });

    return { result: true, data: setting };
  }

  /** Taux de gain : 1 point pour X FCFA depenses (defaut 100) */
  async getPointsEarnRate(): Promise<number> {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: 'club_points_earn_rate' },
    });
    return setting?.value ? parseFloat(setting.value) : 100;
  }

  async updatePointsEarnRate(rate: number) {
    const setting = await this.prisma.businessSetting.upsert({
      where: { type: 'club_points_earn_rate' },
      update: { value: String(rate) },
      create: { type: 'club_points_earn_rate', value: String(rate) },
    });

    return { result: true, data: setting };
  }

  async getConfig() {
    const [conversionRate, earnRate] = await Promise.all([
      this.getConversionRate(),
      this.getPointsEarnRate(),
    ]);

    return {
      result: true,
      data: {
        conversionRate,
        earnRate,
        description: {
          earnRate: `1 point pour chaque ${earnRate} FCFA depenses`,
          conversionRate: `1 point = ${conversionRate} FCFA en wallet`,
        },
      },
    };
  }
}
