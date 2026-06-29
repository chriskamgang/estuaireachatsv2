'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boxes, Plus, Search, Eye, Edit2, Trash2, Loader2, Package } from 'lucide-react';
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
  category?: { id: string; name: string };
  priceTiers: { minQty: number; maxQty?: number; price: number }[];
}

export default function WholesalePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Product[]; meta: { total: number } }>('/products/seller/my-products?perPage=200')
      .then((res) => setProducts(res.data.filter((p) => p.isWholesale || p.mode === 'WHOLESALE')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit wholesale ?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Boxes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Produits en gros</h1>
            <p className="text-sm text-gray-3">Gerez vos produits vendus en gros</p>
          </div>
        </div>
        <Link href="/wholesale/create" className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom..."
              className="w-full pl-10 pr-4 py-2 border border-gray-5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-3">Chargement des produits...</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-5 bg-gray-6/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase">Produit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-3 uppercase">Categorie</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-3 uppercase">Prix min (FCFA)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-3 uppercase">MOQ</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-3 uppercase">Statut</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-5">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-6/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-3" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-dark">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-2">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-dark font-medium text-right">
                      {product.priceTiers?.[0]
                        ? product.priceTiers[0].price.toLocaleString()
                        : product.price
                          ? product.price.toLocaleString()
                          : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-2 text-right">{product.minOrderQty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'ACTIVE' ? 'bg-success-soft text-success' :
                        product.status === 'DRAFT' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-6 text-gray-3'
                      }`}>
                        {product.status === 'ACTIVE' ? 'Actif' : product.status === 'DRAFT' ? 'Brouillon' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/wholesale/${product.id}`} className="p-1.5 rounded hover:bg-gray-6 text-gray-3 hover:text-primary transition">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/wholesale/${product.id}/edit`} className="p-1.5 rounded hover:bg-gray-6 text-gray-3 hover:text-info transition">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-gray-6 text-gray-3 hover:text-danger transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Package className="w-10 h-10 text-gray-4 mx-auto mb-3" />
                <p className="text-sm text-gray-3">Aucun produit en gros trouve</p>
                <Link href="/wholesale/create" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">
                  Creer votre premier produit
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
