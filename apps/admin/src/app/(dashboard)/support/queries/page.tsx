'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Check, Eye, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Query {
  id: number;
  produit: string;
  question: string;
  client: string;
  reponse: string | null;
  statut: string;
  date: string;
  product?: { name: string };
  user?: { name: string };
  answer?: string | null;
  status?: string;
  createdAt?: string;
}

interface ReplyModalProps {
  query: Query;
  onClose: () => void;
  onReply: (id: number, reponse: string) => void;
}

function ReplyModal({ query, onClose, onReply }: ReplyModalProps) {
  const [reponse, setReponse] = useState(query.answer || query.reponse || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">Question client</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-gray-3 mb-0.5">Produit</p>
            <p className="text-sm font-medium text-dark">{query.product?.name || query.produit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-3 mb-0.5">Question de {query.user?.name || query.client}</p>
            <div className="bg-gray-6/50 rounded-lg p-3">
              <p className="text-sm text-gray-1">{query.question}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Reponse</label>
            <textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              rows={4}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Entrez votre reponse ici..."
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">
            Annuler
          </button>
          <button
            onClick={() => { if (reponse.trim()) { onReply(query.id, reponse); onClose(); } }}
            className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Publier la reponse
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Query | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Query[] }>('/support/queries');
      setQueries(res.data);
    } catch (err) {
      console.error('Erreur chargement questions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getStatus = (q: Query) => q.status || q.statut;
  const getAnswer = (q: Query) => q.answer || q.reponse;

  const filtered = statusFilter ? queries.filter((q) => getStatus(q) === statusFilter) : queries;

  const handleReply = async (id: number, reponse: string) => {
    try {
      await api.patch(`/support/queries/${id}/answer`, { answer: reponse });
      loadData();
    } catch (err) {
      console.error('Erreur reponse:', err);
    }
  };

  const columns: Column<Query>[] = [
    {
      name: 'Produit', key: 'produit', render: (item) => (
        <span className="font-medium text-dark max-w-[180px] block truncate">{item.product?.name || item.produit}</span>
      ),
    },
    {
      name: 'Question', key: 'question', render: (item) => (
        <span className="text-gray-2 text-sm max-w-[220px] block truncate">{item.question}</span>
      ),
    },
    { name: 'Client', key: 'client', render: (item) => <span className="text-gray-1">{item.user?.name || item.client}</span> },
    {
      name: 'Reponse', key: 'reponse', render: (item) => (
        getAnswer(item)
          ? <span className="flex items-center gap-1 text-success text-xs"><Check className="w-3.5 h-3.5" /> Repondu</span>
          : <span className="text-warning text-xs font-medium">En attente</span>
      ),
    },
    { name: 'Date', key: 'date', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.createdAt || item.date)}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={getStatus(item)} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <button
          onClick={() => setSelected(item)}
          className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"
          title={getAnswer(item) ? 'Voir' : 'Repondre'}
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selected && (
        <ReplyModal query={selected} onClose={() => setSelected(null)} onReply={handleReply} />
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Questions Produits</h1>
          <p className="text-sm text-gray-3">
            {queries.filter((q) => getStatus(q) === 'PENDING').length} questions en attente de reponse
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total questions', val: queries.length, color: 'bg-info-soft text-info' },
          { label: 'En attente', val: queries.filter((q) => getStatus(q) === 'PENDING').length, color: 'bg-warning-soft text-warning' },
          { label: 'Repondues', val: queries.filter((q) => getStatus(q) === 'COMPLETED').length, color: 'bg-success-soft text-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="COMPLETED">Repondues</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
      </div>
    </div>
  );
}
