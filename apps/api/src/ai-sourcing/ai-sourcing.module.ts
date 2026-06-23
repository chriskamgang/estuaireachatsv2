import { Module } from '@nestjs/common';
import { AiSourcingController } from './ai-sourcing.controller';
import { AiSourcingService } from './ai-sourcing.service';

@Module({
  controllers: [AiSourcingController],
  providers: [AiSourcingService],
})
export class AiSourcingModule {}
