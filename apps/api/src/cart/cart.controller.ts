import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ChangeQuantityDto } from './dto/change-quantity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Liste du panier groupee par vendeur (auth)' })
  getList(@CurrentUser('id') userId: string) {
    return this.cartService.getList(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resume panier : subtotal, tax, shipping, discount, total, itemCount (auth)' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.cartService.getSummary(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Nombre d\'items dans le panier (auth)' })
  getCount(@CurrentUser('id') userId: string) {
    return this.cartService.getCount(userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Ajouter un produit au panier (auth)' })
  addToCart(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, dto);
  }

  @Patch('change-quantity')
  @ApiOperation({ summary: 'Modifier la quantite d\'un item (auth)' })
  changeQuantity(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeQuantityDto,
  ) {
    return this.cartService.changeQuantity(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un item du panier (auth)' })
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') cartItemId: string,
  ) {
    return this.cartService.removeItem(userId, cartItemId);
  }
}
