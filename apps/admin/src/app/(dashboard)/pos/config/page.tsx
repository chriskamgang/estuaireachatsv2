'use client';

import { useState, useEffect } from 'react';
import { Wrench, Save, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function POSConfigPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    // Recu
    nomBoutique: 'EstuaireAchats',
    adresseBoutique: 'Avenue Kennedy, Douala, Cameroun',
    telephoneBoutique: '+237 6 98 76 54 32',
    emailBoutique: 'contact@estuaireachats.cm',
    headerRecu: 'Merci de votre visite !',
    footerRecu: 'Conservez votre recu. Echanges sous 7 jours avec recu.',
    logoRecu: true,
    // Taxes
    tvaTaux: '19.25',
    tvaLabel: 'TVA',
    tvaSurTotal: true,
    // Paiements
    accepterCash: true,
    accepterMoMo: true,
    accepterOrangeMoney: true,
    accepterCarte: false,
    accepterVirement: true,
    // Options
    afficherStock: true,
    autoImpression: false,
    numerotationAuto: true,
    prefixeCommande: 'POS',
    deviseSymbole: 'FCFA',
    positionDevise: 'apres',
  });

  useEffect(() => {
    api.get<{ data: typeof config }>('/settings/admin/admin_pos_config')
      .then(res => { if (res.data) setConfig(prev => ({ ...prev, ...res.data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string | boolean) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_pos_config', { value: config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  const Toggle = ({ field, label, hint }: { field: string; label: string; hint?: string }) => (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <div>
        <span className="text-sm font-medium text-gray-2">{label}</span>
        {hint && <p className="text-xs text-gray-3">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => set(field, !(config as Record<string, unknown>)[field] as boolean)}
        className={`relative w-11 h-6 rounded-full transition ${(config as Record<string, unknown>)[field] ? 'bg-primary' : 'bg-gray-4'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(config as Record<string, unknown>)[field] ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Configuration POS</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Boutique */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Informations boutique</h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className={labelClass}>Nom de la boutique</label>
              <input type="text" value={config.nomBoutique} onChange={(e) => set('nomBoutique', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telephone</label>
              <input type="text" value={config.telephoneBoutique} onChange={(e) => set('telephoneBoutique', e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Adresse</label>
              <input type="text" value={config.adresseBoutique} onChange={(e) => set('adresseBoutique', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={config.emailBoutique} onChange={(e) => set('emailBoutique', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Recu */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Configuration du recu</h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className={labelClass}>Message d&apos;en-tete du recu</label>
              <input type="text" value={config.headerRecu} onChange={(e) => set('headerRecu', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Message de pied de recu</label>
              <textarea
                value={config.footerRecu}
                onChange={(e) => set('footerRecu', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>
            <div className="border-t border-gray-5 pt-4 space-y-3">
              <Toggle field="logoRecu" label="Afficher le logo sur le recu" />
              <Toggle field="autoImpression" label="Impression automatique apres paiement" />
            </div>
          </div>
        </div>

        {/* Taxes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Taxes et devise</h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className={labelClass}>Libelle taxe</label>
              <input type="text" value={config.tvaLabel} onChange={(e) => set('tvaLabel', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Taux de TVA (%)</label>
              <input type="number" step="0.01" min={0} max={100} value={config.tvaTaux} onChange={(e) => set('tvaTaux', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Symbole devise</label>
              <input type="text" value={config.deviseSymbole} onChange={(e) => set('deviseSymbole', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Position devise</label>
              <select value={config.positionDevise} onChange={(e) => set('positionDevise', e.target.value)} className={inputClass}>
                <option value="avant">Avant le montant</option>
                <option value="apres">Apres le montant</option>
              </select>
            </div>
            <div className="col-span-2 border-t border-gray-5 pt-4">
              <Toggle field="tvaSurTotal" label="Calculer la TVA sur le total TTC" />
            </div>
          </div>
        </div>

        {/* Modes de paiement */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Modes de paiement acceptes</h2>
          <div className="max-w-sm space-y-3">
            <Toggle field="accepterCash" label="Especes" />
            <Toggle field="accepterMoMo" label="MTN Mobile Money" />
            <Toggle field="accepterOrangeMoney" label="Orange Money" />
            <Toggle field="accepterCarte" label="Carte bancaire" />
            <Toggle field="accepterVirement" label="Virement bancaire" />
          </div>
        </div>

        {/* Options generales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Options generales</h2>
          <div className="max-w-sm space-y-3">
            <Toggle field="afficherStock" label="Afficher le stock disponible" />
            <Toggle field="numerotationAuto" label="Numerotation automatique des commandes" />
          </div>
          <div className="mt-4 max-w-xs">
            <label className={labelClass}>Prefixe des commandes</label>
            <input type="text" value={config.prefixeCommande} onChange={(e) => set('prefixeCommande', e.target.value)} className={inputClass} />
            <p className="text-xs text-gray-3 mt-1">Ex: POS-001, POS-002...</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Configuration enregistree !' : 'Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
