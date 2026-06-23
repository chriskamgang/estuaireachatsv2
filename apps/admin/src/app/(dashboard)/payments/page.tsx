'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, Filter, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Payment {
  id: number;
  reference: string;
  commande: string;
  client: string;
  montant: number;
  methode: string;
  statut: string;
  date: string;
}

const defaultPayments: Payment[] = [
  { id: 1, reference: 'PAY-20260615-001', commande: 'CMD-4521', client: 'Jean Mbarga', montant: 125000, methode: 'MTN MoMo', statut: 'PAID', date: '2026-06-15' },
  { id: 2, reference: 'PAY-20260615-002', commande: 'CMD-4522', client: 'Marie Ngo', montant: 45000, methode: 'Orange Money', statut: 'PAID', date: '2026-06-15' },
  { id: 3, reference: 'PAY-20260614-003', commande: 'CMD-4518', client: 'Paul Atangana', montant: 230000, methode: 'KPay', statut: 'PENDING', date: '2026-06-14' },
  { id: 4, reference: 'PAY-20260614-004', commande: 'CMD-4517', client: 'Sophie Ekane', montant: 78000, methode: 'GFS', statut: 'FAILED', date: '2026-06-14' },
  { id: 5, reference: 'PAY-20260613-005', commande: 'CMD-4510', client: 'Albert Fouda', montant: 560000, methode: 'PayPal', statut: 'PAID', date: '2026-06-13' },
  { id: 6, reference: 'PAY-20260613-006', commande: 'CMD-4509', client: 'Francoise Bella', montant: 32000, methode: 'COD', statut: 'PENDING', date: '2026-06-13' },
  { id: 7, reference: 'PAY-20260612-007', commande: 'CMD-4502', client: 'Eric Njoh', montant: 185000, methode: 'MTN MoMo', statut: 'PAID', date: '2026-06-12' },
  { id: 8, reference: 'PAY-20260612-008', commande: 'CMD-4501', client: 'Christine Owona', montant: 95000, methode: 'Orange Money', statut: 'PAID', date: '2026-06-12' },
  { id: 9, reference: 'PAY-20260611-009', commande: 'CMD-4498', client: 'David Eyinga', montant: 12000, methode: 'KPay', statut: 'FAILED', date: '2026-06-11' },
  { id: 10, reference: 'PAY-20260611-010', commande: 'CMD-4495', client: 'Lucie Mba', montant: 410000, methode: 'GFS', statut: 'PAID', date: '2026-06-11' },
];

const methodes = ['Tous', 'MTN MoMo', 'Orange Money', 'KPay', 'GFS', 'PayPal', 'COD'];
const statuts = ['Tous', 'PAID', 'PENDING', 'FAILED'];

export default function PaymentsPage() {
  const [methodeFilter, setMethodeFilter] = useState('Tous');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [payments, setPayments] = useState<Payment[]>(defaultPayments);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Payment[] }>('/settings/admin/admin_payments_history')
      .then(res => { if (res.data) setPayments(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    if (methodeFilter !== 'Tous' && p.methode !== methodeFilter) return false;
    if (statutFilter !== 'Tous' && p.statut !== statutFilter) return false;
    if (dateDebut && p.date < dateDebut) return false;
    if (dateFin && p.date > dateFin) return false;
    return true;
  });

  const totalMontant = payments.reduce((s, p) => s + p.montant, 0);
  const reussis = payments.filter((p) => p.statut === 'PAID');
  const enAttente = payments.filter((p) => p.statut === 'PENDING');
  const echoues = payments.filter((p) => p.statut === 'FAILED');

  const columns: Column<Payment>[] = [
    { name: 'Reference', key: 'reference', render: (item) => <span className="font-mono text-xs text-dark">{item.reference}</span> },
    { name: 'Commande', key: 'commande', render: (item) => <span className="font-medium text-primary">{item.commande}</span> },
    { name: 'Client', key: 'client' },
    { name: 'Montant', key: 'montant', render: (item) => <span className="font-semibold">{formatPrice(item.montant)}</span> },
    { name: 'Methode', key: 'methode', render: (item) => <span className="text-sm">{item.methode}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
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
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Historique des paiements</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total paiements" value={formatPrice(totalMontant)} icon={CreditCard} gradient="linear-gradient(135deg, #3390f3, #1a6dd4)" />
        <StatCard title="Reussis" value={`${reussis.length} (${formatPrice(reussis.reduce((s, p) => s + p.montant, 0))})`} icon={CheckCircle} gradient="linear-gradient(135deg, #00A06A, #008555)" />
        <StatCard title="En attente" value={`${enAttente.length} (${formatPrice(enAttente.reduce((s, p) => s + p.montant, 0))})`} icon={Clock} gradient="linear-gradient(135deg, #F5A623, #D4880A)" />
        <StatCard title="Echoues" value={`${echoues.length} (${formatPrice(echoues.reduce((s, p) => s + p.montant, 0))})`} icon={XCircle} gradient="linear-gradient(135deg, #E82328, #c41a1f)" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            <span className="text-gray-3 text-sm">a</span>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <select value={methodeFilter} onChange={(e) => setMethodeFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {methodes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
