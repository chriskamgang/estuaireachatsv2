'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, CheckCircle, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Collection {
  id: number;
  ref: string;
  livreur: string;
  commande: string;
  client: string;
  montantCollecte: number;
  montantCommande: number;
  statut: string;
  dateCollecte: string;
  dateVersement: string | null;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 1, ref: 'COL-001', livreur: 'Rodrigue Nkoa', commande: 'CMD-20240601-001', client: 'Ngono Marie', montantCollecte: 45000, montantCommande: 45000, statut: 'COMPLETED', dateCollecte: '2026-06-01', dateVersement: '2026-06-02' },
  { id: 2, ref: 'COL-002', livreur: 'Franck Mvondo', commande: 'CMD-20240602-015', client: 'Biya Paul', montantCollecte: 78500, montantCommande: 78500, statut: 'COMPLETED', dateCollecte: '2026-06-02', dateVersement: '2026-06-03' },
  { id: 3, ref: 'COL-003', livreur: 'Stephane Biya', commande: 'CMD-20240603-022', client: 'Kamga Serge', montantCollecte: 32000, montantCommande: 32000, statut: 'PENDING', dateCollecte: '2026-06-05', dateVersement: null },
  { id: 4, ref: 'COL-004', livreur: 'Herve Kamga', commande: 'CMD-20240604-008', client: 'Tchoupo Alice', montantCollecte: 125000, montantCommande: 125000, statut: 'COMPLETED', dateCollecte: '2026-06-05', dateVersement: '2026-06-06' },
  { id: 5, ref: 'COL-005', livreur: 'Rodrigue Nkoa', commande: 'CMD-20240605-031', client: 'Nkoa Jean', montantCollecte: 67500, montantCommande: 67500, statut: 'PENDING', dateCollecte: '2026-06-07', dateVersement: null },
  { id: 6, ref: 'COL-006', livreur: 'Martial Ondoua', commande: 'CMD-20240606-044', client: 'Nguemo Claire', montantCollecte: 92000, montantCommande: 92000, statut: 'COMPLETED', dateCollecte: '2026-06-08', dateVersement: '2026-06-09' },
  { id: 7, ref: 'COL-007', livreur: 'Cyrille Abega', commande: 'CMD-20240607-019', client: 'Mvondo Eric', montantCollecte: 28000, montantCommande: 28000, statut: 'PENDING', dateCollecte: '2026-06-09', dateVersement: null },
  { id: 8, ref: 'COL-008', livreur: 'Franck Mvondo', commande: 'CMD-20240608-056', client: 'Bello Fatima', montantCollecte: 54000, montantCommande: 54000, statut: 'COMPLETED', dateCollecte: '2026-06-10', dateVersement: '2026-06-11' },
  { id: 9, ref: 'COL-009', livreur: 'Boris Nlend', commande: 'CMD-20240609-003', client: 'Ondoua Pierre', montantCollecte: 18500, montantCommande: 18500, statut: 'COMPLETED', dateCollecte: '2026-06-11', dateVersement: '2026-06-12' },
  { id: 10, ref: 'COL-010', livreur: 'Rodrigue Nkoa', commande: 'CMD-20240610-067', client: 'Abega Laure', montantCollecte: 210000, montantCommande: 210000, statut: 'PENDING', dateCollecte: '2026-06-12', dateVersement: null },
];

export default function DeliveryCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ value: Collection[] }>('/settings/admin/admin_delivery_collections');
      if (res.value && Array.isArray(res.value) && res.value.length > 0) {
        setCollections(res.value);
      } else {
        setCollections(DEFAULT_COLLECTIONS);
      }
    } catch {
      setCollections(DEFAULT_COLLECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const livreurs = [...new Set(collections.map((c) => c.livreur))];

  const filtered = collections.filter((c) => {
    const matchStatus = !statusFilter || c.statut === statusFilter;
    const matchLivreur = !livreurFilter || c.livreur === livreurFilter;
    return matchStatus && matchLivreur;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalCollecte = filtered.reduce((s, c) => s + c.montantCollecte, 0);
  const totalPending = filtered.filter((c) => c.statut === 'PENDING').reduce((s, c) => s + c.montantCollecte, 0);

  const handleVersement = async (id: number) => {
    const updated = collections.map((c) =>
      c.id === id ? { ...c, statut: 'COMPLETED', dateVersement: new Date().toISOString().split('T')[0] } : c
    );
    setCollections(updated);
    try {
      await api.put('/settings/admin/admin_delivery_collections', { value: updated });
    } catch (err) {
      console.error('Erreur mise a jour:', err);
    }
  };

  const columns: Column<Collection>[] = [
    { name: 'Ref', key: 'ref', render: (item) => <code className="text-xs font-mono text-primary">{item.ref}</code> },
    {
      name: 'Livreur', key: 'livreur', render: (item) => (
        <span className="text-sm font-medium text-dark">{item.livreur}</span>
      ),
    },
    {
      name: 'Commande', key: 'commande', render: (item) => (
        <div>
          <code className="text-xs font-mono text-gray-2">{item.commande}</code>
          <p className="text-xs text-gray-3">{item.client}</p>
        </div>
      ),
    },
    {
      name: 'Montant collecte', key: 'montantCollecte', render: (item) => (
        <span className="font-semibold text-dark">{formatPrice(item.montantCollecte)}</span>
      ),
    },
    {
      name: 'Date collecte', key: 'dateCollecte', render: (item) => (
        <span className="text-xs text-gray-3">{formatDate(item.dateCollecte)}</span>
      ),
    },
    {
      name: 'Date versement', key: 'dateVersement', render: (item) => (
        item.dateVersement
          ? <span className="text-xs text-gray-3">{formatDate(item.dateVersement)}</span>
          : <span className="text-xs text-warning font-medium">Non verse</span>
      ),
    },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        item.statut === 'PENDING' ? (
          <button
            onClick={() => handleVersement(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-success-soft text-success rounded-lg hover:bg-success/20 transition"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Marquer verse
          </button>
        ) : (
          <span className="text-xs text-gray-3">Verse</span>
        )
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
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Collectes Livreurs</h1>
            <p className="text-sm text-gray-3">Suivi des montants collectes a la livraison (paiement a la livraison)</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-5 rounded-lg hover:bg-gray-6 transition">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Total collecte</p>
          <p className="text-2xl font-bold text-dark">{formatPrice(totalCollecte)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">En attente de versement</p>
          <p className="text-2xl font-bold text-warning">{formatPrice(totalPending)}</p>
          <p className="text-xs text-gray-3 mt-0.5">{filtered.filter((c) => c.statut === 'PENDING').length} livraisons</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Verses</p>
          <p className="text-2xl font-bold text-success">{filtered.filter((c) => c.statut === 'COMPLETED').length}</p>
          <p className="text-xs text-gray-3 mt-0.5">collectes</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-3">
          <select
            value={livreurFilter}
            onChange={(e) => setLivreurFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les livreurs</option>
            {livreurs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Verses</option>
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
