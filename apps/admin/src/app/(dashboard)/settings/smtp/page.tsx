'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const defaultSmtp = { host: 'smtp.gmail.com', port: '587', username: 'noreply@estuaireachats.cm', password: '', encryption: 'TLS', fromName: 'EstuaireAchats', fromEmail: 'noreply@estuaireachats.cm' };

export default function SmtpPage() {
  const [form, setForm] = useState(defaultSmtp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_smtp')
      .then((res) => { if (res.data) setForm({ ...defaultSmtp, ...res.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_smtp', { value: form });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };
  const handleTestEmail = () => { setTestSending(true); setTimeout(() => setTestSending(false), 1500); };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">SMTP / Notifications</h1>
          <p className="text-sm text-gray-3">Configuration du serveur de messagerie</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-5">
        <h2 className="text-lg font-bold text-dark">Configuration SMTP</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Host SMTP</label><input type="text" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Port</label><input type="text" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Utilisateur</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Mot de passe</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="••••••••" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-2 mb-1">Chiffrement</label>
          <select value={form.encryption} onChange={(e) => setForm({ ...form, encryption: e.target.value })} className={inputClass}>
            <option value="TLS">TLS</option><option value="SSL">SSL</option><option value="NONE">Aucun</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom expediteur</label><input type="text" value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-2 mb-1">Email expediteur</label><input type="email" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} className={inputClass} /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">
        <h2 className="text-lg font-bold text-dark">Tester l envoi</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1"><label className="block text-sm font-medium text-gray-2 mb-1">Email de test</label><input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={inputClass} placeholder="test@example.com" /></div>
          <button onClick={handleTestEmail} disabled={!testEmail || testSending} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
            <Send className="w-4 h-4" /> {testSending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
