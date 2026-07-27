import { Module } from '@nestjs/common';
import { AlibabaController } from './alibaba.controller';
import { AlibabaScraperService } from './alibaba-scraper.service';
import { AlibabaApiService } from './alibaba-api.service';
import { AlibabaImportService } from './alibaba-import.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlibabaController],
  providers: [AlibabaScraperService, AlibabaApiService, AlibabaImportService],
  exports: [AlibabaScraperService, AlibabaApiService, AlibabaImportService],
})
export class AlibabaModule {}
