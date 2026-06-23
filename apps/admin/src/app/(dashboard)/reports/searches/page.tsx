'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface SearchTerm {
  id: number;
  terme: string;
  nbRecherches: number;
  resultatsTrouves: number;
  tauxClic: number;
}

const columns: Column<SearchTerm>[] = [
  {
    name: 'Terme recherche',
    key: 'terme',
    render: (item) => <span className="font-medium">{item.terme}</span>,
  },
  {
    name: 'Nb recherches',
    key: 'nbRecherches',
    render: (item) => <span className="font-semibold">{item.nbRecherches.toLocaleString('fr-FR')}</span>,
  },
  {
    name: 'Resultats trouves',
    key: 'resultatsTrouves',
    render: (item) => (
      <span className={item.resultatsTrouves === 0 ? 'text-danger font-semibold' : 'font-semibold text-success'}>
        {item.resultatsTrouves}
      </span>
    ),
  },
  {
    name: 'Taux clic',
    key: 'tauxClic',
    render: (item) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${item.tauxClic}%` }}
          />
        </div>
        <span className="text-sm font-semibold">{item.tauxClic}%</span>
      </div>
    ),
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState<SearchTerm[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<any>('/settings/admin/admin_report_searches').catch(() => null);
        const raw = res?.value || res?.data || res || [];

        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: SearchTerm[] = raw.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            terme: item.terme || item.term || item.query || '',
            nbRecherches: item.nbRecherches || item.count || item.searchCount || 0,
            resultatsTrouves: item.resultatsTrouves || item.results || item.resultCount || 0,
            tauxClic: item.tauxClic || item.clickRate || 0,
          }));
          setSearchData(mapped);
        }
      } catch (err) {
        console.error('Erreur chargement recherches:', err);
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

  const totalRecherches = searchData.reduce((s, r) => s + r.nbRecherches, 0);
  const termesUniques = searchData.length;
  const sansResultats = searchData.filter((r) => r.resultatsTrouves === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark">Recherches utilisateurs</h1>
          <p className="text-sm text-gray-2">Termes les plus recherches sur la plateforme</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Total recherches</p>
          <p className="text-2xl font-bold text-dark">{totalRecherches.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Termes uniques</p>
          <p className="text-2xl font-bold text-dark">{termesUniques}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-5">
          <p className="text-xs text-gray-2 uppercase tracking-wider mb-1">Sans resultats</p>
          <p className="text-2xl font-bold text-danger">{sansResultats}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-5">
          <h2 className="font-semibold text-dark">Analyse des recherches</h2>
        </div>
        <DataTable
          columns={columns}
          data={searchData.slice((page - 1) * perPage, page * perPage)}
          pagination={{ page, perPage, total: searchData.length }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
