'use client';

import { useState, useEffect } from 'react';
import { Truck, MapPin, User, Pencil, Trash2, Loader2, Settings, Save, CheckCircle, XCircle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

type Tab = 'merci-e' | 'transporteurs' | 'points' | 'livreurs';

interface Transporteur {
  id: number;
  nom: string;
  fraisBase: number;
  zones: string;
  actif: boolean;
}

interface PointRetrait {
  id: number;
  nom: string;
  adresse: string;
  horaires: string;
  actif: boolean;
}

interface Livreur {
  id: number;
  nom: string;
  telephone: string;
  zone: string;
  nbLivraisons: number;
  statut: string;
}

const defaultTransporteurs: Transporteur[] = [
  { id: 1, nom: 'Express Douala', fraisBase: 1500, zones: 'Douala, Yaounde', actif: true },
  { id: 2, nom: 'Cam Livraison', fraisBase: 2000, zones: 'Tout le Cameroun', actif: true },
  { id: 3, nom: 'Rapido Express', fraisBase: 1000, zones: 'Douala', actif: false },
  { id: 4, nom: 'DHL Cameroun', fraisBase: 5000, zones: 'International', actif: true },
];

const defaultPoints: PointRetrait[] = [
  { id: 1, nom: 'Point Akwa', adresse: 'Rue Joss, Akwa, Douala', horaires: 'Lun-Sam 8h-18h', actif: true },
  { id: 2, nom: 'Point Bonanjo', adresse: 'Blvd de la Liberte, Bonanjo, Douala', horaires: 'Lun-Ven 9h-17h', actif: true },
  { id: 3, nom: 'Point Yaounde Centre', adresse: 'Av. Kennedy, Centre, Yaounde', horaires: 'Lun-Sam 8h-19h', actif: true },
  { id: 4, nom: 'Point Bali', adresse: 'Carrefour Bali, Douala', horaires: 'Lun-Dim 7h-20h', actif: false },
];

const defaultLivreurs: Livreur[] = [
  { id: 1, nom: 'Thomas Essomba', telephone: '655 123 456', zone: 'Douala - Akwa', nbLivraisons: 342, statut: 'ACTIVE' },
  { id: 2, nom: 'Pierre Ndi', telephone: '677 234 567', zone: 'Douala - Bonaberi', nbLivraisons: 218, statut: 'ACTIVE' },
  { id: 3, nom: 'Samuel Mvondo', telephone: '690 345 678', zone: 'Yaounde Centre', nbLivraisons: 156, statut: 'ACTIVE' },
  { id: 4, nom: 'Joseph Kamga', telephone: '651 456 789', zone: 'Douala - Deido', nbLivraisons: 89, statut: 'PENDING' },
  { id: 5, nom: 'Michel Tabi', telephone: '678 567 890', zone: 'Yaounde - Mvan', nbLivraisons: 45, statut: 'INACTIVE' },
];

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'merci-e', label: 'Merci E', icon: Settings },
  { key: 'transporteurs', label: 'Transporteurs', icon: Truck },
  { key: 'points', label: 'Points de retrait', icon: MapPin },
  { key: 'livreurs', label: 'Livreurs', icon: User },
];

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('merci-e');
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [pointsRetrait, setPointsRetrait] = useState<PointRetrait[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);

  // Merci E config
  const [merciEUrl, setMerciEUrl] = useState('');
  const [merciEToken, setMerciEToken] = useState('');
  const [merciEConfigured, setMerciEConfigured] = useState(false);
  const [merciESaving, setMerciESaving] = useState(false);
  const [merciEMsg, setMerciEMsg] = useState('');

  useEffect(() => {
    // Charger la config Merci E
    api.get<{ data: any }>('/settings/admin/merci_e_config')
      .then(res => {
        if (res.data) {
          setMerciEUrl(res.data.api_url || '');
          setMerciEToken(res.data.api_token || '');
          setMerciEConfigured(!!res.data.api_url && !!res.data.api_token);
        }
      })
      .catch(() => {});

    api.get<{ data: any }>('/settings/admin/admin_delivery_config')
      .then(res => {
        if (res.data) {
          if (res.data.transporteurs) setTransporteurs(res.data.transporteurs);
          else setTransporteurs(defaultTransporteurs);
          if (res.data.points) setPointsRetrait(res.data.points);
          else setPointsRetrait(defaultPoints);
          if (res.data.livreurs) setLivreurs(res.data.livreurs);
          else setLivreurs(defaultLivreurs);
        } else {
          setTransporteurs(defaultTransporteurs);
          setPointsRetrait(defaultPoints);
          setLivreurs(defaultLivreurs);
        }
      })
      .catch(() => {
        setTransporteurs(defaultTransporteurs);
        setPointsRetrait(defaultPoints);
        setLivreurs(defaultLivreurs);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveMerciEConfig() {
    setMerciESaving(true);
    setMerciEMsg('');
    try {
      await api.put('/settings/admin/merci_e_config', {
        api_url: merciEUrl,
        api_token: merciEToken,
      });
      // Aussi sauvegarder dans business_settings pour que le service les lise
      await api.put('/settings/admin/merci_e_api_url', merciEUrl);
      await api.put('/settings/admin/merci_e_api_token', merciEToken);
      setMerciEConfigured(!!merciEUrl && !!merciEToken);
      setMerciEMsg('Configuration Merci E sauvegardee');
    } catch {
      setMerciEMsg('Erreur lors de la sauvegarde');
    } finally {
      setMerciESaving(false);
    }
  }

  const toggleTransporteur = (id: number) => {
    setTransporteurs(transporteurs.map((t) => t.id === id ? { ...t, actif: !t.actif } : t));
  };

  const transporteurColumns: Column<Transporteur>[] = [
    { name: 'Nom', key: 'nom', render: (item) => <span className="font-medium text-dark">{item.nom}</span> },
    { name: 'Frais de base', key: 'fraisBase', render: (item) => <span className="font-semibold">{formatPrice(item.fraisBase)}</span> },
    { name: 'Zones couvertes', key: 'zones' },
    {
      name: 'Actif', key: 'actif',
      render: (item) => (
        <button type="button" onClick={() => toggleTransporteur(item.id)} className={`relative w-11 h-6 rounded-full transition ${item.actif ? 'bg-primary' : 'bg-gray-4'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.actif ? 'translate-x-5' : ''}`} />
        </button>
      ),
    },
    {
      name: 'Actions', key: 'actions',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const pointColumns: Column<PointRetrait>[] = [
    { name: 'Nom', key: 'nom', render: (item) => <span className="font-medium text-dark">{item.nom}</span> },
    { name: 'Adresse', key: 'adresse' },
    { name: 'Horaires', key: 'horaires' },
    {
      name: 'Actif', key: 'actif',
      render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${item.actif ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {item.actif ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      name: 'Actions', key: 'actions',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const livreurColumns: Column<Livreur>[] = [
    { name: 'Nom', key: 'nom', render: (item) => <span className="font-medium text-dark">{item.nom}</span> },
    { name: 'Telephone', key: 'telephone' },
    { name: 'Zone', key: 'zone' },
    { name: 'Nb livraisons', key: 'nbLivraisons' },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Actions', key: 'actions',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

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
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Livraison</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition border-b-2 ${
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-3 hover:text-dark'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {activeTab === 'merci-e' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-sm font-bold text-red-600">
                  ME
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark">Merci E — Partenaire de livraison</h3>
                  <p className="text-sm text-gray-3">Configurez la connexion a l&apos;API Merci E pour la livraison automatique</p>
                </div>
                {merciEConfigured ? (
                  <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4" /> Configure</span>
                ) : (
                  <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-gray-400"><XCircle className="w-4 h-4" /> Non configure</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">API URL</label>
                  <input
                    type="text"
                    placeholder="https://api.merci-e.com"
                    value={merciEUrl}
                    onChange={(e) => setMerciEUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-4 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">API Token</label>
                  <input
                    type="password"
                    placeholder="Token d'authentification Merci E"
                    value={merciEToken}
                    onChange={(e) => setMerciEToken(e.target.value)}
                    className="w-full rounded-lg border border-gray-4 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Webhook URL (a configurer dans Merci E)</label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-4 bg-gray-6 px-4 py-2.5 text-sm text-gray-2">
                    <code>{typeof window !== 'undefined' ? window.location.origin.replace(':3002', ':3001') : ''}/api/v1/delivery/webhook/merci-e</code>
                  </div>
                  <p className="mt-1 text-xs text-gray-3">Copiez cette URL dans les parametres webhook de Merci E</p>
                </div>
              </div>

              {merciEMsg && (
                <div className={`rounded-lg px-4 py-2.5 text-sm ${merciEMsg.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {merciEMsg}
                </div>
              )}

              <button
                onClick={saveMerciEConfig}
                disabled={merciESaving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {merciESaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          )}
          {activeTab === 'transporteurs' && (
            <DataTable columns={transporteurColumns} data={transporteurs} />
          )}
          {activeTab === 'points' && (
            <DataTable columns={pointColumns} data={pointsRetrait} />
          )}
          {activeTab === 'livreurs' && (
            <DataTable columns={livreurColumns} data={livreurs} />
          )}
        </div>
      </div>
    </div>
  );
}
