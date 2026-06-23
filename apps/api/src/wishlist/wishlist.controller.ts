import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de mes favoris avec infos produit' })
  findAll(@CurrentUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Ajouter un produit aux favoris' })
  add(
    @CurrentUser('id') userId: string,
    @Body('productId') productId: string,
  ) {
    return this.wishlistService.add(userId, productId);
  }

  @Delete('remove/:productId')
  @ApiOperation({ summary: 'Retirer un produit des favoris' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.remove(userId, productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Verifier si un produit est dans les favoris' })
  check(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.check(userId, productId);
  }
}
