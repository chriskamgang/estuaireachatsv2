'use client';

import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface CustomerPackagePayment {
  id: number;
  client: string;
  email: string;
  package: string;
  duree: string;
  montant: number;
  methode: string;
  reference: string;
  dateDemande: string;
  dateExpiration: string | null;
  statut: string;
}

const defaultPayments: CustomerPackagePayment[] = [
  { id: 1, client: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', package: 'Premium', duree: '12 mois', montant: 25000, methode: 'Virement', reference: 'VIR-CPK-001', dateDemande: '2026-06-15', dateExpiration: '2027-06-15', statut: 'APPROUVE' },
  { id: 2, client: 'Sophie Ngo', email: 'sophie.ngo@yahoo.fr', package: 'Standard', duree: '6 mois', montant: 10000, methode: 'MTN MoMo', reference: 'MOMO-CPK-002', dateDemande: '2026-06-18', dateExpiration: null, statut: 'EN_ATTENTE' },
  { id: 3, client: 'Paul Atangana', email: 'p.atangana@hotmail.com', package: 'VIP', duree: '12 mois', montant: 50000, methode: 'Orange Money', reference: 'OM-CPK-003', dateDemande: '2026-06-19', dateExpiration: null, statut: 'EN_ATTENTE' },
  { id: 4, client: 'Marie Fouda', email: 'marie.fouda@gmail.com', package: 'Premium', duree: '1 mois', montant: 3000, methode: 'Especes', reference: 'CASH-CPK-004', dateDemande: '2026-06-10', dateExpiration: '2026-07-10', statut: 'APPROUVE' },
  { id: 5, client: 'Eric Bella', email: 'eric.bella@gmail.com', package: 'VIP', duree: '6 mois', montant: 28000, methode: 'Virement', reference: 'VIR-CPK-005', dateDemande: '2026-06-12', dateExpiration: null, statut: 'REJETE' },
  { id: 6, client: 'Christine Owona', email: 'c.owona@yahoo.fr', package: 'Standard', duree: '3 mois', montant: 6000, methode: 'MTN MoMo', reference: 'MOMO-CPK-006', dateDemande: '2026-06-20', dateExpiration: null, statut: 'EN_ATTENTE' },
];

const packages = [
  { nom: 'Standard', prix1m: 2000, prix3m: 5000, prix6m: 9000, prix12m: 16000, avantages: ['Acces acheteur', '5% remise fidele', 'Support standard'] },
  { nom: 'Premium', prix1m: 3000, prix3m: 8000, prix6m: 15000, prix12m: 25000, avantages: ['Tout Standard', '10% remise fidele', 'Livraison prioritaire', 'Support premium'] },
  { nom: 'VIP', prix1m: 6000, prix3m: 15000, prix6m: 28000, prix12m: 50000, avantages: ['Tout Premium', '15% remise fidele', 'Livraison gratuite', 'Manager dedie', 'Accès exclusif ventes'] },
];

export default function OfflineCustomerPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [payments, setPayments] = useState<CustomerPackagePayment[]>([]);
  const [activeTab, setActiveTab] = useState<'demandes' | 'packages'>('demandes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: CustomerPackagePayment[] }>('/settings/admin/admin_payments_offline_customer')
      .then(res => { if (res.data) setPayments(res.data); else setPayments(defaultPayments); })
      .catch(() => setPayments(defaultPayments))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch = p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || p.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleApprove = (id: number) => {
    setPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, statut: 'APPROUVE', dateExpiration: '2027-06-21' } : p)
    );
  };

  const handleReject = (id: number) => {
    if (!confirm('Rejeter ce paiement ?')) return;
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, statut: 'REJETE' } : p));
  };

  const columns: Column<CustomerPackagePayment>[] = [
    {
      name: 'Client',
      key: 'client',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.client}</p>
          <p className="text-xs text-gray-3">{item.email}</p>
        </div>
      ),
    },
    {
      name: 'Package',
      key: 'package',
      render: (item) => (
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
            item.package === 'VIP' ? 'bg-yellow-100 text-yellow-700' :
            item.package === 'Premium' ? 'bg-purple-100 text-purple-700' :
            'bg-blue-100 text-blue-700'
          }`}>{item.package}</span>
          <p className="text-xs text-gray-3 mt-0.5">{item.duree}</p>
        </div>
      ),
    },
    {
      name: 'Montant',
      key: 'montant',
      render: (item) => <span className="font-bold text-primary">{formatPrice(item.montant)}</span>,
    },
    {
      name: 'Methode',
      key: 'methode',
      render: (item) => <span className="text-sm">{item.methode}</span>,
    },
    {
      name: 'Reference',
      key: 'reference',
      render: (item) => <span className="font-mono text-xs text-gray-2">{item.reference}</span>,
    },
    {
      name: 'Date demande',
      key: 'dateDemande',
      render: (item) => <span className="text-sm">{formatDate(item.dateDemande)}</span>,
    },
    {
      name: 'Expiration',
      key: 'dateExpiration',
      render: (item) => <span className="text-sm">{item.dateExpiration ? formatDate(item.dateExpiration) : '-'}</span>,
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
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition" title="Rejeter">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir">
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
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Paiements packages client (offline)</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-6 rounded-xl p-1 w-fit">
        {(['demandes', 'packages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-gray-2 hover:text-dark'}`}
          >
            {tab === 'demandes' ? 'Demandes de paiement' : 'Grille tarifaire'}
          </button>
        ))}
      </div>

      {activeTab === 'demandes' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total demandes', value: payments.length },
              { label: 'En attente', value: payments.filter(p => p.statut === 'EN_ATTENTE').length },
              { label: 'Approuves', value: payments.filter(p => p.statut === 'APPROUVE').length },
              { label: 'Revenus', value: formatPrice(payments.filter(p => p.statut === 'APPROUVE').reduce((s, p) => s + p.montant, 0)) },
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
                  placeholder="Rechercher client ou reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="APPROUVE">Approuve</option>
                <option value="REJETE">Rejete</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
          </div>
        </>
      )}

      {activeTab === 'packages' && (
        <div className="grid grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.nom} className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
              pkg.nom === 'VIP' ? 'border-yellow-400' : pkg.nom === 'Premium' ? 'border-purple-400' : 'border-blue-400'
            }`}>
              <div className="text-center mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${
                  pkg.nom === 'VIP' ? 'bg-yellow-100 text-yellow-700' :
                  pkg.nom === 'Premium' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{pkg.nom}</span>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-2">1 mois</span>
                  <span className="font-semibold">{formatPrice(pkg.prix1m)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-2">3 mois</span>
                  <span className="font-semibold">{formatPrice(pkg.prix3m)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-2">6 mois</span>
                  <span className="font-semibold">{formatPrice(pkg.prix6m)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-5 pt-2">
                  <span className="text-gray-2">12 mois</span>
                  <span className="font-bold text-primary">{formatPrice(pkg.prix12m)}</span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {pkg.avantages.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-gray-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
