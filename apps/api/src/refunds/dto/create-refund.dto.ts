import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({ example: 'clxyz123...' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'clxyz456...' })
  @IsString()
  @IsNotEmpty()
  orderDetailId: string;

  @ApiProperty({ example: 'Produit defectueux' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
