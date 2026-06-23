'use client';

import { useState, useEffect } from 'react';
import { Lock, Save, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function OTPConfigPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    actif: true,
    provider: 'twilio',
    longueurCode: '6',
    expirationMinutes: '10',
    maxTentatives: '3',
    delaiRenvoi: '60',
    // Usage
    verificationInscription: true,
    verificationConnexion: false,
    verificationPaiement: true,
    verificationMotDePasse: true,
    // Canal
    canalSMS: true,
    canalEmail: true,
    canalWhatsApp: false,
    codeTest: '123456',
    modeTest: true,
  });

  useEffect(() => {
    api.get<{ data: typeof config }>('/settings/admin/admin_otp_config')
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
      await api.put('/settings/admin/admin_otp_config', { value: config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  const Toggle = ({ field, label, hint }: { field: string; label: string; hint?: string }) => {
    const val = (config as Record<string, unknown>)[field] as boolean;
    return (
      <label className="flex items-center justify-between cursor-pointer py-1.5">
        <div>
          <span className="text-sm font-medium text-gray-2">{label}</span>
          {hint && <p className="text-xs text-gray-3">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => set(field, !val)}
          className={`relative w-11 h-6 rounded-full transition ${val ? 'bg-primary' : 'bg-gray-4'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-5' : ''}`} />
        </button>
      </label>
    );
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Configuration OTP</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Activation generale */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Activation generale</h2>
          <Toggle field="actif" label="Systeme OTP actif" hint="Active la verification par code a usage unique sur la plateforme" />
          <div className="mt-4 border-t border-gray-5 pt-4">
            <Toggle field="modeTest" label="Mode test" hint={`En mode test, le code OTP sera toujours : ${config.codeTest}`} />
            {config.modeTest && (
              <div className="mt-3 max-w-xs">
                <label className={labelClass}>Code de test fixe</label>
                <input type="text" value={config.codeTest} onChange={(e) => set('codeTest', e.target.value)} maxLength={8} className={inputClass} />
              </div>
            )}
          </div>
        </div>

        {/* Parametres du code */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Parametres du code OTP</h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className={labelClass}>Fournisseur SMS</label>
              <select value={config.provider} onChange={(e) => set('provider', e.target.value)} className={inputClass}>
                <option value="twilio">Twilio</option>
                <option value="infobip">Infobip</option>
                <option value="vonage">Vonage (Nexmo)</option>
                <option value="orange_sms">Orange SMS API</option>
                <option value="mtn_sms">MTN SMS API</option>
                <option value="firebase">Firebase Auth</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Longueur du code</label>
              <select value={config.longueurCode} onChange={(e) => set('longueurCode', e.target.value)} className={inputClass}>
                <option value="4">4 chiffres</option>
                <option value="6">6 chiffres</option>
                <option value="8">8 chiffres</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Expiration (minutes)</label>
              <input type="number" min={1} max={60} value={config.expirationMinutes} onChange={(e) => set('expirationMinutes', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tentatives max avant blocage</label>
              <input type="number" min={1} max={10} value={config.maxTentatives} onChange={(e) => set('maxTentatives', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Delai minimum avant renvoi (secondes)</label>
              <input type="number" min={30} max={300} value={config.delaiRenvoi} onChange={(e) => set('delaiRenvoi', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Canaux d'envoi */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Canaux d&apos;envoi</h2>
          <div className="max-w-sm space-y-1">
            <Toggle field="canalSMS" label="SMS" hint="Envoi par message texte" />
            <Toggle field="canalEmail" label="Email" hint="Envoi par courrier electronique" />
            <Toggle field="canalWhatsApp" label="WhatsApp" hint="Envoi via WhatsApp Business API" />
          </div>
        </div>

        {/* Contextes d'utilisation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Contextes d&apos;utilisation</h2>
          <div className="max-w-md space-y-1">
            <Toggle field="verificationInscription" label="Verification a l'inscription" hint="Verifier le telephone/email lors de la creation de compte" />
            <Toggle field="verificationConnexion" label="Double authentification (2FA)" hint="Demander un code OTP a chaque connexion" />
            <Toggle field="verificationPaiement" label="Verification avant paiement" hint="Code requis pour confirmer une transaction" />
            <Toggle field="verificationMotDePasse" label="Reinitialisation de mot de passe" hint="Code OTP pour prouver l'identite lors d'un reset" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Configuration enregistree !' : 'Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
