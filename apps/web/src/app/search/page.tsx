'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { api } from '@/lib/api';
import type { Product } from '@/lib/mockData';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

type SortOption =
  | 'pertinence'
  | 'plus-vendus'
  | 'prix-croissant'
  | 'prix-decroissant'
  | 'nouveautes';

const SORT_MAP: Record<SortOption, string> = {
  'pertinence': 'relevance',
  'plus-vendus': 'best_selling',
  'prix-croissant': 'price_asc',
  'prix-decroissant': 'price_desc',
  'nouveautes': 'newest',
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'plus-vendus', label: 'Plus vendus' },
  { value: 'prix-croissant', label: 'Prix croissant' },
  { value: 'prix-decroissant', label: 'Prix decroissant' },
  { value: 'nouveautes', label: 'Nouveautes' },
];

const ITEMS_PER_PAGE = 20;

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><div className="text-gray-3">Chargement...</div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [sort, setSort] = useState<SortOption>('pertinence');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [moqMax, setMoqMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les categories
  useEffect(() => {
    api.get<{ data: Category[] }>('/categories')
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Charger les produits quand les filtres changent
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceMin) params.set('minPrice', priceMin);
    if (priceMax) params.set('maxPrice', priceMax);
    if (moqMax) params.set('maxMoq', moqMax);
    if (verifiedOnly) params.set('verified', 'true');
    params.set('sort', SORT_MAP[sort]);
    params.set('page', String(currentPage));
    params.set('perPage', String(ITEMS_PER_PAGE));

    api.get<{ data: Product[]; meta: { total: number; lastPage: number } }>(`/products?${params.toString()}`)
      .then(res => {
        setProducts(res.data || []);
        setTotalProducts(res.meta?.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotalProducts(0);
      })
      .finally(() => setLoading(false));
  }, [query, sort, verifiedOnly, selectedCategory, priceMin, priceMax, moqMax, currentPage]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setVerifiedOnly(false);
    setSelectedCategory(null);
    setPriceMin('');
    setPriceMax('');
    setMoqMax('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    verifiedOnly || selectedCategory || priceMin || priceMax || moqMax;

  return (
    <div className="bg-gray-6 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-4">
        {/* Breadcrumb + Result count */}
        <div className="mb-4">
          <p className="text-sm text-gray-3 mb-1">
            Resultats de recherche{query ? ` pour "${query}"` : ''}
          </p>
          <p className="text-sm text-gray-2">
            {loading ? 'Chargement...' : `${totalProducts} produit${totalProducts !== 1 ? 's' : ''} trouve${totalProducts !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex gap-4">
          {/* Left Sidebar Filters */}
          {showFilters && (
            <aside className="w-64 shrink-0">
              <div className="bg-white rounded-lg p-4 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-dark flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-orange hover:underline"
                    >
                      Reinitialiser
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-dark mb-2">
                    Categories
                  </h4>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setCurrentPage(1);
                        }}
                        className={`text-sm w-full text-left px-2 py-1.5 rounded ${
                          !selectedCategory
                            ? 'text-orange font-medium bg-orange/5'
                            : 'text-gray-2 hover:text-dark'
                        }`}
                      >
                        Toutes les categories
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setCurrentPage(1);
                          }}
                          className={`text-sm w-full text-left px-2 py-1.5 rounded ${
                            selectedCategory === cat.slug
                              ? 'text-orange font-medium bg-orange/5'
                              : 'text-gray-2 hover:text-dark'
                          }`}
                        >
                          <CategoryIcon name={cat.icon} size={14} className="inline-block mr-1" /> {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-dark mb-2">
                    Prix (FCFA)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => {
                        setPriceMin(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-5 rounded outline-none focus:border-orange"
                    />
                    <span className="text-gray-3">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => {
                        setPriceMax(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-5 rounded outline-none focus:border-orange"
                    />
                  </div>
                </div>

                {/* MOQ */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-dark mb-2">
                    MOQ max (pieces)
                  </h4>
                  <input
                    type="number"
                    placeholder="Ex: 100"
                    value={moqMax}
                    onChange={(e) => {
                      setMoqMax(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-5 rounded outline-none focus:border-orange"
                  />
                </div>

                {/* Verified Only */}
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => {
                        setVerifiedOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 accent-orange rounded"
                    />
                    <span className="text-sm text-dark flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-secondary" />
                      Fournisseurs verifies uniquement
                    </span>
                  </label>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort + View toggle */}
            <div className="bg-white rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm text-gray-2 hover:text-dark flex items-center gap-1 mr-4"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs bg-gray-6 text-gray-2 px-2 py-1 rounded-full hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-3 mr-2">Trier par :</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSort(opt.value);
                      setCurrentPage(1);
                    }}
                    className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                      sort === opt.value
                        ? 'bg-orange text-white'
                        : 'text-gray-2 hover:bg-gray-6'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div
                className={`grid gap-4 ${
                  showFilters
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                }`}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  showFilters
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-16 text-center">
                <p className="text-gray-3 text-lg mb-2">
                  Aucun produit trouve
                </p>
                <p className="text-gray-3 text-sm">
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-orange hover:underline"
                >
                  Reinitialiser les filtres
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-5 text-gray-2 hover:border-orange hover:text-orange disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-orange text-white'
                        : 'border border-gray-5 text-gray-2 hover:border-orange hover:text-orange'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-5 text-gray-2 hover:border-orange hover:text-orange disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
