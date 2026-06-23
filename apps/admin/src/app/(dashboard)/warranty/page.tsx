'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, Trash2, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Warranty {
  id: number;
  name: string;
  duration: string;
}

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', duration: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Warranty[] }>('/warranties');
      setWarranties(res.data);
    } catch (err) {
      console.error('Erreur chargement garanties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setForm({ name: '', duration: '' }); setShowModal(true); };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ?')) return;
    try {
      await api.delete(`/warranties/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await api.post('/warranties', { name: form.name, duration: form.duration });
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const columns: Column<Warranty>[] = [
    { name: 'Nom', key: 'name', render: (item) => <span className="font-medium text-dark">{item.name}</span> },
    { name: 'Duree', key: 'duration', render: (item) => <span className="px-2 py-0.5 bg-primary-soft text-primary rounded text-xs font-medium">{item.duration}</span> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
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
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Garantie</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={warranties} pagination={{ page: 1, perPage: 20, total: warranties.length }} />
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">Ajouter une garantie</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Duree</label><input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ex: 12 mois" className={inputClass} /></div>
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
