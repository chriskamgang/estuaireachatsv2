import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'ID de l\'adresse de livraison' })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiPropertyOptional({ enum: ['HOME_DELIVERY', 'PICKUP_POINT'], default: 'HOME_DELIVERY' })
  @IsEnum(['HOME_DELIVERY', 'PICKUP_POINT'])
  @IsOptional()
  shippingType?: 'HOME_DELIVERY' | 'PICKUP_POINT';

  @ApiPropertyOptional({ description: 'ID du point de retrait (si PICKUP_POINT)' })
  @IsString()
  @IsOptional()
  pickupPointId?: string;

  @ApiPropertyOptional({ enum: ['MTN_MOMO', 'ORANGE_MONEY', 'KPAY_GATEWAY', 'GFS_PAYMENT', 'PAYPAL', 'COD'] })
  @IsEnum(['MTN_MOMO', 'ORANGE_MONEY', 'KPAY_GATEWAY', 'GFS_PAYMENT', 'PAYPAL', 'COD'])
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Note pour la commande' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'])
  deliveryStatus: string;
}

export class UpdatePaymentStatusDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] })
  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  paymentStatus: string;
}
