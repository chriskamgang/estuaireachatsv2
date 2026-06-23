import { Module } from '@nestjs/common';
import { WithdrawsController } from './withdraws.controller';
import { WithdrawsService } from './withdraws.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [WithdrawsController],
  providers: [WithdrawsService],
  exports: [WithdrawsService],
})
export class WithdrawsModule {}
