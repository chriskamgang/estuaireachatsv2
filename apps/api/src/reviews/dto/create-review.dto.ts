import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID du produit' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Tres bon produit, je recommande !' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ type: [String], description: 'URLs des images' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class UpdateReviewStatusDto {
  @ApiProperty({ description: '0 = en attente, 1 = approuve, 2 = rejete', example: 1 })
  @IsInt()
  @Min(0)
  @Max(2)
  status: number;
}
