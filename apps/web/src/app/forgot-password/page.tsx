'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#E82328]">
            Estuaire<span className="text-[#4A90D9]">Achats</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h1 className="mb-2 text-xl font-bold text-[#191919]">Email envoye</h1>
              <p className="mb-6 text-sm text-gray-500">
                Si un compte est associe a <strong>{email}</strong>, vous recevrez un lien de
                reinitialisation.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#E82328] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold text-[#191919]">
                Mot de passe oublie ?
              </h1>
              <p className="mb-6 text-center text-sm text-gray-500">
                Entrez votre email et nous vous enverrons un lien de reinitialisation.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E82328]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#191919]">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E82328] py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-60"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Envoyer le lien de reinitialisation
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#E82328] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour a la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
