'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Gift, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface SellerPackage {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
  duration: number;
  description: string;
  _count?: { subscriptions: number };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<SellerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, maxProducts: 0, duration: 30, description: '' });
  const [saving, setSaving] = useState(false);

  const loadPackages = () => {
    setLoading(true);
    api.get<{ data: SellerPackage[] }>('/seller-packages')
      .then((res) => setPackages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPackages(); }, []);

  const openAdd = () => { setEditId(null); setForm({ name: '', price: 0, maxProducts: 0, duration: 30, description: '' }); setModalOpen(true); };
  const openEdit = (pkg: SellerPackage) => { setEditId(pkg.id); setForm({ name: pkg.name, price: pkg.price, maxProducts: pkg.maxProducts, duration: pkg.duration, description: pkg.description || '' }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/seller-packages/${editId}`, form);
      } else {
        await api.post('/seller-packages', form);
      }
      setModalOpen(false);
      loadPackages();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce package ?')) return;
    try {
      await api.delete(`/seller-packages/${id}`);
      setPackages(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Gift className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Packages vendeur</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" /> Ajouter un package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-dark">{pkg.name}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-2"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-danger"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">{formatPrice(pkg.price)}</p>
            <p className="text-xs text-gray-3 mb-4">/ {pkg.duration} jours</p>
            <p className="text-sm text-gray-2 mb-4 flex-1">{pkg.description}</p>
            <div className="border-t border-gray-5 pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-3">Produits max</span><span className="font-medium">{pkg.maxProducts}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Duree</span><span className="font-medium">{pkg.duration} jours</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Souscriptions</span><span className="font-medium">{pkg._count?.subscriptions || 0}</span></div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-dark">{editId ? 'Modifier' : 'Ajouter un package'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-6"><X className="w-5 h-5 text-gray-2" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-1 mb-1">Nom</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ex: Business" /></div>
              <div><label className="block text-sm font-medium text-gray-1 mb-1">Prix (FCFA)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-1 mb-1">Nb produits max</label><input type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-1 mb-1">Duree (jours)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-1 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass + ' resize-none'} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-5 rounded-lg hover:bg-gray-6 transition">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50">
                {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
