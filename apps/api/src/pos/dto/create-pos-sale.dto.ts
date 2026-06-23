import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PosItemDto {
  @ApiProperty({ description: 'ID du produit' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantite' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire' })
  @IsNumber()
  @Min(0)
  price: number;
}

export enum PosPaymentMethod {
  MTN_MOMO = 'MTN_MOMO',
  ORANGE_MONEY = 'ORANGE_MONEY',
  ESPECES = 'ESPECES',
  VIREMENT = 'VIREMENT',
  GFS_PAYMENT = 'GFS_PAYMENT',
}

export class CreatePosSaleDto {
  @ApiProperty({ type: [PosItemDto], description: 'Articles de la vente' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items: PosItemDto[];

  @ApiProperty({ enum: PosPaymentMethod, description: 'Mode de paiement' })
  @IsEnum(PosPaymentMethod)
  paymentMethod: PosPaymentMethod;

  @ApiPropertyOptional({ description: 'Nom du client' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Numero de telephone (requis pour MTN MoMo / Orange Money)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Remise en FCFA' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
