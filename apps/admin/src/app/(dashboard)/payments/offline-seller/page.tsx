'use client';

import { useState, useEffect } from 'react';
import { Store, Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface SellerPackagePayment {
  id: number;
  vendeur: string;
  boutique: string;
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

const defaultPayments: SellerPackagePayment[] = [
  { id: 1, vendeur: 'Alain Kamga', boutique: 'Tech Galaxy CM', email: 'alain.kamga@gmail.com', package: 'Business', duree: '12 mois', montant: 120000, methode: 'Virement', reference: 'VIR-SPK-001', dateDemande: '2026-06-10', dateExpiration: '2027-06-10', statut: 'APPROUVE' },
  { id: 2, vendeur: 'Brigitte Essama', boutique: 'Mode Africa', email: 'b.essama@yahoo.fr', package: 'Starter', duree: '6 mois', montant: 25000, methode: 'MTN MoMo', reference: 'MOMO-SPK-002', dateDemande: '2026-06-18', dateExpiration: null, statut: 'EN_ATTENTE' },
  { id: 3, vendeur: 'Serge Ndoumbe', boutique: 'Maison Serge', email: 's.ndoumbe@hotmail.com', package: 'Enterprise', duree: '12 mois', montant: 300000, methode: 'Virement', reference: 'VIR-SPK-003', dateDemande: '2026-06-19', dateExpiration: null, statut: 'EN_ATTENTE' },
  { id: 4, vendeur: 'Carine Djontu', boutique: 'Beaute Carine', email: 'c.djontu@gmail.com', package: 'Starter', duree: '3 mois', montant: 12000, methode: 'Orange Money', reference: 'OM-SPK-004', dateDemande: '2026-06-05', dateExpiration: '2026-09-05', statut: 'APPROUVE' },
  { id: 5, vendeur: 'Faustin Ngo', boutique: 'Faustin Electronics', email: 'f.ngo@gmail.com', package: 'Business', duree: '6 mois', montant: 65000, methode: 'Especes', reference: 'CASH-SPK-005', dateDemande: '2026-06-01', dateExpiration: '2026-12-01', statut: 'APPROUVE' },
  { id: 6, vendeur: 'Sylvie Biwole', boutique: 'Agro Sylvie', email: 's.biwole@yahoo.fr', package: 'Starter', duree: '1 mois', montant: 5000, methode: 'MTN MoMo', reference: 'MOMO-SPK-006', dateDemande: '2026-06-20', dateExpiration: null, statut: 'EN_ATTENTE' },
  { id: 7, vendeur: 'Patrice Manga', boutique: 'Sports Manga', email: 'p.manga@hotmail.com', package: 'Business', duree: '1 mois', montant: 12000, methode: 'Virement', reference: 'VIR-SPK-007-BAD', dateDemande: '2026-06-08', dateExpiration: null, statut: 'REJETE' },
];

const sellerPackages = [
  { nom: 'Starter', prix1m: 5000, prix3m: 12000, prix6m: 25000, prix12m: 45000, produits: 50, commission: '8%', support: 'Standard' },
  { nom: 'Business', prix1m: 12000, prix3m: 32000, prix6m: 65000, prix12m: 120000, produits: 500, commission: '5%', support: 'Prioritaire' },
  { nom: 'Enterprise', prix1m: 30000, prix3m: 80000, prix6m: 150000, prix12m: 300000, produits: 'Illimite', commission: '3%', support: 'Dedie 24/7' },
];

export default function OfflineSellerPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [payments, setPayments] = useState<SellerPackagePayment[]>([]);
  const [activeTab, setActiveTab] = useState<'demandes' | 'packages'>('demandes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: SellerPackagePayment[] }>('/settings/admin/admin_payments_offline_seller')
      .then(res => { if (res.data) setPayments(res.data); else setPayments(defaultPayments); })
      .catch(() => setPayments(defaultPayments))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch = p.vendeur.toLowerCase().includes(search.toLowerCase()) ||
      p.boutique.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || p.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const handleApprove = (id: number) => {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, statut: 'APPROUVE', dateExpiration: '2027-06-21' } : p));
  };

  const handleReject = (id: number) => {
    if (!confirm('Rejeter ce paiement ?')) return;
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, statut: 'REJETE' } : p));
  };

  const columns: Column<SellerPackagePayment>[] = [
    {
      name: 'Vendeur',
      key: 'vendeur',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.vendeur}</p>
          <p className="text-xs text-gray-3">{item.boutique}</p>
        </div>
      ),
    },
    {
      name: 'Package',
      key: 'package',
      render: (item) => (
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
            item.package === 'Enterprise' ? 'bg-yellow-100 text-yellow-700' :
            item.package === 'Business' ? 'bg-purple-100 text-purple-700' :
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
      name: 'Methode / Ref',
      key: 'methode',
      render: (item) => (
        <div>
          <p className="text-sm">{item.methode}</p>
          <p className="text-xs font-mono text-gray-3">{item.reference}</p>
        </div>
      ),
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
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir"><Eye className="w-4 h-4" /></button>
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
          <Store className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Paiements packages vendeur (offline)</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-6 rounded-xl p-1 w-fit">
        {(['demandes', 'packages'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-gray-2 hover:text-dark'}`}>
            {tab === 'demandes' ? 'Demandes de paiement' : 'Grille tarifaire'}
          </button>
        ))}
      </div>

      {activeTab === 'demandes' && (
        <>
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
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
                <input type="text" placeholder="Rechercher vendeur ou reference..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
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
          {sellerPackages.map((pkg) => (
            <div key={pkg.nom} className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
              pkg.nom === 'Enterprise' ? 'border-yellow-400' : pkg.nom === 'Business' ? 'border-purple-400' : 'border-blue-400'
            }`}>
              <div className="text-center mb-5">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${
                  pkg.nom === 'Enterprise' ? 'bg-yellow-100 text-yellow-700' :
                  pkg.nom === 'Business' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{pkg.nom}</span>
              </div>
              <div className="space-y-2 mb-5">
                {[['1 mois', formatPrice(pkg.prix1m)], ['3 mois', formatPrice(pkg.prix3m)], ['6 mois', formatPrice(pkg.prix6m)], ['12 mois', formatPrice(pkg.prix12m)]].map(([d, p]) => (
                  <div key={d} className="flex justify-between text-sm"><span className="text-gray-2">{d}</span><span className="font-semibold">{p}</span></div>
                ))}
              </div>
              <div className="border-t border-gray-5 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-2">Produits max</span><span className="font-semibold">{pkg.produits}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-2">Commission</span><span className="font-semibold text-primary">{pkg.commission}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-2">Support</span><span className="font-semibold">{pkg.support}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
