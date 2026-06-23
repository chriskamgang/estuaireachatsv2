import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private fcmService: FcmService,
  ) {}

  // ---------------------------------------------------------------
  // Endpoints utilisateur
  // ---------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Mes notifications (paginee)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.notificationsService.findAll(userId, page, perPage);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(userId, id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Post('register-token')
  @ApiOperation({ summary: 'Enregistrer le token FCM de l\'appareil' })
  @ApiBody({ schema: { properties: { token: { type: 'string' } }, required: ['token'] } })
  registerToken(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    return this.notificationsService.registerFcmToken(userId, token);
  }

  // ---------------------------------------------------------------
  // Endpoints admin
  // ---------------------------------------------------------------

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Lister toutes les notifications envoyees' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  adminList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ) {
    return this.notificationsService.adminList(page, perPage);
  }

  @Post('admin/send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Envoyer une notification a un user specifique' })
  @ApiBody({
    schema: {
      properties: {
        userId: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        type: { type: 'string', enum: Object.values(NotificationType) },
        data: { type: 'object' },
      },
      required: ['userId', 'title', 'body'],
    },
  })
  adminSend(
    @Body('userId') userId: string,
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('type') type: NotificationType,
    @Body('data') data?: Record<string, string>,
  ) {
    return this.notificationsService.create(userId, title, body, type, data);
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Diffuser une notification a tous les users (ou par role)' })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        type: { type: 'string', enum: Object.values(NotificationType) },
        data: { type: 'object' },
        role: { type: 'string', description: 'Filtrer par role (optionnel)' },
        topic: { type: 'string', description: 'Topic FCM (optionnel, prioritaire sur role)' },
      },
      required: ['title', 'body'],
    },
  })
  adminBroadcast(
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('type') type: NotificationType,
    @Body('data') data?: Record<string, string>,
    @Body('role') role?: string,
    @Body('topic') topic?: string,
  ) {
    return this.notificationsService.broadcast(title, body, type, data, role, topic);
  }
}

