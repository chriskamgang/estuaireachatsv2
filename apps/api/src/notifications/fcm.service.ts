import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private prisma: PrismaService) {
    this.initFirebase();
  }

  private initFirebase() {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!serviceAccountPath) {
      this.logger.warn(
        'Firebase non configure : FIREBASE_SERVICE_ACCOUNT_PATH ou GOOGLE_APPLICATION_CREDENTIALS manquant. Les notifications push seront ignorees.',
      );
      return;
    }

    try {
      // Eviter double initialisation
      if (admin.apps.length > 0) {
        this.initialized = true;
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialise avec succes');
    } catch (error) {
      this.logger.warn(
        `Impossible d'initialiser Firebase Admin SDK : ${(error as Error).message}. Les notifications push seront ignorees.`,
      );
    }
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      this.logger.debug(`Pas de fcmToken pour l'user ${userId} — push ignore`);
      return;
    }

    try {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: data ?? {},
      });
      this.logger.debug(`Push envoye a l'user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Echec envoi push a l'user ${userId} : ${(error as Error).message}`,
      );
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized) return;
    if (userIds.length === 0) return;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { id: true, fcmToken: true },
    });

    const tokens = users
      .map((u) => u.fcmToken)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      this.logger.debug('Aucun fcmToken trouve pour les users cibles — push ignore');
      return;
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
      });
      this.logger.debug(
        `Push multicast : ${response.successCount} succes, ${response.failureCount} echecs`,
      );
    } catch (error) {
      this.logger.error(
        `Echec envoi push multicast : ${(error as Error).message}`,
      );
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized) return;

    try {
      await admin.messaging().send({
        topic,
        notification: { title, body },
        data: data ?? {},
      });
      this.logger.debug(`Push envoye au topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Echec envoi push au topic "${topic}" : ${(error as Error).message}`,
      );
    }
  }
}
