'use client';

import { useState, useEffect, useCallback } from 'react';
import { Percent, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CategoryCommission {
  id: number;
  categorie: string;
  taux: number;
}

interface CommissionSettings {
  tauxDefaut: number;
  commissions: CategoryCommission[];
  options: boolean[];
}

const DEFAULT_SETTINGS: CommissionSettings = {
  tauxDefaut: 10,
  commissions: [
    { id: 1, categorie: 'Electronique', taux: 8 },
    { id: 2, categorie: 'Mode & Vetements', taux: 12 },
    { id: 3, categorie: 'Alimentation', taux: 5 },
    { id: 4, categorie: 'Maison & Decoration', taux: 10 },
    { id: 5, categorie: 'Beaute & Cosmetiques', taux: 15 },
    { id: 6, categorie: 'Materiaux de construction', taux: 6 },
    { id: 7, categorie: 'Automobile', taux: 7 },
    { id: 8, categorie: 'Informatique', taux: 9 },
  ],
  options: [true, false, false],
};

export default function CommissionPage() {
  const [tauxDefaut, setTauxDefaut] = useState(10);
  const [commissions, setCommissions] = useState<CategoryCommission[]>([]);
  const [options, setOptions] = useState<boolean[]>([true, false, false]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newTaux, setNewTaux] = useState(10);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ value: CommissionSettings }>('/settings/admin/admin_seller_commission');
      if (res.value && res.value.commissions) {
        setTauxDefaut(res.value.tauxDefaut);
        setCommissions(res.value.commissions);
        setOptions(res.value.options || [true, false, false]);
      } else {
        setTauxDefaut(DEFAULT_SETTINGS.tauxDefaut);
        setCommissions(DEFAULT_SETTINGS.commissions);
        setOptions(DEFAULT_SETTINGS.options);
      }
    } catch {
      setTauxDefaut(DEFAULT_SETTINGS.tauxDefaut);
      setCommissions(DEFAULT_SETTINGS.commissions);
      setOptions(DEFAULT_SETTINGS.options);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    try {
      await api.put('/settings/admin/admin_seller_commission', {
        value: { tauxDefaut, commissions, options },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const handleAdd = () => {
    if (!newCat.trim()) return;
    setCommissions([...commissions, { id: Date.now(), categorie: newCat, taux: newTaux }]);
    setNewCat('');
    setNewTaux(10);
  };

  const handleDelete = (id: number) => {
    setCommissions(commissions.filter((c) => c.id !== id));
  };

  const updateTaux = (id: number, taux: number) => {
    setCommissions(commissions.map((c) => (c.id === id ? { ...c, taux } : c)));
  };

  const toggleOption = (idx: number) => {
    const updated = [...options];
    updated[idx] = !updated[idx];
    setOptions(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <span className="text-sm font-medium">Commissions enregistrees avec succes</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Percent className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Parametres de Commission</h1>
          <p className="text-sm text-gray-3">Configurez les taux de commission par categorie</p>
        </div>
      </div>

      {/* Taux par defaut */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Taux de commission par defaut</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-gray-2 mb-1">Taux global (%)</label>
            <p className="text-xs text-gray-3 mb-2">Applique a toutes les categories sans regle specifique</p>
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden">
              <input
                type="number"
                min={0}
                max={100}
                value={tauxDefaut}
                onChange={(e) => setTauxDefaut(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-6 text-gray-2 text-sm font-medium">%</span>
            </div>
          </div>
          <div className="bg-primary-soft rounded-lg px-4 py-3">
            <p className="text-xs text-gray-3">Taux actuel</p>
            <p className="text-2xl font-bold text-primary">{tauxDefaut}%</p>
          </div>
        </div>
      </div>

      {/* Commissions par categorie */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Taux par categorie</h2>
        <div className="space-y-3">
          {commissions.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-6/30 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">{item.categorie}</p>
              </div>
              <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden w-28">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={item.taux}
                  onChange={(e) => updateTaux(item.id, Number(e.target.value))}
                  className="flex-1 px-3 py-2 text-sm outline-none w-16 bg-white"
                />
                <span className="px-2 py-2 bg-gray-6 text-gray-2 text-sm">%</span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Ajouter une categorie */}
          <div className="flex items-center gap-4 p-3 border-2 border-dashed border-gray-5 rounded-lg">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-4"
              placeholder="Nouvelle categorie..."
            />
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden w-28 bg-white">
              <input
                type="number"
                min={0}
                max={100}
                value={newTaux}
                onChange={(e) => setNewTaux(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm outline-none w-16"
              />
              <span className="px-2 py-2 bg-gray-6 text-gray-2 text-sm">%</span>
            </div>
            <button
              onClick={handleAdd}
              className="p-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary/20 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Regles speciales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Options avancees</h2>
        <div className="space-y-4">
          {[
            { label: 'Appliquer la commission sur le montant HT', desc: 'La commission est calculee avant les taxes' },
            { label: 'Commission degressive pour gros volumes', desc: 'Reduire automatiquement la commission au-dela de 500 000 FCFA de ventes' },
            { label: 'Exonerer les nouveaux vendeurs le premier mois', desc: 'Les vendeurs inscrits depuis moins de 30 jours ne paient pas de commission' },
          ].map((opt, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-primary" checked={options[i] ?? false} onChange={() => toggleOption(i)} />
              <div>
                <p className="text-sm font-medium text-dark">{opt.label}</p>
                <p className="text-xs text-gray-3">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Save className="w-4 h-4" /> Enregistrer les parametres
        </button>
      </div>
    </div>
  );
}
