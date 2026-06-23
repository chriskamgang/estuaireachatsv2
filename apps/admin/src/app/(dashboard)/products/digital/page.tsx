'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FileCode, Plus, Eye, Pencil, Trash2, Loader2, Search, Package } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price?: number;
  status: string;
  productType: string;
  isDigital: boolean;
  totalSold: number;
  createdAt: string;
  images: { id: string; url: string; alt?: string }[];
  shop: { id: string; name: string };
  category?: { id: string; name: string };
}

export default function DigitalProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get<{ data: Product[]; meta: { total: number } }>('/products/admin/all?perPage=200')
      .then((res) => {
        setProducts(res.data.filter((p) => p.isDigital || p.productType === 'DIGITAL'));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit numerique ?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const columns: Column<Product>[] = [
    {
      name: 'Produit',
      key: 'name',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.images?.[0] ? (
            <img src={item.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4 text-gray-3" />
            </div>
          )}
          <span className="font-medium text-dark">{item.name}</span>
        </div>
      ),
    },
    {
      name: 'Categorie',
      key: 'category',
      render: (item) => <span>{item.category?.name || '-'}</span>,
    },
    {
      name: 'Prix',
      key: 'price',
      render: (item) => <span className="font-semibold">{item.price ? formatPrice(item.price) : '-'}</span>,
    },
    {
      name: 'Ventes',
      key: 'totalSold',
      render: (item) => <span>{item.totalSold || 0}</span>,
    },
    {
      name: 'Boutique',
      key: 'shop',
      render: (item) => <span className="text-gray-2">{item.shop?.name || '-'}</span>,
    },
    {
      name: 'Statut',
      key: 'status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/products/${item.id}`} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/products/${item.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Modifier">
            <Pencil className="w-4 h-4" />
          </Link>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <FileCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Produits numeriques</h1>
            <p className="text-sm text-gray-3">Ebooks, templates, logiciels, cours en ligne...</p>
          </div>
        </div>
        <Link href="/products/digital/create" className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          Ajouter un produit numerique
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher un produit numerique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="DRAFT">Brouillon</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </div>
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-3">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-4 mx-auto mb-3" />
            <p className="text-sm text-gray-3">Aucun produit numerique trouve</p>
            <Link href="/products/digital/create" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">
              Creer votre premier produit numerique
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            pagination={{ page: 1, perPage: 20, total: filtered.length }}
          />
        )}
      </div>
    </div>
  );
}
