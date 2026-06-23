import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Shops')
@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  // ── PUBLIC ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste des boutiques actives (public)' })
  findAll(@Query('verified') verified?: string) {
    return this.shopsService.findAll(verified === 'true' ? true : undefined);
  }

  // ── SELLER (avant :slug pour eviter conflit de route) ──────────

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ma boutique avec stats (SELLER)' })
  getMyShop(@CurrentUser('id') userId: string) {
    return this.shopsService.getMyShop(userId);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard complet du vendeur (SELLER)' })
  getSellerDashboard(@CurrentUser('id') userId: string) {
    return this.shopsService.getSellerDashboard(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier ma boutique (SELLER)' })
  updateMyShop(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.updateMyShop(userId, dto);
  }

  // ── ADMIN (avant :slug pour eviter conflit de route) ────────────

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les boutiques (ADMIN)' })
  findAllAdmin() {
    return this.shopsService.findAllAdmin();
  }

  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une boutique (ADMIN)' })
  adminCreateShop(@Body() body: any) {
    return this.shopsService.adminCreateShop(body);
  }

  // ── PUBLIC (par slug) ─────────────────────────────────────────

  @Get(':slug')
  @ApiOperation({ summary: 'Detail boutique + produits par slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.shopsService.findBySlug(slug);
  }

  // ── FOLLOW / UNFOLLOW (auth) ──────────────────────────────────

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suivre une boutique (auth)' })
  follow(
    @Param('id') shopId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.shopsService.followShop(shopId, userId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ne plus suivre une boutique (auth)' })
  unfollow(
    @Param('id') shopId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.shopsService.unfollowShop(shopId, userId);
  }

  // ── ADMIN (actions sur boutique existante) ──────────────────────

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifier une boutique (ADMIN)' })
  verify(@Param('id') id: string) {
    return this.shopsService.verifyShop(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le statut d\'une boutique (ADMIN)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.shopsService.updateShopStatus(id, status);
  }
}
