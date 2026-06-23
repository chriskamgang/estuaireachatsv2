'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Ticket, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  type: string;
  discountType: string;
  discount: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Coupon[] }>('/coupons/admin')
      .then((res) => setCoupons(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<Coupon>[] = [
    { name: 'Code', key: 'code', render: (c) => <span className="font-mono font-semibold text-dark">{c.code}</span> },
    { name: 'Type', key: 'type', render: (c) => <span className="text-sm capitalize">{c.type || '-'}</span> },
    {
      name: 'Remise', key: 'discount',
      render: (c) => (
        <span className="font-semibold text-primary">
          {c.discountType === 'PERCENTAGE' || c.discountType === 'pourcentage' ? `${c.discount}%` : formatPrice(c.discount)}
        </span>
      ),
    },
    { name: 'Min achat', key: 'minPurchase', render: (c) => formatPrice(c.minPurchase || 0) },
    { name: 'Expiration', key: 'expiresAt', render: (c) => c.expiresAt ? formatDate(c.expiresAt) : '-' },
    { name: 'Utilisations', key: 'usedCount', render: (c) => <span>{c.usedCount || 0} / {c.maxUses || '∞'}</span> },
    { name: 'Statut', key: 'status', render: (c) => <StatusBadge status={c.status || 'ACTIVE'} /> },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Ticket className="w-5 h-5 text-primary" /></div>
        <h1 className="text-2xl font-bold text-dark">Coupons ({coupons.length})</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={coupons} />
      </div>
    </div>
  );
}
