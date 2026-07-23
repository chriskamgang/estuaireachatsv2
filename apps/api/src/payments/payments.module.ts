import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { KPayService } from './kpay.service';
import { GfsService } from './gfs.service';
import { ElgioPayService } from './elgiopay.service';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [SettingsModule, NotificationsModule, DeliveryModule, CouponsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, KPayService, GfsService, ElgioPayService],
  exports: [PaymentsService, KPayService, GfsService, ElgioPayService],
})
export class PaymentsModule {}
