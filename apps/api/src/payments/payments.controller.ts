import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  RawBodyRequest,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { KPayService } from './kpay.service';
import { GfsService } from './gfs.service';
import { InitPaymentDto } from './dto/init-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private kpayService: KPayService,
    private gfsService: GfsService,
  ) {}

  // ==================== ACHETEUR ====================

  @Post('init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier le paiement d\'une commande' })
  async initPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitPaymentDto,
  ) {
    return this.paymentsService.initPayment(userId, dto);
  }

  @Get('status/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifier le statut d\'un paiement (avec polling KPay)' })
  async checkStatus(
    @CurrentUser('id') userId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.checkPaymentStatus(userId, paymentId);
  }

  // ==================== WEBHOOK KPAY ====================

  @Post('webhook/kpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook KPay (notification statut paiement)' })
  async kpayWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['x-kpay-signature'] as string;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleKPayWebhook(req.body, rawBody, signature);
  }

  // ==================== WEBHOOK GFS ====================

  @Post('webhook/gfs')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook GFSolutions (notification statut paiement)' })
  async gfsWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['x-gfs-signature'] as string;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleGfsWebhook(req.body, rawBody, signature);
  }

  // ==================== RETOUR PASSERELLE ====================

  @Get('gateway/return')
  @ApiOperation({ summary: 'Retour passerelle KPay (redirect apres paiement)' })
  async gatewayReturn(
    @Query('status') status: string,
    @Query('reference') reference: string,
    @Query('externalId') externalId: string,
    @Query('ts') ts: string,
    @Query('sig') sig: string,
  ) {
    return this.paymentsService.handleGatewayReturn({
      status,
      reference,
      externalId,
      ts,
      sig,
    });
  }

  // ==================== POLLING MANUEL (dev/debug) ====================

  @Post('poll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Forcer le polling des paiements PENDING (ADMIN)' })
  async pollPending() {
    return this.paymentsService.pollPendingPayments();
  }

  // ==================== UTILITAIRES KPAY ====================

  @Post('predict-provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deviner l\'operateur Mobile Money d\'un numero' })
  async predictProvider(@Body('phoneNumber') phoneNumber: string) {
    return this.kpayService.predictProvider(phoneNumber);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Disponibilite des operateurs Mobile Money' })
  async availability() {
    return this.kpayService.getAvailability();
  }

  // ==================== VENDEUR ====================

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des paiements recus (SELLER)' })
  async sellerPayments(
    @CurrentUser('id') sellerId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20,
  ) {
    return this.paymentsService.getSellerPayments(sellerId, page, perPage);
  }

  // ==================== ADMIN ====================

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques de paiement (ADMIN)' })
  async paymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solde wallet KPay (ADMIN)' })
  async kpayBalance() {
    return this.kpayService.getBalance();
  }
}
