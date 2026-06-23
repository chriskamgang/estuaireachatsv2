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
import { AttributesService } from './attributes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributesController {
  constructor(private attributesService: AttributesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des attributs avec valeurs (public)' })
  findAll() {
    return this.attributesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un attribut (ADMIN)' })
  create(@Body() dto: { name: string }) {
    return this.attributesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le nom d\'un attribut (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.attributesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un attribut et ses valeurs (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.attributesService.remove(id);
  }

  @Post(':id/values')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une valeur a un attribut (ADMIN)' })
  addValue(@Param('id') id: string, @Body() dto: { value: string }) {
    return this.attributesService.addValue(id, dto);
  }

  @Delete('values/:valueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une valeur d\'attribut (ADMIN)' })
  removeValue(@Param('valueId') valueId: string) {
    return this.attributesService.removeValue(valueId);
  }
}
