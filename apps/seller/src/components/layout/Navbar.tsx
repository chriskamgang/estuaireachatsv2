'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Search, Bell, ChevronDown, User, LogOut, Store, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Produits',
  reviews: 'Avis',
  uploads: 'Fichiers',
  packages: 'Packages',
  coupons: 'Coupons',
  wholesale: 'Produits en gros',
  auction: 'Encheres',
  pos: 'POS',
  orders: 'Commandes',
  refunds: 'Remboursements',
  'shop-settings': 'Parametres boutique',
  payments: 'Paiements',
  withdrawals: 'Retraits',
  commissions: 'Commissions',
  conversations: 'Conversations',
  'product-queries': 'Questions produits',
  support: 'Support',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCount = () => {
      api.get<{ data: { count: number } }>('/notifications/unread-count')
        .then(res => setUnreadCount(res.data?.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => breadcrumbMap[seg] || seg);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-4">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-dark font-medium' : 'text-gray-3'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-6 rounded-lg transition">
          <Search className="w-4 h-4 text-gray-2" />
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={openNotifs} className="p-2 hover:bg-gray-6 rounded-lg transition relative">
            <Bell className="w-4 h-4 text-gray-2" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-5 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-5">
                <span className="text-sm font-semibold text-dark">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck className="w-3 h-3" /> Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-3">Aucune notification</p>
                ) : (
                  notifs.map((n: any) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-5 last:border-0 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
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

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-6 rounded-lg px-2 py-1.5 transition"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <Store className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className="text-sm font-medium text-dark hidden md:block">
              {user?.shopName || user?.firstName || 'Vendeur'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-3" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-5 py-1 z-50">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/shop-settings');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-1 hover:bg-gray-6 transition"
              >
                <User className="w-4 h-4" />
                Ma boutique
              </button>
              <hr className="border-gray-5" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-gray-6 transition"
              >
                <LogOut className="w-4 h-4" />
                Deconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
