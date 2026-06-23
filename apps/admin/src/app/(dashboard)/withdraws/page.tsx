'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Wallet, Loader2, X, AlertCircle } from 'lucide-react';
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
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: string; sellerName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get<{ data: Withdraw[] }>('/withdraws/admin?perPage=200')
      .then((res) => setWithdraws(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return withdraws;
    return withdraws.filter(w => w.status === activeTab);
  }, [withdraws, activeTab]);

  const handleApprove = async (id: string) => {
    const w = withdraws.find(w => w.id === id);
    const sellerName = w?.seller ? `${w.seller.firstName} ${w.seller.lastName}` : 'ce vendeur';
    const amount = w ? formatPrice(w.amount) : '';

    if (!confirm(`Approuver le retrait de ${amount} pour ${sellerName} ?\n\nCette action va declencher le transfert d'argent via KPay.`)) return;

    setProcessingIds(prev => new Set(prev).add(id));
    setError('');
    try {
      await api.patch(`/withdraws/admin/${id}/approve`, { adminNote: 'Approuve par admin' });
      setWithdraws(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED' } : w));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Erreur lors de l'approbation`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openRejectModal = (id: string) => {
    const w = withdraws.find(w => w.id === id);
    const sellerName = w?.seller ? `${w.seller.firstName} ${w.seller.lastName}` : 'Vendeur';
    setRejectModal({ id, sellerName });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const { id } = rejectModal;

    setProcessingIds(prev => new Set(prev).add(id));
    setError('');
    try {
      await api.patch(`/withdraws/admin/${id}/reject`, { adminNote: rejectReason || 'Rejete par admin' });
      setWithdraws(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED' } : w));
      setRejectModal(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors du rejet');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const columns: Column<Withdraw>[] = [
    { key: 'vendeur', name: 'Vendeur', render: (w) => <span className="font-medium">{w.seller ? `${w.seller.firstName} ${w.seller.lastName}` : '-'}</span> },
    { key: 'montant', name: 'Montant', render: (w) => <span className="font-semibold">{formatPrice(w.amount)}</span> },
    { key: 'methode', name: 'Methode', render: (w) => <span className="text-sm">{w.method || '-'}</span> },
    { key: 'statut', name: 'Statut', render: (w) => <StatusBadge status={w.status} /> },
    { key: 'date', name: 'Date', render: (w) => formatDate(w.createdAt) },
    {
      key: 'actions', name: 'Actions',
      render: (w) => {
        const isProcessing = processingIds.has(w.id);
        return w.status === 'PENDING' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleApprove(w.id)}
              disabled={isProcessing}
              className="p-1.5 rounded-lg hover:bg-gray-6 text-success disabled:opacity-50 disabled:cursor-not-allowed"
              title="Approuver"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            </button>
            <button
              onClick={() => openRejectModal(w.id)}
              disabled={isProcessing}
              className="p-1.5 rounded-lg hover:bg-gray-6 text-danger disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rejeter"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : <span className="text-xs text-gray-3">-</span>;
      },
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

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

      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Rejeter le retrait</h3>
              <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <p className="text-sm text-gray-2 mb-4">
              Retrait de <strong>{rejectModal.sellerName}</strong>. Indiquez la raison du rejet :
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Raison du rejet (optionnel)"
              rows={3}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-5 rounded-lg text-sm font-medium text-gray-2 hover:bg-gray-6 transition">
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={processingIds.has(rejectModal.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {processingIds.has(rejectModal.id) ? 'Rejet...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
