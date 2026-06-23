'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Referral {
  id: number;
  referreNom: string;
  referreEmail: string;
  affilieNom: string;
  codeUtilise: string;
  dateInscription: string;
  premierAchat: string | null;
  montantAchat: number;
  commissionGeneree: number;
  statut: string;
}

const defaultReferrals: Referral[] = [
  { id: 1, referreNom: 'Bertrand Simo', referreEmail: 'b.simo@gmail.com', affilieNom: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', dateInscription: '2026-05-10', premierAchat: '2026-05-12', montantAchat: 185000, commissionGeneree: 9250, statut: 'CONVERTI' },
  { id: 2, referreNom: 'Valerie Tchoum', referreEmail: 'v.tchoum@yahoo.fr', affilieNom: 'Eric Bella', codeUtilise: 'ERIC-I9J0', dateInscription: '2026-05-14', premierAchat: '2026-05-15', montantAchat: 320000, commissionGeneree: 22400, statut: 'CONVERTI' },
  { id: 3, referreNom: 'Kevin Nguema', referreEmail: 'k.nguema@hotmail.com', affilieNom: 'Sophie Ngo', codeUtilise: 'SOPH-C3D4', dateInscription: '2026-05-18', premierAchat: null, montantAchat: 0, commissionGeneree: 0, statut: 'INSCRIT' },
  { id: 4, referreNom: 'Aisha Bello', referreEmail: 'a.bello@gmail.com', affilieNom: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', dateInscription: '2026-05-20', premierAchat: '2026-05-22', montantAchat: 95000, commissionGeneree: 4750, statut: 'CONVERTI' },
  { id: 5, referreNom: 'Rodrigue Mbassi', referreEmail: 'r.mbassi@gmail.com', affilieNom: 'Francoise Ekane', codeUtilise: 'FRAN-O5P6', dateInscription: '2026-05-25', premierAchat: null, montantAchat: 0, commissionGeneree: 0, statut: 'INSCRIT' },
  { id: 6, referreNom: 'Esther Ndongo', referreEmail: 'e.ndongo@yahoo.fr', affilieNom: 'Eric Bella', codeUtilise: 'ERIC-I9J0', dateInscription: '2026-06-01', premierAchat: '2026-06-03', montantAchat: 450000, commissionGeneree: 31500, statut: 'CONVERTI' },
  { id: 7, referreNom: 'Gerard Kotto', referreEmail: 'g.kotto@gmail.com', affilieNom: 'Christine Owona', codeUtilise: 'CHRI-K1L2', dateInscription: '2026-06-05', premierAchat: '2026-06-06', montantAchat: 75000, commissionGeneree: 3750, statut: 'CONVERTI' },
  { id: 8, referreNom: 'Nadege Zang', referreEmail: 'n.zang@hotmail.com', affilieNom: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', dateInscription: '2026-06-10', premierAchat: null, montantAchat: 0, commissionGeneree: 0, statut: 'INSCRIT' },
];

export default function AffiliateReferralsPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [affilieFilter, setAffiliéFilter] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>(defaultReferrals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Referral[] }>('/settings/admin/admin_affiliate_referrals')
      .then(res => { if (res.data) setReferrals(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter((r) => {
    const matchSearch =
      r.referreNom.toLowerCase().includes(search.toLowerCase()) ||
      r.referreEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.affilieNom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || r.statut === statutFilter;
    const matchAffilie = !affilieFilter || r.affilieNom === affilieFilter;
    return matchSearch && matchStatut && matchAffilie;
  });

  const affilies = [...new Set(referrals.map((r) => r.affilieNom))];

  const columns: Column<Referral>[] = [
    {
      name: 'Utilisateur referre',
      key: 'referreNom',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.referreNom}</p>
          <p className="text-xs text-gray-3">{item.referreEmail}</p>
        </div>
      ),
    },
    {
      name: 'Affilie (parrain)',
      key: 'affilieNom',
      render: (item) => <span className="text-sm">{item.affilieNom}</span>,
    },
    {
      name: 'Code utilise',
      key: 'codeUtilise',
      render: (item) => (
        <span className="font-mono text-xs text-primary bg-primary-soft px-2 py-0.5 rounded">{item.codeUtilise}</span>
      ),
    },
    {
      name: 'Date inscription',
      key: 'dateInscription',
      render: (item) => <span className="text-sm">{formatDate(item.dateInscription)}</span>,
    },
    {
      name: '1er achat',
      key: 'premierAchat',
      render: (item) => (
        <span className="text-sm">{item.premierAchat ? formatDate(item.premierAchat) : '-'}</span>
      ),
    },
    {
      name: 'Montant achat',
      key: 'montantAchat',
      render: (item) => (
        <span className="font-semibold">{item.montantAchat ? formatPrice(item.montantAchat) : '-'}</span>
      ),
    },
    {
      name: 'Commission',
      key: 'commissionGeneree',
      render: (item) => (
        <span className="font-semibold text-green-600">{item.commissionGeneree ? formatPrice(item.commissionGeneree) : '-'}</span>
      ),
    },
    {
      name: 'Statut',
      key: 'statut',
      render: (item) => <StatusBadge status={item.statut} />,
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
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Utilisateurs referres</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total referrals', value: referrals.length },
          { label: 'Convertis', value: referrals.filter(r => r.statut === 'CONVERTI').length },
          { label: 'Inscrits', value: referrals.filter(r => r.statut === 'INSCRIT').length },
          { label: 'Commissions totales', value: formatPrice(referrals.reduce((s, r) => s + r.commissionGeneree, 0)) },
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
              placeholder="Rechercher utilisateur, email ou affilie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={affilieFilter}
            onChange={(e) => setAffiliéFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les affilies</option>
            {affilies.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="INSCRIT">Inscrit</option>
            <option value="CONVERTI">Converti</option>
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
