'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, Save, X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SMSTemplate {
  id: number;
  nom: string;
  type: string;
  canal: string;
  contenu: string;
  langue: string;
  actif: boolean;
}

const VARIABLES = ['{{code}}', '{{expiration}}', '{{nom}}', '{{plateforme}}', '{{telephone}}'];

const initialTemplates: SMSTemplate[] = [
  {
    id: 1,
    nom: 'Inscription - SMS',
    type: 'INSCRIPTION',
    canal: 'SMS',
    contenu: 'Bienvenue sur EstuaireAchats ! Votre code de verification est : {{code}}. Valable {{expiration}} minutes. Ne le partagez jamais.',
    langue: 'fr',
    actif: true,
  },
  {
    id: 2,
    nom: 'Paiement - SMS',
    type: 'PAIEMENT',
    canal: 'SMS',
    contenu: 'EstuaireAchats - Code de confirmation paiement : {{code}}. Expire dans {{expiration}} min. Si vous n\'avez pas initie ce paiement, contactez-nous.',
    langue: 'fr',
    actif: true,
  },
  {
    id: 3,
    nom: 'Mot de passe - SMS',
    type: 'MOT_DE_PASSE',
    canal: 'SMS',
    contenu: 'Bonjour {{nom}}, votre code de reinitialisation de mot de passe EstuaireAchats est : {{code}}. Valable {{expiration}} minutes.',
    langue: 'fr',
    actif: true,
  },
  {
    id: 4,
    nom: 'Connexion 2FA - SMS',
    type: 'CONNEXION',
    canal: 'SMS',
    contenu: '{{plateforme}} : Votre code de connexion est {{code}}. Expire dans {{expiration}} min. Ne communiquez jamais ce code.',
    langue: 'fr',
    actif: false,
  },
  {
    id: 5,
    nom: 'Inscription - Email',
    type: 'INSCRIPTION',
    canal: 'EMAIL',
    contenu: 'Bonjour {{nom}},\n\nVotre code de verification EstuaireAchats est :\n\n{{code}}\n\nCe code expire dans {{expiration}} minutes.\n\nL\'equipe EstuaireAchats',
    langue: 'fr',
    actif: true,
  },
];

type TabId = 'INSCRIPTION' | 'PAIEMENT' | 'CONNEXION' | 'MOT_DE_PASSE';
const TABS: { id: TabId; label: string }[] = [
  { id: 'INSCRIPTION', label: 'Inscription' },
  { id: 'PAIEMENT', label: 'Paiement' },
  { id: 'CONNEXION', label: 'Connexion 2FA' },
  { id: 'MOT_DE_PASSE', label: 'Mot de passe' },
];

export default function OTPTemplatesPage() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('INSCRIPTION');

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_otp_templates')
      .then((res) => { if (res.data && Array.isArray(res.data)) setTemplates(res.data); else setTemplates(initialTemplates); })
      .catch(() => { setTemplates(initialTemplates); })
      .finally(() => setLoading(false));
  }, []);

  const saveTemplates = async (data: SMSTemplate[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_otp_templates', { value: data });
    } catch {}
    setSaving(false);
  };
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<SMSTemplate> | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const filtered = templates.filter((t) => t.type === activeTab);

  const openCreate = () => {
    setEditing({ nom: '', type: activeTab, canal: 'SMS', contenu: '', langue: 'fr', actif: true });
    setShowModal(true);
  };

  const openEdit = (t: SMSTemplate) => {
    setEditing({ ...t });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editing?.nom?.trim() || !editing?.contenu?.trim()) return;
    let updated: SMSTemplate[];
    if (editing.id) {
      updated = templates.map((t) => t.id === editing.id ? { ...editing } as SMSTemplate : t);
      setSavedId(editing.id);
      setTimeout(() => setSavedId(null), 2000);
    } else {
      const newT = { ...editing, id: Date.now() } as SMSTemplate;
      updated = [...templates, newT];
    }
    setTemplates(updated);
    saveTemplates(updated);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer ce template ?')) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const toggleActive = (id: number) => {
    const updated = templates.map((t) => t.id === id ? { ...t, actif: !t.actif } : t);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const insertVariable = (v: string) => {
    setEditing((prev) => prev ? { ...prev, contenu: (prev.contenu || '') + v } : prev);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Templates SMS / Email OTP</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau template
        </button>
      </div>

      {/* Info variables */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium mb-2">Variables disponibles dans les templates :</p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code key={v} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{v}</code>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-6 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white shadow-sm text-primary' : 'text-gray-2 hover:text-dark'}`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-gray-3">({templates.filter(t => t.type === tab.id).length})</span>
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-10 h-10 text-gray-4 mx-auto mb-3" />
            <p className="text-sm text-gray-3">Aucun template pour ce type</p>
            <button onClick={openCreate} className="mt-2 text-sm text-primary hover:underline">Creer le premier template</button>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${t.actif ? 'border-primary' : 'border-gray-4'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.canal === 'SMS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.canal}
                  </span>
                  <h3 className="font-bold text-dark">{t.nom}</h3>
                  {savedId === t.id && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(t.id)}
                    className={`relative w-10 h-5 rounded-full transition ${t.actif ? 'bg-primary' : 'bg-gray-4'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.actif ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-6/50 rounded-lg p-3 mb-4 font-mono text-sm text-gray-2 whitespace-pre-wrap">
                {t.contenu}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-2 border border-gray-5 rounded-lg hover:bg-gray-6 transition">
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
                <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-danger border border-red-200 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
                <span className="ml-auto text-xs text-gray-3">Langue: {t.langue.toUpperCase()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-dark">{editing.id ? 'Modifier le template' : 'Nouveau template'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom du template</label>
                <input type="text" value={editing.nom || ''} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} placeholder="Ex: Verification inscription SMS" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Canal</label>
                  <select value={editing.canal || 'SMS'} onChange={(e) => setEditing({ ...editing, canal: e.target.value })} className={inputClass}>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Langue</label>
                  <select value={editing.langue || 'fr'} onChange={(e) => setEditing({ ...editing, langue: e.target.value })} className={inputClass}>
                    <option value="fr">Francais</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>Contenu du message</label>
                  <div className="flex gap-1">
                    {VARIABLES.map((v) => (
                      <button key={v} type="button" onClick={() => insertVariable(v)} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono hover:bg-blue-100 transition">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={editing.contenu || ''}
                  onChange={(e) => setEditing({ ...editing, contenu: e.target.value })}
                  rows={5}
                  placeholder="Contenu du message OTP..."
                  className={`${inputClass} font-mono`}
                />
                <p className="text-xs text-gray-3 mt-1">{(editing.contenu || '').length} caracteres</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, actif: !editing.actif })}
                  className={`relative w-11 h-6 rounded-full transition ${editing.actif ? 'bg-primary' : 'bg-gray-4'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editing.actif ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-medium text-gray-2">Template actif</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-5 text-gray-2 rounded-lg text-sm hover:bg-gray-6 transition">Annuler</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
