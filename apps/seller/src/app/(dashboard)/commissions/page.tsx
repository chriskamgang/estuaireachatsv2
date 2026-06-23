'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Commission {
  id: string;
  commande: string;
  montantVente: number;
  tauxCommission: number;
  commission: number;
  date: string;
}

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  useEffect(() => {
    async function fetchCommissions() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/orders/seller/commissions?page=${page}&perPage=${perPage}`);
        if (res.result && res.data) {
          setCommissions(res.data);
          setTotal(res.meta?.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement commissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommissions();
  }, [page]);

  const columns: Column<Commission>[] = [
    { name: 'Commande', key: 'commande', render: (item) => <span className="font-mono text-sm text-primary">{item.commande}</span> },
    { name: 'Montant vente', key: 'montantVente', render: (item) => formatPrice(item.montantVente) },
    { name: 'Taux', key: 'tauxCommission', render: (item) => `${item.tauxCommission}%` },
    { name: 'Commission', key: 'commission', render: (item) => <span className="font-semibold text-danger">{formatPrice(item.commission)}</span> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  ];

  if (loading && commissions.length === 0) {
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
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Historique des commissions</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={commissions} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>
    </div>
  );
}
