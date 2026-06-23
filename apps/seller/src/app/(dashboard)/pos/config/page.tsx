'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface PosConfig {
  name: string;
  address: string;
  currency: string;
  printer: string;
  taxEnabled: boolean;
}

export default function POSConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<PosConfig>({
    name: '',
    address: '',
    currency: 'XAF',
    printer: 'none',
    taxEnabled: true,
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await api.get<any>('/settings/seller/pos_config');
        if (res.data) {
          const parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (parsed && typeof parsed === 'object') {
            setConfig((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        // No config yet, use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/seller/pos_config', { value: JSON.stringify(config) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Configuration POS</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-1 mb-1.5">Nom du point de vente</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-1 mb-1.5">Adresse</label>
          <input
            type="text"
            value={config.address}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
            className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-1 mb-1.5">Devise</label>
            <select
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              <option value="XAF">XAF (FCFA)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-1 mb-1.5">Imprimante de ticket</label>
            <select
              value={config.printer}
              onChange={(e) => setConfig({ ...config, printer: e.target.value })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              <option value="none">Aucune</option>
              <option value="80mm">Thermique 80mm</option>
              <option value="58mm">Thermique 58mm</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="taxe"
            checked={config.taxEnabled}
            onChange={(e) => setConfig({ ...config, taxEnabled: e.target.checked })}
            className="w-4 h-4 text-primary rounded"
          />
          <label htmlFor="taxe" className="text-sm text-gray-1">Appliquer la TVA (19.25%)</label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
