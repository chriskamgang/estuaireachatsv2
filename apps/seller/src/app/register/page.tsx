'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Store, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.');
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
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-4 pr-4 py-2.5 border border-gray-5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-6 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-sidebar/10 flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-sidebar" />
            </div>
            <h1 className="text-2xl font-bold text-sidebar">
              Devenir Vendeur
            </h1>
            <p className="text-gray-3 mt-2 text-sm">
              Creez votre compte vendeur et commencez a vendre
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Prenom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Jean"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Dupont"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vendeur@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1.5">
                Telephone <span className="text-gray-3">(optionnel)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 caracteres"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-3 hover:text-gray-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Retapez le mot de passe"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creation en cours...' : 'Creer mon compte vendeur'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-3">
            Deja un compte vendeur ?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
