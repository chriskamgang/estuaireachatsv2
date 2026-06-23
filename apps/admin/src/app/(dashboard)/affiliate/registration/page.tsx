'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface FormField {
  id: number;
  nom: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
  label: string;
  requis: boolean;
  placeholder: string;
}

export default function AffiliateRegistrationPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    inscriptionOuverte: true,
    approbationAuto: false,
    commissionDefaut: '5',
    commissionType: 'POURCENTAGE',
    niveaux: '1',
    commissionNiveau2: '2',
    commissionNiveau3: '1',
    texteIntro: 'Rejoignez notre programme d\'affiliation et gagnez des commissions en recommandant nos produits a votre reseau.',
    texteConditions: 'En vous inscrivant, vous acceptez nos conditions generales d\'affiliation.',
    cookieDuree: '30',
    montantMinRetrait: '5000',
    delaiPaiement: '30',
  });

  const [fields, setFields] = useState<FormField[]>([
    { id: 1, nom: 'nom', type: 'text', label: 'Nom complet', requis: true, placeholder: 'Votre nom complet' },
    { id: 2, nom: 'email', type: 'email', label: 'Adresse email', requis: true, placeholder: 'votre@email.com' },
    { id: 3, nom: 'telephone', type: 'tel', label: 'Telephone', requis: true, placeholder: '+237 6XX XX XX XX' },
    { id: 4, nom: 'site_web', type: 'text', label: 'Site web / Reseaux sociaux', requis: false, placeholder: 'https://...' },
    { id: 5, nom: 'motivation', type: 'textarea', label: 'Comment comptez-vous promouvoir nos produits ?', requis: false, placeholder: 'Decrivez votre strategie...' },
  ]);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');

  useEffect(() => {
    api.get<{ data: { config: typeof config; fields: FormField[] } }>('/settings/admin/admin_affiliate_registration')
      .then(res => {
        if (res.data) {
          if (res.data.config) setConfig(res.data.config);
          if (res.data.fields) setFields(res.data.fields);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string | boolean) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    setFields((prev) => [...prev, {
      id: Date.now(),
      nom: newFieldLabel.toLowerCase().replace(/\s+/g, '_'),
      type: newFieldType,
      label: newFieldLabel,
      requis: false,
      placeholder: '',
    }]);
    setNewFieldLabel('');
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleRequired = (id: number) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, requis: !f.requis } : f));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_affiliate_registration', { value: { config, fields } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  const Toggle = ({ field, label, hint }: { field: string; label: string; hint?: string }) => (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <div>
        <span className="text-sm font-medium text-gray-2">{label}</span>
        {hint && <p className="text-xs text-gray-3">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => set(field, !(config as Record<string, unknown>)[field] as boolean)}
        className={`relative w-11 h-6 rounded-full transition ${(config as Record<string, unknown>)[field] ? 'bg-primary' : 'bg-gray-4'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(config as Record<string, unknown>)[field] ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );

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
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Formulaire d&apos;inscription affilie</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Parametres generaux */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Parametres generaux</h2>
          <div className="space-y-4 max-w-2xl">
            <Toggle field="inscriptionOuverte" label="Inscription ouverte" hint="Permettre aux nouveaux utilisateurs de s'inscrire en tant qu'affilie" />
            <Toggle field="approbationAuto" label="Approbation automatique" hint="Approuver automatiquement les nouvelles inscriptions" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className={labelClass}>Commission par defaut</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={config.commissionDefaut}
                    onChange={(e) => set('commissionDefaut', e.target.value)}
                    className={inputClass}
                  />
                  <select
                    value={config.commissionType}
                    onChange={(e) => set('commissionType', e.target.value)}
                    className="border border-gray-5 rounded-lg px-2 py-2 text-sm outline-none"
                  >
                    <option value="POURCENTAGE">%</option>
                    <option value="FIXE">FCFA</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Montant min. retrait (FCFA)</label>
                <input type="number" min={0} value={config.montantMinRetrait} onChange={(e) => set('montantMinRetrait', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Delai paiement (jours)</label>
                <input type="number" min={1} value={config.delaiPaiement} onChange={(e) => set('delaiPaiement', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Duree cookie (jours)</label>
                <input type="number" min={1} value={config.cookieDuree} onChange={(e) => set('cookieDuree', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre de niveaux</label>
                <select value={config.niveaux} onChange={(e) => set('niveaux', e.target.value)} className={inputClass}>
                  <option value="1">1 niveau</option>
                  <option value="2">2 niveaux</option>
                  <option value="3">3 niveaux</option>
                </select>
              </div>
            </div>
            {Number(config.niveaux) >= 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Commission niveau 2 (%)</label>
                  <input type="number" min={0} value={config.commissionNiveau2} onChange={(e) => set('commissionNiveau2', e.target.value)} className={inputClass} />
                </div>
                {Number(config.niveaux) >= 3 && (
                  <div>
                    <label className={labelClass}>Commission niveau 3 (%)</label>
                    <input type="number" min={0} value={config.commissionNiveau3} onChange={(e) => set('commissionNiveau3', e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Textes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Textes du formulaire</h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className={labelClass}>Texte d&apos;introduction</label>
              <textarea value={config.texteIntro} onChange={(e) => set('texteIntro', e.target.value)} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Texte conditions d&apos;utilisation</label>
              <textarea value={config.texteConditions} onChange={(e) => set('texteConditions', e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Champs du formulaire */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-5">Champs du formulaire d&apos;inscription</h2>
          <div className="space-y-2 mb-4">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-6/50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-dark">{field.label}</span>
                  <span className="ml-2 text-xs text-gray-3">({field.type})</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.requis}
                    onChange={() => toggleRequired(field.id)}
                    className="w-4 h-4 accent-primary"
                  />
                  Requis
                </label>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="p-1 rounded hover:bg-gray-5 text-gray-3 hover:text-danger transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-3 max-w-lg">
            <div className="flex-1">
              <label className={labelClass}>Nouveau champ</label>
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Nom du champ..."
                className={inputClass}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as FormField['type'])} className={inputClass}>
                <option value="text">Texte</option>
                <option value="email">Email</option>
                <option value="tel">Telephone</option>
                <option value="textarea">Zone de texte</option>
                <option value="select">Liste deroulante</option>
                <option value="checkbox">Case a cocher</option>
              </select>
            </div>
            <button type="button" onClick={addField} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Enregistre !' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
