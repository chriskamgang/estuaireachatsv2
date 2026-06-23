import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ChangeQuantityDto } from './dto/change-quantity.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste du panier groupee par vendeur/shop (style Alibaba)
   */
  async getList(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            minOrderQty: true,
            images: { where: { isMain: true }, take: 1 },
            stocks: { select: { qty: true, variant: true } },
            shop: { select: { id: true, name: true, slug: true, logo: true, city: true, country: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Grouper par ownerId (seller)
    const grouped: Record<string, {
      ownerId: string;
      shopName: string;
      shopSlug: string;
      shopLogo: string | null;
      shopCity: string;
      shopCountry: string;
      items: typeof cartItems;
      subtotal: number;
    }> = {};

    for (const item of cartItems) {
      const ownerId = item.ownerId;
      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          ownerId,
          shopName: item.product.shop.name,
          shopSlug: item.product.shop.slug,
          shopLogo: item.product.shop.logo,
          shopCity: item.product.shop.city || '',
          shopCountry: item.product.shop.country || 'CM',
          items: [],
          subtotal: 0,
        };
      }
      grouped[ownerId].items.push(item);
      grouped[ownerId].subtotal += (item.price - item.discount) * item.quantity + item.tax + item.shippingCost;
    }

    return { result: true, data: Object.values(grouped) };
  }

  /**
   * Resume du panier : subtotal, tax, shipping, discount, total, itemCount
   */
  async getSummary(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
    });

    let subtotal = 0;
    let tax = 0;
    let shipping = 0;
    let discount = 0;

    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
      tax += item.tax * item.quantity;
      shipping += item.shippingCost;
      discount += item.discount * item.quantity;
    }

    const total = subtotal + tax + shipping - discount;

    return {
      result: true,
      data: {
        subtotal,
        tax,
        shipping,
        discount,
        total,
        itemCount: cartItems.length,
      },
    };
  }

  /**
   * Nombre d'items dans le panier
   */
  async getCount(userId: string) {
    const count = await this.prisma.cartItem.count({
      where: { userId },
    });
    return { result: true, data: { count } };
  }

  /**
   * Ajouter un produit au panier
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        shop: { select: { userId: true } },
        stocks: true,
        priceTiers: { orderBy: { minQty: 'asc' } },
      },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.status !== 'ACTIVE') throw new BadRequestException('Ce produit n\'est pas disponible');

    // Determiner le prix selon la variation
    let price = product.price || 0;
    if (dto.variation && product.stocks.length > 0) {
      const stock = product.stocks.find((s) => s.variant === dto.variation);
      if (!stock) throw new BadRequestException('Variation introuvable');
      if (stock.qty < dto.quantity) throw new BadRequestException('Stock insuffisant');
      price = stock.price;
    }

    // Pour les produits wholesale sans prix de base, utiliser les priceTiers
    if (price === 0 && product.priceTiers.length > 0) {
      // Trouver le tier correspondant a la quantite
      for (const tier of product.priceTiers) {
        if (dto.quantity >= tier.minQty && (!tier.maxQty || dto.quantity <= tier.maxQty)) {
          price = tier.price;
          break;
        }
      }
      // Si aucun tier ne correspond, utiliser le premier tier
      if (price === 0) {
        price = product.priceTiers[0].price;
      }
    }

    // Calculer la taxe unitaire
    let taxAmount = 0;
    if (product.taxType === 'percent') {
      taxAmount = (price * product.tax) / 100;
    } else {
      taxAmount = product.tax;
    }

    // Calculer la reduction unitaire
    let discountAmount = 0;
    const now = new Date();
    const discountActive =
      product.discount > 0 &&
      (!product.discountStart || product.discountStart <= now) &&
      (!product.discountEnd || product.discountEnd >= now);

    if (discountActive) {
      if (product.discountType === 'PERCENT') {
        discountAmount = (price * product.discount) / 100;
      } else {
        discountAmount = product.discount;
      }
    }

    // Upsert : si meme produit + meme variation => maj quantite
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId_variation: {
          userId,
          productId: dto.productId,
          variation: dto.variation || '',
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + dto.quantity,
          price,
          tax: taxAmount,
          discount: discountAmount,
        },
      });
      return { result: true, data: updated };
    }

    const cartItem = await this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        ownerId: product.shop.userId,
        quantity: dto.quantity,
        variation: dto.variation || '',
        price,
        tax: taxAmount,
        discount: discountAmount,
      },
    });
    return { result: true, data: cartItem };
  }

  /**
   * Modifier la quantite d'un item
   */
  async changeQuantity(userId: string, dto: ChangeQuantityDto) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: dto.cartItemId },
    });

    if (!cartItem) throw new NotFoundException('Item introuvable dans le panier');
    if (cartItem.userId !== userId) throw new ForbiddenException('Acces refuse');

    const updated = await this.prisma.cartItem.update({
      where: { id: dto.cartItemId },
      data: { quantity: dto.quantity },
    });
    return { result: true, data: updated };
  }

  /**
   * Supprimer un item du panier
   */
  async removeItem(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) throw new NotFoundException('Item introuvable dans le panier');
    if (cartItem.userId !== userId) throw new ForbiddenException('Acces refuse');

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return { result: true, data: { message: 'Item supprime du panier' } };
  }
}
