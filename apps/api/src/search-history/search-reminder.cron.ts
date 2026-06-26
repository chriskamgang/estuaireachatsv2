import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../notifications/fcm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SearchReminderCron {
  private readonly logger = new Logger(SearchReminderCron.name);

  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Cron qui tourne toutes les 10 minutes.
   * Cherche les recherches non notifiees datant de 1h a 2h,
   * trouve des produits correspondants, et envoie un push + notification in-app.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleSearchReminders() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Recuperer les recherches non notifiees entre 1h et 2h
    const searches = await this.prisma.userSearch.findMany({
      where: {
        notified: false,
        createdAt: {
          gte: twoHoursAgo,
          lte: oneHourAgo,
        },
      },
      include: {
        user: { select: { id: true, fcmToken: true } },
      },
      take: 100, // Limiter pour eviter de surcharger
    });

    if (searches.length === 0) return;

    this.logger.log(
      `${searches.length} recherche(s) a notifier trouvee(s)`,
    );

    for (const search of searches) {
      try {
        // Chercher 1-3 produits correspondants (recherche simple LIKE)
        const products = await this.prisma.product.findMany({
          where: {
            name: { contains: search.query },
            status: 'ACTIVE',
            isPublished: true,
          },
          select: { name: true },
          take: 3,
        });

        // Construire le titre et le body de la notification
        const title = `Vous cherchiez "${search.query}" ?`;
        let body: string;

        if (products.length > 0) {
          body = `Decouvrez ${products[0].name} et d'autres offres sur EstuaireAchats !`;
        } else {
          body =
            'De nouveaux produits correspondent a votre recherche. Venez voir !';
        }

        const data: Record<string, string> = {
          type: 'search_reminder',
          query: search.query,
        };

        // Creer une notification in-app + push via NotificationsService
        await this.notificationsService.create(
          search.userId,
          title,
          body,
          NotificationType.PROMOTION,
          data,
        );

        // Marquer comme notifie
        await this.prisma.userSearch.update({
          where: { id: search.id },
          data: { notified: true },
        });

        this.logger.debug(
          `Rappel envoye pour la recherche "${search.query}" (user: ${search.userId})`,
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors du rappel pour la recherche ${search.id} : ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Traitement des rappels de recherche termine');
  }
}
