'use client';

import { useState, useEffect } from 'react';
import { Camera, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync form fields when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch('/users/me', {
        firstName,
        lastName,
        phone: phone || undefined,
      });
      // Reload user data in auth store
      await loadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User info card */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Mon profil</h1>

        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-orange text-2xl font-bold text-white">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : user ? (
                getInitials(user.firstName, user.lastName)
              ) : (
                'U'
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-dark text-white shadow-md transition-colors hover:bg-gray-1">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm text-gray-3">{user?.email}</p>
            {user?.phone && <p className="text-sm text-gray-3">{user.phone}</p>}
            <span className="mt-1 inline-block rounded-full bg-orange/10 px-3 py-0.5 text-xs font-medium text-orange">
              {user?.role === 'SELLER' ? 'Vendeur' : user?.role === 'ADMIN' ? 'Administrateur' : 'Acheteur'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-dark">Modifier mes informations</h2>

        {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E82328]">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-1">Prenom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-orange"
                placeholder="Votre prenom"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-1">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-orange"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-1">Telephone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-orange"
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-gray-5 bg-gray-6 px-4 py-2.5 text-sm text-gray-3"
            />
            <p className="mt-1 text-xs text-gray-3">L&apos;email ne peut pas etre modifie</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-1">Photo de profil</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-4 px-4 py-3 transition-colors hover:border-orange hover:bg-orange/5">
              <Camera size={20} className="text-gray-3" />
              <span className="text-sm text-gray-3">Cliquez pour changer votre photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {saved && (
              <span className="text-sm font-medium text-green">Modifications enregistrees !</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
