import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          locale: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      result: true,
      data: users,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        locale: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            verified: true,
            status: true,
          },
        },
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }

    return { result: true, data: user };
  }

  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouve');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { banned: true },
    });
    return { result: true, data: updated };
  }

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouve');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { banned: false },
    });
    return { result: true, data: updated };
  }

  /**
   * Recupere la derniere recherche de l'utilisateur et compte les nouveaux produits
   * qui correspondent a cette recherche et qui ont ete crees apres la date de la recherche.
   */
  async getSearchNotification(userId: string) {
    const lastSearch = await this.prisma.userSearch.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastSearch) {
      return { result: true, data: null };
    }

    // Compter les nouveaux produits qui matchent la recherche et crees apres la date de recherche
    const newCount = await this.prisma.product.count({
      where: {
        isPublished: true,
        status: 'ACTIVE',
        createdAt: { gt: lastSearch.createdAt },
        OR: [
          { name: { contains: lastSearch.query } },
          { description: { contains: lastSearch.query } },
          { tags: { string_contains: lastSearch.query } },
        ],
      },
    });

    if (newCount === 0) {
      return { result: true, data: null };
    }

    return {
      result: true,
      data: {
        query: lastSearch.query,
        newCount,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        locale: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { result: true, data: updated };
  }
}
