import { IsString, IsOptional, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMode {
  USSD = 'USSD',
  GATEWAY = 'GATEWAY',
}

export class InitPaymentDto {
  @ApiProperty({ description: 'ID de la commande (combinedOrderId)' })
  @IsString()
  @IsNotEmpty()
  combinedOrderId: string;

  @ApiProperty({ enum: ['MTN_MOMO', 'ORANGE_MONEY', 'KPAY_GATEWAY', 'GFS_PAYMENT', 'PAYPAL', 'COD'] })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'Mode: USSD (direct) ou GATEWAY (page hebergee KPay)', enum: PaymentMode })
  @IsOptional()
  @IsEnum(PaymentMode)
  mode?: PaymentMode;

  @ApiPropertyOptional({ description: 'Numero Mobile Money (requis en mode USSD)' })
  @IsOptional()
  @IsString()
  @Matches(/^237[0-9]{9}$/, { message: 'Format: 237XXXXXXXXX (9 chiffres apres 237)' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'URL de retour apres paiement (mode GATEWAY/PAYPAL)' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({ description: 'URL annulation (mode GATEWAY/PAYPAL)' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
