import { Module } from '@nestjs/common';
import { SellerPackagesService } from './seller-packages.service';
import { SellerPackagesController } from './seller-packages.controller';

@Module({
  controllers: [SellerPackagesController],
  providers: [SellerPackagesService],
  exports: [SellerPackagesService],
})
export class SellerPackagesModule {}
