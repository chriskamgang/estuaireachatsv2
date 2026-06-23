'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface SellerSale {
  id: number;
  vendeur: string;
  boutique: string;
  nbCommandes: number;
  revenu: number;
  commission: number;
}

const columns: Column<SellerSale>[] = [
  { name: 'Vendeur', key: 'vendeur' },
  { name: 'Boutique', key: 'boutique' },
  {
    name: 'Nb commandes',
    key: 'nbCommandes',
    render: (item) => <span className="font-semibold">{item.nbCommandes}</span>,
  },
  {
    name: 'Revenu',
    key: 'revenu',
    render: (item) => <span className="font-semibold text-success">{formatPrice(item.revenu)}</span>,
  },
  {
    name: 'Commission',
    key: 'commission',
    render: (item) => <span className="font-semibold text-primary">{formatPrice(item.commission)}</span>,
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [sellersData, setSellersData] = useState<SellerSale[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/orders/admin/all?perPage=200');
        const orders = res.data || [];

        // Group orders by seller
        const sellerMap: Record<string, { vendeur: string; boutique: string; nbCommandes: number; revenu: number; commission: number }> = {};

        orders.forEach((o: any) => {
          const sellerId = o.sellerId || o.seller?.id || 'unknown';
          const sellerName = o.seller?.name || o.sellerName || 'Vendeur inconnu';
          const shopName = o.seller?.shopName || o.seller?.shop?.name || o.shopName || sellerName;

          if (!sellerMap[sellerId]) {
            sellerMap[sellerId] = {
              vendeur: sellerName,
              boutique: shopName,
              nbCommandes: 0,
              revenu: 0,
              commission: 0,
            };
          }

          sellerMap[sellerId].nbCommandes += 1;
          sellerMap[sellerId].revenu += o.totalAmount || o.total || o.grandTotal || 0;
          sellerMap[sellerId].commission += o.commission || o.adminCommission || Math.round((o.totalAmount || o.total || 0) * 0.05);
        });

        const mapped: SellerSale[] = Object.entries(sellerMap).map(([key, val], idx) => ({
          id: idx + 1,
          ...val,
        }));

        // Sort by revenue descending
        mapped.sort((a, b) => b.revenu - a.revenu);

        setSellersData(mapped);
      } catch (err) {
        console.error('Erreur chargement ventes vendeurs:', err);
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

  const totalRevenu = sellersData.reduce((s, r) => s + r.revenu, 0);
  const totalCommissions = sellersData.reduce((s, r) => s + r.commission, 0);
  const nbVendeursActifs = sellersData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Ventes vendeurs</h1>
          <p className="text-sm text-gray-2">Performance des vendeurs partenaires</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total revenus vendeurs</p>
          <p className="text-2xl font-bold text-dark">{formatPrice(totalRevenu)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total commissions</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(totalCommissions)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Vendeurs actifs</p>
          <p className="text-2xl font-bold text-dark">{nbVendeursActifs}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Performance par vendeur</h2>
        </div>
        <DataTable
          columns={columns}
          data={sellersData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: sellersData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
