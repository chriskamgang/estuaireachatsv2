import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CallResult } from '@prisma/client';

export class CreateCallLogDto {
  @ApiProperty({ description: 'ID de la commande' })
  @IsString()
  orderId: string;

  @ApiProperty({ enum: CallResult })
  @IsEnum(CallResult)
  callResult: CallResult;

  @ApiPropertyOptional({ description: 'Duree de l\'appel en secondes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Notes de l\'agent' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Date de rappel planifie (ISO)' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
