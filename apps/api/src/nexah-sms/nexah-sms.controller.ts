import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NexahSmsService } from './nexah-sms.service';

@ApiTags('SMS (Admin)')
@Controller('sms')
export class NexahSmsController {
  constructor(private nexahSmsService: NexahSmsService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recuperer la configuration Nexah SMS' })
  async getConfig() {
    const data = await this.nexahSmsService.getConfig();
    return { result: true, data };
  }

  @Put('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier la configuration Nexah SMS' })
  async saveConfig(
    @Body()
    body: {
      user?: string;
      password?: string;
      senderid?: string;
      enabled?: boolean;
      webhookUrl?: string;
    },
  ) {
    const data = await this.nexahSmsService.saveConfig(body);
    return { result: true, message: 'Configuration Nexah SMS mise a jour', data };
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir le solde SMS Nexah' })
  async getBalance() {
    const data = await this.nexahSmsService.getBalance();
    return { result: true, data };
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer un SMS en masse' })
  async sendSms(
    @Body()
    body: {
      mobiles: string[];
      message: string;
      senderid?: string;
    },
  ) {
    const result = await this.nexahSmsService.sendBulkSms(
      body.mobiles,
      body.message,
      body.senderid,
    );
    return { result: true, data: result };
  }

  @Post('send-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer un SMS de test a un seul numero' })
  async sendTestSms(
    @Body()
    body: {
      mobile: string;
      message: string;
    },
  ) {
    const result = await this.nexahSmsService.sendSms(body.mobile, body.message);
    return { result: true, data: result };
  }

  // ==================== PUBLIC WEBHOOK ====================

  @Post('webhook/nexah-dr')
  @ApiOperation({ summary: 'Webhook de reception des rapports de livraison Nexah' })
  async deliveryReportWebhook(
    @Body()
    body: {
      dlrlist: Array<{
        reponsecode: string;
        status: string;
        messageid: string;
        mobileno: string;
        submittime: string;
        senttime: string;
        deliverytime: string;
      }>;
    },
  ) {
    const data = this.nexahSmsService.handleDeliveryReport(body.dlrlist);
    return { result: true, data };
  }
}
