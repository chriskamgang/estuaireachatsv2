'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { api } from '@/lib/api';

interface ApiSubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  children?: ApiSubCategory[];
}

interface MegaMenuProps {
  onClose: () => void;
}

export default function MegaMenu({ onClose }: MegaMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    api.get<{ data: ApiCategory[] }>('/categories')
      .then(res => {
        setCategories(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll sync: when scrolling the right panel, highlight the corresponding category
  const handleScroll = useCallback(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    const scrollTop = panel.scrollTop + 40;
    for (let i = sectionRefs.current.length - 1; i >= 0; i--) {
      const section = sectionRefs.current[i];
      if (section && section.offsetTop <= scrollTop) {
        setActiveIndex(i);
        break;
      }
    }
  }, []);

  // Click on left category -> scroll right panel to that section
  const scrollToSection = (idx: number) => {
    setActiveIndex(idx);
    const section = sectionRefs.current[idx];
    if (section && rightPanelRef.current) {
      rightPanelRef.current.scrollTo({
        top: section.offsetTop - 20,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="fixed inset-x-0 top-[110px] z-50" onMouseLeave={onClose}>
      {/* Menu panel */}
      <div
        className="flex bg-white shadow-lg border-t border-gray-5"
        style={{ height: '65vh', maxHeight: '600px' }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-3">
            Aucune categorie disponible
          </div>
        ) : (
          <>
            {/* Left: category list */}
            <div className="w-[300px] shrink-0 border-r border-gray-5 overflow-y-auto py-1">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToSection(idx)}
                  onMouseEnter={() => scrollToSection(idx)}
                  className={`flex w-full items-center gap-3 px-6 py-3 text-[15px] transition-colors text-left ${
                    activeIndex === idx
                      ? 'font-semibold text-dark'
                      : 'text-gray-1 hover:text-dark'
                  }`}
                >
                  <CategoryIcon name={cat.icon} size={18} className={activeIndex === idx ? 'text-dark' : 'text-gray-3'} />
                  {cat.name}
                  <ChevronRight size={14} className="ml-auto text-gray-4" />
                </button>
              ))}
            </div>

            {/* Right: subcategories with images */}
            <div
              ref={rightPanelRef}
              className="flex-1 overflow-y-auto px-8 py-4"
              onScroll={handleScroll}
            >
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  ref={(el: HTMLDivElement | null) => { sectionRefs.current[idx] = el; }}
                  className="mb-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-bold text-dark">{cat.name}</h3>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="text-[13px] text-orange hover:underline"
                      onClick={onClose}
                    >
                      Voir les selections
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    {(cat.children || []).map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${cat.slug}/${sub.slug}`}
                        className="group text-center w-[100px]"
                        onClick={onClose}
                      >
                        <div className="w-[90px] h-[90px] mx-auto rounded-lg overflow-hidden bg-gray-6 mb-2 group-hover:shadow-md transition-shadow">
                          {sub.image ? (
                            <img
                              src={sub.image}
                              alt={sub.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-4" />
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] text-gray-1 group-hover:text-orange transition-colors leading-tight line-clamp-2">
                          {sub.name}
                        </span>
                      </Link>
                    ))}
                    {(!cat.children || cat.children.length === 0) && (
                      <p className="text-[13px] text-gray-3">Aucune sous-categorie</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
