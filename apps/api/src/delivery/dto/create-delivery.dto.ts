import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryRequestDto {
  @ApiProperty({ description: 'ID de la commande' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'Instructions pour le livreur' })
  @IsOptional()
  @IsString()
  deliveryNote?: string;
}

export class EstimateDeliveryDto {
  @ApiProperty({ description: 'Latitude du point de collecte (vendeur)' })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ description: 'Longitude du point de collecte' })
  @IsNumber()
  pickupLng: number;

  @ApiProperty({ description: 'Latitude du point de livraison (acheteur)' })
  @IsNumber()
  dropLat: number;

  @ApiProperty({ description: 'Longitude du point de livraison' })
  @IsNumber()
  dropLng: number;
}
