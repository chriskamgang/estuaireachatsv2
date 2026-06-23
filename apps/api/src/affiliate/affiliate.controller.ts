import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Affiliate')
@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  /* ================================================================== */
  /*  BUYER ENDPOINTS                                                   */
  /* ================================================================== */

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "S'inscrire au programme d'affiliation" })
  register(@CurrentUser('sub') userId: string) {
    return this.affiliateService.register(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil affilie' })
  getMyAffiliate(@CurrentUser('sub') userId: string) {
    return this.affiliateService.getMyAffiliate(userId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes logs de parrainage (pagines)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  getMyLogs(
    @CurrentUser('sub') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.affiliateService.getMyLogs(userId, page, perPage);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demander un retrait des gains affilie' })
  requestWithdraw(
    @CurrentUser('sub') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.affiliateService.requestWithdraw(userId, amount);
  }

  /* ================================================================== */
  /*  PUBLIC ENDPOINT                                                   */
  /* ================================================================== */

  @Get('click/:code')
  @ApiOperation({ summary: 'Tracker un clic de parrainage (public)' })
  logClick(@Param('code') code: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.affiliateService.logClick(code, ip, userAgent);
  }

  /* ================================================================== */
  /*  ADMIN ENDPOINTS                                                   */
  /* ================================================================== */

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister tous les affilies (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  listAffiliates(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.affiliateService.listAffiliates(page, perPage);
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver un affilie (admin)' })
  approveAffiliate(@Param('id') id: string) {
    return this.affiliateService.approveAffiliate(id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeter un affilie (admin)' })
  rejectAffiliate(@Param('id') id: string) {
    return this.affiliateService.rejectAffiliate(id);
  }

  @Get('admin/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulter le taux de commission (admin)' })
  getConfig() {
    return this.affiliateService.getConfig();
  }

  @Patch('admin/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le taux de commission (admin)' })
  updateConfig(@Body('commissionRate') commissionRate: number) {
    return this.affiliateService.updateConfig(commissionRate);
  }
}
