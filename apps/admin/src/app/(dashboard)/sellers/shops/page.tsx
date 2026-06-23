'use client';

import { useState, useEffect } from 'react';
import { Store, Plus, Eye, Star, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Shop {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  verified: boolean;
  status: string;
  rating: number;
  totalSales: number;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { products: number; followers: number };
}

function CreateShopModal({ onClose, onCreated }: { onClose: () => void; onCreated: (shop: Shop) => void }) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', phone: '', email: '', address: '', city: '',
    sellerEmail: '', sellerFirstName: '', sellerLastName: '', sellerPhone: '', sellerPassword: '',
    userId: '',
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));
  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Le nom de la boutique est requis'); return; }
    if (mode === 'new' && (!form.sellerEmail || !form.sellerFirstName || !form.sellerLastName)) {
      setError('Email, prenom et nom du vendeur sont requis'); return;
    }
    if (mode === 'existing' && !form.userId.trim()) {
      setError('L\'ID du vendeur est requis'); return;
    }

    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
      };

      if (mode === 'new') {
        payload.sellerEmail = form.sellerEmail;
        payload.sellerFirstName = form.sellerFirstName;
        payload.sellerLastName = form.sellerLastName;
        payload.sellerPhone = form.sellerPhone || undefined;
        payload.sellerPassword = form.sellerPassword || undefined;
      } else {
        payload.userId = form.userId;
      }

      const res = await api.post<{ data: Shop }>('/shops/admin/create', payload);
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-dark">Creer une boutique</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && <div className="bg-danger/10 text-danger text-sm px-4 py-2 rounded-lg">{error}</div>}

          {/* Shop info */}
          <div>
            <h3 className="text-sm font-semibold text-dark mb-3">Informations boutique</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-2 mb-1">Nom de la boutique *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="Ex: TechStore Douala" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-2 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className={inputClass} rows={2} placeholder="Description de la boutique..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Telephone boutique</label>
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="+237 6XX XXX XXX" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Email boutique</label>
                <input value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="contact@boutique.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Ville</label>
                <input value={form.city} onChange={(e) => update('city', e.target.value)} className={inputClass} placeholder="Douala" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Adresse</label>
                <input value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} placeholder="Akwa, Rue..." />
              </div>
            </div>
          </div>

          {/* Seller mode toggle */}
          <div>
            <h3 className="text-sm font-semibold text-dark mb-3">Vendeur</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMode('new')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === 'new' ? 'bg-primary text-white' : 'bg-gray-6 text-gray-2'}`}>
                Nouveau vendeur
              </button>
              <button onClick={() => setMode('existing')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === 'existing' ? 'bg-primary text-white' : 'bg-gray-6 text-gray-2'}`}>
                Vendeur existant
              </button>
            </div>

            {mode === 'new' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-2 mb-1">Prenom *</label>
                  <input value={form.sellerFirstName} onChange={(e) => update('sellerFirstName', e.target.value)} className={inputClass} placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-2 mb-1">Nom *</label>
                  <input value={form.sellerLastName} onChange={(e) => update('sellerLastName', e.target.value)} className={inputClass} placeholder="Dupont" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-2 mb-1">Email *</label>
                  <input value={form.sellerEmail} onChange={(e) => update('sellerEmail', e.target.value)} className={inputClass} placeholder="vendeur@email.com" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-2 mb-1">Telephone</label>
                  <input value={form.sellerPhone} onChange={(e) => update('sellerPhone', e.target.value)} className={inputClass} placeholder="+237 6XX XXX XXX" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-2 mb-1">Mot de passe (defaut: password123)</label>
                  <input value={form.sellerPassword} onChange={(e) => update('sellerPassword', e.target.value)} className={inputClass} placeholder="Laisser vide pour le mot de passe par defaut" type="password" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">ID utilisateur existant *</label>
                <input value={form.userId} onChange={(e) => update('userId', e.target.value)} className={inputClass} placeholder="ID de l'utilisateur (ex: clxx...)" />
                <p className="text-xs text-gray-3 mt-1">L&apos;utilisateur sera automatiquement passe en role SELLER</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">Annuler</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creation...' : 'Creer la boutique'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopDetailModal({ shop, onClose, onAction }: { shop: Shop; onClose: () => void; onAction: (id: string, action: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">{shop.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-3">Proprietaire</p><p className="text-sm font-medium text-dark">{shop.user?.firstName} {shop.user?.lastName}</p></div>
            <div><p className="text-xs text-gray-3">Email</p><p className="text-sm font-medium text-dark">{shop.user?.email || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Telephone</p><p className="text-sm font-medium text-dark">{shop.phone || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Ville</p><p className="text-sm font-medium text-dark">{shop.city || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Adresse</p><p className="text-sm font-medium text-dark">{shop.address || '-'}</p></div>
            <div><p className="text-xs text-gray-3">Slug</p><p className="text-sm font-medium text-primary">{shop.slug}</p></div>
            <div><p className="text-xs text-gray-3">Produits</p><p className="text-sm font-bold text-dark">{shop._count?.products || 0}</p></div>
            <div><p className="text-xs text-gray-3">Abonnes</p><p className="text-sm font-bold text-dark">{shop._count?.followers || 0}</p></div>
            <div><p className="text-xs text-gray-3">Ventes</p><p className="text-sm font-bold text-dark">{shop.totalSales || 0}</p></div>
            <div><p className="text-xs text-gray-3">Note</p><p className="text-sm font-bold text-dark">{shop.rating > 0 ? shop.rating.toFixed(1) : '-'}</p></div>
          </div>
          <div className="flex gap-2 pt-2">
            <StatusBadge status={shop.status} />
            {shop.verified && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">Verifie</span>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-5 flex flex-wrap gap-2">
          {shop.status === 'PENDING' && (
            <button onClick={() => { onAction(shop.id, 'approve'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-success text-white rounded-lg hover:bg-success/90 transition">
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
          )}
          {shop.status === 'PENDING' && (
            <button onClick={() => { onAction(shop.id, 'reject'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border border-danger text-danger rounded-lg hover:bg-danger/5 transition">
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
          )}
          {!shop.verified && shop.status === 'ACTIVE' && (
            <button onClick={() => { onAction(shop.id, 'verify'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              <CheckCircle className="w-4 h-4" /> Verifier
            </button>
          )}
          {shop.status === 'ACTIVE' && (
            <button onClick={() => { onAction(shop.id, 'suspend'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border border-danger text-danger rounded-lg hover:bg-danger/5 transition">
              <XCircle className="w-4 h-4" /> Suspendre
            </button>
          )}
          {shop.status === 'SUSPENDED' && (
            <button onClick={() => { onAction(shop.id, 'activate'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-success text-white rounded-lg hover:bg-success/90 transition">
              <CheckCircle className="w-4 h-4" /> Reactiver
            </button>
          )}
          <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition mt-1">Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Shop | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<{ data: Shop[] }>('/shops/admin/list')
      .then((res) => setShops(res.data || []))
      .catch(() => {
        // Fallback to public endpoint
        api.get<{ data: Shop[] }>('/shops')
          .then((res) => setShops(res.data || []))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'verify') {
        await api.patch(`/shops/${id}/verify`);
        setShops((prev) => prev.map((s) => s.id === id ? { ...s, verified: true } : s));
      } else if (action === 'approve') {
        await api.patch(`/shops/${id}/status`, { status: 'ACTIVE' });
        setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: 'ACTIVE' } : s));
      } else if (action === 'reject') {
        await api.patch(`/shops/${id}/status`, { status: 'REJECTED' });
        setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: 'REJECTED' } : s));
      } else if (action === 'suspend') {
        await api.patch(`/shops/${id}/status`, { status: 'SUSPENDED' });
        setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: 'SUSPENDED' } : s));
      } else if (action === 'activate') {
        await api.patch(`/shops/${id}/status`, { status: 'ACTIVE' });
        setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: 'ACTIVE' } : s));
      }
    } catch {}
  };

  const filtered = search
    ? shops.filter((s) => {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q);
      })
    : shops;

  const columns: Column<Shop>[] = [
    {
      key: 'logo', name: 'Logo',
      render: (s) => s.logo
        ? <img src={s.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
        : <div className="w-9 h-9 rounded-lg bg-gray-6 flex items-center justify-center text-gray-3"><Store className="w-4 h-4" /></div>,
    },
    { key: 'name', name: 'Boutique', render: (s) => (
      <div>
        <p className="font-medium text-dark">{s.name}</p>
        <p className="text-xs text-gray-3">{s.city || s.slug}</p>
      </div>
    )},
    { key: 'owner', name: 'Proprietaire', render: (s) => (
      <div>
        <p className="text-sm text-dark">{s.user ? `${s.user.firstName} ${s.user.lastName}` : '-'}</p>
        <p className="text-xs text-gray-3">{s.user?.email}</p>
      </div>
    )},
    { key: 'products', name: 'Produits', render: (s) => <span className="font-medium">{s._count?.products || 0}</span> },
    {
      key: 'rating', name: 'Note',
      render: (s) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
          <span className="font-medium">{s.rating > 0 ? s.rating.toFixed(1) : '-'}</span>
        </div>
      ),
    },
    {
      key: 'verified', name: 'Verifie',
      render: (s) => s.verified
        ? <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">Oui</span>
        : <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">Non</span>,
    },
    { key: 'status', name: 'Statut', render: (s) => <StatusBadge status={s.status || 'ACTIVE'} /> },
    { key: 'date', name: 'Creation', render: (s) => <span className="text-xs text-gray-3">{formatDate(s.createdAt)}</span> },
    {
      key: 'actions', name: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelected(s)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Details">
            <Eye className="w-4 h-4" />
          </button>
          {s.status === 'PENDING' && (
            <button onClick={() => handleAction(s.id, 'approve')} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition" title="Approuver">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {s.status === 'PENDING' && (
            <button onClick={() => handleAction(s.id, 'reject')} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Rejeter">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {!s.verified && s.status === 'ACTIVE' && (
            <button onClick={() => handleAction(s.id, 'verify')} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Verifier">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {s.status === 'ACTIVE' && (
            <button onClick={() => handleAction(s.id, 'suspend')} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Suspendre">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {s.status === 'SUSPENDED' && (
            <button onClick={() => handleAction(s.id, 'activate')} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition" title="Reactiver">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {showCreate && <CreateShopModal onClose={() => setShowCreate(false)} onCreated={(shop) => setShops((prev) => [shop, ...prev])} />}
      {selected && <ShopDetailModal shop={selected} onClose={() => setSelected(null)} onAction={handleAction} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Boutiques</h1>
            <p className="text-sm text-gray-3">{shops.length} boutique(s) enregistree(s)</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Creer une boutique
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Total</p>
          <p className="text-2xl font-bold text-dark">{shops.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Actives</p>
          <p className="text-2xl font-bold text-success">{shops.filter((s) => s.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">En attente</p>
          <p className="text-2xl font-bold text-warning">{shops.filter((s) => s.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Suspendues</p>
          <p className="text-2xl font-bold text-danger">{shops.filter((s) => s.status === 'SUSPENDED').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[280px]"
          placeholder="Rechercher par nom, email ou ville..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 15, total: filtered.length }} />
      </div>
    </div>
  );
}
