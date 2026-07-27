import { Module } from '@nestjs/common';
import { AlibabaController } from './alibaba.controller';
import { AlibabaScraperService } from './alibaba-scraper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlibabaController],
  providers: [AlibabaScraperService],
  exports: [AlibabaScraperService],
})
export class AlibabaModule {}
