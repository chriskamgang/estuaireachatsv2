'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Truck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  name: string;
  thumbnailUrl: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  code: string;
  date: string;
  status: OrderStatus;
  sellerName: string;
  items: OrderItem[];
  total: number;
}

interface OrdersMeta {
  total: number;
  page: number;
  perPage: number;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'En attente', color: 'text-orange', bg: 'bg-orange/10' },
  CONFIRMED: { label: 'Confirmee', color: 'text-secondary', bg: 'bg-secondary/10' },
  SHIPPED: { label: 'Expediee', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
  DELIVERED: { label: 'Livree', color: 'text-green', bg: 'bg-green/10' },
  CANCELLED: { label: 'Annulee', color: 'text-primary', bg: 'bg-primary/10' },
};

const tabs: { label: string; value: string }[] = [
  { label: 'Toutes', value: 'ALL' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Confirmees', value: 'CONFIRMED' },
  { label: 'Expediees', value: 'SHIPPED' },
  { label: 'Livrees', value: 'DELIVERED' },
  { label: 'Annulees', value: 'CANCELLED' },
];

const PER_PAGE = 20;

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrdersMeta>({ total: 0, page: 1, perPage: PER_PAGE });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: String(PER_PAGE), page: String(currentPage) });
    if (activeTab !== 'ALL') params.set('status', activeTab);
    api.get<{ data: any[]; meta: OrdersMeta }>(`/orders?${params.toString()}`)
      .then((res) => {
        const mapped: Order[] = (res.data || []).map((o: any) => ({
          id: o.id,
          code: o.orderNumber || o.code || o.id,
          date: o.createdAt || o.date,
          status: o.status,
          sellerName: o.seller
            ? `${o.seller.firstName || ''} ${o.seller.lastName || ''}`.trim()
            : o.sellerName || '',
          items: (o.details || o.items || []).map((d: any) => ({
            id: d.id,
            name: d.name || d.productName || '',
            thumbnailUrl: d.image || d.thumbnailUrl || d.product?.images?.[0]?.url || '',
            quantity: d.quantity,
            unitPrice: d.price || d.unitPrice || 0,
          })),
          total: o.total || 0,
        }));
        setOrders(mapped);
        if (res.meta) setMeta(res.meta);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab, currentPage]);

  const totalPages = Math.max(1, Math.ceil(meta.total / PER_PAGE));
  const filtered = orders;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-3 sm:p-6 shadow-sm">
        <h1 className="mb-6 text-lg sm:text-xl font-bold text-dark">Mes commandes</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setCurrentPage(1); }}
              className={cn(
                'shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'border-b-2 border-orange text-orange'
                  : 'text-gray-3 hover:text-dark'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-3">Aucune commande dans cette categorie</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const cfg = statusConfig[order.status];
              return (
                <div key={order.id} className="rounded-lg border border-gray-5 p-3 sm:p-5 transition-shadow hover:shadow-md">
                  {/* Header */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="text-sm font-semibold text-dark">{order.code}</span>
                      <span className="text-xs text-gray-3">
                        {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Seller */}
                  <p className="mb-3 text-xs text-gray-3">
                    Vendeur : <span className="font-medium text-gray-1">{order.sellerName}</span>
                  </p>

                  {/* Items preview */}
                  <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="group relative">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="h-16 w-16 rounded-md border border-gray-5 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-5 bg-gray-100 text-xs text-gray-400">
                            img
                          </div>
                        )}
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-dark px-1 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                    <div className="ml-2 text-sm text-gray-2">
                      {order.items.length} article{order.items.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-5 pt-4">
                    <p className="text-base font-bold text-dark">
                      Total : {formatPrice(order.total)}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-5 px-4 py-2 text-xs font-medium text-gray-1 transition-colors hover:border-orange hover:text-orange"
                      >
                        <Eye size={14} />
                        Voir detail
                      </Link>
                      {order.status === 'SHIPPED' && (
                        <button className="flex items-center gap-1.5 rounded-lg border border-secondary px-4 py-2 text-xs font-medium text-secondary transition-colors hover:bg-secondary/5">
                          <Truck size={14} />
                          Suivre livraison
                        </button>
                      )}
                      {order.status === 'PENDING' && (
                        <button className="flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5">
                          <X size={14} />
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-5 text-gray-3 transition-colors hover:border-orange hover:text-orange disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  currentPage === p
                    ? 'bg-orange text-white'
                    : 'border border-gray-5 text-gray-2 hover:border-orange hover:text-orange'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-5 text-gray-3 transition-colors hover:border-orange hover:text-orange disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
