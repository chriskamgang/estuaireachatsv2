import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Arborescence 3 niveaux : categories racines (parentId = null)
   * avec leurs enfants et petits-enfants.
   */
  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        translations: true,
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            translations: true,
            children: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: { translations: true },
            },
          },
        },
      },
    });

    return { result: true, data: categories };
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        translations: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            translations: true,
            children: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: { translations: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categorie non trouvee');
    }

    return { result: true, data: category };
  }

  async create(dto: CreateCategoryDto) {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
        '-' +
        Date.now();

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Categorie parente non trouvee');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        icon: dto.icon,
        image: dto.image,
        parentId: dto.parentId,
        order: dto.order ?? 0,
        featured: dto.featured ?? false,
      },
      include: {
        translations: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: true,
      },
    });

    return { result: true, data: category };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Categorie non trouvee');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Categorie parente non trouvee');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.featured !== undefined && { featured: dto.featured }),
      },
      include: {
        translations: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: true,
      },
    });

    return { result: true, data: category };
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Categorie non trouvee');
    }

    // Soft delete : isActive = false
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return { result: true, data: { message: 'Categorie desactivee avec succes' } };
  }
}
