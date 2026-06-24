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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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

interface MonthlyRevenue {
  mois: string;
  montant: number;
}

interface DashboardData {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  totalSellers: number;
  totalCategories: number;
  totalBrands: number;
  recentOrders: OrderItem[];
  monthlyRevenue: MonthlyRevenue[];
  topProducts: { nom: string; ventes: number; montant: number }[];
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
    totalSellers: 0,
    totalCategories: 0,
    totalBrands: 0,
    recentOrders: [],
    monthlyRevenue: [],
    topProducts: [],
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, usersRes, productsRes, recentOrdersRes, reportsRes, sellersRes, categoriesRes, brandsRes] = await Promise.all([
          api.get<any>('/orders/admin/all?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/users?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/products/admin/all?perPage=1').catch(() => ({ meta: { total: 0 } })),
          api.get<any>('/orders/admin/all?perPage=10').catch(() => ({ data: [] })),
          api.get<any>('/orders/admin/reports').catch(() => ({ data: {} })),
          api.get<any>('/shops?verified=true').catch(() => ({ data: [] })),
          api.get<any>('/categories').catch(() => ({ data: [] })),
          api.get<any>('/brands').catch(() => ({ data: [] })),
        ]);

        const report = reportsRes.data || {};

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
          totalOrders: report.totalOrders || ordersRes.meta?.total || 0,
          totalUsers: usersRes.meta?.total || 0,
          totalProducts: productsRes.meta?.total || 0,
          totalRevenue: report.totalRevenue || 0,
          pendingOrders: pendingCount,
          totalSellers: Array.isArray(sellersRes.data) ? sellersRes.data.length : (sellersRes.data || []).length,
          totalCategories: Array.isArray(categoriesRes.data) ? categoriesRes.data.length : 0,
          totalBrands: Array.isArray(brandsRes.data) ? brandsRes.data.length : 0,
          recentOrders: orders,
          monthlyRevenue: report.revenusMensuels || [],
          topProducts: report.topProduits || [],
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
          value={data.totalCategories.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)"
          icon={FolderTree}
        />
        <StatCard
          title="Total Marques"
          value={data.totalBrands.toLocaleString('fr-FR')}
          gradient="linear-gradient(135deg, #ea5455 0%, #f08182 100%)"
          icon={Tags}
        />
      </div>

      {/* Row 2: Plain stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Produits" value={data.totalProducts.toLocaleString('fr-FR')} icon={Package} />
        <StatCard title="Total Vendeurs" value={data.totalSellers.toLocaleString('fr-FR')} icon={Store} />
        <StatCard title="Commandes en attente" value={data.pendingOrders.toLocaleString('fr-FR')} icon={Clock} />
        <StatCard
          title="Total Revenus"
          value={formatPrice(data.totalRevenue)}
          icon={DollarSign}
        />
      </div>

      {/* Row 3: Sales chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-dark">Ventes des 12 derniers mois</h2>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        {data.monthlyRevenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-5 rounded-lg">
            <p className="text-gray-3 text-sm">Aucune donnee de ventes disponible</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E82328" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E82328" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip
                  formatter={(value: number) => [formatPrice(value), 'Revenus']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="montant" stroke="#E82328" strokeWidth={2.5} fill="url(#colorMontant)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
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
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-8">Aucune donnee disponible</p>
            ) : (
              data.topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b border-gray-5 last:border-0"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{product.nom}</p>
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
