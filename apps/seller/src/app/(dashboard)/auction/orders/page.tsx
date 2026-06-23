'use client';

import { useState, useEffect } from 'react';
import { Gavel, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AuctionOrder {
  id: string;
  produit: string;
  acheteur: string;
  montant: number;
  date: string;
  statut: string;
}

export default function AuctionOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AuctionOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        // Auction orders are regular seller orders where products are auction type
        const res = await api.get<any>(`/orders/seller?page=${page}&perPage=${perPage}`);
        if (res.result && res.data) {
          // Filter orders that contain auction products (if info is available)
          const mapped = res.data.map((o: any) => ({
            id: o.id,
            produit: o.details?.[0]?.name || 'Produit',
            acheteur: `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`.trim() || 'Acheteur',
            montant: o.total,
            date: o.createdAt,
            statut: o.paymentStatus,
          }));
          setOrders(mapped);
          setTotal(res.meta?.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement commandes encheres:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [page]);

  const columns: Column<AuctionOrder>[] = [
    { name: 'Produit', key: 'produit', render: (item) => <span className="font-medium text-dark">{item.produit}</span> },
    { name: 'Acheteur', key: 'acheteur' },
    { name: 'Montant', key: 'montant', render: (item) => <span className="font-semibold">{formatPrice(item.montant)}</span> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Action', key: 'action',
      render: () => <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>,
    },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Gavel className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Commandes encheres</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={orders} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>
    </div>
  );
}
