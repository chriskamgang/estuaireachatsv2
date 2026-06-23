'use client';

import { useState, useEffect } from 'react';
import { History, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Payment {
  id: string;
  date: string;
  montant: number;
  methode: string;
  reference: string;
  statut: string;
}

const methodLabels: Record<string, string> = {
  MTN_MOMO: 'MTN MoMo',
  ORANGE_MONEY: 'Orange Money',
  KPAY_GATEWAY: 'KPay Gateway',
  GFS_PAYMENT: 'GFSolution',
  PAYPAL: 'PayPal',
  COD: 'Paiement livraison',
};

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/payments/seller?page=${page}&perPage=${perPage}`);
        if (res.data) {
          setPayments((res.data || []).map((p: any) => ({
            id: p.id,
            date: p.createdAt || p.paidAt,
            montant: p.amount,
            methode: methodLabels[p.method] || p.method,
            reference: p.transactionId || p.providerRef || p.externalId || p.id,
            statut: p.status,
          })));
          setTotal(res.meta?.total || res.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement paiements:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [page]);

  const columns: Column<Payment>[] = [
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
    { name: 'Montant', key: 'montant', render: (item) => <span className="font-semibold">{formatPrice(item.montant)}</span> },
    { name: 'Methode', key: 'methode' },
    { name: 'Reference', key: 'reference', render: (item) => <span className="font-mono text-xs text-gray-2">{item.reference}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
  ];

  if (loading && payments.length === 0) {
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
          <History className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Historique des paiements</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={payments} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>
    </div>
  );
}
