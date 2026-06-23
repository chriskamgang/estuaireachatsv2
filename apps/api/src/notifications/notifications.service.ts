import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

  async create(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = NotificationType.SYSTEM,
    data?: Record<string, string>,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, body, type, data: data ?? undefined },
    });

    // Envoi push FCM en arriere-plan (ne bloque pas si Firebase n'est pas configure)
    this.fcmService
      .sendToUser(userId, title, body, data)
      .catch(() => undefined);

    return notification;
  }

  async findAll(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      result: true,
      data: notifications,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { result: true, data: { count } };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvee');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { result: true, data: updated };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { result: true, data: null };
  }

  async registerFcmToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    return { result: true, data: { message: 'Token FCM enregistre' } };
  }

  async adminList(page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      result: true,
      data: notifications,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async broadcast(
    title: string,
    body: string,
    type: NotificationType = NotificationType.SYSTEM,
    data?: Record<string, string>,
    role?: string,
    topic?: string,
  ) {
    // Si un topic FCM est fourni, on envoie directement via FCM sans creer de notif en base par user
    if (topic) {
      await this.fcmService.sendToTopic(topic, title, body, data);
      return { result: true, data: { message: `Broadcast envoye au topic "${topic}"` } };
    }

    // Sinon on recupere tous les users (filtre optionnel par role)
    const users = await this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    // Creer les notifications en base pour chaque user
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        body,
        type,
        data: data ?? undefined,
      })),
    });

    // Envoi push FCM en arriere-plan
    this.fcmService
      .sendToMultipleUsers(userIds, title, body, data)
      .catch(() => undefined);

    return {
      result: true,
      data: { message: `Broadcast envoye a ${userIds.length} utilisateur(s)` },
    };
  }
}
