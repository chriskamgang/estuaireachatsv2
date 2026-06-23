import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'Samsung', description: 'Nom de la marque' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'samsung', description: 'Slug URL (genere automatiquement si absent)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/samsung-logo.png', description: 'URL du logo' })
  @IsString()
  @IsOptional()
  logo?: string;
}
