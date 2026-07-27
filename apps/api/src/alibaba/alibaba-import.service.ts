import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlibabaApiService, AlibabaSupplier, AlibabaProduct } from './alibaba-api.service';

@Injectable()
export class AlibabaImportService {
  private readonly logger = new Logger(AlibabaImportService.name);
  // Taux de conversion USD -> FCFA
  private readonly USD_TO_FCFA = 600;

  constructor(
    private prisma: PrismaService,
    private alibabaApi: AlibabaApiService,
  ) {}

  /**
   * Importer un fournisseur via l'API officielle (avec ses produits)
   */
  async importSupplierByLoginId(loginId: string, options: {
    categoryId?: string;
    maxProducts?: number;
  } = {}) {
    this.alibabaApi.checkConfig();

    // Recuperer les infos du fournisseur
    this.logger.log(`Fetching supplier info: ${loginId}`);
    const supplier = await this.alibabaApi.getSupplierInfo(loginId);

    // Verifier si deja importe
    const existing = await this.prisma.shop.findFirst({
      where: { externalUrl: supplier.profileUrl },
    });
    if (existing) {
      throw new BadRequestException(`Fournisseur deja importe: ${existing.name}`);
    }

    // Recuperer les produits (jusqu'a maxProducts)
    const maxProducts = options.maxProducts || 50;
    const pageSize = Math.min(maxProducts, 50);
    const productResult = await this.alibabaApi.getSupplierProducts(supplier.memberId, 1, pageSize);

    const result = await this.createShopFromSupplier(supplier, productResult.products, options.categoryId);

    return {
      result: true,
      data: {
        message: `Fournisseur "${supplier.companyName}" importe via API Alibaba`,
        shop: result.shop,
        productsCreated: result.productsCreated,
        totalProductsFound: productResult.total,
      },
    };
  }

  /**
   * Importer plusieurs fournisseurs par recherche de mot-cle
   */
  async importSuppliersByKeyword(keyword: string, options: {
    categoryId?: string;
    country?: string;
    maxSuppliers?: number;
    maxProductsPerSupplier?: number;
  } = {}) {
    this.alibabaApi.checkConfig();

    const maxSuppliers = options.maxSuppliers || 5;
    this.logger.log(`Searching suppliers for keyword: "${keyword}"`);

    const searchResult = await this.alibabaApi.searchSuppliers({
      keyword,
      country: options.country,
      pageSize: maxSuppliers,
    });

    if (searchResult.suppliers.length === 0) {
      return {
        result: true,
        data: { message: `Aucun fournisseur trouve pour "${keyword}"`, imported: [] },
      };
    }

    const imported = [];
    const errors = [];

    for (const s of searchResult.suppliers) {
      try {
        const existing = await this.prisma.shop.findFirst({
          where: { externalUrl: s.profileUrl },
        });
        if (existing) {
          this.logger.log(`Skip ${s.loginId} - already imported`);
          continue;
        }

        // Recuperer les details complets
        const supplier = await this.alibabaApi.getSupplierInfo(s.loginId);
        const maxProd = options.maxProductsPerSupplier || 20;
        const products = await this.alibabaApi.getSupplierProducts(supplier.memberId, 1, maxProd);

        const result = await this.createShopFromSupplier(supplier, products.products, options.categoryId);
        imported.push({
          name: supplier.companyName,
          shopId: result.shop.id,
          productsCreated: result.productsCreated,
        });

        // Pause pour eviter le rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        this.logger.warn(`Failed to import ${s.loginId}: ${err.message}`);
        errors.push({ loginId: s.loginId, error: err.message });
      }
    }

    return {
      result: true,
      data: {
        message: `${imported.length} fournisseur(s) importe(s) pour "${keyword}"`,
        totalFound: searchResult.total,
        imported,
        errors,
      },
    };
  }

  /**
   * Importer des produits depuis une recherche Alibaba
   * (Ajoute les produits a une boutique EstuaireAchats existante)
   */
  async importProductsBySearch(shopId: string, options: {
    keyword: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
    priceMin?: number;
    priceMax?: number;
  }) {
    this.alibabaApi.checkConfig();

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new BadRequestException('Boutique introuvable');

    const result = await this.alibabaApi.searchProducts({
      keyword: options.keyword,
      categoryId: options.categoryId,
      page: options.page || 1,
      pageSize: options.pageSize || 20,
      priceMin: options.priceMin,
      priceMax: options.priceMax,
    });

    let created = 0;
    for (const product of result.products) {
      try {
        await this.createProduct(product, shopId, options.categoryId);
        created++;
      } catch (err) {
        this.logger.warn(`Failed product "${product.subject}": ${err.message}`);
      }
    }

    return {
      result: true,
      data: {
        message: `${created} produit(s) importe(s) dans la boutique`,
        created,
        total: result.total,
      },
    };
  }

