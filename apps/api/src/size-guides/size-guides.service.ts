import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SizeGuidesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const sizeGuides = await this.prisma.sizeGuide.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: sizeGuides };
  }

  async create(dto: { name: string; category: string; sizes: any }) {
    const sizeGuide = await this.prisma.sizeGuide.create({
      data: {
        name: dto.name,
        category: dto.category,
        sizes: dto.sizes,
      },
    });
    return { data: sizeGuide };
  }

  async update(id: string, dto: { name?: string; category?: string; sizes?: any }) {
    const sizeGuide = await this.prisma.sizeGuide.findUnique({ where: { id } });
    if (!sizeGuide) throw new NotFoundException('Guide de taille introuvable');

    const updated = await this.prisma.sizeGuide.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.sizes !== undefined && { sizes: dto.sizes }),
      },
    });
    return { data: updated };
  }

  async remove(id: string) {
    const sizeGuide = await this.prisma.sizeGuide.findUnique({ where: { id } });
    if (!sizeGuide) throw new NotFoundException('Guide de taille introuvable');

    await this.prisma.sizeGuide.delete({ where: { id } });
    return { data: { message: 'Guide de taille supprime' } };
  }
}
