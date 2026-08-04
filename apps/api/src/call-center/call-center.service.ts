import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class CallCenterService {
  constructor(private prisma: PrismaService) {}

  // ─── DASHBOARD STATS ────────────────────────────────────────
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPending,
      totalToday,
      callsToday,
      confirmedToday,
      scheduledCallbacks,
    ] = await Promise.all([
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.callLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.callLog.count({
        where: { createdAt: { gte: today }, callResult: 'CONFIRMED' },
      }),
      this.prisma.callLog.count({
        where: { callResult: 'CALLBACK', scheduledAt: { gte: new Date() } },
      }),
    ]);

    return {
      totalPending,
      totalToday,
      callsToday,
      confirmedToday,
      scheduledCallbacks,
    };
  }

  // ─── ORDERS LIST ────────────────────────────────────────────
  async findOrders(
    page: number,
    perPage: number,
    status?: string,
    search?: string,
  ) {
    const where: any = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { buyer: { firstName: { contains: search, mode: 'insensitive' } } },
        { buyer: { lastName: { contains: search, mode: 'insensitive' } } },
        { buyer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          seller: { select: { id: true, firstName: true, lastName: true, shop: { select: { name: true, phone: true } } } },
          details: { select: { id: true, name: true, quantity: true, price: true, image: true } },
          address: true,
          callLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { agent: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  // ─── ORDER DETAIL ───────────────────────────────────────────
  async findOrderDetail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, phone: true, shop: { select: { id: true, name: true, slug: true, phone: true, address: true, city: true } } } },
        details: { include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } } } },
        address: true,
        payment: true,
        callLogs: {
          orderBy: { createdAt: 'desc' },
          include: { agent: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  // ─── CREATE CALL LOG ────────────────────────────────────────
  async createCallLog(agentId: string, dto: CreateCallLogDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const callLog = await this.prisma.callLog.create({
      data: {
        orderId: dto.orderId,
        agentId,
        callResult: dto.callResult,
        duration: dto.duration,
        notes: dto.notes,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
      include: {
        agent: { select: { firstName: true, lastName: true } },
        order: { select: { orderNumber: true } },
      },
    });

    // Si l'agent confirme la commande, mettre a jour le statut
    if (dto.callResult === 'CONFIRMED' && order.status === 'PENDING') {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { status: 'CONFIRMED' },
      });
    }

    // Si l'agent annule la commande
    if (dto.callResult === 'CANCELLED' && order.status === 'PENDING') {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
    }

    return callLog;
  }

  // ─── CALL LOGS (journal) ────────────────────────────────────
  async findCallLogs(page: number, perPage: number, agentId?: string) {
    const where: any = {};
    if (agentId) where.agentId = agentId;

    const [logs, total] = await Promise.all([
      this.prisma.callLog.findMany({
        where,
        include: {
          agent: { select: { firstName: true, lastName: true } },
          order: { select: { id: true, orderNumber: true, status: true, total: true, buyer: { select: { firstName: true, lastName: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.callLog.count({ where }),
    ]);

    return { data: logs, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  // ─── SCHEDULED CALLBACKS ───────────────────────────────────
  async findScheduledCallbacks(agentId?: string) {
    const where: any = {
      callResult: 'CALLBACK',
      scheduledAt: { gte: new Date() },
    };
    if (agentId) where.agentId = agentId;

    return this.prisma.callLog.findMany({
      where,
      include: {
        order: {
          select: {
            id: true, orderNumber: true, status: true, total: true,
            buyer: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        agent: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
