'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/ui/GoogleMapPicker'), { ssr: false });

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  staffCount: string | null;
  factoryArea: string | null;
  annualRevenue: string | null;
  capabilities: string[] | null;
  certifications: string[] | null;
  factoryImages: string[] | null;
  verified: boolean;
  status: string;
  rating: number;
  totalSales: number;
  createdAt: string;
  _count?: { products: number; followers: number };
  stats?: { totalOrders: number; totalRevenue: number };
}

export default function ShopSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shop, setShop] = useState<Shop | null>(null);

  // Champs du formulaire
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    logo: '',
    banner: '',
    // Champs fabricant
    city: '',
    country: 'CM',
    latitude: null as number | null,
    longitude: null as number | null,
    staffCount: '',
    factoryArea: '',
    annualRevenue: '',
    capabilities: '',
    certifications: '',
    factoryImages: '',
    // Champs locaux (pas encore dans l'API)
    facebook: '',
    instagram: '',
    whatsapp: '',
    returnPolicy: '',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Charger les donnees de la boutique au montage
  useEffect(() => {
    const loadShop = async () => {
      try {
        const res = await api.get<{ data: Shop }>('/shops/me');
        const s = res.data;
        setShop(s);
        setForm((prev) => ({
          ...prev,
          name: s.name || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          description: s.description || '',
          logo: s.logo || '',
          banner: s.banner || '',
          city: s.city || '',
          country: s.country || 'CM',
          latitude: s.latitude,
          longitude: s.longitude,
          staffCount: s.staffCount || '',
          factoryArea: s.factoryArea || '',
          annualRevenue: s.annualRevenue || '',
          capabilities: (s.capabilities || []).join('\n'),
          certifications: (s.certifications || []).join(', '),
          factoryImages: (s.factoryImages || []).join('\n'),
        }));
      } catch (err: any) {
        setError(err?.message || 'Impossible de charger les donnees de la boutique');
      } finally {
        setLoading(false);
      }
    };
    loadShop();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom de la boutique est requis');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        logo: form.logo || undefined,
        banner: form.banner || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        staffCount: form.staffCount || undefined,
        factoryArea: form.factoryArea || undefined,
        annualRevenue: form.annualRevenue || undefined,
        capabilities: form.capabilities ? form.capabilities.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        factoryImages: form.factoryImages ? form.factoryImages.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      };

      const res = await api.patch<{ data: Shop }>('/shops/me', payload);
      setShop(res.data);
      setSuccess('Boutique mise a jour avec succes !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

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
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Parametres de la boutique</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Informations generales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Nom de la boutique *</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Email de la boutique</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@boutique.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Adresse</label>
                <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Quartier, Ville" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Telephone</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Decrivez votre boutique..." className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Informations fabricant</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Ville</label>
                <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Douala" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Pays</label>
                <input type="text" value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="CM" className={inputClass} />
              </div>

              {/* Google Maps Picker */}
              <GoogleMapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                address={form.address}
                onLocationChange={(lat, lng, addr, city) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    ...(addr && { address: addr }),
                    ...(city && { city }),
                  }));
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Nombre d&apos;employes</label>
                <input type="text" value={form.staffCount} onChange={(e) => update('staffCount', e.target.value)} placeholder="Ex: 40+ employes" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Surface usine/entrepot</label>
                <input type="text" value={form.factoryArea} onChange={(e) => update('factoryArea', e.target.value)} placeholder="Ex: 1 200+ m²" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Chiffre d&apos;affaires annuel</label>
                <input type="text" value={form.annualRevenue} onChange={(e) => update('annualRevenue', e.target.value)} placeholder="Ex: 634K+ FCFA" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Capacites</label>
                <textarea rows={3} value={form.capabilities} onChange={(e) => update('capabilities', e.target.value)} placeholder={"Service ODM disponible\nPersonnalisation complete"} className={`${inputClass} resize-none`} />
                <p className="text-xs text-gray-3 mt-1">Une capacite par ligne</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Certifications</label>
                <input type="text" value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="CE, ISO 9001" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">Separees par des virgules</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Images usine</label>
                <textarea rows={3} value={form.factoryImages} onChange={(e) => update('factoryImages', e.target.value)} placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"} className={`${inputClass} resize-none`} />
                <p className="text-xs text-gray-3 mt-1">Une URL par ligne</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Reseaux sociaux</h2>
            <p className="text-xs text-gray-3 mb-4">Ces champs seront bientot synchronises avec l&apos;API.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Facebook</label>
                <input type="url" value={form.facebook} onChange={(e) => update('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Instagram</label>
                <input type="url" value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+237..." className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Logo de la boutique</h2>
            {form.logo && (
              <div className="mb-3 flex justify-center">
                <img src={form.logo} alt="Logo" className="w-24 h-24 rounded-lg object-cover border border-gray-5" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-3 mb-1">URL du logo</label>
              <input type="url" value={form.logo} onChange={(e) => update('logo', e.target.value)} placeholder="https://..." className={inputClass} />
              <p className="text-xs text-gray-3 mt-1">PNG, JPG (200x200px recommande)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Banniere</h2>
            {form.banner && (
              <div className="mb-3">
                <img src={form.banner} alt="Banniere" className="w-full h-20 rounded-lg object-cover border border-gray-5" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-3 mb-1">URL de la banniere</label>
              <input type="url" value={form.banner} onChange={(e) => update('banner', e.target.value)} placeholder="https://..." className={inputClass} />
              <p className="text-xs text-gray-3 mt-1">PNG, JPG (1920x400px recommande)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Politique de retour</h2>
            <textarea rows={4} value={form.returnPolicy} onChange={(e) => update('returnPolicy', e.target.value)} placeholder="Decrivez votre politique de retour..." className={`${inputClass} resize-none`} />
            <p className="text-xs text-gray-3 mt-1">Ce champ sera bientot synchronise avec l&apos;API.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-hover transition text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
