'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Eye, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Payout {
  id: number;
  amount: number;
  status: string;
  method: string;
  accountNumber: string;
  accountName: string;
  note: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
  shop?: { name: string };
}

function PayoutDetailModal({ payout, onClose, onApprove, onReject }: { payout: Payout; onClose: () => void; onApprove: (id: number) => void; onReject: (id: number) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">Paiement #{payout.id}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-3">Vendeur</p><p className="text-sm font-medium text-dark">{payout.user?.firstName} {payout.user?.lastName}</p></div>
            <div><p className="text-xs text-gray-3">Boutique</p><p className="text-sm font-medium text-dark">{payout.shop?.name || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Montant</p><p className="text-lg font-bold text-dark">{formatPrice(payout.amount)}</p></div>
            <div><p className="text-xs text-gray-3">Date</p><p className="text-sm font-medium text-dark">{formatDate(payout.createdAt)}</p></div>
            <div><p className="text-xs text-gray-3">Methode</p><p className="text-sm font-medium text-dark">{payout.method || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Compte</p><p className="text-sm font-medium text-dark">{payout.accountNumber || '-'}</p></div>
          </div>
          <div className="pt-2"><p className="text-xs text-gray-3 mb-1">Statut</p><StatusBadge status={payout.status} /></div>
        </div>
        {payout.status === 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-5 flex gap-3">
            <button onClick={() => { onReject(payout.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border border-danger text-danger rounded-lg hover:bg-danger-soft transition">
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
            <button onClick={() => { onApprove(payout.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-success text-white rounded-lg hover:bg-success/90 transition">
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
          </div>
        )}
        {payout.status !== 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-5">
            <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payout | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get<{ data: Payout[] }>('/withdraws/admin?perPage=200')
      .then((res) => setPayouts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? payouts.filter((p) => p.status === statusFilter) : payouts;
  const totalPending = payouts.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter((p) => p.status === 'APPROVED' || p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/withdraws/admin/${id}/approve`);
      setPayouts(payouts.map((p) => p.id === id ? { ...p, status: 'APPROVED' } : p));
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/withdraws/admin/${id}/reject`);
      setPayouts(payouts.map((p) => p.id === id ? { ...p, status: 'REJECTED' } : p));
    } catch {}
  };

  const columns: Column<Payout>[] = [
    { name: '#', key: 'id', render: (item) => <code className="text-xs font-mono text-primary">#{item.id}</code> },
    { name: 'Vendeur', key: 'user', render: (item) => (
      <div>
        <p className="text-sm font-medium text-dark">{item.user?.firstName} {item.user?.lastName}</p>
        <p className="text-xs text-gray-3">{item.shop?.name || item.user?.email}</p>
      </div>
    )},
    { name: 'Montant', key: 'amount', render: (item) => <span className="font-semibold text-dark">{formatPrice(item.amount)}</span> },
    { name: 'Methode', key: 'method', render: (item) => <span className="text-gray-1">{item.method || '-'}</span> },
    { name: 'Compte', key: 'accountNumber', render: (item) => <code className="text-xs text-gray-2">{item.accountNumber || '-'}</code> },
    { name: 'Date', key: 'createdAt', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.createdAt)}</span> },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
    { name: 'Actions', key: 'actions', render: (item) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setSelected(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>
        {item.status === 'PENDING' && (
          <>
            <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition"><CheckCircle className="w-4 h-4" /></button>
            <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><XCircle className="w-4 h-4" /></button>
          </>
        )}
      </div>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {selected && <PayoutDetailModal payout={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={handleReject} />}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Paiements Vendeurs</h1>
          <p className="text-sm text-gray-3">{payouts.length} demandes de paiement</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">En attente</p>
          <p className="text-2xl font-bold text-warning">{formatPrice(totalPending)}</p>
          <p className="text-xs text-gray-3 mt-0.5">{payouts.filter((p) => p.status === 'PENDING').length} demandes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Paye</p>
          <p className="text-2xl font-bold text-success">{formatPrice(totalPaid)}</p>
          <p className="text-xs text-gray-3 mt-0.5">{payouts.filter((p) => p.status === 'APPROVED' || p.status === 'PAID').length} paiements</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Rejetes</p>
          <p className="text-2xl font-bold text-danger">{payouts.filter((p) => p.status === 'REJECTED').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuves</option>
          <option value="REJECTED">Rejetes</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
      </div>
    </div>
  );
}
