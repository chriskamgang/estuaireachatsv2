import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Liste paginee des produits avec filtres (public)' })
  findAll(
    @Query() query: ProductQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.productsService.findAll(query, userId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tous les produits sans filtre (ADMIN)' })
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exporter les produits en CSV (ADMIN)' })
  async exportProducts(
    @Query('format') format: string = 'csv',
    @Query('scope') scope: string = 'all',
    @Res() res: Response,
  ) {
    const csv = await this.productsService.exportProducts(scope);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=produits-${scope}-${Date.now()}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel compatibility
  }

  @Get('admin/import-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Telecharger le template CSV d\'import produits (ADMIN/SELLER)' })
  downloadImportTemplate(@Res() res: Response) {
    const headers = ['name', 'description', 'price', 'category', 'brand', 'stock', 'sku', 'tags', 'status'];
    const exampleRow = ['Exemple Produit', 'Description du produit', '15000', 'electronique', 'Samsung', '100', 'SKU-001', 'tag1;tag2', 'DRAFT'];
    const csv = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=template-import-produits.csv');
    res.send('\uFEFF' + csv);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'SELLER')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importer des produits depuis un CSV (ADMIN/SELLER)' })
  async importProducts(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.importProducts(userId, file);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Produits mis en avant (public)' })
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detail complet d\'un produit par slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un produit (SELLER ou ADMIN)' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(userId, dto, role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un produit (SELLER ou ADMIN)' })
  update(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(userId, id, dto, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un produit - soft delete (SELLER ou ADMIN)' })
  remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(userId, id, role);
  }
}
