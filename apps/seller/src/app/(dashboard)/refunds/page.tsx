'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Check, X as XIcon, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Refund {
  id: string;
  commande: string;
  client: string;
  produit: string;
  montant: number;
  raison: string;
  date: string;
  statut: string;
}

export default function RefundsPage() {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  const fetchRefunds = useCallback(async () => {
    try {
      const res = await api.get<any>('/refunds/seller');
      if (res.result !== false && Array.isArray(res.data || res)) {
        const data = res.data || res;
        setRefunds(data.map((r: any) => ({
          id: r.id,
          commande: r.order?.orderNumber || r.orderId || 'N/A',
          client: r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : 'Client',
          produit: r.orderDetail?.name || 'Produit',
          montant: r.refundAmount || r.orderDetail?.total || 0,
          raison: r.reason || '',
          date: r.createdAt,
          statut: r.status,
        })));
      }
    } catch (err) {
      console.error('Erreur chargement remboursements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/refunds/${id}/${action}`);
      await fetchRefunds();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const columns: Column<Refund>[] = [
    { name: 'Commande', key: 'commande', render: (item) => <span className="font-mono text-sm text-primary">{item.commande}</span> },
    { name: 'Client', key: 'client', render: (item) => <span className="font-medium text-dark">{item.client}</span> },
    { name: 'Produit', key: 'produit' },
    { name: 'Montant', key: 'montant', render: (item) => formatPrice(item.montant) },
    { name: 'Raison', key: 'raison', render: (item) => <span className="text-xs text-gray-2">{item.raison}</span> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.statut === 'PENDING' && (
            <>
              <button onClick={() => handleAction(item.id, 'approve')} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-3 hover:text-green-600 transition"><Check className="w-4 h-4" /></button>
              <button onClick={() => handleAction(item.id, 'reject')} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition"><XIcon className="w-4 h-4" /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
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
          <RefreshCcw className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Demandes de remboursement</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={refunds} />
      </div>
    </div>
  );
}
