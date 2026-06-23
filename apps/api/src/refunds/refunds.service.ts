import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@Injectable()
export class RefundsService {
  constructor(private prisma: PrismaService) {}

  // ── Buyer: Creer une demande de remboursement ──────────────
  async create(userId: string, dto: CreateRefundDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { details: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Commande non trouvee');
    }

    const orderDetail = order.details.find((d) => d.id === dto.orderDetailId);
    if (!orderDetail) {
      throw new NotFoundException('Detail de commande non trouve');
    }

    // Verifier si un remboursement existe deja
    const existing = await this.prisma.refundRequest.findUnique({
      where: { orderDetailId: dto.orderDetailId },
    });
    if (existing) {
      throw new BadRequestException(
        'Une demande de remboursement existe deja pour cet article',
      );
    }

    const refund = await this.prisma.refundRequest.create({
      data: {
        orderId: dto.orderId,
        orderDetailId: dto.orderDetailId,
        userId,
        sellerId: orderDetail.sellerId,
        reason: dto.reason,
        refundAmount: orderDetail.total,
      },
    });

    return { result: true, data: refund };
  }

  // ── Buyer: Mes demandes de remboursement ───────────────────
  async findByUser(userId: string) {
    const refunds = await this.prisma.refundRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
        orderDetail: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    return { result: true, data: refunds };
  }

  // ── Admin: Toutes les demandes ─────────────────────────────
  async findAllAdmin() {
    const refunds = await this.prisma.refundRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true } },
        orderDetail: { select: { id: true, name: true, image: true, price: true, quantity: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    return { result: true, data: refunds };
  }

  // ── Admin: Approuver ─────────────────────────────────────
  async approveAdmin(refundId: string) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
      include: { orderDetail: true },
    });
    if (!refund) throw new NotFoundException('Demande non trouvee');
    if (refund.status !== 'PENDING') throw new BadRequestException('Deja traitee');

    const refundAmount = refund.refundAmount ?? refund.orderDetail.total;
    const [updatedRefund] = await this.prisma.$transaction([
      this.prisma.refundRequest.update({
        where: { id: refundId },
        data: { status: 'APPROVED', refundAmount },
      }),
      this.prisma.wallet.create({
        data: {
          userId: refund.userId,
          amount: refundAmount,
          paymentMethod: 'refund',
          note: `Remboursement commande #${refund.orderId}`,
        },
      }),
    ]);
    return { result: true, data: updatedRefund };
  }

  // ── Admin: Rejeter ───────────────────────────────────────
  async rejectAdmin(refundId: string) {
    const refund = await this.prisma.refundRequest.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundException('Demande non trouvee');
    if (refund.status !== 'PENDING') throw new BadRequestException('Deja traitee');

    const updatedRefund = await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: { status: 'REJECTED' },
    });
    return { result: true, data: updatedRefund };
  }

  // ── Seller: Demandes recues ────────────────────────────────
  async findBySeller(sellerId: string) {
    const refunds = await this.prisma.refundRequest.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
        orderDetail: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            quantity: true,
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return { result: true, data: refunds };
  }

  // ── Seller: Approuver + credit wallet ──────────────────────
  async approve(sellerId: string, refundId: string) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
      include: { orderDetail: true },
    });

    if (!refund) {
      throw new NotFoundException('Demande de remboursement non trouvee');
    }
    if (refund.sellerId !== sellerId) {
      throw new ForbiddenException('Acces refuse');
    }
    if (refund.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a deja ete traitee');
    }

    const refundAmount = refund.refundAmount ?? refund.orderDetail.total;

    // Transaction: approuver + crediter le wallet
    const [updatedRefund] = await this.prisma.$transaction([
      this.prisma.refundRequest.update({
        where: { id: refundId },
        data: { status: 'APPROVED', refundAmount },
      }),
      this.prisma.wallet.create({
        data: {
          userId: refund.userId,
          amount: refundAmount,
          paymentMethod: 'refund',
          note: `Remboursement commande #${refund.orderId}`,
        },
      }),
    ]);

    return { result: true, data: updatedRefund };
  }

  // ── Seller: Rejeter ────────────────────────────────────────
  async reject(sellerId: string, refundId: string) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Demande de remboursement non trouvee');
    }
    if (refund.sellerId !== sellerId) {
      throw new ForbiddenException('Acces refuse');
    }
    if (refund.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a deja ete traitee');
    }

    const updatedRefund = await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: { status: 'REJECTED' },
    });

    return { result: true, data: updatedRefund };
  }
}
