'use client';

import { useState, useEffect } from 'react';
import { Users, Check, X as XIcon, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Affiliate {
  id: string;
  referralCode: string;
  clicks: number;
  conversions: number;
  totalEarnings: number;
  balance: number;
  status: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
}

export default function AffiliatePage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Affiliate[] }>('/affiliate/admin/list')
      .then((res) => setAffiliates(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/affiliate/admin/${id}/approve`);
      setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    } catch {}
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/affiliate/admin/${id}/reject`);
      setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
    } catch {}
  };

  const columns: Column<Affiliate>[] = [
    { name: 'Utilisateur', key: 'user', render: (a) => <span className="font-medium text-dark">{a.user ? `${a.user.firstName} ${a.user.lastName}` : '-'}</span> },
    { name: 'Email', key: 'email', render: (a) => <span className="text-sm">{a.user?.email || '-'}</span> },
    { name: 'Code', key: 'referralCode', render: (a) => <span className="font-mono text-sm text-primary">{a.referralCode}</span> },
    { name: 'Clics', key: 'clicks', render: (a) => <span>{a.clicks || 0}</span> },
    { name: 'Conversions', key: 'conversions', render: (a) => <span>{a.conversions || 0}</span> },
    { name: 'Gains', key: 'totalEarnings', render: (a) => <span className="font-semibold">{formatPrice(a.totalEarnings || 0)}</span> },
    { name: 'Solde', key: 'balance', render: (a) => formatPrice(a.balance || 0) },
    { name: 'Statut', key: 'status', render: (a) => <StatusBadge status={a.status} /> },
    {
      name: 'Actions', key: 'actions',
      render: (a) => a.status === 'PENDING' ? (
        <div className="flex items-center gap-1">
          <button onClick={() => handleApprove(a.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-3 hover:text-green-600 transition" title="Approuver"><Check className="w-4 h-4" /></button>
          <button onClick={() => handleReject(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition" title="Rejeter"><XIcon className="w-4 h-4" /></button>
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
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
        <h1 className="text-2xl font-bold text-dark">Programme affilie ({affiliates.length})</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={affiliates} />
      </div>
    </div>
  );
}
