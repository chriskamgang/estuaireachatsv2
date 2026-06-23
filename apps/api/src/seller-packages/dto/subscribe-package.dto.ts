import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubscribePackageDto {
  @ApiProperty({ example: 'clxyz123...' })
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @ApiPropertyOptional({ example: 'MTN_MOMO' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
