import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { MerciEService } from './merci-e.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ShippingController],
  providers: [ShippingService, MerciEService],
  exports: [ShippingService],
})
export class ShippingModule {}
