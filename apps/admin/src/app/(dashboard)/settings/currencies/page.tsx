'use client';

import { useState, useEffect } from 'react';
import { Coins, Plus, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Currency { id: number; code: string; name: string; symbol: string; rate: number; isDefault: boolean; }

const defaultCurrencies: Currency[] = [
  { id: 1, code: 'XAF', name: 'Franc CFA', symbol: 'FCFA', rate: 1, isDefault: true },
  { id: 2, code: 'EUR', name: 'Euro', symbol: '€', rate: 0.0015, isDefault: false },
  { id: 3, code: 'USD', name: 'Dollar US', symbol: '$', rate: 0.0016, isDefault: false },
];

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_currencies')
      .then((res) => { if (res.data && Array.isArray(res.data)) setCurrencies(res.data); else setCurrencies(defaultCurrencies); })
      .catch(() => { setCurrencies(defaultCurrencies); })
      .finally(() => setLoading(false));
  }, []);

  const saveCurrencies = async (data: Currency[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_currencies', { value: data });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', symbol: '', rate: 1 });
  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...currencies, { id: Date.now(), ...form, isDefault: false }];
    setCurrencies(updated);
    saveCurrencies(updated);
    setShowModal(false);
    setForm({ code: '', name: '', symbol: '', rate: 1 });
  };

  const columns: Column<Currency>[] = [
    { name: 'Code', key: 'code', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    { name: 'Devise', key: 'name', render: (c) => <span className="font-medium text-dark">{c.name}</span> },
    { name: 'Symbole', key: 'symbol', render: (c) => <span className="text-primary font-medium">{c.symbol}</span> },
    { name: 'Taux (vs XAF)', key: 'rate', render: (c) => <span>{c.rate}</span> },
    {
      name: 'Statut', key: 'isDefault',
      render: (c) => c.isDefault ? <span className="px-2 py-0.5 bg-primary-soft text-primary rounded text-xs font-medium">Defaut</span> : <span className="text-xs text-gray-3">-</span>,
    },
  ];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Coins className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Devises</h1>
          {saved && <span className="text-xs text-green-600 font-medium">Enregistre !</span>}
        </div>
        <button onClick={() => setShowModal(true)} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm"><DataTable columns={columns} data={currencies} pagination={{ page: 1, perPage: 20, total: currencies.length }} /></div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-5"><h2 className="text-lg font-bold text-dark">Ajouter une devise</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button></div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Code</label><input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} maxLength={3} /></div>
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-2 mb-1">Symbole</label><input type="text" required value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-2 mb-1">Taux</label><input type="number" step="any" required value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} className={inputClass} /></div>
              </div>
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
