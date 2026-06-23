import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const colors = await this.prisma.color.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: colors };
  }

  async create(dto: { name: string; code: string }) {
    const color = await this.prisma.color.create({
      data: { name: dto.name, code: dto.code },
    });
    return { data: color };
  }

  async update(id: string, dto: { name?: string; code?: string }) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) throw new NotFoundException('Couleur introuvable');

    const updated = await this.prisma.color.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
      },
    });
    return { data: updated };
  }

  async remove(id: string) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) throw new NotFoundException('Couleur introuvable');

    await this.prisma.color.delete({ where: { id } });
    return { data: { message: 'Couleur supprimee' } };
  }
}
