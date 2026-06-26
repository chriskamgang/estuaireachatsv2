import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

const IMAGE_SEARCH_URL = process.env.IMAGE_SEARCH_URL || 'http://localhost:8050';

@Injectable()
export class AiSourcingService {
  private readonly logger = new Logger(AiSourcingService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  /**
   * Recherche assistee par Gemini AI.
   * Envoie la requete utilisateur a Gemini pour extraire des mots-cles structures,
   * puis recherche les produits correspondants dans la base.
   * En cas d'echec de Gemini, retombe sur la recherche textuelle basique.
   */
  async aiSearch(dto: {
    query: string;
    category?: string;
    quantity?: number;
    budgetMin?: number;
    budgetMax?: number;
  }) {
    const { query } = dto;

    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        this.logger.warn('GEMINI_API_KEY non configuree, fallback vers recherche basique');
        return this.search(dto);
      }

      // Appel a l'API Gemini pour analyser la requete utilisateur
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: query }] }],
            systemInstruction: {
              parts: [
                {
                  text: `Tu es un assistant de sourcing pour EstuaireAchats, une plateforme e-commerce au Cameroun.
L'utilisateur cherche des produits ou fournisseurs. Analyse sa demande et reponds en JSON:
{
  "keywords": ["mot1", "mot2"],
  "category": "categorie suggeree ou null",
  "budgetMin": null,
  "budgetMax": null,
  "message": "Un court message utile pour l'utilisateur (2-3 phrases max, en francais)",
  "suggestions": ["suggestion de recherche 1", "suggestion 2", "suggestion 3"]
}
Reponds UNIQUEMENT avec le JSON, sans markdown ni backticks.`,
                },
              ],
            },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }),
        },
      );

      if (!geminiResponse.ok) {
        this.logger.error(`Gemini API erreur HTTP ${geminiResponse.status}`);
        return this.search(dto);
      }

      const geminiData = await geminiResponse.json();
      const rawText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // Parser le JSON retourne par Gemini
      let parsed: {
        keywords?: string[];
        category?: string | null;
        budgetMin?: number | null;
        budgetMax?: number | null;
        message?: string;
        suggestions?: string[];
      };

      try {
        parsed = JSON.parse(rawText.trim());
      } catch {
        this.logger.warn('Impossible de parser la reponse Gemini, fallback');
        return this.search(dto);
      }

      // Construire les parametres de recherche a partir de l'analyse Gemini
      const searchQuery = (parsed.keywords ?? []).join(' ') || query;
      const searchDto = {
        query: searchQuery,
        category: dto.category || parsed.category || undefined,
        quantity: dto.quantity,
        budgetMin: dto.budgetMin ?? parsed.budgetMin ?? undefined,
        budgetMax: dto.budgetMax ?? parsed.budgetMax ?? undefined,
      };

      // Recherche produits avec les mots-cles extraits par Gemini
      const searchResult = await this.search(searchDto);

      return {
        result: true,
        data: {
          aiMessage: parsed.message || null,
          suggestions: parsed.suggestions || [],
          products: searchResult.data,
        },
        meta: {
          ...searchResult.meta,
          aiPowered: true,
          extractedKeywords: parsed.keywords || [],
        },
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'appel Gemini, fallback vers recherche basique', error?.message);
      return this.search(dto);
    }
  }

  async search(dto: {
    query: string;
    category?: string;
    quantity?: number;
    budgetMin?: number;
    budgetMax?: number;
  }) {
    const { query, category, quantity, budgetMin, budgetMax } = dto;

    // Tokenize the query for broader matching
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const orConditions: Prisma.ProductWhereInput[] = [
      { name: { contains: query } },
      { description: { contains: query } },
      { tags: { string_contains: keywords[0] || '' } },
    ];

    // Also search individual keywords in name/description
    for (const keyword of keywords.slice(0, 5)) {
      orConditions.push({ name: { contains: keyword } });
      orConditions.push({
        description: { contains: keyword },
      });
    }

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      status: 'ACTIVE',
      shop: {
        OR: [
          { sellerPackageId: { not: null } },
          { user: { role: 'ADMIN' } },
        ],
      },
      OR: orConditions,
      ...(category && {
        category: {
          OR: [
            { name: { contains: category } },
            { slug: { contains: category } },
          ],
        },
      }),
      ...((budgetMin !== undefined || budgetMax !== undefined) && {
        price: {
          ...(budgetMin !== undefined && { gte: budgetMin }),
          ...(budgetMax !== undefined && { lte: budgetMax }),
        },
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          discountType: true,
          discount: true,
          discountStart: true,
          discountEnd: true,
          minOrderQty: true,
          origin: true,
          rating: true,
          totalReviews: true,
          totalSold: true,
          images: {
            where: { isMain: true },
            select: { id: true, url: true, alt: true },
            take: 1,
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              city: true,
              country: true,
              verified: true,
              yearsActive: true,
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          priceTiers: {
            select: { minQty: true, maxQty: true, price: true },
            orderBy: { minQty: 'asc' as const },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { totalSold: 'desc' }],
        take: 20,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      result: true,
      data: products,
      meta: {
        total,
        query,
        filters: { category, quantity, budgetMin, budgetMax },
      },
    };
  }

  /**
   * Recherche visuelle par image via le microservice CLIP Python.
   * Envoie l'image au service, recupere les IDs produits similaires,
   * puis charge les details complets depuis la base.
   */
  async imageSearch(file: Express.Multer.File) {
    // Envoyer l'image au microservice Python
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    let clipResults: { productId: string; similarity: number; imageUrl: string }[];

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${IMAGE_SEARCH_URL}/search`, formData, {
          headers: formData.getHeaders(),
          timeout: 30000,
        }),
      );
      clipResults = response.data?.results ?? [];
    } catch (error) {
      this.logger.error(
        'Erreur lors de la communication avec le service de recherche visuelle',
        error?.message,
      );
      throw new HttpException(
        'Le service de recherche visuelle est indisponible. Veuillez reessayer.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (clipResults.length === 0) {
      return { result: true, data: [], meta: { total: 0, type: 'image-search' } };
    }

    // Recuperer les IDs produits (ordre de similarite)
    const productIds = clipResults.map((r) => r.productId);

    // Charger les details complets des produits
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isPublished: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        priceMin: true,
        priceMax: true,
        discountType: true,
        discount: true,
        discountStart: true,
        discountEnd: true,
        minOrderQty: true,
        origin: true,
        rating: true,
        totalReviews: true,
        totalSold: true,
        images: {
          where: { isMain: true },
          select: { id: true, url: true, alt: true },
          take: 1,
        },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            country: true,
            verified: true,
            yearsActive: true,
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        priceTiers: {
          select: { minQty: true, maxQty: true, price: true },
          orderBy: { minQty: 'asc' as const },
        },
      },
    });

    // Trier les produits dans l'ordre de similarite CLIP
    const similarityMap = new Map(
      clipResults.map((r) => [r.productId, r.similarity]),
    );
    products.sort(
      (a, b) => (similarityMap.get(b.id) ?? 0) - (similarityMap.get(a.id) ?? 0),
    );

    // Enrichir avec le score de similarite
    const enriched = products.map((p) => ({
      ...p,
      similarity: similarityMap.get(p.id) ?? 0,
    }));

    return {
      result: true,
      data: enriched,
      meta: { total: enriched.length, type: 'image-search' },
    };
  }
}
