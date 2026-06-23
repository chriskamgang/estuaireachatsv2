import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { QuoteRfqDto } from './dto/quote-rfq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('RFQ')
@Controller('rfq')
export class RfqController {
  constructor(private rfqService: RfqService) {}

  // ── Buyer ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une demande de devis' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRfqDto,
  ) {
    return this.rfqService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes demandes de devis' })
  findByUser(@CurrentUser('id') userId: string) {
    return this.rfqService.findByUser(userId);
  }

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demandes de devis entrantes (SELLER)' })
  findForSeller(
    @CurrentUser('id') sellerId: string,
    @Query('status') status?: string,
  ) {
    return this.rfqService.findForSeller(sellerId, status);
  }

  @Get('seller/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail d\'une demande de devis (SELLER)' })
  findOneForSeller(
    @Param('id') id: string,
  ) {
    return this.rfqService.findOneForSeller(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail d\'une demande de devis' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.rfqService.findOne(userId, id);
  }

  // ── Seller ─────────────────────────────────────────────────

  @Patch(':id/quote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repondre avec un devis (SELLER)' })
  quote(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
    @Body() dto: QuoteRfqDto,
  ) {
    return this.rfqService.quote(sellerId, id, dto);
  }

  @Patch(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repondre a une demande de devis par message (SELLER)' })
  respond(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
    @Body() body: { message: string; quotedPrice?: number },
  ) {
    return this.rfqService.respond(sellerId, id, body.message, body.quotedPrice);
  }
}
