import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ example: 'PROMO10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ['CART_BASE', 'PRODUCT_BASE'], example: 'CART_BASE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ enum: ['PERCENT', 'AMOUNT'], example: 'PERCENT' })
  @IsString()
  @IsNotEmpty()
  discountType: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBuy?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  endDate: string;
}
