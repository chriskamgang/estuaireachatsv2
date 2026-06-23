'use client';

import { useState, useEffect, useCallback } from 'react';
import { Palette, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Color {
  id: number;
  name: string;
  code: string;
}

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editColor, setEditColor] = useState<Color | null>(null);
  const [form, setForm] = useState({ name: '', code: '#000000' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Color[] }>('/colors');
      setColors(res.data);
    } catch (err) {
      console.error('Erreur chargement couleurs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditColor(null); setForm({ name: '', code: '#000000' }); setShowModal(true); };
  const openEdit = (c: Color) => { setEditColor(c); setForm({ name: c.name, code: c.code }); setShowModal(true); };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ?')) return;
    try {
      await api.delete(`/colors/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editColor) {
        await api.patch(`/colors/${editColor.id}`, { name: form.name, code: form.code });
      } else {
        await api.post('/colors', { name: form.name, code: form.code });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const columns: Column<Color>[] = [
    {
      name: 'Couleur', key: 'preview',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-gray-4" style={{ backgroundColor: item.code }} />
          <span className="font-medium text-dark">{item.name}</span>
        </div>
      ),
    },
    { name: 'Code', key: 'code', render: (item) => <span className="font-mono text-sm text-gray-2">{item.code}</span> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Palette className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Couleurs</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={colors} pagination={{ page: 1, perPage: 20, total: colors.length }} />
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editColor ? 'Modifier' : 'Ajouter une couleur'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Bleu Marine" className={inputClass} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Code couleur</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-10 h-10 rounded border-0 cursor-pointer" />
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium">{editColor ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