  /**
   * Synchroniser les produits d'une boutique ALIBABA
   * (mettre a jour les prix et stocks)
   */
  async syncShop(shopId: string) {
    this.alibabaApi.checkConfig();

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { products: { select: { id: true, name: true, price: true } } },
    });

    if (!shop) throw new BadRequestException('Boutique introuvable');
    if (shop.source !== 'ALIBABA') throw new BadRequestException('Uniquement pour les boutiques Alibaba');

    // Extraire le loginId depuis l'URL externe
    const loginIdMatch = shop.externalUrl?.match(/\/\/([^.]+)\.en\.alibaba\.com/);
    if (!loginIdMatch) throw new BadRequestException('URL externe invalide pour cette boutique');

    const loginId = loginIdMatch[1];
    const productResult = await this.alibabaApi.getSupplierProducts('', 1, 50);

    this.logger.log(`Syncing ${productResult.products.length} products for ${shop.name}`);

    let updated = 0;
    for (const apiProduct of productResult.products) {
      const priceFCFA = Math.round(apiProduct.price * this.USD_TO_FCFA);
      await this.prisma.product.updateMany({
        where: { shopId, name: { contains: apiProduct.subject.substring(0, 30) } },
        data: { price: priceFCFA > 0 ? priceFCFA : undefined },
      });
      updated++;
    }

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { updatedAt: new Date() },
    });

    return {
      result: true,
      data: {
        message: `Boutique synchronisee: ${updated} produits mis a jour`,
        shopName: shop.name,
        updated,
      },
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async createShopFromSupplier(
    supplier: AlibabaSupplier,
    products: AlibabaProduct[],
    categoryId?: string,
  ) {
    // Creer utilisateur fictif
    const bcrypt = await import('bcrypt');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const email = `alibaba-${supplier.loginId || randomSuffix}@estuaireachats.cm`;
    const hash = await bcrypt.hash(`alibaba_${randomSuffix}_secure`, 10);

    // Verifier si l'email existe deja
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const user = await this.prisma.user.create({
        data: {
          email,
          firstName: supplier.companyName.split(' ')[0] || 'Fabricant',
          lastName: supplier.companyName.split(' ').slice(1).join(' ') || 'Alibaba',
          passwordHash: hash,
          role: 'SELLER',
          emailVerified: true,
        },
      });
      userId = user.id;
    }

    // Generer slug unique
    const baseSlug = supplier.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.shop.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Creer la boutique
    const shop = await this.prisma.shop.create({
      data: {
        userId,
        name: supplier.companyName,
        slug,
        description: `${supplier.companyName} - Fabricant professionnel specialise en ${supplier.mainProducts.slice(0, 3).join(', ') || 'produits industriels'}`,
        logo: supplier.logo || null,
        city: supplier.city || null,
        country: supplier.country || 'CN',
        verified: true,
        verifiedAt: new Date(),
        yearsActive: supplier.yearEstablished
          ? new Date().getFullYear() - supplier.yearEstablished
          : 0,
        staffCount: supplier.totalEmployees || null,
        annualRevenue: supplier.annualRevenue || null,
        certifications: supplier.certifications,
        capabilities: supplier.mainProducts.slice(0, 5),
        source: 'ALIBABA',
        externalUrl: supplier.profileUrl,
        status: 'ACTIVE',
      },
    });

    // Creer les produits
    let productsCreated = 0;
    for (const product of products) {
      try {
        await this.createProduct(product, shop.id, categoryId);
        productsCreated++;
      } catch (err) {
        this.logger.warn(`Failed product "${product.subject}": ${err.message}`);
      }
    }

    return { shop, productsCreated };
  }

  private async createProduct(product: AlibabaProduct, shopId: string, categoryId?: string) {
    const priceFCFA = product.price > 0 ? Math.round(product.price * this.USD_TO_FCFA) : null;

    const baseSlug = product.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const allImages = product.mainImage
      ? [product.mainImage, ...product.images.filter(img => img !== product.mainImage)]
      : product.images;

    await this.prisma.product.create({
      data: {
        shopId,
        name: product.subject,
        slug,
        description: product.description || product.subject,
        price: priceFCFA,
        minOrderQty: product.minOrderQuantity || 1,
        unit: product.unit || 'piece',
        mode: 'WHOLESALE',
        status: 'ACTIVE',
        isPublished: true,
        isApproved: true,
        addedBy: 'admin',
        ...(categoryId && { categoryId }),
        images: allImages.length > 0
          ? {
              create: allImages.slice(0, 10).map((url, idx) => ({
                url,
                alt: product.subject,
                order: idx,
                isMain: idx === 0,
              })),
            }
          : undefined,
      },
    });
  }
}
