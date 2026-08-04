'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CalendarClock, Phone, Eye } from 'lucide-react';

interface Callback {
  id: string;
  scheduledAt: string;
  notes: string | null;
  createdAt: string;
  agent: { firstName: string; lastName: string };
  order: { id: string; orderNumber: string; status: string; total: number; buyer: { firstName: string; lastName: string; phone: string | null } };
}

export default function CallbacksPage() {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Callback[]>('/call-center/callbacks').then((res) => {
      setCallbacks(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const isOverdue = (d: string) => new Date(d) < new Date();

  return (
    <div>
      <h1 className="text-xl font-bold text-dark mb-6 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-primary" /> Rappels planifies
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : callbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-3">Aucun rappel planifie</div>
        ) : (
          <div className="divide-y divide-gray-5">
            {callbacks.map((cb) => (
              <div key={cb.id} className="p-4 hover:bg-gray-6/50 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOverdue(cb.scheduledAt) ? 'bg-danger-soft' : 'bg-info-soft'}`}>
                  <Phone className={`w-5 h-5 ${isOverdue(cb.scheduledAt) ? 'text-danger' : 'text-info'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cb.order.buyer.firstName} {cb.order.buyer.lastName}</span>
                    {cb.order.buyer.phone && (
                      <a href={`tel:${cb.order.buyer.phone}`} className="text-xs text-primary hover:underline">{cb.order.buyer.phone}</a>
                    )}
                  </div>
                  <p className="text-xs text-gray-3 mt-0.5">Commande {cb.order.orderNumber} - {formatPrice(cb.order.total)}</p>
                  {cb.notes && <p className="text-xs text-gray-2 mt-1">{cb.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-medium ${isOverdue(cb.scheduledAt) ? 'text-danger' : 'text-info'}`}>
                    {formatDate(cb.scheduledAt)}
                  </p>
                  <Link
                    href={`/orders/${cb.order.id}`}
                    className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary-hover"
                  >
                    <Eye className="w-3 h-3" /> Voir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
