import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Statut de la connexion WhatsApp + QR code' })
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('connect')
  @ApiOperation({ summary: 'Demarrer la connexion WhatsApp (genere le QR)' })
  async connect() {
    await this.whatsappService.connect();
    // Attendre un peu pour le QR
    await new Promise((r) => setTimeout(r, 2000));
    return this.whatsappService.getStatus();
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Deconnecter WhatsApp et supprimer la session' })
  async disconnect() {
    await this.whatsappService.disconnect();
    return { message: 'WhatsApp deconnecte' };
  }
}
