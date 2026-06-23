import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import {
  UpdateKPaySettingsDto,
  UpdateGfsSettingsDto,
  UpdatePaypalSettingsDto,
} from './dto/update-payment-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // ==================== PUBLIC (no auth) ====================

  @Get('public/homepage-layout')
  @ApiOperation({ summary: 'Layout homepage selectionne (PUBLIC)' })
  async getHomepageLayout() {
    const data = await this.settingsService.getSettingByKey('admin_website_select_homepage');
    return { result: true, data: data || { selected: 'default' } };
  }

  // ==================== VUE GLOBALE ====================

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir la configuration de tous les moyens de paiement' })
  async getAllPaymentSettings() {
    return this.settingsService.getAllPaymentSettings();
  }

  // ==================== KPAY ====================

  @Get('payments/kpay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir la configuration KPay (MTN MoMo + Orange Money)' })
  async getKPay() {
    return { result: true, data: await this.settingsService.getKPaySettings() };
  }

  @Patch('payments/kpay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier la configuration KPay' })
  async updateKPay(@Body() dto: UpdateKPaySettingsDto) {
    const data = await this.settingsService.updateKPaySettings(dto);
    return { result: true, message: 'Configuration KPay mise a jour', data };
  }

  // ==================== GFS ====================

  @Get('payments/gfs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir la configuration GFSolutions' })
  async getGfs() {
    return { result: true, data: await this.settingsService.getGfsSettings() };
  }

  @Patch('payments/gfs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier la configuration GFSolutions' })
  async updateGfs(@Body() dto: UpdateGfsSettingsDto) {
    const data = await this.settingsService.updateGfsSettings(dto);
    return { result: true, message: 'Configuration GFSolutions mise a jour', data };
  }

  // ==================== PAYPAL ====================

  @Get('payments/paypal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir la configuration PayPal' })
  async getPaypal() {
    return { result: true, data: await this.settingsService.getPaypalSettings() };
  }

  @Patch('payments/paypal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier la configuration PayPal' })
  async updatePaypal(@Body() dto: UpdatePaypalSettingsDto) {
    const data = await this.settingsService.updatePaypalSettings(dto);
    return { result: true, message: 'Configuration PayPal mise a jour', data };
  }

  // ==================== COD ====================

  @Get('payments/cod')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir si le paiement a la livraison est actif' })
  async getCod() {
    const enabled = await this.settingsService.getCodEnabled();
    return { result: true, data: { enabled } };
  }

  @Patch('payments/cod')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer/desactiver le paiement a la livraison' })
  async updateCod(@Body('enabled') enabled: boolean) {
    const data = await this.settingsService.setCodEnabled(enabled);
    return { result: true, message: enabled ? 'COD active' : 'COD desactive', data };
  }

  // ==================== SELLER SETTINGS ====================

  @Get('seller/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recuperer un parametre vendeur par cle (SELLER)' })
  async getSellerSetting(
    @CurrentUser('id') userId: string,
    @Param('key') key: string,
  ) {
    const data = await this.settingsService.getSettingByKey(`seller_${userId}_${key}`);
    return { data };
  }

  @Put('seller/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sauvegarder un parametre vendeur par cle (SELLER)' })
  async updateSellerSetting(
    @CurrentUser('id') userId: string,
    @Param('key') key: string,
    @Body() body: { value: any },
  ) {
    const data = await this.settingsService.updateSettingByKey(`seller_${userId}_${key}`, body.value);
    return { data };
  }

  // ==================== GENERIC ADMIN SETTINGS ====================

  @Get('admin/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recuperer un parametre admin par cle' })
  async getSettingByKey(@Param('key') key: string) {
    const data = await this.settingsService.getSettingByKey(key);
    return { data };
  }

  @Put('admin/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer ou modifier un parametre admin par cle' })
  async updateSettingByKey(
    @Param('key') key: string,
    @Body() body: { value: any },
  ) {
    const data = await this.settingsService.updateSettingByKey(key, body.value);
    return { data };
  }

  // ==================== CACHE ====================

  @Post('reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recharger le cache des parametres depuis la DB' })
  async reloadCache() {
    return this.settingsService.reloadCache();
  }
}
