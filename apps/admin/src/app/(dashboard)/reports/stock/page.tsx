'use client';

import { useState, useEffect } from 'react';
import { Boxes, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface StockItem {
  id: number;
  produit: string;
  sku: string;
  stockActuel: number;
  stockMin: number;
  statut: 'En stock' | 'Faible' | 'Rupture';
}

const statutStyle: Record<StockItem['statut'], string> = {
  'En stock': 'bg-success-soft text-success',
  'Faible': 'bg-warning-soft text-warning',
  'Rupture': 'bg-danger-soft text-danger',
};

const columns: Column<StockItem>[] = [
  { name: 'Produit', key: 'produit' },
  { name: 'SKU', key: 'sku', render: (item) => <span className="font-mono text-xs text-gray-2">{item.sku}</span> },
  {
    name: 'Stock actuel',
    key: 'stockActuel',
    render: (item) => <span className="font-bold">{item.stockActuel}</span>,
  },
  {
    name: 'Stock min',
    key: 'stockMin',
    render: (item) => <span className="text-gray-2">{item.stockMin}</span>,
  },
  {
    name: 'Statut',
    key: 'statut',
    render: (item) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statutStyle[item.statut]}`}>
        {item.statut}
      </span>
    ),
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/products/admin/all?perPage=500');
        const products = res.data || [];

        const mapped: StockItem[] = products.map((p: any) => {
          const stock = p.stock ?? p.quantity ?? p.currentStock ?? 0;
          const minStock = p.minStock ?? p.lowStockThreshold ?? 10;
          let statut: StockItem['statut'] = 'En stock';
          if (stock === 0) {
            statut = 'Rupture';
          } else if (stock <= minStock) {
            statut = 'Faible';
          }

          return {
            id: p.id,
            produit: p.name || p.title || 'Produit sans nom',
            sku: p.sku || p.slug || '--',
            stockActuel: stock,
            stockMin: minStock,
            statut,
          };
        });

        // Sort: Rupture first, then Faible, then En stock
        const order = { 'Rupture': 0, 'Faible': 1, 'En stock': 2 };
        mapped.sort((a, b) => order[a.statut] - order[b.statut]);

        setStockData(mapped);
      } catch (err) {
        console.error('Erreur chargement stock:', err);
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

  const enStock = stockData.filter((i) => i.statut === 'En stock').length;
  const faible = stockData.filter((i) => i.statut === 'Faible').length;
  const rupture = stockData.filter((i) => i.statut === 'Rupture').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Boxes className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Stock produits</h1>
          <p className="text-sm text-gray-2">Suivi des niveaux de stock en temps reel</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Produits en stock</p>
          <p className="text-2xl font-bold text-success">{enStock}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Stock faible</p>
          <p className="text-2xl font-bold text-warning">{faible}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">En rupture</p>
          <p className="text-2xl font-bold text-danger">{rupture}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Inventaire produits</h2>
        </div>
        <DataTable
          columns={columns}
          data={stockData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: stockData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
