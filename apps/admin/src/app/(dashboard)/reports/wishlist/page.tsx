'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface WishlistItem {
  id: number;
  produit: string;
  nbAjouts: number;
  conversions: number;
  tauxConversion: number;
}

const columns: Column<WishlistItem>[] = [
  { name: 'Produit', key: 'produit' },
  {
    name: 'Nb ajouts wishlist',
    key: 'nbAjouts',
    render: (item) => <span className="font-semibold">{item.nbAjouts.toLocaleString('fr-FR')}</span>,
  },
  {
    name: 'Conversions',
    key: 'conversions',
    render: (item) => <span className="font-semibold text-success">{item.conversions}</span>,
  },
  {
    name: 'Taux conversion',
    key: 'tauxConversion',
    render: (item) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(item.tauxConversion, 100)}%` }}
          />
        </div>
        <span className="text-sm font-semibold">{item.tauxConversion}%</span>
      </div>
    ),
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/products/admin/all?perPage=200');
        const products = res.data || [];

        const mapped: WishlistItem[] = products
          .map((p: any) => {
            const nbAjouts = p.wishlistCount || p.wishlist_count || p.wishlists?.length || 0;
            const conversions = p.orderCount || p.order_count || 0;
            const tauxConversion = nbAjouts > 0 ? Math.round((conversions / nbAjouts) * 1000) / 10 : 0;

            return {
              id: p.id,
              produit: p.name || p.title || 'Produit sans nom',
              nbAjouts,
              conversions,
              tauxConversion,
            };
          })
          .filter((p: WishlistItem) => p.nbAjouts > 0)
          .sort((a: WishlistItem, b: WishlistItem) => b.nbAjouts - a.nbAjouts);

        setWishlistData(mapped);
      } catch (err) {
        console.error('Erreur chargement wishlist:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalProduits = wishlistData.length;
  const totalAjouts = wishlistData.reduce((s, r) => s + r.nbAjouts, 0);
  const tauxMoyen = wishlistData.length > 0
    ? (wishlistData.reduce((s, r) => s + r.tauxConversion, 0) / wishlistData.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Wishlist produits</h1>
          <p className="text-sm text-gray-2">Produits les plus desires par les utilisateurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Produits en wishlist</p>
          <p className="text-2xl font-bold text-dark">{totalProduits}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total ajouts</p>
          <p className="text-2xl font-bold text-dark">{totalAjouts.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Taux conversion moyen</p>
          <p className="text-2xl font-bold text-primary">{tauxMoyen}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Analyse wishlist</h2>
        </div>
        <DataTable
          columns={columns}
          data={wishlistData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: wishlistData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
