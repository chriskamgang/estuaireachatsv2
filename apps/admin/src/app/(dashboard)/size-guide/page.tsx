'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ruler, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SizeGuide {
  id: number;
  name: string;
  category: string;
  sizes: Record<string, string>[];
}

export default function SizeGuidePage() {
  const [guides, setGuides] = useState<SizeGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: SizeGuide[] }>('/size-guides');
      setGuides(res.data);
      if (res.data.length > 0 && !tab) {
        setTab(res.data[0].category);
      }
    } catch (err) {
      console.error('Erreur chargement guides:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const categories = [...new Set(guides.map((g) => g.category))];
  const currentGuides = guides.filter((g) => g.category === tab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if no guides from API
  if (guides.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Ruler className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Guide des tailles</h1>
            <p className="text-sm text-gray-3">Aucun guide de tailles configure</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-3">Aucun guide de tailles disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Ruler className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Guide des tailles</h1>
          <p className="text-sm text-gray-3">Reference des tailles pour les produits</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setTab(cat)} className={`px-5 py-3 text-sm font-medium relative ${tab === cat ? 'text-primary' : 'text-gray-3'}`}>
              {cat}
              {tab === cat && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="p-6">
          {currentGuides.map((guide) => {
            const sizes = typeof guide.sizes === 'string' ? JSON.parse(guide.sizes) : guide.sizes;
            if (!Array.isArray(sizes) || sizes.length === 0) return null;
            const headers = Object.keys(sizes[0]);
            return (
              <div key={guide.id} className="mb-6">
                <h3 className="text-sm font-semibold text-dark mb-3">{guide.name}</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-5">
                      {headers.map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-3 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((row: Record<string, string>, i: number) => (
                      <tr key={i} className="border-b border-gray-5 last:border-0">
                        {headers.map((h, j) => (
                          <td key={h} className={`py-3 px-4 text-sm ${j === 0 ? 'font-semibold text-dark' : 'text-gray-2'}`}>
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
