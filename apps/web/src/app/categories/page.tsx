'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { api } from '@/lib/api';

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  children?: { id: string; name: string; slug: string }[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get<{ data: ApiCategory[] }>('/categories')
      .then(res => {
        setCategories(res.data || []);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-6 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-3 mb-6">
          <Link href="/" className="hover:text-orange">
            Accueil
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark font-medium">Toutes les categories</span>
        </div>

        <h1 className="text-2xl font-bold text-dark mb-6">
          Toutes les categories
        </h1>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-20 text-gray-3">
            <p className="text-lg mb-2">Impossible de charger les categories</p>
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                api.get<{ data: ApiCategory[] }>('/categories')
                  .then(res => setCategories(res.data || []))
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              className="text-orange hover:underline"
            >
              Reessayer
            </button>
          </div>
        )}

        {/* Category Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="bg-white rounded-lg overflow-hidden border border-gray-5 hover:shadow-lg hover:border-orange transition-all group"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-6">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CategoryIcon name={cat.icon} size={40} className="text-gray-3" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon name={cat.icon} size={24} className="text-gray-2" />
                    <h2 className="text-base font-bold text-dark group-hover:text-orange transition-colors">
                      {cat.name}
                    </h2>
                  </div>

                  {/* Subcategories preview */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.children.slice(0, 3).map((sub) => (
                        <span
                          key={sub.id}
                          className="text-xs text-gray-3 bg-gray-6 px-2 py-0.5 rounded-full"
                        >
                          {sub.name}
                        </span>
                      ))}
                      {cat.children.length > 3 && (
                        <span className="text-xs text-orange font-medium">
                          +{cat.children.length - 3} plus
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
