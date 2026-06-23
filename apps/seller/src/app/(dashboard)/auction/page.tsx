'use client';

import { useState, useEffect } from 'react';
import { Gavel, Plus, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface AuctionProduct {
  id: string;
  nom: string;
  prixDepart: number;
  enchereMax: number;
  nbEncheres: number;
  dateFin: string;
  statut: string;
}

export default function AuctionPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AuctionProduct[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    async function fetchAuctions() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/products?isAuction=true&page=${page}&perPage=${perPage}`);
        if (res.data) {
          setProducts(res.data.map((p: any) => ({
            id: p.id,
            nom: p.name,
            prixDepart: p.price || 0,
            enchereMax: p.price || 0,
            nbEncheres: 0,
            dateFin: p.discountEnd || p.createdAt,
            statut: p.status,
          })));
          setTotal(res.meta?.total || 0);
        }
      } catch (err) {
        console.error('Erreur chargement encheres:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();
  }, [page]);

  const columns: Column<AuctionProduct>[] = [
    { name: 'Produit', key: 'nom', render: (item) => <span className="font-medium text-dark">{item.nom}</span> },
    { name: 'Prix depart', key: 'prixDepart', render: (item) => formatPrice(item.prixDepart) },
    { name: 'Enchere max', key: 'enchereMax', render: (item) => <span className="font-semibold text-success">{formatPrice(item.enchereMax)}</span> },
    { name: 'Encheres', key: 'nbEncheres' },
    { name: 'Date fin', key: 'dateFin', render: (item) => formatDate(item.dateFin) },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Action', key: 'action',
      render: () => <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>,
    },
  ];

  if (loading && products.length === 0) {
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
            <Gavel className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Produits aux encheres</h1>
        </div>
        <a href="/products/create" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          Ajouter
        </a>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={products} pagination={{ page, perPage, total }} onPageChange={setPage} />
      </div>
    </div>
  );
}
