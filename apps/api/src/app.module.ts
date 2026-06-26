import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ShopsModule } from './shops/shops.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { WalletModule } from './wallet/wallet.module';
import { RefundsModule } from './refunds/refunds.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { RfqModule } from './rfq/rfq.module';
import { ShippingModule } from './shipping/shipping.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { ClubPointsModule } from './club-points/club-points.module';
import { SellerPackagesModule } from './seller-packages/seller-packages.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { WithdrawsModule } from './withdraws/withdraws.module';
import { DeliveryModule } from './delivery/delivery.module';
import { FlashDealsModule } from './flash-deals/flash-deals.module';
import { BlogModule } from './blog/blog.module';
import { SupportModule } from './support/support.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { AttributesModule } from './attributes/attributes.module';
import { ColorsModule } from './colors/colors.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { SizeGuidesModule } from './size-guides/size-guides.module';
import { NexahSmsModule } from './nexah-sms/nexah-sms.module';
import { PosModule } from './pos/pos.module';
import { AiSourcingModule } from './ai-sourcing/ai-sourcing.module';
import { SearchHistoryModule } from './search-history/search-history.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    ShopsModule,
    CartModule,
    OrdersModule,
    AddressesModule,
    ReviewsModule,
    WishlistModule,
    CouponsModule,
    WalletModule,
    RefundsModule,
    ChatModule,
    NotificationsModule,
    UploadModule,
    RfqModule,
    ShippingModule,
    PaymentsModule,
    SettingsModule,
    ClubPointsModule,
    SellerPackagesModule,
    AffiliateModule,
    WithdrawsModule,
    DeliveryModule,
    FlashDealsModule,
    BlogModule,
    SupportModule,
    SubscribersModule,
    AttributesModule,
    ColorsModule,
    WarrantiesModule,
    SizeGuidesModule,
    NexahSmsModule,
    PosModule,
    AiSourcingModule,
    SearchHistoryModule,
  ],
})
export class AppModule {}
