'use client';

import { useState, useEffect } from 'react';
import { Monitor, Save, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface HomepageVariant {
  id: string;
  name: string;
  description: string;
  sections: { label: string; color: string; height: string }[];
}

const variants: HomepageVariant[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Page d\'accueil e-commerce standard avec hero banner, categories et produits.',
    sections: [
      { label: 'Hero Banner', color: 'bg-primary/20', height: 'h-12' },
      { label: 'Categories', color: 'bg-blue-100', height: 'h-6' },
      { label: 'Produits', color: 'bg-gray-200', height: 'h-10' },
      { label: 'Promo', color: 'bg-orange-100', height: 'h-6' },
      { label: 'Footer', color: 'bg-gray-300', height: 'h-4' },
    ],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Axee multi-vendeurs avec mise en avant des boutiques et vendeurs.',
    sections: [
      { label: 'Slider', color: 'bg-primary/20', height: 'h-10' },
      { label: 'Top Vendeurs', color: 'bg-green-100', height: 'h-8' },
      { label: 'Categories', color: 'bg-blue-100', height: 'h-6' },
      { label: 'Boutiques', color: 'bg-purple-100', height: 'h-8' },
      { label: 'Produits', color: 'bg-gray-200', height: 'h-8' },
      { label: 'Footer', color: 'bg-gray-300', height: 'h-4' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Design epure et minimaliste, focus sur les produits.',
    sections: [
      { label: 'Hero', color: 'bg-primary/10', height: 'h-14' },
      { label: 'Produits', color: 'bg-gray-100', height: 'h-16' },
      { label: 'Footer', color: 'bg-gray-200', height: 'h-4' },
    ],
  },
];

export default function SelectHomepagePage() {
  const [selected, setSelected] = useState('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_select_homepage')
      .then((res) => { if (res.data?.selected) setSelected(res.data.selected); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_select_homepage', { value: { selected } });
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
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Selectionner la page d&apos;accueil</h1>
            <p className="text-sm text-gray-3">Choisissez le style de page d&apos;accueil pour votre site</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => setSelected(variant.id)}
            className={`bg-white rounded-xl shadow-sm p-5 text-left transition border-2 ${
              selected === variant.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-5'
            }`}
          >
            {/* Radio indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === variant.id ? 'border-primary' : 'border-gray-5'
              }`}>
                {selected === variant.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <h3 className="text-base font-bold text-dark">{variant.name}</h3>
            </div>

            {/* Wireframe preview */}
            <div className="border border-gray-5 rounded-lg p-3 mb-4 space-y-1.5">
              {variant.sections.map((section, i) => (
                <div key={i} className={`${section.color} ${section.height} rounded flex items-center justify-center`}>
                  <span className="text-[10px] text-gray-2 font-medium">{section.label}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-3">{variant.description}</p>

            {selected === variant.id && (
              <div className="mt-3 text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-full inline-block">
                Actuellement selectionne
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
