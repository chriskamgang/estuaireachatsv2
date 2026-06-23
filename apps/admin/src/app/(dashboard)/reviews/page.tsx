'use client';

import { useState, useEffect, useMemo } from 'react';
import { Star, EyeOff, Trash2, CheckCircle, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  images: string[];
  status: number; // 0=pending, 1=approved, 2=rejected
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; avatar?: string };
  product?: { id: string; name: string };
}

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= note ? 'fill-warning text-warning' : 'text-gray-4'}`} />
      ))}
    </div>
  );
}

const statusMap: Record<number, string> = { 0: 'PENDING', 1: 'ACTIVE', 2: 'INACTIVE' };

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteFilter, setNoteFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Load all reviews by fetching product reviews - we'll use a workaround via products
    api.get<{ data: { id: string; name: string; reviews: Review[] }[] }>('/products/admin/all?perPage=200')
      .then((res) => {
        const allReviews: Review[] = [];
        for (const product of res.data) {
          if ((product as unknown as { reviews: Review[] }).reviews) {
            for (const review of (product as unknown as { reviews: Review[] }).reviews) {
              allReviews.push({ ...review, product: { id: product.id, name: product.name } });
            }
          }
        }
        setReviews(allReviews);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchNote = noteFilter === 0 || r.rating >= noteFilter;
      const matchStatus = !statusFilter || statusMap[r.status] === statusFilter;
      return matchNote && matchStatus;
    });
  }, [reviews, noteFilter, statusFilter]);

  const updateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`/reviews/${id}/status`, { status });
      setReviews(reviews.map((r) => r.id === id ? { ...r, status } : r));
      showToast(status === 1 ? 'Avis approuve' : 'Avis rejete');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const columns: Column<Review>[] = [
    { name: 'Produit', key: 'product', render: (item) => <span className="font-medium text-dark">{item.product?.name || '-'}</span> },
    { name: 'Client', key: 'user', render: (item) => <span className="text-gray-1">{item.user?.firstName} {item.user?.lastName}</span> },
    { name: 'Note', key: 'rating', render: (item) => <StarRating note={item.rating} /> },
    { name: 'Commentaire', key: 'comment', render: (item) => <span className="text-gray-2 max-w-[250px] block truncate" title={item.comment}>{item.comment || '-'}</span> },
    { name: 'Date', key: 'createdAt', render: (item) => <span className="text-gray-3 text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span> },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={statusMap[item.status] || 'PENDING'} /> },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.status !== 1 && (
            <button onClick={() => updateStatus(item.id, 1)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition" title="Approuver">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {item.status !== 2 && (
            <button onClick={() => updateStatus(item.id, 2)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-warning transition" title="Rejeter">
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Star className="w-5 h-5 text-primary" /></div>
        <h1 className="text-2xl font-bold text-dark">Avis clients</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-3 mb-1">Note minimum</label>
            <select value={noteFilter} onChange={(e) => setNoteFilter(Number(e.target.value))} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[140px]">
              <option value={0}>Toutes</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} etoile{n > 1 ? 's' : ''} et +</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-3 mb-1">Statut</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[160px]">
              <option value="">Tous</option>
              <option value="ACTIVE">Approuve</option>
              <option value="PENDING">En attente</option>
              <option value="INACTIVE">Rejete</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-gray-3">Chargement...</p></div>
        ) : (
          <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 20, total: filtered.length }} />
        )}
      </div>
    </div>
  );
}
