'use client';

import { useState, useEffect } from 'react';
import { Wallet, Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface WalletRecharge {
  id: number;
  client: string;
  email: string;
  montant: number;
  methode: string;
  reference: string;
  preuve: string;
  dateDemande: string;
  dateTraitement: string | null;
  statut: string;
}

const defaultRecharges: WalletRecharge[] = [
  { id: 1, client: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', montant: 50000, methode: 'Virement bancaire', reference: 'VIR-2026-001', preuve: 'preuve_001.jpg', dateDemande: '2026-06-18', dateTraitement: '2026-06-19', statut: 'APPROUVE' },
  { id: 2, client: 'Sophie Ngo', email: 'sophie.ngo@yahoo.fr', montant: 100000, methode: 'MTN MoMo', reference: 'MOMO-8844922', preuve: 'capture_momo.jpg', dateDemande: '2026-06-19', dateTraitement: null, statut: 'EN_ATTENTE' },
  { id: 3, client: 'Paul Atangana', email: 'p.atangana@hotmail.com', montant: 25000, methode: 'Orange Money', reference: 'OM-7743211', preuve: 'preuve_om.png', dateDemande: '2026-06-20', dateTraitement: null, statut: 'EN_ATTENTE' },
  { id: 4, client: 'Marie Fouda', email: 'marie.fouda@gmail.com', montant: 75000, methode: 'Virement bancaire', reference: 'VIR-2026-002', preuve: 'recu_banque.pdf', dateDemande: '2026-06-15', dateTraitement: '2026-06-16', statut: 'APPROUVE' },
  { id: 5, client: 'Eric Bella', email: 'eric.bella@gmail.com', montant: 200000, methode: 'Especes', reference: 'CASH-001', preuve: 'non applicable', dateDemande: '2026-06-10', dateTraitement: '2026-06-10', statut: 'APPROUVE' },
  { id: 6, client: 'Christine Owona', email: 'c.owona@yahoo.fr', montant: 30000, methode: 'MTN MoMo', reference: 'MOMO-invalid', preuve: 'capture_fausse.jpg', dateDemande: '2026-06-17', dateTraitement: '2026-06-18', statut: 'REJETE' },
  { id: 7, client: 'Albert Tabi', email: 'a.tabi@gmail.com', montant: 15000, methode: 'Orange Money', reference: 'OM-5544332', preuve: 'om_recu.jpg', dateDemande: '2026-06-21', dateTraitement: null, statut: 'EN_ATTENTE' },
];

export default function OfflineWalletPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [recharges, setRecharges] = useState<WalletRecharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: WalletRecharge[] }>('/settings/admin/admin_payments_offline_wallet')
      .then(res => { if (res.data) setRecharges(res.data); else setRecharges(defaultRecharges); })
      .catch(() => setRecharges(defaultRecharges))
      .finally(() => setLoading(false));
  }, []);

  const filtered = recharges.filter((r) => {
    const matchSearch = r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || r.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleApprove = (id: number) => {
    setRecharges((prev) =>
      prev.map((r) => r.id === id ? { ...r, statut: 'APPROUVE', dateTraitement: new Date().toISOString().split('T')[0] } : r)
    );
  };

  const handleReject = (id: number) => {
    if (!confirm('Rejeter cette demande de recharge ?')) return;
    setRecharges((prev) =>
      prev.map((r) => r.id === id ? { ...r, statut: 'REJETE', dateTraitement: new Date().toISOString().split('T')[0] } : r)
    );
  };

  const totalEnAttente = recharges.filter(r => r.statut === 'EN_ATTENTE').reduce((s, r) => s + r.montant, 0);

  const columns: Column<WalletRecharge>[] = [
    {
      name: 'Client',
      key: 'client',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.client}</p>
          <p className="text-xs text-gray-3">{item.email}</p>
        </div>
      ),
    },
    {
      name: 'Montant',
      key: 'montant',
      render: (item) => <span className="font-bold text-primary">{formatPrice(item.montant)}</span>,
    },
    {
      name: 'Methode',
      key: 'methode',
      render: (item) => <span className="text-sm">{item.methode}</span>,
    },
    {
      name: 'Reference',
      key: 'reference',
      render: (item) => <span className="font-mono text-xs text-gray-2">{item.reference}</span>,
    },
    {
      name: 'Preuve',
      key: 'preuve',
      render: (item) => (
        <button className="text-xs text-primary hover:underline">{item.preuve}</button>
      ),
    },
    {
      name: 'Date demande',
      key: 'dateDemande',
      render: (item) => <span className="text-sm">{formatDate(item.dateDemande)}</span>,
    },
    {
      name: 'Statut',
      key: 'statut',
      render: (item) => <StatusBadge status={item.statut} />,
    },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.statut === 'EN_ATTENTE' && (
            <>
              <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-3 hover:text-green-600 transition" title="Approuver">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition" title="Rejeter">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Recharges portefeuille offline</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total demandes', value: recharges.length },
          { label: 'En attente', value: recharges.filter(r => r.statut === 'EN_ATTENTE').length },
          { label: 'A approuver', value: formatPrice(totalEnAttente) },
          { label: 'Total approuve', value: formatPrice(recharges.filter(r => r.statut === 'APPROUVE').reduce((s, r) => s + r.montant, 0)) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher client, email ou reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuve</option>
            <option value="REJETE">Rejete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          pagination={{ page: 1, perPage: 10, total: filtered.length }}
        />
      </div>
    </div>
  );
}
