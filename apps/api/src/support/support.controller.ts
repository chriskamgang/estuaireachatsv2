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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  // ── User / Seller Tickets ───────────────────────────────

  @Get('tickets/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes tickets support (auth)' })
  findMyTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.supportService.findTicketsByUser(
      userId,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un ticket support (auth)' })
  createTicket(
    @CurrentUser('id') userId: string,
    @Body() body: { subject: string; description: string; priority?: string },
  ) {
    return this.supportService.createTicket(userId, body);
  }

  // ── Seller Product Queries ──────────────────────────────

  @Get('queries/seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Questions sur mes produits (SELLER)' })
  findSellerQueries(
    @CurrentUser('id') sellerId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.supportService.findQueriesBySeller(
      sellerId,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Patch('queries/seller/:id/answer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repondre a une question produit (SELLER)' })
  sellerAnswerQuery(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
    @Body('answer') answer: string,
  ) {
    return this.supportService.sellerAnswerQuery(sellerId, id, answer);
  }

  // ── Admin Tickets ───────────────────────────────────────

  @Get('tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des tickets support (ADMIN)' })
  findAllTickets(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('status') status?: string,
  ) {
    return this.supportService.findAllTickets(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
      status,
    );
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le statut d\'un ticket (ADMIN)' })
  updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status);
  }

  // ── Product Queries ───────────────────────────────────────

  @Get('queries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des questions produits (ADMIN)' })
  findAllQueries(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.supportService.findAllQueries(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Patch('queries/:id/answer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repondre a une question produit (ADMIN)' })
  answerQuery(
    @Param('id') id: string,
    @Body('answer') answer: string,
  ) {
    return this.supportService.answerQuery(id, answer);
  }
}
