'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Search, Eye, Check, X as XIcon, Trash2, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AffiliateUser {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  codeParrainage: string;
  totalClics: number;
  totalConversions: number;
  totalGains: number;
  solde: number;
  dateInscription: string;
  statut: string;
  niveauCommission: string;
}

export default function AffiliateUsersPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AffiliateUser[] }>('/affiliate/admin/list?perPage=200')
      .then(res => { if (res.data) setUsers(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.codeParrainage.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || u.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleApprove = (id: number) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, statut: 'APPROUVE' } : u));
  };

  const handleReject = (id: number) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, statut: 'REJETE' } : u));
  };

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cet affilie ?')) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const columns: Column<AffiliateUser>[] = [
    {
      name: 'Affilie',
      key: 'nom',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.nom}</p>
          <p className="text-xs text-gray-3">{item.email}</p>
        </div>
      ),
    },
    {
      name: 'Code parrainage',
      key: 'codeParrainage',
      render: (item) => (
        <span className="font-mono text-sm text-primary bg-primary-soft px-2 py-0.5 rounded">{item.codeParrainage}</span>
      ),
    },
    {
      name: 'Commission',
      key: 'niveauCommission',
      render: (item) => <span className="font-semibold">{item.niveauCommission}</span>,
    },
    {
      name: 'Clics',
      key: 'totalClics',
      render: (item) => <span>{item.totalClics.toLocaleString('fr-FR')}</span>,
    },
    {
      name: 'Conversions',
      key: 'totalConversions',
      render: (item) => <span className="font-semibold text-green-600">{item.totalConversions}</span>,
    },
    {
      name: 'Gains totaux',
      key: 'totalGains',
      render: (item) => <span className="font-semibold">{formatPrice(item.totalGains)}</span>,
    },
    {
      name: 'Solde',
      key: 'solde',
      render: (item) => <span className="font-semibold text-primary">{formatPrice(item.solde)}</span>,
    },
    {
      name: 'Inscription',
      key: 'dateInscription',
      render: (item) => <span className="text-sm">{formatDate(item.dateInscription)}</span>,
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
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition" title="Rejeter">
                <XIcon className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Supprimer">
            <Trash2 className="w-4 h-4" />
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
          <UsersRound className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Utilisateurs affilies</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total affilies', value: users.length },
          { label: 'En attente', value: users.filter(u => u.statut === 'EN_ATTENTE').length },
          { label: 'Approuves', value: users.filter(u => u.statut === 'APPROUVE').length },
          { label: 'Gains totaux', value: formatPrice(users.reduce((s, u) => s + u.totalGains, 0)) },
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
              placeholder="Rechercher nom, email ou code..."
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
