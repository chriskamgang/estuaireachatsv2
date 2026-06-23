'use client';

import { useState, useEffect } from 'react';
import { Gift, Search, Eye, Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface CustomerPackage {
  id: number;
  nom: string;
  description: string;
  prix1m: number;
  prix3m: number;
  prix6m: number;
  prix12m: number;
  remise: number;
  livraison: string;
  support: string;
  pointsBonus: number;
  actif: boolean;
  abonnes: number;
}

interface Subscription {
  id: number;
  client: string;
  email: string;
  package: string;
  duree: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  renouvellement: boolean;
}

const defaultPackages: CustomerPackage[] = [
  { id: 1, nom: 'Bronze', description: 'Pour decouvrir la plateforme', prix1m: 1000, prix3m: 2500, prix6m: 4500, prix12m: 8000, remise: 5, livraison: 'Standard', support: 'Email', pointsBonus: 100, actif: true, abonnes: 234 },
  { id: 2, nom: 'Silver', description: 'Pour les acheteurs reguliers', prix1m: 2000, prix3m: 5500, prix6m: 10000, prix12m: 18000, remise: 10, livraison: 'Prioritaire', support: 'Email + Chat', pointsBonus: 250, actif: true, abonnes: 156 },
  { id: 3, nom: 'Gold', description: 'Pour les acheteurs assidus', prix1m: 3500, prix3m: 9000, prix6m: 16000, prix12m: 28000, remise: 15, livraison: 'Express', support: 'Prioritaire', pointsBonus: 500, actif: true, abonnes: 89 },
  { id: 4, nom: 'Platinum', description: 'L\'experience d\'achat ultime', prix1m: 6000, prix3m: 16000, prix6m: 30000, prix12m: 55000, remise: 20, livraison: 'Gratuite', support: '24/7 dedie', pointsBonus: 1000, actif: true, abonnes: 23 },
];

const defaultSubscriptions: Subscription[] = [
  { id: 1, client: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', package: 'Gold', duree: '12 mois', montant: 28000, dateDebut: '2026-01-15', dateFin: '2027-01-15', statut: 'ACTIF', renouvellement: true },
  { id: 2, client: 'Sophie Ngo', email: 'sophie.ngo@yahoo.fr', package: 'Silver', duree: '6 mois', montant: 10000, dateDebut: '2026-03-01', dateFin: '2026-09-01', statut: 'ACTIF', renouvellement: false },
  { id: 3, client: 'Paul Atangana', email: 'p.atangana@hotmail.com', package: 'Platinum', duree: '12 mois', montant: 55000, dateDebut: '2026-02-10', dateFin: '2027-02-10', statut: 'ACTIF', renouvellement: true },
  { id: 4, client: 'Marie Fouda', email: 'marie.fouda@gmail.com', package: 'Bronze', duree: '3 mois', montant: 2500, dateDebut: '2026-04-01', dateFin: '2026-07-01', statut: 'EXPIRE', renouvellement: false },
  { id: 5, client: 'Eric Bella', email: 'eric.bella@gmail.com', package: 'Gold', duree: '6 mois', montant: 16000, dateDebut: '2026-05-15', dateFin: '2026-11-15', statut: 'ACTIF', renouvellement: true },
];

export default function CustomerPackagesPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'abonnes'>('packages');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Partial<CustomerPackage> | null>(null);
  const [packages, setPackages] = useState<CustomerPackage[]>(defaultPackages);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(defaultSubscriptions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { packages: CustomerPackage[]; subscriptions: Subscription[] } }>('/settings/admin/admin_customers_packages')
      .then(res => {
        if (res.data?.packages) setPackages(res.data.packages);
        if (res.data?.subscriptions) setSubscriptions(res.data.subscriptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredSubs = subscriptions.filter((s) =>
    s.client.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer ce package ?')) return;
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = (id: number) => {
    setPackages((prev) => prev.map((p) => p.id === id ? { ...p, actif: !p.actif } : p));
  };

  const subColumns: Column<Subscription>[] = [
    { name: 'Client', key: 'client', render: (s) => (<div><p className="font-medium text-dark">{s.client}</p><p className="text-xs text-gray-3">{s.email}</p></div>) },
    { name: 'Package', key: 'package', render: (s) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        s.package === 'Platinum' ? 'bg-purple-100 text-purple-700' :
        s.package === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
        s.package === 'Silver' ? 'bg-gray-100 text-gray-600' :
        'bg-amber-50 text-amber-700'
      }`}>{s.package}</span>
    )},
    { name: 'Duree', key: 'duree', render: (s) => <span className="text-sm">{s.duree}</span> },
    { name: 'Montant', key: 'montant', render: (s) => <span className="font-semibold text-primary">{formatPrice(s.montant)}</span> },
    { name: 'Debut', key: 'dateDebut', render: (s) => <span className="text-sm">{formatDate(s.dateDebut)}</span> },
    { name: 'Expiration', key: 'dateFin', render: (s) => <span className="text-sm">{formatDate(s.dateFin)}</span> },
    { name: 'Renouvellement auto', key: 'renouvellement', render: (s) => <span className={`text-xs font-medium ${s.renouvellement ? 'text-green-600' : 'text-gray-3'}`}>{s.renouvellement ? 'Oui' : 'Non'}</span> },
    { name: 'Statut', key: 'statut', render: (s) => <StatusBadge status={s.statut} /> },
    { name: 'Actions', key: 'actions', render: () => <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button> },
  ];

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

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
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Packages clients</h1>
        </div>
        {activeTab === 'packages' && (
          <button onClick={() => { setEditingPkg({ nom: '', description: '', prix1m: 0, prix3m: 0, prix6m: 0, prix12m: 0, remise: 0, livraison: 'Standard', support: 'Email', pointsBonus: 0, actif: true, abonnes: 0 }); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Nouveau package
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Packages actifs', value: packages.filter(p => p.actif).length },
          { label: 'Total abonnes', value: packages.reduce((s, p) => s + p.abonnes, 0) },
          { label: 'Abonnes actifs', value: subscriptions.filter(s => s.statut === 'ACTIF').length },
          { label: 'Revenus packages', value: formatPrice(subscriptions.filter(s => s.statut === 'ACTIF').reduce((s, sub) => s + sub.montant, 0)) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-6 rounded-xl p-1 w-fit">
        {(['packages', 'abonnes'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-gray-2 hover:text-dark'}`}>
            {tab === 'packages' ? 'Gestion des packages' : 'Abonnes'}
          </button>
        ))}
      </div>

      {activeTab === 'packages' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`bg-white rounded-xl shadow-sm p-5 border-2 ${pkg.actif ? 'border-primary/30' : 'border-gray-4 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-dark">{pkg.nom}</h3>
                <button onClick={() => toggleActive(pkg.id)} className={`relative w-10 h-5 rounded-full transition ${pkg.actif ? 'bg-primary' : 'bg-gray-4'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pkg.actif ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-gray-3 mb-4">{pkg.description}</p>
              <div className="space-y-1 mb-4">
                {[['1 mois', pkg.prix1m], ['3 mois', pkg.prix3m], ['6 mois', pkg.prix6m], ['12 mois', pkg.prix12m]].map(([d, p]) => (
                  <div key={String(d)} className="flex justify-between text-xs">
                    <span className="text-gray-2">{d}</span>
                    <span className="font-semibold">{formatPrice(Number(p))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-5 pt-3 space-y-1 mb-4">
                <div className="flex justify-between text-xs"><span className="text-gray-2">Remise</span><span className="font-semibold text-green-600">{pkg.remise}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-2">Livraison</span><span>{pkg.livraison}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-2">Points bonus</span><span className="text-primary font-semibold">+{pkg.pointsBonus}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-2">Abonnes</span><span className="font-bold">{pkg.abonnes}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingPkg({ ...pkg }); setShowModal(true); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-5 rounded-lg hover:bg-gray-6 transition text-gray-2">
                  <Pencil className="w-3 h-3" /> Modifier
                </button>
                <button onClick={() => handleDelete(pkg.id)} className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-danger transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'abonnes' && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
              <input type="text" placeholder="Rechercher un abonne..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm">
            <DataTable columns={subColumns} data={filteredSubs} pagination={{ page: 1, perPage: 10, total: filteredSubs.length }} />
          </div>
        </>
      )}

      {/* Modal edition package */}
      {showModal && editingPkg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-dark">{editingPkg.id ? 'Modifier le package' : 'Nouveau package'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom du package</label>
                <input type="text" value={editingPkg.nom || ''} onChange={(e) => setEditingPkg({ ...editingPkg, nom: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input type="text" value={editingPkg.description || ''} onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Prix 1 mois', 'prix1m'], ['Prix 3 mois', 'prix3m'], ['Prix 6 mois', 'prix6m'], ['Prix 12 mois', 'prix12m']].map(([label, field]) => (
                  <div key={field}>
                    <label className={labelClass}>{label} (FCFA)</label>
                    <input type="number" min={0} value={(editingPkg as Record<string, unknown>)[field] as number || 0}
                      onChange={(e) => setEditingPkg({ ...editingPkg, [field]: Number(e.target.value) })} className={inputClass} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Remise (%)</label>
                  <input type="number" min={0} max={100} value={editingPkg.remise || 0} onChange={(e) => setEditingPkg({ ...editingPkg, remise: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Points bonus</label>
                  <input type="number" min={0} value={editingPkg.pointsBonus || 0} onChange={(e) => setEditingPkg({ ...editingPkg, pointsBonus: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Livraison</label>
                  <select value={editingPkg.livraison || 'Standard'} onChange={(e) => setEditingPkg({ ...editingPkg, livraison: e.target.value })} className={inputClass}>
                    <option>Standard</option>
                    <option>Prioritaire</option>
                    <option>Express</option>
                    <option>Gratuite</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-5 text-gray-2 rounded-lg text-sm hover:bg-gray-6 transition">Annuler</button>
              <button
                onClick={() => {
                  if (editingPkg.id) {
                    setPackages((prev) => prev.map((p) => p.id === editingPkg.id ? { ...editingPkg } as CustomerPackage : p));
                  } else {
                    setPackages((prev) => [...prev, { ...editingPkg, id: Date.now() } as CustomerPackage]);
                  }
                  setShowModal(false);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
