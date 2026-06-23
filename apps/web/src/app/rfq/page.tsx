'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  FileText,
  Package,
  MapPin,
  User,
  ChevronRight,
  CheckCircle,
  ShieldCheck,
  MessageSquare,
  BadgeCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

const CATEGORIES = [
  'Electronique',
  'Habillement',
  'Maison & Jardin',
  'Beaute & Sante',
  'Automobile',
  'Machines & Equipements',
  'Materiaux de construction',
  'Alimentation',
  'Agriculture',
  'Autre',
];

const UNITS = ['Pieces', 'Kg', 'Tonnes', 'Metres', 'Litres', 'Cartons', 'Palettes'];

function RfqContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  // Step 1
  const [productDesc, setProductDesc] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Pieces');

  // Pre-fill from product query param
  useEffect(() => {
    const productSlug = searchParams.get('product');
    const qty = searchParams.get('qty');
    if (productSlug) {
      api.get<{ data: any }>(`/products/${productSlug}`)
        .then(res => {
          if (res.data) {
            const p = res.data;
            setProductId(p.id);
            setProductDesc(p.name + (p.description ? `\n${p.description}` : ''));
            if (p.category?.name) {
              const match = CATEGORIES.find(c => c.toLowerCase() === p.category.name.toLowerCase());
              if (match) setCategory(match);
            }
            const minQty = p.moq || p.minOrderQty || 1;
            setQuantity(qty || String(minQty));
            if (p.unit) setUnit(p.unit);
          }
        })
        .catch(() => {});
    } else if (qty) {
      setQuantity(qty);
    }
  }, [searchParams]);

  // Step 2
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [destination, setDestination] = useState('');

  // Step 3
  const [contactName, setContactName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post('/rfq', {
        productName: productDesc,
        description: productDesc,
        category,
        quantity: Number(quantity),
        unit,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        deliveryDate: deliveryDate || undefined,
        destination,
        contactName,
        contactEmail,
        contactPhone,
        ...(productId ? { productId } : {}),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-10 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-[#191919]">Demande envoyee !</h1>
          <p className="mb-6 text-gray-500">
            Votre demande de devis a ete soumise avec succes. Vous recevrez des reponses de
            fournisseurs verifies dans les prochaines heures.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white hover:bg-[#D11F23]"
          >
            Retour a l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E82328] to-[#E82328] px-4 py-10">
        <div className="mx-auto max-w-3xl text-center text-white">
          <FileText className="mx-auto mb-3 h-10 w-10" />
          <h1 className="mb-2 text-3xl font-bold">Demander un devis</h1>
          <p className="text-white/80">
            Decrivez le produit que vous recherchez et recevez des devis de fournisseurs verifies.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Trust badges */}
        <div className="mb-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BadgeCheck className="h-5 w-5 text-[#E82328]" />
            Fournisseurs verifies
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="h-5 w-5 text-[#E82328]" />
            Reponses sous 24h
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="h-5 w-5 text-[#E82328]" />
            Transactions securisees
          </div>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[
            { num: 1, label: 'Produit', icon: Package },
            { num: 2, label: 'Details', icon: MapPin },
            { num: 3, label: 'Contact', icon: User },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  step === s.num
                    ? 'bg-[#E82328] text-white'
                    : step > s.num
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white text-gray-400'
                }`}
              >
                {step > s.num ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < 2 && <ChevronRight className="mx-1 h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#191919]">Description du produit</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Que recherchez-vous ?
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  rows={4}
                  placeholder="Decrivez le produit en detail (type, materiau, taille, couleur, etc.)"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">Categorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                >
                  <option value="">Selectionnez une categorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#191919]">Quantite</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 500"
                    min={1}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#191919]">Unite</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!productDesc || !category || !quantity}
                  className="rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-50"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#191919]">Budget et livraison</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Fourchette de budget (FCFA)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="Min"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Max"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Date de livraison souhaitee
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Destination de livraison
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ex: Douala, Cameroun"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div className="flex justify-between pt-4">
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

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#191919]">Vos coordonnees</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">Nom complet</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#191919]">Telephone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#E82328]"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!contactName || !contactEmail || submitting}
                  className="flex items-center gap-2 rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-50"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Soumettre la demande
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust messaging */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Recevez des devis de fournisseurs verifies — Service gratuit et sans engagement.
        </p>
      </div>
    </div>
  );
}

export default function RfqPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-[#E82328] border-t-transparent" /></div>}>
      <RfqContent />
    </Suspense>
  );
}
