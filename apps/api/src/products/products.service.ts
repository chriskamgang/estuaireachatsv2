import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

/** Selection legere pour les listes de produits */
const productListSelect = {
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
  rating: true,
  totalReviews: true,
  totalSold: true,
  isFeatured: true,
  isWholesale: true,
  mode: true,
  status: true,
  minOrderQty: true,
  unit: true,
  rebuyRate: true,
  estShippingDays: true,
  origin: true,
  createdAt: true,
  images: {
    where: { isMain: true },
    select: { id: true, url: true, alt: true },
    take: 1,
  },
  shop: {
    select: { id: true, name: true, slug: true, logo: true, city: true, country: true, verified: true },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  brand: {
    select: { id: true, name: true, slug: true },
  },
  priceTiers: {
    select: { minQty: true, maxQty: true, price: true },
    orderBy: { minQty: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

/** Inclusion complete pour le detail d'un produit */
const productDetailInclude = {
  shop: {
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      logo: true,
      banner: true,
      city: true,
      country: true,
      verified: true,
      rating: true,
      totalReviews: true,
      totalSales: true,
      responseTime: true,
      responseRate: true,
      yearsActive: true,
    },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  brand: {
    select: { id: true, name: true, slug: true, logo: true },
  },
  images: {
    orderBy: { order: 'asc' as const },
  },
  stocks: {
    include: {
      wholesalePrices: { orderBy: { minQty: 'asc' as const } },
    },
  },
  priceTiers: {
    orderBy: { minQty: 'asc' as const },
  },
  reviews: {
    take: 10,
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      rating: true,
      comment: true,
      images: true,
      createdAt: true,
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  },
  translations: true,
  customizations: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAllAdmin(query: ProductQueryDto) {
    const { search, categoryId, brandId, shopId, sort } = query;
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(shopId && { shopId }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const adminSelect = {
      ...productListSelect,
      stocks: {
        select: { id: true, variant: true, price: true, qty: true, sku: true },
      },
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: adminSelect,
        orderBy,
        skip,
        take: perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      result: true,
      data: products,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async findAll(query: ProductQueryDto, userId?: string) {
    const { search, categoryId, brandId, shopId, minPrice, maxPrice, sort } = query;
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      status: 'ACTIVE',
      // Seuls les produits de vendeurs avec package paye (ou produits admin) sont visibles
      shop: {
        OR: [
          { sellerPackageId: { not: null } },
          { user: { role: 'ADMIN' } },
        ],
      },
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { tags: { string_contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(shopId && { shopId }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'best_selling':
        orderBy = { totalSold: 'desc' };
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productListSelect,
        orderBy,
        skip,
        take: perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Sauvegarder la recherche si l'utilisateur est connecte et qu'il y a un terme de recherche
    if (userId && search && search.trim().length > 0) {
      this.saveUserSearch(userId, search.trim(), total).catch(() => {
        // Fire-and-forget : ne bloque pas la reponse
      });
    }

    return {
      result: true,
      data: products,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Sauvegarde la recherche de l'utilisateur et garde seulement les 10 dernieres.
   */
  private async saveUserSearch(userId: string, query: string, resultsCount: number) {
    // Creer la nouvelle recherche
    await this.prisma.userSearch.create({
      data: { userId, query, resultsCount },
    });

    // Garder seulement les 10 dernieres recherches
    const searches = await this.prisma.userSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      select: { id: true },
    });

    if (searches.length > 0) {
      await this.prisma.userSearch.deleteMany({
        where: { id: { in: searches.map((s) => s.id) } },
      });
    }
  }

  async findFeatured() {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
        status: 'ACTIVE',
        shop: {
          OR: [
            { sellerPackageId: { not: null } },
            { user: { role: 'ADMIN' } },
          ],
        },
      },
      select: productListSelect,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { result: true, data: products };
  }

  async findBySlug(slug: string) {
    // Try by slug first, then by ID
    let product = await this.prisma.product.findUnique({
      where: { slug },
      include: productDetailInclude,
    });

    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { id: slug },
        include: productDetailInclude,
      });
    }

    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    // Verifier que le vendeur a un package paye (ou que c'est un produit admin)
    const shop = await this.prisma.shop.findUnique({
      where: { id: product.shopId },
      select: { sellerPackageId: true, user: { select: { role: true } } },
    });

    if (shop && !shop.sellerPackageId && shop.user?.role !== 'ADMIN') {
      throw new NotFoundException('Produit non trouve');
    }

    return { result: true, data: product };
  }

  async create(userId: string, dto: CreateProductDto, role?: string) {
    let shopId: string;

    if (role === 'ADMIN') {
      // Admin: utilise la premiere boutique ou cree une boutique admin
      let shop = await this.prisma.shop.findFirst({
        where: { user: { role: 'ADMIN' } },
      });
      if (!shop) {
        shop = await this.prisma.shop.create({
          data: {
            userId,
            name: 'EstuaireAchats Official',
            slug: 'estuaireachats-official',
            status: 'ACTIVE',
            verified: true,
          },
        });
      }
      shopId = shop.id;
    } else {
      const shop = await this.prisma.shop.findUnique({
        where: { userId },
      });
      if (!shop) {
        throw new ForbiddenException('Vous devez avoir une boutique pour creer un produit');
      }
      shopId = shop.id;
    }

    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
        '-' +
        Date.now();

    const { images, stocks, priceTiers, discountStart, discountEnd, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        shopId,
        ...(discountStart && { discountStart: new Date(discountStart) }),
        ...(discountEnd && { discountEnd: new Date(discountEnd) }),
        ...(images &&
          images.length > 0 && {
            images: {
              createMany: { data: images },
            },
          }),
        ...(stocks &&
          stocks.length > 0 && {
            stocks: {
              createMany: { data: stocks },
            },
          }),
        ...(priceTiers &&
          priceTiers.length > 0 && {
            priceTiers: {
              createMany: { data: priceTiers },
            },
          }),
      },
      include: productDetailInclude,
    });

    return { result: true, data: product };
  }

  async update(userId: string, productId: string, dto: UpdateProductDto, role?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    if (role !== 'ADMIN' && product.shop.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres produits');
    }

    const { images, stocks, priceTiers, discountStart, discountEnd, ...productData } = dto;

    // Si des images/stocks/priceTiers sont fournis, on remplace tout
    const updateOps: Prisma.ProductUpdateInput = {
      ...productData,
      ...(discountStart !== undefined && { discountStart: new Date(discountStart) }),
      ...(discountEnd !== undefined && { discountEnd: new Date(discountEnd) }),
    };

    if (images !== undefined) {
      // Supprimer les anciennes images puis creer les nouvelles
      await this.prisma.productImage.deleteMany({ where: { productId } });
      if (images.length > 0) {
        updateOps.images = { createMany: { data: images } };
      }
    }

    if (stocks !== undefined) {
      await this.prisma.productStock.deleteMany({ where: { productId } });
      if (stocks.length > 0) {
        updateOps.stocks = { createMany: { data: stocks } };
      }
    }

    if (priceTiers !== undefined) {
      await this.prisma.priceTier.deleteMany({ where: { productId } });
      if (priceTiers.length > 0) {
        updateOps.priceTiers = { createMany: { data: priceTiers } };
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: updateOps,
      include: productDetailInclude,
    });

    return { result: true, data: updated };
  }

  /**
   * Export products to CSV string
   */
  async exportProducts(scope: string): Promise<string> {
    const where: Prisma.ProductWhereInput = {};

    switch (scope) {
      case 'active':
        where.status = 'ACTIVE';
        break;
      case 'draft':
        where.status = 'DRAFT';
        break;
      case 'wholesale':
        where.isWholesale = true;
        break;
      case 'digital':
        where.isDigital = true;
        break;
      // 'all' = no filter
    }

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        status: true,
        createdAt: true,
        tags: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        stocks: { select: { sku: true, qty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Nom', 'Description', 'Prix', 'Categorie', 'Marque', 'Stock', 'SKU', 'Tags', 'Statut', 'Date creation'];
    const escCsv = (v: string) => {
      if (!v) return '';
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    };

    const rows = products.map((p) => {
      const totalStock = p.stocks.reduce((s, st) => s + st.qty, 0);
      const skus = p.stocks.map((st) => st.sku).filter(Boolean).join(';');
      return [
        p.id,
        escCsv(p.name),
        escCsv((p.description || '').substring(0, 200)),
        p.price?.toString() || '0',
        escCsv(p.category?.name || ''),
        escCsv(p.brand?.name || ''),
        totalStock.toString(),
        escCsv(skus),
        escCsv((p.tags as string[] || []).join(';')),
        p.status,
        p.createdAt.toISOString().split('T')[0],
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Import products from a CSV file
   */
  async importProducts(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      throw new NotFoundException('Le fichier CSV est vide ou invalide');
    }

    // Parse headers
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const descIdx = headers.indexOf('description');
    const priceIdx = headers.indexOf('price');
    const categoryIdx = headers.indexOf('category');
    const brandIdx = headers.indexOf('brand');
    const stockIdx = headers.indexOf('stock');
    const skuIdx = headers.indexOf('sku');
    const tagsIdx = headers.indexOf('tags');
    const statusIdx = headers.indexOf('status');

    if (nameIdx === -1) {
      throw new NotFoundException('Colonne "name" requise dans le CSV');
    }

    // Find or create admin shop
    let shop = await this.prisma.shop.findFirst({
      where: { user: { role: 'ADMIN' } },
    });
    if (!shop) {
      shop = await this.prisma.shop.create({
        data: {
          userId,
          name: 'EstuaireAchats Official',
          slug: 'estuaireachats-official',
          status: 'ACTIVE',
          verified: true,
        },
      });
    }

    // Cache categories and brands
    const categories = await this.prisma.category.findMany({ select: { id: true, name: true, slug: true } });
    const brands = await this.prisma.brand.findMany({ select: { id: true, name: true, slug: true } });
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

    let created = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        // Simple CSV parsing (handles basic cases)
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const name = cols[nameIdx];
        if (!name) {
          errors.push(`Ligne ${i + 1}: nom vide`);
          continue;
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now() + '-' + i;
        const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0;
        const categoryName = categoryIdx >= 0 ? cols[categoryIdx]?.toLowerCase() : '';
        const brandName = brandIdx >= 0 ? cols[brandIdx]?.toLowerCase() : '';
        const stockQty = stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0;
        const sku = skuIdx >= 0 ? cols[skuIdx] || '' : '';
        const tags = tagsIdx >= 0 ? (cols[tagsIdx] || '').split(';').filter(Boolean) : [];
        const status = statusIdx >= 0 ? (cols[statusIdx]?.toUpperCase() || 'DRAFT') : 'DRAFT';

        const validStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];
        const finalStatus = validStatuses.includes(status) ? status : 'DRAFT';

        await this.prisma.product.create({
          data: {
            name,
            slug,
            description: descIdx >= 0 ? cols[descIdx] || '' : '',
            price,
            shopId: shop.id,
            categoryId: catMap.get(categoryName) || null,
            brandId: brandMap.get(brandName) || null,
            tags,
            status: finalStatus as any,
            addedBy: 'admin',
            ...(stockQty > 0 && {
              stocks: {
                create: {
                  variant: 'default',
                  price,
                  qty: stockQty,
                  sku: sku || null,
                },
              },
            }),
          },
        });
        created++;
      } catch (err: any) {
        errors.push(`Ligne ${i + 1}: ${err.message?.substring(0, 100)}`);
      }
    }

    return {
      result: true,
      data: {
        totalLines: lines.length - 1,
        created,
        errors: errors.length,
        errorDetails: errors.slice(0, 20),
      },
    };
  }

  async remove(userId: string, productId: string, role?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    if (role !== 'ADMIN' && product.shop.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres produits');
    }

    // Soft delete : on passe le status a INACTIVE et isPublished a false
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'INACTIVE', isPublished: false },
    });

    return { result: true, data: { message: 'Produit supprime avec succes' } };
  }
}
