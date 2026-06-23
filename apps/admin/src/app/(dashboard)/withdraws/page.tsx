'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Wallet, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Withdraw {
  id: string;
  amount: number;
  method: string;
  status: string;
  note: string;
  createdAt: string;
  seller?: { id: string; firstName: string; lastName: string; email: string; phone: string };
}

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuvees' },
  { key: 'REJECTED', label: 'Rejetees' },
];

export default function WithdrawsPage() {
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get<{ data: Withdraw[] }>('/withdraws/admin?perPage=200')
      .then((res) => setWithdraws(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return withdraws;
    return withdraws.filter(w => w.status === activeTab);
  }, [withdraws, activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/withdraws/admin/${id}/approve`, { note: 'Approuve par admin' });
      setWithdraws(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED' } : w));
    } catch {}
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/withdraws/admin/${id}/reject`, { note: 'Rejete par admin' });
      setWithdraws(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED' } : w));
    } catch {}
  };

  const columns: Column<Withdraw>[] = [
    { key: 'vendeur', name: 'Vendeur', render: (w) => <span className="font-medium">{w.seller ? `${w.seller.firstName} ${w.seller.lastName}` : '-'}</span> },
    { key: 'montant', name: 'Montant', render: (w) => <span className="font-semibold">{formatPrice(w.amount)}</span> },
    { key: 'methode', name: 'Methode', render: (w) => <span className="text-sm">{w.method || '-'}</span> },
    { key: 'statut', name: 'Statut', render: (w) => <StatusBadge status={w.status} /> },
    { key: 'date', name: 'Date', render: (w) => formatDate(w.createdAt) },
    {
      key: 'actions', name: 'Actions',
      render: (w) =>
        w.status === 'PENDING' ? (
          <div className="flex items-center gap-1">
            <button onClick={() => handleApprove(w.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-success" title="Approuver">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => handleReject(w.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-danger" title="Rejeter">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : <span className="text-xs text-gray-3">-</span>,
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Demandes de retrait</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-5">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-2 hover:text-dark'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
