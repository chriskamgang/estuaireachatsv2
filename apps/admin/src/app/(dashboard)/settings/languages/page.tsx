'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Language { id: number; code: string; name: string; isDefault: boolean; isActive: boolean; }

const defaultLanguages: Language[] = [
  { id: 1, code: 'fr', name: 'Francais', isDefault: true, isActive: true },
  { id: 2, code: 'en', name: 'English', isDefault: false, isActive: true },
];

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_languages')
      .then((res) => { if (res.data && Array.isArray(res.data)) setLanguages(res.data); else setLanguages(defaultLanguages); })
      .catch(() => { setLanguages(defaultLanguages); })
      .finally(() => setLoading(false));
  }, []);

  const saveLanguages = async (data: Language[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_languages', { value: data });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    const updated = [...languages, { id: Date.now(), code: form.code, name: form.name, isDefault: false, isActive: true }];
    setLanguages(updated);
    saveLanguages(updated);
    setShowModal(false);
    setForm({ code: '', name: '' });
  };

  const toggleActive = (id: number) => { const updated = languages.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l); setLanguages(updated); saveLanguages(updated); };
  const setDefault = (id: number) => { const updated = languages.map(l => ({ ...l, isDefault: l.id === id })); setLanguages(updated); saveLanguages(updated); };
  const handleDelete = (id: number) => { if (!languages.find(l => l.id === id)?.isDefault) { const updated = languages.filter(l => l.id !== id); setLanguages(updated); saveLanguages(updated); } };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  const columns: Column<Language>[] = [
    { name: 'Code', key: 'code', render: (l) => <span className="font-mono font-medium">{l.code.toUpperCase()}</span> },
    { name: 'Langue', key: 'name', render: (l) => <span className="font-medium text-dark">{l.name}</span> },
    {
      name: 'Par defaut', key: 'isDefault',
      render: (l) => l.isDefault
        ? <span className="px-2 py-0.5 bg-primary-soft text-primary rounded text-xs font-medium">Defaut</span>
        : <button onClick={() => setDefault(l.id)} className="text-xs text-primary hover:underline">Definir</button>,
    },
    {
      name: 'Actif', key: 'isActive',
      render: (l) => (
        <button type="button" onClick={() => !l.isDefault && toggleActive(l.id)} className={`relative w-10 h-5 rounded-full transition ${l.isActive ? 'bg-primary' : 'bg-gray-4'} ${l.isDefault ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${l.isActive ? 'translate-x-5' : ''}`} />
        </button>
      ),
    },
    {
      name: 'Actions', key: 'actions',
      render: (l) => !l.isDefault ? (
        <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
      ) : <span className="text-xs text-gray-3">-</span>,
    },
  ];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Langues</h1>
          {saved && <span className="text-xs text-green-600 font-medium">Enregistre !</span>}
        </div>
        <button onClick={() => setShowModal(true)} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm"><DataTable columns={columns} data={languages} pagination={{ page: 1, perPage: 20, total: languages.length }} /></div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-5"><h2 className="text-lg font-bold text-dark">Ajouter une langue</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button></div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Code (ex: fr, en)</label><input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} maxLength={5} /></div>
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
