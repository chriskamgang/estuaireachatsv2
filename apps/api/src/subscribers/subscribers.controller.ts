import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscribersService } from './subscribers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Subscribers')
@Controller('subscribers')
export class SubscribersController {
  constructor(private subscribersService: SubscribersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des abonnes newsletter (ADMIN, pagine)' })
  findAll(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.subscribersService.findAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Post()
  @ApiOperation({ summary: 'S\'inscrire a la newsletter (public)' })
  subscribe(@Body() dto: { email: string; name?: string }) {
    return this.subscribersService.subscribe(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un abonne (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.subscribersService.remove(id);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer/desactiver un abonne (ADMIN)' })
  toggleActive(@Param('id') id: string) {
    return this.subscribersService.toggleActive(id);
  }

  @Post('newsletter/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer une newsletter (ADMIN)' })
  sendNewsletter(@Body() dto: { titre: string; message: string; cible: string; type: string }) {
    return this.subscribersService.sendNewsletter(dto);
  }

  @Get('newsletter/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des newsletters envoyees (ADMIN)' })
  getNewsletterHistory(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.subscribersService.getNewsletterHistory(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }
}
