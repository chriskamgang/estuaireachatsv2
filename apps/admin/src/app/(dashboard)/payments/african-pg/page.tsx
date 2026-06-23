'use client';

import { useState, useEffect } from 'react';
import { Globe, Save, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function MaskedInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <div className="relative">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-3 hover:text-primary transition">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AfricanPGPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/payments/kpay')
      .then((res) => setConfig(res.data || {}))
      .catch(() => setConfig({ apiKey: '', secretKey: '', webhookSecret: '', mode: 'sandbox', enabled: true }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/payments/kpay', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const update = (field: string, value: string | boolean) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  if (loading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Passerelles de paiement africaines</h1>
          <p className="text-sm text-gray-3">Configuration KPay (MTN MoMo + Orange Money) pour le Cameroun</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><span className="text-lg">💳</span></div>
            <div>
              <h2 className="text-lg font-bold text-dark">KPay</h2>
              <p className="text-xs text-gray-3">Agregateur de paiement Cameroun (MTN MoMo + Orange Money)</p>
            </div>
          </div>
          <button type="button" onClick={() => update('enabled', !config.enabled)}
            className={`relative w-11 h-6 rounded-full transition ${config.enabled ? 'bg-primary' : 'bg-gray-4'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <MaskedInput label="API Key" value={config.apiKey || ''} onChange={(v) => update('apiKey', v)} />
          <MaskedInput label="Secret Key" value={config.secretKey || ''} onChange={(v) => update('secretKey', v)} />
          <MaskedInput label="Webhook Secret" value={config.webhookSecret || ''} onChange={(v) => update('webhookSecret', v)} />
          <div>
            <label className="block text-sm font-medium text-gray-2 mb-1">Mode</label>
            <select value={config.mode || 'sandbox'} onChange={(e) => update('mode', e.target.value)} className={inputClass}>
              <option value="sandbox">Sandbox (Test)</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="mt-5 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Enregistre !' : saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
