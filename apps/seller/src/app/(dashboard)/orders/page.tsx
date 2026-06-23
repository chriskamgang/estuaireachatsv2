'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, Search, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  buyer?: { id: string; firstName: string; lastName: string; email: string; phone: string };
  details: { id: string; name: string; image: string; price: number; quantity: number; total: number }[];
}

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'PROCESSING', label: 'En traitement' },
  { key: 'SHIPPED', label: 'Expediees' },
  { key: 'DELIVERED', label: 'Livrees' },
  { key: 'CANCELLED', label: 'Annulees' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<{ data: Order[]; meta: any }>('/orders/admin/all?perPage=200')
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== 'all' && o.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        const buyerName = `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`.toLowerCase();
        if (!o.orderNumber.toLowerCase().includes(q) && !buyerName.includes(q)) return false;
      }
      return true;
    });
  }, [orders, activeTab, search]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    revenue: orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0),
  }), [orders]);

  const columns: Column<Order>[] = [
    { name: 'N° Commande', key: 'orderNumber', render: (o) => <span className="font-mono text-sm text-primary">{o.orderNumber}</span> },
    { name: 'Date', key: 'date', render: (o) => formatDate(o.createdAt) },
    { name: 'Client', key: 'client', render: (o) => <span className="font-medium text-dark">{o.buyer ? `${o.buyer.firstName} ${o.buyer.lastName}` : '-'}</span> },
    { name: 'Articles', key: 'articles', render: (o) => <span>{o.details?.length || 0} article(s)</span> },
    { name: 'Montant', key: 'total', render: (o) => <span className="font-semibold">{formatPrice(o.total)}</span> },
    { name: 'Paiement', key: 'paiement', render: (o) => <StatusBadge status={o.paymentStatus || 'PENDING'} /> },
    { name: 'Statut', key: 'statut', render: (o) => <StatusBadge status={o.status} /> },
    {
      name: 'Action', key: 'action',
      render: (o) => (
        <Link href={`/orders/${o.id}`} className="p-1.5 hover:bg-gray-6 rounded-lg transition inline-block">
          <Eye className="w-4 h-4 text-primary" />
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Mes Commandes</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: stats.total, color: 'text-dark' },
          { label: 'En attente', value: stats.pending, color: 'text-warning' },
          { label: 'Livrees', value: stats.delivered, color: 'text-success' },
          { label: 'Revenu total', value: formatPrice(stats.revenue), color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-2 hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
          <input
            type="text"
            placeholder="Rechercher par numero ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
