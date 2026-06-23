import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WarrantiesService } from './warranties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Warranties')
@Controller('warranties')
export class WarrantiesController {
  constructor(private warrantiesService: WarrantiesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des garanties (public)' })
  findAll() {
    return this.warrantiesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une garantie (ADMIN)' })
  create(@Body() dto: { name: string; duration: string }) {
    return this.warrantiesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une garantie (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.warrantiesService.remove(id);
  }
}
