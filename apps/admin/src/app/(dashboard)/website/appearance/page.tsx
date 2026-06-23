'use client';

import { useState, useEffect } from 'react';
import { PaintBucket, Save, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const btnClass = 'flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium';

const defaultAppearance = { primaryColor: '#E82328', secondaryColor: '#4A90D9', accentColor: '#FF6A00', fontFamily: 'Inter', borderRadius: 'rounded', darkMode: false };

export default function Page() {
  const [primaryColor, setPrimaryColor] = useState(defaultAppearance.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(defaultAppearance.secondaryColor);
  const [accentColor, setAccentColor] = useState(defaultAppearance.accentColor);
  const [fontFamily, setFontFamily] = useState(defaultAppearance.fontFamily);
  const [borderRadius, setBorderRadius] = useState(defaultAppearance.borderRadius);
  const [darkMode, setDarkMode] = useState(defaultAppearance.darkMode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_appearance')
      .then((res) => {
        if (res.data) {
          setPrimaryColor(res.data.primaryColor ?? defaultAppearance.primaryColor);
          setSecondaryColor(res.data.secondaryColor ?? defaultAppearance.secondaryColor);
          setAccentColor(res.data.accentColor ?? defaultAppearance.accentColor);
          setFontFamily(res.data.fontFamily ?? defaultAppearance.fontFamily);
          setBorderRadius(res.data.borderRadius ?? defaultAppearance.borderRadius);
          setDarkMode(res.data.darkMode ?? defaultAppearance.darkMode);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_appearance', { value: { primaryColor, secondaryColor, accentColor, fontFamily, borderRadius, darkMode } });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Apparence</h1>
          <p className="text-gray-2 text-sm mt-1">Personnalisez l'apparence de votre site</p>
        </div>
        <PaintBucket className="w-5 h-5 text-gray-3" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-dark text-lg">Couleurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Couleur primaire', value: primaryColor, set: setPrimaryColor },
            { label: 'Couleur secondaire', value: secondaryColor, set: setSecondaryColor },
            { label: 'Couleur accent', value: accentColor, set: setAccentColor },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-2">
              <label className="text-sm font-medium text-dark">{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-5 cursor-pointer"
                />
                <input
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-dark text-lg">Typographie et style</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark">Police de caracteres</label>
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className={inputClass}>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark">Style des bordures</label>
            <select value={borderRadius} onChange={e => setBorderRadius(e.target.value)} className={inputClass}>
              <option value="rounded">Arrondi (rounded)</option>
              <option value="sharp">Angulaire (sharp)</option>
              <option value="pill">Pilule (pill)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-dark">Mode sombre</h2>
            <p className="text-gray-3 text-sm mt-1">Activer le mode sombre pour l'interface publique</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-5'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-dark text-lg mb-4">Apercu</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-lg border border-gray-5" style={{ backgroundColor: primaryColor }} />
          <div className="w-16 h-16 rounded-lg border border-gray-5" style={{ backgroundColor: secondaryColor }} />
          <div className="w-16 h-16 rounded-lg border border-gray-5" style={{ backgroundColor: accentColor }} />
          <div className="text-sm text-gray-2 ml-2" style={{ fontFamily }}>
            Police : {fontFamily} | Bordures : {borderRadius} | Dark : {darkMode ? 'Oui' : 'Non'}
          </div>
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
