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
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DeliveryService } from './delivery.service';
import { MerciEService } from './merci-e.service';
import { CreateDeliveryRequestDto, EstimateDeliveryDto } from './dto/create-delivery.dto';

@ApiTags('Delivery (Merci E)')
@Controller('delivery')
export class DeliveryController {
  constructor(
    private deliveryService: DeliveryService,
    private merciEService: MerciEService,
  ) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimer le cout de livraison' })
  async estimate(@Body() dto: EstimateDeliveryDto) {
    return this.deliveryService.estimate(dto);
  }

  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demander une livraison via Merci E (SELLER)' })
  async createDelivery(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateDeliveryRequestDto,
  ) {
    return this.deliveryService.createDelivery(sellerId, dto);
  }

  @Get('track/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suivre une livraison en temps reel' })
  async track(@Param('requestId') requestId: string) {
    return this.deliveryService.trackDelivery(requestId);
  }

  @Post('cancel/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annuler une livraison (SELLER)' })
  async cancel(
    @CurrentUser('id') sellerId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.deliveryService.cancelDelivery(sellerId, orderId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifier si Merci E est configure (ADMIN)' })
  async status() {
    const configured = await this.merciEService.isConfigured();
    return { result: true, data: { configured } };
  }

  // ==================== WEBHOOK MERCI E ====================

  @Post('webhook/merci-e')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook Merci E (mise a jour statut livraison)' })
  async merciEWebhook(@Body() event: any) {
    return this.deliveryService.handleWebhook(event);
  }

  // ==================== DELIVERY BOYS CRUD (ADMIN) ====================

  @Get('boys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des livreurs (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllDeliveryBoys(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
  ) {
    return this.deliveryService.findAllDeliveryBoys(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      search,
    );
  }

  @Post('boys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un livreur (ADMIN)' })
  async createDeliveryBoy(
    @Body() dto: { firstName: string; lastName: string; email?: string; phone?: string; password?: string },
  ) {
    return this.deliveryService.createDeliveryBoy(dto);
  }

  @Patch('boys/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un livreur (ADMIN)' })
  async updateDeliveryBoy(
    @Param('id') id: string,
    @Body() dto: { firstName?: string; lastName?: string; email?: string; phone?: string; status?: string },
  ) {
    return this.deliveryService.updateDeliveryBoy(id, dto);
  }

  @Delete('boys/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un livreur (ADMIN)' })
  async removeDeliveryBoy(@Param('id') id: string) {
    return this.deliveryService.removeDeliveryBoy(id);
  }

  @Patch('boys/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer/desactiver un livreur (ADMIN)' })
  async toggleDeliveryBoyStatus(@Param('id') id: string) {
    return this.deliveryService.toggleDeliveryBoyStatus(id);
  }
}
