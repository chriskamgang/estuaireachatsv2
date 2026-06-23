'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Eye, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Conversation {
  id: number;
  product?: { name: string };
  buyer?: { firstName: string; lastName: string };
  seller?: { firstName: string; lastName: string };
  shop?: { name: string };
  lastMessage?: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  id: number;
  content: string;
  sender: { firstName: string; lastName: string; role: string };
  createdAt: string;
}

function ConvModal({ convId, onClose }: { convId: number; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Message[] }>(`/chat/messages/${convId}`)
      .then((res) => setMessages(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [convId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">Conversation #{convId}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-3 py-8">Aucun message</p>
          ) : (
            messages.map((msg) => {
              const isSeller = msg.sender?.role === 'SELLER';
              return (
                <div key={msg.id} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isSeller ? 'bg-primary-soft text-primary' : 'bg-gray-6 text-gray-1'} rounded-2xl px-4 py-2.5`}>
                    <p className={`text-[10px] font-semibold mb-0.5 ${isSeller ? 'text-primary/70' : 'text-gray-3'}`}>{msg.sender?.firstName} {msg.sender?.lastName}</p>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${isSeller ? 'text-primary/50' : 'text-gray-3'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-5">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ data: Conversation[] }>('/chat/conversations')
      .then((res) => setConversations(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.product?.name?.toLowerCase().includes(s) ||
      `${c.buyer?.firstName} ${c.buyer?.lastName}`.toLowerCase().includes(s) ||
      c.shop?.name?.toLowerCase().includes(s)
    );
  });

  const columns: Column<Conversation>[] = [
    { name: 'Produit', key: 'product', render: (item) => <span className="font-medium text-dark max-w-[200px] block truncate">{item.product?.name || '-'}</span> },
    { name: 'Acheteur', key: 'buyer', render: (item) => <span className="text-gray-1">{item.buyer?.firstName} {item.buyer?.lastName}</span> },
    { name: 'Vendeur', key: 'seller', render: (item) => <span className="text-gray-1">{item.shop?.name || `${item.seller?.firstName || ''} ${item.seller?.lastName || ''}`}</span> },
    { name: 'Messages', key: 'messageCount', render: (item) => <span className="flex items-center gap-1.5 text-gray-2"><MessageCircle className="w-3.5 h-3.5" />{item.messageCount || 0}</span> },
    { name: 'Dernier message', key: 'lastMessage', render: (item) => <span className="text-gray-2 text-xs max-w-[180px] block truncate italic">{item.lastMessage ? `"${item.lastMessage}"` : '-'}</span> },
    { name: 'Date', key: 'updatedAt', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.updatedAt || item.createdAt)}</span> },
    { name: 'Actions', key: 'actions', render: (item) => (
      <button onClick={() => setSelectedId(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {selectedId && <ConvModal convId={selectedId} onClose={() => setSelectedId(null)} />}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><MessageCircle className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Conversations Produits</h1>
          <p className="text-sm text-gray-3">{conversations.length} conversations</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[280px]"
          placeholder="Rechercher par produit, acheteur ou vendeur..." />
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
      </div>
    </div>
  );
}
