'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import AddressMapPicker from '@/components/AddressMapPicker';
import { estimateShipping, type ShippingRate } from '@/lib/shipping';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  Plus,
  ChevronRight,
  Globe,
  Banknote,
  Package,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
}

type PaymentMethod = 'MTN_MOMO' | 'ORANGE_MONEY' | 'KPAY_GATEWAY' | 'GFS_PAYMENT' | 'PAYPAL' | 'COD';

const STEPS = [
  { num: 1, label: 'Adresse', icon: MapPin },
  { num: 2, label: 'Livraison', icon: Truck },
  { num: 3, label: 'Paiement', icon: CreditCard },
  { num: 4, label: 'Confirmation', icon: CheckCircle },
];

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', address: '', city: '', country: 'Cameroun', lat: 0, lng: 0 });

  // Shipping
  type ShippingChoice = 'standard' | 'express';
  const [shippingChoices, setShippingChoices] = useState<Record<string, ShippingChoice>>({});

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Confirmation
  const [orderNumber, setOrderNumber] = useState('');
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    api.get<{ data: any[] }>('/addresses')
      .then((res) => {
        const addrs: Address[] = (res.data || []).map((a: any) => ({
          id: a.id,
          name: a.fullName || a.name || '',
          phone: a.phone || '',
          address: a.address || '',
          city: a.city || '',
          country: a.country?.name || 'Cameroun',
          isDefault: a.isDefault,
          lat: a.latitude || 0,
          lng: a.longitude || 0,
        }));
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, []);

  const groupedByShop = useMemo(() => {
    const map = new Map<string, { shopName: string; shopCity: string; shopCountry: string; items: typeof items }>();
    for (const item of items) {
      const existing = map.get(item.shopId);
      if (existing) existing.items.push(item);
      else map.set(item.shopId, { shopName: item.shopName, shopCity: item.shopCity || '', shopCountry: item.shopCountry || 'CM', items: [item] });
    }
    return map;
  }, [items]);

  // Compute shipping estimates per shop based on seller city vs buyer city
  const shippingEstimates = useMemo(() => {
    const addr = addresses.find((a) => a.id === selectedAddress);
    if (!addr) return new Map<string, ShippingRate>();

    const map = new Map<string, ShippingRate>();
    for (const [shopId, group] of groupedByShop) {
      const sellerCity = group.shopCity;
      const sellerCountry = group.shopCountry;
      const rate = estimateShipping(sellerCity, sellerCountry, addr.city, addr.country);
      map.set(shopId, rate);
    }
    return map;
  }, [selectedAddress, addresses, groupedByShop]);

  const getShippingFee = (shopId: string, choice: ShippingChoice): number => {
    const rate = shippingEstimates.get(shopId);
    if (!rate) return choice === 'express' ? 5000 : 2000;
    return choice === 'express' ? rate.expressFee : rate.standardFee;
  };

  const getEstimatedDays = (shopId: string, choice: ShippingChoice): string => {
    const rate = shippingEstimates.get(shopId);
    if (!rate) return choice === 'express' ? '3-5 jours' : '7-15 jours';
    return choice === 'express' ? rate.expressDays : rate.standardDays;
  };

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const shippingTotal = useMemo(() => {
    let total = 0;
    for (const [shopId] of groupedByShop) {
      const choice = shippingChoices[shopId] || 'standard';
      total += getShippingFee(shopId, choice);
    }
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByShop, shippingChoices, shippingEstimates]);

  const total = subtotal + shippingTotal;

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post<{ data: Address }>('/addresses', {
        fullName: newAddress.name,
        phone: newAddress.phone,
        address: newAddress.address,
        city: newAddress.city,
        latitude: newAddress.lat || undefined,
        longitude: newAddress.lng || undefined,
        isDefault: addresses.length === 0,
      });
      if (res.data) {
        const saved: Address = {
          id: res.data.id,
          name: (res.data as any).fullName || newAddress.name,
          phone: (res.data as any).phone || newAddress.phone,
          address: (res.data as any).address || newAddress.address,
          city: (res.data as any).city || newAddress.city,
          country: newAddress.country,
          isDefault: (res.data as any).isDefault,
          lat: (res.data as any).latitude || newAddress.lat,
          lng: (res.data as any).longitude || newAddress.lng,
        };
        setAddresses((prev) => [...prev, saved]);
        setSelectedAddress(saved.id);
      }
    } catch {
      alert('Erreur lors de l\'ajout de l\'adresse. Veuillez reessayer.');
      return;
    }
    setShowAddressForm(false);
    setNewAddress({ name: '', phone: '', address: '', city: '', country: 'Cameroun', lat: 0, lng: 0 });
  }

  async function handleConfirmOrder() {
    if (confirmingOrder) return;
    setConfirmingOrder(true);
    setOrderError('');
    try {
      // 1. Creer la commande depuis le panier
      const res = await api.post<{ data: { combinedOrderId: string; orderNumber: string; orderIds: string[] } }>('/orders', {
        addressId: selectedAddress,
        paymentMethod,
      });
      const combinedOrderId = res.data?.combinedOrderId;
      const num = res.data?.orderNumber || '';
      setOrderNumber(num);

      // 2. Commande creee — vider le panier frontend maintenant
      //    (le panier serveur est deja vide apres POST /orders)
      clearCart();

      // 3. Initier le paiement
      if (paymentMethod === 'COD') {
        await api.post('/payments/init', {
          combinedOrderId,
          method: 'COD',
        });
        setStep(4);
      } else if (paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY') {
        if (!phoneNumber || phoneNumber.length < 12) {
          setOrderError('Veuillez entrer un numero de telephone valide (237XXXXXXXXX)');
          return;
        }
        await api.post('/payments/init', {
          combinedOrderId,
          method: paymentMethod,
          mode: 'USSD',
          phoneNumber,
        });
        setStep(4);
      } else if (paymentMethod === 'GFS_PAYMENT') {
        const payRes = await api.post<{ data: { paymentUrl: string } }>('/payments/init', {
          combinedOrderId,
          method: 'GFS_PAYMENT',
          returnUrl: `${window.location.origin}/checkout/payment-return`,
        });
        if (payRes.data?.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
        } else {
          setStep(4);
        }
      } else if (paymentMethod === 'PAYPAL') {
        // PayPal pas encore supporte, confirmer en attendant
        setStep(4);
      }
    } catch (err: any) {
      setOrderError(err?.response?.data?.message || err?.message || 'Erreur lors de la creation de la commande. Veuillez reessayer.');
    } finally {
      setConfirmingOrder(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  step === s.num
                    ? 'bg-[#E82328] text-white'
                    : step > s.num
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white text-gray-400'
                }`}
              >
                {step > s.num ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.num}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="mx-1 h-4 w-4 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 - Adresse */}
        {step === 1 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#191919]">Adresse de livraison</h2>

            {loadingAddresses ? (
              <div className="flex justify-center py-8">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#E82328] border-t-transparent" />
              </div>
            ) : null}

            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${
                    selectedAddress === addr.id
                      ? 'border-[#E82328] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1 accent-[#E82328]"
                  />
                  <div>
                    <p className="font-medium text-[#191919]">{addr.name}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    <p className="text-sm text-gray-500">
                      {addr.address}, {addr.city}, {addr.country}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleAddAddress} className="mt-6 space-y-4 rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-[#191919]">Nouvelle adresse</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Nom complet"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    required
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                  <input
                    placeholder="Telephone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                </div>
                <input
                  placeholder="Adresse"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Ville"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                  <input
                    placeholder="Pays"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    required
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                </div>
                <AddressMapPicker
                  initialLat={newAddress.lat}
                  initialLng={newAddress.lng}
                  onChange={(data) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      address: data.address || prev.address,
                      city: data.city || prev.city,
                      country: data.country || prev.country,
                      lat: data.lat,
                      lng: data.lng,
                    }))
                  }
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#E82328] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#D11F23]"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddressForm(true)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#E82328] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Ajouter une nouvelle adresse
              </button>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedAddress}
                className="rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 2 - Livraison */}
        {step === 2 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#191919]">Methode de livraison</h2>

            {/* Partenaire de livraison */}
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E82328] text-xs font-bold text-white">
                ME
              </div>
              <div>
                <p className="text-sm font-semibold text-[#191919]">Livre par Merci E</p>
                <p className="text-xs text-gray-500">Partenaire de livraison officiel</p>
              </div>
            </div>

            {/* Shipping estimate info — dynamic per address */}
            {shippingEstimates.size > 0 && (
              <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="mb-3 text-sm font-medium text-[#191919]">
                  Estimation de livraison
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm">
                    <Package className="h-3.5 w-3.5 text-[#E82328]" />
                    <span>Vendeur</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  <div className="flex items-center gap-1.5 rounded-full bg-[#E82328]/10 px-3 py-1 shadow-sm">
                    <Truck className="h-3.5 w-3.5 text-[#E82328]" />
                    <span className="font-medium text-[#E82328]">Merci E</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-[#00A06A]" />
                    <span>Client</span>
                  </div>
                  {(() => {
                    const labels = [...new Set(Array.from(shippingEstimates.values()).map((r) => r.label))];
                    return (
                      <span className="ml-2 text-xs font-medium text-[#4A90D9]">
                        {labels.join(' / ')}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {Array.from(groupedByShop.entries()).map(([shopId, group]) => {
                const choice = shippingChoices[shopId] || 'standard';
                const rate = shippingEstimates.get(shopId);
                return (
                  <div key={shopId} className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-3 font-medium text-[#191919]">
                      {group.shopName}
                      {rate && (
                        <span className="ml-2 text-xs font-medium text-[#4A90D9]">
                          ({rate.label})
                        </span>
                      )}
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                      {group.items.length} article{group.items.length > 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      <label
                        className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition ${
                          choice === 'standard' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`shipping-${shopId}`}
                            checked={choice === 'standard'}
                            onChange={() => setShippingChoices({ ...shippingChoices, [shopId]: 'standard' })}
                            className="accent-[#E82328]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#191919]">Standard</p>
                            <p className="text-xs text-gray-500">{getEstimatedDays(shopId, 'standard')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#191919]">{formatPrice(getShippingFee(shopId, 'standard'))}</span>
                      </label>
                      <label
                        className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition ${
                          choice === 'express' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`shipping-${shopId}`}
                            checked={choice === 'express'}
                            onChange={() => setShippingChoices({ ...shippingChoices, [shopId]: 'express' })}
                            className="accent-[#E82328]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#191919]">Express</p>
                            <p className="text-xs text-gray-500">{getEstimatedDays(shopId, 'express')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#191919]">{formatPrice(getShippingFee(shopId, 'express'))}</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23]"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Paiement */}
        {step === 3 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Payment methods */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-[#191919]">Methode de paiement</h2>

                <div className="space-y-3">
                  {/* MTN MoMo */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      paymentMethod === 'MTN_MOMO' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'MTN_MOMO'}
                      onChange={() => setPaymentMethod('MTN_MOMO')}
                      className="accent-[#E82328]"
                    />
                    <Image src="/images/payments/mtn-momo.jpeg" alt="MTN MoMo" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919]">MTN Mobile Money</p>
                      <p className="text-xs text-gray-500">Paiement direct via MTN MoMo</p>
                    </div>
                  </label>

                  {/* Orange Money */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      paymentMethod === 'ORANGE_MONEY' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'ORANGE_MONEY'}
                      onChange={() => setPaymentMethod('ORANGE_MONEY')}
                      className="accent-[#E82328]"
                    />
                    <Image src="/images/payments/orange-money.png" alt="Orange Money" width={40} height={40} className="h-10 w-10 rounded-lg object-contain" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919]">Orange Money</p>
                      <p className="text-xs text-gray-500">Paiement direct via Orange Money</p>
                    </div>
                  </label>

                  {/* Phone number input for MoMo/OM */}
                  {(paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY') && (
                    <div className="ml-14 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <label className="mb-2 block text-sm font-medium text-[#191919]">
                        Numero de telephone {paymentMethod === 'MTN_MOMO' ? 'MTN' : 'Orange'}
                      </label>
                      <input
                        type="tel"
                        placeholder="237XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                      />
                      <p className="mt-1 text-xs text-gray-400">Format: 237 suivi de 9 chiffres</p>
                    </div>
                  )}

                  {/* GFSolutions */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      paymentMethod === 'GFS_PAYMENT' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'GFS_PAYMENT'}
                      onChange={() => setPaymentMethod('GFS_PAYMENT')}
                      className="accent-[#E82328]"
                    />
                    <Image src="/images/payments/gfs.jpeg" alt="GFSolutions" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919]">GFSolutions</p>
                      <p className="text-xs text-gray-500">Paiement via GFSolutions</p>
                    </div>
                  </label>

                  {/* PayPal */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      paymentMethod === 'PAYPAL' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'PAYPAL'}
                      onChange={() => setPaymentMethod('PAYPAL')}
                      className="accent-[#E82328]"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087] text-sm font-bold text-white">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919]">PayPal</p>
                      <p className="text-xs text-gray-500">Paiement international via PayPal</p>
                    </div>
                  </label>

                  {/* COD */}
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      paymentMethod === 'COD' ? 'border-[#E82328] bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-[#E82328]"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600 text-sm font-bold text-white">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919]">Paiement a la livraison</p>
                      <p className="text-xs text-gray-500">Payez en especes a la reception</p>
                    </div>
                  </label>
                </div>


                {orderError && (
                  <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E82328]">
                    {orderError}
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => { setOrderError(''); handleConfirmOrder(); }}
                    disabled={confirmingOrder || ((paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY') && phoneNumber.length < 12)}
                    className="flex items-center gap-2 rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-60"
                  >
                    {confirmingOrder && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Confirmer et payer
                  </button>
                </div>
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-[#191919]">Resume de la commande</h3>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-[#191919]">{item.productName}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-medium text-[#191919]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Livraison</span>
                    <span>{formatPrice(shippingTotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-[#191919]">
                    <span>Total</span>
                    <span className="text-[#E82328]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 - Confirmation (COD uniquement, les autres redirigent vers gateway) */}
        {step === 4 && (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-[#191919]">Commande enregistree !</h2>
            <p className="mb-2 text-gray-500">
              {paymentMethod === 'COD'
                ? 'Votre commande a ete enregistree. Vous payerez a la livraison.'
                : paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY'
                  ? 'Une demande de paiement a ete envoyee sur votre telephone. Confirmez le paiement pour valider votre commande.'
                  : 'Merci pour votre commande sur EstuaireAchats.'}
            </p>
            <p className="mb-8 text-lg font-semibold text-[#191919]">
              Numero de commande : <span className="text-[#E82328]">{orderNumber}</span>
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/account/orders"
                className="rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23]"
              >
                Voir mes commandes
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Continuer les achats
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
