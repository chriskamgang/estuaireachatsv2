import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClubPointsService } from './club-points.service';
import { ConvertPointsDto } from './dto/convert-points.dto';
import { UpdateClubPointsConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('ClubPoints')
@Controller('club-points')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClubPointsController {
  constructor(private clubPointsService: ClubPointsService) {}

  // ─── BUYER ───────────────────────────────────────────────

  @Get()
  @Roles('BUYER')
  @ApiOperation({ summary: 'Consulter mon solde de points et historique recent' })
  getMyPoints(@CurrentUser('id') userId: string) {
    return this.clubPointsService.getMyPoints(userId);
  }

  @Post('convert')
  @Roles('BUYER')
  @ApiOperation({ summary: 'Convertir des points en solde wallet (1 point = X FCFA)' })
  convertToWallet(
    @CurrentUser('id') userId: string,
    @Body() dto: ConvertPointsDto,
  ) {
    return this.clubPointsService.convertToWallet(userId, dto.points);
  }

  @Get('history')
  @Roles('BUYER')
  @ApiOperation({ summary: 'Historique des points (pagine)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  getPointsHistory(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.clubPointsService.getPointsHistory(userId, page, perPage);
  }

  // ─── ADMIN ──────────────────────────────────────────────

  @Get('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Consulter la configuration Club Points (taux de gain et conversion)' })
  getConfig() {
    return this.clubPointsService.getConfig();
  }

  @Patch('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Modifier les taux de gain et/ou conversion des points' })
  async updateConfig(@Body() dto: UpdateClubPointsConfigDto) {
    if (dto.earnRate !== undefined) {
      await this.clubPointsService.updatePointsEarnRate(dto.earnRate);
    }
    if (dto.conversionRate !== undefined) {
      await this.clubPointsService.updateConversionRate(dto.conversionRate);
    }
    return this.clubPointsService.getConfig();
  }
}
