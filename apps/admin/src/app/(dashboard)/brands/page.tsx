'use client';

import { useState, useEffect } from 'react';
import { Tags, Plus, Pencil, Trash2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  _count?: { products: number };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', logo: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBrands = async () => {
    try {
      const res = await api.get<{ data: Brand[] }>('/brands');
      setBrands(res.data);
    } catch { setBrands([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBrands(); }, []);

  const openCreate = () => { setEditBrand(null); setForm({ name: '', logo: '' }); setShowModal(true); };
  const openEdit = (b: Brand) => { setEditBrand(b); setForm({ name: b.name, logo: b.logo || '' }); setShowModal(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette marque ?')) return;
    try { await api.delete(`/brands/${id}`); showToast('Marque supprimee'); loadBrands(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Erreur', 'error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, ...(form.logo && { logo: form.logo }) };
      if (editBrand) { await api.patch(`/brands/${editBrand.id}`, payload); showToast('Marque modifiee'); }
      else { await api.post('/brands', payload); showToast('Marque creee'); }
      setShowModal(false); loadBrands();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  const columns: Column<Brand>[] = [
    { name: 'Logo', key: 'logo', render: (item) => item.logo ? <img src={item.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border" /> : <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-3" /></div> },
    { name: 'Nom', key: 'name', render: (item) => <span className="font-medium text-dark">{item.name}</span> },
    { name: 'Nb produits', key: '_count', render: (item) => <span>{item._count?.products || 0}</span> },
    { name: 'Actions', key: 'actions', render: (item) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Tags className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Marques</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter une marque</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-gray-3">Chargement...</p></div> : (
          <DataTable columns={columns} data={brands} pagination={{ page: 1, perPage: 20, total: brands.length }} />
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editBrand ? 'Modifier la marque' : 'Ajouter une marque'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Logo URL</label><input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." className={inputClass} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}{editBrand ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
