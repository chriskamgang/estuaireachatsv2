import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarrantiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const warranties = await this.prisma.warranty.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: warranties };
  }

  async create(dto: { name: string; duration: string }) {
    const warranty = await this.prisma.warranty.create({
      data: { name: dto.name, duration: dto.duration },
    });
    return { data: warranty };
  }

  async remove(id: string) {
    const warranty = await this.prisma.warranty.findUnique({ where: { id } });
    if (!warranty) throw new NotFoundException('Garantie introuvable');

    await this.prisma.warranty.delete({ where: { id } });
    return { data: { message: 'Garantie supprimee' } };
  }
}
