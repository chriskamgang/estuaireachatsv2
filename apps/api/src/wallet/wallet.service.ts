import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RechargeWalletDto } from './dto/recharge-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const result = await this.prisma.wallet.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return {
      result: true,
      data: { balance: result._sum.amount ?? 0 },
    };
  }

  async getHistory(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [transactions, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.wallet.count({ where: { userId } }),
    ]);

    return {
      result: true,
      data: transactions,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  // ── Admin endpoints ──

  async getAdminStats() {
    const [totalRecharges, totalDebits, transactionCount, userCount] = await Promise.all([
      this.prisma.wallet.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.wallet.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.wallet.count(),
      this.prisma.wallet.groupBy({
        by: ['userId'],
      }),
    ]);

    const recharges = totalRecharges._sum.amount ?? 0;
    const debits = Math.abs(totalDebits._sum.amount ?? 0);

    return {
      result: true,
      data: {
        totalRecharges: recharges,
        totalDebits: debits,
        soldeGlobal: recharges - debits,
        transactionCount,
        userCount: userCount.length,
      },
    };
  }

  async getAdminTransactions(page = 1, perPage = 20, search?: string) {
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ],
      };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return {
      result: true,
      data: transactions,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async adminCreditUser(userId: string, amount: number, note: string) {
    const transaction = await this.prisma.wallet.create({
      data: {
        userId,
        amount,
        paymentMethod: 'admin',
        note: note || 'Credit admin',
      },
    });

    const balance = await this.prisma.wallet.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return {
      result: true,
      data: { transaction, newBalance: balance._sum.amount ?? 0 },
    };
  }

  async recharge(userId: string, dto: RechargeWalletDto) {
    const transaction = await this.prisma.wallet.create({
      data: {
        userId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        note: 'Recharge wallet',
      },
    });

    const balance = await this.prisma.wallet.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return {
      result: true,
      data: {
        transaction,
        newBalance: balance._sum.amount ?? 0,
      },
    };
  }
}
