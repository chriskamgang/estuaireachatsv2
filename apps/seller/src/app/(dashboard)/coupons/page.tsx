'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  type: string;
  discountType: string;
  discount: number;
  startDate: string;
  endDate: string;
  minBuy: number;
  isActive: boolean;
  _count?: { usages: number };
}

const initialForm = {
  code: '',
  type: 'CART_BASE',
  discountType: 'PERCENT',
  discount: 0,
  minBuy: 0,
  startDate: '',
  endDate: '',
};

export default function CouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get<any>('/coupons');
      if (res.result !== false && Array.isArray(res.data || res)) {
        setCoupons(res.data || res);
      }
    } catch (err) {
      console.error('Erreur chargement coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/coupons/${editId}`, form);
      } else {
        await api.post('/coupons', form);
      }
      setShowModal(false);
      setEditId(null);
      setForm(initialForm);
      await fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      discountType: coupon.discountType,
      discount: coupon.discount,
      minBuy: coupon.minBuy,
      startDate: coupon.startDate.slice(0, 10),
      endDate: coupon.endDate.slice(0, 10),
    });
    setShowModal(true);
  };

  const getStatusLabel = (coupon: Coupon) => {
    if (!coupon.isActive) return 'INACTIVE';
    const now = new Date();
    if (new Date(coupon.endDate) < now) return 'COMPLETED';
    if (new Date(coupon.startDate) > now) return 'PENDING';
    return 'ACTIVE';
  };

  const columns: Column<Coupon>[] = [
    { name: 'Code', key: 'code', render: (item) => <span className="font-mono text-sm text-primary font-medium">{item.code}</span> },
    { name: 'Type', key: 'type', render: (item) => item.discountType === 'PERCENT' ? 'Pourcentage' : 'Montant fixe' },
    { name: 'Valeur', key: 'discount', render: (item) => item.discountType === 'PERCENT' ? `${item.discount}%` : formatPrice(item.discount) },
    { name: 'Debut', key: 'startDate', render: (item) => formatDate(item.startDate) },
    { name: 'Fin', key: 'endDate', render: (item) => formatDate(item.endDate) },
    { name: 'Utilisations', key: '_count', render: (item) => (item as any)._count?.usages ?? 0 },
    { name: 'Statut', key: 'isActive', render: (item) => <StatusBadge status={getStatusLabel(item)} /> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-info transition"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Mes Coupons</h1>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(initialForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Creer un coupon
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={coupons} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">{editId ? 'Modifier le coupon' : 'Nouveau coupon'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-1 mb-1">Type remise</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="PERCENT">Pourcentage</option>
                    <option value="AMOUNT">Montant fixe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-1 mb-1">Valeur</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1">Achat minimum (FCFA)</label>
                <input type="number" value={form.minBuy} onChange={(e) => setForm({ ...form, minBuy: Number(e.target.value) })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-1 mb-1">Date debut</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-1 mb-1">Date fin</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium">
                {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
