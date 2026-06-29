import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WithdrawsService } from './withdraws.service';
import { CreateWithdrawDto, ProcessWithdrawDto } from './dto/create-withdraw.dto';

@ApiTags('Withdraws')
@Controller('withdraws')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawsController {
  constructor(private withdrawsService: WithdrawsService) {}

  // ==================== SELLER ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Demander un retrait (SELLER)' })
  async create(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateWithdrawDto,
  ) {
    return this.withdrawsService.create(sellerId, dto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Mes demandes de retrait + solde (SELLER)' })
  async myWithdraws(
    @CurrentUser('id') sellerId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20,
  ) {
    return this.withdrawsService.getMyWithdraws(sellerId, page, perPage);
  }

  // ==================== ADMIN ====================

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toutes les demandes de retrait (ADMIN)' })
  async listAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20,
    @Query('status') status?: string,
  ) {
    return this.withdrawsService.listAll(page, perPage, status);
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approuver un retrait et envoyer via KPay (ADMIN)' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ProcessWithdrawDto,
  ) {
    return this.withdrawsService.approve(id, adminId, dto);
  }

  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rejeter un retrait (ADMIN)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ProcessWithdrawDto,
  ) {
    return this.withdrawsService.reject(id, adminId, dto);
  }

  @Post('admin/poll')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Verifier les retraits en cours via KPay (ADMIN)' })
  async poll() {
    return this.withdrawsService.pollProcessingWithdraws();
  }
}
