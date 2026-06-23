'use client';

import { useState, useEffect } from 'react';
import { LayoutTemplate, GripVertical, Save, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Section {
  id: string;
  name: string;
  enabled: boolean;
}

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
}

const initialSections: Section[] = [
  { id: 'hero', name: 'Hero Banner', enabled: true },
  { id: 'flash', name: 'Flash Deals', enabled: true },
  { id: 'categories', name: 'Categories en vedette', enabled: true },
  { id: 'arrivals', name: 'Nouveaux produits', enabled: true },
  { id: 'bestsellers', name: 'Meilleures ventes', enabled: true },
  { id: 'brands', name: 'Marques', enabled: false },
  { id: 'testimonials', name: 'Temoignages', enabled: false },
  { id: 'newsletter', name: 'Newsletter', enabled: true },
];

const initialBanners: Banner[] = [
  { id: 1, title: 'Promo ete 2026', imageUrl: '/banners/summer-2026.jpg', link: '/promotions/ete' },
  { id: 2, title: 'Nouveaux vendeurs', imageUrl: '/banners/new-sellers.jpg', link: '/vendeurs' },
];

export default function HomepagePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '' });

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_homepage')
      .then((res) => {
        if (res.data) {
          setSections(res.data.sections || initialSections);
          setBanners(res.data.banners || initialBanners);
        } else {
          setSections(initialSections);
          setBanners(initialBanners);
        }
      })
      .catch(() => { setSections(initialSections); setBanners(initialBanners); })
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const addBanner = () => {
    if (!newBanner.title) return;
    setBanners((prev) => [...prev, { ...newBanner, id: Date.now() }]);
    setNewBanner({ title: '', imageUrl: '', link: '' });
  };

  const removeBanner = (id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_homepage', { value: { sections, banners } });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Configuration de la page d&apos;accueil</h1>
            <p className="text-sm text-gray-3">Gerez les sections et bannieres affichees</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Sections de la page</h2>
        <p className="text-sm text-gray-3 mb-4">Activez, desactivez et reordonnez les sections de la page d&apos;accueil.</p>
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={section.id} className="flex items-center gap-3 border border-gray-5 rounded-lg px-4 py-3">
              <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="text-gray-3 hover:text-primary disabled:opacity-30 transition cursor-grab">
                <GripVertical className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-3 w-6 text-center">{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-dark">{section.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="text-xs text-gray-3 hover:text-primary disabled:opacity-30">&#9650;</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="text-xs text-gray-3 hover:text-primary disabled:opacity-30">&#9660;</button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={section.enabled} onChange={() => toggleSection(section.id)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-5 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Gestion des bannieres</h2>

        <div className="space-y-3 mb-6">
          {banners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 border border-gray-5 rounded-lg px-4 py-3">
              <div className="w-16 h-10 bg-gray-6 rounded flex items-center justify-center text-xs text-gray-3 overflow-hidden">IMG</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{banner.title}</p>
                <p className="text-xs text-gray-3 truncate">{banner.imageUrl}</p>
              </div>
              <p className="text-xs text-gray-3 hidden sm:block">{banner.link}</p>
              <button onClick={() => removeBanner(banner.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {banners.length === 0 && <p className="text-sm text-gray-3 text-center py-4">Aucune banniere configuree</p>}
        </div>

        <div className="border-t border-gray-5 pt-4">
          <h3 className="text-sm font-semibold text-gray-2 mb-3">Ajouter une banniere</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Titre" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            <input type="text" placeholder="URL de l'image" value={newBanner.imageUrl} onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            <input type="text" placeholder="Lien" value={newBanner.link} onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <button onClick={addBanner} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium mt-3">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
