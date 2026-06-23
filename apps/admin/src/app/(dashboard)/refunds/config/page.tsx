'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface RefundConfig {
  autoApprove: boolean;
  refundWindowDays: number;
  reasons: string[];
  notifications: {
    emailClient: boolean;
    emailAdmin: boolean;
    smsClient: boolean;
  };
}

const DEFAULT_CONFIG: RefundConfig = {
  autoApprove: false,
  refundWindowDays: 14,
  reasons: [
    'Produit defectueux',
    'Produit ne correspond pas a la description',
    'Produit non recu',
    'Erreur de commande',
    'Changement d\'avis',
    'Double commande',
  ],
  notifications: {
    emailClient: true,
    emailAdmin: true,
    smsClient: false,
  },
};

export default function RefundConfigPage() {
  const [config, setConfig] = useState<RefundConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    api.get<{ data: RefundConfig }>('/settings/admin/admin_refunds_config')
      .then(res => {
        if (res.data) setConfig({ ...DEFAULT_CONFIG, ...res.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_refunds_config', { value: config });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const addReason = () => {
    if (!newReason.trim()) return;
    setConfig(prev => ({ ...prev, reasons: [...prev.reasons, newReason.trim()] }));
    setNewReason('');
  };

  const removeReason = (index: number) => {
    setConfig(prev => ({ ...prev, reasons: prev.reasons.filter((_, i) => i !== index) }));
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
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <span className="text-sm font-medium">Configuration sauvegardee !</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Configuration des remboursements</h1>
          <p className="text-sm text-gray-3">Definissez les regles et parametres de remboursement</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Politique generale */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Politique generale</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-5 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-dark">Approbation automatique</p>
                  <p className="text-xs text-gray-3 mt-0.5">Les demandes de remboursement sont automatiquement approuvees sans validation manuelle</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, autoApprove: !prev.autoApprove }))}
                  className={`relative w-12 h-6 rounded-full transition ${config.autoApprove ? 'bg-primary' : 'bg-gray-4'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.autoApprove ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Delai de remboursement (jours)</label>
                <p className="text-xs text-gray-3 mb-2">Nombre de jours apres la livraison pendant lesquels un remboursement peut etre demande</p>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={config.refundWindowDays}
                  onChange={(e) => setConfig(prev => ({ ...prev, refundWindowDays: Number(e.target.value) }))}
                  className="w-32 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Raisons de remboursement */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Raisons de remboursement</h2>
            <p className="text-xs text-gray-3 mb-3">Les raisons proposees aux clients lors de la demande de remboursement</p>
            <div className="space-y-2 mb-4">
              {config.reasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-5 rounded-lg group">
                  <span className="text-sm text-dark">{reason}</span>
                  <button
                    onClick={() => removeReason(index)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-3 hover:text-danger transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addReason()}
                placeholder="Ajouter une raison..."
                className="flex-1 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                onClick={addReason}
                disabled={!newReason.trim()}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifications.emailClient}
                  onChange={(e) => setConfig(prev => ({ ...prev, notifications: { ...prev.notifications, emailClient: e.target.checked } }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm text-dark">Email au client</span>
                  <p className="text-xs text-gray-3">Notifier le client par email lors de la mise a jour du remboursement</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifications.emailAdmin}
                  onChange={(e) => setConfig(prev => ({ ...prev, notifications: { ...prev.notifications, emailAdmin: e.target.checked } }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm text-dark">Email a l'admin</span>
                  <p className="text-xs text-gray-3">Recevoir un email pour chaque nouvelle demande de remboursement</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifications.smsClient}
                  onChange={(e) => setConfig(prev => ({ ...prev, notifications: { ...prev.notifications, smsClient: e.target.checked } }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm text-dark">SMS au client</span>
                  <p className="text-xs text-gray-3">Notifier le client par SMS (frais supplementaires)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-3">Resume</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-5">
                <span className="text-gray-3">Auto-approbation</span>
                <span className={`font-medium ${config.autoApprove ? 'text-success' : 'text-gray-2'}`}>
                  {config.autoApprove ? 'Activee' : 'Desactivee'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-5">
                <span className="text-gray-3">Fenetre de remboursement</span>
                <span className="font-medium text-dark">{config.refundWindowDays} jours</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-3">Raisons disponibles</span>
                <span className="font-medium text-dark">{config.reasons.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
            ) : (
              <><Save className="w-4 h-4" /> Sauvegarder la configuration</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
