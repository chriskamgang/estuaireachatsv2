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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SellerPackagesService } from './seller-packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { SubscribePackageDto } from './dto/subscribe-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('SellerPackages')
@Controller('seller-packages')
export class SellerPackagesController {
  constructor(private service: SellerPackagesService) {}

  // ── PUBLIC ───────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste des packages vendeur (public)' })
  listPackages() {
    return this.service.listPackages();
  }

  // ── SELLER (must be before :id to avoid route conflict) ──

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon abonnement actuel (SELLER)' })
  getMySubscription(@CurrentUser('sub') userId: string) {
    return this.service.getMySubscription(userId);
  }

  @Get('my-purchases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique de mes achats de packages (SELLER)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  getMyPurchases(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.service.getMyPurchases(
      userId,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: "S'abonner a un package (SELLER)" })
  subscribe(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubscribePackageDto,
  ) {
    return this.service.subscribe(userId, dto.packageId, dto.paymentMethod);
  }

  // ── ADMIN PAYMENTS ───────────────────────────────────────

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des paiements packages (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  listPayments(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.service.listPayments(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Patch('payments/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver un paiement package (ADMIN)' })
  approvePayment(@Param('id') id: string) {
    return this.service.approvePayment(id);
  }

  // ── PUBLIC (detail) ──────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: "Detail d'un package (public)" })
  getPackage(@Param('id') id: string) {
    return this.service.getPackage(id);
  }

  // ── ADMIN CRUD ───────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un package (ADMIN)' })
  createPackage(@Body() dto: CreatePackageDto) {
    return this.service.createPackage(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un package (ADMIN)' })
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.service.updatePackage(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer (desactiver) un package (ADMIN)' })
  deletePackage(@Param('id') id: string) {
    return this.service.deletePackage(id);
  }
}
