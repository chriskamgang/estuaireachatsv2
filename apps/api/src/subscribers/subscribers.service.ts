import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SubscribersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.subscriber.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.subscriber.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async subscribe(dto: { email: string; name?: string }) {
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Cet email est deja inscrit');

    const subscriber = await this.prisma.subscriber.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
    });

    return { data: subscriber };
  }

  async remove(id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException('Abonne introuvable');

    await this.prisma.subscriber.delete({ where: { id } });
    return { data: { message: 'Abonne supprime' } };
  }

  async toggleActive(id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException('Abonne introuvable');

    const updated = await this.prisma.subscriber.update({
      where: { id },
      data: { isActive: !subscriber.isActive },
    });

    return { data: updated };
  }

  /**
   * Envoyer une newsletter / notification broadcast
   */
  async sendNewsletter(dto: { titre: string; message: string; cible: string; type: string }) {
    let nbDestinataires = 0;

    // Determine target role filter
    const roleMap: Record<string, string | undefined> = {
      tous: undefined,
      clients: 'BUYER',
      vendeurs: 'SELLER',
    };
    const role = roleMap[dto.cible];

    // For email type, count active subscribers matching the target
    if (dto.type === 'email' || dto.type === 'both') {
      // Get subscriber emails (from the Subscriber model)
      const subscriberCount = await this.prisma.subscriber.count({ where: { isActive: true } });
      nbDestinataires = subscriberCount;
    }

    // For push type (or both), send via notifications broadcast
    if (dto.type === 'push' || dto.type === 'both') {
      const result = await this.notifications.broadcast(
        dto.titre,
        dto.message,
        NotificationType.PROMOTION,
        undefined,
        role,
      );
      // Update count from users targeted
      const userCount = await this.prisma.user.count({
        where: role ? { role: role as any } : undefined,
      });
      nbDestinataires = Math.max(nbDestinataires, userCount);
    }

    // If email only, also send in-app notifications to users with matching role
    if (dto.type === 'email') {
      await this.notifications.broadcast(
        dto.titre,
        dto.message,
        NotificationType.PROMOTION,
        undefined,
        role,
      );
      const userCount = await this.prisma.user.count({
        where: role ? { role: role as any } : undefined,
      });
      nbDestinataires = Math.max(nbDestinataires, userCount);
    }

    // Save to newsletter history
    const history = await this.prisma.newsletterHistory.create({
      data: {
        titre: dto.titre,
        message: dto.message,
        cible: dto.cible,
        type: dto.type,
        nbDestinataires,
      },
    });

    return {
      result: true,
      data: history,
    };
  }

  /**
   * Historique des newsletters envoyees
   */
  async getNewsletterHistory(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.newsletterHistory.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.newsletterHistory.count(),
    ]);

    return {
      result: true,
      data,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }
}
