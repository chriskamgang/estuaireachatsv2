'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const ELEMENT_STYLE = {
  base: {
    fontSize: '16px',
    color: '#191919',
    fontFamily: 'inherit',
    '::placeholder': {
      color: '#999',
    },
  },
  invalid: {
    color: '#E82328',
  },
};

interface CardFormProps {
  onSubmit: (stripe: any, elements: any, cardholderName: string) => Promise<void>;
  loading: boolean;
}

function CardForm({ onSubmit, loading }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleElementChange = (field: string) => (event: any) => {
    if (event.error) {
      setErrors((prev) => ({ ...prev, [field]: event.error.message }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    if (!cardholderName.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Le nom du titulaire est requis' }));
      return;
    }

    await onSubmit(stripe, elements, cardholderName);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom du titulaire */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#191919]">
          Nom du titulaire de la carte
        </label>
        <input
          type="text"
          placeholder="Ex: Jean Dupont"
          value={cardholderName}
          onChange={(e) => {
            setCardholderName(e.target.value);
            if (errors.name) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#E82328] transition"
        />
        {errors.name && <p className="mt-1 text-xs text-[#E82328]">{errors.name}</p>}
      </div>

      {/* Numero de carte */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#191919]">
          Numero de carte
        </label>
        <div className="rounded-lg border border-gray-300 px-4 py-3 focus-within:border-[#E82328] transition">
          <CardNumberElement
            options={{ style: ELEMENT_STYLE, showIcon: true }}
            onChange={handleElementChange('cardNumber')}
          />
        </div>
        {errors.cardNumber && <p className="mt-1 text-xs text-[#E82328]">{errors.cardNumber}</p>}
      </div>

      {/* Expiration + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#191919]">
            Date d&apos;expiration
          </label>
          <div className="rounded-lg border border-gray-300 px-4 py-3 focus-within:border-[#E82328] transition">
            <CardExpiryElement
              options={{ style: ELEMENT_STYLE }}
              onChange={handleElementChange('cardExpiry')}
            />
          </div>
          {errors.cardExpiry && <p className="mt-1 text-xs text-[#E82328]">{errors.cardExpiry}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#191919]">
            CVC
          </label>
          <div className="rounded-lg border border-gray-300 px-4 py-3 focus-within:border-[#E82328] transition">
            <CardCvcElement
              options={{ style: ELEMENT_STYLE }}
              onChange={handleElementChange('cardCvc')}
            />
          </div>
          {errors.cardCvc && <p className="mt-1 text-xs text-[#E82328]">{errors.cardCvc}</p>}
        </div>
      </div>

      {/* Securite */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock className="h-3.5 w-3.5" />
        <span>Paiement securise. Vos donnees sont chiffrees.</span>
      </div>

      {/* Bouton payer */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E82328] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-60"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {loading ? 'Traitement en cours...' : 'Payer par carte'}
      </button>
    </form>
  );
}

interface StripeCardFormProps {
  onSubmit: (stripe: any, elements: any, cardholderName: string) => Promise<void>;
  loading: boolean;
}

export default function StripeCardForm({ onSubmit, loading }: StripeCardFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchKey() {
      try {
        const res = await api.get<{ publishableKey: string }>('/payments/card/init');
        const key = res.publishableKey;
        if (key) {
          setStripePromise(loadStripe(key));
        } else {
          setError('Cle Stripe non disponible. Contactez le support.');
        }
      } catch (err: any) {
        setError(err?.message || 'Erreur lors de la recuperation de la cle de paiement.');
      } finally {
        setLoadingKey(false);
      }
    }
    fetchKey();
  }, []);

  if (loadingKey) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#E82328]" />
        <span className="ml-2 text-sm text-gray-500">Chargement du formulaire de paiement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E82328]">
        {error}
      </div>
    );
  }

  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise}>
      <CardForm onSubmit={onSubmit} loading={loading} />
    </Elements>
  );
}
