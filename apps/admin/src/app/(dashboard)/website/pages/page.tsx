'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface PageItem {
  id: number;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  updatedAt: string;
  content: string;
}

const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const btnClass = 'flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium';

const defaultPages: PageItem[] = [
  { id: 1, title: 'A propos', slug: 'about', status: 'published', updatedAt: '2026-06-15', content: 'Contenu de la page A propos...' },
  { id: 2, title: 'Conditions generales', slug: 'terms', status: 'published', updatedAt: '2026-06-10', content: 'Conditions generales d\'utilisation...' },
  { id: 3, title: 'Politique de confidentialite', slug: 'privacy', status: 'published', updatedAt: '2026-06-10', content: 'Politique de confidentialite...' },
  { id: 4, title: 'Contact', slug: 'contact', status: 'published', updatedAt: '2026-06-12', content: 'Contactez-nous...' },
  { id: 5, title: 'FAQ', slug: 'faq', status: 'draft', updatedAt: '2026-06-08', content: 'Questions frequemment posees...' },
  { id: 6, title: 'Politique de livraison', slug: 'shipping-policy', status: 'published', updatedAt: '2026-06-05', content: 'Politique de livraison...' },
];

export default function Page() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', status: 'published' as 'published' | 'draft', content: '' });

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_pages')
      .then((res) => { if (res.data && Array.isArray(res.data)) setPages(res.data); else setPages(defaultPages); })
      .catch(() => { setPages(defaultPages); })
      .finally(() => setLoading(false));
  }, []);

  const savePages = async (data: PageItem[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_pages', { value: data });
    } catch {}
    setSaving(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', slug: '', status: 'published', content: '' });
    setModal(true);
  };

  const openEdit = (p: PageItem) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, status: p.status, content: p.content });
    setModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    let updated: PageItem[];
    if (editing) {
      updated = pages.map(p => p.id === editing.id ? { ...p, ...form, updatedAt: today } : p);
    } else {
      updated = [...pages, { id: Date.now(), ...form, updatedAt: today }];
    }
    setPages(updated);
    savePages(updated);
    setModal(false);
  };

  const handleDelete = (id: number) => {
    const updated = pages.filter(p => p.id !== id);
    setPages(updated);
    savePages(updated);
  };

  const columns: Column<PageItem>[] = [
    { name: 'Titre', key: 'title', render: (p) => <span className="font-medium text-dark">{p.title}</span> },
    { name: 'Slug', key: 'slug', render: (p) => <span className="text-gray-3 text-sm">/{p.slug}</span> },
    {
      name: 'Statut', key: 'status',
      render: (p) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {p.status === 'published' ? 'Publie' : 'Brouillon'}
        </span>
      ),
    },
    { name: 'Derniere mise a jour', key: 'updatedAt' },
    {
      name: 'Actions', key: 'actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-2 transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Pages statiques</h1>
          <p className="text-gray-2 text-sm mt-1">Gerez les pages de contenu de votre site</p>
        </div>
        <button onClick={openAdd} className={btnClass}>
          <Plus className="w-4 h-4" /> Ajouter une page
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={pages} />
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-sm w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {editing ? 'Modifier la page' : 'Nouvelle page'}
              </h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark">Titre</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })} className={inputClass} placeholder="Titre de la page" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="slug-de-la-page" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark">Publie</label>
                <button
                  onClick={() => setForm({ ...form, status: form.status === 'published' ? 'draft' : 'published' })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.status === 'published' ? 'bg-primary' : 'bg-gray-5'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.status === 'published' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dark">Contenu</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className={`${inputClass} min-h-[120px]`} placeholder="Contenu de la page..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(false)} className="px-4 py-2.5 rounded-lg border border-gray-5 text-sm font-medium text-gray-2 hover:bg-gray-6 transition">Annuler</button>
              <button onClick={handleSave} className={btnClass}><Save className="w-4 h-4" /> Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
