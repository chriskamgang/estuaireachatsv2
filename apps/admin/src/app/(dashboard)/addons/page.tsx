'use client';

import { useState, useEffect } from 'react';
import { Puzzle, Gavel, Monitor, Star, Users, Smartphone, Truck, RotateCcw, Wallet, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AddonData {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
}

interface Addon extends AddonData {
  icon: React.ElementType;
}

const iconMap: Record<string, React.ElementType> = {
  auction: Gavel, pos: Monitor, 'club-points': Star, affiliate: Users,
  otp: Smartphone, 'delivery-boys': Truck, refund: RotateCcw, wallet: Wallet,
};

const defaultAddons: Addon[] = [
  { id: 'auction', name: 'Auction', description: 'Systeme d\'encheres pour produits speciaux', version: '1.2.0', enabled: true, icon: Gavel },
  { id: 'pos', name: 'POS', description: 'Point de vente pour gestion en magasin', version: '2.0.1', enabled: false, icon: Monitor },
  { id: 'club-points', name: 'Club Points', description: 'Programme de fidelite avec points de recompense', version: '1.0.3', enabled: true, icon: Star },
  { id: 'affiliate', name: 'Affiliate', description: 'Systeme d\'affiliation et commissions', version: '1.1.0', enabled: false, icon: Users },
  { id: 'otp', name: 'OTP System', description: 'Verification par code OTP (SMS/Email)', version: '1.0.0', enabled: true, icon: Smartphone },
  { id: 'delivery-boys', name: 'Delivery Boys', description: 'Gestion des livreurs et suivi des livraisons', version: '1.3.2', enabled: false, icon: Truck },
  { id: 'refund', name: 'Refund System', description: 'Gestion des remboursements et retours', version: '1.0.1', enabled: true, icon: RotateCcw },
  { id: 'wallet', name: 'Wallet', description: 'Portefeuille electronique pour les utilisateurs', version: '2.1.0', enabled: false, icon: Wallet },
];

export default function Page() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_addons')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setAddons(res.data.map((a: AddonData) => ({ ...a, icon: iconMap[a.id] || Puzzle })));
        } else {
          setAddons(defaultAddons);
        }
      })
      .catch(() => { setAddons(defaultAddons); })
      .finally(() => setLoading(false));
  }, []);

  const saveAddons = async (data: Addon[]) => {
    setSaving(true);
    try {
      const serializable = data.map(({ icon, ...rest }) => rest);
      await api.put('/settings/admin/admin_addons', { value: serializable });
    } catch {}
    setSaving(false);
  };

  const toggleAddon = (id: string) => {
    const updated = addons.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAddons(updated);
    saveAddons(updated);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Gestionnaire de modules</h1>
          <p className="text-gray-2 text-sm mt-1">Activez ou desactivez les modules de votre plateforme</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-2">
          <Puzzle className="w-4 h-4" />
          {addons.filter(a => a.enabled).length} / {addons.length} actifs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {addons.map(addon => {
          const Icon = addon.icon;
          return (
            <div key={addon.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${addon.enabled ? 'bg-primary-soft text-primary' : 'bg-gray-6 text-gray-3'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <button
                  onClick={() => toggleAddon(addon.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${addon.enabled ? 'bg-primary' : 'bg-gray-5'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${addon.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-dark text-sm">{addon.name}</h3>
                <p className="text-gray-3 text-xs mt-1 leading-relaxed">{addon.description}</p>
              </div>
              <div className="mt-auto pt-2 border-t border-gray-5 flex items-center justify-between">
                <span className="text-xs text-gray-3">v{addon.version}</span>
                <span className={`text-xs font-medium ${addon.enabled ? 'text-primary' : 'text-gray-3'}`}>
                  {addon.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
