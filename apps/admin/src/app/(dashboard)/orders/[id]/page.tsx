'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, MapPin, Clock, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    api.get<{ data: any }>(`/orders/admin/${params.id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/admin/${params.id}/status`, { deliveryStatus: STATUS_MAP[newStatus] || newStatus });
      setOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
    } catch {}
    setUpdating(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-3">Commande introuvable</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders" className="p-2 rounded-lg hover:bg-gray-6 transition"><ArrowLeft className="w-5 h-5 text-gray-2" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-dark">Commande {order.orderNumber}</h1>
          <p className="text-sm text-gray-3">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div><p className="text-xs text-gray-3 mb-1">N° Commande</p><p className="font-semibold text-primary">{order.orderNumber}</p></div>
          <div><p className="text-xs text-gray-3 mb-1">Date</p><p className="font-medium">{formatDateTime(order.createdAt)}</p></div>
          <div><p className="text-xs text-gray-3 mb-1">Paiement</p><StatusBadge status={order.paymentStatus || 'PENDING'} /></div>
          <div><p className="text-xs text-gray-3 mb-1">Statut</p><StatusBadge status={order.status} /></div>
          <div className="ml-auto">
            <p className="text-xs text-gray-3 mb-1">Changer le statut</p>
            <select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} disabled={updating}
              className="px-3 py-1.5 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-5 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-dark">Articles ({order.details?.length || 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-5">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-3">Produit</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-3">Qty</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-3">Prix</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.details?.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-5 last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image ? <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-6 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-4" /></div>}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">{formatPrice(item.price)}</td>
                      <td className="py-3 px-4 font-medium">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-5 flex items-center gap-2"><User className="w-4 h-4 text-primary" /><h2 className="font-semibold text-dark">Client</h2></div>
            <div className="p-4 space-y-2 text-sm">
              <p className="font-medium">{order.buyer?.firstName} {order.buyer?.lastName}</p>
              <p className="text-gray-3">{order.buyer?.email}</p>
              <p className="text-gray-3">{order.buyer?.phone || '-'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-5"><h2 className="font-semibold text-dark">Resume</h2></div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-2">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-2">Livraison</span><span>{formatPrice(order.shippingFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-2">Taxe</span><span>{formatPrice(order.tax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-2">Remise</span><span className="text-danger">-{formatPrice(order.discount)}</span></div>
              <div className="border-t border-gray-5 pt-2 flex justify-between font-bold text-dark"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
