import { Module } from '@nestjs/common';
import { NexahSmsService } from './nexah-sms.service';
import { NexahSmsController } from './nexah-sms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NexahSmsController],
  providers: [NexahSmsService],
  exports: [NexahSmsService],
})
export class NexahSmsModule {}
