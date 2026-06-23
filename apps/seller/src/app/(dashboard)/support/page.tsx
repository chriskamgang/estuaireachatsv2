'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Eye, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<SupportTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'NORMAL' });
  const perPage = 10;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/support/tickets/me?page=${page}&perPage=${perPage}`);
      if (res.data) {
        setTickets(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await api.post('/support/tickets', form);
      setShowModal(false);
      setForm({ subject: '', description: '', priority: 'NORMAL' });
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const priorityLabel = (p: string) => {
    const map: Record<string, string> = { HIGH: 'Haute', NORMAL: 'Moyenne', LOW: 'Basse' };
    return map[p] || p;
  };

  const columns: Column<SupportTicket>[] = [
    { name: 'Sujet', key: 'subject', render: (item) => <span className="font-medium text-dark">{item.subject}</span> },
    { name: 'Priorite', key: 'priority', render: (item) => (
      <span className={`text-xs font-medium ${item.priority === 'HIGH' ? 'text-danger' : item.priority === 'NORMAL' ? 'text-warning' : 'text-gray-3'}`}>
        {priorityLabel(item.priority)}
      </span>
    )},
    { name: 'Date', key: 'createdAt', render: (item) => formatDate(item.createdAt) },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
    {
      name: 'Action', key: 'action',
      render: (item) => (
        <button onClick={() => setShowDetail(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Tickets de support</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={tickets} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Nouveau ticket</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Sujet</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Priorite</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="LOW">Basse</option>
                  <option value="NORMAL">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button onClick={handleCreate} disabled={saving} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium">
                {saving ? 'Envoi...' : 'Creer le ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Detail du ticket</h3>
              <button onClick={() => setShowDetail(null)}><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-3">Sujet</p>
                <p className="text-sm font-medium text-dark">{showDetail.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-3">Description</p>
                <p className="text-sm text-gray-2">{showDetail.description}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-3">Priorite</p>
                  <p className="text-sm">{priorityLabel(showDetail.priority)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-3">Statut</p>
                  <StatusBadge status={showDetail.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-3">Date</p>
                  <p className="text-sm">{formatDate(showDetail.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
