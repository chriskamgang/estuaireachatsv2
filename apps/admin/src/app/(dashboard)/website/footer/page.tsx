'use client';

import { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Trash2, Save, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const btnClass = 'flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const defaultColumns: FooterColumn[] = [
  { title: 'A propos', links: [{ label: 'Qui sommes-nous', url: '/about' }, { label: 'Contact', url: '/contact' }, { label: 'Carrieres', url: '/careers' }] },
  { title: 'Aide', links: [{ label: 'FAQ', url: '/faq' }, { label: 'Livraison', url: '/shipping-policy' }, { label: 'Retours', url: '/returns' }] },
  { title: 'Legal', links: [{ label: 'CGU', url: '/terms' }, { label: 'Confidentialite', url: '/privacy' }] },
  { title: 'Mon compte', links: [{ label: 'Connexion', url: '/login' }, { label: 'Inscription', url: '/register' }, { label: 'Mes commandes', url: '/orders' }] },
];

const defaultCopyright = '2026 EstuaireAchats. Tous droits reserves.';
const defaultSocial = { facebook: 'https://facebook.com', instagram: 'https://instagram.com', twitter: 'https://twitter.com' };

export default function Page() {
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [copyright, setCopyright] = useState(defaultCopyright);
  const [social, setSocial] = useState(defaultSocial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_website_footer')
      .then((res) => {
        if (res.data) {
          setColumns(res.data.columns || defaultColumns);
          setCopyright(res.data.copyright || defaultCopyright);
          setSocial(res.data.social || defaultSocial);
        } else {
          setColumns(defaultColumns);
        }
      })
      .catch(() => { setColumns(defaultColumns); })
      .finally(() => setLoading(false));
  }, []);

  const updateColumnTitle = (idx: number, title: string) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, title } : c));
  };

  const addLink = (colIdx: number) => {
    setColumns(prev => prev.map((c, i) => i === colIdx ? { ...c, links: [...c.links, { label: '', url: '' }] } : c));
  };

  const updateLink = (colIdx: number, linkIdx: number, field: 'label' | 'url', value: string) => {
    setColumns(prev => prev.map((c, i) => i === colIdx ? { ...c, links: c.links.map((l, j) => j === linkIdx ? { ...l, [field]: value } : l) } : c));
  };

  const removeLink = (colIdx: number, linkIdx: number) => {
    setColumns(prev => prev.map((c, i) => i === colIdx ? { ...c, links: c.links.filter((_, j) => j !== linkIdx) } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_website_footer', { value: { columns, copyright, social } });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Configuration du footer</h1>
          <p className="text-gray-2 text-sm mt-1">Gerez les colonnes, liens et informations du pied de page</p>
        </div>
        <LayoutTemplate className="w-5 h-5 text-gray-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-2 uppercase tracking-wider">Colonne {colIdx + 1}</label>
              <input value={col.title} onChange={e => updateColumnTitle(colIdx, e.target.value)} className={inputClass} placeholder="Titre de la colonne" />
            </div>
            <div className="space-y-2">
              {col.links.map((link, linkIdx) => (
                <div key={linkIdx} className="flex items-center gap-2">
                  <input value={link.label} onChange={e => updateLink(colIdx, linkIdx, 'label', e.target.value)} className={inputClass} placeholder="Label" />
                  <input value={link.url} onChange={e => updateLink(colIdx, linkIdx, 'url', e.target.value)} className={inputClass} placeholder="URL" />
                  <button onClick={() => removeLink(colIdx, linkIdx)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => addLink(colIdx)} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary/80 transition">
              <Plus className="w-4 h-4" /> Ajouter un lien
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-dark text-lg flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> Section bas de page
        </h2>
        <div className="space-y-1">
          <label className="text-sm font-medium text-dark">Texte de copyright</label>
          <input value={copyright} onChange={e => setCopyright(e.target.value)} className={inputClass} placeholder="(c) 2026 MonSite..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">Facebook</label>
            <input value={social.facebook} onChange={e => setSocial({ ...social, facebook: e.target.value })} className={inputClass} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">Instagram</label>
            <input value={social.instagram} onChange={e => setSocial({ ...social, instagram: e.target.value })} className={inputClass} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark">Twitter</label>
            <input value={social.twitter} onChange={e => setSocial({ ...social, twitter: e.target.value })} className={inputClass} placeholder="https://twitter.com/..." />
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
