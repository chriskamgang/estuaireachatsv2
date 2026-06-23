import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EstimateShippingDto {
  @ApiPropertyOptional({ example: 'clxyz123...', description: 'ID de la commande (optionnel)' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ example: 4.0511, description: 'Latitude du point de pickup' })
  @IsNumber()
  pickLat: number;

  @ApiProperty({ example: 9.7679, description: 'Longitude du point de pickup' })
  @IsNumber()
  pickLng: number;

  @ApiProperty({ example: 4.0435, description: 'Latitude du point de livraison' })
  @IsNumber()
  dropLat: number;

  @ApiProperty({ example: 9.7045, description: 'Longitude du point de livraison' })
  @IsNumber()
  dropLng: number;

  @ApiPropertyOptional({ example: 'small', description: 'Type de colis' })
  @IsString()
  @IsOptional()
  packageType?: string;
}
