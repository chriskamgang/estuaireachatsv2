import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KPayService } from '../payments/kpay.service';
import { CreateWithdrawDto, ProcessWithdrawDto } from './dto/create-withdraw.dto';
import { WithdrawStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const METHOD_TO_PROVIDER: Record<string, string> = {
  MTN_MOMO: 'MTN_MOMO_CMR',
  ORANGE_MONEY: 'ORANGE_CMR',
};

@Injectable()
export class WithdrawsService {
  private readonly logger = new Logger('WithdrawsService');

  constructor(
    private prisma: PrismaService,
    private kpay: KPayService,
  ) {}

  // ==================== SELLER ====================

  async create(sellerId: string, dto: CreateWithdrawDto) {
    // Verifier que c'est un vendeur avec une boutique
    const shop = await this.prisma.shop.findUnique({ where: { userId: sellerId } });
    if (!shop) throw new ForbiddenException('Vous devez avoir une boutique');

    // Calculer le solde disponible (total paiements recus - total retraits approuves/en cours)
    const [paidOrders, withdrawnOrPending] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { order: { sellerId }, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawRequest.aggregate({
        where: {
          sellerId,
          status: { in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING, WithdrawStatus.COMPLETED] },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalEarned = paidOrders._sum.amount || 0;
    const totalWithdrawn = withdrawnOrPending._sum.amount || 0;
    const availableBalance = totalEarned - totalWithdrawn;

    if (dto.amount > availableBalance) {
      throw new BadRequestException(
        `Solde insuffisant. Disponible: ${availableBalance} FCFA, demande: ${dto.amount} FCFA`,
      );
    }

    const provider = METHOD_TO_PROVIDER[dto.method];
    if (!provider) throw new BadRequestException('Methode invalide. Utilisez MTN_MOMO ou ORANGE_MONEY');

    const withdraw = await this.prisma.withdrawRequest.create({
      data: {
        sellerId,
        amount: dto.amount,
        method: dto.method,
        provider,
        phoneNumber: dto.phoneNumber,
        note: dto.note,
      },
    });

    return {
      result: true,
      message: 'Demande de retrait soumise',
      data: withdraw,
    };
  }

  async getMyWithdraws(sellerId: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.withdrawRequest.findMany({
        where: { sellerId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawRequest.count({ where: { sellerId } }),
    ]);

    // Calculer le solde
    const [paidOrders, withdrawnOrPending] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { order: { sellerId }, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawRequest.aggregate({
        where: {
          sellerId,
          status: { in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING, WithdrawStatus.COMPLETED] },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      result: true,
      data,
      balance: {
        totalEarned: paidOrders._sum.amount || 0,
        totalWithdrawn: withdrawnOrPending._sum.amount || 0,
        available: (paidOrders._sum.amount || 0) - (withdrawnOrPending._sum.amount || 0),
      },
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  // ==================== ADMIN ====================

  async listAll(page: number, perPage: number, status?: string) {
    const skip = (page - 1) * perPage;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.withdrawRequest.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      this.prisma.withdrawRequest.count({ where }),
    ]);

    return {
      result: true,
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async approve(withdrawId: string, adminId: string, dto: ProcessWithdrawDto) {
    const withdraw = await this.prisma.withdrawRequest.findUnique({ where: { id: withdrawId } });
    if (!withdraw) throw new NotFoundException('Demande introuvable');
    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException(`Demande deja ${withdraw.status}`);
    }

    // Lancer le retrait via KPay
    const externalId = `WDR-${withdraw.id}-${uuidv4().slice(0, 8)}`;

    try {
      const kpayResult = await this.kpay.initWithdraw({
        amount: withdraw.amount,
        provider: withdraw.provider || METHOD_TO_PROVIDER[withdraw.method] || 'MTN_MOMO_CMR',
        phoneNumber: withdraw.phoneNumber,
        externalId,
        description: `Retrait vendeur EstuaireAchats — ${withdraw.id}`,
        metadata: { withdrawId: withdraw.id, sellerId: withdraw.sellerId },
      });

      const updated = await this.prisma.withdrawRequest.update({
        where: { id: withdrawId },
        data: {
          status: WithdrawStatus.PROCESSING,
          kpayId: kpayResult.id,
          providerRef: kpayResult.reference,
          adminNote: dto.adminNote,
          processedBy: adminId,
          processedAt: new Date(),
        },
      });

      this.logger.log(`[Withdraw] Approuve et envoye a KPay: ${withdrawId} — ${withdraw.amount} FCFA`);

      return {
        result: true,
        message: 'Retrait approuve et envoye a KPay',
        data: updated,
      };
    } catch (err: any) {
      // Si KPay echoue, marquer comme approuve (retrait manuel)
      const updated = await this.prisma.withdrawRequest.update({
        where: { id: withdrawId },
        data: {
          status: WithdrawStatus.APPROVED,
          adminNote: `${dto.adminNote || ''} — KPay erreur: ${err.message}`.trim(),
          processedBy: adminId,
          processedAt: new Date(),
        },
      });

      this.logger.warn(`[Withdraw] Approuve mais KPay echec: ${err.message}`);

      return {
        result: true,
        message: 'Retrait approuve (envoi KPay echoue, traitement manuel requis)',
        data: updated,
      };
    }
  }

  async reject(withdrawId: string, adminId: string, dto: ProcessWithdrawDto) {
    const withdraw = await this.prisma.withdrawRequest.findUnique({ where: { id: withdrawId } });
    if (!withdraw) throw new NotFoundException('Demande introuvable');
    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException(`Demande deja ${withdraw.status}`);
    }

    const updated = await this.prisma.withdrawRequest.update({
      where: { id: withdrawId },
      data: {
        status: WithdrawStatus.REJECTED,
        adminNote: dto.adminNote,
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    return { result: true, message: 'Retrait rejete', data: updated };
  }

  /**
   * Polling: verifier les retraits PROCESSING via KPay
   */
  async pollProcessingWithdraws() {
    const processing = await this.prisma.withdrawRequest.findMany({
      where: { status: WithdrawStatus.PROCESSING, kpayId: { not: null } },
    });

    if (processing.length === 0) return { checked: 0 };

    let updated = 0;
    for (const w of processing) {
      try {
        const status = await this.kpay.getWithdrawStatus(w.kpayId!);

        if (status.status === 'COMPLETED') {
          await this.prisma.withdrawRequest.update({
            where: { id: w.id },
            data: { status: WithdrawStatus.COMPLETED },
          });
          updated++;
          this.logger.log(`[Withdraw] COMPLETE: ${w.id}`);
        } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
          await this.prisma.withdrawRequest.update({
            where: { id: w.id },
            data: {
              status: WithdrawStatus.REJECTED,
              failureReason: status.failureReason || status.status,
            },
          });
          updated++;
          this.logger.warn(`[Withdraw] ECHEC: ${w.id} — ${status.failureReason}`);
        }
      } catch (err: any) {
        this.logger.warn(`[Withdraw] Poll erreur ${w.id}: ${err.message}`);
      }
    }

    return { checked: processing.length, updated };
  }
}
