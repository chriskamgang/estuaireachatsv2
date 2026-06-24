'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Store, Megaphone, CreditCard,
  Truck, UserPlus, Star, BarChart3, Settings, ChevronDown, Search, PlusCircle,
  FolderTree, Tags, MessageSquare, ListOrdered, CheckCircle, PackageCheck,
  ShieldCheck, Gift, Ticket, Mail, History, Wallet, RefreshCcw, Wrench, MapPin,
  Bike, Globe, Coins, FileText, UsersRound, Gavel, Boxes, Eye, Image, Upload,
  Headphones, MessageCircle, HelpCircle, Smartphone, CreditCard as CardIcon,
  Zap, BarChart, Palette, Bot, Bell, Lock, Server, Puzzle, FileCode, Percent,
  DollarSign, ClipboardList, TrendingUp, Heart, UserSearch, ArrowDownUp,
  Layers, BookOpen, FileEdit, Monitor, LayoutTemplate, PaintBucket, KeyRound,
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
  // ── Dashboard ──
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },

  // ── Products ──
  {
    label: 'Produits',
    icon: Package,
    children: [
      { label: 'Ajouter un produit', href: '/products/create', icon: PlusCircle },
      { label: 'Tous les produits', href: '/products', icon: ListOrdered },
      { label: 'Produits internes', href: '/products?type=inhouse', icon: Package },
      { label: 'Produits vendeurs', href: '/products/seller', icon: Store },
      { label: 'Produits numeriques', href: '/products/digital', icon: FileCode },
      { label: 'Import en masse', href: '/products/bulk-import', icon: Upload },
      { label: 'Export en masse', href: '/products/bulk-export', icon: ArrowDownUp },
      { label: 'Categories', href: '/categories', icon: FolderTree },
      { label: 'Marques', href: '/brands', icon: Tags },
      { label: 'Attributs', href: '/attributes', icon: Layers },
      { label: 'Couleurs', href: '/colors', icon: Palette },
      { label: 'Guide des tailles', href: '/size-guide', icon: ClipboardList },
      { label: 'Garantie', href: '/warranty', icon: ShieldCheck },
      { label: 'Avis produits', href: '/reviews', icon: MessageSquare },
    ],
  },

  // ── Auction Products ──
  {
    label: 'Produits aux encheres',
    icon: Gavel,
    children: [
      { label: 'Ajouter produit encheres', href: '/auction/create', icon: PlusCircle },
      { label: 'Tous les produits encheres', href: '/auction', icon: ListOrdered },
      { label: 'Produits encheres internes', href: '/auction?type=inhouse', icon: Package },
      { label: 'Produits encheres vendeurs', href: '/auction?type=seller', icon: Store },
      { label: 'Commandes encheres', href: '/auction/orders', icon: ShoppingCart },
    ],
  },

  // ── Wholesale Products ──
  {
    label: 'Produits en gros',
    icon: Boxes,
    children: [
      { label: 'Ajouter produit gros', href: '/wholesale/create', icon: PlusCircle },
      { label: 'Tous les produits gros', href: '/wholesale', icon: ListOrdered },
      { label: 'Produits gros internes', href: '/wholesale?type=inhouse', icon: Package },
      { label: 'Produits gros vendeurs', href: '/wholesale?type=seller', icon: Store },
    ],
  },

  // ── Sales / Orders ──
  {
    label: 'Ventes',
    icon: ShoppingCart,
    children: [
      { label: 'Toutes les commandes', href: '/orders', icon: ListOrdered },
      { label: 'Commandes internes', href: '/orders?type=inhouse', icon: Package },
      { label: 'Commandes vendeurs', href: '/orders?type=seller', icon: Store },
      { label: 'Commandes point retrait', href: '/orders?type=pickup', icon: MapPin },
    ],
  },

  // ── POS ──
  {
    label: 'Point de vente (POS)',
    icon: Monitor,
    children: [
      { label: 'Gestionnaire POS', href: '/pos', icon: Monitor },
      { label: 'Configuration POS', href: '/pos/config', icon: Wrench },
    ],
  },

  // ── Delivery Boy ──
  {
    label: 'Livreurs',
    icon: Bike,
    children: [
      { label: 'Tous les livreurs', href: '/delivery-boys', icon: ListOrdered },
      { label: 'Ajouter un livreur', href: '/delivery-boys/create', icon: PlusCircle },
      { label: 'Historique paiements', href: '/delivery-boys/payments', icon: History },
      { label: 'Historique collectes', href: '/delivery-boys/collections', icon: DollarSign },
      { label: 'Demandes annulation', href: '/delivery-boys/cancel-requests', icon: RefreshCcw },
      { label: 'Configuration', href: '/delivery-boys/config', icon: Wrench },
    ],
  },

  // ── Refunds ──
  {
    label: 'Remboursements',
    icon: RefreshCcw,
    children: [
      { label: 'Demandes', href: '/refunds', icon: ListOrdered },
      { label: 'Approuves', href: '/refunds?status=approved', icon: CheckCircle },
      { label: 'Rejetes', href: '/refunds?status=rejected', icon: RefreshCcw },
      { label: 'Configuration', href: '/refunds/config', icon: Wrench },
    ],
  },

  // ── Customers ──
  {
    label: 'Clients',
    icon: Users,
    children: [
      { label: 'Liste des clients', href: '/customers', icon: ListOrdered },
      { label: 'Produits classifies', href: '/customers/classified', icon: FileText },
      { label: 'Packages classifies', href: '/customers/packages', icon: Gift },
    ],
  },

  // ── Sellers ──
  {
    label: 'Vendeurs',
    icon: Store,
    children: [
      { label: 'Tous les vendeurs', href: '/sellers', icon: UsersRound },
      { label: 'Boutiques', href: '/sellers/shops', icon: Store },
      { label: 'Paiements vendeurs', href: '/sellers/payouts', icon: DollarSign },
      { label: 'Demandes de retrait', href: '/withdraws', icon: Wallet },
      { label: 'Commission vendeur', href: '/sellers/commission', icon: Percent },
      { label: 'Packages vendeur', href: '/sellers/packages', icon: Gift },
      { label: 'Formulaire verification', href: '/sellers/verification', icon: ShieldCheck },
    ],
  },

  // ── Uploaded Files ──
  { label: 'Fichiers telecharges', href: '/uploads', icon: Upload },

  // ── Reports ──
  {
    label: 'Rapports',
    icon: BarChart3,
    children: [
      { label: 'Ventes internes', href: '/reports/inhouse-sales', icon: BarChart },
      { label: 'Ventes vendeurs', href: '/reports/seller-sales', icon: TrendingUp },
      { label: 'Stock produits', href: '/reports/stock', icon: Boxes },
      { label: 'Wishlist produits', href: '/reports/wishlist', icon: Heart },
      { label: 'Recherches utilisateurs', href: '/reports/searches', icon: UserSearch },
      { label: 'Historique commissions', href: '/reports/commissions', icon: Percent },
      { label: 'Historique portefeuille', href: '/reports/wallet', icon: Wallet },
    ],
  },

  // ── Blog System ──
  {
    label: 'Blog',
    icon: BookOpen,
    children: [
      { label: 'Tous les articles', href: '/blog', icon: FileEdit },
      { label: 'Categories blog', href: '/blog/categories', icon: FolderTree },
    ],
  },

  // ── Marketing ──
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { label: 'Flash Deals', href: '/flash-deals', icon: Zap },
      { label: 'Newsletter', href: '/newsletter', icon: Mail },
      { label: 'SMS en masse', href: '/marketing/bulk-sms', icon: Smartphone },
      { label: 'Abonnes', href: '/marketing/subscribers', icon: Bell },
      { label: 'Coupons', href: '/coupons', icon: Ticket },
      { label: 'Programme de fidelite', href: '/loyalty', icon: Gift },
    ],
  },

  // ── Support & Communication ──
  {
    label: 'Support',
    icon: Headphones,
    children: [
      { label: 'Tickets support', href: '/support/tickets', icon: HelpCircle },
      { label: 'Conversations produits', href: '/support/conversations', icon: MessageCircle },
      { label: 'Questions produits', href: '/support/queries', icon: MessageSquare },
    ],
  },

  // ── Affiliate System ──
  {
    label: 'Systeme affilie',
    icon: UserPlus,
    children: [
      { label: 'Formulaire inscription', href: '/affiliate/registration', icon: FileText },
      { label: 'Configuration', href: '/affiliate', icon: Wrench },
      { label: 'Utilisateurs affilies', href: '/affiliate/users', icon: UsersRound },
      { label: 'Utilisateurs referres', href: '/affiliate/referrals', icon: Users },
      { label: 'Demandes de retrait', href: '/affiliate/withdraws', icon: Wallet },
      { label: 'Logs affilie', href: '/affiliate/logs', icon: History },
    ],
  },

  // ── Offline Payment ──
  {
    label: 'Paiement hors ligne',
    icon: CreditCard,
    children: [
      { label: 'Methodes manuelles', href: '/payments/manual-methods', icon: CardIcon },
      { label: 'Recharge portefeuille', href: '/payments/offline-wallet', icon: Wallet },
      { label: 'Paiements packages client', href: '/payments/offline-customer', icon: Users },
      { label: 'Paiements packages vendeur', href: '/payments/offline-seller', icon: Store },
    ],
  },

  // ── Payment Gateways ──
  {
    label: 'Passerelles de paiement',
    icon: CreditCard,
    children: [
      { label: 'Historique paiements', href: '/payments', icon: History },
      { label: 'Configuration KPay/GFS/PayPal', href: '/payments/config', icon: KeyRound },
      { label: 'Passerelle africaine', href: '/payments/african-pg', icon: Globe },
    ],
  },

  // ── Club Point System ──
  {
    label: 'Club Points',
    icon: Star,
    children: [
      { label: 'Configuration', href: '/club-points', icon: Wrench },
      { label: 'Points produits', href: '/club-points/products', icon: Package },
      { label: 'Points utilisateurs', href: '/club-points/users', icon: Users },
    ],
  },

  // ── OTP System ──
  {
    label: 'Systeme OTP',
    icon: Lock,
    children: [
      { label: 'Configuration OTP', href: '/otp/config', icon: Wrench },
      { label: 'Templates SMS', href: '/otp/templates', icon: FileText },
      { label: 'Credentials OTP', href: '/otp/credentials', icon: KeyRound },
    ],
  },

  // ── Website Setup ──
  {
    label: 'Configuration site web',
    icon: LayoutTemplate,
    children: [
      { label: 'Selectionner page accueil', href: '/website/select-homepage', icon: Monitor },
      { label: 'Parametres accueil', href: '/website/homepage', icon: LayoutTemplate },
      { label: 'Authentification layout', href: '/website/auth-layout', icon: Lock },
      { label: 'Header', href: '/website/header', icon: LayoutTemplate },
      { label: 'Footer', href: '/website/footer', icon: LayoutTemplate },
      { label: 'Pages', href: '/website/pages', icon: FileText },
      { label: 'Apparence', href: '/website/appearance', icon: PaintBucket },
    ],
  },

  // ── Setup & Configurations (Settings) ──
  {
    label: 'Parametres',
    icon: Settings,
    children: [
      { label: 'Generaux', href: '/settings', icon: Settings },
      { label: 'Langues', href: '/settings/languages', icon: Globe },
      { label: 'Devises', href: '/settings/currencies', icon: Coins },
      { label: 'Livraison', href: '/delivery', icon: Truck },
      { label: 'SMTP / Notifications', href: '/settings/smtp', icon: Mail },
    ],
  },

  // ── Staff ──
  {
    label: 'Personnel',
    icon: UsersRound,
    children: [
      { label: 'Tous les membres', href: '/settings/staff', icon: ListOrdered },
      { label: 'Roles & permissions', href: '/settings/roles', icon: ShieldCheck },
    ],
  },

  // ── System ──
  {
    label: 'Systeme',
    icon: Server,
    children: [
      { label: 'Informations serveur', href: '/system/info', icon: Server },
      { label: 'Cache & maintenance', href: '/system/cache', icon: RefreshCcw },
      { label: 'Mises a jour', href: '/system/updates', icon: ArrowDownUp },
    ],
  },

  // ── Addon Manager ──
  { label: 'Gestionnaire modules', href: '/addons', icon: Puzzle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return pathname === href.split('?')[0];
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const filteredItems = search
    ? menuItems.filter((item) => {
        const matchParent = item.label.toLowerCase().includes(search.toLowerCase());
        const matchChild = item.children?.some((c) =>
          c.label.toLowerCase().includes(search.toLowerCase()),
        );
        return matchParent || matchChild;
      })
    : menuItems;

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-sidebar text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-tight">
          EstuaireAchats <span className="text-primary font-normal text-sm">Admin</span>
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans le menu"
            className="w-full pl-9 pr-3 py-2 bg-white/10 rounded-lg text-xs text-white placeholder-white/40 border-none outline-none focus:bg-white/15 transition"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filteredItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openMenus[item.label];
          const Icon = item.icon;
          const parentActive = item.href ? isActive(item.href) : false;
          const childActive = item.children?.some((c) => isActive(c.href)) ?? false;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-sidebar-hover cursor-pointer ${
                    childActive ? 'bg-sidebar-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-50 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-sidebar-hover ${
                    parentActive ? 'bg-sidebar-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-70" />
                  <span>{item.label}</span>
                </Link>
              )}

              {/* Submenu */}
              {hasChildren && isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon || Package;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition hover:bg-sidebar-hover ${
                          isActive(child.href) ? 'bg-sidebar-active text-white' : 'text-white/70'
                        }`}
                      >
                        <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
