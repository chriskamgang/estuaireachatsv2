import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { EstimateShippingDto } from './dto/estimate-shipping.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(private shippingService: ShippingService) {}

  // ─── ENDPOINTS EXISTANTS ─────────────────────────────────────

  @Get('carriers')
  @ApiOperation({ summary: 'Liste des transporteurs actifs (public)' })
  getCarriers() {
    return this.shippingService.getCarriers();
  }

  @Get('pickup-points')
  @ApiOperation({ summary: 'Liste des points de retrait actifs (public)' })
  getPickupPoints() {
    return this.shippingService.getPickupPoints();
  }

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculer les frais de livraison (carriers internes)' })
  calculate(
    @CurrentUser('id') userId: string,
    @Body() dto: CalculateShippingDto,
  ) {
    return this.shippingService.calculate(userId, dto);
  }

  // ─── MERCI E ENDPOINTS ───────────────────────────────────────

  @Post('estimate')
  @ApiOperation({ summary: 'Estimer les frais de livraison via Merci E (GPS)' })
  @HttpCode(HttpStatus.OK)
  async estimate(@Body() dto: EstimateShippingDto) {
    return this.shippingService.estimateShipping(dto);
  }

  @Post('dispatch/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Declencher la livraison Merci E (admin/seller)' })
  async dispatch(@Param('orderId') orderId: string) {
    return this.shippingService.dispatchOrder(orderId);
  }

  @Get('tracking/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suivi de livraison d\'une commande' })
  async tracking(@Param('orderId') orderId: string) {
    return this.shippingService.getOrderTracking(orderId);
  }

  @Get('package-types')
  @ApiOperation({ summary: 'Types de colis disponibles (Merci E)' })
  async packageTypes() {
    return this.shippingService.getPackageTypes();
  }

  @Get('goods-types')
  @ApiOperation({ summary: 'Types de marchandises (Merci E)' })
  async goodsTypes() {
    return this.shippingService.getGoodsTypes();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Merci E (mise a jour statut livraison)' })
  async webhook(
    @Body() body: any,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    // Verifier le secret du webhook si configure
    const expectedSecret = process.env.MERCI_E_WEBHOOK_SECRET;
    if (expectedSecret && webhookSecret !== expectedSecret) {
      this.logger.warn('Webhook Merci E: secret invalide');
      throw new UnauthorizedException('Secret webhook invalide');
    }

    this.logger.log(`Webhook Merci E recu: ${JSON.stringify(body)}`);

    // Extraire le requestId et le statut du payload
    // Le format exact depend de l'API Merci E
    const requestId =
      body.request_id || body.requestId || body.data?.request_id || body.data?.requestId;
    const status =
      body.status || body.data?.status || body.delivery_status || body.data?.delivery_status;

    if (!requestId || !status) {
      this.logger.warn(
        `Webhook Merci E: payload incomplet - requestId=${requestId}, status=${status}`,
      );
      return { result: false, message: 'Payload incomplet: requestId et status requis' };
    }

    return this.shippingService.updateDeliveryStatus(requestId, status);
  }
}
