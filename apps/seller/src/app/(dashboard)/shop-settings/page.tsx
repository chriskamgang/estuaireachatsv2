'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Loader2, AlertCircle, CheckCircle, Plus, X, ImagePlus } from 'lucide-react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/ui/GoogleMapPicker'), { ssr: false });

// ── Options predefinies ──────────────────────────────────────

const CAPABILITIES_OPTIONS = [
  'Service ODM disponible',
  'Personnalisation complete',
  'Personnalisation mineure',
  'Livraison rapide',
  'Livraison nationale',
  'Garantie disponible',
  'Garantie constructeur',
  'Service apres-vente',
  'Installation a domicile',
  'Echantillons disponibles',
  'Gestion qualite',
  'Inspection produit fini',
  'Echange sous 7 jours',
  'Grandes marques',
  'Toutes tailles disponibles',
];

const CERTIFICATIONS_OPTIONS = ['CE', 'ISO 9001', 'ISO 14001', 'FCC', 'RoHS', 'OEKO-TEX', 'SGS'];

const RESPONSE_TIME_OPTIONS = [
  { value: '<=1h', label: '1h ou moins' },
  { value: '<=2h', label: '2h ou moins' },
  { value: '<=4h', label: '4h ou moins' },
  { value: '<=8h', label: '8h ou moins' },
  { value: '<=24h', label: '24h ou moins' },
];

// ── Interface ────────────────────────────────────────────────

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
  yearsActive: number;
  responseTime: string | null;
  deliveryRate: number;
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

// ── Composant ────────────────────────────────────────────────

