'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  MessageSquare,
  Ticket,
  Wallet,
  Users,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/account', label: 'Mon profil', icon: User, exact: true },
  { href: '/account/orders', label: 'Mes commandes', icon: ShoppingBag },
  { href: '/account/wishlist', label: 'Mes favoris', icon: Heart },
  { href: '/account/addresses', label: 'Mes adresses', icon: MapPin },
  { href: '/account/messages', label: 'Messagerie', icon: MessageSquare },
  { href: '/account/coupons', label: 'Coupons & credits', icon: Ticket },
  { href: '/account/wallet', label: 'Portefeuille', icon: Wallet },
  { href: '/account/affiliate', label: 'Programme affilie', icon: Users },
  { href: '/account/settings', label: 'Parametres', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-5 border-t-orange" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-6">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-4 sm:py-6 lg:flex lg:gap-6">
        {/* Sidebar */}
        <aside className="mb-4 lg:mb-0 lg:w-[260px] lg:shrink-0">
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            {/* User mini card */}
            <div className="hidden lg:block border-b border-gray-5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange text-sm font-bold text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : ''
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-3">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex overflow-x-auto py-2 lg:flex-col lg:overflow-x-visible">
              {menuItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 items-center gap-2 lg:gap-3 px-3 lg:px-5 py-2.5 text-xs lg:text-sm transition-colors whitespace-nowrap',
                      isActive
                        ? 'lg:border-r-3 border-b-2 lg:border-b-0 border-orange bg-orange/5 font-semibold text-orange'
                        : 'text-gray-2 hover:bg-gray-6 hover:text-dark'
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
