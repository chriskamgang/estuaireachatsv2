'use client';

import { useState, useEffect } from 'react';
import { Lock, Save, Check, Monitor, Columns2, Maximize, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const btnClass = 'flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium';

const layouts = [
  { id: 'classic', name: 'Classic', desc: 'Formulaire centre sur un fond uni', icon: Monitor },
  { id: 'split', name: 'Split', desc: 'Image a gauche, formulaire a droite', icon: Columns2 },
  { id: 'full', name: 'Full', desc: 'Image plein ecran avec formulaire en overlay', icon: Maximize },
] as const;

type LayoutStyle = typeof layouts[number]['id'];

const defaultAuthLayout = {
  layoutStyle: 'split' as LayoutStyle,
  bgImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
  overlayColor: '#000000',
  overlayOpacity: 40,
  welcomeText: 'Bienvenue sur EstuaireAchats',
  showSocialLogin: true,
  showRememberMe: true,
};

export default function Page() {
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(defaultAuthLayout.layoutStyle);
  const [bgImage, setBgImage] = useState(defaultAuthLayout.bgImage);
  const [overlayColor, setOverlayColor] = useState(defaultAuthLayout.overlayColor);
  const [overlayOpacity, setOverlayOpacity] = useState(defaultAuthLayout.overlayOpacity);
  const [welcomeText, setWelcomeText] = useState(defaultAuthLayout.welcomeText);
  const [showSocialLogin, setShowSocialLogin] = useState(defaultAuthLayout.showSocialLogin);
  const [showRememberMe, setShowRememberMe] = useState(defaultAuthLayout.showRememberMe);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_auth_layout')
      .then((res) => {
        if (res.data) {
          setLayoutStyle(res.data.layoutStyle ?? defaultAuthLayout.layoutStyle);
          setBgImage(res.data.bgImage ?? defaultAuthLayout.bgImage);
          setOverlayColor(res.data.overlayColor ?? defaultAuthLayout.overlayColor);
          setOverlayOpacity(res.data.overlayOpacity ?? defaultAuthLayout.overlayOpacity);
          setWelcomeText(res.data.welcomeText ?? defaultAuthLayout.welcomeText);
          setShowSocialLogin(res.data.showSocialLogin ?? defaultAuthLayout.showSocialLogin);
          setShowRememberMe(res.data.showRememberMe ?? defaultAuthLayout.showRememberMe);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_auth_layout', { value: { layoutStyle, bgImage, overlayColor, overlayOpacity, welcomeText, showSocialLogin, showRememberMe } });
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
          <h1 className="text-2xl font-bold text-dark">Layout d'authentification</h1>
          <p className="text-gray-2 text-sm mt-1">Configurez l'apparence des pages de connexion et inscription</p>
        </div>
        <Lock className="w-5 h-5 text-gray-3" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg">Style de layout</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layouts.map(layout => {
            const Icon = layout.icon;
            const selected = layoutStyle === layout.id;
            return (
              <button
                key={layout.id}
                onClick={() => setLayoutStyle(layout.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${selected ? 'border-primary bg-primary-soft' : 'border-gray-5 hover:border-gray-3'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selected ? 'bg-primary text-white' : 'bg-gray-6 text-gray-3'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-dark'}`}>{layout.name}</h3>
                <p className="text-xs text-gray-3 mt-1">{layout.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg">Image et overlay</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">URL de l'image de fond</label>
            <input value={bgImage} onChange={e => setBgImage(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-dark">Couleur de l'overlay</label>
              <div className="flex items-center gap-3">
                <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-5 cursor-pointer" />
                <input type="text" value={overlayColor} onChange={e => setOverlayColor(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-dark">Opacite de l'overlay ({overlayOpacity}%)</label>
              <input type="range" min={0} max={100} value={overlayOpacity} onChange={e => setOverlayOpacity(Number(e.target.value))} className="w-full mt-2" />
            </div>
          </div>
          {bgImage && (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-5">
              <img src={bgImage} alt="Apercu" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-semibold text-lg drop-shadow">{welcomeText}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg">Contenu et options</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium text-dark">Texte de bienvenue</label>
          <input value={welcomeText} onChange={e => setWelcomeText(e.target.value)} className={inputClass} placeholder="Bienvenue sur..." />
        </div>
        <div className="space-y-3 pt-2">
          {[
            { label: 'Connexion sociale', desc: 'Afficher les boutons Google, Facebook, etc.', enabled: showSocialLogin, toggle: () => setShowSocialLogin(!showSocialLogin) },
            { label: 'Se souvenir de moi', desc: 'Afficher la case "Se souvenir de moi"', enabled: showRememberMe, toggle: () => setShowRememberMe(!showRememberMe) },
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

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className={`${btnClass} disabled:opacity-50`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Sauvegarde !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
