import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from './search-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Search History')
@Controller('search-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchHistoryController {
  constructor(private searchHistoryService: SearchHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer une recherche utilisateur' })
  @ApiBody({
    schema: {
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  })
  saveSearch(
    @CurrentUser('id') userId: string,
    @Body('query') query: string,
  ) {
    return this.searchHistoryService.saveSearch(userId, query);
  }
}
