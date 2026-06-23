import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFlashDealDto {
  @ApiProperty({ example: 'Soldes de Noel' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.jpg' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-25T23:59:59.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFlashDealDto {
  @ApiPropertyOptional({ example: 'Soldes Janvier' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner2.jpg' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-10T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddFlashDealProductDto {
  @ApiProperty({ example: 'clxyz1234product' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ enum: ['PERCENT', 'AMOUNT'], example: 'PERCENT' })
  @IsString()
  @IsNotEmpty()
  discountType: string;
}
