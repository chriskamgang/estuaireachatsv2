import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FlashDealsService } from './flash-deals.service';
import {
  CreateFlashDealDto,
  UpdateFlashDealDto,
  AddFlashDealProductDto,
} from './dto/create-flash-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('FlashDeals')
@Controller('flash-deals')
export class FlashDealsController {
  constructor(private flashDealsService: FlashDealsService) {}

  // ── Public ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Ventes flash actives (PUBLIC)' })
  getActiveDeals() {
    return this.flashDealsService.getActiveDeals();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les ventes flash paginées (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, example: 15 })
  listAllDeals(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.flashDealsService.listAllDeals(
      page ? +page : 1,
      perPage ? +perPage : 15,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail d\'une vente flash (PUBLIC)' })
  getDealDetail(@Param('id') id: string) {
    return this.flashDealsService.getDealDetail(id);
  }

  // ── Admin ───────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une vente flash (ADMIN)' })
  createDeal(@Body() dto: CreateFlashDealDto) {
    return this.flashDealsService.createDeal(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une vente flash (ADMIN)' })
  updateDeal(@Param('id') id: string, @Body() dto: UpdateFlashDealDto) {
    return this.flashDealsService.updateDeal(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une vente flash (ADMIN)' })
  deleteDeal(@Param('id') id: string) {
    return this.flashDealsService.deleteDeal(id);
  }

  @Post(':id/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un produit a la vente flash (ADMIN)' })
  addProduct(
    @Param('id') dealId: string,
    @Body() dto: AddFlashDealProductDto,
  ) {
    return this.flashDealsService.addProduct(dealId, dto);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirer un produit de la vente flash (ADMIN)' })
  removeProduct(
    @Param('id') dealId: string,
    @Param('productId') productId: string,
  ) {
    return this.flashDealsService.removeProduct(dealId, productId);
  }
}
