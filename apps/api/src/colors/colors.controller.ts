import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ColorsService } from './colors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Colors')
@Controller('colors')
export class ColorsController {
  constructor(private colorsService: ColorsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des couleurs (public)' })
  findAll() {
    return this.colorsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une couleur (ADMIN)' })
  create(@Body() dto: { name: string; code: string }) {
    return this.colorsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une couleur (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: { name?: string; code?: string }) {
    return this.colorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une couleur (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.colorsService.remove(id);
  }
}
