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
import { SizeGuidesService } from './size-guides.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Size Guides')
@Controller('size-guides')
export class SizeGuidesController {
  constructor(private sizeGuidesService: SizeGuidesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des guides de tailles (public)' })
  findAll() {
    return this.sizeGuidesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un guide de taille (ADMIN)' })
  create(@Body() dto: { name: string; category: string; sizes: any }) {
    return this.sizeGuidesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un guide de taille (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: { name?: string; category?: string; sizes?: any }) {
    return this.sizeGuidesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un guide de taille (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.sizeGuidesService.remove(id);
  }
}
