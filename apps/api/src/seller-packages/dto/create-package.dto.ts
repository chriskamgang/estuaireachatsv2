import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ example: 'Pack Premium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 0, description: 'Prix en FCFA (0 = gratuit)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, description: 'Nombre max de produits' })
  @IsNumber()
  @Min(1)
  productLimit: number;

  @ApiProperty({ example: 30, description: 'Duree en jours' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;
}
