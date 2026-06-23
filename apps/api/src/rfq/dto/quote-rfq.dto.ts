import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuoteRfqDto {
  @ApiProperty({ example: 250000, description: 'Prix propose en FCFA' })
  @IsNumber()
  @Min(0)
  quotedPrice: number;
}
