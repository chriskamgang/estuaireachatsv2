'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Download, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Payment {
  id: number;
  ref: string;
  livreur: string;
  telephone: string;
  montant: number;
  commandes: number;
  methode: string;
  statut: string;
  date: string;
  periode: string;
}

const DEFAULT_PAYMENTS: Payment[] = [
  { id: 1, ref: 'LPY-001', livreur: 'Rodrigue Nkoa', telephone: '677112233', montant: 45000, commandes: 28, methode: 'MTN MoMo', statut: 'PAID', date: '2026-06-01', periode: 'Mai 2026' },
  { id: 2, ref: 'LPY-002', livreur: 'Franck Mvondo', telephone: '695443322', montant: 32000, commandes: 20, methode: 'Orange Money', statut: 'PAID', date: '2026-06-01', periode: 'Mai 2026' },
  { id: 3, ref: 'LPY-003', livreur: 'Stephane Biya', telephone: '677889900', montant: 28000, commandes: 17, methode: 'MTN MoMo', statut: 'PENDING', date: '2026-06-10', periode: 'Mai 2026' },
  { id: 4, ref: 'LPY-004', livreur: 'Herve Kamga', telephone: '699112244', montant: 15000, commandes: 9, methode: 'Orange Money', statut: 'PAID', date: '2026-06-01', periode: 'Mai 2026' },
  { id: 5, ref: 'LPY-005', livreur: 'Martial Ondoua', telephone: '695778899', montant: 22000, commandes: 14, methode: 'MTN MoMo', statut: 'PENDING', date: '2026-06-10', periode: 'Mai 2026' },
  { id: 6, ref: 'LPY-006', livreur: 'Cyrille Abega', telephone: '677331122', montant: 10000, commandes: 6, methode: 'Orange Money', statut: 'PAID', date: '2026-06-01', periode: 'Mai 2026' },
  { id: 7, ref: 'LPY-007', livreur: 'Boris Nlend', telephone: '695220011', montant: 8000, commandes: 5, methode: 'MTN MoMo', statut: 'PAID', date: '2026-06-01', periode: 'Mai 2026' },
  { id: 8, ref: 'LPY-008', livreur: 'Rodrigue Nkoa', telephone: '677112233', montant: 48000, commandes: 30, methode: 'MTN MoMo', statut: 'PAID', date: '2026-05-01', periode: 'Avr 2026' },
  { id: 9, ref: 'LPY-009', livreur: 'Franck Mvondo', telephone: '695443322', montant: 29000, commandes: 18, methode: 'Orange Money', statut: 'PAID', date: '2026-05-01', periode: 'Avr 2026' },
  { id: 10, ref: 'LPY-010', livreur: 'Stephane Biya', telephone: '677889900', montant: 35000, commandes: 22, methode: 'MTN MoMo', statut: 'PAID', date: '2026-05-01', periode: 'Avr 2026' },
];

export default function DeliveryPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodeFilter, setPeriodeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ value: Payment[] }>('/settings/admin/admin_delivery_payments');
      if (res.value && Array.isArray(res.value) && res.value.length > 0) {
        setPayments(res.value);
      } else {
        setPayments(DEFAULT_PAYMENTS);
      }
    } catch {
      setPayments(DEFAULT_PAYMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const periodes = [...new Set(payments.map((p) => p.periode))];

  const filtered = payments.filter((p) => {
    const matchPeriode = !periodeFilter || p.periode === periodeFilter;
    const matchStatus = !statusFilter || p.statut === statusFilter;
    return matchPeriode && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalPaid = filtered.filter((p) => p.statut === 'PAID').reduce((s, p) => s + p.montant, 0);
  const totalPending = filtered.filter((p) => p.statut === 'PENDING').reduce((s, p) => s + p.montant, 0);

  const columns: Column<Payment>[] = [
    { name: 'Ref', key: 'ref', render: (item) => <code className="text-xs font-mono text-primary">{item.ref}</code> },
    {
      name: 'Livreur', key: 'livreur', render: (item) => (
        <div>
          <p className="text-sm font-medium text-dark">{item.livreur}</p>
          <p className="text-xs text-gray-3">{item.telephone}</p>
        </div>
      ),
    },
    { name: 'Periode', key: 'periode', render: (item) => <span className="text-gray-1">{item.periode}</span> },
    { name: 'Commandes', key: 'commandes', render: (item) => <span className="text-gray-2">{item.commandes}</span> },
    { name: 'Montant', key: 'montant', render: (item) => <span className="font-semibold text-dark">{formatPrice(item.montant)}</span> },
    { name: 'Methode', key: 'methode', render: (item) => <span className="text-gray-1">{item.methode}</span> },
    { name: 'Date paiement', key: 'date', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.date)}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
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
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Historique Paiements Livreurs</h1>
            <p className="text-sm text-gray-3">Tous les paiements effectues aux livreurs</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-5 rounded-lg hover:bg-gray-6 transition">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Total paye</p>
          <p className="text-2xl font-bold text-success">{formatPrice(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">En attente</p>
          <p className="text-2xl font-bold text-warning">{formatPrice(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Commandes livrees</p>
          <p className="text-2xl font-bold text-dark">{filtered.reduce((s, p) => s + p.commandes, 0)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-3">
          <select
            value={periodeFilter}
            onChange={(e) => setPeriodeFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Toutes les periodes</option>
            {periodes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="PAID">Payes</option>
            <option value="PENDING">En attente</option>
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
