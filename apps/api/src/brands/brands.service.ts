import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return { result: true, data: brands };
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: 'ACTIVE', isPublished: true },
          include: {
            images: { where: { isMain: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!brand) throw new NotFoundException('Marque introuvable');
    return { result: true, data: brand };
  }

  async create(dto: CreateBrandDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ce slug est deja utilise');

    const brand = await this.prisma.brand.create({
      data: { name: dto.name, slug, logo: dto.logo },
    });
    return { result: true, data: brand };
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Marque introuvable');

    if (dto.slug && dto.slug !== brand.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Ce slug est deja utilise');
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
      },
    });
    return { result: true, data: updated };
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Marque introuvable');

    await this.prisma.brand.delete({ where: { id } });
    return { result: true, data: { message: 'Marque supprimee' } };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