export default function ShopSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shop, setShop] = useState<Shop | null>(null);
  const factoryImagesInputRef = useRef<HTMLInputElement>(null);

  // Champs du formulaire
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    logo: '',
    banner: '',
    city: '',
    country: 'CM',
    latitude: null as number | null,
    longitude: null as number | null,
    // Champs fabricant
    staffCount: '',
    factoryArea: '',
    annualRevenue: '',
    yearsActive: '',
    responseTime: '',
    deliveryRate: '',
    // Champs locaux (pas encore dans l'API)
    facebook: '',
    instagram: '',
    whatsapp: '',
    returnPolicy: '',
  });

  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [factoryImages, setFactoryImages] = useState<string[]>([]);

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
          yearsActive: s.yearsActive ? String(s.yearsActive) : '',
          responseTime: s.responseTime || '',
          deliveryRate: s.deliveryRate ? String(s.deliveryRate) : '',
        }));
        setCapabilities(Array.isArray(s.capabilities) ? s.capabilities : []);
        setCertifications(Array.isArray(s.certifications) ? s.certifications : []);
        setFactoryImages(Array.isArray(s.factoryImages) ? s.factoryImages : []);
      } catch (err: any) {
        setError(err?.message || 'Impossible de charger les donnees de la boutique');
      } finally {
        setLoading(false);
      }
    };
    loadShop();
  }, []);

  // ── Factory images handlers ──────────────────────────────────
  const addFactoryImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;
    fileArr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFactoryImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFactoryImage = (index: number) => {
    setFactoryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Capabilities toggle ──────────────────────────────────────
  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  // ── Certifications toggle ────────────────────────────────────
  const toggleCertification = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  // ── Submit ───────────────────────────────────────────────────
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
        yearsActive: form.yearsActive ? parseInt(form.yearsActive, 10) : undefined,
        responseTime: form.responseTime || undefined,
        deliveryRate: form.deliveryRate ? parseFloat(form.deliveryRate) : undefined,
        capabilities: capabilities.length > 0 ? capabilities : [],
        certifications: certifications.length > 0 ? certifications : [],
        factoryImages: factoryImages.length > 0 ? factoryImages : [],
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
  const labelClass = 'block text-sm font-medium text-gray-1 mb-1.5';

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
          {/* ── Informations generales ────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Informations generales</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom de la boutique *</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email de la boutique</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@boutique.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Quartier, Ville" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telephone</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Decrivez votre boutique..." className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>

          {/* ── Informations Fabricant ────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Informations Fabricant</h2>
            <p className="text-sm text-gray-3 mb-5">Ces informations seront affichees sur votre profil fabricant visible par les acheteurs.</p>

            <div className="space-y-4">
              {/* Ville & Pays */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ville</label>
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Douala" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pays</label>
                  <input type="text" value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="CM" className={inputClass} />
                </div>
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

              {/* Nombre d'employes & Surface */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre d&apos;employes</label>
                  <input type="text" value={form.staffCount} onChange={(e) => update('staffCount', e.target.value)} placeholder="Ex: 10+ employes" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Surface usine/atelier</label>
                  <input type="text" value={form.factoryArea} onChange={(e) => update('factoryArea', e.target.value)} placeholder="Ex: 150+ m2" className={inputClass} />
                </div>
              </div>

              {/* CA annuel & Annees d'activite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Chiffre d&apos;affaires annuel</label>
                  <input type="text" value={form.annualRevenue} onChange={(e) => update('annualRevenue', e.target.value)} placeholder="Ex: 18M+ FCFA" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Annees d&apos;activite</label>
                  <input type="number" min={0} value={form.yearsActive} onChange={(e) => update('yearsActive', e.target.value)} placeholder="Ex: 5" className={inputClass} />
                </div>
              </div>

              {/* Temps de reponse & Taux de livraison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Temps de reponse</label>
                  <select value={form.responseTime} onChange={(e) => update('responseTime', e.target.value)} className={inputClass}>
                    <option value="">-- Selectionner --</option>
                    {RESPONSE_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Taux de livraison a temps</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={form.deliveryRate}
                      onChange={(e) => update('deliveryRate', e.target.value)}
                      placeholder="Ex: 98.5"
                      className={inputClass}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-3 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              {/* Capacites — checkboxes */}
              <div>
                <label className={labelClass}>Capacites</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {CAPABILITIES_OPTIONS.map((cap) => (
                    <label key={cap} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={capabilities.includes(cap)}
                        onChange={() => toggleCapability(cap)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <span className="text-sm text-gray-2 group-hover:text-dark">{cap}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Certifications — tags toggle */}
              <div>
                <label className={labelClass}>Certifications</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CERTIFICATIONS_OPTIONS.map((cert) => {
                    const active = certifications.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCertification(cert)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          active
                            ? 'bg-primary text-white border-primary'
                            : 'bg-gray-50 text-gray-2 border-gray-200 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {active && <span className="mr-1">&#10003;</span>}
                        {cert}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Images usine/atelier — upload */}
              <div>
                <label className={labelClass}>Images usine/atelier</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {factoryImages.map((img, index) => (
                    <div key={index} className="relative group w-24 h-24">
                      <img
                        src={img}
                        alt={`Usine ${index + 1}`}
                        className="w-24 h-24 rounded-lg object-cover border border-gray-5"
                      />
                      <button
                        type="button"
                        onClick={() => removeFactoryImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {factoryImages.length < 10 && (
                    <div
                      onClick={() => factoryImagesInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary"
                    >
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Ajouter</span>
                    </div>
                  )}
                </div>
                <input
                  ref={factoryImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFactoryImageFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <p className="text-xs text-gray-3 mt-2">JPG, PNG. Maximum 10 images. Photos de votre usine, atelier, entrepot.</p>
              </div>
            </div>
          </div>

          {/* ── Reseaux sociaux ───────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Reseaux sociaux</h2>
            <p className="text-xs text-gray-3 mb-4">Ces champs seront bientot synchronises avec l&apos;API.</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Facebook</label>
                <input type="url" value={form.facebook} onChange={(e) => update('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input type="url" value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+237..." className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Logo ─────────────────────────────────────────── */}
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

          {/* ── Banniere ─────────────────────────────────────── */}
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

          {/* ── Politique de retour ──────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Politique de retour</h2>
            <textarea rows={4} value={form.returnPolicy} onChange={(e) => update('returnPolicy', e.target.value)} placeholder="Decrivez votre politique de retour..." className={`${inputClass} resize-none`} />
            <p className="text-xs text-gray-3 mt-1">Ce champ sera bientot synchronise avec l&apos;API.</p>
          </div>

          {/* ── Bouton sauvegarder ───────────────────────────── */}
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
