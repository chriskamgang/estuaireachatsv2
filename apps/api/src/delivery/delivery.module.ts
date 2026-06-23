import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { MerciEService } from './merci-e.service';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SettingsModule, NotificationsModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, MerciEService],
  exports: [DeliveryService, MerciEService],
})
export class DeliveryModule {}
