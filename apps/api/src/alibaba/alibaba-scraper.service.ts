import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';

export interface ScrapedSupplier {
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  location: string;
  country: string;
  verified: boolean;
  yearsActive: number;
  staffCount: string | null;
  factoryArea: string | null;
  annualRevenue: string | null;
  rating: number;
  totalReviews: number;
  responseTime: string | null;
  capabilities: string[];
  certifications: string[];
  factoryImages: string[];
  externalUrl: string;
  products: ScrapedProduct[];
}

export interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  minOrderQty: number;
  unit: string;
  images: string[];
  externalUrl: string;
}

@Injectable()
export class AlibabaScraperService {
  private readonly logger = new Logger(AlibabaScraperService.name);
  private readonly FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Extraire le domaine du fournisseur depuis l'URL
   * Ex: "https://zsbcs.en.alibaba.com/factory.html" -> "zsbcs.en.alibaba.com"
   */
  private getSupplierBaseUrl(url: string): string {
    const match = url.match(/(https?:\/\/[^/]+)/);
    return match ? match[1] : url;
  }

  /**
   * Scrape un fournisseur Alibaba en combinant plusieurs pages
   */
  async scrapeSupplierPage(url: string): Promise<ScrapedSupplier> {
    if (!url.includes('alibaba.com')) {
      throw new BadRequestException('URL invalide: doit etre une page alibaba.com');
    }

    const baseUrl = this.getSupplierBaseUrl(url);
    this.logger.log(`Scraping supplier: ${baseUrl}`);

    // Scraper la page productlist (c'est la seule qui retourne du HTML lisible)
    const productListUrl = `${baseUrl}/productlist.html`;
    const productHtml = await this.fetchPage(productListUrl);
    const $prod = cheerio.load(productHtml);

    // Le titre de la page productlist contient le nom: "All products - Company Name"
    const pageTitle = $prod('title').text().trim();
    let companyName = pageTitle.replace(/^All products\s*-\s*/i, '').trim();

    // Fallback: essayer la page d'accueil avec full URL
    if (!companyName) {
      const mainHtml = await this.fetchPage(url);
      const $main = cheerio.load(mainHtml);
      companyName = $main('title').text().trim().split(' - ')[0].trim();
    }

    if (!companyName) {
      // Extraire du sous-domaine: zsbcs.en.alibaba.com -> zsbcs
      const subMatch = baseUrl.match(/\/\/([^.]+)\./);
      companyName = subMatch ? subMatch[1].toUpperCase() : 'Fournisseur Alibaba';
    }

    // Extraire les produits
    const products = this.extractProducts($prod);

    // Extraire le logo depuis la page si disponible
    const logo = $prod('.supplier-info img, .company-logo img, [class*="logo"] img').first().attr('src');

    // Extraire les infos supplier-info si presentes
    const supplierInfoText = $prod('.supplier-info').text().trim();

    // Extraire les annees et le banner depuis globalData dans les scripts
    let banner: string | null = null;
    let yearsActive = 0;
    $prod('script').each((_, el) => {
      const content = $prod(el).html() || '';
      if (content.includes('globalData')) {
        const bgMatch = content.match(/"backImage"\s*:\s*"([^"]+)"/);
        if (bgMatch) {
          banner = bgMatch[1].startsWith('//') ? `https:${bgMatch[1]}` : bgMatch[1];
        }
      }
    });

    // Chercher l'annee dans le texte
    const yearMatch = supplierInfoText.match(/(\d+)\s*(?:yrs?|years?)/i);
    if (yearMatch) yearsActive = parseInt(yearMatch[1], 10);

    const supplier: ScrapedSupplier = {
      name: companyName,
      description: `${companyName} - Fabricant et fournisseur professionnel`,
      logo: logo ? (logo.startsWith('//') ? `https:${logo}` : logo) : null,
      banner,
      location: '',
      country: 'CN',
      verified: productHtml.includes('verified') || productHtml.includes('gold-supplier'),
      yearsActive,
      staffCount: null,
      factoryArea: null,
      annualRevenue: null,
      rating: 0,
      totalReviews: 0,
      responseTime: null,
      capabilities: [],
      certifications: [],
      factoryImages: [],
      externalUrl: baseUrl,
      products,
    };

