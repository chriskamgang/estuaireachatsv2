import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RechargeWalletDto {
  @ApiProperty({ example: 10000, description: 'Montant en FCFA' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    example: 'MTN_MOMO',
    description: 'Methode de paiement (MTN_MOMO, ORANGE_MONEY, PAYPAL)',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
