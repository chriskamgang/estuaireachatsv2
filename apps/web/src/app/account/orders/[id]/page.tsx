'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  MapPin,
  RotateCcw,
  Star,
  Loader2,
  Warehouse,
  ShieldCheck,
  Navigation,
  PackageCheck,
  X,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';

/* ---------- Types ---------- */

interface OrderDetail {
  id: string;
  code: string;
  date: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  sellerName: string;
  isInternational?: boolean;
  items: {
    id: string;
    name: string;
    variant?: string;
    thumbnailUrl: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface TrackingStep {
  key: string;
  label: string;
  date?: string;
  completed: boolean;
  active: boolean;
  description?: string;
}

interface TrackingData {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  isInternational: boolean;
  steps: TrackingStep[];
}

/* ---------- Helpers ---------- */

const statusSteps = [
  { key: 'PENDING', label: 'Commande placee', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmee', icon: CheckCircle2 },
  { key: 'SHIPPED', label: 'Expediee', icon: Truck },
  { key: 'DELIVERED', label: 'Livree', icon: MapPin },
];

function getStepIndex(status: string) {
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

/** Build a fallback timeline from order.status when API is unavailable */
function buildFallbackTracking(order: OrderDetail): TrackingData {
  const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'CUSTOMS', 'LOCAL_CARRIER', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIdx = statusOrder.indexOf(order.status);
  const isIntl = order.isInternational ?? false;

  const allSteps: { key: string; label: string; intlOnly?: boolean }[] = [
    { key: 'PENDING', label: 'Commande confirmee' },
    { key: 'PROCESSING', label: 'En preparation' },
    { key: 'SHIPPED', label: 'Expediee' },
    { key: 'IN_TRANSIT', label: 'En transit vers Douala', intlOnly: true },
    { key: 'WAREHOUSE', label: "Arrivee a l'entrepot", intlOnly: true },
    { key: 'CUSTOMS', label: 'Dedouanement', intlOnly: true },
    { key: 'LOCAL_CARRIER', label: 'Pris en charge par Merci E' },
    { key: 'OUT_FOR_DELIVERY', label: 'En cours de livraison' },
    { key: 'DELIVERED', label: 'Livree' },
  ];

  const filtered = allSteps.filter((s) => !s.intlOnly || isIntl);

  const steps: TrackingStep[] = filtered.map((s) => {
    const sIdx = statusOrder.indexOf(s.key);
    const completed = sIdx >= 0 && sIdx <= currentIdx;
    const active = sIdx === currentIdx;
    return {
      key: s.key,
      label: s.label,
      completed,
      active,
      date: s.key === 'PENDING' ? order.date : undefined,
    };
  });

  return { isInternational: isIntl, steps };
}

/* ---------- Tracking Timeline Component ---------- */

function TrackingTimeline({ tracking }: { tracking: TrackingData }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">Suivi de livraison</h2>
        {tracking.trackingNumber && (
          <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold text-orange">
            N&deg; {tracking.trackingNumber}
          </span>
        )}
      </div>

      {/* Carrier + estimated delivery info */}
      {(tracking.carrier || tracking.estimatedDelivery) && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-md bg-gray-6/50 px-4 py-3 text-sm">
          {tracking.carrier && (
            <div>
              <span className="text-gray-3">Transporteur : </span>
              <span className="font-medium text-dark">{tracking.carrier}</span>
            </div>
          )}
          {tracking.estimatedDelivery && (
            <div>
              <span className="text-gray-3">Livraison estimee : </span>
              <span className="font-medium text-dark">
                {new Date(tracking.estimatedDelivery).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Vertical timeline */}
      <div className="relative ml-4">
        {tracking.steps.map((step, i) => {
          const isLast = i === tracking.steps.length - 1;
          const IconMap: Record<string, typeof Package> = {
            PENDING: Package,
            PROCESSING: PackageCheck,
            SHIPPED: Truck,
            CONFIRMED: CheckCircle2,
            IN_TRANSIT: Navigation,
            WAREHOUSE: Warehouse,
            CUSTOMS: ShieldCheck,
            LOCAL_CARRIER: Truck,
            OUT_FOR_DELIVERY: MapPin,
            DELIVERED: CheckCircle2,
          };
          const Icon = IconMap[step.key] || Circle;

          return (
            <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[15px] top-[32px] w-0.5',
                    step.completed ? 'bg-green' : 'bg-gray-5'
                  )}
                  style={{ height: 'calc(100% - 16px)' }}
                />
              )}

              {/* Circle indicator */}
              <div
                className={cn(
                  'relative z-10 flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  step.completed
                    ? 'border-green bg-green text-white'
                    : step.active
                      ? 'border-orange bg-orange text-white'
                      : 'border-gray-4 bg-white text-gray-4'
                )}
              >
                {/* Pulse animation for active step */}
                {step.active && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-orange/30" />
                )}
                <Icon size={16} className="relative z-10" />
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    step.completed
                      ? 'text-green'
                      : step.active
                        ? 'text-orange'
                        : 'text-gray-3'
                  )}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="mt-0.5 text-xs text-gray-3">
                    {new Date(step.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {step.description && (
                  <p className="mt-0.5 text-xs text-gray-3">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time tracking button */}
      <div className="mt-6 border-t border-gray-5 pt-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-light"
        >
          <Navigation size={16} />
          Suivre en temps reel
        </button>
      </div>

      {/* Real-time tracking modal (placeholder for Firebase Realtime) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-3 transition-colors hover:bg-gray-5 hover:text-dark"
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-semibold text-dark">Suivi en temps reel</h3>

            {/* Map placeholder */}
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-6">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-3 text-gray-4" />
                <p className="text-sm font-medium text-gray-3">
                  Carte de suivi en temps reel
                </p>
                <p className="mt-1 text-xs text-gray-4">
                  Disponible prochainement via Firebase Realtime
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full rounded-lg border border-gray-4 px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-gray-6"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = useCallback(
    (orderData: OrderDetail) => {
      api
        .get<{ data: TrackingData }>(`/shipping/tracking/${params.id}`)
        .then((res) => {
          if (res.data) {
            setTracking(res.data);
          } else {
            setTracking(buildFallbackTracking(orderData));
          }
        })
        .catch(() => {
          // API unavailable — build fallback from order status
          setTracking(buildFallbackTracking(orderData));
        });
    },
    [params.id]
  );

  useEffect(() => {
    api
      .get<{ data: OrderDetail }>(`/orders/${params.id}`)
      .then((res) => {
        const o = res.data || null;
        setOrder(o);
        if (o) fetchTracking(o);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id, fetchTracking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm text-center py-16">
        <p className="text-gray-3">Commande introuvable</p>
        <Link href="/account/orders" className="mt-4 inline-block text-sm text-orange hover:underline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-3 transition-colors hover:text-orange"
      >
        <ArrowLeft size={16} />
        Retour aux commandes
      </Link>

      {/* Status timeline (horizontal — existing) */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Commande {order.code}</h1>

        <div className="relative flex items-center justify-between">
          {/* Progress line */}
          <div className="absolute left-0 top-5 h-0.5 w-full bg-gray-5" />
          <div
            className="absolute left-0 top-5 h-0.5 bg-green transition-all"
            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
          />

          {statusSteps.map((step, i) => {
            const Icon = step.icon;
            const done = i <= currentStep;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    done
                      ? 'border-green bg-green text-white'
                      : 'border-gray-4 bg-white text-gray-4'
                  )}
                >
                  {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    done ? 'text-green' : 'text-gray-3'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== Tracking section (NEW) ====== */}
      {tracking && <TrackingTimeline tracking={tracking} />}

      {/* Order info */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-dark">Informations de la commande</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-gray-3">Code commande</p>
            <p className="mt-1 text-sm font-semibold text-dark">{order.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-3">Date</p>
            <p className="mt-1 text-sm font-semibold text-dark">
              {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-3">Moyen de paiement</p>
            <p className="mt-1 text-sm font-semibold text-dark">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-xs text-gray-3">Statut paiement</p>
            <span className="mt-1 inline-block rounded-full bg-green/10 px-3 py-0.5 text-xs font-semibold text-green">
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-dark">Articles commandes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-5 text-xs text-gray-3">
                <th className="pb-3 font-medium">Produit</th>
                <th className="pb-3 font-medium">Variante</th>
                <th className="pb-3 text-center font-medium">Qte</th>
                <th className="pb-3 text-right font-medium">Prix unitaire</th>
                <th className="pb-3 text-right font-medium">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-5 last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="h-12 w-12 rounded-md border border-gray-5 object-cover"
                      />
                      <span className="font-medium text-dark">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-2">{item.variant}</td>
                  <td className="py-4 text-center text-gray-2">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-2">{formatPrice(item.unitPrice)}</td>
                  <td className="py-4 text-right font-semibold text-dark">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping address + Totals */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping address */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-dark">Adresse de livraison</h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-dark">{order.shippingAddress.name}</p>
            <p className="text-gray-2">{order.shippingAddress.phone}</p>
            <p className="text-gray-2">{order.shippingAddress.address}</p>
            <p className="text-gray-2">
              {order.shippingAddress.city}, {order.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Order totals */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-dark">Recapitulatif</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-2">Sous-total</span>
              <span className="text-dark">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-2">Livraison</span>
              <span className="text-dark">{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-2">Taxes</span>
              <span className="text-dark">{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-5 pt-3">
              <span className="text-base font-bold text-dark">Total</span>
              <span className="text-base font-bold text-orange">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button className="flex items-center gap-2 rounded-lg border border-orange px-5 py-2.5 text-sm font-semibold text-orange transition-colors hover:bg-orange/5">
          <RotateCcw size={16} />
          Demander remboursement
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light">
          <Star size={16} />
          Laisser un avis
        </button>
      </div>
    </div>
  );
}
