'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Purchase {
  id: string;
  package: string;
  montant: number;
  date: string;
  expiration: string | null;
  statut: string;
}

export default function PurchasePackagesPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    async function fetchPurchases() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/seller-packages/my-purchases?page=${page}&perPage=${perPage}`);
        if (res.result && res.data) {
          setPurchases(res.data);
          setTotal(res.meta?.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement historique packages:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPurchases();
  }, [page]);

  const columns: Column<Purchase>[] = [
    { name: 'Package', key: 'package', render: (item) => <span className="font-medium text-dark">{item.package}</span> },
    { name: 'Montant', key: 'montant', render: (item) => item.montant === 0 ? 'Gratuit' : formatPrice(item.montant) },
    { name: 'Date achat', key: 'date', render: (item) => formatDate(item.date) },
    { name: 'Expiration', key: 'expiration', render: (item) => item.expiration ? formatDate(item.expiration) : '-' },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
  ];

  if (loading && purchases.length === 0) {
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
        <h1 className="text-2xl font-bold text-dark">Historique des packages</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={purchases} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>
    </div>
  );
}
