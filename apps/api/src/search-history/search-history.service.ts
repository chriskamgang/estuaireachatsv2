import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre une recherche utilisateur.
   * Si la meme requete existe dans les 24h, on met a jour le createdAt au lieu de dupliquer.
   */
  async saveSearch(userId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) return { result: true, data: null };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Verifier si la meme recherche existe dans les 24 dernieres heures
    const existing = await this.prisma.userSearch.findFirst({
      where: {
        userId,
        query: trimmed,
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Mettre a jour le createdAt et reinitialiser notified
      const updated = await this.prisma.userSearch.update({
        where: { id: existing.id },
        data: { createdAt: new Date(), notified: false },
      });
      return { result: true, data: updated };
    }

    // Creer une nouvelle entree
    const search = await this.prisma.userSearch.create({
      data: { userId, query: trimmed },
    });

    return { result: true, data: search };
  }
}
