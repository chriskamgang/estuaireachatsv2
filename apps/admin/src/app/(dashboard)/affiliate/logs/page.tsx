'use client';

import { useState, useEffect } from 'react';
import { History, Search, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AffiliateLog {
  id: number;
  type: string;
  affilie: string;
  codeUtilise: string;
  ipAdresse: string;
  page: string;
  produit: string;
  dateHeure: string;
  converti: boolean;
  statut: string;
}

const defaultLogs: AffiliateLog[] = [
  { id: 1, type: 'CLIC', affilie: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', ipAdresse: '196.207.12.45', page: '/products/samsung-galaxy-a55', produit: 'Samsung Galaxy A55', dateHeure: '2026-06-21 08:12:34', converti: false, statut: 'CLIC' },
  { id: 2, type: 'CONVERSION', affilie: 'Eric Bella', codeUtilise: 'ERIC-I9J0', ipAdresse: '196.207.45.12', page: '/products/macbook-pro-m3', produit: 'MacBook Pro M3', dateHeure: '2026-06-21 09:05:22', converti: true, statut: 'CONVERSION' },
  { id: 3, type: 'CLIC', affilie: 'Sophie Ngo', codeUtilise: 'SOPH-C3D4', ipAdresse: '41.244.100.55', page: '/products/iphone-14-pro', produit: 'iPhone 14 Pro', dateHeure: '2026-06-21 09:34:11', converti: false, statut: 'CLIC' },
  { id: 4, type: 'INSCRIPTION', affilie: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', ipAdresse: '196.207.88.99', page: '/register', produit: '-', dateHeure: '2026-06-21 10:15:00', converti: true, statut: 'INSCRIPTION' },
  { id: 5, type: 'CONVERSION', affilie: 'Francoise Ekane', codeUtilise: 'FRAN-O5P6', ipAdresse: '41.244.200.12', page: '/products/drone-dji-mini', produit: 'Drone DJI Mini 4 Pro', dateHeure: '2026-06-21 11:00:45', converti: true, statut: 'CONVERSION' },
  { id: 6, type: 'CLIC', affilie: 'Christine Owona', codeUtilise: 'CHRI-K1L2', ipAdresse: '196.207.33.77', page: '/products/ecouteurs-jbl', produit: 'Ecouteurs JBL', dateHeure: '2026-06-21 11:22:33', converti: false, statut: 'CLIC' },
  { id: 7, type: 'CLIC', affilie: 'Eric Bella', codeUtilise: 'ERIC-I9J0', ipAdresse: '41.244.55.88', page: '/', produit: '-', dateHeure: '2026-06-21 12:05:19', converti: false, statut: 'CLIC' },
  { id: 8, type: 'CONVERSION', affilie: 'Christine Owona', codeUtilise: 'CHRI-K1L2', ipAdresse: '196.207.22.66', page: '/products/tablette-lenovo', produit: 'Tablette Lenovo Tab M10', dateHeure: '2026-06-21 13:41:02', converti: true, statut: 'CONVERSION' },
  { id: 9, type: 'INSCRIPTION', affilie: 'Sophie Ngo', codeUtilise: 'SOPH-C3D4', ipAdresse: '41.244.111.44', page: '/register', produit: '-', dateHeure: '2026-06-21 14:08:57', converti: true, statut: 'INSCRIPTION' },
  { id: 10, type: 'CLIC', affilie: 'Jean Mbarga', codeUtilise: 'JEAN-A1B2', ipAdresse: '196.207.77.33', page: '/categories/electronique', produit: '-', dateHeure: '2026-06-21 15:30:00', converti: false, statut: 'CLIC' },
];

export default function AffiliateLogsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [logs, setLogs] = useState<AffiliateLog[]>(defaultLogs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AffiliateLog[] }>('/settings/admin/admin_affiliate_logs')
      .then(res => { if (res.data) setLogs(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.affilie.toLowerCase().includes(search.toLowerCase()) ||
      l.codeUtilise.toLowerCase().includes(search.toLowerCase()) ||
      l.produit.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || l.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns: Column<AffiliateLog>[] = [
    {
      name: 'Date / Heure',
      key: 'dateHeure',
      render: (item) => <span className="text-xs font-mono text-gray-2">{item.dateHeure}</span>,
    },
    {
      name: 'Type',
      key: 'type',
      render: (item) => <StatusBadge status={item.type} />,
    },
    {
      name: 'Affilie',
      key: 'affilie',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-dark">{item.affilie}</p>
          <p className="text-xs font-mono text-primary">{item.codeUtilise}</p>
        </div>
      ),
    },
    {
      name: 'Page visitee',
      key: 'page',
      render: (item) => (
        <span className="text-xs text-gray-2 max-w-[160px] block truncate font-mono" title={item.page}>{item.page}</span>
      ),
    },
    {
      name: 'Produit',
      key: 'produit',
      render: (item) => <span className="text-sm">{item.produit}</span>,
    },
    {
      name: 'IP',
      key: 'ipAdresse',
      render: (item) => <span className="text-xs font-mono text-gray-3">{item.ipAdresse}</span>,
    },
    {
      name: 'Converti',
      key: 'converti',
      render: (item) => (
        <span className={`text-xs font-semibold ${item.converti ? 'text-green-600' : 'text-gray-3'}`}>
          {item.converti ? 'Oui' : 'Non'}
        </span>
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
          <History className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Logs affiliation</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total evenements', value: logs.length },
          { label: 'Clics', value: logs.filter(l => l.type === 'CLIC').length },
          { label: 'Conversions', value: logs.filter(l => l.type === 'CONVERSION').length },
          { label: 'Inscriptions', value: logs.filter(l => l.type === 'INSCRIPTION').length },
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
              placeholder="Rechercher affilie, code ou produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les types</option>
            <option value="CLIC">Clics</option>
            <option value="CONVERSION">Conversions</option>
            <option value="INSCRIPTION">Inscriptions</option>
          </select>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="De"
          />
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="A"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          pagination={{ page: 1, perPage: 15, total: filtered.length }}
        />
      </div>
    </div>
  );
}
