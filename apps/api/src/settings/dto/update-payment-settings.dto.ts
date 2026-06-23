import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateKPaySettingsDto {
  @ApiPropertyOptional({ description: 'Cle API KPay (kpay_test_xxx ou kpay_live_xxx)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Cle secrete KPay (sk_test_xxx ou sk_live_xxx)' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ description: 'Secret pour verifier les webhooks KPay' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Mode: sandbox ou production' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: 'Activer KPay' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateGfsSettingsDto {
  @ApiPropertyOptional({ description: 'URL de la passerelle GFSolutions' })
  @IsOptional()
  @IsString()
  paymentUrl?: string;

  @ApiPropertyOptional({ description: 'Cle API GFSolutions' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Secret API GFSolutions' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'URL de callback webhook GFS' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Activer GFSolutions' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdatePaypalSettingsDto {
  @ApiPropertyOptional({ description: 'Client ID PayPal' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Client Secret PayPal' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Mode: sandbox ou live' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: 'Activer PayPal' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
