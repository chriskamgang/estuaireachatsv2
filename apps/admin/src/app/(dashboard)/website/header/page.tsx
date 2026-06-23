'use client';

import { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Trash2, Save, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const btnClass = 'flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium';

interface NavLink {
  label: string;
  url: string;
}

const defaultHeaderData = {
  logoUrl: '/logo.png',
  siteName: 'EstuaireAchats',
  topbarText: 'Bienvenue sur EstuaireAchats - Livraison gratuite a partir de 50 000 FCFA',
  topbarEnabled: true,
  stickyHeader: true,
  searchEnabled: true,
  navLinks: [
    { label: 'Accueil', url: '/' },
    { label: 'Categories', url: '/categories' },
    { label: 'Promotions', url: '/deals' },
    { label: 'Vendre', url: '/seller/register' },
    { label: 'Contact', url: '/contact' },
  ] as NavLink[],
};

export default function Page() {
  const [logoUrl, setLogoUrl] = useState(defaultHeaderData.logoUrl);
  const [siteName, setSiteName] = useState(defaultHeaderData.siteName);
  const [topbarText, setTopbarText] = useState(defaultHeaderData.topbarText);
  const [topbarEnabled, setTopbarEnabled] = useState(defaultHeaderData.topbarEnabled);
  const [stickyHeader, setStickyHeader] = useState(defaultHeaderData.stickyHeader);
  const [searchEnabled, setSearchEnabled] = useState(defaultHeaderData.searchEnabled);
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultHeaderData.navLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_header')
      .then((res) => {
        if (res.data) {
          setLogoUrl(res.data.logoUrl ?? defaultHeaderData.logoUrl);
          setSiteName(res.data.siteName ?? defaultHeaderData.siteName);
          setTopbarText(res.data.topbarText ?? defaultHeaderData.topbarText);
          setTopbarEnabled(res.data.topbarEnabled ?? defaultHeaderData.topbarEnabled);
          setStickyHeader(res.data.stickyHeader ?? defaultHeaderData.stickyHeader);
          setSearchEnabled(res.data.searchEnabled ?? defaultHeaderData.searchEnabled);
          setNavLinks(res.data.navLinks ?? defaultHeaderData.navLinks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addNavLink = () => setNavLinks(prev => [...prev, { label: '', url: '' }]);
  const updateNavLink = (idx: number, field: 'label' | 'url', value: string) => {
    setNavLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };
  const removeNavLink = (idx: number) => setNavLinks(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_header', { value: { logoUrl, siteName, topbarText, topbarEnabled, stickyHeader, searchEnabled, navLinks } });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-5'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Configuration du header</h1>
          <p className="text-gray-2 text-sm mt-1">Personnalisez l'en-tete de votre site</p>
        </div>
        <LayoutTemplate className="w-5 h-5 text-gray-3" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg">Informations generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">URL du logo</label>
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputClass} placeholder="/logo.png" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">Nom du site</label>
            <input value={siteName} onChange={e => setSiteName(e.target.value)} className={inputClass} placeholder="Mon site" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-dark">Texte de la barre superieure</label>
          <input value={topbarText} onChange={e => setTopbarText(e.target.value)} className={inputClass} placeholder="Texte promotionnel..." />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg">Options</h2>
        <div className="space-y-3">
          {[
            { label: 'Barre superieure activee', desc: 'Afficher la barre promotionnelle en haut du site', enabled: topbarEnabled, toggle: () => setTopbarEnabled(!topbarEnabled) },
            { label: 'Header fixe (sticky)', desc: 'Le header reste visible au scroll', enabled: stickyHeader, toggle: () => setStickyHeader(!stickyHeader) },
            { label: 'Barre de recherche', desc: 'Afficher la barre de recherche dans le header', enabled: searchEnabled, toggle: () => setSearchEnabled(!searchEnabled) },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-5 last:border-0">
              <div>
                <p className="text-sm font-medium text-dark">{item.label}</p>
                <p className="text-xs text-gray-3 mt-0.5">{item.desc}</p>
              </div>
              <Toggle enabled={item.enabled} onChange={item.toggle} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-dark text-lg">Liens de navigation</h2>
          <button onClick={addNavLink} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary/80 transition">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {navLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input value={link.label} onChange={e => updateNavLink(idx, 'label', e.target.value)} className={inputClass} placeholder="Label" />
              <input value={link.url} onChange={e => updateNavLink(idx, 'url', e.target.value)} className={inputClass} placeholder="URL" />
              <button onClick={() => removeNavLink(idx)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {navLinks.length === 0 && <p className="text-sm text-gray-3 text-center py-4">Aucun lien de navigation</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className={`${btnClass} disabled:opacity-50`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Sauvegarde !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
