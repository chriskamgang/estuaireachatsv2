'use client';

import { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, DollarSign, TrendingUp, Eye, Clock, Star, Loader2,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface OrderItem {
  code: string;
  date: string;
  client: string;
  montant: number;
  statut: string;
}

interface TopProduct {
  name: string;
  ventes: number;
  montant: number;
}

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  pendingOrders: number;
  activeProducts: number;
  balance: number;
  monthRevenue: number;
  recentOrders: OrderItem[];
  topProducts: TopProduct[];
}

const orderColumns: Column<OrderItem>[] = [
  { name: 'Code', key: 'code' },
  { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  { name: 'Client', key: 'client' },
  { name: 'Montant', key: 'montant', render: (item) => formatPrice(item.montant) },
  { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
  {
    name: 'Action', key: 'action',
    render: () => (
      <button className="p-1.5 hover:bg-gray-6 rounded-lg transition">
        <Eye className="w-4 h-4 text-primary" />
      </button>
    ),
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgRating: 0,
    pendingOrders: 0,
    activeProducts: 0,
    balance: 0,
    monthRevenue: 0,
    recentOrders: [],
    topProducts: [],
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get<any>('/shops/me/dashboard');
        if (res.result && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-dark">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Produits"
          value={data.totalProducts.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)"
          icon={Package}
        />
        <StatCard
          title="Total Commandes"
          value={data.totalOrders.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Ventes"
          value={formatPrice(data.totalRevenue)}
          gradient="linear-gradient(135deg, #28c76f 0%, #48da89 100%)"
          icon={DollarSign}
        />
        <StatCard
          title="Note moyenne"
          value={`${data.avgRating.toFixed(1)} / 5`}
          gradient="linear-gradient(135deg, #ea5455 0%, #f08182 100%)"
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Commandes en attente" value={data.pendingOrders.toLocaleString('fr-FR')} icon={Clock} />
        <StatCard title="Produits actifs" value={data.activeProducts.toLocaleString('fr-FR')} icon={Package} />
        <StatCard title="Solde disponible" value={formatPrice(data.balance)} icon={DollarSign} />
        <StatCard title="Ce mois" value={formatPrice(data.monthRevenue)} icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-dark">Ventes des 12 derniers mois</h2>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-5 rounded-lg">
          <p className="text-gray-3 text-sm">Graphique des ventes (a integrer)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-dark mb-4">Commandes recentes</h2>
          <DataTable columns={orderColumns} data={data.recentOrders} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-dark mb-4">Top Produits</h2>
          <div className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-8">Aucune donnee disponible</p>
            ) : (
              data.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-5 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{product.name}</p>
                    <p className="text-xs text-gray-3">{product.ventes} ventes</p>
                  </div>
                  <span className="text-xs font-medium text-gray-2 whitespace-nowrap">
                    {formatPrice(product.montant)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
