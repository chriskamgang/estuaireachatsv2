'use client';

import { useState, useEffect } from 'react';
import { Ticket, Copy, Check, Award, Gift } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder: number;
  expiresAt: string;
  status: 'available' | 'used' | 'expired';
  type?: string;
}

const tabs = [
  { label: 'Disponibles', value: 'available' },
  { label: 'Utilises', value: 'used' },
  { label: 'Expires', value: 'expired' },
];

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState('available');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loyaltyCoupons, setLoyaltyCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    api.get<{ data: Coupon[] }>('/coupons/me')
      .then((res) => setCoupons(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get<{ data: Coupon[] }>('/coupons/me/loyalty')
      .then((res) => setLoyaltyCoupons(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingLoyalty(false));
  }, []);

  const filtered = coupons.filter((c) => c.status === activeTab);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setToastMsg('Code copie !');
    setTimeout(() => { setCopiedId(null); setToastMsg(''); }, 2000);
  };

  const availableLoyalty = loyaltyCoupons.filter((c) => c.status === 'available');

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-dark px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Section Coupons de fidelite */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A06A]/10">
            <Award size={22} className="text-[#00A06A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark">Coupons de fidelite</h2>
            <p className="text-xs text-gray-3">Gagnes grace a vos achats sur la plateforme</p>
          </div>
        </div>

        {loadingLoyalty ? (
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A06A] border-t-transparent" />
          </div>
        ) : availableLoyalty.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-4 py-10">
            <Gift size={40} className="mb-3 text-gray-4" />
            <p className="text-sm font-medium text-gray-2">Aucun coupon de fidelite pour le moment</p>
            <p className="mt-1 max-w-xs text-center text-xs text-gray-3">
              Continuez vos achats pour gagner des coupons de fidelite !
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-[#00A06A]/5 px-4 py-3">
              <p className="text-sm text-[#00A06A]">
                <span className="font-semibold">Bravo !</span> Vous avez gagne {availableLoyalty.length === 1 ? 'ce coupon' : 'ces coupons'} grace a vos achats. Utilisez-{availableLoyalty.length === 1 ? 'le' : 'les'} sur votre prochaine commande.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {availableLoyalty.map((coupon) => (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden rounded-xl border border-[#00A06A]/30 bg-gradient-to-br from-[#00A06A]/5 to-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Badge fidelite */}
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#00A06A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Award size={10} />
                      Fidelite
                    </span>
                  </div>

                  <div className="flex">
                    {/* Left: discount value */}
                    <div className="flex w-[110px] shrink-0 flex-col items-center justify-center bg-[#00A06A] p-4 text-white">
                      <span className="text-2xl font-bold">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : formatPrice(coupon.discountValue)}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                        {coupon.discountType === 'percentage' ? 'de reduction' : 'de remise'}
                      </span>
                    </div>

                    {/* Right: details */}
                    <div className="flex-1 p-4 pt-8">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#00A06A]/10 px-2.5 py-1 font-mono text-sm font-bold text-dark">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopy(coupon.code, coupon.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-3 transition-colors hover:bg-gray-5 hover:text-dark"
                          title="Copier le code"
                        >
                          {copiedId === coupon.id ? <Check size={14} className="text-[#00A06A]" /> : <Copy size={14} />}
                        </button>
                      </div>
                      {coupon.minOrder > 0 && (
                        <p className="mt-2 text-xs text-gray-2">
                          Commande minimum : {formatPrice(coupon.minOrder)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-3">
                        Expire le{' '}
                        {new Date(coupon.expiresAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <button
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        className="mt-3 rounded-lg bg-[#00A06A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#008a5a]"
                      >
                        Copier le code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Section Tous mes coupons */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Tous mes coupons</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-gray-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'border-b-2 border-orange text-orange'
                  : 'text-gray-3 hover:text-dark'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Ticket size={48} className="mb-4 text-gray-4" />
            <p className="text-lg font-medium text-gray-2">Aucun coupon dans cette categorie</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((coupon) => {
              const isAvailable = coupon.status === 'available';
              const isExpired = coupon.status === 'expired';
              const isLoyalty = coupon.type === 'loyalty' || coupon.type === 'LOYALTY';
              return (
                <div
                  key={coupon.id}
                  className={cn(
                    'relative overflow-hidden rounded-xl border-2 border-dashed',
                    isAvailable
                      ? 'border-orange bg-orange/5'
                      : isExpired
                      ? 'border-gray-4 bg-gray-6 opacity-60'
                      : 'border-gray-4 bg-gray-6'
                  )}
                >
                  {/* Badge fidelite si applicable */}
                  {isLoyalty && (
                    <div className="absolute right-3 top-3 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00A06A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <Award size={10} />
                        Fidelite
                      </span>
                    </div>
                  )}

                  <div className="flex">
                    {/* Left: discount value */}
                    <div
                      className={cn(
                        'flex w-[120px] shrink-0 flex-col items-center justify-center p-4',
                        isAvailable
                          ? isLoyalty
                            ? 'bg-[#00A06A] text-white'
                            : 'bg-orange text-white'
                          : 'bg-gray-4 text-white'
                      )}
                    >
                      <span className="text-2xl font-bold">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : formatPrice(coupon.discountValue)}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                        {coupon.discountType === 'percentage' ? 'de reduction' : 'de remise'}
                      </span>
                    </div>

                    {/* Right: details */}
                    <div className={cn('flex-1 p-4', isLoyalty && 'pt-8')}>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-dark/10 px-2 py-0.5 font-mono text-sm font-bold text-dark">
                          {coupon.code}
                        </span>
                        {isAvailable && (
                          <button
                            onClick={() => handleCopy(coupon.code, coupon.id)}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-3 transition-colors hover:bg-gray-5 hover:text-dark"
                            title="Copier le code"
                          >
                            {copiedId === coupon.id ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-2">
                        Commande minimum : {formatPrice(coupon.minOrder)}
                      </p>
                      <p className="mt-1 text-xs text-gray-3">
                        Expire le{' '}
                        {new Date(coupon.expiresAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>

                      {isAvailable && (
                        <button
                          onClick={() => handleCopy(coupon.code, coupon.id)}
                          className={cn(
                            'mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors',
                            isLoyalty
                              ? 'bg-[#00A06A] hover:bg-[#008a5a]'
                              : 'bg-orange hover:bg-orange-light'
                          )}
                        >
                          Utiliser
                        </button>
                      )}
                      {coupon.status === 'used' && (
                        <span className="mt-3 inline-block text-xs font-medium text-gray-3">
                          Deja utilise
                        </span>
                      )}
                      {isExpired && (
                        <span className="mt-3 inline-block text-xs font-medium text-primary">
                          Expire
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
