'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Save, X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function CreateAuctionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    titre: '',
    description: '',
    prixDepart: '',
    prixReserve: '',
    incrementMin: '1000',
    dateDebut: '',
    dateFin: '',
    dureeHeures: '',
    categorie: '',
    stock: '1',
    autoProlongation: false,
    acheterMaintenant: '',
    conditionProduit: 'NEUF',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) { showToast('Le titre est requis', 'error'); return; }
    if (!form.prixDepart) { showToast('Le prix de depart est requis', 'error'); return; }
    if (!form.dateFin) { showToast('La date de fin est requise', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_auction_data', { value: form });
      showToast('Enchere creee avec succes !');
      setTimeout(() => router.push('/auction'), 1500);
    } catch {
      showToast('Erreur lors de la creation', 'error');
    }
    setSaving(false);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border transition-all ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Gavel className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Creer une enchere</h1>
          <p className="text-sm text-gray-3">Configurez les parametres de votre vente aux encheres</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations produit */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Informations du produit</h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className={labelClass}>Titre du produit *</label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => set('titre', e.target.value)}
                placeholder="Ex: iPhone 14 Pro Max 256Go Noir"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="Decrivez l'etat et les caracteristiques du produit..."
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Categorie</label>
                <select value={form.categorie} onChange={(e) => set('categorie', e.target.value)} className={inputClass}>
                  <option value="">Selectionner</option>
                  <option>Electronique</option>
                  <option>Telephonie</option>
                  <option>Informatique</option>
                  <option>Electromenager</option>
                  <option>Mobilier</option>
                  <option>Mode</option>
                  <option>Autres</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Etat du produit</label>
                <select value={form.conditionProduit} onChange={(e) => set('conditionProduit', e.target.value)} className={inputClass}>
                  <option value="NEUF">Neuf</option>
                  <option value="EXCELLENT">Tres bon etat</option>
                  <option value="BON">Bon etat</option>
                  <option value="USAGE">Use</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Quantite disponible</label>
              <input
                type="number"
                min={1}
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className={inputClass}
                style={{ maxWidth: 120 }}
              />
            </div>
          </div>
        </div>

        {/* Configuration enchere */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Configuration des encheres</h2>
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prix de depart (FCFA) *</label>
                <input
                  type="number"
                  min={0}
                  value={form.prixDepart}
                  onChange={(e) => set('prixDepart', e.target.value)}
                  placeholder="Ex: 50000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prix de reserve (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={form.prixReserve}
                  onChange={(e) => set('prixReserve', e.target.value)}
                  placeholder="Optionnel"
                  className={inputClass}
                />
                <p className="text-xs text-gray-3 mt-1">Enchere minimum pour vente effective</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Increment minimum (FCFA)</label>
                <input
                  type="number"
                  min={100}
                  value={form.incrementMin}
                  onChange={(e) => set('incrementMin', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Acheter maintenant (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={form.acheterMaintenant}
                  onChange={(e) => set('acheterMaintenant', e.target.value)}
                  placeholder="Optionnel"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Duree */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Duree de l&apos;enchere</h2>
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date et heure de debut</label>
                <input
                  type="datetime-local"
                  value={form.dateDebut}
                  onChange={(e) => set('dateDebut', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date et heure de fin *</label>
                <input
                  type="datetime-local"
                  value={form.dateFin}
                  onChange={(e) => set('dateFin', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => set('autoProlongation', !form.autoProlongation)}
                className={`relative w-11 h-6 rounded-full transition ${form.autoProlongation ? 'bg-primary' : 'bg-gray-4'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.autoProlongation ? 'translate-x-5' : ''}`} />
              </button>
              <div>
                <span className="text-sm font-medium text-gray-2">Prolongation automatique</span>
                <p className="text-xs text-gray-3">Prolonge de 5 min si une enchere est placee dans les 2 dernieres minutes</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/auction')}
            className="px-5 py-2.5 border border-gray-5 text-gray-2 rounded-lg text-sm font-medium hover:bg-gray-6 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publier l&apos;enchere
          </button>
        </div>
      </form>
    </div>
  );
}
