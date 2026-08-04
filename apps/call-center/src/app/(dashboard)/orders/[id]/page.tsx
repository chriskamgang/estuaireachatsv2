'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Phone, Store, MapPin, User, Package, Clock } from 'lucide-react';
import clsx from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  note: string | null;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
  seller: { id: string; firstName: string; lastName: string; phone: string | null; shop: { id: string; name: string; slug: string; phone: string | null; address: string | null; city: string | null } | null };
  address: { id: string; address: string; city: string; phone: string; recipientName: string } | null;
  details: { id: string; name: string; quantity: number; price: number; image: string | null; product: { id: string; name: string; slug: string; images: { url: string }[] } | null }[];
  callLogs: { id: string; callResult: string; duration: number | null; notes: string | null; scheduledAt: string | null; createdAt: string; agent: { firstName: string; lastName: string } }[];
}

const CALL_RESULTS = [
  { value: 'CONFIRMED', label: 'Confirmee', color: 'text-green-700' },
  { value: 'NO_ANSWER', label: 'Pas de reponse', color: 'text-yellow-700' },
  { value: 'CANCELLED', label: 'Annulee', color: 'text-red-700' },
  { value: 'CALLBACK', label: 'Rappeler', color: 'text-blue-700' },
  { value: 'WRONG_NUMBER', label: 'Mauvais numero', color: 'text-gray-700' },
  { value: 'OTHER', label: 'Autre', color: 'text-gray-700' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  PROCESSING: 'En cours',
  SHIPPED: 'Expediee',
  DELIVERED: 'Livree',
  CANCELLED: 'Annulee',
  REFUNDED: 'Remboursee',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Call log form
  const [callResult, setCallResult] = useState('CONFIRMED');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<OrderDetail>(`/call-center/orders/${params.id}`).then((res) => {
      setOrder(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    try {
      await api.post('/call-center/call-logs', {
        orderId: order.id,
        callResult,
        duration: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
        scheduledAt: scheduledAt || undefined,
      });
      toast.success('Appel enregistre !');
      // Reload order
      const updated = await api.get<OrderDetail>(`/call-center/orders/${params.id}`);
      setOrder(updated);
      setNotes('');
      setDuration('');
      setScheduledAt('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-3">Commande introuvable</div>;
  }

  return (
    <div>
      <Toaster position="top-right" />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-6">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-dark">Commande {order.orderNumber}</h1>
        <span className={clsx('ml-2 px-3 py-1 rounded-full text-xs font-medium',
          order.status === 'PENDING' ? 'bg-warning-soft text-yellow-700' :
          order.status === 'CONFIRMED' ? 'bg-success-soft text-green-700' :
          order.status === 'CANCELLED' ? 'bg-danger-soft text-red-700' :
          'bg-info-soft text-blue-700'
        )}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Informations client
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-3">Nom</p>
                <p className="font-medium">{order.buyer.firstName} {order.buyer.lastName}</p>
              </div>
              <div>
                <p className="text-gray-3">Telephone</p>
                {order.buyer.phone ? (
                  <a href={`tel:${order.buyer.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />{order.buyer.phone}
                  </a>
                ) : <p className="text-gray-3">-</p>}
              </div>
              <div>
                <p className="text-gray-3">Email</p>
                <p className="font-medium">{order.buyer.email || '-'}</p>
              </div>
            </div>
            {order.address && (
              <div className="mt-3 pt-3 border-t border-gray-5">
                <p className="text-gray-3 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Adresse de livraison</p>
                <p className="font-medium text-sm mt-1">{order.address.recipientName} - {order.address.phone}</p>
                <p className="text-sm text-gray-2">{order.address.address}, {order.address.city}</p>
              </div>
            )}
          </div>

          {/* Boutique info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Boutique
            </h2>
            <div className="text-sm">
              <p className="font-medium">{order.seller?.shop?.name || order.seller.firstName + ' ' + order.seller.lastName}</p>
              {order.seller?.shop?.phone && (
                <a href={`tel:${order.seller.shop.phone}`} className="text-primary hover:underline flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" />{order.seller.shop.phone}
                </a>
              )}
              {order.seller.phone && !order.seller?.shop?.phone && (
                <a href={`tel:${order.seller.phone}`} className="text-primary hover:underline flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" />{order.seller.phone}
                </a>
              )}
              {order.seller?.shop?.address && (
                <p className="text-gray-2 mt-1">{order.seller.shop.address}, {order.seller.shop.city}</p>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Produits ({order.details.length})
            </h2>
            <div className="divide-y divide-gray-5">
              {order.details.map((detail) => (
                <div key={detail.id} className="flex items-center gap-3 py-3">
                  {(detail.image || detail.product?.images?.[0]?.url) && (
                    <img
                      src={detail.image || detail.product?.images?.[0]?.url}
                      alt={detail.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-6"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{detail.name}</p>
                    <p className="text-xs text-gray-3">Qty: {detail.quantity} x {formatPrice(detail.price)}</p>
                  </div>
                  <p className="font-medium text-sm">{formatPrice(detail.quantity * detail.price)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-5 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-3">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-3">Livraison</span><span>{formatPrice(order.shippingFee)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-3">Remise</span><span className="text-danger">-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Call form */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Enregistrer un appel
            </h2>
            <form onSubmit={handleSubmitCall} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Resultat</label>
                <select
                  value={callResult}
                  onChange={(e) => setCallResult(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary"
                >
                  {CALL_RESULTS.map((cr) => (
                    <option key={cr.value} value={cr.value}>{cr.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Duree (secondes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full px-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary"
                />
              </div>
              {callResult === 'CALLBACK' && (
                <div>
                  <label className="block text-xs font-medium text-gray-2 mb-1">Date de rappel</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes sur l'appel..."
                  className="w-full px-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:border-primary resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer l\'appel'}
              </button>
            </form>
          </div>

          {/* Call history */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Historique des appels
            </h2>
            {order.callLogs.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-4">Aucun appel enregistre</p>
            ) : (
              <div className="space-y-3">
                {order.callLogs.map((log) => {
                  const resultInfo = CALL_RESULTS.find((cr) => cr.value === log.callResult);
                  return (
                    <div key={log.id} className="border border-gray-5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx('font-medium text-xs', resultInfo?.color || 'text-gray-2')}>
                          {resultInfo?.label || log.callResult}
                        </span>
                        <span className="text-[11px] text-gray-3">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-3">Agent: {log.agent.firstName} {log.agent.lastName}</p>
                      {log.duration && <p className="text-xs text-gray-3">Duree: {Math.floor(log.duration / 60)}min {log.duration % 60}s</p>}
                      {log.notes && <p className="text-xs text-gray-2 mt-1">{log.notes}</p>}
                      {log.scheduledAt && <p className="text-xs text-info mt-1">Rappel: {formatDate(log.scheduledAt)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
