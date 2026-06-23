import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateClubPointsConfigDto {
  @ApiPropertyOptional({
    description: 'Taux de gain : 1 point pour X FCFA depenses',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  earnRate?: number;

  @ApiPropertyOptional({
    description: 'Taux de conversion : 1 point = X FCFA en wallet',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  conversionRate?: number;
}
