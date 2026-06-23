import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShopDto {
  @ApiProperty({ example: 'Ma Boutique', description: 'Nom de la boutique' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description de la boutique' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'URL de la banniere' })
  @IsString()
  @IsOptional()
  banner?: string;

  @ApiPropertyOptional({ example: '+237612345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'boutique@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Douala, Akwa' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '40+ employes', description: 'Nombre d\'employes' })
  @IsString()
  @IsOptional()
  staffCount?: string;

  @ApiPropertyOptional({ example: '1 200+ m²', description: 'Surface de l\'usine/entrepot' })
  @IsString()
  @IsOptional()
  factoryArea?: string;

  @ApiPropertyOptional({ example: '634K+ FCFA', description: 'Chiffre d\'affaires annuel' })
  @IsString()
  @IsOptional()
  annualRevenue?: string;

  @ApiPropertyOptional({ example: ['Service ODM disponible', 'Personnalisation complete'], description: 'Capacites de production' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  capabilities?: string[];

  @ApiPropertyOptional({ example: ['CE', 'ISO 9001'], description: 'Certifications de la boutique' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ example: ['https://...'], description: 'URLs des images usine/entrepot' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  factoryImages?: string[];
}
