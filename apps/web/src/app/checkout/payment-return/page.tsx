'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const reference = searchParams.get('reference');

  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'success' || status === 'paid') {
      setPaymentStatus('success');
    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'failed' || status === 'cancelled') {
      setPaymentStatus('failed');
    } else {
      setPaymentStatus('pending');
    }
    setChecking(false);
  }, [status]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#E82328]" />
          <p className="text-gray-600">Verification du paiement en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-10 text-center shadow-sm">
        {paymentStatus === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-[#191919]">Paiement reussi !</h2>
            <p className="mb-2 text-gray-500">Votre paiement a ete confirme avec succes.</p>
            {reference && (
              <p className="mb-6 text-sm text-gray-400">Reference : {reference}</p>
            )}
            <div className="flex flex-col gap-3">
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
          </>
        )}

        {paymentStatus === 'failed' && (
          <>
            <XCircle className="mx-auto mb-6 h-20 w-20 text-[#E82328]" />
            <h2 className="mb-2 text-2xl font-bold text-[#191919]">Paiement echoue</h2>
            <p className="mb-6 text-gray-500">
              Le paiement n&apos;a pas pu etre effectue. Vous pouvez reessayer depuis vos commandes.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/account/orders"
                className="rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23]"
              >
                Voir mes commandes
              </Link>
              <Link
                href="/checkout"
                className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Reessayer
              </Link>
            </div>
          </>
        )}

        {paymentStatus === 'pending' && (
          <>
            <AlertTriangle className="mx-auto mb-6 h-20 w-20 text-orange-500" />
            <h2 className="mb-2 text-2xl font-bold text-[#191919]">Paiement en attente</h2>
            <p className="mb-6 text-gray-500">
              Votre paiement est en cours de traitement. Vous serez notifie une fois le paiement confirme.
            </p>
            <div className="flex flex-col gap-3">
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
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
          <Loader2 className="h-12 w-12 animate-spin text-[#E82328]" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
