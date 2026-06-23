'use client';

import { useState, useEffect } from 'react';
import { Wrench, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Zone {
  id: number;
  nom: string;
  tarif: number;
  tarifKg: number;
  delaiMin: number;
  delaiMax: number;
  actif: boolean;
}

const DEFAULT_ZONES: Zone[] = [
  { id: 1, nom: 'Douala Intramuros', tarif: 1000, tarifKg: 200, delaiMin: 1, delaiMax: 2, actif: true },
  { id: 2, nom: 'Douala Periurbain', tarif: 1500, tarifKg: 250, delaiMin: 2, delaiMax: 4, actif: true },
  { id: 3, nom: 'Yaounde Intramuros', tarif: 1000, tarifKg: 200, delaiMin: 1, delaiMax: 2, actif: true },
  { id: 4, nom: 'Yaounde Periurbain', tarif: 1500, tarifKg: 250, delaiMin: 2, delaiMax: 4, actif: true },
  { id: 5, nom: 'Bafoussam', tarif: 2500, tarifKg: 300, delaiMin: 3, delaiMax: 5, actif: true },
  { id: 6, nom: 'Garoua', tarif: 3500, tarifKg: 400, delaiMin: 5, delaiMax: 7, actif: true },
  { id: 7, nom: 'Bertoua', tarif: 3000, tarifKg: 350, delaiMin: 4, delaiMax: 6, actif: true },
  { id: 8, nom: 'Maroua', tarif: 4000, tarifKg: 450, delaiMin: 6, delaiMax: 8, actif: false },
];

export default function DeliveryConfigPage() {
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: { zones?: Zone[]; config?: typeof config } }>('/settings/admin/admin_delivery_config')
      .then(res => {
        if (res.data) {
          if (res.data.zones) setZones(res.data.zones);
          if (res.data.config) setConfig(prev => ({ ...prev, ...res.data.config }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState<Partial<Zone>>({ nom: '', tarif: 1000, tarifKg: 200, delaiMin: 1, delaiMax: 3, actif: true });

  // General config
  const [config, setConfig] = useState({
    tarifBase: 1000,
    tarifGratuitSeuil: 50000,
    commissionLivreur: 70, // % du tarif qui va au livreur
    rayonMaxKm: 15,
    maxCommandesSimultanees: 3,
    autoAssignation: true,
    notifSMS: true,
    notifApp: true,
    confirmationPhoto: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_delivery_config', { value: { zones, config } });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const updateZone = (id: number, k: keyof Zone, v: string | number | boolean) => {
    setZones(zones.map((z) => z.id === id ? { ...z, [k]: v } : z));
  };

  const addZone = () => {
    if (!newZone.nom?.trim()) return;
    setZones([...zones, { ...newZone, id: Date.now() } as Zone]);
    setNewZone({ nom: '', tarif: 1000, tarifKg: 200, delaiMin: 1, delaiMax: 3, actif: true });
    setShowAddZone(false);
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
          <span className="text-sm font-medium">Configuration enregistree avec succes</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Configuration Livraison</h1>
          <p className="text-sm text-gray-3">Parametres globaux du systeme de livraison</p>
        </div>
      </div>

      {/* Parametres generaux */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Parametres generaux</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Tarif de base (FCFA)</label>
            <p className="text-xs text-gray-3 mb-2">Frais minimum de livraison appliques a toutes les commandes</p>
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden">
              <input
                type="number"
                value={config.tarifBase}
                onChange={(e) => setConfig({ ...config, tarifBase: Number(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-6 text-gray-2 text-sm">FCFA</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Seuil livraison gratuite (FCFA)</label>
            <p className="text-xs text-gray-3 mb-2">Commandes au-dessus de ce montant = livraison offerte</p>
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden">
              <input
                type="number"
                value={config.tarifGratuitSeuil}
                onChange={(e) => setConfig({ ...config, tarifGratuitSeuil: Number(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-6 text-gray-2 text-sm">FCFA</span>
            </div>
            <p className="text-xs text-primary mt-1">Actuellement: {formatPrice(config.tarifGratuitSeuil)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Commission livreur (%)</label>
            <p className="text-xs text-gray-3 mb-2">Pourcentage des frais de livraison reverse au livreur</p>
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden">
              <input
                type="number"
                min={0}
                max={100}
                value={config.commissionLivreur}
                onChange={(e) => setConfig({ ...config, commissionLivreur: Number(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-6 text-gray-2 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Rayon maximum (km)</label>
            <p className="text-xs text-gray-3 mb-2">Distance maximale acceptee pour une livraison</p>
            <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden">
              <input
                type="number"
                min={1}
                value={config.rayonMaxKm}
                onChange={(e) => setConfig({ ...config, rayonMaxKm: Number(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-6 text-gray-2 text-sm">km</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Commandes simultanées max par livreur</label>
            <input
              type="number"
              min={1}
              max={10}
              value={config.maxCommandesSimultanees}
              onChange={(e) => setConfig({ ...config, maxCommandesSimultanees: Number(e.target.value) })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-dark">Options</h3>
          {[
            { k: 'autoAssignation', label: 'Assignation automatique des livreurs', desc: 'Assigner automatiquement la commande au livreur disponible le plus proche' },
            { k: 'notifSMS', label: 'Notifications SMS livreurs', desc: 'Envoyer un SMS au livreur lors d\'une nouvelle assignation' },
            { k: 'notifApp', label: 'Notifications application', desc: 'Notifier les livreurs via l\'app mobile' },
            { k: 'confirmationPhoto', label: 'Photo de confirmation obligatoire', desc: 'Le livreur doit prendre une photo lors de la livraison' },
          ].map((opt) => (
            <label key={opt.k} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config[opt.k as keyof typeof config] as boolean}
                onChange={(e) => setConfig({ ...config, [opt.k]: e.target.checked })}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-dark">{opt.label}</p>
                <p className="text-xs text-gray-3">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Zones et tarifs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-dark">Zones de livraison et tarifs</h2>
          <button
            onClick={() => setShowAddZone(!showAddZone)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary/20 transition"
          >
            <Plus className="w-4 h-4" /> Ajouter une zone
          </button>
        </div>

        {showAddZone && (
          <div className="mb-4 p-4 bg-gray-6/50 rounded-xl border border-gray-5 space-y-3">
            <h3 className="text-sm font-semibold text-dark">Nouvelle zone</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Nom de la zone</label>
                <input value={newZone.nom || ''} onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="ex: Douala Est" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Tarif (FCFA)</label>
                <input type="number" value={newZone.tarif} onChange={(e) => setNewZone({ ...newZone, tarif: Number(e.target.value) })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Tarif/kg (FCFA)</label>
                <input type="number" value={newZone.tarifKg} onChange={(e) => setNewZone({ ...newZone, tarifKg: Number(e.target.value) })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Delai min (j)</label>
                <input type="number" min={1} value={newZone.delaiMin} onChange={(e) => setNewZone({ ...newZone, delaiMin: Number(e.target.value) })} className="w-20 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Delai max (j)</label>
                <input type="number" min={1} value={newZone.delaiMax} onChange={(e) => setNewZone({ ...newZone, delaiMax: Number(e.target.value) })} className="w-20 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <button onClick={addZone} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                Ajouter
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-3">
            <div className="col-span-2">Zone</div>
            <div>Tarif base</div>
            <div>Tarif/kg</div>
            <div>Delai (j)</div>
            <div>Actif</div>
            <div></div>
          </div>
          {zones.map((zone) => (
            <div key={zone.id} className={`grid grid-cols-7 gap-3 items-center p-3 rounded-lg ${zone.actif ? 'bg-gray-6/30' : 'bg-gray-6/10 opacity-60'}`}>
              <div className="col-span-2">
                <p className="text-sm font-medium text-dark">{zone.nom}</p>
              </div>
              <div>
                <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden w-28">
                  <input
                    type="number"
                    value={zone.tarif}
                    onChange={(e) => updateZone(zone.id, 'tarif', Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 text-xs outline-none w-16 bg-white"
                  />
                  <span className="px-1.5 py-1.5 bg-gray-6 text-gray-3 text-[10px]">F</span>
                </div>
              </div>
              <div>
                <div className="flex items-center border border-gray-5 rounded-lg overflow-hidden w-24">
                  <input
                    type="number"
                    value={zone.tarifKg}
                    onChange={(e) => updateZone(zone.id, 'tarifKg', Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 text-xs outline-none w-14 bg-white"
                  />
                  <span className="px-1 py-1.5 bg-gray-6 text-gray-3 text-[10px]">F/kg</span>
                </div>
              </div>
              <div className="text-xs text-gray-2">{zone.delaiMin}-{zone.delaiMax} j</div>
              <div>
                <button
                  onClick={() => updateZone(zone.id, 'actif', !zone.actif)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${zone.actif ? 'bg-success' : 'bg-gray-4'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${zone.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <button onClick={() => setZones(zones.filter((z) => z.id !== zone.id))} className="p-1 rounded hover:bg-gray-5 text-gray-3 hover:text-danger transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Save className="w-4 h-4" /> Enregistrer la configuration
        </button>
      </div>
    </div>
  );
}
