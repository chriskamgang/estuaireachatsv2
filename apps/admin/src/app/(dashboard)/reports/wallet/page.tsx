'use client';

import { useState, useEffect } from 'react';
import { Wallet, Loader2, Search } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  note: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

interface WalletStats {
  totalRecharges: number;
  totalDebits: number;
  soldeGlobal: number;
  transactionCount: number;
  userCount: number;
}

export default function WalletReportPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats>({ totalRecharges: 0, totalDebits: 0, soldeGlobal: 0, transactionCount: 0, userCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const perPage = 15;

  const fetchData = async (p = 1, s = '') => {
    try {
      const [statsRes, txRes] = await Promise.all([
        api.get<{ data: WalletStats }>('/wallet/admin/stats'),
        api.get<{ data: WalletTransaction[]; meta: any }>(`/wallet/admin/transactions?page=${p}&perPage=${perPage}${s ? `&search=${encodeURIComponent(s)}` : ''}`),
      ]);
      setStats(statsRes.data || stats);
      setTransactions(txRes.data || []);
      setTotal(txRes.meta?.total || 0);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p, search);
  };

  const handleSearch = () => {
    setPage(1);
    fetchData(1, search);
  };

  const columns: Column<WalletTransaction>[] = [
    { name: 'Utilisateur', key: 'user', render: (item) => (
      <div>
        <p className="text-sm font-medium text-dark">{item.user?.firstName} {item.user?.lastName}</p>
        <p className="text-xs text-gray-3">{item.user?.email}</p>
      </div>
    )},
    { name: 'Type', key: 'note', render: (item) => {
      const isCredit = item.amount > 0;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isCredit ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
          {isCredit ? 'Credit' : 'Debit'}
        </span>
      );
    }},
    { name: 'Montant', key: 'amount', render: (item) => (
      <span className={`font-bold ${item.amount >= 0 ? 'text-success' : 'text-danger'}`}>
        {item.amount >= 0 ? '+' : ''}{formatPrice(Math.abs(item.amount))}
      </span>
    )},
    { name: 'Methode', key: 'paymentMethod', render: (item) => <span className="text-gray-2">{item.paymentMethod || '-'}</span> },
    { name: 'Note', key: 'note', render: (item) => <span className="text-xs text-gray-3 max-w-[180px] block truncate">{item.note || '-'}</span> },
    { name: 'Date', key: 'createdAt', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.createdAt)}</span> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Portefeuille</h1>
          <p className="text-sm text-gray-3">{stats.transactionCount} transactions — {stats.userCount} utilisateurs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Total recharges</p>
          <p className="text-2xl font-bold text-success">{formatPrice(stats.totalRecharges)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Total debits</p>
          <p className="text-2xl font-bold text-warning">{formatPrice(stats.totalDebits)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Solde global</p>
          <p className={`text-2xl font-bold ${stats.soldeGlobal >= 0 ? 'text-success' : 'text-danger'}`}>{formatPrice(stats.soldeGlobal)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[280px]"
            placeholder="Rechercher par nom ou email..." />
          <button onClick={handleSearch} className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={transactions} pagination={{ page, perPage, total }} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
