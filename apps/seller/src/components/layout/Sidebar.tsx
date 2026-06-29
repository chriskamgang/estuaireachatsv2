'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Upload, FolderOpen, Star,
  ChevronDown, Search, PlusCircle, ListOrdered, FileCode, Tags,
  MessageSquare, Settings, CreditCard, History, Wallet, RefreshCcw,
  Gavel, Boxes, Ticket, Megaphone, Store, Truck, MessageCircle,
  HelpCircle, ClipboardList, Layers, FileText, X,
} from 'lucide-react';

interface SubItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: SubItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },

  {
    label: 'Produits',
    icon: Package,
    children: [
      { label: 'Tous les produits', href: '/products', icon: ListOrdered },
      { label: 'Ajouter un produit', href: '/products/create', icon: PlusCircle },
      { label: 'Import en masse', href: '/products/bulk-upload', icon: Upload },
      { label: 'Produits numeriques', href: '/products/digital', icon: FileCode },
      { label: 'Avis produits', href: '/reviews', icon: MessageSquare },
    ],
  },

  { label: 'Fichiers telecharges', href: '/uploads', icon: FolderOpen },

  {
    label: 'Package',
    icon: Layers,
    children: [
      { label: 'Packages disponibles', href: '/packages', icon: ListOrdered },
      { label: 'Acheter un package', href: '/packages/purchase', icon: CreditCard },
    ],
  },

  { label: 'Coupons', href: '/coupons', icon: Megaphone },

  { label: 'Produits en gros', href: '/wholesale', icon: Boxes },

  {
    label: 'Encheres',
    icon: Gavel,
    children: [
      { label: 'Tous les produits encheres', href: '/auction', icon: ListOrdered },
      { label: 'Commandes encheres', href: '/auction/orders', icon: ShoppingCart },
    ],
  },

  {
    label: 'Systeme POS',
    icon: ClipboardList,
    children: [
      { label: 'Gestionnaire POS', href: '/pos', icon: Store },
      { label: 'Configuration POS', href: '/pos/config', icon: Settings },
    ],
  },

  { label: 'Commandes', href: '/orders', icon: ShoppingCart },

  { label: 'Demandes de remboursement', href: '/refunds', icon: RefreshCcw },

  { label: 'Parametres boutique', href: '/shop-settings', icon: Settings },

  { label: 'Historique paiements', href: '/payments', icon: History },

  { label: 'Retrait d\'argent', href: '/withdrawals', icon: Wallet },

  { label: 'Historique commissions', href: '/commissions', icon: CreditCard },

  { label: 'Conversations', href: '/conversations', icon: MessageCircle },

  { label: 'Demandes de devis', href: '/rfq', icon: FileText },

  { label: 'Questions produits', href: '/product-queries', icon: HelpCircle },

  { label: 'Tickets de support', href: '/support', icon: Ticket },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const filteredItems = menuItems.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (item.label.toLowerCase().includes(s)) return true;
    return item.children?.some((c) => c.label.toLowerCase().includes(s));
  });

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-[260px] bg-sidebar text-white/80 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo / Shop name */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="block" onClick={onClose}>
            <h1 className="text-lg font-bold text-white">EstuaireAchats</h1>
            <p className="text-xs text-white/50 mt-0.5">Espace Vendeur</p>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 placeholder:text-white/40 outline-none focus:bg-white/15 transition"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="space-y-0.5">
            {filteredItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = openMenus[item.label];
              const active = item.href ? isActive(item.href) : item.children?.some((c) => isActive(c.href));
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                          active ? 'bg-sidebar-active text-white' : 'hover:bg-sidebar-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <ul className="mt-0.5 ml-4 border-l border-white/10 pl-3 space-y-0.5">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                                    isActive(child.href)
                                      ? 'bg-sidebar-active text-white font-medium'
                                      : 'hover:bg-sidebar-hover'
                                  }`}
                                >
                                  {ChildIcon && <ChildIcon className="w-3.5 h-3.5 shrink-0" />}
                                  <span>{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                        active ? 'bg-sidebar-active text-white' : 'hover:bg-sidebar-hover'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
