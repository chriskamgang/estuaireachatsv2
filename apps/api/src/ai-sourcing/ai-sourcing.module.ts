import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiSourcingController } from './ai-sourcing.controller';
import { AiSourcingService } from './ai-sourcing.service';

@Module({
  imports: [HttpModule],
  controllers: [AiSourcingController],
  providers: [AiSourcingService],
})
export class AiSourcingModule {}
