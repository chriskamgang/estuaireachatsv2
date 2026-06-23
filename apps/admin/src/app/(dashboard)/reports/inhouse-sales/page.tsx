'use client';

import { useState, useEffect } from 'react';
import { BarChart, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface InhouseSale {
  id: number;
  produit: string;
  categorie: string;
  quantite: number;
  revenu: number;
  date: string;
}

const columns: Column<InhouseSale>[] = [
  { name: 'Produit', key: 'produit' },
  { name: 'Categorie', key: 'categorie' },
  {
    name: 'Quantite vendue',
    key: 'quantite',
    render: (item) => <span className="font-semibold">{item.quantite} unites</span>,
  },
  {
    name: 'Revenu',
    key: 'revenu',
    render: (item) => <span className="font-semibold text-success">{formatPrice(item.revenu)}</span>,
  },
  {
    name: 'Date',
    key: 'date',
    render: (item) => formatDate(item.date),
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<InhouseSale[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/orders/admin/all?perPage=200');
        const orders = res.data || [];

        // Filter inhouse orders (added by admin)
        const inhouseOrders = orders.filter(
          (o: any) => o.addedBy === 'admin' || o.seller === null || o.sellerId === null
        );

        const mapped: InhouseSale[] = inhouseOrders.map((o: any, idx: number) => ({
          id: o.id || idx + 1,
          produit: o.items?.[0]?.product?.name || o.items?.[0]?.productName || o.code || `Commande #${o.id}`,
          categorie: o.items?.[0]?.product?.category?.name || o.items?.[0]?.categoryName || 'General',
          quantite: o.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1,
          revenu: o.totalAmount || o.total || o.grandTotal || 0,
          date: o.createdAt || o.date || '',
        }));

        setSalesData(mapped);
      } catch (err) {
        console.error('Erreur chargement ventes internes:', err);
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

  const totalRevenu = salesData.reduce((s, r) => s + r.revenu, 0);
  const totalVentes = salesData.reduce((s, r) => s + r.quantite, 0);
  const topProduit = salesData.length > 0
    ? salesData.reduce((a, b) => (a.quantite > b.quantite ? a : b))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Ventes internes</h1>
          <p className="text-sm text-gray-2">Rapport des ventes de produits maison</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total revenus</p>
          <p className="text-2xl font-bold text-dark">{formatPrice(totalRevenu)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Nb ventes (unites)</p>
          <p className="text-2xl font-bold text-dark">{totalVentes.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Produit le plus vendu</p>
          <p className="text-lg font-bold text-dark truncate">{topProduit?.produit || '--'}</p>
          <p className="text-sm text-gray-2">{topProduit ? `${topProduit.quantite} unites` : '--'}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Detail des ventes</h2>
        </div>
        <DataTable
          columns={columns}
          data={salesData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: salesData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
