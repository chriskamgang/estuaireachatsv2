'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

type AccountType = 'buyer' | 'seller';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();

  const roleFromUrl = searchParams.get('role');
  const [accountType, setAccountType] = useState<AccountType>(
    roleFromUrl === 'seller' ? 'seller' : 'buyer'
  );

  useEffect(() => {
    if (roleFromUrl === 'seller') {
      setAccountType('seller');
    }
  }, [roleFromUrl]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
        role: accountType === 'seller' ? 'SELLER' : 'BUYER',
      });
      router.push(accountType === 'seller' ? (process.env.NEXT_PUBLIC_SELLER_URL || 'https://seller.estuaireachats.com') + '/dashboard' : '/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#E82328]">
            Estuaire<span className="text-[#4A90D9]">Achats</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-[#191919]">Creer un compte</h1>

          {/* Account type toggle */}
          <div className="mb-6 flex rounded-lg bg-[#F5F5F5] p-1">
            <button
              type="button"
              onClick={() => setAccountType('buyer')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                accountType === 'buyer'
                  ? 'bg-white text-[#E82328] shadow-sm'
                  : 'text-gray-500 hover:text-[#191919]'
              }`}
            >
              Acheteur
            </button>
            <button
              type="button"
              onClick={() => setAccountType('seller')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                accountType === 'seller'
                  ? 'bg-white text-[#E82328] shadow-sm'
                  : 'text-gray-500 hover:text-[#191919]'
              }`}
            >
              Vendeur
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E82328]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Prenom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-[#191919]">
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#191919]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#191919]">
                Telephone <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#191919]">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[#191919]">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-[#191919] outline-none transition focus:border-[#E82328] focus:ring-2 focus:ring-[#E82328]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#E82328]"
              />
              <span className="text-sm text-gray-600">
                J&apos;accepte les{' '}
                <Link href="/terms" className="text-[#E82328] hover:underline">
                  conditions d&apos;utilisation
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E82328] py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              S&apos;inscrire
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Deja un compte ?{' '}
            <Link href="/login" className="font-medium text-[#E82328] hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
