import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  // ── Buyer ──────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes coupons disponibles (BUYER)' })
  getMyCoupons(@CurrentUser('id') userId: string) {
    return this.couponsService.getMyCoupons(userId);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Appliquer un coupon sur le panier' })
  apply(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.couponsService.apply(userId, dto.code);
  }

  @Post('remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirer le coupon du panier' })
  removeCoupon(@CurrentUser('id') userId: string) {
    return this.couponsService.remove(userId);
  }

  // ── Admin ──────────────────────────────────────────────────

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste de tous les coupons (ADMIN)' })
  findAllAdmin() {
    return this.couponsService.findAllAdmin();
  }

  // ── Seller CRUD ────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes coupons (SELLER)' })
  findBySeller(@CurrentUser('id') sellerId: string) {
    return this.couponsService.findBySeller(sellerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un coupon (SELLER)' })
  create(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateCouponDto,
  ) {
    return this.couponsService.create(sellerId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un coupon (SELLER)' })
  update(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(sellerId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un coupon (SELLER)' })
  deleteCoupon(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
  ) {
    return this.couponsService.deleteCoupon(sellerId, id);
  }
}
