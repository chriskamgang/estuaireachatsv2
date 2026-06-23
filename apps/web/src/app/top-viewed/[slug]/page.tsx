'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

// Fallback top-viewed data per category
const TOP_VIEWED_DATA: Record<string, {
  title: string;
  description: string;
  views: string;
}> = {
  'electronique': {
    title: 'Electronique',
    description: 'Classe en fonction du nombre total de vues de produits au cours des 90 derniers jours. Mis a jour quotidiennement.',
    views: '440K+',
  },
  'pieces-automobiles': {
    title: 'Pieces Automobiles',
    description: 'Classe en fonction du nombre total de vues de produits au cours des 90 derniers jours. Mis a jour quotidiennement.',
    views: '320K+',
  },
  'vetements': {
    title: 'Vetements',
    description: 'Classe en fonction du nombre total de vues de produits au cours des 90 derniers jours. Mis a jour quotidiennement.',
    views: '280K+',
  },
  'maison-jardin': {
    title: 'Maison & Jardin',
    description: 'Classe en fonction du nombre total de vues de produits au cours des 90 derniers jours. Mis a jour quotidiennement.',
    views: '160K+',
  },
};

// Fallback recommended categories with top 3 products
const RECOMMENDED_CATEGORIES = [
  {
    title: 'Ensembles de cuisine inox',
    views: '440K+',
    products: MOCK_PRODUCTS.slice(0, 3),
  },
  {
    title: 'LED & LCD TV',
    views: null,
    products: MOCK_PRODUCTS.slice(3, 6),
  },
  {
    title: 'Pieces de machines',
    views: null,
    products: MOCK_PRODUCTS.slice(6, 9),
  },
  {
    title: 'Ensembles de cuisine traditionnels',
    views: '19%',
    viewsLabel: 'augmentation',
    products: MOCK_PRODUCTS.slice(9, 12),
  },
  {
    title: 'Bouteilles de sport',
    views: '100+',
    viewsLabel: 'commandes les 30 derniers jours',
    products: MOCK_PRODUCTS.slice(0, 3),
  },
  {
    title: 'Costumes homme',
    views: '640K+',
    products: MOCK_PRODUCTS.slice(3, 6),
  },
  {
    title: 'Roulements',
    views: '160K+',
    products: MOCK_PRODUCTS.slice(6, 9),
  },
  {
    title: 'Services de table',
    views: null,
    products: MOCK_PRODUCTS.slice(9, 12),
  },
];

