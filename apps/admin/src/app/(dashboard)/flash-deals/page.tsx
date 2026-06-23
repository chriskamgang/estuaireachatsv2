'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Zap, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface FlashDeal {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  discount: number;
  status: string;
  createdAt: string;
  _count?: { products: number };
}

export default function FlashDealsPage() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState<FlashDeal | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', discount: 0 });
  const [saving, setSaving] = useState(false);

  const loadDeals = () => {
    setLoading(true);
    api.get<{ data: FlashDeal[] }>('/flash-deals/admin/all?perPage=100')
      .then((res) => setDeals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDeals(); }, []);

  const openCreate = () => {
    setEditDeal(null);
    setForm({ title: '', startDate: '', endDate: '', discount: 0 });
    setShowForm(true);
  };

  const openEdit = (deal: FlashDeal) => {
    setEditDeal(deal);
    setForm({ title: deal.title, startDate: deal.startDate?.split('T')[0] || '', endDate: deal.endDate?.split('T')[0] || '', discount: deal.discount });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette offre flash ?')) return;
    try {
      await api.delete(`/flash-deals/${id}`);
      setDeals(prev => prev.filter(d => d.id !== id));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDeal) {
        await api.patch(`/flash-deals/${editDeal.id}`, form);
      } else {
        await api.post('/flash-deals', form);
      }
      setShowForm(false);
      loadDeals();
    } catch {}
    setSaving(false);
  };

  const columns: Column<FlashDeal>[] = [
    { name: 'Titre', key: 'title', render: (item) => <span className="font-medium text-dark">{item.title}</span> },
    { name: 'Date debut', key: 'startDate', render: (item) => formatDate(item.startDate) },
    { name: 'Date fin', key: 'endDate', render: (item) => formatDate(item.endDate) },
    { name: 'Produits', key: 'products', render: (item) => <span>{item._count?.products || 0}</span> },
    { name: 'Remise', key: 'discount', render: (item) => <span className="font-semibold text-primary">{item.discount}%</span> },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status || 'ACTIVE'} /> },
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
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Offres Flash</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Creer une offre flash
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={deals} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editDeal ? 'Modifier' : 'Creer une offre flash'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Titre</label><input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-2 mb-1">Date debut</label><input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-2 mb-1">Date fin</label><input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Remise (%)</label><input type="number" min={1} max={99} required value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className={inputClass} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editDeal ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
