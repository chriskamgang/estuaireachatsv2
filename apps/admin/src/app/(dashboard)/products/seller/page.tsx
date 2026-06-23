'use client';

import { useState, useEffect, useMemo } from 'react';
import { Store, Package, CheckCircle, XCircle, Search, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price?: number;
  status: string;
  isApproved: boolean;
  addedBy?: string;
  images: { url: string }[];
  shop: { id: string; name: string; slug: string };
  category?: { name: string };
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.get<{ data: Product[] }>('/products/admin/all?perPage=200')
      .then((res) => {
        // Filter only seller-added products
        setProducts(res.data.filter((p) => p.addedBy === 'seller'));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.shop?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, statusFilter, search]);

  const approuver = async (id: string) => {
    try {
      await api.patch(`/products/${id}`, { status: 'ACTIVE', isPublished: true, isApproved: true });
      setProducts(products.map((p) => p.id === id ? { ...p, status: 'ACTIVE', isApproved: true } : p));
      showToast('Produit approuve');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const rejeter = async (id: string) => {
    try {
      await api.patch(`/products/${id}`, { status: 'INACTIVE', isPublished: false, isApproved: false });
      setProducts(products.map((p) => p.id === id ? { ...p, status: 'INACTIVE', isApproved: false } : p));
      showToast('Produit rejete');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const pending = products.filter(p => p.status === 'DRAFT');
  const approved = products.filter(p => p.status === 'ACTIVE');
  const rejected = products.filter(p => p.status === 'INACTIVE');

  const columns: Column<Product>[] = [
    {
      name: 'Produit', key: 'name',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.images?.[0] ? <img src={item.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-gray-3" /></div>}
          <span className="font-medium text-dark">{item.name}</span>
        </div>
      ),
    },
    { name: 'Boutique', key: 'shop', render: (item) => <span className="text-gray-2">{item.shop?.name || '-'}</span> },
    { name: 'Prix', key: 'price', render: (item) => <span className="font-semibold">{item.price ? formatPrice(item.price) : '-'}</span> },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.status !== 'ACTIVE' && (
            <button onClick={() => approuver(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition" title="Approuver"><CheckCircle className="w-4 h-4" /></button>
          )}
          {item.status !== 'INACTIVE' && (
            <button onClick={() => rejeter(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Rejeter"><XCircle className="w-4 h-4" /></button>
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
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Store className="w-5 h-5 text-primary" /></div>
        <h1 className="text-2xl font-bold text-dark">Produits des vendeurs</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input type="text" placeholder="Rechercher produit ou boutique..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[200px]">
            <option value="">Tous les statuts</option>
            <option value="DRAFT">En attente</option>
            <option value="ACTIVE">Approuve</option>
            <option value="INACTIVE">Rejete</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-warning">{pending.length}</p>
          <p className="text-xs text-gray-3 mt-1">En attente</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-success">{approved.length}</p>
          <p className="text-xs text-gray-3 mt-1">Approuves</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-danger">{rejected.length}</p>
          <p className="text-xs text-gray-3 mt-1">Rejetes</p>
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
