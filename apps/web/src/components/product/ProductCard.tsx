'use client';

import Link from 'next/link';
import { Heart, ScanLine, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

// Map country code to flag emoji
const countryFlags: Record<string, string> = {
  CM: '🇨🇲', CN: '🇨🇳', GA: '🇬🇦', NG: '🇳🇬', GH: '🇬🇭', CI: '🇨🇮',
  SN: '🇸🇳', FR: '🇫🇷', US: '🇺🇸', DE: '🇩🇪', JP: '🇯🇵', KR: '🇰🇷',
  IN: '🇮🇳', TR: '🇹🇷', VN: '🇻🇳', TH: '🇹🇭', MY: '🇲🇾', BR: '🇧🇷',
};

const countryNames: Record<string, string> = {
  CM: 'Cameroun', CN: 'Chine', GA: 'Gabon', NG: 'Nigeria', GH: 'Ghana',
  CI: "Cote d'Ivoire", SN: 'Senegal', FR: 'France', US: 'Etats-Unis',
  DE: 'Allemagne', JP: 'Japon', KR: 'Coree du Sud', IN: 'Inde', TR: 'Turquie',
  VN: 'Vietnam', TH: 'Thailande', MY: 'Malaisie', BR: 'Bresil',
};

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgHover, setImgHover] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleShopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Normalize data: support both mock format and API format
  const name = product.name || 'Produit';
  const slug = product.slug || product.id;
  const thumbnailUrl =
    product.thumbnailUrl ||
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === 'string' ? product.images[0] : null);

  // Wholesale: uses priceTiers min/max range. Retail: single price.
  const isWholesale = product.isWholesale || product.mode === 'WHOLESALE';
  const tiers = product.priceTiers || [];
  const priceTierMin = tiers.length > 0 ? Math.min(...tiers.map((t: any) => t.price)) : undefined;
  const priceTierMax = tiers.length > 1 ? Math.max(...tiers.map((t: any) => t.price)) : undefined;
  const priceMin = product.priceMin ?? priceTierMin ?? product.price ?? 0;
  const priceMax = product.priceMax ?? priceTierMax ?? product.price ?? priceMin;

  const moq = product.moq ?? product.minOrderQty ?? 1;
  const unit = product.unit || 'piece';
  const totalSold = product.sold ?? product.totalSold ?? 0;
  const rebuyRate = product.rebuyRate ?? (product.rebuyRate === 0 ? 0 : null);

  // Shop info
  const shopName = product.shop?.name ?? product.shopName ?? null;
  const shopSlug = product.shop?.slug ?? product.shopSlug ?? null;
  const shopVerified = product.verified ?? product.shop?.verified ?? false;
  const shopYears = product.shopYears ?? product.shop?.yearsActive ?? null;
  const countryCode = product.countryFlag ?? product.origin ?? product.shop?.country ?? null;
  const flagEmoji = countryCode ? (countryFlags[countryCode.toUpperCase()] || countryCode) : null;
  const countryName = countryCode ? (countryNames[countryCode.toUpperCase()] || countryCode) : null;

  const soldText =
    totalSold >= 1000
      ? `${(totalSold / 1000).toFixed(1).replace('.0', '')}k+ vendus`
      : totalSold > 0
        ? `${totalSold} vendus`
        : null;

  return (
    <Link
      href={`/product/${slug}`}
      className="product-card block bg-white rounded-lg overflow-hidden transition-all duration-200 group"
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-6"
        onMouseEnter={() => setImgHover(true)}
        onMouseLeave={() => setImgHover(false)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              imgHover ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-3 text-3xl">📦</span>
          </div>
        )}
        {/* Lens icon */}
        <div className="absolute bottom-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-sm">
          <ScanLine className="w-3.5 h-3.5 text-gray-2" />
        </div>
        {/* Heart icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors z-10"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? 'fill-primary text-primary' : 'text-gray-2'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Product name */}
        <h3 className="text-[13px] text-dark leading-[1.4] line-clamp-2 min-h-[36px] mb-1.5">
          {name}
        </h3>

        {/* Rebuy rate */}
        {rebuyRate != null && rebuyRate > 0 && (
          <div className="flex items-center gap-1 text-[12px] text-green mb-1">
            <CheckCircle className="w-3 h-3" />
            Taux de rachat de {rebuyRate}%
          </div>
        )}

        {/* Delivery estimate */}
        {(product.deliveryEstimate || product.estShippingDays) && (
          <div className="flex items-center gap-1 text-[12px] text-green mb-1">
            <CheckCircle className="w-3 h-3" />
            Expedition en {product.deliveryEstimate || `${product.estShippingDays}j`}
          </div>
        )}

        {/* Price */}
        <div className="mb-1">
          <span className="text-[16px] font-extrabold text-dark">
            {formatPrice(priceMin)}
          </span>
          {priceMax > priceMin && (
            <span className="text-[13px] text-gray-2">
              -{formatPrice(priceMax)}
            </span>
          )}
        </div>

        {/* MOQ & Sold */}
        <div className="text-[12px] text-gray-3 mb-1.5">
          Min. {moq} {unit}{moq > 1 ? 's' : ''}
          {soldText && <> &middot; {soldText}</>}
        </div>

        {/* Shop name (clickable) */}
        {shopName && (
          <div className="mb-1.5">
            {shopSlug ? (
              <span
                onClick={handleShopClick}
                className="text-[12px] text-primary hover:underline cursor-pointer"
              >
                <a href={`/shop/${shopSlug}`}>{shopName}</a>
              </span>
            ) : (
              <span className="text-[12px] text-gray-2">{shopName}</span>
            )}
          </div>
        )}

        {/* Shop info: verified badge + years + country flag */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {shopVerified && (
            <span className="text-[11px] font-bold text-orange border border-orange rounded px-1 py-0.5 leading-none">
              Verified
            </span>
          )}
          {shopYears != null && shopYears > 0 && (
            <>
              <span className="text-[11px] text-gray-3">
                {shopYears} ans
              </span>
              <span className="text-[11px] text-gray-3">&middot;</span>
            </>
          )}
          {flagEmoji && (
            <span className="text-[11px] text-gray-3 font-medium" title={countryName || ''}>
              {flagEmoji} {countryName || countryCode}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
