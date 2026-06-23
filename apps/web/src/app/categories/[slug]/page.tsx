'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import ProductCard from '@/components/product/ProductCard';
import { api } from '@/lib/api';
import type { Product } from '@/lib/mockData';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  children?: { id: string; name: string; slug: string }[];
  subcategories?: { id: string; name: string; slug: string }[];
}

const ITEMS_PER_PAGE = 20;

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Charger la categorie
  useEffect(() => {
    api.get<{ data: CategoryData }>(`/categories/${slug}`)
      .then(res => {
        if (res.data) {
          setCategory(res.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));

    api.get<{ data: CategoryData[] }>('/categories')
      .then(res => setAllCategories(res.data || []))
      .catch(() => {});
  }, [slug]);

  // Charger les produits quand la page ou sous-categorie change
  useEffect(() => {
    setLoading(true);
    const categorySlug = selectedSub || slug;
    api.get<{ data: Product[]; meta: { total: number } }>(`/products?category=${categorySlug}&perPage=${ITEMS_PER_PAGE}&page=${currentPage}`)
      .then(res => {
        setProducts(res.data || []);
        setTotalProducts(res.meta?.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotalProducts(0);
      })
      .finally(() => setLoading(false));
  }, [slug, selectedSub, currentPage]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const subcategories = category?.children || category?.subcategories || [];

  if (notFound) {
    return (
      <div className="bg-gray-6 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-dark mb-2">
            Categorie introuvable
          </h1>
          <p className="text-gray-3 mb-4">
            Cette categorie n&apos;existe pas ou a ete supprimee.
          </p>
          <Link
            href="/categories"
            className="text-orange hover:underline font-medium"
          >
            Voir toutes les categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-6 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-3 mb-4">
          <Link href="/" className="hover:text-orange">
            Accueil
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/categories" className="hover:text-orange">
            Categories
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark font-medium">{category?.name || slug}</span>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3">
            {category?.icon && <CategoryIcon name={category.icon} size={30} className="text-dark" />}
            <div>
              <h1 className="text-2xl font-bold text-dark">{category?.name || slug}</h1>
              <p className="text-sm text-gray-3">
                {loading ? 'Chargement...' : `${totalProducts} produit${totalProducts !== 1 ? 's' : ''} disponible${totalProducts !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Left: Category Sidebar */}
          <aside className="w-64 shrink-0">
            <div className="bg-white rounded-lg p-4 sticky top-4">
              <h3 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange" />
                Sous-categories
              </h3>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => { setSelectedSub(null); setCurrentPage(1); }}
                    className={`text-sm w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedSub
                        ? 'text-orange font-medium bg-orange/5'
                        : 'text-gray-2 hover:text-dark hover:bg-gray-6'
                    }`}
                  >
                    Tout voir
                  </button>
                </li>
                {subcategories.map((sub) => (
                  <li key={sub.id}>
                    <button
                      onClick={() => { setSelectedSub(sub.slug); setCurrentPage(1); }}
                      className={`text-sm w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedSub === sub.slug
                          ? 'text-orange font-medium bg-orange/5'
                          : 'text-gray-2 hover:text-dark hover:bg-gray-6'
                      }`}
                    >
                      {sub.name}
                    </button>
                  </li>
                ))}
                {subcategories.length === 0 && !loading && (
                  <li className="text-sm text-gray-3 px-3 py-2">Aucune sous-categorie</li>
                )}
              </ul>

              {/* Other categories */}
              {allCategories.filter((c) => c.slug !== slug).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-5">
                  <h4 className="text-xs font-bold text-gray-3 uppercase tracking-wide mb-2">
                    Autres categories
                  </h4>
                  <ul className="space-y-0.5">
                    {allCategories.filter((c) => c.slug !== slug)
                      .slice(0, 5)
                      .map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/categories/${c.slug}`}
                            className="text-sm text-gray-2 hover:text-orange flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-6 transition-colors"
                          >
                            {c.icon && <CategoryIcon name={c.icon} size={14} className="text-gray-3" />}
                            {c.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          {/* Right: Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-5 text-gray-2 hover:border-orange hover:text-orange disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-5 text-gray-2 hover:border-orange hover:text-orange disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg p-16 text-center">
                <p className="text-gray-3 text-lg mb-2">
                  Aucun produit dans cette categorie
                </p>
                <p className="text-gray-3 text-sm">
                  Revenez bientot, de nouveaux produits sont ajoutes
                  regulierement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
