import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRfqDto {
  @ApiPropertyOptional({ example: 'clxyz123...' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Besoin de 500 unites en couleur rouge, livraison sous 2 semaines' })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ example: ['https://example.com/spec.pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
