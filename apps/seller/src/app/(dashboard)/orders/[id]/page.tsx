'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, MapPin, CreditCard, Truck, User, Package, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_MAP: Record<string, string> = { PENDING: 'PENDING', PROCESSING: 'PICKED_UP', SHIPPED: 'ON_THE_WAY', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' };

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    api.get<{ data: any }>(`/orders/admin/${params.id}`)
      .then((res) => {
        setOrder(res.data);
        setSelectedStatus(res.data.status || 'PENDING');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === order?.status) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/admin/${params.id}/status`, { deliveryStatus: STATUS_MAP[selectedStatus] || selectedStatus });
      setOrder((prev: any) => prev ? { ...prev, status: selectedStatus } : prev);
    } catch {}
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-3">Commande introuvable</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-lg hover:bg-gray-6 transition">
          <ArrowLeft className="w-5 h-5 text-gray-2" />
        </Link>
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Commande {order.orderNumber}</h1>
          <p className="text-sm text-gray-3">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={order.paymentStatus || 'PENDING'} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Articles commandes ({order.details?.length || 0})
            </h2>
            <div className="space-y-3">
              {order.details?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-5 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-6 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-dark">{item.name}</p>
                      <p className="text-xs text-gray-3">Qte: {item.quantity} x {formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-2">Sous-total</span><span>{formatPrice(order.subtotal || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-2">Livraison</span><span>{formatPrice(order.shippingFee || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-2">Taxe</span><span>{formatPrice(order.tax || 0)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><span className="text-gray-2">Remise</span><span className="text-danger">-{formatPrice(order.discount)}</span></div>
              )}
              <div className="border-t border-gray-5 pt-2 flex justify-between font-bold text-dark">
                <span>Total</span>
                <span className="text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4">Mettre a jour le statut</h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating}
                className="flex-1 border border-gray-5 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleStatusChange}
                disabled={updating || selectedStatus === order.status}
                className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium disabled:opacity-50"
              >
                {updating ? 'Mise a jour...' : 'Mettre a jour'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Client
            </h2>
            <p className="text-sm font-medium text-dark">{order.buyer?.firstName} {order.buyer?.lastName}</p>
            <p className="text-xs text-gray-3 mt-1">{order.buyer?.email || '-'}</p>
            <p className="text-xs text-gray-3">{order.buyer?.phone || '-'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Adresse de livraison
            </h2>
            {order.shippingAddress ? (
              <>
                <p className="text-sm text-gray-2">{order.shippingAddress.street || order.shippingAddress.address || '-'}</p>
                <p className="text-sm text-gray-2">{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}</p>
                <p className="text-sm text-gray-2">{order.shippingAddress.country || 'Cameroun'}</p>
              </>
            ) : (
              <p className="text-sm text-gray-3">Aucune adresse renseignee</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Paiement
            </h2>
            <p className="text-sm text-gray-2">{order.paymentMethod || '-'}</p>
            <div className="mt-1"><StatusBadge status={order.paymentStatus || 'PENDING'} /></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-dark mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Livraison
            </h2>
            <p className="text-sm text-gray-2">{order.shippingMethod || 'Livraison standard'}</p>
            <p className="text-sm text-gray-2 mt-1">Frais: {formatPrice(order.shippingFee || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
