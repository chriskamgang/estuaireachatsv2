'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Loader2, Package, Boxes, Tag, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  minOrderQty: number;
  unit: string;
  status: string;
  mode: string;
  isWholesale: boolean;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
  images: { id: string; url: string; alt?: string; isMain: boolean; order: number }[];
  shop: { id: string; name: string; slug: string; logo?: string };
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  priceTiers: { minQty: number; maxQty?: number; price: number }[];
  stocks: { id: string; variant: string; price: number; qty: number }[];
}

export default function WholesaleProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    api.get<{ data: Product }>(`/products/${params.id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Produit non trouve'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-gray-3">Chargement...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <Package className="w-10 h-10 text-gray-4 mx-auto mb-3" />
        <p className="text-sm text-gray-3">{error || 'Produit non trouve'}</p>
        <button onClick={() => router.push('/wholesale')} className="text-sm text-primary font-medium hover:underline mt-2">
          Retour a la liste
        </button>
      </div>
    );
  }

  const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/wholesale" className="p-2 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-dark transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Boxes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">{product.name}</h1>
            <p className="text-sm text-gray-3">Detail du produit en gros</p>
          </div>
        </div>
        <Link href={`/wholesale/${product.id}/edit`} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">
          <Edit2 className="w-4 h-4" /> Modifier
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Images + Info */}
        <div className="col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-dark mb-4">Images</h2>
            <div className="flex gap-4">
              {mainImage ? (
                <img src={mainImage.url} alt={product.name} className="w-48 h-48 rounded-xl object-cover border" />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-gray-6 flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-4" />
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {product.images?.filter((img) => !img.isMain).map((img) => (
                  <img key={img.id} src={img.url} alt="" className="w-20 h-20 rounded-lg object-cover border" />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-dark mb-3">Description</h2>
            <p className="text-sm text-gray-2 whitespace-pre-line">{product.description || 'Aucune description'}</p>
          </div>

          {/* Price Tiers */}
          {product.priceTiers && product.priceTiers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-dark">Paliers de prix</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-5">
                    <th className="text-left py-2 text-xs font-medium text-gray-3">Quantite min</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-3">Quantite max</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-3">Prix unitaire (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {product.priceTiers.map((tier, i) => (
                    <tr key={i} className="border-b border-gray-5 last:border-0">
                      <td className="py-2.5 text-sm text-dark">{tier.minQty}</td>
                      <td className="py-2.5 text-sm text-dark">{tier.maxQty || '-'}</td>
                      <td className="py-2.5 text-sm text-dark font-medium text-right">{tier.price.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stocks / Variants */}
          {product.stocks && product.stocks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-dark mb-4">Variantes</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-5">
                    <th className="text-left py-2 text-xs font-medium text-gray-3">Variante</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-3">Prix (FCFA)</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {product.stocks.map((s) => (
                    <tr key={s.id} className="border-b border-gray-5 last:border-0">
                      <td className="py-2.5 text-sm text-dark">{s.variant}</td>
                      <td className="py-2.5 text-sm text-dark font-medium text-right">{s.price.toLocaleString()}</td>
                      <td className="py-2.5 text-sm text-dark text-right">{s.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-dark mb-3">Statut</h2>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              product.status === 'ACTIVE' ? 'bg-success-soft text-success' :
              product.status === 'DRAFT' ? 'bg-amber-50 text-amber-600' :
              'bg-gray-6 text-gray-3'
            }`}>
              {product.status === 'ACTIVE' ? 'Actif' : product.status === 'DRAFT' ? 'Brouillon' : 'Inactif'}
            </span>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-dark">Informations</h2>
            <div>
              <p className="text-xs text-gray-3">Prix de base</p>
              <p className="text-sm font-medium text-dark">{product.price ? `${product.price.toLocaleString()} FCFA` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Quantite minimum</p>
              <p className="text-sm font-medium text-dark">{product.minOrderQty} {product.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Categorie</p>
              <p className="text-sm font-medium text-dark">{product.category?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Boutique</p>
              <p className="text-sm font-medium text-dark">{product.shop?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Cree le</p>
              <p className="text-sm font-medium text-dark">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-dark">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-6 text-gray-2 rounded-lg text-xs">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
