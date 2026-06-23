import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const attributes = await this.prisma.attribute.findMany({
      orderBy: { name: 'asc' },
      include: { values: true },
    });
    return { data: attributes };
  }

  async create(dto: { name: string }) {
    const attribute = await this.prisma.attribute.create({
      data: { name: dto.name },
      include: { values: true },
    });
    return { data: attribute };
  }

  async update(id: string, dto: { name: string }) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });
    if (!attribute) throw new NotFoundException('Attribut introuvable');

    const updated = await this.prisma.attribute.update({
      where: { id },
      data: { name: dto.name },
      include: { values: true },
    });
    return { data: updated };
  }

  async remove(id: string) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });
    if (!attribute) throw new NotFoundException('Attribut introuvable');

    // Cascade delete will remove values too
    await this.prisma.attribute.delete({ where: { id } });
    return { data: { message: 'Attribut et valeurs supprimes' } };
  }

  async addValue(attributeId: string, dto: { value: string }) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id: attributeId } });
    if (!attribute) throw new NotFoundException('Attribut introuvable');

    const value = await this.prisma.attributeValue.create({
      data: {
        attributeId,
        value: dto.value,
      },
    });
    return { data: value };
  }

  async removeValue(valueId: string) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) throw new NotFoundException('Valeur introuvable');

    await this.prisma.attributeValue.delete({ where: { id: valueId } });
    return { data: { message: 'Valeur supprimee' } };
  }
}
