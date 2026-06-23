import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'clxyz789...' })
  @IsOptional()
  @IsString()
  receiverId?: string;

  @ApiPropertyOptional({ example: 'conv_abc123...' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ example: 'Bonjour, ce produit est-il disponible ?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: ['https://example.com/file.pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
