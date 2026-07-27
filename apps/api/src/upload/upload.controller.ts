import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload un fichier (stockage local)' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.uploadService.handleUpload(file, userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes fichiers uploades (auth, pagine)' })
  myList(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.uploadService.findByUser(
      userId,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un de mes fichiers (auth)' })
  deleteMyUpload(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.uploadService.removeByUser(id, userId);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste de tous les uploads (ADMIN, pagine)' })
  adminList(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.uploadService.findAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un upload (ADMIN)' })
  adminDelete(@Param('id') id: string) {
    return this.uploadService.remove(id);
  }

  @Post('transcribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
        language: { type: 'string', example: 'fr', description: 'Code langue ISO (fr, en, auto)' },
      },
    },
  })
  @ApiOperation({ summary: 'Transcrire un audio en texte via Whisper (OpenAI)' })
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Query('language') language?: string,
  ) {
    if (!file) throw new BadRequestException('Fichier audio requis');

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new BadRequestException('OPENAI_API_KEY non configure');

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiKey });

    const audioFile = new File(
      [new Uint8Array(file.buffer)],
      file.originalname || 'audio.webm',
      { type: file.mimetype || 'audio/webm' },
    );

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: (language && language !== 'auto') ? language : undefined,
      response_format: 'text',
    });

    return { result: true, data: { text: transcription } };
  }
}
