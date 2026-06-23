'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
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

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
    </div>
  );
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

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

interface PaymentConfig { enabled: boolean; [key: string]: string | boolean; }
interface Configs { kpay: PaymentConfig; gfs: PaymentConfig; paypal: PaymentConfig; cod: PaymentConfig; }

export default function PaymentConfigPage() {
  const [configs, setConfigs] = useState<Configs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: any }>('/settings/payments')
      .then((res) => {
        const d = res.data || {};
        setConfigs({
          kpay: { apiKey: d.kpay?.apiKey || '', secretKey: d.kpay?.secretKey || '', webhookSecret: d.kpay?.webhookSecret || '', mode: d.kpay?.mode || 'sandbox', enabled: d.kpay?.enabled ?? true },
          gfs: { apiKey: d.gfs?.apiKey || '', apiSecret: d.gfs?.apiSecret || '', paymentUrl: d.gfs?.paymentUrl || '', callbackUrl: d.gfs?.callbackUrl || '', enabled: d.gfs?.enabled ?? false },
          paypal: { clientId: d.paypal?.clientId || '', clientSecret: d.paypal?.clientSecret || '', mode: d.paypal?.mode || 'sandbox', enabled: d.paypal?.enabled ?? false },
          cod: { enabled: d.cod?.enabled ?? false },
        });
      })
      .catch(() => {
        setConfigs({
          kpay: { apiKey: '', secretKey: '', webhookSecret: '', mode: 'sandbox', enabled: true },
          gfs: { apiKey: '', apiSecret: '', paymentUrl: '', callbackUrl: '', enabled: false },
          paypal: { clientId: '', clientSecret: '', mode: 'sandbox', enabled: false },
          cod: { enabled: false },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !configs) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const update = (provider: keyof Configs, field: string, value: string | boolean) => {
    setConfigs((prev) => prev ? { ...prev, [provider]: { ...prev[provider], [field]: value } } : prev);
  };

  const handleSave = async (provider: keyof Configs) => {
    setSaving(provider);
    try {
      const endpoint = provider === 'cod' ? '/settings/payments/cod' : `/settings/payments/${provider}`;
      await api.patch(endpoint, configs[provider]);
      setSaved(provider);
      setTimeout(() => setSaved(null), 2000);
    } catch {}
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Settings className="w-5 h-5 text-primary" /></div>
        <h1 className="text-2xl font-bold text-dark">Configuration des paiements</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPay */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark">KPay</h2>
            <Toggle label="" checked={configs.kpay.enabled} onChange={(v) => update('kpay', 'enabled', v)} />
          </div>
          <div className="space-y-4">
            <MaskedInput label="API Key" value={configs.kpay.apiKey as string} onChange={(v) => update('kpay', 'apiKey', v)} />
            <MaskedInput label="Secret Key" value={configs.kpay.secretKey as string} onChange={(v) => update('kpay', 'secretKey', v)} />
            <MaskedInput label="Webhook Secret" value={configs.kpay.webhookSecret as string} onChange={(v) => update('kpay', 'webhookSecret', v)} />
            <SelectInput label="Mode" value={configs.kpay.mode as string} options={[{ value: 'sandbox', label: 'Sandbox' }, { value: 'production', label: 'Production' }]} onChange={(v) => update('kpay', 'mode', v)} />
          </div>
          <button onClick={() => handleSave('kpay')} disabled={saving === 'kpay'} className="mt-5 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saved === 'kpay' ? 'Enregistre !' : saving === 'kpay' ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
        {/* GFSolutions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark">GFSolutions</h2>
            <Toggle label="" checked={configs.gfs.enabled} onChange={(v) => update('gfs', 'enabled', v)} />
          </div>
          <div className="space-y-4">
            <MaskedInput label="API Key" value={configs.gfs.apiKey as string} onChange={(v) => update('gfs', 'apiKey', v)} />
            <MaskedInput label="API Secret" value={configs.gfs.apiSecret as string} onChange={(v) => update('gfs', 'apiSecret', v)} />
            <TextInput label="Payment URL" value={configs.gfs.paymentUrl as string} onChange={(v) => update('gfs', 'paymentUrl', v)} />
            <TextInput label="Callback URL" value={configs.gfs.callbackUrl as string} onChange={(v) => update('gfs', 'callbackUrl', v)} />
          </div>
          <button onClick={() => handleSave('gfs')} disabled={saving === 'gfs'} className="mt-5 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saved === 'gfs' ? 'Enregistre !' : saving === 'gfs' ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
        {/* PayPal */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark">PayPal</h2>
            <Toggle label="" checked={configs.paypal.enabled} onChange={(v) => update('paypal', 'enabled', v)} />
          </div>
          <div className="space-y-4">
            <MaskedInput label="Client ID" value={configs.paypal.clientId as string} onChange={(v) => update('paypal', 'clientId', v)} />
            <MaskedInput label="Client Secret" value={configs.paypal.clientSecret as string} onChange={(v) => update('paypal', 'clientSecret', v)} />
            <SelectInput label="Mode" value={configs.paypal.mode as string} options={[{ value: 'sandbox', label: 'Sandbox' }, { value: 'live', label: 'Live' }]} onChange={(v) => update('paypal', 'mode', v)} />
          </div>
          <button onClick={() => handleSave('paypal')} disabled={saving === 'paypal'} className="mt-5 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saved === 'paypal' ? 'Enregistre !' : saving === 'paypal' ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
        {/* COD */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark">Paiement a la livraison</h2>
            <Toggle label="" checked={configs.cod.enabled} onChange={(v) => update('cod', 'enabled', v)} />
          </div>
          <p className="text-sm text-gray-3 mb-4">Permet aux clients de payer en especes a la reception de leur commande.</p>
          <button onClick={() => handleSave('cod')} disabled={saving === 'cod'} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saved === 'cod' ? 'Enregistre !' : saving === 'cod' ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
