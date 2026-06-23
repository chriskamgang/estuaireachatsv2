import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ConvertPointsDto {
  @ApiProperty({ description: 'Nombre de points a convertir en solde wallet', example: 50 })
  @IsInt()
  @Min(1)
  points: number;
}
