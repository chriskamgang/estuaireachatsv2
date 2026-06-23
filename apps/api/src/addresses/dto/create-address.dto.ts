import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+237612345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Rue 1234, Quartier Bonapriso' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Douala' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Littoral' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'ID du pays' })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional({ example: '00237' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 'Maison' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 4.0511 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 9.7679 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
