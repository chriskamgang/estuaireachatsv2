'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string | null;
  lastMessage?: { content: string; createdAt: string; senderId: string } | null;
  unreadCount?: number;
  otherUser?: { id: string; firstName: string; lastName: string };
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function ConversationsPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get<any>('/chat/conversations');
      if (Array.isArray(res.data || res)) {
        setConversations(res.data || res);
      }
    } catch (err) {
      console.error('Erreur conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await api.get<any>(`/chat/messages/${convId}`);
      if (Array.isArray(res.data || res)) {
        setMessages(res.data || res);
      }
      // Mark as read
      await api.post(`/chat/mark-read/${convId}`).catch(() => {});
    } catch (err) {
      console.error('Erreur messages:', err);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchMessages(selectedId);

    // Polling every 5s
    pollRef.current = setInterval(() => fetchMessages(selectedId), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      const conv = conversations.find((c) => c.id === selectedId);
      if (!conv || !conv.otherUser) return;
      await api.post('/chat/send', {
        receiverId: (conv.otherUser as any).id,
        content: newMessage,
      });
      setNewMessage('');
      await fetchMessages(selectedId);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const name = c.otherUser ? `${c.otherUser.firstName} ${c.otherUser.lastName}` : '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
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
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Conversations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-5">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-6 rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="divide-y divide-gray-5 max-h-[500px] overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-8">Aucune conversation</p>
            ) : (
              filteredConversations.map((conv) => {
                const name = conv.otherUser ? `${conv.otherUser.firstName} ${conv.otherUser.lastName}` : 'Utilisateur';
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left p-4 hover:bg-gray-6 transition ${selectedId === conv.id ? 'bg-gray-6' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark">{name}</span>
                      <span className="text-xs text-gray-3">{conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                    </div>
                    <p className={`text-xs mt-1 truncate ${(conv.unreadCount || 0) > 0 ? 'text-dark font-medium' : 'text-gray-3'}`}>
                      {conv.lastMessage?.content || conv.subject || 'Nouvelle conversation'}
                    </p>
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm flex flex-col min-h-[500px]">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-4 mx-auto mb-3" />
                <p className="text-gray-3 text-sm">Selectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-5">
                <p className="font-medium text-dark">
                  {selectedConv?.otherUser ? `${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}` : 'Conversation'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === selectedConv?.receiverId ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                      msg.senderId === selectedConv?.receiverId
                        ? 'bg-gray-6 text-dark'
                        : 'bg-primary text-white'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.senderId === selectedConv?.receiverId ? 'text-gray-3' : 'text-white/70'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-5 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tapez votre message..."
                  className="flex-1 bg-gray-6 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-primary text-white p-2 rounded-lg hover:bg-primary-hover transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
