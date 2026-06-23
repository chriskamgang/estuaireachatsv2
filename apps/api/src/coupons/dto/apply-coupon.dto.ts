import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ example: 'PROMO10' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
