import { IsString, IsNumber, IsOptional, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawDto {
  @ApiProperty({ description: 'Montant a retirer en FCFA', minimum: 1000 })
  @IsNumber()
  @Min(1000, { message: 'Montant minimum de retrait: 1000 FCFA' })
  amount: number;

  @ApiProperty({ description: 'Methode: MTN_MOMO ou ORANGE_MONEY', enum: ['MTN_MOMO', 'ORANGE_MONEY'] })
  @IsString()
  method: string;

  @ApiProperty({ description: 'Numero Mobile Money (format: 237XXXXXXXXX)' })
  @IsString()
  @Matches(/^237[0-9]{9}$/, { message: 'Format: 237XXXXXXXXX' })
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ProcessWithdrawDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}
