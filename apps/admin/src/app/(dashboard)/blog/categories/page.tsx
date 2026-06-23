'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count?: { posts: number };
  status?: string;
}

interface ModalProps {
  cat: Partial<BlogCategory> | null;
  onClose: () => void;
  onSave: (c: Partial<BlogCategory>) => void;
}

function CategoryModal({ cat, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<Partial<BlogCategory>>(
    cat || { name: '', slug: '', description: '' }
  );

  const handleNomChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">
            {cat?.id ? 'Modifier la categorie' : 'Nouvelle categorie'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Nom</label>
            <input
              value={form.name || ''}
              onChange={(e) => handleNomChange(e.target.value)}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Nom de la categorie"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Slug</label>
            <input
              value={form.slug || ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm bg-gray-6/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="slug-auto-genere"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Description de la categorie"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<BlogCategory> | null | false>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: BlogCategory[] }>('/blog/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Erreur chargement categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (form: Partial<BlogCategory>) => {
    try {
      if (form.id) {
        await api.patch(`/blog/categories/${form.id}`, { name: form.name, slug: form.slug });
      } else {
        await api.post('/blog/categories', { name: form.name, slug: form.slug });
      }
      setModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde categorie:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette categorie ?')) return;
    try {
      await api.delete(`/blog/categories/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression categorie:', err);
    }
  };

  const columns: Column<BlogCategory>[] = [
    {
      name: 'Nom',
      key: 'name',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-dark">{item.name}</span>
        </div>
      ),
    },
    {
      name: 'Slug',
      key: 'slug',
      render: (item) => (
        <code className="text-xs bg-gray-6 px-2 py-0.5 rounded text-gray-2">{item.slug}</code>
      ),
    },
    {
      name: 'Description',
      key: 'description',
      render: (item) => (
        <span className="text-gray-2 text-sm max-w-[250px] block truncate">{item.description || '-'}</span>
      ),
    },
    {
      name: 'Articles',
      key: 'articles',
      render: (item) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-info">
          {item._count?.posts ?? 0}
        </span>
      ),
    },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status || 'ACTIVE'} /> },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModal(item)}
            className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
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
      {modal !== false && (
        <CategoryModal cat={modal} onClose={() => setModal(false)} onSave={handleSave} />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Categories du Blog</h1>
            <p className="text-sm text-gray-3">{categories.length} categories</p>
          </div>
        </div>
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Nouvelle categorie
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={categories} />
      </div>
    </div>
  );
}
