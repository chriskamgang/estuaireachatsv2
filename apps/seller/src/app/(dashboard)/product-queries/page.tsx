'use client';

import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, MessageSquare, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Query {
  id: string;
  productId: string;
  userId: string;
  question: string;
  answer: string | null;
  createdAt: string;
}

export default function ProductQueriesPage() {
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState<Query[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const perPage = 10;

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/support/queries/seller?page=${page}&perPage=${perPage}`);
      if (res.data) {
        setQueries(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error('Erreur chargement questions:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const handleReply = async () => {
    if (!replyId || !replyText.trim()) return;
    setReplying(true);
    try {
      await api.patch(`/support/queries/seller/${replyId}/answer`, { answer: replyText });
      setReplyId(null);
      setReplyText('');
      await fetchQueries();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setReplying(false);
    }
  };

  const columns: Column<Query>[] = [
    { name: 'Question', key: 'question', render: (item) => <span className="text-sm text-gray-2 line-clamp-2">{item.question}</span> },
    { name: 'Date', key: 'createdAt', render: (item) => formatDate(item.createdAt) },
    {
      name: 'Statut', key: 'answer', render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${item.answer ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
          {item.answer ? 'Repondu' : 'En attente'}
        </span>
      ),
    },
    {
      name: 'Action', key: 'action',
      render: (item) => !item.answer ? (
        <button
          onClick={() => { setReplyId(item.id); setReplyText(''); }}
          className="p-1.5 rounded-lg hover:bg-gray-6 text-primary transition"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      ) : (
        <span className="text-xs text-gray-3 line-clamp-1">{item.answer}</span>
      ),
    },
  ];

  if (loading && queries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Questions produits</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={queries} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>

      {replyId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Repondre a la question</h3>
              <button onClick={() => setReplyId(null)}><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-6 p-3 rounded-lg">
                <p className="text-sm text-gray-2">{queries.find((q) => q.id === replyId)?.question}</p>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Votre reponse..."
                rows={4}
                className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleReply} disabled={replying || !replyText.trim()} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium">
                {replying ? 'Envoi...' : 'Envoyer la reponse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
