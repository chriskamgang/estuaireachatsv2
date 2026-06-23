'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AuctionOrder {
  id: number;
  ref: string;
  acheteur: string;
  produit: string;
  montantGagne: number;
  dateEnchere: string;
  datePaiement: string | null;
  statut: string;
  modePaiement: string;
}

const defaultOrders: AuctionOrder[] = [
  { id: 1, ref: 'AUC-001', acheteur: 'Jean Mbarga', produit: 'iPhone 14 Pro Max', montantGagne: 420000, dateEnchere: '2026-06-18', datePaiement: '2026-06-19', statut: 'PAYE', modePaiement: 'MTN MoMo' },
  { id: 2, ref: 'AUC-002', acheteur: 'Sophie Ngo', produit: 'MacBook Pro M3', montantGagne: 1150000, dateEnchere: '2026-06-17', datePaiement: null, statut: 'EN_ATTENTE', modePaiement: '-' },
  { id: 3, ref: 'AUC-003', acheteur: 'Paul Atangana', produit: 'Samsung QLED 65"', montantGagne: 385000, dateEnchere: '2026-06-16', datePaiement: '2026-06-17', statut: 'PAYE', modePaiement: 'Orange Money' },
  { id: 4, ref: 'AUC-004', acheteur: 'Marie Fouda', produit: 'Montre Casio G-Shock', montantGagne: 67000, dateEnchere: '2026-06-15', datePaiement: null, statut: 'EXPIRE', modePaiement: '-' },
  { id: 5, ref: 'AUC-005', acheteur: 'Eric Bella', produit: 'Drone DJI Mini 4 Pro', montantGagne: 265000, dateEnchere: '2026-06-14', datePaiement: '2026-06-15', statut: 'LIVRE', modePaiement: 'MTN MoMo' },
  { id: 6, ref: 'AUC-006', acheteur: 'Christine Owona', produit: 'Refrigerateur Samsung', montantGagne: 155000, dateEnchere: '2026-06-13', datePaiement: null, statut: 'EN_ATTENTE', modePaiement: '-' },
  { id: 7, ref: 'AUC-007', acheteur: 'Albert Tabi', produit: 'Guitare Fender', montantGagne: 82000, dateEnchere: '2026-06-12', datePaiement: '2026-06-13', statut: 'PAYE', modePaiement: 'GFSolution' },
];

const statuts = ['', 'EN_ATTENTE', 'PAYE', 'LIVRE', 'EXPIRE'];

export default function AuctionOrdersPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [orders, setOrders] = useState<AuctionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AuctionOrder[] }>('/settings/admin/admin_auction_orders')
      .then(res => { if (res.data) setOrders(res.data); else setOrders(defaultOrders); })
      .catch(() => setOrders(defaultOrders))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.acheteur.toLowerCase().includes(search.toLowerCase()) ||
      o.produit.toLowerCase().includes(search.toLowerCase()) ||
      o.ref.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || o.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleMarkPaid = (id: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, statut: 'PAYE', datePaiement: new Date().toISOString().split('T')[0] } : o
      )
    );
  };

  const handleExpire = (id: number) => {
    if (!confirm('Marquer cette commande comme expiree ?')) return;
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, statut: 'EXPIRE' } : o));
  };

  const totalPaye = orders.filter(o => o.statut === 'PAYE' || o.statut === 'LIVRE')
    .reduce((sum, o) => sum + o.montantGagne, 0);

  const columns: Column<AuctionOrder>[] = [
    {
      name: 'Ref',
      key: 'ref',
      render: (item) => <span className="font-mono text-sm text-primary">{item.ref}</span>,
    },
    {
      name: 'Acheteur',
      key: 'acheteur',
      render: (item) => <span className="font-medium text-dark">{item.acheteur}</span>,
    },
    {
      name: 'Produit',
      key: 'produit',
      render: (item) => <span className="text-sm">{item.produit}</span>,
    },
    {
      name: 'Montant gagne',
      key: 'montantGagne',
      render: (item) => <span className="font-semibold text-primary">{formatPrice(item.montantGagne)}</span>,
    },
    {
      name: 'Mode paiement',
      key: 'modePaiement',
      render: (item) => <span className="text-sm">{item.modePaiement}</span>,
    },
    {
      name: 'Date enchere',
      key: 'dateEnchere',
      render: (item) => <span className="text-sm">{formatDate(item.dateEnchere)}</span>,
    },
    {
      name: 'Date paiement',
      key: 'datePaiement',
      render: (item) => <span className="text-sm">{item.datePaiement ? formatDate(item.datePaiement) : '-'}</span>,
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
              <button
                onClick={() => handleMarkPaid(item.id)}
                className="p-1.5 rounded-lg hover:bg-green-50 text-gray-3 hover:text-green-600 transition"
                title="Marquer comme paye"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExpire(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition"
                title="Marquer comme expire"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir details">
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
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Commandes encheres</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: orders.length, color: 'text-dark' },
          { label: 'En attente', value: orders.filter(o => o.statut === 'EN_ATTENTE').length, color: 'text-amber-600' },
          { label: 'Payees', value: orders.filter(o => o.statut === 'PAYE' || o.statut === 'LIVRE').length, color: 'text-green-600' },
          { label: 'Montant total', value: formatPrice(totalPaye), color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
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
              placeholder="Rechercher acheteur, produit ou ref..."
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
