import { Module } from '@nestjs/common';
import { ClubPointsService } from './club-points.service';
import { ClubPointsController } from './club-points.controller';

@Module({
  controllers: [ClubPointsController],
  providers: [ClubPointsService],
  exports: [ClubPointsService],
})
export class ClubPointsModule {}
