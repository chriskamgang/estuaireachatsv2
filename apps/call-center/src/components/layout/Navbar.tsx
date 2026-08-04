'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Menu, LogOut } from 'lucide-react';

export default function Navbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-5 px-4 sm:px-6 h-[60px] flex items-center justify-between">
      <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-6">
        <Menu className="w-5 h-5 text-gray-2" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-2">
            {user.firstName} {user.lastName}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-3 hover:text-danger transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Deconnexion</span>
        </button>
      </div>
    </header>
  );
}
