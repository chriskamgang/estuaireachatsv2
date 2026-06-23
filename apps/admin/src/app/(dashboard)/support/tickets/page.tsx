'use client';

import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Eye, CheckCircle, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Ticket {
  id: number;
  ref: string;
  sujet: string;
  client: string;
  email: string;
  priorite: string;
  statut: string;
  date: string;
  messages: number;
  createdAt?: string;
  subject?: string;
  user?: { name: string; email: string };
  priority?: string;
  status?: string;
  _count?: { messages: number };
}

const prioriteColor: Record<string, string> = {
  HAUTE: 'bg-danger-soft text-danger',
  HIGH: 'bg-danger-soft text-danger',
  NORMALE: 'bg-warning-soft text-warning',
  NORMAL: 'bg-warning-soft text-warning',
  MEDIUM: 'bg-warning-soft text-warning',
  BASSE: 'bg-info-soft text-info',
  LOW: 'bg-info-soft text-info',
};

const TABS = [
  { label: 'Tous', value: '' },
  { label: 'Ouverts', value: 'OPEN' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Fermes', value: 'CLOSED' },
];

interface DetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (id: number, statut: string) => void;
}

function TicketDetailModal({ ticket, onClose, onStatusChange }: DetailModalProps) {
  const status = ticket.status || ticket.statut;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <div>
            <h2 className="text-lg font-bold text-dark">{ticket.ref}</h2>
            <p className="text-xs text-gray-3">{ticket.subject || ticket.sujet}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-3 mb-0.5">Client</p>
              <p className="text-sm font-medium text-dark">{ticket.user?.name || ticket.client}</p>
              <p className="text-xs text-gray-3">{ticket.user?.email || ticket.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3 mb-0.5">Date</p>
              <p className="text-sm font-medium text-dark">{formatDate(ticket.createdAt || ticket.date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3 mb-0.5">Priorite</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${prioriteColor[ticket.priority || ticket.priorite] || 'bg-gray-5 text-gray-2'}`}>
                {ticket.priority || ticket.priorite}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-3 mb-0.5">Messages</p>
              <p className="text-sm font-medium text-dark">{ticket._count?.messages ?? ticket.messages} message(s)</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Changer le statut</label>
            <div className="flex gap-2">
              {status !== 'IN_PROGRESS' && (
                <button
                  onClick={() => { onStatusChange(ticket.id, 'IN_PROGRESS'); onClose(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-info-soft text-info rounded-lg hover:bg-info/20 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> En cours
                </button>
              )}
              {status !== 'CLOSED' && (
                <button
                  onClick={() => { onStatusChange(ticket.id, 'CLOSED'); onClose(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-success-soft text-success rounded-lg hover:bg-success/20 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Ticket[] }>('/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getStatus = (t: Ticket) => t.status || t.statut;

  const filtered = activeTab ? tickets.filter((t) => getStatus(t) === activeTab) : tickets;

  const handleStatusChange = async (id: number, statut: string) => {
    try {
      await api.patch(`/support/tickets/${id}/status`, { status: statut });
      loadData();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const counts = {
    '': tickets.length,
    OPEN: tickets.filter((t) => getStatus(t) === 'OPEN').length,
    IN_PROGRESS: tickets.filter((t) => getStatus(t) === 'IN_PROGRESS').length,
    CLOSED: tickets.filter((t) => getStatus(t) === 'CLOSED').length,
  };

  const columns: Column<Ticket>[] = [
    { name: 'Ref', key: 'ref', render: (item) => <code className="text-xs font-mono text-primary">{item.ref}</code> },
    { name: 'Sujet', key: 'sujet', render: (item) => <span className="font-medium text-dark max-w-[220px] block truncate">{item.subject || item.sujet}</span> },
    { name: 'Client', key: 'client', render: (item) => (
      <div>
        <p className="text-sm text-gray-1">{item.user?.name || item.client}</p>
        <p className="text-xs text-gray-3">{item.user?.email || item.email}</p>
      </div>
    )},
    { name: 'Priorite', key: 'priorite', render: (item) => (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${prioriteColor[item.priority || item.priorite] || 'bg-gray-5 text-gray-2'}`}>
        {item.priority || item.priorite}
      </span>
    )},
    { name: 'Messages', key: 'messages', render: (item) => (
      <span className="inline-block px-2 py-0.5 bg-gray-6 rounded-full text-xs text-gray-2">{item._count?.messages ?? item.messages}</span>
    )},
    { name: 'Date', key: 'date', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.createdAt || item.date)}</span> },
    { name: 'Statut', key: 'statut', render: (item) => { const s = getStatus(item); return <StatusBadge status={s === 'OPEN' ? 'PENDING' : s === 'IN_PROGRESS' ? 'PROCESSING' : 'COMPLETED'} />; } },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <button
          onClick={() => setSelected(item)}
          className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"
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
        <TicketDetailModal ticket={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Tickets Support</h1>
          <p className="text-sm text-gray-3">{tickets.length} tickets au total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-3 hover:text-gray-1'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.value ? 'bg-primary-soft text-primary' : 'bg-gray-6 text-gray-3'}`}>
                {counts[tab.value as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
      </div>
    </div>
  );
}
