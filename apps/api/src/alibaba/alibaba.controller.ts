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
    private prisma: PrismaService,
  ) {}

  @Post('scrape')
  @ApiOperation({ summary: 'Scraper un fournisseur Alibaba (preview sans import)' })
  async scrapeSupplier(@Body() body: { url: string }) {
    const supplier = await this.scraperService.scrapeSupplierPage(body.url);
    return { result: true, data: supplier };
  }

  @Post('import')
  @ApiOperation({ summary: 'Scraper et importer un fournisseur Alibaba' })
  async importSupplier(
    @Body() body: { url: string; categoryId?: string },
  ) {
    return this.scraperService.scrapeAndImport(body.url, body.categoryId);
  }

  @Post('import-manual')
  @ApiOperation({ summary: 'Importer manuellement un fournisseur (saisie manuelle)' })
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
        include: {
          _count: { select: { products: true } },
        },
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

    if (!shop) {
      return { result: false, message: 'Boutique introuvable' };
    }
    if (shop.source !== 'ALIBABA') {
      return { result: false, message: 'Seules les boutiques Alibaba peuvent etre supprimees via cette route' };
    }

    // Supprimer la boutique (cascade supprimera les produits)
    // Puis supprimer l'utilisateur fictif
    await this.prisma.shop.delete({ where: { id: shopId } });
    await this.prisma.user.delete({ where: { id: shop.userId } }).catch(() => {
      // L'utilisateur peut avoir ete deja supprime par cascade
    });

    return { result: true, data: { message: `Boutique "${shop.name}" supprimee` } };
  }
}
