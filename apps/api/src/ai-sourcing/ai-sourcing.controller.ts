import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Recherche intelligente de produits/fournisseurs par IA' })
  search(@Body() dto: AiSourcingSearchDto) {
    return this.aiSourcingService.search(dto);
  }
}
