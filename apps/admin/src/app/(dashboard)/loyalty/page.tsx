'use client';

import { useState, useEffect } from 'react';
import { Gift, Save, Loader2, Info } from 'lucide-react';
import { api } from '@/lib/api';

interface LoyaltyConfig {
  enabled: boolean;
  ordersRequired: number;
  discountPercent: number;
  validityDays: number;
  maxDiscount: number | null;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-gray-2">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-primary' : 'bg-gray-4'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function NumberInput({ label, value, onChange, suffix, placeholder }: { label: string; value: number | string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-3">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const [config, setConfig] = useState<LoyaltyConfig>({
    enabled: false,
    ordersRequired: 5,
    discountPercent: 2,
    validityDays: 30,
    maxDiscount: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: LoyaltyConfig }>('/settings/loyalty')
      .then((res) => {
        if (res.data) {
          setConfig({
            enabled: res.data.enabled ?? false,
            ordersRequired: res.data.ordersRequired ?? 5,
            discountPercent: res.data.discountPercent ?? 2,
            validityDays: res.data.validityDays ?? 30,
            maxDiscount: res.data.maxDiscount ?? null,
          });
        }
      })
      .catch(() => {
        // Utiliser les valeurs par defaut
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch('/settings/loyalty', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Programme de fidelite</h1>
          <p className="text-sm text-gray-3">Configurez les coupons de fidelite pour recompenser vos clients reguliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de configuration */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-dark">Configuration</h2>
            <Toggle label="" checked={config.enabled} onChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))} />
          </div>

          <div className="space-y-5">
            <NumberInput
              label="Nombre de commandes requises"
              value={config.ordersRequired}
              onChange={(v) => setConfig((prev) => ({ ...prev, ordersRequired: parseInt(v) || 0 }))}
            />

            <NumberInput
              label="Pourcentage de reduction"
              value={config.discountPercent}
              onChange={(v) => setConfig((prev) => ({ ...prev, discountPercent: parseFloat(v) || 0 }))}
              suffix="%"
            />

            <NumberInput
              label="Duree de validite du coupon"
              value={config.validityDays}
              onChange={(v) => setConfig((prev) => ({ ...prev, validityDays: parseInt(v) || 0 }))}
              suffix="jours"
            />

            <NumberInput
              label="Plafond de reduction (optionnel)"
              value={config.maxDiscount ?? ''}
              onChange={(v) => setConfig((prev) => ({ ...prev, maxDiscount: v ? parseInt(v) : null }))}
              suffix="FCFA"
              placeholder="Aucun plafond"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Enregistre !' : saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-orange" />
            <h3 className="text-base font-bold text-dark">Comment ca fonctionne ?</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-3 leading-relaxed">
            <p>
              Le programme de fidelite recompense automatiquement vos clients les plus fideles avec des coupons de reduction.
            </p>
            <div className="bg-gray-6 rounded-lg p-4 text-gray-2">
              <p className="font-medium mb-1">Fonctionnement :</p>
              <p>
                Apres <span className="font-bold text-primary">{config.ordersRequired}</span> commandes payees,
                le client recoit automatiquement un coupon de <span className="font-bold text-primary">{config.discountPercent}%</span> de
                reduction valable <span className="font-bold text-primary">{config.validityDays}</span> jours.
              </p>
              {config.maxDiscount && (
                <p className="mt-2">
                  La reduction est plafonnee a <span className="font-bold text-primary">{config.maxDiscount.toLocaleString()} FCFA</span>.
                </p>
              )}
            </div>
            <p>
              Le coupon est genere et envoye automatiquement par email au client. Il peut etre utilise sur sa prochaine commande.
            </p>
            <p>
              Le compteur de commandes est reinitialise apres chaque attribution de coupon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
