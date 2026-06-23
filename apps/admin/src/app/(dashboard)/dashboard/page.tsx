'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  ShoppingCart,
  FolderTree,
  Tags,
  Package,
  Store,
  Clock,
  DollarSign,
  Eye,
  TrendingUp,
  Loader2,
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

interface DashboardData {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: OrderItem[];
}

const orderColumns: Column<OrderItem>[] = [
  { name: 'Code', key: 'code' },
  { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  { name: 'Client', key: 'client' },
  { name: 'Montant', key: 'montant', render: (item) => formatPrice(item.montant) },
  { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
  {
    name: 'Action',
    key: 'action',
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
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: [],
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, usersRes, productsRes, recentOrdersRes, paymentsRes] = await Promise.all([
          api.get<any>('/orders/admin/all?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/users?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/products/admin/all?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/orders/admin/all?perPage=10').catch(() => ({ data: [] })),
          api.get<any>('/payments/stats').catch(() => ({ totalRevenue: 0 })),
        ]);

        const orders = (recentOrdersRes.data || []).map((o: any) => ({
          code: o.code || o.orderCode || `CMD-${o.id}`,
          date: o.createdAt || o.date || '',
          client: o.user?.name || o.userName || o.customer?.name || 'Client',
          montant: o.totalAmount || o.total || o.grandTotal || 0,
          statut: o.status || 'PENDING',
        }));

        const pendingCount = (recentOrdersRes.data || []).filter(
          (o: any) => o.status === 'PENDING'
        ).length;

        setData({
          totalOrders: ordersRes.meta?.total || 0,
          totalUsers: usersRes.meta?.total || 0,
          totalProducts: productsRes.meta?.total || 0,
          totalRevenue: paymentsRes.totalRevenue || paymentsRes.total || 0,
          pendingOrders: pendingCount,
          recentOrders: orders,
        });
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
      {/* Page title */}
      <h1 className="text-xl font-bold text-dark">Dashboard</h1>

      {/* Row 1: Gradient stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={data.totalUsers.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #28c76f 0%, #48da89 100%)"
          icon={Users}
        />
        <StatCard
          title="Total Commandes"
          value={data.totalOrders.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Categories"
          value="--"
          gradient="linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)"
          icon={FolderTree}
        />
        <StatCard
          title="Total Marques"
          value="--"
          gradient="linear-gradient(135deg, #ea5455 0%, #f08182 100%)"
          icon={Tags}
        />
      </div>

      {/* Row 2: Plain stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Produits" value={data.totalProducts.toLocaleString('fr-FR')} icon={Package} />
        <StatCard title="Total Vendeurs" value="--" icon={Store} />
        <StatCard title="Commandes en attente" value={data.pendingOrders.toLocaleString('fr-FR')} icon={Clock} />
        <StatCard
          title="Total Revenus"
          value={formatPrice(data.totalRevenue)}
          icon={DollarSign}
        />
      </div>

      {/* Row 3: Sales chart placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-dark">Ventes des 12 derniers mois</h2>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-5 rounded-lg">
          <p className="text-gray-3 text-sm">Graphique des ventes (a integrer)</p>
        </div>
      </div>

      {/* Row 4: Recent orders + Top products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders (2/3 width) */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-dark mb-4">Commandes recentes</h2>
          <DataTable
            columns={orderColumns}
            data={data.recentOrders}
            pagination={{ page: 1, perPage: 10, total: data.totalOrders }}
          />
        </div>

        {/* Top 10 products (1/3 width) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-dark mb-4">Top 10 Produits</h2>
          <div className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-8">Aucune donnee disponible</p>
            ) : (
              data.recentOrders.slice(0, 10).map((order, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b border-gray-5 last:border-0"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{order.client}</p>
                    <p className="text-xs text-gray-3">{order.code}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-2 whitespace-nowrap">
                    {formatPrice(order.montant)}
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
