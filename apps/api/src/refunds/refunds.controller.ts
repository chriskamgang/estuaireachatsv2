import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private refundsService: RefundsService) {}

  // ── Buyer ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une demande de remboursement' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.refundsService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes demandes de remboursement' })
  findByUser(@CurrentUser('id') userId: string) {
    return this.refundsService.findByUser(userId);
  }

  // ── Admin ──────────────────────────────────────────────────

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les demandes de remboursement (ADMIN)' })
  findAllAdmin() {
    return this.refundsService.findAllAdmin();
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver un remboursement (ADMIN)' })
  approveAdmin(@Param('id') id: string) {
    return this.refundsService.approveAdmin(id);
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeter un remboursement (ADMIN)' })
  rejectAdmin(@Param('id') id: string) {
    return this.refundsService.rejectAdmin(id);
  }

  // ── Seller ─────────────────────────────────────────────────

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demandes de remboursement recues (SELLER)' })
  findBySeller(@CurrentUser('id') sellerId: string) {
    return this.refundsService.findBySeller(sellerId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver un remboursement et crediter le wallet (SELLER)' })
  approve(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
  ) {
    return this.refundsService.approve(sellerId, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeter un remboursement (SELLER)' })
  reject(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
  ) {
    return this.refundsService.reject(sellerId, id);
  }
}