export default function TopViewedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const fallbackData = TOP_VIEWED_DATA[slug];

  // Derive a readable title from the slug
  const titleFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // API state
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<{ name: string } | null>(null);
  const [recommendedCats, setRecommendedCats] = useState<any[]>([]);

  // Fetch products for this category
  useEffect(() => {
    setLoading(true);
    api.get<{ data: any[] }>(`/products?category=${slug}&sort=best_selling&perPage=18`)
      .then((res) => {
        const prods = res.data || [];
        setProducts(prods);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch category info
    api.get<{ data: any[] }>('/categories')
      .then((res) => {
        const cats = res.data || [];
        const cat = cats.find((c: any) => c.slug === slug);
        if (cat) setCategoryInfo(cat);
      })
      .catch(() => {});
  }, [slug]);

  // Fetch recommended categories with their top 3 products
  useEffect(() => {
    api.get<{ data: any[] }>('/categories')
      .then(async (res) => {
        const cats = (res.data || []).slice(0, 8);
        const withProducts = await Promise.all(
          cats.map(async (cat: any) => {
            try {
              const prodRes = await api.get<{ data: any[] }>(`/products?category=${cat.slug}&sort=best_selling&perPage=3`);
              return { ...cat, products: prodRes.data || [] };
            } catch {
              return { ...cat, products: [] };
            }
          })
        );
        setRecommendedCats(withProducts.filter((c: any) => c.products.length > 0));
      })
      .catch(() => {});
  }, []);

  // Use API products or fall back to mock
  const displayProducts = products.length > 0
    ? products
    : (!loading ? MOCK_PRODUCTS : []);

  // Use API recommended categories or fall back to mock
  const displayRecommended = recommendedCats.length > 0 ? recommendedCats : RECOMMENDED_CATEGORIES;

  const title = categoryInfo?.name || fallbackData?.title || titleFromSlug;
  const description = fallbackData?.description || 'Classe en fonction du nombre total de vues de produits au cours des 90 derniers jours. Mis a jour quotidiennement.';

  // Helper to get product image URL (supports both API and mock format)
  const getProductImage = (product: any) => product.images?.[0]?.url || product.thumbnailUrl;

  // Helper to get product price display
  const getProductPrice = (product: any) => {
    if (product.price != null) return formatPrice(product.price);
    if (product.priceMin != null) {
      const min = product.priceMin;
      const max = product.priceMax;
      if (max && max > min) {
        return `${formatPrice(min)} - ${formatPrice(max)}`;
      }
      return formatPrice(min);
    }
    return formatPrice(0);
  };

  // Helper to get MOQ
  const getProductMoq = (product: any) => product.minOrderQty || product.moq || 1;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero banner: peach/orange gradient ─── */}
      <div className="bg-gradient-to-br from-[#FFF3E0] via-[#FFE0B2] to-[#FFCC80]">
        <div className="max-w-[1440px] mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="https://flagcdn.com/w20/cm.png"
                  alt="Cameroun"
                  className="w-5 h-3.5 object-cover rounded-[2px]"
                />
                <span className="text-[15px] font-semibold text-dark">Top des vues</span>
              </div>
              <h1 className="text-[36px] font-bold text-dark mb-3">{title}</h1>
              <p className="text-[15px] text-gray-2 max-w-[500px]">{description}</p>
            </div>
            {/* 3D icon placeholder */}
            <div className="w-[140px] h-[140px] flex items-center justify-center">
              <div className="w-[100px] h-[100px] rounded-2xl bg-orange/20 flex items-center justify-center rotate-12">
                <div className="w-[70px] h-[70px] rounded-xl bg-orange/30 flex items-center justify-center -rotate-6">
                  <div className="w-10 h-10 rounded-lg bg-orange/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top viewed title ─── */}
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-4">
        <h2 className="text-[28px] font-bold text-dark">Produits les plus consultes</h2>
      </div>

      {/* ─── Product grid with #N badges ─── */}
      <div className="max-w-[1440px] mx-auto px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-[16px] text-gray-3">Aucun produit trouve dans cette categorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {displayProducts.map((product, i) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group"
              >
                {/* Product image with ranking badge */}
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-6 mb-2">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Ranking badge */}
                  <span
                    className={`absolute top-2 left-2 min-w-[28px] h-[24px] flex items-center justify-center rounded px-1.5 text-[12px] font-bold text-white ${
                      i < 3 ? 'bg-[#00A06A]' : 'bg-[#999]'
                    }`}
                  >
                    #{i + 1}
                  </span>
                </div>
                {/* Product info */}
                <p className="text-[13px] text-dark line-clamp-2 leading-tight mb-1.5 min-h-[36px]">
                  {product.name}
                </p>
                <p className="text-[16px] font-bold text-dark leading-tight">
                  {getProductPrice(product)}
                </p>
                <p className="text-[12px] text-gray-3 mt-0.5">
                  Min. order: {getProductMoq(product)} piece{getProductMoq(product) > 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── Recommendations for you ─── */}
      <div className="bg-white border-t border-gray-5">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <h2 className="text-[28px] font-bold text-dark mb-6">Recommandations pour vous</h2>
          <div className="grid grid-cols-4 gap-4">
            {displayRecommended.map((cat: any, ci: number) => (
              <div key={ci} className="bg-white border border-gray-5 rounded-xl p-5 hover:shadow-md transition-shadow">
                {/* Category title */}
                <h3 className="text-[16px] font-bold text-dark leading-tight">{cat.name || cat.title}</h3>
                {/* Views stat */}
                {cat.views && (
                  <p className="text-[13px] mt-1">
                    <span className="text-orange font-semibold">{cat.views}</span>
                    <span className="text-gray-3">
                      {' '}{cat.viewsLabel || 'vues les 30 derniers jours'}
                    </span>
                  </p>
                )}
                {/* Flag + country */}
                <div className="flex items-center gap-1.5 mt-1.5 mb-4">
                  <img
                    src="https://flagcdn.com/w20/cm.png"
                    alt="Cameroun"
                    className="w-4 h-3 object-cover rounded-[1px]"
                  />
                  <span className="text-[12px] text-gray-3">Cameroun</span>
                </div>
                {/* Top 3 products */}
                <div className="flex gap-2">
                  {(cat.products || []).map((p: any, pi: number) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-6 mb-1.5">
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-1 left-1 min-w-[22px] h-[18px] flex items-center justify-center rounded px-1 text-[10px] font-bold text-white ${
                            pi === 0
                              ? 'bg-[#00A06A]'
                              : pi === 1
                              ? 'bg-[#999]'
                              : 'bg-[#CC6633]'
                          }`}
                        >
                          #{pi + 1}
                        </span>
                      </div>
                      <p className="text-[12px] font-bold text-dark leading-tight truncate">
                        {getProductPrice(p)}
                      </p>
                      <p className="text-[10px] text-gray-3 truncate">
                        Min. order: {getProductMoq(p)}...
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
