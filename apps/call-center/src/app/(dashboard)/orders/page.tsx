'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Search, Eye, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  buyer: { firstName: string; lastName: string; phone: string | null };
  seller: { firstName: string; lastName: string; shop: { name: string } | null };
  details: { id: string; name: string; quantity: number; price: number }[];
  callLogs: { callResult: string; createdAt: string; agent: { firstName: string; lastName: string } }[];
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-warning-soft text-yellow-700' },
  CONFIRMED: { label: 'Confirmee', cls: 'bg-success-soft text-green-700' },
  PROCESSING: { label: 'En cours', cls: 'bg-info-soft text-blue-700' },
  SHIPPED: { label: 'Expediee', cls: 'bg-info-soft text-blue-700' },
  DELIVERED: { label: 'Livree', cls: 'bg-success-soft text-green-700' },
  CANCELLED: { label: 'Annulee', cls: 'bg-danger-soft text-red-700' },
  REFUNDED: { label: 'Remboursee', cls: 'bg-gray-100 text-gray-700' },
};

const statusFilters = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await api.get<{ data: Order[]; total: number; totalPages: number }>(`/call-center/orders?${params}`);
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <h1 className="text-xl font-bold text-dark mb-6">Commandes</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par numero, nom, telephone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary"
            />
          </form>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary"
          >
            <option value="">Tous les statuts</option>
            {statusFilters.filter(Boolean).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]?.label || s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-3">Aucune commande trouvee</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-5 bg-gray-6">
                  <th className="text-left px-4 py-3 font-medium text-gray-2">N° Commande</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Boutique</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Dernier appel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, cls: 'bg-gray-100 text-gray-700' };
                  const lastCall = order.callLogs?.[0];
                  return (
                    <tr key={order.id} className="border-b border-gray-5 hover:bg-gray-6/50">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div>{order.buyer.firstName} {order.buyer.lastName}</div>
                        {order.buyer.phone && (
                          <a href={`tel:${order.buyer.phone}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />{order.buyer.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-2">{order.seller?.shop?.name || '-'}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusInfo.cls)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-3">
                        {lastCall ? (
                          <span>{lastCall.callResult} - {lastCall.agent.firstName}</span>
                        ) : (
                          <span className="text-warning">Pas d&apos;appel</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-3">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-hover transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-5">
            <p className="text-xs text-gray-3">{total} commande(s)</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
