import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemShipping {
  @ApiProperty({ example: 'clxyz123...' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CalculateShippingDto {
  @ApiProperty({ example: 'clxyz456...' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ type: [CartItemShipping] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemShipping)
  cartItems: CartItemShipping[];
}
