import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiSourcingService } from './ai-sourcing.service';

class AiSourcingSearchDto {
  query: string;
  category?: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
}

@ApiTags('AI Sourcing')
@Controller('ai-sourcing')
export class AiSourcingController {
  constructor(private readonly aiSourcingService: AiSourcingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Recherche textuelle de produits/fournisseurs' })
  search(@Body() dto: AiSourcingSearchDto) {
    return this.aiSourcingService.search(dto);
  }

  @Post('ai-search')
  @ApiOperation({ summary: 'Recherche intelligente de produits assistee par Gemini AI' })
  aiSearch(
    @Body()
    dto: {
      query: string;
      category?: string;
      quantity?: number;
      budgetMin?: number;
      budgetMax?: number;
    },
  ) {
    return this.aiSourcingService.aiSearch(dto);
  }

  @Post('image-search')
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
  @ApiOperation({ summary: 'Recherche visuelle de produits par image (CLIP)' })
  async imageSearch(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Aucun fichier envoye', HttpStatus.BAD_REQUEST);
    }
    return this.aiSourcingService.imageSearch(file);
  }
}
