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
                  text: `Tu es un assistant de sourcing intelligent pour EstuaireAchats, une plateforme e-commerce B2B au Cameroun (comme Alibaba).

Analyse la demande de l'utilisateur et determine son INTENTION :
1. "search" — L'utilisateur cherche un produit ou fournisseur specifique (ex: "smartphone Samsung", "ciment Portland")
2. "help" — L'utilisateur demande de l'aide, des conseils, veut concevoir un produit, ou pose une question generale

Reponds UNIQUEMENT en JSON (sans markdown ni backticks) :

Si intention = "search":
{
  "intent": "search",
  "keywords": ["mot1", "mot2"],
  "category": "categorie suggeree ou null",
  "budgetMin": null,
  "budgetMax": null,
  "message": "Court message utile (2-3 phrases, en francais)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Si intention = "help":
{
  "intent": "help",
  "keywords": [],
  "message": "Reponse detaillee et utile a l'utilisateur (5-10 phrases en francais). Donne des conseils concrets, pose des questions pour mieux comprendre son besoin. Sois un vrai assistant expert en sourcing et commerce au Cameroun/Afrique.",
  "suggestions": ["recherche suggeree 1", "recherche suggeree 2", "recherche suggeree 3"],
  "followUpQuestions": ["Question pour mieux cerner le besoin 1", "Question 2"]
}

Exemples de "help": "aide moi a concevoir un produit", "comment trouver un bon fournisseur", "je veux lancer un business", "quels sont les produits tendance".
Exemples de "search": "ciment 50kg", "telephone Samsung", "fournisseur de vetements".`,
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
        intent?: string;
        keywords?: string[];
        category?: string | null;
        budgetMin?: number | null;
        budgetMax?: number | null;
        message?: string;
        suggestions?: string[];
        followUpQuestions?: string[];
      };

      try {
        parsed = JSON.parse(rawText.trim());
      } catch {
        this.logger.warn('Impossible de parser la reponse Gemini, fallback');
        return this.search(dto);
      }

      // Si l'intent est "help", retourner la reponse conversationnelle sans recherche
      if (parsed.intent === 'help') {
        return {
          result: true,
          data: {
            aiMessage: parsed.message || null,
            suggestions: parsed.suggestions || [],
            followUpQuestions: parsed.followUpQuestions || [],
            products: [],
          },
          meta: {
            aiPowered: true,
            intent: 'help',
            extractedKeywords: [],
          },
        };
      }

      // Intent "search" : recherche produits avec les mots-cles extraits
      const searchQuery = (parsed.keywords ?? []).join(' ') || query;
      const searchDto = {
        query: searchQuery,
        category: dto.category || parsed.category || undefined,
        quantity: dto.quantity,
        budgetMin: dto.budgetMin ?? parsed.budgetMin ?? undefined,
        budgetMax: dto.budgetMax ?? parsed.budgetMax ?? undefined,
      };

      const searchResult = await this.search(searchDto);

      return {
        result: true,
        data: {
          aiMessage: parsed.message || null,
          suggestions: parsed.suggestions || [],
          followUpQuestions: parsed.followUpQuestions || [],
          products: searchResult.data,
        },
        meta: {
          ...searchResult.meta,
          aiPowered: true,
          intent: 'search',
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
