import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlibabaScraperService } from './alibaba-scraper.service';
import { AlibabaApiService } from './alibaba-api.service';
import { AlibabaImportService } from './alibaba-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Alibaba Import')
@Controller('alibaba')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AlibabaController {
  constructor(
    private scraperService: AlibabaScraperService,
    private apiService: AlibabaApiService,
    private importService: AlibabaImportService,
    private prisma: PrismaService,
  ) {}

  // ── STATUS ───────────────────────────────────────────────────────

  @Get('status')
  @ApiOperation({ summary: 'Statut de l\'API Alibaba Open Platform' })
  async getStatus() {
    return this.apiService.getStatus();
  }

  // ── SCRAPING (disponible maintenant) ─────────────────────────────

  @Post('scrape')
  @ApiOperation({ summary: '[SCRAPING] Preview d\'un fournisseur Alibaba sans import' })
  async scrapeSupplier(@Body() body: { url: string }) {
    const supplier = await this.scraperService.scrapeSupplierPage(body.url);
    return { result: true, data: supplier };
  }

  @Post('scrape/import')
  @ApiOperation({ summary: '[SCRAPING] Scraper et importer un fournisseur Alibaba' })
  async scrapeAndImport(@Body() body: { url: string; categoryId?: string }) {
    return this.scraperService.scrapeAndImport(body.url, body.categoryId);
  }

  @Post('scrape/import-manual')
  @ApiOperation({ summary: '[SCRAPING] Importer manuellement un fournisseur' })
  async importManual(
    @Body() body: {
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
    },
  ) {
    const result = await this.scraperService.importManual(body);
    return {
      result: true,
      data: {
        message: `Fournisseur "${body.name}" importe avec succes`,
        shop: result.shop,
        productsCreated: result.productsCreated,
      },
    };
  }

  // ── API OFFICIELLE (disponible apres approbation) ─────────────────

  @Get('api/categories')
  @ApiOperation({ summary: '[API] Liste des categories Alibaba' })
  async getCategories(@Query('parentId') parentId?: string) {
    return {
      result: true,
      data: await this.apiService.getCategories(parentId ? parseInt(parentId) : undefined),
    };
  }

  @Get('api/search/products')
  @ApiOperation({ summary: '[API] Rechercher des produits Alibaba' })
  async searchProducts(
    @Query('keyword') keyword: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
  ) {
    return {
      result: true,
      data: await this.apiService.searchProducts({
        keyword,
        categoryId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        priceMin: priceMin ? parseFloat(priceMin) : undefined,
        priceMax: priceMax ? parseFloat(priceMax) : undefined,
      }),
    };
  }

  @Get('api/search/suppliers')
  @ApiOperation({ summary: '[API] Rechercher des fournisseurs Alibaba' })
  async searchSuppliers(
    @Query('keyword') keyword: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return {
      result: true,
      data: await this.apiService.searchSuppliers({
        keyword,
        country,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      }),
    };
  }

  @Get('api/supplier/:loginId')
  @ApiOperation({ summary: '[API] Infos d\'un fournisseur par son loginId' })
  async getSupplier(@Param('loginId') loginId: string) {
    return {
      result: true,
      data: await this.apiService.getSupplierInfo(loginId),
    };
  }

  @Post('api/import/supplier')
  @ApiOperation({ summary: '[API] Importer un fournisseur Alibaba par loginId' })
  async importSupplierByApi(
    @Body() body: { loginId: string; categoryId?: string; maxProducts?: number },
  ) {
    return this.importService.importSupplierByLoginId(body.loginId, {
      categoryId: body.categoryId,
      maxProducts: body.maxProducts,
    });
  }

  @Post('api/import/keyword')
  @ApiOperation({ summary: '[API] Importer des fournisseurs par mot-cle' })
  async importByKeyword(
    @Body() body: {
      keyword: string;
      categoryId?: string;
      country?: string;
      maxSuppliers?: number;
      maxProductsPerSupplier?: number;
    },
  ) {
    return this.importService.importSuppliersByKeyword(body.keyword, body);
  }

  @Post('api/import/products')
  @ApiOperation({ summary: '[API] Importer des produits dans une boutique existante' })
  async importProductsToShop(
    @Body() body: {
      shopId: string;
      keyword: string;
      categoryId?: string;
      page?: number;
      pageSize?: number;
      priceMin?: number;
      priceMax?: number;
    },
  ) {
    return this.importService.importProductsBySearch(body.shopId, body);
  }

  @Post('api/sync/:shopId')
  @ApiOperation({ summary: '[API] Synchroniser les prix d\'une boutique Alibaba' })
  async syncShop(@Param('shopId') shopId: string) {
    return this.importService.syncShop(shopId);
  }

  // ── GESTION DES BOUTIQUES IMPORTEES ──────────────────────────────

  @Get('shops')
  @ApiOperation({ summary: 'Lister les boutiques importees depuis Alibaba' })
  async listImportedShops(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: { source: 'ALIBABA' },
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.shop.count({ where: { source: 'ALIBABA' } }),
    ]);

    return {
      result: true,
      data: shops,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    };
  }

  @Delete('shops/:id')
  @ApiOperation({ summary: 'Supprimer une boutique importee et son utilisateur fictif' })
  async deleteImportedShop(@Param('id') shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, source: true, userId: true },
    });

    if (!shop) return { result: false, message: 'Boutique introuvable' };
    if (shop.source !== 'ALIBABA') {
      return { result: false, message: 'Seules les boutiques Alibaba peuvent etre supprimees ici' };
    }

    await this.prisma.shop.delete({ where: { id: shopId } });
    await this.prisma.user.delete({ where: { id: shop.userId } }).catch(() => {});

    return { result: true, data: { message: `Boutique "${shop.name}" supprimee` } };
  }
}
