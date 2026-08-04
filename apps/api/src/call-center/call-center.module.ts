import { Module } from '@nestjs/common';
import { CallCenterController } from './call-center.controller';
import { CallCenterService } from './call-center.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CallCenterController],
  providers: [CallCenterService],
})
export class CallCenterModule {}
