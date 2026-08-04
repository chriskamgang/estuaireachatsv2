import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CallCenterService } from './call-center.service';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Call Center')
@Controller('call-center')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CALL_CENTER', 'ADMIN')
@ApiBearerAuth()
export class CallCenterController {
  constructor(private callCenterService: CallCenterService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard call center' })
  getDashboard() {
    return this.callCenterService.getDashboard();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Liste des commandes (pagine, filtrable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.callCenterService.findOrders(page, perPage, status, search);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Detail d\'une commande' })
  findOrderDetail(@Param('id') id: string) {
    return this.callCenterService.findOrderDetail(id);
  }

  @Post('call-logs')
  @ApiOperation({ summary: 'Enregistrer un appel' })
  createCallLog(
    @CurrentUser('id') agentId: string,
    @Body() dto: CreateCallLogDto,
  ) {
    return this.callCenterService.createCallLog(agentId, dto);
  }

  @Get('call-logs')
  @ApiOperation({ summary: 'Journal des appels' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findCallLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @CurrentUser('id') agentId: string,
  ) {
    return this.callCenterService.findCallLogs(page, perPage, agentId);
  }

  @Get('call-logs/all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tous les appels (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findAllCallLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.callCenterService.findCallLogs(page, perPage);
  }

  @Get('callbacks')
  @ApiOperation({ summary: 'Rappels planifies' })
  findScheduledCallbacks(@CurrentUser('id') agentId: string) {
    return this.callCenterService.findScheduledCallbacks(agentId);
  }
}
