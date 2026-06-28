'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  amount: number;
  paymentMethod: string;
  note: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('MTN MoMo');
  const [recharging, setRecharging] = useState(false);

  const fetchData = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        api.get<{ data: { balance: number } }>('/wallet/balance'),
        api.get<{ data: Transaction[] }>('/wallet/history?perPage=50'),
      ]);
      setBalance(balRes.data?.balance || 0);
      setTransactions(histRes.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecharge = async () => {
    const amount = parseInt(rechargeAmount);
    if (!amount || amount <= 0) return;
    setRecharging(true);
    try {
      const res = await api.post<{ data: { newBalance: number } }>('/wallet/recharge', {
        amount,
        paymentMethod: rechargeMethod,
      });
      setBalance(res.data?.newBalance || balance + amount);
      setRechargeAmount('');
      setShowRecharge(false);
      fetchData();
    } catch {
    } finally {
      setRecharging(false);
    }
  };

  // Compute running balance from transactions
  const txWithBalance = transactions.map((tx, i) => {
    const futureSum = transactions.slice(0, i + 1).reduce((s, t) => s + t.amount, 0);
    return { ...tx, runningBalance: balance - (transactions.slice(0, i).reduce((s, t) => s + t.amount, 0) - futureSum + futureSum) };
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-orange" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-dark to-gray-1 p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Wallet size={18} />
              Mon portefeuille
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold">{formatPrice(balance)}</p>
            <p className="mt-1 text-sm text-white/60">Solde disponible</p>
          </div>
          <button
            onClick={() => setShowRecharge(!showRecharge)}
            className="flex items-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light"
          >
            <Plus size={16} />
            Recharger
          </button>
        </div>
      </div>

      {/* Recharge form */}
      {showRecharge && (
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-dark">Recharger mon portefeuille</h2>
          <div className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-1">Montant (FCFA)</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-1">Moyen de paiement</label>
              <select
                value={rechargeMethod}
                onChange={(e) => setRechargeMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
              >
                <option value="MTN MoMo">MTN Mobile Money</option>
                <option value="Orange Money">Orange Money</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>
            <button
              onClick={handleRecharge}
              disabled={recharging || !rechargeAmount}
              className="rounded-lg bg-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-50"
            >
              {recharging ? 'Rechargement...' : 'Confirmer le rechargement'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-lg bg-white p-3 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-dark">Historique des transactions</h2>

        {transactions.length === 0 ? (
          <p className="text-center text-sm text-gray-3 py-8">Aucune transaction pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-5 text-xs text-gray-3">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Methode</th>
                  <th className="pb-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="border-b border-gray-5 last:border-0">
                      <td className="py-3.5 text-gray-2">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            isCredit ? 'bg-green/10 text-green' : 'bg-primary/10 text-primary'
                          )}
                        >
                          {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-1">{tx.note || '-'}</td>
                      <td className="py-3.5 text-gray-2">{tx.paymentMethod || '-'}</td>
                      <td
                        className={cn(
                          'py-3.5 text-right font-semibold',
                          isCredit ? 'text-green' : 'text-primary'
                        )}
                      >
                        {isCredit ? '+' : ''}{formatPrice(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
