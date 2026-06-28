'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  } | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    logo: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const convParam = searchParams.get('conv');
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(convParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ data: Conversation[] }>('/chat/conversations')
      .then((res) => {
        const convs = res.data || [];
        setConversations(convs);
        if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    api.get<{ data: Message[] }>(`/chat/messages/${activeConvId}`)
      .then((res) => setMessages(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const getReceiverId = (conv: Conversation | undefined) => {
    if (!conv || !user) return '';
    return conv.senderId === user.id ? conv.receiverId : conv.senderId;
  };
  const getDisplayName = (conv: Conversation | undefined) => {
    if (!conv) return '';
    if (conv.shop?.name) return conv.shop.name;
    const u = conv.otherUser;
    return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur' : 'Utilisateur';
  };
  const getAvatar = (conv: Conversation | undefined) => {
    if (!conv) return '';
    return conv.shop?.logo || conv.otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(conv).slice(0, 2))}&background=E82328&color=fff&size=40&bold=true`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const receiverId = getReceiverId(activeConv);
      const res = await api.post<{ data: Message }>('/chat/send', {
        receiverId,
        content: newMessage.trim(),
      });
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      }
      setNewMessage('');
    } catch {
    } finally {
      setSending(false);
    }
  };

  if (loadingConvs) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Messagerie</h1>
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Messagerie</h1>
        <div className="flex flex-col items-center py-16">
          <MessageSquare size={48} className="mb-4 text-gray-4" />
          <p className="text-lg font-medium text-gray-2">Aucun message</p>
          <p className="mt-1 text-sm text-gray-3">
            Vos conversations avec les vendeurs apparaitront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <h1 className="border-b border-gray-5 px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl font-bold text-dark">Messagerie</h1>

      <div className="flex flex-col md:flex-row" style={{ minHeight: '400px' }}>
        {/* Conversation list */}
        <div className="w-full md:w-[300px] shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-5 max-h-[200px] md:max-h-[520px]">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
                activeConvId === conv.id ? 'bg-orange/5' : 'hover:bg-gray-6'
              )}
            >
              <img
                src={getAvatar(conv)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-dark">
                    {getDisplayName(conv)}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-3">
                    {conv.lastMessage?.createdAt ? timeAgo(conv.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-3">{conv.lastMessage?.content || ''}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Message thread */}
        {activeConv ? (
          <div className="flex min-w-0 flex-1 flex-col min-h-[300px] md:min-h-0">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-gray-5 px-3 sm:px-5 py-3">
              <img
                src={getAvatar(activeConv)}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-dark">{getDisplayName(activeConv)}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-3 sm:px-5 py-4">
              {loadingMsgs ? (
                <div className="flex h-full items-center justify-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange border-t-transparent" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-xl px-4 py-2.5',
                          isMe
                            ? 'rounded-br-sm bg-orange text-white'
                            : 'rounded-bl-sm bg-gray-6 text-dark'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn(
                            'mt-1 text-right text-[10px]',
                            isMe ? 'text-white/70' : 'text-gray-3'
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 border-t border-gray-5 px-3 sm:px-5 py-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ecrire un message..."
                className="flex-1 rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange text-white transition-colors hover:bg-orange-light disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-3">
            Selectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}
