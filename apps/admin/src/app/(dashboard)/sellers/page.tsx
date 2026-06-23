'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Store, Loader2, Ban, ShieldCheck, Eye, MoreHorizontal, Plus } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Seller {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  status: string;
  banned: boolean;
  createdAt: string;
  shop?: { id: string; name: string; slug: string; verified: boolean; status: string };
}

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuves' },
  { key: 'SUSPENDED', label: 'Suspendus' },
];

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const fetchSellers = () => {
    setLoading(true);
    api.get<{ data: Seller[] }>('/users?perPage=500')
      .then((res) => setSellers(res.data.filter(u => u.role === 'SELLER')))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSellers(); }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return sellers;
    if (activeTab === 'PENDING') return sellers.filter(s => !s.shop || !s.shop.verified);
    if (activeTab === 'APPROVED') return sellers.filter(s => !s.banned && s.shop?.verified);
    if (activeTab === 'SUSPENDED') return sellers.filter(s => s.banned);
    return sellers;
  }, [sellers, activeTab]);

  const handleAction = async (action: string, seller: Seller) => {
    setActionLoading(seller.id);
    try {
      switch (action) {
        case 'verify':
          if (seller.shop) {
            await api.patch(`/shops/${seller.shop.id}/verify`);
            setSellers(prev => prev.map(s => s.id === seller.id
              ? { ...s, shop: s.shop ? { ...s.shop, verified: true } : s.shop }
              : s
            ));
          }
          break;
        case 'activate':
          if (seller.shop) {
            await api.patch(`/shops/${seller.shop.id}/status`, { status: 'ACTIVE' });
            setSellers(prev => prev.map(s => s.id === seller.id
              ? { ...s, shop: s.shop ? { ...s.shop, status: 'ACTIVE' } : s.shop }
              : s
            ));
          }
          break;
        case 'suspend':
          if (seller.shop) {
            await api.patch(`/shops/${seller.shop.id}/status`, { status: 'SUSPENDED' });
            setSellers(prev => prev.map(s => s.id === seller.id
              ? { ...s, shop: s.shop ? { ...s.shop, status: 'SUSPENDED' } : s.shop }
              : s
            ));
          }
          break;
        case 'ban':
          await api.patch(`/users/${seller.id}/ban`);
          setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, banned: true } : s));
          break;
        case 'unban':
          await api.patch(`/users/${seller.id}/unban`);
          setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, banned: false } : s));
          break;
      }
    } catch (e) {
      console.error('Action failed:', e);
    }
    setActionLoading(null);
  };

  const columns: Column<Seller>[] = [
    {
      key: 'avatar', name: '',
      render: (s) => (
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
          {s.firstName?.[0]}{s.lastName?.[0]}
        </div>
      ),
    },
    { key: 'nom', name: 'Nom', render: (s) => <span className="font-medium">{s.firstName} {s.lastName}</span> },
    { key: 'email', name: 'Email', render: (s) => <span className="text-sm">{s.email}</span> },
    {
      key: 'boutique', name: 'Boutique',
      render: (s) => s.shop
        ? <span className="text-primary font-medium">{s.shop.name}</span>
        : <span className="text-gray-3 text-xs italic">Pas de boutique</span>,
    },
    {
      key: 'verified', name: 'Verifie',
      render: (s) => s.shop?.verified
        ? <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">Oui</span>
        : <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">Non</span>,
    },
    {
      key: 'shopStatus', name: 'Boutique Status',
      render: (s) => s.shop
        ? <StatusBadge status={s.shop.status} />
        : <span className="text-xs text-gray-3">-</span>,
    },
    {
      key: 'statut', name: 'Compte',
      render: (s) => s.banned
        ? <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">Banni</span>
        : <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">Actif</span>,
    },
    { key: 'date', name: 'Inscription', render: (s) => formatDate(s.createdAt) },
    {
      key: 'actions', name: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-1">
          {actionLoading === s.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-3" />
          ) : (
            <>
              {/* Verify shop */}
              {s.shop && !s.shop.verified && (
                <button
                  onClick={() => handleAction('verify', s)}
                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                  title="Verifier la boutique"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              {/* Activate shop */}
              {s.shop && s.shop.status !== 'ACTIVE' && (
                <button
                  onClick={() => handleAction('activate', s)}
                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                  title="Activer la boutique"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {/* Suspend shop */}
              {s.shop && s.shop.status === 'ACTIVE' && (
                <button
                  onClick={() => handleAction('suspend', s)}
                  className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600"
                  title="Suspendre la boutique"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {/* Ban / Unban user */}
              {s.banned ? (
                <button
                  onClick={() => handleAction('unban', s)}
                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                  title="Debannir le vendeur"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleAction('ban', s)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                  title="Bannir le vendeur"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              {/* Detail */}
              <button
                onClick={() => setSelectedSeller(s)}
                className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-2"
                title="Voir le detail"
              >
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Vendeurs ({sellers.length})</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-3">Total vendeurs</p>
          <p className="text-2xl font-bold text-dark">{sellers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-3">Avec boutique</p>
          <p className="text-2xl font-bold text-primary">{sellers.filter(s => s.shop).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-3">Boutiques verifiees</p>
          <p className="text-2xl font-bold text-green-600">{sellers.filter(s => s.shop?.verified).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-3">Bannis</p>
          <p className="text-2xl font-bold text-red-600">{sellers.filter(s => s.banned).length}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-5">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-2 hover:text-dark'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} />
      </div>

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedSeller(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-dark mb-4">Detail vendeur</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-3">Nom</span><span className="font-medium">{selectedSeller.firstName} {selectedSeller.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Email</span><span>{selectedSeller.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Telephone</span><span>{selectedSeller.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Inscription</span><span>{formatDate(selectedSeller.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Compte</span><span>{selectedSeller.banned ? 'Banni' : 'Actif'}</span></div>
              <hr />
              <p className="font-medium text-dark">Boutique</p>
              {selectedSeller.shop ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-3">Nom</span><span className="font-medium">{selectedSeller.shop.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-3">Slug</span><span>{selectedSeller.shop.slug}</span></div>
                  <div className="flex justify-between"><span className="text-gray-3">Statut</span><StatusBadge status={selectedSeller.shop.status} /></div>
                  <div className="flex justify-between"><span className="text-gray-3">Verifiee</span><span>{selectedSeller.shop.verified ? 'Oui' : 'Non'}</span></div>
                </>
              ) : (
                <p className="text-gray-3 italic">Ce vendeur n&apos;a pas encore de boutique</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {selectedSeller.shop && !selectedSeller.shop.verified && (
                <button
                  onClick={() => { handleAction('verify', selectedSeller); setSelectedSeller({ ...selectedSeller, shop: { ...selectedSeller.shop!, verified: true } }); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Verifier la boutique
                </button>
              )}
              <button onClick={() => setSelectedSeller(null)} className="px-4 py-2 bg-gray-6 text-dark rounded-lg text-sm font-medium hover:bg-gray-5">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
