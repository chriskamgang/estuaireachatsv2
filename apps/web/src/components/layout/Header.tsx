'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  ClipboardList,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Globe,
  Search,
  Camera,
  Bell,
  CheckCheck,
  X,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';

const COUNTRIES = [
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF' },
  { code: 'CI', name: "Cote d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', currency: 'XAF' },
  { code: 'CD', name: 'RD Congo', flag: '🇨🇩', currency: 'CDF' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', currency: 'XOF' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [imageSearchDescription, setImageSearchDescription] = useState('');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () => {
      api.get<{ data: { count: number } }>('/notifications/unread-count')
        .then(res => setUnreadCount(res.data?.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const openNotifs = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      api.get<{ data: any[] }>('/notifications?perPage=10')
        .then(res => setNotifs(res.data || []))
        .catch(() => {});
    }
  };

  const markAllRead = () => {
    api.post('/notifications/mark-all-read').then(() => {
      setUnreadCount(0);
      setNotifs(notifs.map(n => ({ ...n, isRead: true })));
    }).catch(() => {});
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleImageSearchOpen = () => {
    setImageSearchOpen(true);
    setImageSearchPreview(null);
    setImageSearchDescription('');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSearchPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSearchSubmit = () => {
    if (imageSearchDescription.trim()) {
      setImageSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(imageSearchDescription.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <img
            src="/images/logo.png"
            alt="EstuaireAchats"
            className="h-[80px] w-auto"
          />
        </Link>

        {/* Search bar — shown on all pages except homepage */}
        {!isHomepage && (
          <form onSubmit={handleSearch} className="flex flex-1 items-center max-w-[600px]">
            <div className="flex w-full items-center rounded-l-full border-2 border-r-0 border-orange bg-white">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="h-[38px] w-full bg-transparent px-4 text-sm text-dark outline-none placeholder:text-gray-3"
              />
              <button
                type="button"
                onClick={handleImageSearchOpen}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center text-gray-3 hover:text-orange"
                aria-label="Recherche par image"
              >
                <Camera size={18} />
              </button>
            </div>
            <button
              type="submit"
              className="flex h-[42px] items-center gap-1.5 rounded-r-full bg-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-light"
            >
              <Search size={16} />
              Rechercher
            </button>
          </form>
        )}

        {/* Spacer on homepage */}
        {isHomepage && <div className="flex-1" />}

        {/* Right side: delivery, language, icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Deliver to */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-gray-2 hover:text-dark transition-colors cursor-pointer"
            >
              <div className="text-right leading-tight">
                <div className="text-[11px] text-gray-3">Livrer vers :</div>
                <div className="flex items-center gap-1 font-semibold text-dark">
                  <span className="text-base">{selectedCountry.flag}</span>
                  {selectedCountry.code}
                </div>
              </div>
              <ChevronDown size={12} className="text-gray-3" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-gray-5 rounded-lg shadow-lg py-1 max-h-72 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-6 text-left cursor-pointer text-[13px] ${
                      selectedCountry.code === country.code ? 'bg-gray-6 font-medium text-dark' : 'text-gray-1'
                    }`}
                  >
                    <span className="text-base">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-gray-3 text-[11px]">{country.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language */}
          <span className="flex items-center gap-1 px-2 py-1.5 text-[12px] text-gray-2">
            <Globe size={14} />
            Francais-XAF
          </span>

          {/* Icons */}
          <nav className="flex items-center gap-0 ml-1">
            <Link
              href="/messages"
              className="flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark"
            >
              <MessageSquare size={20} />
              <span className="mt-0.5 text-[10px]">Messages</span>
            </Link>

            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifs}
                  className="flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark"
                >
                  <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 text-[10px]">Alertes</span>
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-5">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-5">
                      <span className="text-sm font-semibold text-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-orange hover:underline">
                          <CheckCheck size={12} /> Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-3">Aucune notification</p>
                      ) : (
                        notifs.map((n: any) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-gray-5 last:border-0 ${!n.isRead ? 'bg-orange-50/50' : ''}`}>
                            <p className="text-sm font-medium text-dark">{n.title}</p>
                            <p className="text-xs text-gray-3 mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-gray-4 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/orders"
              className="flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark"
            >
              <ClipboardList size={20} />
              <span className="mt-0.5 text-[10px]">Commandes</span>
            </Link>

            <Link
              href="/cart"
              className="relative flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark"
            >
              <div className="relative">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px]">Panier</span>
            </Link>

            {isAuthenticated && user ? (
              <div className="group relative">
                <button className="flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark">
                  <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.firstName, user.lastName)
                    )}
                  </div>
                  <span className="mt-0.5 max-w-[50px] truncate text-[10px]">
                    {user.firstName}
                  </span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 min-w-[180px] rounded-md border border-gray-5 bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                  <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-1 hover:bg-gray-6">
                    <User size={14} />
                    Mon compte
                  </Link>
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-1 hover:bg-gray-6">
                    <ClipboardList size={14} />
                    Mes commandes
                  </Link>
                  <hr className="my-1 border-gray-5" />
                  <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-1 hover:bg-gray-6">
                    <LogOut size={14} />
                    Deconnexion
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center rounded-md px-2.5 py-1.5 text-gray-2 transition-colors hover:bg-gray-6 hover:text-dark"
              >
                <User size={20} />
                <span className="mt-0.5 text-[10px]">Connexion</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
      {/* Image Search Modal */}
      {imageSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setImageSearchOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-5">
              <h3 className="text-[16px] font-semibold text-dark">Recherche par image</h3>
              <button onClick={() => setImageSearchOpen(false)} className="text-gray-3 hover:text-dark transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Hidden file input */}
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />

              {!imageSearchPreview ? (
                /* Upload zone */
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-4 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-orange hover:bg-orange/5 transition-colors cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-3" />
                  <span className="text-[14px] text-gray-2">Cliquez ou glissez une image ici</span>
                  <span className="text-[12px] text-gray-3">JPG, PNG, WEBP</span>
                </button>
              ) : (
                /* Image preview */
                <div className="relative">
                  <img src={imageSearchPreview} alt="Preview" className="w-full max-h-[240px] object-contain rounded-xl bg-gray-6" />
                  <button
                    onClick={() => { setImageSearchPreview(null); setImageSearchDescription(''); if (imageFileInputRef.current) imageFileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Description input */}
              <div>
                <label className="block text-[13px] text-gray-2 mb-1.5">Decrivez ce que vous voyez dans l&apos;image</label>
                <input
                  type="text"
                  value={imageSearchDescription}
                  onChange={(e) => setImageSearchDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImageSearchSubmit(); }}
                  placeholder="Ex: chaussures de sport noires, cable USB type C..."
                  className="w-full px-4 py-2.5 border-2 border-gray-5 rounded-xl text-[14px] text-dark outline-none focus:border-orange transition-colors placeholder:text-gray-3"
                />
              </div>

              {/* Search button */}
              <button
                onClick={handleImageSearchSubmit}
                disabled={!imageSearchDescription.trim()}
                className="w-full flex items-center justify-center gap-2 bg-orange text-white py-3 rounded-xl text-[14px] font-semibold hover:bg-orange-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
