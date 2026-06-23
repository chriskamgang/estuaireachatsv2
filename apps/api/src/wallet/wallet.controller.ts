import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { RechargeWalletDto } from './dto/recharge-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  // ── Admin endpoints ──

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Statistiques globales wallet (admin)' })
  getAdminStats() {
    return this.walletService.getAdminStats();
  }

  @Get('admin/transactions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toutes les transactions wallet (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAdminTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('search') search?: string,
  ) {
    return this.walletService.getAdminTransactions(page, perPage, search);
  }

  @Post('admin/credit/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crediter le wallet d\'un utilisateur (admin)' })
  adminCreditUser(
    @Param('userId') userId: string,
    @Body() body: { amount: number; note?: string },
  ) {
    return this.walletService.adminCreditUser(userId, body.amount, body.note || '');
  }

  // ── User endpoints ──

  @Get('balance')
  @ApiOperation({ summary: 'Consulter le solde du wallet' })
  getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des transactions wallet (paginee)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.walletService.getHistory(userId, page, perPage);
  }

  @Post('recharge')
  @ApiOperation({ summary: 'Recharger le wallet' })
  recharge(
    @CurrentUser('id') userId: string,
    @Body() dto: RechargeWalletDto,
  ) {
    return this.walletService.recharge(userId, dto);
  }
}
