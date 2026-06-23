import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('POS')
@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private posService: PosService) {}

  @Post('sale')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Creer une vente POS (ADMIN ou SELLER)' })
  createSale(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePosSaleDto,
  ) {
    return this.posService.createSale(userId, dto);
  }
}
