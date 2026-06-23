'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, DollarSign, Loader2, X, AlertCircle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Withdrawal {
  id: string;
  date: string;
  montant: number;
  methode: string;
  phoneNumber: string;
  statut: string;
}

const PHONE_REGEX = /^237[0-9]{9}$/;
const MIN_AMOUNT = 1000;

export default function WithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: 0, method: 'MTN_MOMO', phoneNumber: '', note: '' });
  const [submitError, setSubmitError] = useState('');
  const perPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/withdraws/me?page=${page}&perPage=${perPage}`);
      if (res.data) {
        setWithdrawals((res.data || []).map((w: any) => ({
          id: w.id,
          date: w.createdAt,
          montant: w.amount,
          methode: w.method === 'MTN_MOMO' ? 'MTN MoMo' : w.method === 'ORANGE_MONEY' ? 'Orange Money' : w.method,
          phoneNumber: w.phoneNumber,
          statut: w.status,
        })));
        setTotal(res.meta?.total || 0);
        if (res.balance) {
          setBalance(res.balance.available || 0);
          setTotalWithdrawn(res.balance.totalWithdrawn || 0);
          // Calculer le pending depuis le solde API (totalEarned - totalWithdrawn - available = pending en cours)
          const earned = res.balance.totalEarned || 0;
          const withdrawn = res.balance.totalWithdrawn || 0;
          const available = res.balance.available || 0;
          setPending(earned - withdrawn - available);
        }
      }
    } catch (err) {
      console.error('Erreur chargement retraits:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validation
  const phoneError = form.phoneNumber && !PHONE_REGEX.test(form.phoneNumber)
    ? 'Format invalide. Utilisez 237 suivi de 9 chiffres (ex: 237690123456)'
    : '';
  const amountError = form.amount > 0 && form.amount < MIN_AMOUNT
    ? `Minimum ${formatPrice(MIN_AMOUNT)}`
    : form.amount > balance
      ? `Solde insuffisant (disponible: ${formatPrice(balance)})`
      : '';
  const isFormValid = form.amount >= MIN_AMOUNT && form.amount <= balance && PHONE_REGEX.test(form.phoneNumber);

  const handleWithdraw = async () => {
    if (!isFormValid) return;
    setSaving(true);
    setSubmitError('');
    try {
      await api.post('/withdraws', form);
      setShowModal(false);
      setForm({ amount: 0, method: 'MTN_MOMO', phoneNumber: '', note: '' });
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Erreur lors de la demande de retrait');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitError('');
    setForm({ amount: 0, method: 'MTN_MOMO', phoneNumber: '', note: '' });
  };

  const columns: Column<Withdrawal>[] = [
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
    { name: 'Montant', key: 'montant', render: (item) => <span className="font-semibold">{formatPrice(item.montant)}</span> },
    { name: 'Methode', key: 'methode' },
    { name: 'Telephone', key: 'phoneNumber', render: (item) => <span className="font-mono text-xs">{item.phoneNumber}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
  ];

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Retrait d&apos;argent</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Demander un retrait
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Solde disponible" value={formatPrice(balance)} gradient="linear-gradient(135deg, #28c76f 0%, #48da89 100%)" icon={DollarSign} />
        <StatCard title="En attente" value={formatPrice(pending)} gradient="linear-gradient(135deg, #ff9f43 0%, #ffb976 100%)" icon={Wallet} />
        <StatCard title="Total retire" value={formatPrice(totalWithdrawn)} gradient="linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)" icon={DollarSign} />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={withdrawals} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Demande de retrait</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-3" /></button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
                <button onClick={() => setSubmitError('')} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Montant (FCFA)</label>
                <input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} min={MIN_AMOUNT} placeholder="Minimum 1 000 FCFA" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${amountError ? 'border-red-400' : 'border-gray-5'}`} />
                {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Methode</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="MTN_MOMO">MTN MoMo</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Numero telephone (237...)</label>
                <input type="text" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="237XXXXXXXXX" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${phoneError ? 'border-red-400' : 'border-gray-5'}`} />
                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Note (optionnel)</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <button onClick={handleWithdraw} disabled={saving || !isFormValid} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
