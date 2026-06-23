'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, Download, UserX, UserCheck, Search, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Subscriber {
  id: number;
  email: string;
  nom: string;
  name?: string;
  statut: string;
  status?: string;
  source: string;
  dateInscription: string;
  createdAt?: string;
  derniereOuverture: string | null;
  lastOpenedAt?: string | null;
}

const SOURCES = ['Site web', 'Application mobile', 'Checkout', 'Inscription vendeur'];

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Subscriber[] }>('/subscribers?perPage=200');
      setSubscribers(res.data);
    } catch (err) {
      console.error('Erreur chargement abonnes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getName = (s: Subscriber) => s.name || s.nom;
  const getStatus = (s: Subscriber) => s.status || s.statut;
  const getDate = (s: Subscriber) => s.createdAt || s.dateInscription;
  const getLastOpen = (s: Subscriber) => s.lastOpenedAt || s.derniereOuverture;

  const filtered = subscribers.filter((s) => {
    const matchSearch = !search || (getName(s) || '').toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || getStatus(s) === statusFilter;
    const matchSource = !sourceFilter || s.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet abonne ?')) return;
    try {
      await api.delete(`/subscribers/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selected.length} abonne(s) ?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/subscribers/${id}`)));
      setSelected([]);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/subscribers/${id}/toggle`);
      loadData();
    } catch (err) {
      console.error('Erreur toggle:', err);
    }
  };

  const columns: Column<Subscriber>[] = [
    {
      name: '', key: 'select', render: (item) => (
        <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="accent-primary" />
      ),
    },
    {
      name: 'Abonne', key: 'email', render: (item) => (
        <div>
          <p className="text-sm font-medium text-dark">{getName(item)}</p>
          <p className="text-xs text-gray-3">{item.email}</p>
        </div>
      ),
    },
    { name: 'Source', key: 'source', render: (item) => (
      <span className="px-2 py-0.5 bg-gray-6 text-gray-2 text-xs rounded-full">{item.source}</span>
    )},
    {
      name: 'Inscription', key: 'dateInscription', render: (item) => (
        <span className="text-xs text-gray-3">{formatDate(getDate(item))}</span>
      ),
    },
    {
      name: 'Derniere ouverture', key: 'derniereOuverture', render: (item) => (
        getLastOpen(item)
          ? <span className="text-xs text-gray-3">{formatDate(getLastOpen(item)!)}</span>
          : <span className="text-xs text-gray-4">Jamais</span>
      ),
    },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={getStatus(item)} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggleStatus(item.id)}
            className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"
            title={getStatus(item) === 'ACTIVE' ? 'Desactiver' : 'Activer'}
          >
            {getStatus(item) === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Abonnes Newsletter</h1>
            <p className="text-sm text-gray-3">{subscribers.length} abonnes au total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-2 text-sm text-danger border border-danger rounded-lg hover:bg-danger-soft transition">
              <Trash2 className="w-4 h-4" /> Supprimer ({selected.length})
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-5 rounded-lg hover:bg-gray-6 transition">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total abonnes', val: subscribers.length, color: 'text-dark' },
          { label: 'Actifs', val: subscribers.filter((s) => getStatus(s) === 'ACTIVE').length, color: 'text-success' },
          { label: 'Inactifs', val: subscribers.filter((s) => getStatus(s) === 'INACTIVE').length, color: 'text-warning' },
          { label: 'Taux d\'ouverture', val: '68%', color: 'text-primary' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[220px]"
              placeholder="Rechercher un abonne..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="INACTIVE">Inactifs</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Toutes les sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={paginated}
          pagination={{ page, perPage: PER_PAGE, total: filtered.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
