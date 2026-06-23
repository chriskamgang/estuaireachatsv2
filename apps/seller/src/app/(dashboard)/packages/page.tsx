'use client';

import { useState, useEffect } from 'react';
import { Layers, Check, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface SellerPackage {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  duration: number;
  isActive: boolean;
}

export default function PackagesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SellerPackage[]>([]);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pkgRes, subRes] = await Promise.all([
          api.get<any>('/seller-packages'),
          api.get<any>('/seller-packages/my-subscription').catch(() => ({ data: { package: null } })),
        ]);
        if (pkgRes.result && pkgRes.data) setPackages(pkgRes.data);
        if (subRes.data?.package?.id) setCurrentPackageId(subRes.data.package.id);
      } catch (err) {
        console.error('Erreur chargement packages:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubscribe = async (packageId: string) => {
    setSubscribing(packageId);
    try {
      await api.post('/seller-packages/subscribe', { packageId });
      setCurrentPackageId(packageId);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la souscription');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
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
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Packages disponibles</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isActuel = pkg.id === currentPackageId;
          return (
            <div key={pkg.id} className={`bg-white rounded-xl shadow-sm p-6 ${isActuel ? 'ring-2 ring-primary' : ''}`}>
              {isActuel && (
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded-full mb-3">
                  Package actuel
                </span>
              )}
              <h3 className="text-xl font-bold text-dark">{pkg.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-dark">{pkg.price === 0 ? 'Gratuit' : formatPrice(pkg.price)}</span>
                {pkg.price > 0 && <span className="text-sm text-gray-3">/{pkg.duration}j</span>}
              </div>
              <p className="text-sm text-gray-3 mt-2">
                {pkg.productLimit === -1 ? 'Produits illimites' : `${pkg.productLimit} produits max`}
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  {pkg.productLimit === -1 ? 'Produits illimites' : `${pkg.productLimit} produits max`}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  {pkg.price === 0 ? 'Support email' : 'Support prioritaire'}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  Statistiques {pkg.price === 0 ? 'basiques' : 'avancees'}
                </li>
              </ul>
              <button
                onClick={() => !isActuel && handleSubscribe(pkg.id)}
                disabled={isActuel || subscribing === pkg.id}
                className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActuel
                    ? 'bg-gray-6 text-gray-3 cursor-default'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                {subscribing === pkg.id ? 'En cours...' : isActuel ? 'Actif' : 'Choisir ce package'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
