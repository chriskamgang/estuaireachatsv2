import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async handleUpload(file: Express.Multer.File, userId?: string) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const upload = await this.prisma.upload.create({
      data: {
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        userId: userId ?? null,
      },
    });

    const url = `/uploads/${file.filename}`;

    return {
      result: true,
      data: {
        id: upload.id,
        fileName: upload.fileName,
        fileType: upload.fileType,
        fileSize: upload.fileSize,
        url,
      },
    };
  }

  async findByUser(userId: string, page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.upload.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.upload.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async removeByUser(id: string, userId: string) {
    const upload = await this.prisma.upload.findUnique({ where: { id } });
    if (!upload) throw new NotFoundException('Fichier introuvable');
    if (upload.userId !== userId) throw new NotFoundException('Fichier introuvable');

    try {
      if (existsSync(upload.filePath)) {
        unlinkSync(upload.filePath);
      }
    } catch {
      // File may already be deleted
    }

    await this.prisma.upload.delete({ where: { id } });
    return { data: { message: 'Fichier supprime' } };
  }

  async findAll(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.upload.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.upload.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async remove(id: string) {
    const upload = await this.prisma.upload.findUnique({ where: { id } });
    if (!upload) throw new NotFoundException('Fichier introuvable');

    // Try to delete the physical file
    try {
      if (existsSync(upload.filePath)) {
        unlinkSync(upload.filePath);
      }
    } catch {
      // File may already be deleted, continue
    }

    await this.prisma.upload.delete({ where: { id } });
    return { data: { message: 'Fichier supprime' } };
  }
}
