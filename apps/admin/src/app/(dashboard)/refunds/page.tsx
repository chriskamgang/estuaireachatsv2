'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCcw, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Refund {
  id: string;
  reason: string;
  status: string;
  refundAmount: number;
  createdAt: string;
  order?: { id: string; orderNumber: string };
  orderDetail?: { id: string; name: string; image: string; price: number; quantity: number };
  user?: { id: string; firstName: string; lastName: string; email: string };
}

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuvees' },
  { key: 'REJECTED', label: 'Rejetees' },
];

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadRefunds = () => {
    setLoading(true);
    api.get<{ data: Refund[] }>('/refunds/admin')
      .then((res) => setRefunds(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRefunds(); }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return refunds;
    return refunds.filter(r => r.status === activeTab);
  }, [refunds, activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/refunds/admin/${id}/approve`);
      setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    } catch {}
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/refunds/admin/${id}/reject`);
      setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
    } catch {}
  };

  const columns: Column<Refund>[] = [
    { key: 'order', name: 'Commande', render: (r) => <span className="font-mono font-medium text-primary">{r.order?.orderNumber || '-'}</span> },
    { key: 'produit', name: 'Produit', render: (r) => <span className="text-sm">{r.orderDetail?.name || '-'}</span> },
    { key: 'client', name: 'Client', render: (r) => <span className="font-medium">{r.user ? `${r.user.firstName} ${r.user.lastName}` : '-'}</span> },
    { key: 'montant', name: 'Montant', render: (r) => <span className="font-semibold">{formatPrice(r.refundAmount)}</span> },
    { key: 'raison', name: 'Raison', render: (r) => <span className="text-gray-2 text-xs max-w-[200px] truncate block">{r.reason}</span> },
    { key: 'date', name: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'statut', name: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', name: 'Actions',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div className="flex items-center gap-1">
            <button onClick={() => handleApprove(r.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-success" title="Approuver">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => handleReject(r.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-danger" title="Rejeter">
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
          <RefreshCcw className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Demandes de remboursement</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente', value: refunds.filter(r => r.status === 'PENDING').length, color: 'text-warning' },
          { label: 'Approuvees', value: refunds.filter(r => r.status === 'APPROVED').length, color: 'text-success' },
          { label: 'Rejetees', value: refunds.filter(r => r.status === 'REJECTED').length, color: 'text-danger' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
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
