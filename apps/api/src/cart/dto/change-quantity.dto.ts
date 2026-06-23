import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeQuantityDto {
  @ApiProperty({ example: 'clxyz123...', description: 'ID du CartItem' })
  @IsString()
  @IsNotEmpty()
  cartItemId: string;

  @ApiProperty({ example: 3, description: 'Nouvelle quantite', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
