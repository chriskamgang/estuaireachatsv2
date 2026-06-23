'use client';

import { useState, useEffect } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  order: number;
  featured: boolean;
  isActive: boolean;
  parentId?: string;
  parent?: { id: string; name: string };
  children?: Category[];
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', parentId: '', image: '', order: 1, featured: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCategories = async () => {
    try {
      const res = await api.get<{ data: Category[] }>('/categories');
      setCategories(res.data);
      const flat: Category[] = [];
      const flatten = (cats: Category[], parentName?: string) => {
        for (const cat of cats) {
          flat.push({ ...cat, parent: parentName ? { id: '', name: parentName } : undefined });
          if (cat.children?.length) flatten(cat.children, cat.name);
        }
      };
      flatten(res.data);
      setFlatCategories(flat);
    } catch {
      setCategories([]);
      setFlatCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', parentId: '', image: '', order: flatCategories.length + 1, featured: false });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({ name: cat.name, parentId: cat.parentId || '', image: cat.image || '', order: cat.order || 1, featured: cat.featured || false });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette categorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      showToast('Categorie supprimee');
      loadCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        ...(form.parentId && { parentId: form.parentId }),
        ...(form.image && { image: form.image }),
        order: form.order,
        featured: form.featured,
      };
      if (editCat) {
        await api.patch(`/categories/${editCat.id}`, payload);
        showToast('Categorie modifiee');
      } else {
        await api.post('/categories', payload);
        showToast('Categorie creee');
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Category>[] = [
    {
      name: 'Image',
      key: 'image',
      render: (item) => item.image ? (
        <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-3" /></div>
      ),
    },
    {
      name: 'Nom',
      key: 'name',
      render: (item) => <span className="font-medium text-dark">{item.parent ? '— ' : ''}{item.name}</span>,
    },
    {
      name: 'Parent',
      key: 'parent',
      render: (item) => <span className="text-gray-3">{item.parent?.name || '-'}</span>,
    },
    { name: 'Ordre', key: 'order', render: (item) => <span>{item.order || '-'}</span> },
    {
      name: 'Featured',
      key: 'featured',
      render: (item) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.featured ? 'bg-success-soft text-success' : 'bg-gray-6 text-gray-3'}`}>
          {item.featured ? 'Oui' : 'Non'}
        </span>
      ),
    },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
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
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><FolderTree className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Categories</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter une categorie
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-gray-3">Chargement...</p></div>
        ) : (
          <DataTable columns={columns} data={flatCategories} pagination={{ page: 1, perPage: 50, total: flatCategories.length }} />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editCat ? 'Modifier la categorie' : 'Ajouter une categorie'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Parent</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className={inputClass}>
                  <option value="">Aucun (racine)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Ordre</label>
                  <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className={inputClass} />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-gray-2">Mise en avant</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editCat ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
