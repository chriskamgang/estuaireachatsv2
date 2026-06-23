'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';

interface NewsletterEntry {
  id: string;
  titre: string;
  cible: string;
  type: string;
  nbDestinataires: number;
  createdAt: string;
}

const cibleLabels: Record<string, string> = {
  tous: 'Tous',
  clients: 'Clients',
  vendeurs: 'Vendeurs',
};

const typeLabels: Record<string, string> = {
  email: 'Email',
  push: 'Push',
  both: 'Email + Push',
};

export default function NewsletterPage() {
  const [history, setHistory] = useState<NewsletterEntry[]>([]);
  const [form, setForm] = useState({ titre: '', message: '', cible: 'tous', type: 'email' });
  const [sending, setSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get<{ data: NewsletterEntry[] }>('/subscribers/newsletter/history');
      if (res.data && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch {
      // silently fail, start with empty history
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post<{ data: NewsletterEntry }>('/subscribers/newsletter/send', {
        titre: form.titre,
        message: form.message,
        cible: form.cible,
        type: form.type,
      });

      if (res.data) {
        setHistory([res.data, ...history]);
        setSuccess(`Newsletter envoyee a ${res.data.nbDestinataires} destinataire(s)`);
      }
      setForm({ titre: '', message: '', cible: 'tous', type: 'email' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const columns: Column<NewsletterEntry>[] = [
    { name: 'Titre', key: 'titre', render: (item) => <span className="font-medium text-dark">{item.titre}</span> },
    {
      name: 'Cible', key: 'cible',
      render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.cible === 'tous' ? 'bg-blue-50 text-blue-600' : item.cible === 'clients' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
        }`}>
          {cibleLabels[item.cible] || item.cible}
        </span>
      ),
    },
    { name: 'Type', key: 'type', render: (item) => typeLabels[item.type] || item.type },
    { name: 'Date envoi', key: 'createdAt', render: (item) => formatDateTime(item.createdAt) },
    { name: 'Destinataires', key: 'nbDestinataires', render: (item) => item.nbDestinataires.toLocaleString('fr-FR') },
  ];

  if (pageLoading) {
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
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Newsletter & Notifications</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Envoyer une notification</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-2 mb-1">Titre</label>
            <input type="text" required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Titre de la notification..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-2 mb-1">Message</label>
            <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" placeholder="Contenu du message..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-2 mb-1">Cible</label>
              <select value={form.cible} onChange={(e) => setForm({ ...form, cible: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="tous">Tous</option>
                <option value="clients">Clients</option>
                <option value="vendeurs">Vendeurs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-2 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="both">Email + Push</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={sending} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-60">
            <Send className="w-4 h-4" />
            {sending ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">Historique des envois</h2>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-3">Aucun envoi pour le moment</div>
        ) : (
          <DataTable columns={columns} data={history} />
        )}
      </div>
    </div>
  );
}
