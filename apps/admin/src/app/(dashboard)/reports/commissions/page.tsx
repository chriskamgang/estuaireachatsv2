'use client';

import { useState, useEffect } from 'react';
import { Percent, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Commission {
  id: number;
  vendeur: string;
  commande: string;
  montantVente: number;
  tauxCommission: number;
  commission: number;
  date: string;
}

const columns: Column<Commission>[] = [
  { name: 'Vendeur', key: 'vendeur' },
  {
    name: 'Commande',
    key: 'commande',
    render: (item) => <span className="font-mono text-xs text-gray-2">{item.commande}</span>,
  },
  {
    name: 'Montant vente',
    key: 'montantVente',
    render: (item) => <span className="font-semibold">{formatPrice(item.montantVente)}</span>,
  },
  {
    name: 'Taux commission',
    key: 'tauxCommission',
    render: (item) => (
      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
        {item.tauxCommission}%
      </span>
    ),
  },
  {
    name: 'Commission',
    key: 'commission',
    render: (item) => <span className="font-bold text-success">{formatPrice(item.commission)}</span>,
  },
  {
    name: 'Date',
    key: 'date',
    render: (item) => formatDate(item.date),
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [commissionsData, setCommissionsData] = useState<Commission[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/orders/admin/all?perPage=200');
        const orders = res.data || [];

        const mapped: Commission[] = orders
          .filter((o: any) => o.sellerId || o.seller)
          .map((o: any, idx: number) => {
            const montant = o.totalAmount || o.total || o.grandTotal || 0;
            const taux = o.commissionRate || o.commission_rate || 5;
            const commissionAmount = o.commission || o.adminCommission || Math.round(montant * taux / 100);

            return {
              id: o.id || idx + 1,
              vendeur: o.seller?.name || o.sellerName || 'Vendeur inconnu',
              commande: o.code || o.orderCode || `CMD-${o.id}`,
              montantVente: montant,
              tauxCommission: taux,
              commission: commissionAmount,
              date: o.createdAt || o.date || '',
            };
          });

        // Sort by date descending
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setCommissionsData(mapped);
      } catch (err) {
        console.error('Erreur chargement commissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCommissions = commissionsData.reduce((s, r) => s + r.commission, 0);
  const commissionMoyenne = commissionsData.length > 0 ? Math.round(totalCommissions / commissionsData.length) : 0;
  const nbTransactions = commissionsData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Percent className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Historique commissions</h1>
          <p className="text-sm text-gray-2">Commissions generees par les ventes vendeurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total commissions</p>
          <p className="text-2xl font-bold text-success">{formatPrice(totalCommissions)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Commission moyenne</p>
          <p className="text-2xl font-bold text-dark">{formatPrice(commissionMoyenne)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Nb transactions</p>
          <p className="text-2xl font-bold text-dark">{nbTransactions}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Detail des commissions</h2>
        </div>
        <DataTable
          columns={columns}
          data={commissionsData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: commissionsData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
