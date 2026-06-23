import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Creer ou trouver une conversation' })
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() body: { receiverId: string; initialMessage?: string },
  ) {
    return this.chatService.findOrCreateConversation(userId, body.receiverId, body.initialMessage);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste de mes conversations' })
  getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Messages d\'une conversation' })
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getMessages(userId, conversationId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Envoyer un message' })
  send(
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.send(userId, dto);
  }

  @Post('mark-read/:conversationId')
  @ApiOperation({ summary: 'Marquer les messages d\'une conversation comme lus' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.markRead(userId, conversationId);
  }
}
