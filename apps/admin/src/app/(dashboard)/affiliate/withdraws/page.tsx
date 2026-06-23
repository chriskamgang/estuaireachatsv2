'use client';

import { useState, useEffect } from 'react';
import { Wallet, Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AffiliateWithdraw {
  id: number;
  affilie: string;
  email: string;
  montant: number;
  modePaiement: string;
  numeroCompte: string;
  dateDemande: string;
  dateTraitement: string | null;
  statut: string;
  note: string;
}

const defaultWithdraws: AffiliateWithdraw[] = [
  { id: 1, affilie: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', montant: 25000, modePaiement: 'MTN MoMo', numeroCompte: '+237 677 11 22 33', dateDemande: '2026-06-15', dateTraitement: '2026-06-16', statut: 'PAYE', note: '' },
  { id: 2, affilie: 'Sophie Ngo', email: 'sophie.ngo@yahoo.fr', montant: 50000, modePaiement: 'Orange Money', numeroCompte: '+237 699 22 33 44', dateDemande: '2026-06-17', dateTraitement: null, statut: 'EN_ATTENTE', note: '' },
  { id: 3, affilie: 'Eric Bella', email: 'eric.bella@gmail.com', montant: 80000, modePaiement: 'MTN MoMo', numeroCompte: '+237 690 55 66 77', dateDemande: '2026-06-18', dateTraitement: null, statut: 'EN_COURS', note: 'Virement en cours de traitement' },
  { id: 4, affilie: 'Christine Owona', email: 'c.owona@yahoo.fr', montant: 15000, modePaiement: 'Orange Money', numeroCompte: '+237 677 66 77 88', dateDemande: '2026-06-10', dateTraitement: '2026-06-11', statut: 'PAYE', note: '' },
  { id: 5, affilie: 'Francoise Ekane', email: 'f.ekane@hotmail.com', montant: 35000, modePaiement: 'Virement', numeroCompte: 'SCB CM ****5678', dateDemande: '2026-06-19', dateTraitement: null, statut: 'EN_ATTENTE', note: '' },
  { id: 6, affilie: 'Albert Tabi', email: 'a.tabi@gmail.com', montant: 8000, modePaiement: 'MTN MoMo', numeroCompte: '+237 699 77 88 99', dateDemande: '2026-05-28', dateTraitement: '2026-05-29', statut: 'REJETE', note: 'Montant inferieur au minimum (5 000 FCFA) - solde insuffisant' },
];

export default function AffiliateWithdrawsPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [withdraws, setWithdraws] = useState<AffiliateWithdraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AffiliateWithdraw[] }>('/settings/admin/admin_affiliate_withdraws')
      .then(res => { if (res.data) setWithdraws(res.data); else setWithdraws(defaultWithdraws); })
      .catch(() => setWithdraws(defaultWithdraws))
      .finally(() => setLoading(false));
  }, []);

  const filtered = withdraws.filter((w) => {
    const matchSearch = w.affilie.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || w.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleApprove = (id: number) => {
    setWithdraws((prev) =>
      prev.map((w) => w.id === id ? { ...w, statut: 'PAYE', dateTraitement: new Date().toISOString().split('T')[0] } : w)
    );
  };

  const handleReject = (id: number) => {
    const note = prompt('Raison du rejet :');
    if (note === null) return;
    setWithdraws((prev) =>
      prev.map((w) => w.id === id ? { ...w, statut: 'REJETE', dateTraitement: new Date().toISOString().split('T')[0], note } : w)
    );
  };

  const totalEnAttente = withdraws.filter(w => w.statut === 'EN_ATTENTE' || w.statut === 'EN_COURS')
    .reduce((s, w) => s + w.montant, 0);

  const columns: Column<AffiliateWithdraw>[] = [
    {
      name: 'Affilie',
      key: 'affilie',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.affilie}</p>
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
      name: 'Mode paiement',
      key: 'modePaiement',
      render: (item) => (
        <div>
          <p className="text-sm font-medium">{item.modePaiement}</p>
          <p className="text-xs text-gray-3">{item.numeroCompte}</p>
        </div>
      ),
    },
    {
      name: 'Date demande',
      key: 'dateDemande',
      render: (item) => <span className="text-sm">{formatDate(item.dateDemande)}</span>,
    },
    {
      name: 'Date traitement',
      key: 'dateTraitement',
      render: (item) => <span className="text-sm">{item.dateTraitement ? formatDate(item.dateTraitement) : '-'}</span>,
    },
    {
      name: 'Note',
      key: 'note',
      render: (item) => (
        <span className="text-xs text-gray-3 max-w-[160px] block truncate" title={item.note}>{item.note || '-'}</span>
      ),
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
          {(item.statut === 'EN_ATTENTE' || item.statut === 'EN_COURS') && (
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
        <h1 className="text-2xl font-bold text-dark">Demandes de retrait affilies</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total demandes', value: withdraws.length },
          { label: 'En attente', value: withdraws.filter(w => w.statut === 'EN_ATTENTE').length },
          { label: 'A payer', value: formatPrice(totalEnAttente) },
          { label: 'Total paye', value: formatPrice(withdraws.filter(w => w.statut === 'PAYE').reduce((s, w) => s + w.montant, 0)) },
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
              placeholder="Rechercher affilie ou email..."
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
            <option value="EN_COURS">En cours</option>
            <option value="PAYE">Paye</option>
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
