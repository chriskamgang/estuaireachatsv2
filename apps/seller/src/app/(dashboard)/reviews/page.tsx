'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Star, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Review {
  id: string;
  produit: string;
  client: string;
  note: number;
  commentaire: string;
  date: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-warning fill-warning' : 'text-gray-4'}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/reviews/seller?page=${page}&perPage=${perPage}`);
        if (res.result && res.data) {
          setReviews(res.data.map((r: any) => ({
            id: r.id,
            produit: r.product?.name || 'Produit',
            client: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Client',
            note: r.rating,
            commentaire: r.comment || '',
            date: r.createdAt,
          })));
          setTotal(res.meta?.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement avis:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [page]);

  const columns: Column<Review>[] = [
    { name: 'Produit', key: 'produit', render: (item) => <span className="font-medium text-dark">{item.produit}</span> },
    { name: 'Client', key: 'client' },
    { name: 'Note', key: 'note', render: (item) => <StarRating rating={item.note} /> },
    { name: 'Commentaire', key: 'commentaire', render: (item) => <span className="text-sm text-gray-2 line-clamp-1">{item.commentaire}</span> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  ];

  if (loading && reviews.length === 0) {
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
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Avis produits</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={reviews}
          pagination={{ page, perPage, total }}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
