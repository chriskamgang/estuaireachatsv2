'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gavel, Plus, Search, Eye, Trash2, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AuctionProduct {
  id: number;
  titre: string;
  prixDepart: number;
  prixActuel: number;
  nbEncheres: number;
  dateFin: string;
  statut: string;
  vendeur: string;
}

const defaultAuctions: AuctionProduct[] = [
  { id: 1, titre: 'iPhone 14 Pro Max 256Go', prixDepart: 250000, prixActuel: 420000, nbEncheres: 18, dateFin: '2026-06-28', statut: 'ACTIF', vendeur: 'Alain Mbarga' },
  { id: 2, titre: 'MacBook Pro M3 512Go', prixDepart: 800000, prixActuel: 1150000, nbEncheres: 31, dateFin: '2026-06-25', statut: 'ACTIF', vendeur: 'Sophie Ngo' },
  { id: 3, titre: 'Samsung QLED 65 pouces', prixDepart: 300000, prixActuel: 385000, nbEncheres: 9, dateFin: '2026-06-23', statut: 'ACTIF', vendeur: 'Paul Atangana' },
  { id: 4, titre: 'Montre Casio G-Shock', prixDepart: 45000, prixActuel: 67000, nbEncheres: 22, dateFin: '2026-06-20', statut: 'TERMINE', vendeur: 'Marie Fouda' },
  { id: 5, titre: 'Drone DJI Mini 4 Pro', prixDepart: 180000, prixActuel: 265000, nbEncheres: 14, dateFin: '2026-06-30', statut: 'ACTIF', vendeur: 'Eric Bella' },
  { id: 6, titre: 'Refrigerateur Samsung 500L', prixDepart: 120000, prixActuel: 155000, nbEncheres: 7, dateFin: '2026-06-22', statut: 'TERMINE', vendeur: 'Christine Owona' },
  { id: 7, titre: 'Canape en cuir 3 places', prixDepart: 95000, prixActuel: 130000, nbEncheres: 5, dateFin: '2026-07-02', statut: 'PLANIFIE', vendeur: 'Jean Njoh' },
  { id: 8, titre: 'Guitare electrique Fender', prixDepart: 70000, prixActuel: 70000, nbEncheres: 0, dateFin: '2026-07-05', statut: 'PLANIFIE', vendeur: 'Albert Tabi' },
];

const statuts = ['', 'ACTIF', 'TERMINE', 'PLANIFIE'];

export default function AuctionPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [auctions, setAuctions] = useState<AuctionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AuctionProduct[] }>('/settings/admin/admin_auction_data')
      .then(res => { if (res.data) setAuctions(res.data); else setAuctions(defaultAuctions); })
      .catch(() => setAuctions(defaultAuctions))
      .finally(() => setLoading(false));
  }, []);

  const filtered = auctions.filter((a) => {
    const matchSearch = a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.vendeur.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || a.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cette enchere ?')) return;
    setAuctions((prev) => prev.filter((a) => a.id !== id));
  };

  const columns: Column<AuctionProduct>[] = [
    {
      name: 'Produit',
      key: 'titre',
      render: (item) => (
        <span className="font-medium text-dark">{item.titre}</span>
      ),
    },
    {
      name: 'Vendeur',
      key: 'vendeur',
      render: (item) => <span className="text-sm text-gray-2">{item.vendeur}</span>,
    },
    {
      name: 'Prix depart',
      key: 'prixDepart',
      render: (item) => <span>{formatPrice(item.prixDepart)}</span>,
    },
    {
      name: 'Prix actuel',
      key: 'prixActuel',
      render: (item) => (
        <span className="font-semibold text-primary">{formatPrice(item.prixActuel)}</span>
      ),
    },
    {
      name: 'Encheres',
      key: 'nbEncheres',
      render: (item) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-soft rounded-full text-xs font-semibold text-primary">
          <Gavel className="w-3 h-3" />
          {item.nbEncheres}
        </span>
      ),
    },
    {
      name: 'Date fin',
      key: 'dateFin',
      render: (item) => <span className="text-sm">{formatDate(item.dateFin)}</span>,
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
          <Link
            href={`/auction/${item.id}`}
            className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"
            title="Voir"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"
            title="Supprimer"
          >
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Gavel className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Produits aux encheres</h1>
        </div>
        <Link
          href="/auction/create"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle enchere
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total encheres', value: auctions.length, color: 'text-dark' },
          { label: 'Actives', value: auctions.filter(a => a.statut === 'ACTIF').length, color: 'text-green-600' },
          { label: 'Terminees', value: auctions.filter(a => a.statut === 'TERMINE').length, color: 'text-gray-3' },
          { label: 'Planifiees', value: auctions.filter(a => a.statut === 'PLANIFIE').length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
              placeholder="Rechercher un produit ou vendeur..."
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
            {statuts.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
