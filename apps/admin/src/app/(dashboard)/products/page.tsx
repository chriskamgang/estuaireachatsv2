'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Package, Search, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price?: number;
  minOrderQty: number;
  unit: string;
  status: string;
  mode: string;
  isWholesale: boolean;
  createdAt: string;
  images: { id: string; url: string; alt?: string }[];
  shop: { id: string; name: string; slug: string; logo?: string };
  category?: { id: string; name: string; slug: string };
  priceTiers: { minQty: number; maxQty?: number; price: number }[];
}

const statuses = [
  { value: '', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'DRAFT', label: 'Brouillon' },
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get<{ data: Product[]; meta: { total: number } }>('/products/admin/all?perPage=200')
      .then((res) => {
        // Exclude wholesale-only products (they have their own page)
        setProducts(res.data.filter((p) => !p.isWholesale && p.mode !== 'WHOLESALE'));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    api.get<{ data: { id: string; name: string }[] }>('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.shop?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchCat = !categoryFilter || p.category?.id === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [products, search, statusFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
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
              <Package className="w-4 h-4 text-gray-3" />
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
      render: (item) => (
        <span className="font-semibold">
          {item.price ? formatPrice(item.price) : item.priceTiers?.[0] ? formatPrice(item.priceTiers[0].price) : '-'}
        </span>
      ),
    },
    {
      name: 'Vendeur',
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Tous les produits</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher un produit ou vendeur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[140px]"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[160px]"
          >
            <option value="">Toutes les categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-3">Chargement des produits...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-4 mx-auto mb-3" />
            <p className="text-sm text-gray-3">Aucun produit trouve</p>
            <Link href="/products/create" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">
              Creer votre premier produit
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
