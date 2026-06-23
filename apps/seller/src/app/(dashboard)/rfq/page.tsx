'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Send, Loader2, MessageCircle, Clock, CheckCircle,
  XCircle, Search, X, Eye, ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';

interface RFQ {
  id: string;
  buyerName: string;
  buyerEmail?: string;
  productName?: string;
  quantity: number;
  details: string;
  status: 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'REJECTED';
  quotedPrice?: number;
  message?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'QUOTED', label: 'Devis envoye' },
  { key: 'ACCEPTED', label: 'Acceptees' },
  { key: 'REJECTED', label: 'Refusees' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; bgClass: string; textClass: string }> = {
  PENDING: { label: 'En attente', icon: Clock, bgClass: 'bg-warning-soft', textClass: 'text-warning' },
  QUOTED: { label: 'Devis envoye', icon: Send, bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
  ACCEPTED: { label: 'Acceptee', icon: CheckCircle, bgClass: 'bg-success-soft', textClass: 'text-success' },
  REJECTED: { label: 'Refusee', icon: XCircle, bgClass: 'bg-red-50', textClass: 'text-red-500' },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function RFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/rfq/seller');
      const data = Array.isArray(res) ? res : res.data || [];
      setRfqs(data);
    } catch (err) {
      console.error('Erreur chargement RFQ:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  const filtered = useMemo(() => {
    return rfqs.filter((r) => {
      if (activeTab !== 'all' && r.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.buyerName.toLowerCase().includes(q) &&
          !(r.productName || '').toLowerCase().includes(q) &&
          !r.details.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rfqs, activeTab, search]);

  const stats = useMemo(() => ({
    total: rfqs.length,
    pending: rfqs.filter((r) => r.status === 'PENDING').length,
    quoted: rfqs.filter((r) => r.status === 'QUOTED').length,
    accepted: rfqs.filter((r) => r.status === 'ACCEPTED').length,
  }), [rfqs]);

  const handleRespond = async () => {
    if (!selectedRfq || !responseMessage.trim()) return;
    setSubmitting(true);
    try {
      const body: { message: string; quotedPrice?: number } = {
        message: responseMessage.trim(),
      };
      if (quotedPrice) {
        body.quotedPrice = parseFloat(quotedPrice);
      }
      await api.patch(`/rfq/${selectedRfq.id}/respond`, body);
      setSelectedRfq(null);
      setResponseMessage('');
      setQuotedPrice('');
      await fetchRfqs();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi de la reponse');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setResponseMessage('');
    setQuotedPrice('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Detail / respond view
  if (selectedRfq) {
    const rfq = selectedRfq;
    const canRespond = rfq.status === 'PENDING';

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedRfq(null)}
          className="flex items-center gap-2 text-sm text-gray-2 hover:text-dark transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux demandes
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Demande de devis</h1>
            <p className="text-sm text-gray-3">De {rfq.buyerName} - {formatDate(rfq.createdAt)}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={rfq.status} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-3 mb-1">Acheteur</p>
              <p className="text-sm font-medium text-dark">{rfq.buyerName}</p>
              {rfq.buyerEmail && <p className="text-xs text-gray-3 mt-0.5">{rfq.buyerEmail}</p>}
            </div>
            {rfq.productName && (
              <div>
                <p className="text-xs text-gray-3 mb-1">Produit demande</p>
                <p className="text-sm font-medium text-dark">{rfq.productName}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-3 mb-1">Quantite</p>
              <p className="text-sm font-medium text-dark">{rfq.quantity} unite(s)</p>
            </div>
            <div>
              <p className="text-xs text-gray-3 mb-1">Date de la demande</p>
              <p className="text-sm font-medium text-dark">{formatDate(rfq.createdAt)}</p>
            </div>
          </div>

          <div className="border-t border-gray-5 pt-4">
            <p className="text-xs text-gray-3 mb-2">Details de la demande</p>
            <div className="bg-gray-6 rounded-lg p-4">
              <p className="text-sm text-gray-2 whitespace-pre-wrap">{rfq.details}</p>
            </div>
          </div>

          {rfq.quotedPrice && (
            <div className="border-t border-gray-5 pt-4">
              <p className="text-xs text-gray-3 mb-1">Prix propose</p>
              <p className="text-lg font-bold text-primary">{formatPrice(rfq.quotedPrice)}</p>
            </div>
          )}

          {rfq.message && (
            <div className="border-t border-gray-5 pt-4">
              <p className="text-xs text-gray-3 mb-2">Votre reponse</p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-dark whitespace-pre-wrap">{rfq.message}</p>
              </div>
            </div>
          )}

          {rfq.conversationId && (
            <div className="border-t border-gray-5 pt-4">
              <Link
                href={`/conversations?id=${rfq.conversationId}`}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition"
              >
                <MessageCircle className="w-4 h-4" />
                Voir la conversation
              </Link>
            </div>
          )}
        </div>

        {canRespond && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Repondre a la demande</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Prix propose (optionnel)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-3 font-medium">FCFA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Message <span className="text-primary">*</span>
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Redigez votre reponse au client..."
                  rows={5}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <button
                onClick={handleRespond}
                disabled={submitting || !responseMessage.trim()}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? 'Envoi en cours...' : 'Envoyer la reponse'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Demandes de devis</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total demandes', value: stats.total, color: 'text-dark' },
          { label: 'En attente', value: stats.pending, color: 'text-warning' },
          { label: 'Devis envoyes', value: stats.quoted, color: 'text-blue-600' },
          { label: 'Acceptees', value: stats.accepted, color: 'text-success' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-2 hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
          <input
            type="text"
            placeholder="Rechercher par acheteur, produit ou details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-4 mx-auto mb-3" />
          <p className="text-gray-3 text-sm">Aucune demande de devis trouvee</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Acheteur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Produit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Quantite</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-5">
                {filtered.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-6/50 transition">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-dark">{rfq.buyerName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-2">{rfq.productName || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark font-medium">{rfq.quantity}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-sm text-gray-2 line-clamp-2">{rfq.details}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rfq.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-3">{formatDate(rfq.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetail(rfq)}
                          className="p-1.5 hover:bg-gray-6 rounded-lg transition"
                          title="Voir les details"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                        {rfq.conversationId && (
                          <Link
                            href={`/conversations?id=${rfq.conversationId}`}
                            className="p-1.5 hover:bg-gray-6 rounded-lg transition"
                            title="Voir la conversation"
                          >
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
