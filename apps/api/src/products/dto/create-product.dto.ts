import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductMode, ProductType, ProductStatus, DiscountType } from '@prisma/client';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/img.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Image produit' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

export class CreateProductStockDto {
  @ApiProperty({ example: 'Black-M-Cotton' })
  @IsString()
  variant: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/variant.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class CreatePriceTierDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  minQty: number;

  @ApiPropertyOptional({ example: 49 })
  @IsOptional()
  @IsNumber()
  maxQty?: number;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy A54' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Slug auto-genere si non fourni' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Description complete du produit' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Description courte' })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiPropertyOptional({ description: 'ID de la categorie' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID de la marque' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Nom de la marque (cree automatiquement si nouvelle)' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ enum: ProductMode, default: 'BOTH' })
  @IsOptional()
  @IsEnum(ProductMode)
  mode?: ProductMode;

  @ApiPropertyOptional({ enum: ProductType, default: 'PHYSICAL' })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQty?: number;

  @ApiPropertyOptional({ example: 'piece' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'percent' })
  @IsOptional()
  @IsString()
  taxType?: string;

  @ApiPropertyOptional({ example: 19.25 })
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountEnd?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isWholesale?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['certif1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ type: [String], example: ['tag1', 'tag2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['#000000', '#FFFFFF'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xxx' })
  @IsOptional()
  @IsString()
  videoLink?: string;

  @ApiPropertyOptional({ example: 'CN', description: 'Pays d\'origine/fabrication (code ISO)' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  estShippingDays?: number;

  @ApiPropertyOptional({ enum: ProductStatus, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 'seller' })
  @IsOptional()
  @IsString()
  addedBy?: string;

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({ type: [CreateProductStockDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductStockDto)
  stocks?: CreateProductStockDto[];

  @ApiPropertyOptional({ type: [CreatePriceTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceTierDto)
  priceTiers?: CreatePriceTierDto[];
}
