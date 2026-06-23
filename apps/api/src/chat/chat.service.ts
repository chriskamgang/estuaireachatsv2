import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true,
          },
        },
      },
    });

    // Enrichir avec les infos utilisateur
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.senderId === userId ? conv.receiverId : conv.senderId;
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          ...conv,
          otherUser,
          unreadCount,
          lastMessage: conv.messages[0] ?? null,
        };
      }),
    );

    return { result: true, data: enriched };
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    if (
      conversation.senderId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('Acces refuse');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        attachments: true,
        isRead: true,
        createdAt: true,
      },
    });

    return { result: true, data: messages };
  }

  async send(userId: string, dto: SendMessageDto) {
    // Trouver ou creer la conversation
    const [id1, id2] = [userId, dto.receiverId].sort();

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          senderId: userId,
          receiverId: dto.receiverId,
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        receiverId: dto.receiverId,
        content: dto.content,
        attachments: dto.attachments ?? [],
      },
    });

    return { result: true, data: message };
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    if (
      conversation.senderId !== userId &&
      conversation.receiverId !== userId
    ) {
      throw new ForbiddenException('Acces refuse');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { result: true, data: null };
  }
}
