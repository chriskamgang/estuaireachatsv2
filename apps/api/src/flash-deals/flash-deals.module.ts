import { Module } from '@nestjs/common';
import { FlashDealsController } from './flash-deals.controller';
import { FlashDealsService } from './flash-deals.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FlashDealsController],
  providers: [FlashDealsService, PrismaService],
  exports: [FlashDealsService],
})
export class FlashDealsModule {}