    this.logger.log(`Scraped supplier: ${supplier.name} with ${products.length} products`);
    return supplier;
  }

  /**
   * Scrape les produits depuis la page productlist
   */
  async scrapeSupplierProducts(supplierUrl: string): Promise<ScrapedProduct[]> {
    const baseUrl = this.getSupplierBaseUrl(supplierUrl);
    const productsUrl = `${baseUrl}/productlist.html`;

    this.logger.log(`Scraping products from: ${productsUrl}`);
    const html = await this.fetchPage(productsUrl);
    const $ = cheerio.load(html);

    return this.extractProducts($);
  }

  /**
   * Importe un fournisseur scrape dans la base de donnees
   */
  async importSupplier(supplier: ScrapedSupplier, categoryId?: string): Promise<{ shop: any; productsCreated: number }> {
    // Verifier si deja importe (par URL externe)
    if (supplier.externalUrl) {
      const existing = await this.prisma.shop.findFirst({
        where: { externalUrl: supplier.externalUrl },
      });
      if (existing) {
        throw new BadRequestException(`Ce fournisseur est deja importe: ${existing.name}`);
      }
    }

    // Creer un utilisateur fictif pour la boutique
    const bcrypt = await import('bcrypt');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const email = `alibaba-${randomSuffix}@estuaireachats.cm`;
    const hash = await bcrypt.hash(`alibaba_${randomSuffix}_secure`, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: supplier.name.split(' ')[0] || 'Fabricant',
        lastName: supplier.name.split(' ').slice(1).join(' ') || 'Alibaba',
        passwordHash: hash,
        role: 'SELLER',
        emailVerified: true,
      },
    });

    // Generer un slug unique
    const baseSlug = supplier.name
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
        userId: user.id,
        name: supplier.name,
        slug,
        description: supplier.description || `Fabricant et fournisseur professionnel - Importe depuis Alibaba`,
        logo: supplier.logo,
        banner: supplier.banner,
        address: supplier.location || null,
        city: supplier.location?.split(',')[0]?.trim() || null,
        country: supplier.country,
        verified: supplier.verified,
        verifiedAt: supplier.verified ? new Date() : null,
        yearsActive: supplier.yearsActive,
        staffCount: supplier.staffCount,
        factoryArea: supplier.factoryArea,
        annualRevenue: supplier.annualRevenue,
        rating: supplier.rating,
        totalReviews: supplier.totalReviews,
        responseTime: supplier.responseTime,
        capabilities: supplier.capabilities,
        certifications: supplier.certifications,
        factoryImages: supplier.factoryImages,
        source: 'ALIBABA',
        externalUrl: supplier.externalUrl || null,
        status: 'ACTIVE',
      },
    });

    // Creer les produits
    let productsCreated = 0;
    for (const product of supplier.products) {
      try {
        const productSlug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 200);
        let pSlug = productSlug;
        let pCounter = 1;
        while (await this.prisma.product.findUnique({ where: { slug: pSlug } })) {
          pSlug = `${productSlug}-${pCounter++}`;
        }

        // Convertir le prix USD en FCFA (taux approximatif 1 USD = 600 FCFA)
        const priceFCFA = product.price > 0 ? Math.round(product.price * 600) : 0;

        await this.prisma.product.create({
          data: {
            shopId: shop.id,
            name: product.name,
            slug: pSlug,
            description: product.description || product.name,
            price: priceFCFA > 0 ? priceFCFA : null,
            minOrderQty: product.minOrderQty || 1,
            unit: product.unit || 'piece',
            origin: supplier.country,
            mode: 'WHOLESALE',
            status: 'ACTIVE',
            isPublished: true,
            isApproved: true,
            addedBy: 'admin',
            ...(categoryId && { categoryId }),
            images: product.images.length > 0
              ? {
                  create: product.images.map((imgUrl, idx) => ({
                    url: imgUrl,
                    alt: product.name,
                    order: idx,
                    isMain: idx === 0,
                  })),
                }
              : undefined,
          },
        });
        productsCreated++;
      } catch (err) {
        this.logger.warn(`Failed to create product "${product.name}": ${err.message}`);
      }
    }

    this.logger.log(`Imported supplier "${supplier.name}": shop=${shop.id}, products=${productsCreated}`);
    return { shop, productsCreated };
  }

  /**
   * Scrape et importe en une seule operation
   */
  async scrapeAndImport(url: string, categoryId?: string) {
    const supplier = await this.scrapeSupplierPage(url);

    const result = await this.importSupplier(supplier, categoryId);
    return {
      result: true,
      data: {
        message: `Fournisseur "${supplier.name}" importe avec succes`,
        shop: result.shop,
        productsCreated: result.productsCreated,
        totalProductsScraped: supplier.products.length,
      },
    };
  }

  /**
   * Importe manuellement un fournisseur (saisie manuelle des donnees)
   */
  async importManual(data: {
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
    location?: string;
    country?: string;
    verified?: boolean;
    yearsActive?: number;
    staffCount?: string;
    factoryArea?: string;
    capabilities?: string[];
    certifications?: string[];
    factoryImages?: string[];
    externalUrl?: string;
    products?: {
      name: string;
      description?: string;
      price?: number;
      minOrderQty?: number;
      unit?: string;
      images?: string[];
    }[];
    categoryId?: string;
  }) {
    const supplier: ScrapedSupplier = {
      name: data.name,
      description: data.description || '',
      logo: data.logo || null,
      banner: data.banner || null,
      location: data.location || '',
      country: data.country || 'CN',
      verified: data.verified ?? true,
      yearsActive: data.yearsActive || 0,
      staffCount: data.staffCount || null,
      factoryArea: data.factoryArea || null,
      annualRevenue: null,
      rating: 0,
      totalReviews: 0,
      responseTime: null,
      capabilities: data.capabilities || [],
      certifications: data.certifications || [],
      factoryImages: data.factoryImages || [],
      externalUrl: data.externalUrl || '',
      products: (data.products || []).map(p => ({
        name: p.name,
        description: p.description || '',
        price: p.price || 0,
        minOrderQty: p.minOrderQty || 1,
        unit: p.unit || 'piece',
        images: p.images || [],
        externalUrl: '',
      })),
    };

    return this.importSupplier(supplier, data.categoryId);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, { headers: this.FETCH_HEADERS });
      if (!response.ok) {
        this.logger.warn(`HTTP ${response.status} for ${url}`);
        return '';
      }
      return await response.text();
    } catch (err) {
      this.logger.warn(`Fetch failed for ${url}: ${err.message}`);
      return '';
    }
  }

  private normalizeImageUrl(src: string): string {
    if (src.startsWith('//')) return `https:${src}`;
    return src;
  }

  private extractProducts($: cheerio.CheerioAPI): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // Selecteurs Alibaba (testes et confirmes)
    $('.icbu-product-card, .product-item').each((_, el) => {
      const $card = $(el);

      // Nom du produit
      const name = $card.find('.product-info h4, .product-info .title, .product-info a[title], a[title]').first().text().trim()
        || $card.find('a[title]').first().attr('title') || '';
      if (!name) return;

      // Prix (format: "$2.29-2.50" ou "$5.20")
      const priceText = $card.find('[class*="price"]').first().text().trim();
      const priceMatch = priceText.match(/\$([\d,.]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

      // MOQ (format: "Min. Order: 50 sets")
      const moqText = $card.find('[class*="moq"], [class*="min-order"]').text().trim()
        || $card.text().match(/Min\.?\s*Order:?\s*(\d+)\s*(\w+)/i)?.[0] || '';
      const moqMatch = moqText.match(/(\d+)/);
      const minOrderQty = moqMatch ? parseInt(moqMatch[1], 10) : 1;

      // Unite (sets, pieces, etc.)
      const unitMatch = moqText.match(/\d+\s+(\w+)/);
      const unit = unitMatch ? unitMatch[1].toLowerCase() : 'piece';

      // Image
      const imgEl = $card.find('.product-image img, img').first();
      const imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || '';
      const images = imgSrc ? [this.normalizeImageUrl(imgSrc)] : [];

      // Lien produit
      const link = $card.find('a').first().attr('href') || '';
      const externalUrl = link ? this.normalizeImageUrl(link) : '';

      products.push({
        name,
        description: name,
        price,
        minOrderQty,
        unit,
        images,
        externalUrl,
      });
    });

    return products.slice(0, 50);
  }
}
