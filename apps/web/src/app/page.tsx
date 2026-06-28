'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ChevronLeft,
  Shield,
  Search,
  Camera,
  MessageSquare,
  ScanLine,
  Wand2,
  Heart,
  MessageCircle,
  Mail,
  ShieldCheck,
  Star,
  ImageIcon,
  CheckCircle2,
  Factory,
  Globe,
  Paperclip,
  ArrowRight,
  Clock,
  RefreshCw,
  LayoutPanelLeft,
  Compass,
  Palette,
  BarChart3,
  Package,
  Users,
  X,
  Upload,
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Product } from '@/lib/mockData';

function getCountryName(code: string): string {
  const map: Record<string, string> = { CM: 'Cameroun', CN: 'Chine', FR: 'France', NG: 'Nigeria', US: 'Etats-Unis', DE: 'Allemagne' };
  return map[code] || code;
}
function getCountryFlag(code: string): string {
  if (!code) return '';
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  children?: { id: string; name: string; slug: string }[];
}

const TABS = [
  { id: 'ai', label: 'AI Mode', icon: Sparkles, starred: true },
  { id: 'produits', label: 'Produits', icon: null },
  { id: 'fabricants', label: 'Fabricants', icon: null },
  { id: 'mondial', label: 'Mondial', icon: null },
];

const PROMO_SLIDES = [
  {
    title: 'Coups de coeur',
    subtitle: 'Selections speciales pour vous',
    bg: 'from-[#6366F1] to-[#EC4899]',
    cta: 'En savoir plus',
  },
  {
    title: 'Offres Flash',
    subtitle: "Jusqu'a -50% cette semaine",
    bg: 'from-orange to-[#FF8C33]',
    cta: 'Voir les offres',
  },
  {
    title: 'Nouveaux fabricants',
    subtitle: 'Decouvrez des fournisseurs verifies',
    bg: 'from-secondary to-[#6BA5E0]',
    cta: 'Decouvrir',
  },
];

// EXPLORE_CARDS will be computed dynamically from API products in the component

// ─── FABRICANTS DATA ───
const FABRICANT_CATEGORIES = [
  'Toutes categories',
  'Pieces Automobiles',
  'Electronique',
  'Materiaux de Construction',
  'Machines Industrielles',
  'Vetements & Textiles',
  'Maison & Jardin',
  'Beaute & Sante',
];

const FABRICANT_FILTERS = [
  'MOQ faible',
  'Echantillons disponibles',
  'Gestion qualite',
  'Personnalisation complete',
  'Livraison rapide',
];

const MANUFACTURERS = [
  {
    id: '1',
    name: 'GuangZhou Auto Parts Co.',
    logo: 'https://ui-avatars.com/api/?name=GA&background=E82328&color=fff&size=60&bold=true',
    location: 'Guangdong, Chine',
    flag: '\u{1F1E8}\u{1F1F3}',
    years: 8,
    staff: '40+',
    area: '1 200+ m\u00B2',
    revenue: '634K+ FCFA',
    verified: true,
    rating: 4.5,
    reviewCount: 3,
    responseTime: '< 24h',
    onTimeDelivery: '83.3%',
    capabilities: ['Service ODM disponible', 'Personnalisation complete', 'Livraison a temps 83.3%'],
    certifications: ['CE', 'ISO 9001'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'GuangZhou Auto Parts Co.').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'GuangZhou Auto Parts Co.').slice(0, 3)
      : MOCK_PRODUCTS.slice(0, 3),
    factoryImages: [
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    ],
    category: 'Pieces Automobiles',
  },
  {
    id: '2',
    name: 'ShenZhen Light Tech',
    logo: 'https://ui-avatars.com/api/?name=SL&background=4A90D9&color=fff&size=60&bold=true',
    location: 'Guangdong, Chine',
    flag: '\u{1F1E8}\u{1F1F3}',
    years: 5,
    staff: '120+',
    area: '5 000+ m\u00B2',
    revenue: '126.7M+ FCFA',
    verified: true,
    rating: 4.9,
    reviewCount: 10,
    responseTime: '\u22643h',
    onTimeDelivery: '93.8%',
    capabilities: ['Livraison a temps 93.8%', 'Temps de reponse \u22643h', 'Personnalisation complete'],
    certifications: ['FCC', 'CE', 'RoHS'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'ShenZhen Light Tech').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'ShenZhen Light Tech').slice(0, 3)
      : MOCK_PRODUCTS.slice(1, 4),
    factoryImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    ],
    category: 'Electronique',
  },
  {
    id: '3',
    name: 'ShenZhen Mobile Tech',
    logo: 'https://ui-avatars.com/api/?name=SM&background=00A06A&color=fff&size=60&bold=true',
    location: 'Guangdong, Chine',
    flag: '\u{1F1E8}\u{1F1F3}',
    years: 7,
    staff: '220+',
    area: '13 000+ m\u00B2',
    revenue: '158.4M+ FCFA',
    verified: true,
    rating: 4.8,
    reviewCount: 40,
    responseTime: '\u22641h',
    onTimeDelivery: '95.0%',
    capabilities: ['Service ODM disponible', 'Personnalisation complete', 'Livraison a temps 95.0%', 'Personnalisation mineure'],
    certifications: ['FCC', 'CE'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'ShenZhen Mobile Tech').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'ShenZhen Mobile Tech').slice(0, 3)
      : MOCK_PRODUCTS.slice(3, 6),
    factoryImages: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
    ],
    category: 'Electronique',
  },
  {
    id: '4',
    name: 'Weifang Power Machinery',
    logo: 'https://ui-avatars.com/api/?name=WP&background=333333&color=fff&size=60&bold=true',
    location: 'Shandong, Chine',
    flag: '\u{1F1E8}\u{1F1F3}',
    years: 12,
    staff: '110+',
    area: '12 000+ m\u00B2',
    revenue: '38M+ FCFA',
    verified: true,
    rating: 4.1,
    reviewCount: 30,
    responseTime: '< 12h',
    onTimeDelivery: '88.5%',
    capabilities: ['Garantie disponible', 'Personnalisation mineure', 'Inspection produit fini'],
    certifications: ['FCC', 'ISO 14001'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'Weifang Power Machinery').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'Weifang Power Machinery').slice(0, 3)
      : MOCK_PRODUCTS.slice(5, 8),
    factoryImages: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    ],
    category: 'Machines Industrielles',
  },
  {
    id: '5',
    name: 'Cimencam Distribution',
    logo: 'https://ui-avatars.com/api/?name=CD&background=E82328&color=fff&size=60&bold=true',
    location: 'Douala, Cameroun',
    flag: '\u{1F1E8}\u{1F1F2}',
    years: 15,
    staff: '300+',
    area: '50 000+ m\u00B2',
    revenue: '1.3B+ FCFA',
    verified: true,
    rating: 4.8,
    reviewCount: 300,
    responseTime: '\u22643h',
    onTimeDelivery: '98.4%',
    capabilities: ['Service ODM disponible', 'Personnalisation complete', 'Livraison a temps 98.4%', 'Temps de reponse \u22643h'],
    certifications: ['CE', 'ISO 9001', 'ISO 14001'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'Cimencam Distribution').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'Cimencam Distribution').slice(0, 3)
      : MOCK_PRODUCTS.slice(7, 10),
    factoryImages: [
      'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    ],
    category: 'Materiaux de Construction',
  },
  {
    id: '6',
    name: 'FoShan Textile Group',
    logo: 'https://ui-avatars.com/api/?name=FT&background=FF69B4&color=fff&size=60&bold=true',
    location: 'Guangdong, Chine',
    flag: '\u{1F1E8}\u{1F1F3}',
    years: 9,
    staff: '230+',
    area: '10 000+ m\u00B2',
    revenue: '114.1M+ FCFA',
    verified: true,
    rating: 4.8,
    reviewCount: 40,
    responseTime: '< 6h',
    onTimeDelivery: '95.0%',
    capabilities: ['Service ODM disponible', 'Personnalisation complete', 'Livraison a temps 95.0%'],
    certifications: ['ISO 9001', 'OEKO-TEX'],
    products: MOCK_PRODUCTS.filter(p => p.shopName === 'FoShan Textile Group').length >= 3
      ? MOCK_PRODUCTS.filter(p => p.shopName === 'FoShan Textile Group').slice(0, 3)
      : MOCK_PRODUCTS.slice(6, 9),
    factoryImages: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    ],
    category: 'Vetements & Textiles',
  },
];

// ─── MONDIAL DATA ───
const MONDIAL_COUNTRIES = [
  { id: 'all', label: 'Tous', flag: null },
  { id: 'cn', label: 'Chine', flag: 'cn' },
  { id: 'cm', label: 'Cameroun', flag: 'cm' },
  { id: 'us', label: 'Etats-Unis', flag: 'us' },
  { id: 'pk', label: 'Pakistan', flag: 'pk' },
  { id: 'tr', label: 'Turquie', flag: 'tr' },
  { id: 'vn', label: 'Vietnam', flag: 'vn' },
  { id: 'in', label: 'Inde', flag: 'in' },
  { id: 'th', label: 'Thailande', flag: 'th' },
  { id: 'my', label: 'Malaisie', flag: 'my' },
  { id: 'ng', label: 'Nigeria', flag: 'ng' },
  { id: 'sn', label: 'Senegal', flag: 'sn' },
];

// GLOBAL_INDUSTRY_HUBS sideImages will be computed in the component from API products

// TOP_VIEWED_CATEGORIES will be computed in the component from API products

// MONDIAL_PRODUCTS will be computed dynamically from API products in the component

// ─── AI MODE DATA ───
const AI_QUICK_ACTIONS = [
  { icon: '🔥', label: 'Recherche fabricants verifies' },
  { icon: '🎨', label: 'Designer avec l\'IA' },
  { icon: null, label: 'Recherche produit' },
  { icon: null, label: 'Analyser les bestsellers' },
  { icon: null, label: 'Evaluer fournisseurs' },
  { icon: null, label: 'Etude de marche' },
];

const AI_QUICK_TABS = [
  { id: 'all', label: 'Tous' },
  { id: 'sourcing', label: 'Sourcing fournisseurs' },
  { id: 'analysis', label: 'Analyse business' },
  { id: 'design', label: 'Design produit' },
  { id: 'research', label: 'Recherche produit' },
];

const AI_QUICK_CARDS = [
  { title: 'Trouver rapidement des produits repondant a tous les criteres cles...', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
  { title: 'Enqueter sur les fournisseurs pour eviter les arnaques...', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Users, image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop' },
  { title: 'Analyse de faisabilite complete : tendances, prix, offre', category: 'Analyse business', catId: 'analysis', icon: BarChart3, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
  { title: 'Decouvrir des fournisseurs qualifies en uploadant une image...', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop' },
  { title: 'Transformer des batiments iconiques en visuels de cadeaux...', category: 'Design produit', catId: 'design', icon: Palette, image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop' },
  { title: 'Valider et visualiser des idees de produits innovants', category: 'Design produit', catId: 'design', icon: Palette, image: 'https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=400&h=250&fit=crop' },
  { title: 'Transformer un IP viral en idees de produits avec des designs visuels', category: 'Design produit', catId: 'design', icon: Palette, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop' },
  { title: 'Transformer des articles courants en bestsellers avec des dessins', category: 'Design produit', catId: 'design', icon: Palette, image: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&h=250&fit=crop' },
  { title: 'Trouver des modifications de design competitives pour les bestsellers', category: 'Design produit', catId: 'design', icon: Palette, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop' },
  { title: 'Analyser les bestsellers de votre niche et comprendre pourquoi...', category: 'Recherche produit', catId: 'research', icon: Compass, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop' },
  { title: 'Decouvrir les besoins non satisfaits et concevoir des produits...', category: 'Recherche produit', catId: 'research', icon: Compass, image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&h=250&fit=crop' },
  { title: 'Reperer les tendances emergentes pour guider le sourcing...', category: 'Recherche produit', catId: 'research', icon: Compass, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
  { title: 'Comparer les produits de plusieurs fournisseurs...', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop' },
  { title: 'Recommander des produits selon l\'audience et la saison...', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
  { title: 'Trouver des fournisseurs agiles pour petites series personnalisees', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop' },
  { title: 'Creer une liste de sourcing pour un evenement', category: 'Sourcing fournisseurs', catId: 'sourcing', icon: Package, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop' },
];

function FactoryCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="relative w-[220px] h-full rounded-lg overflow-hidden bg-gray-6 shrink-0">
      <img src={images[idx]} alt="Usine" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-2" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-2" />
          </button>
        </>
      )}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[11px] px-1.5 py-0.5 rounded">
        <ImageIcon className="w-3 h-3" />
        {idx + 1}/{images.length}
      </div>
    </div>
  );
}

function ManufacturerCard({ m }: { m: typeof MANUFACTURERS[0] & { ownerId?: string } }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async () => {
    const { user } = useAuthStore.getState();
    if (!user) { router.push('/login'); return; }
    if (chatLoading) return;
    const receiverId = (m as any).ownerId || m.id;
    setChatLoading(true);
    try {
      const res = await api.post<{ data: { id: string } }>('/chat/conversations', {
        receiverId,
        initialMessage: `Bonjour, je suis intéressé par votre boutique "${m.name}".`,
      });
      const convId = res.data?.id;
      router.push(convId ? `/account/messages?conv=${convId}` : '/account/messages');
    } catch {
      router.push('/account/messages');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Top: Logo + info + buttons */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <img src={m.logo} alt={m.name} className="w-[52px] h-[52px] rounded-lg object-cover shrink-0" />
          <div className="min-w-0">
            <Link href={`/shop/${m.id}`} className="text-[15px] font-bold text-dark hover:underline block truncate">
              {m.name}
            </Link>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-3 mt-0.5">
              <span>{m.flag}</span>
              <span>{m.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {m.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#E82328] to-[#4A90D9] px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span className="text-[12px] text-gray-3">{m.years} ans</span>
              <span className="text-gray-4">|</span>
              <span className="text-[12px] text-gray-3">{m.staff} employes</span>
              <span className="text-gray-4">|</span>
              <span className="text-[12px] text-gray-3">{m.area}</span>
              <span className="text-gray-4">|</span>
              <span className="text-[12px] text-gray-3">{m.revenue}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={() => setLiked(!liked)}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${liked ? 'border-primary text-primary' : 'border-gray-5 text-gray-3 hover:text-primary hover:border-primary'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} />
          </button>
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-gray-5 rounded-full text-dark hover:border-dark transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {chatLoading ? '...' : 'Discuter'}
          </button>
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium bg-dark text-white rounded-full hover:bg-gray-1 transition-colors disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            {chatLoading ? '...' : 'Contacter'}
          </button>
        </div>
      </div>

      {/* Content: Info left + Products center + Factory right */}
      <div className="flex gap-4 px-5 pb-5">
        {/* Left: Rating + Capabilities */}
        <div className="w-[200px] shrink-0">
          <div className="mb-3">
            <p className="text-[11px] text-gray-3 font-medium mb-1 uppercase tracking-wide">Evaluations et avis</p>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-bold text-dark">{m.rating}</span>
              <span className="text-[14px] text-dark">/5</span>
              <div className="flex items-center ml-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(m.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-4'}`}
                  />
                ))}
              </div>
              <span className="text-[12px] text-gray-3 ml-1">({m.reviewCount})</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-3 font-medium mb-1.5 uppercase tracking-wide">Capacites usine</p>
            <ul className="space-y-1">
              {m.capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[13px] text-dark">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
            {m.certifications.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {m.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="text-[10px] font-bold border border-gray-4 rounded px-1.5 py-0.5 text-gray-2"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: 3 products */}
        <div className="flex gap-3 flex-1 min-w-0">
          {m.products.map((p, i) => (
            <Link
              key={i}
              href={`/product/${p.slug}`}
              className="flex-1 group min-w-0"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-6 mb-2 relative">
                <img
                  src={p.thumbnailUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[13px] font-semibold text-dark truncate">
                {formatPrice(p.priceMin)}
                {p.priceMax > p.priceMin && (
                  <span className="text-gray-3 font-normal"> - {formatPrice(p.priceMax)}</span>
                )}
              </p>
              <p className="text-[11px] text-gray-3">
                Min. {p.moq} piece{p.moq > 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>

        {/* Right: Factory image carousel */}
        <FactoryCarousel images={m.factoryImages} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('produits');
  const [promoIndex, setPromoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [fabCategoryIndex, setFabCategoryIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [mondialCountry, setMondialCountry] = useState('all');
  const [aiQuery, setAiQuery] = useState('');
  const [aiQuickTab, setAiQuickTab] = useState('all');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Image search modal state
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [imageSearchDescription, setImageSearchDescription] = useState('');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state for recommended products
  const [recCurrentPage, setRecCurrentPage] = useState(1);
  const [recTotalPages, setRecTotalPages] = useState(1);
  const [recTotalProducts, setRecTotalProducts] = useState(0);
  const [recPageLoading, setRecPageLoading] = useState(false);
  const REC_PER_PAGE = 24;

  // API state
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [flashDealProducts, setFlashDealProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Homepage layout setting
  const [homepageLayout, setHomepageLayout] = useState('default');
  const [shops, setShops] = useState<any[]>([]);
  const [apiManufacturers, setApiManufacturers] = useState<typeof MANUFACTURERS | null>(null);
  const [mondialProducts, setMondialProducts] = useState<any[]>([]);
  const [mondialLoading, setMondialLoading] = useState(false);

  useEffect(() => {
    // Charger le layout homepage
    api.get('/settings/public/homepage-layout')
      .then((res: any) => {
        const selected = res.data?.selected || res.selected || 'default';
        setHomepageLayout(selected);
      })
      .catch(() => {});

    // Charger les boutiques verifiees (pour layout marketplace)
    api.get('/shops?verified=true')
      .then((res: any) => setShops(res.data || []))
      .catch(() => {});

    // Charger les categories
    api.get<{ data: ApiCategory[] }>('/categories')
      .then(res => setApiCategories(res.data || []))
      .catch(() => {});

    // Charger les produits populaires (coups de coeur)
    api.get<{ data: Product[] }>('/products?perPage=12&sort=popular')
      .then(res => setPopularProducts(res.data || []))
      .catch(() => {});

    // Charger les flash deals
    api.get<{ data: { product?: Product }[] }>('/flash-deals?perPage=6')
      .then(res => {
        const prods = (res.data || []).map(d => d.product).filter(Boolean) as Product[];
        setFlashDealProducts(prods);
      })
      .catch(() => {});

    // Charger les produits recommandes (avec pagination)
    api.get<{ data: Product[]; meta?: { total: number; page: number; perPage: number; lastPage: number } }>(`/products?perPage=${REC_PER_PAGE}&page=1`)
      .then(res => {
        setRecommendedProducts(res.data || []);
        if ((res as any).meta) {
          const meta = (res as any).meta;
          setRecTotalProducts(meta.total || 0);
          setRecTotalPages(meta.lastPage || 1);
          setRecCurrentPage(meta.page || 1);
        }
        setProductsLoading(false);
      })
      .catch(() => setProductsLoading(false));
  }, []);

  // Charger les produits pour l'onglet Mondial
  useEffect(() => {
    if (activeTab !== 'mondial') return;
    if (mondialProducts.length > 0) return;
    setMondialLoading(true);
    api.get<{ data: any[] }>('/products?perPage=20&sort=best_selling')
      .then(res => {
        const prods = (res.data || []).map((p: any, i: number) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          thumbnailUrl: p.images?.[0]?.url || p.thumbnailUrl || '',
          priceMin: p.price || p.priceMin || 0,
          priceMax: p.price || p.priceMax || 0,
          moq: p.minOrderQty || p.moq || 1,
          sold: p.totalSold || 0,
          shopName: p.shop?.name || '',
          reorderRate: p.rebuyRate || 0,
          lowerPriced: false,
          countryCode: (p.shop?.country || 'cm').toLowerCase(),
          countryLabel: (p.shop?.country || 'CM').toUpperCase(),
          supplierYears: p.shop?.yearsActive || 0,
        }));
        setMondialProducts(prods);
      })
      .catch(() => {})
      .finally(() => setMondialLoading(false));
  }, [activeTab, mondialProducts.length]);

  // Compute explore cards from API products (or fallback to MOCK_PRODUCTS)
  const exploreSourceProducts = popularProducts.length > 0 ? popularProducts : MOCK_PRODUCTS;
  const EXPLORE_CARDS = [
    {
      title: 'Historique de recherche',
      subtitle: (exploreSourceProducts[0] as any)?.category?.name || (exploreSourceProducts[0] as any)?.category || 'Pieces auto',
      products: exploreSourceProducts.slice(0, 2).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        thumbnailUrl: p.images?.[0]?.url || p.thumbnailUrl || '',
        priceMin: p.price || p.priceMin || 0,
        priceMax: p.price || p.priceMax || 0,
      })),
    },
    {
      title: 'Explorez des',
      subtitle: (exploreSourceProducts[3] as any)?.category?.name || (exploreSourceProducts[3] as any)?.category || 'Accessoires',
      products: exploreSourceProducts.slice(3, 5).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        thumbnailUrl: p.images?.[0]?.url || p.thumbnailUrl || '',
        priceMin: p.price || p.priceMin || 0,
        priceMax: p.price || p.priceMax || 0,
      })),
    },
    {
      title: 'Explorez des',
      subtitle: (exploreSourceProducts[5] as any)?.category?.name || (exploreSourceProducts[5] as any)?.category || 'Electronique',
      products: exploreSourceProducts.slice(5, 7).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        thumbnailUrl: p.images?.[0]?.url || p.thumbnailUrl || '',
        priceMin: p.price || p.priceMin || 0,
        priceMax: p.price || p.priceMax || 0,
      })),
    },
  ];

  // Compute mondial products from API or fallback to MOCK
  const MONDIAL_PRODUCTS = mondialProducts.length > 0
    ? mondialProducts
    : MOCK_PRODUCTS.map((p, i) => ({
        ...p,
        reorderRate: [33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0][i % 12],
        lowerPriced: [false, false, false, false, false, true, false, false, false, false, true, false][i % 12],
        countryCode: ['cn', 'cn', 'cn', 'cm', 'cn', 'vn', 'tr', 'cn', 'in', 'pk', 'cn', 'cm'][i % 12],
        countryLabel: ['CN', 'CN', 'CN', 'CM', 'CN', 'VN', 'TR', 'CN', 'IN', 'PK', 'CN', 'CM'][i % 12],
        supplierYears: [2, 16, 1, 10, 13, 1, 1, 1, 2, 1, 1, 1][i % 12],
      }));

  // Helper to safely get product image (API or mock format)
  const getProductImg = (p: any) => p?.images?.[0]?.url || p?.thumbnailUrl || '';

  // Compute GLOBAL_INDUSTRY_HUBS from API products
  const GLOBAL_INDUSTRY_HUBS = [
    {
      region: 'Chine',
      flag: 'cn',
      industry: 'Pieces auto & moto',
      description: 'Exportateur mondial majeur, OEM, qualite flexible',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop',
      sideImages: [
        getProductImg(exploreSourceProducts[0]),
        getProductImg(exploreSourceProducts[1]),
        getProductImg(exploreSourceProducts[2]),
        getProductImg(exploreSourceProducts[3]),
      ],
    },
    {
      region: 'Turquie',
      flag: 'tr',
      industry: 'Pieces vehicules & accessoires',
      description: 'Pieces OEM, remplacement de marque, divers',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop',
      sideImages: [
        getProductImg(exploreSourceProducts[4]),
        getProductImg(exploreSourceProducts[5]),
        getProductImg(exploreSourceProducts[6]),
        getProductImg(exploreSourceProducts[7]),
      ],
    },
    {
      region: 'Cameroun',
      flag: 'cm',
      industry: 'Materiaux de construction',
      description: 'Ciment, fer, quincaillerie, produits locaux',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
      sideImages: [
        getProductImg(exploreSourceProducts[8]),
        getProductImg(exploreSourceProducts[9]),
        getProductImg(exploreSourceProducts[10]),
        getProductImg(exploreSourceProducts[11]),
      ],
    },
  ];

  // Compute TOP_VIEWED_CATEGORIES from API products
  const TOP_VIEWED_CATEGORIES = [
    {
      title: 'Electronique',
      slug: 'electronique',
      flag: 'cn',
      country: 'Chine',
      products: [
        { name: exploreSourceProducts[0]?.name || 'Ecouteurs Bluetooth TWS', image: getProductImg(exploreSourceProducts[0]), score: 4.1 },
        { name: exploreSourceProducts[1]?.name || 'Chargeur rapide 65W', image: getProductImg(exploreSourceProducts[1]), score: 4.0 },
        { name: exploreSourceProducts[2]?.name || 'Camera surveillance WiFi', image: getProductImg(exploreSourceProducts[2]), score: 4.0 },
      ],
    },
    {
      title: 'Pieces Automobiles',
      slug: 'pieces-automobiles',
      flag: 'cn',
      country: 'Chine',
      products: [
        { name: exploreSourceProducts[3]?.name || 'Filtre a huile universel', image: getProductImg(exploreSourceProducts[3]), score: 4.4 },
        { name: exploreSourceProducts[4]?.name || 'Plaquettes de frein', image: getProductImg(exploreSourceProducts[4]), score: 4.3 },
        { name: exploreSourceProducts[5]?.name || 'Kit distribution', image: getProductImg(exploreSourceProducts[5]), score: 4.3 },
      ],
    },
    {
      title: 'Vetements',
      slug: 'vetements',
      flag: 'vn',
      country: 'Vietnam',
      products: [
        { name: exploreSourceProducts[6]?.name || 'T-shirt coton personnalise', image: getProductImg(exploreSourceProducts[6]), score: 4.2 },
        { name: exploreSourceProducts[7]?.name || 'Robe femme ete', image: getProductImg(exploreSourceProducts[7]), score: 4.1 },
        { name: exploreSourceProducts[8]?.name || 'Veste homme cuir PU', image: getProductImg(exploreSourceProducts[8]), score: 4.0 },
      ],
    },
    {
      title: 'Maison & Jardin',
      slug: 'maison-jardin',
      flag: 'tr',
      country: 'Turquie',
      products: [
        { name: exploreSourceProducts[9]?.name || 'Luminaire LED moderne', image: getProductImg(exploreSourceProducts[9]), score: 4.3 },
        { name: exploreSourceProducts[10]?.name || 'Robinet cuisine inox', image: getProductImg(exploreSourceProducts[10]), score: 4.1 },
        { name: exploreSourceProducts[11]?.name || 'Carrelage marbre 60x60', image: getProductImg(exploreSourceProducts[11]), score: 4.1 },
      ],
    },
  ];

  // Charger les fabricants depuis l'API quand l'onglet est actif
  useEffect(() => {
    if (activeTab !== 'fabricants') return;
    if (apiManufacturers !== null) return; // already loaded

    api.get<{ data: any[] }>('/shops?verified=true')
      .then(res => {
        const shops = res.data || [];
        if (shops.length === 0) return; // keep mock data

        const mapped = shops.map((shop: any) => ({
          id: shop.slug || shop.id,
          ownerId: shop.userId,
          name: shop.name,
          logo: shop.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name.substring(0,2))}&background=E82328&color=fff&size=60&bold=true`,
          location: [shop.city, getCountryName(shop.country)].filter(Boolean).join(', '),
          flag: getCountryFlag(shop.country || ''),
          years: shop.yearsActive || 0,
          staff: shop.staffCount || '',
          area: shop.factoryArea || '',
          revenue: shop.annualRevenue || '',
          verified: shop.verified,
          rating: shop.rating || 0,
          reviewCount: shop.totalReviews || 0,
          responseTime: shop.responseTime || '',
          onTimeDelivery: shop.deliveryRate ? `${shop.deliveryRate}%` : '',
          capabilities: shop.capabilities || [],
          certifications: shop.certifications || [],
          products: (shop.products || []).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            images: p.images?.map((i: any) => i.url) || [],
            thumbnailUrl: p.images?.[0]?.url || '',
            priceMin: p.price || 0,
            priceMax: p.price || 0,
            moq: p.minOrderQty || 1,
            sold: p.totalSold || 0,
            shopName: shop.name,
            shopYears: shop.yearsActive || 0,
            country: getCountryName(shop.country),
            countryFlag: getCountryFlag(shop.country || ''),
            verified: shop.verified,
            rating: shop.rating || 0,
            reviewCount: shop.totalReviews || 0,
            category: '',
            categorySlug: '',
            description: p.description || '',
          })),
          factoryImages: shop.factoryImages || [],
          category: '',
        }));
        setApiManufacturers(mapped);
      })
      .catch(() => {}); // keep mock data on error
  }, [activeTab, apiManufacturers]);

  const sendAiMessage = async (text?: string) => {
    const msg = (text || aiQuery).trim();
    if (!msg || aiLoading) return;
    const newMessages = [...aiMessages, { role: 'user' as const, content: msg }];
    setAiMessages(newMessages);
    setAiQuery('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        setAiMessages([...newMessages, { role: 'assistant', content: `Erreur: ${data.error}` }]);
      } else {
        setAiMessages([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setAiMessages([...newMessages, { role: 'assistant', content: 'Erreur de connexion au serveur.' }]);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Image search handlers
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

  // Infinite scroll: load next page and append products
  const fetchNextRecommendedPage = () => {
    if (recPageLoading || recCurrentPage >= recTotalPages) return;
    setRecPageLoading(true);
    const nextPage = recCurrentPage + 1;
    api.get<{ data: Product[]; meta?: { total: number; page: number; perPage: number; lastPage: number } }>(`/products?perPage=${REC_PER_PAGE}&page=${nextPage}`)
      .then(res => {
        setRecommendedProducts(prev => [...prev, ...(res.data || [])]);
        if ((res as any).meta) {
          const meta = (res as any).meta;
          setRecTotalProducts(meta.total || 0);
          setRecTotalPages(meta.lastPage || 1);
          setRecCurrentPage(meta.page || 1);
        }
        setRecPageLoading(false);
      })
      .catch(() => setRecPageLoading(false));
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (productsLoading) return;
    const sentinel = document.getElementById('rec-scroll-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextRecommendedPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [productsLoading, recCurrentPage, recTotalPages, recPageLoading]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const filteredManufacturers = (apiManufacturers || MANUFACTURERS).filter((m) => {
    if (fabCategoryIndex > 0) {
      return m.category === FABRICANT_CATEGORIES[fabCategoryIndex];
    }
    return true;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-6">
      {/* ─── Hero: Tabs + Search (white card with rounded bottom) ─── */}
      <div className="relative bg-gray-6">
        <div className="bg-white hero-card-bottom">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
            {/* Tabs */}
            <div className="flex items-center justify-center pt-3 pb-1 overflow-x-auto scrollbar-hide">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 px-4 py-2 text-[14px] font-semibold transition-colors sm:px-7 sm:py-2.5 sm:text-[20px] ${
                    activeTab === tab.id
                      ? 'text-orange'
                      : 'text-dark hover:text-orange'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon && <tab.icon className="w-5 h-5" />}
                    {tab.label}
                    {tab.starred && (
                      <sup className="text-orange text-[10px] font-bold ml-0.5">*</sup>
                    )}
                  </span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-orange rounded-full" />
                  )}
                  {i < TABS.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-4 hidden sm:block" />
                  )}
                </button>
              ))}
            </div>

            {/* Search box (hidden in AI mode) */}
            {activeTab !== 'ai' && (
              <div className="py-4 pb-6 flex justify-center sm:py-6 sm:pb-10">
                <form onSubmit={handleSearch} className="w-full max-w-[720px]">
                  <div className="hero-search-box">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={activeTab === 'fabricants' ? 'Rechercher un fabricant...' : 'lumiere de roue'}
                      className="w-full py-2.5 px-4 text-[15px] text-dark outline-none placeholder:text-gray-3 bg-transparent"
                    />
                    <div className="flex items-center justify-between px-3 pb-1 pt-0.5">
                      <button
                        type="button"
                        onClick={handleImageSearchOpen}
                        className="flex items-center gap-1.5 text-[13px] text-gray-2 hover:text-orange transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Recherche par image
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 border-2 border-orange text-orange hover:bg-orange hover:text-white px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors sm:px-7 sm:py-2 sm:gap-2 sm:text-[14px]"
                      >
                        <Search className="w-4 h-4" />
                        Rechercher
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── AI MODE TAB CONTENT ─── */}
      {activeTab === 'ai' ? (
        <div className="bg-white">
          {/* Left sidebar icons */}
          <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col bg-white rounded-r-lg shadow-lg overflow-hidden">
            <button className="flex items-center justify-center w-10 h-10 hover:bg-gray-6 transition-colors border-b border-gray-5">
              <LayoutPanelLeft className="w-5 h-5 text-gray-2" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 hover:bg-gray-6 transition-colors border-b border-gray-5">
              <Search className="w-5 h-5 text-gray-2" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 hover:bg-gray-6 transition-colors border-b border-gray-5">
              <RefreshCw className="w-5 h-5 text-gray-2" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 hover:bg-gray-6 transition-colors">
              <Clock className="w-5 h-5 text-gray-2" />
            </button>
          </div>

          {/* Hero: AI prompt area + Chat */}
          <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6">
            {aiMessages.length === 0 && (
              <h1 className="text-[28px] font-bold text-dark text-center mb-6">
                Toutes les taches en une demande, sourcing intelligent avec l'IA
              </h1>
            )}

            {/* Chat messages */}
            {aiMessages.length > 0 && (
              <div className="max-w-[700px] mx-auto mb-6 max-h-[500px] overflow-y-auto space-y-4 pr-2">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-orange text-white rounded-br-md'
                          : 'bg-gray-6 text-dark rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-dark [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:mb-1"
                          dangerouslySetInnerHTML={{
                            __html: msg.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n- /g, '\n<li>')
                              .replace(/\n\d+\. /g, '\n<li>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-6 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-gray-3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* AI Input box */}
            <div className="max-w-[700px] mx-auto">
              <div className="border border-gray-4 rounded-2xl p-4 hover:border-gray-3 transition-colors focus-within:border-orange focus-within:shadow-sm">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAiMessage();
                    }
                  }}
                  placeholder="Decrivez vos besoins..."
                  rows={aiMessages.length > 0 ? 2 : 3}
                  className="w-full text-[15px] text-dark outline-none resize-none placeholder:text-gray-3"
                />
                <div className="flex items-center justify-between mt-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-6 transition-colors">
                    <Paperclip className="w-4.5 h-4.5 text-gray-3" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-orange/10 hover:bg-orange/20 transition-colors">
                      <Sparkles className="w-4 h-4 text-orange" />
                    </button>
                    <button
                      onClick={() => sendAiMessage()}
                      disabled={aiLoading || !aiQuery.trim()}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        aiQuery.trim() && !aiLoading
                          ? 'bg-orange hover:bg-orange/90 text-white'
                          : 'bg-gray-6 text-gray-3'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick action chips — only show when no messages */}
              {aiMessages.length === 0 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide justify-center flex-wrap">
                  {AI_QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendAiMessage(action.label)}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-5 text-[13px] text-gray-2 hover:border-orange hover:text-orange transition-colors"
                    >
                      {action.icon && <span>{action.icon}</span>}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accio Work promo section */}
          <div className="bg-gradient-to-b from-[#FFF8F0] to-white">
            <div className="max-w-[1440px] mx-auto px-6 py-12">
              <div className="flex items-center gap-12">
                {/* Left: text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px] font-bold text-primary">EstuaireAchats</span>
                    <span className="text-gray-4">|</span>
                    <span className="text-[16px] font-bold text-dark">Accio Work</span>
                  </div>
                  <h2 className="text-[28px] font-bold text-dark leading-tight mb-3">
                    Allez au-dela de la recherche — laissez{' '}
                    <span className="text-orange">Accio Work</span> gerer votre workflow de sourcing.
                  </h2>
                  <p className="text-[15px] text-gray-2 mb-5">
                    Du design au sourcing en passant par le marketing et le CRM : tous vos outils IA en un seul endroit.
                  </p>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green/30 bg-green/5 text-[12px] text-green font-medium">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Auto-evolutif
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange/30 bg-orange/5 text-[12px] text-orange font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      Proactif
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 text-[12px] text-secondary font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      24/7
                    </span>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-dark text-white rounded-lg text-[14px] font-medium hover:bg-gray-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Telecharger pour desktop
                  </button>
                </div>

                {/* Right: Agents preview card */}
                <div className="w-[480px] shrink-0">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[16px] font-bold text-dark">Agents</h3>
                      <div className="flex items-center gap-3 text-[12px] text-gray-3">
                        <span className="text-dark font-medium">Mes Agents</span>
                        <span>Generes par IA</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { name: 'Accio', desc: 'Assistant sourcing general...', color: 'bg-white', initials: 'A', textColor: 'text-dark' },
                        { name: 'CEO', desc: 'Strategie & decisions business', color: 'bg-green/10', initials: null, avatar: true },
                        { name: 'CAIO', desc: 'IA & innovation produit', color: 'bg-orange/10', initials: null, avatar: true },
                        { name: 'CTO', desc: 'Tech & production', color: 'bg-secondary/10', initials: null, avatar: true },
                      ].map((agent, i) => (
                        <div key={i} className="text-center">
                          <div className={`w-12 h-12 rounded-xl ${agent.color} border border-gray-5 flex items-center justify-center mx-auto mb-1.5`}>
                            {agent.initials ? (
                              <span className={`text-[18px] font-bold ${agent.textColor}`}>{agent.initials}</span>
                            ) : (
                              <img src={`https://i.pravatar.cc/48?img=${i + 10}`} alt={agent.name} className="w-full h-full rounded-xl object-cover" />
                            )}
                          </div>
                          <p className="text-[12px] font-medium text-dark">{agent.name}</p>
                          <p className="text-[10px] text-gray-3 line-clamp-2 mt-0.5">{agent.desc}</p>
                          <button className="mt-1.5 text-[10px] text-green font-medium px-2 py-0.5 bg-green/10 rounded-full">
                            + Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick start for your needs */}
          <div className="max-w-[1440px] mx-auto px-6 py-8">
            {/* Separator */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-5" />
              <span className="text-[14px] text-gray-3 shrink-0">Demarrage rapide pour vos besoins</span>
              <div className="flex-1 h-px bg-gray-5" />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-6 mb-6">
              {AI_QUICK_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAiQuickTab(tab.id)}
                  className={`relative text-[14px] pb-2 transition-colors ${
                    aiQuickTab === tab.id
                      ? 'text-dark font-semibold'
                      : 'text-gray-3 hover:text-dark'
                  }`}
                >
                  {tab.label}
                  {aiQuickTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-dark rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-4 gap-4">
              {AI_QUICK_CARDS
                .filter((card) => aiQuickTab === 'all' || card.catId === aiQuickTab)
                .map((card, i) => (
                  <div
                    key={i}
                    className="border border-gray-5 rounded-xl p-4 hover:shadow-md hover:border-gray-4 transition-all cursor-pointer group"
                  >
                    <h3 className="text-[15px] font-semibold text-dark leading-tight mb-2 line-clamp-2 min-h-[40px]">
                      {card.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-3 mb-3">
                      <card.icon className="w-3.5 h-3.5" />
                      {card.category}
                    </div>
                    <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-6">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'fabricants' ? (
        <>
          {/* "Connect with 34K+" inline text (white bg, like Alibaba) */}
          <div className="bg-white pb-4 -mt-2">
            <div className="max-w-[1440px] mx-auto px-6 text-center">
              <h2 className="text-[22px] font-bold text-dark">
                Connectez-vous avec 34K+ <span className="bg-gradient-to-r from-[#E82328] to-[#4A90D9] bg-clip-text text-transparent">V</span>erified fabricants
              </h2>
              <div className="flex items-center justify-center gap-6 mt-2 text-[14px] text-gray-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-3" />
                  5K+ industries couvertes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-3" />
                  Prix usine direct
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-3" />
                  Echantillons & personnalisation
                </span>
              </div>
            </div>
          </div>

          {/* Welcome bar */}
          <div className="bg-gray-6 border-b border-gray-5">
            <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-dark">
                Bienvenue sur EstuaireAchats
              </h2>
              <div className="flex items-center gap-0 text-[13px]">
                <Link
                  href="/rfq"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Demander un devis
                </Link>
                <span className="text-gray-4">|</span>
                <Link
                  href="/top-ranking"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Top du classement
                </Link>
                <span className="text-gray-4">|</span>
                <Link
                  href="/search?filter=custom"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Customisation rapide
                </Link>
              </div>
            </div>
          </div>

          {/* 4-column intro section */}
          <div className="max-w-[1440px] mx-auto px-6 py-4">
            <div className="flex gap-4">
              {/* Col 1: Source by category */}
              <div className="w-[260px] shrink-0 bg-white rounded-xl p-5">
                <h3 className="text-[16px] font-bold text-dark mb-3">Sourcer par categorie</h3>
                <ul className="space-y-0">
                  {apiCategories.slice(0, 7).map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="flex items-center justify-between py-2.5 text-[13px] text-gray-1 hover:text-orange transition-colors group border-b border-gray-5/50 last:border-0"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-8 h-8 bg-gray-6 rounded-lg flex items-center justify-center"><CategoryIcon name={cat.icon} size={16} className="text-gray-2" /></span>
                          <span className="leading-tight">{cat.name}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-4 group-hover:text-orange transition-colors" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/categories"
                      className="flex items-center gap-2.5 py-2.5 text-[13px] text-gray-3 hover:text-orange transition-colors"
                    >
                      <span className="w-8 h-8 bg-gray-6 rounded-lg flex items-center justify-center"><ChevronRight className="w-4 h-4 text-gray-3" /></span>
                      Toutes les categories
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 2: Get samples */}
              <div className="flex-1 bg-white rounded-xl p-5 min-w-0">
                <h3 className="text-[16px] font-bold text-dark mb-3">Obtenir des echantillons</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[0])} alt="Trending" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Tendances</p>
                  </div>
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[3])} alt="New" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Nouveautes</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-orange/5 rounded-lg border border-orange/20">
                  <p className="text-[12px] font-semibold text-dark flex items-center gap-1.5">
                    🔴 Factory LIVE Q&A
                  </p>
                  <p className="text-[11px] text-gray-3 mt-0.5">Questions en direct avec les fabricants</p>
                </div>
              </div>

              {/* Col 3: Top-ranking manufacturers */}
              <div className="flex-1 bg-white rounded-xl p-5 min-w-0">
                <h3 className="text-[16px] font-bold text-dark mb-3">Fabricants au top</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[7])} alt="Popular" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Les plus populaires</p>
                  </div>
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[5])} alt="Best sellers" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Meilleurs vendeurs</p>
                  </div>
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[10])} alt="Leading" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Usines leaders</p>
                  </div>
                  <div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-6 mb-2">
                      <img src={getProductImg(exploreSourceProducts[4])} alt="Quick" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[13px] text-gray-2 text-center">Reponse rapide</p>
                  </div>
                </div>
              </div>

              {/* Col 4: User profile card */}
              <div className="w-[240px] shrink-0 bg-white rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-6 flex items-center justify-center">
                    <span className="text-[18px]">👤</span>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-3">Bienvenue</p>
                    <p className="text-[14px] font-bold text-dark">Mon compte</p>
                  </div>
                </div>
                <div className="flex gap-4 mb-4 pb-4 border-b border-gray-5">
                  <div className="text-center flex-1">
                    <p className="text-[18px] font-bold text-dark">3</p>
                    <p className="text-[11px] text-gray-3">Produits favoris</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[18px] font-bold text-dark">0</p>
                    <p className="text-[11px] text-gray-3">Fournisseurs favoris</p>
                  </div>
                </div>
                <p className="text-[13px] font-medium text-dark mb-2">Votre historique</p>
                <div className="flex gap-2">
                  {exploreSourceProducts.slice(0, 3).map((p: any) => (
                    <Link key={p.id} href={`/product/${p.slug}`} className="flex-1">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-6">
                        <img src={getProductImg(p)} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/rfq"
                  className="block mt-4 text-center text-[13px] text-orange font-medium hover:underline"
                >
                  Un besoin, plusieurs devis →
                </Link>
              </div>
            </div>
          </div>

          {/* Category tabs + Filters */}
          <div className="bg-white border-b border-gray-5 sticky top-0 z-30">
            <div className="max-w-[1440px] mx-auto px-6">
              {/* Category tabs */}
              <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide py-3 border-b border-gray-5">
                {FABRICANT_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat}
                    onClick={() => setFabCategoryIndex(i)}
                    className={`shrink-0 px-5 py-2 text-[14px] font-medium rounded-full transition-colors ${
                      fabCategoryIndex === i
                        ? 'bg-dark text-white'
                        : 'text-gray-2 hover:bg-gray-6'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Filter chips */}
              <div className="flex items-center gap-2 py-2.5">
                <span className="text-[13px] text-gray-3 mr-1">Filtres:</span>
                {FABRICANT_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className={`shrink-0 px-3.5 py-1.5 text-[13px] rounded-full border transition-colors ${
                      activeFilters.includes(filter)
                        ? 'border-orange bg-orange/5 text-orange font-medium'
                        : 'border-gray-5 text-gray-2 hover:border-gray-3'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Manufacturer cards list */}
          <div className="max-w-[1440px] mx-auto px-6 py-5">
            <div className="space-y-4">
              {filteredManufacturers.map((m) => (
                <ManufacturerCard key={m.id} m={m} />
              ))}
            </div>

            {filteredManufacturers.length === 0 && (
              <div className="text-center py-16">
                <Factory className="w-12 h-12 text-gray-4 mx-auto mb-3" />
                <p className="text-[15px] text-gray-3">Aucun fabricant dans cette categorie</p>
                <button
                  onClick={() => setFabCategoryIndex(0)}
                  className="text-orange text-[14px] font-medium mt-2 hover:underline"
                >
                  Voir tous les fabricants
                </button>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'mondial' ? (
        <>
          {/* ─── MONDIAL TAB CONTENT ─── */}

          {/* Country filter circles — Alibaba style: gray circles with centered flag icons */}
          <div className="bg-white">
            <div className="max-w-[1440px] mx-auto px-6 py-8">
              <div className="flex items-start justify-center gap-8 overflow-x-auto scrollbar-hide">
                {MONDIAL_COUNTRIES.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => setMondialCountry(country.id)}
                    className="flex flex-col items-center gap-2.5 shrink-0"
                  >
                    <div
                      className={`w-[64px] h-[64px] rounded-full flex items-center justify-center bg-[#F0F0F0] overflow-hidden`}
                    >
                      {country.flag ? (
                        <img
                          src={`https://flagcdn.com/w40/${country.flag}.png`}
                          alt={country.label}
                          className="w-[32px] h-[22px] object-cover rounded-[2px]"
                        />
                      ) : (
                        <Globe className="w-7 h-7 text-gray-2" />
                      )}
                    </div>
                    <span
                      className={`text-[13px] whitespace-nowrap leading-tight text-center ${
                        mondialCountry === country.id ? 'text-dark font-semibold' : 'text-gray-2'
                      }`}
                    >
                      {country.label}
                    </span>
                    {mondialCountry === country.id && (
                      <div className="w-full h-[3px] bg-dark rounded-full -mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Global Industry Hubs — Alibaba style: large image left + product grid right */}
          <div className="bg-white">
            <div className="max-w-[1440px] mx-auto px-6 pb-8">
              <h2 className="text-[28px] font-bold text-dark mb-5">Poles industriels mondiaux</h2>
              <div className="grid grid-cols-3 gap-5">
                {GLOBAL_INDUSTRY_HUBS.map((hub, i) => (
                  <Link
                    key={i}
                    href={`/search?country=${hub.flag}`}
                    className="group rounded-xl overflow-hidden bg-gray-6"
                  >
                    {/* Main image with overlay text */}
                    <div className="relative h-[200px]">
                      <img
                        src={hub.image}
                        alt={hub.region}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={`https://flagcdn.com/w20/${hub.flag}.png`}
                            alt={hub.region}
                            className="w-5 h-3.5 object-cover rounded-[2px]"
                          />
                          <span className="text-[13px] text-white/90">{hub.region}</span>
                        </div>
                        <p className="text-[18px] font-bold text-white leading-tight">{hub.industry}</p>
                        <p className="text-[12px] text-white/70 mt-1">{hub.description}</p>
                      </div>
                    </div>
                    {/* Side product images grid 2x2 */}
                    <div className="grid grid-cols-2 gap-[2px] bg-white">
                      {hub.sideImages.map((img, j) => (
                        <div key={j} className="aspect-square bg-gray-6 overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Top-viewed products — Alibaba style: title + flag, separator, then #1 #2 #3 with large images */}
          <div className="bg-gray-6">
            <div className="max-w-[1440px] mx-auto px-6 py-8">
              <h2 className="text-[28px] font-bold text-dark mb-5">Produits les plus consultes</h2>
              <div className="grid grid-cols-4 gap-4">
                {TOP_VIEWED_CATEGORIES.map((cat, ci) => (
                  <Link
                    key={ci}
                    href={`/top-viewed/${cat.slug}`}
                    className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    {/* Category header */}
                    <h3 className="text-[18px] font-bold text-dark">{cat.title}</h3>
                    <div className="flex items-center gap-2 mt-1 mb-4 pb-4 border-b border-gray-5">
                      <img
                        src={`https://flagcdn.com/w20/${cat.flag}.png`}
                        alt={cat.country}
                        className="w-5 h-3.5 object-cover rounded-[2px]"
                      />
                      <span className="text-[13px] text-gray-3">{cat.country}</span>
                    </div>
                    {/* Product rankings */}
                    <div className="space-y-5">
                      {cat.products.map((prod, pi) => (
                        <div key={pi} className="flex items-center gap-3">
                          <span className="text-[14px] font-bold text-gray-3 shrink-0 w-5">#{pi + 1}</span>
                          <div className="w-[80px] h-[80px] rounded-lg overflow-hidden bg-gray-6 shrink-0">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-gray-2">Score de classement:</p>
                            <p className="text-[18px] font-bold text-dark">{prod.score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Product grid — Alibaba style: image with lens icon bottom-left, name, badges, FCFA price, MOQ, yrs + flag */}
          <div className="bg-white">
            <div className="max-w-[1440px] mx-auto px-6 py-8">
              <div className="grid grid-cols-6 gap-4">
                {MONDIAL_PRODUCTS.filter(
                  (p) => mondialCountry === 'all' || p.countryCode === mondialCountry
                ).map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group"
                  >
                    {/* Product image with lens icon */}
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-6 mb-2">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-gray-2" />
                      </div>
                    </div>
                    {/* Product info */}
                    <p className="text-[13px] text-dark line-clamp-2 leading-tight mb-1.5 min-h-[36px]">
                      {product.name}
                    </p>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {product.reorderRate > 0 && (
                        <span className="text-[10px] text-gray-2 bg-gray-6 px-1.5 py-0.5 rounded">
                          Taux de rachat {product.reorderRate}%
                        </span>
                      )}
                      {product.lowerPriced && (
                        <span className="text-[10px] text-green bg-green/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ChevronDown className="w-2.5 h-2.5" />
                          Moins cher que similaire
                        </span>
                      )}
                    </div>
                    {/* Price */}
                    <p className="text-[16px] font-bold text-dark leading-tight">
                      {formatPrice(product.priceMin)}
                      {product.priceMax > product.priceMin && (
                        <span className="font-bold">-{formatPrice(product.priceMax)}</span>
                      )}
                    </p>
                    {/* MOQ */}
                    <p className="text-[12px] text-gray-3 mt-0.5">
                      MOQ: {product.moq} piece{product.moq > 1 ? 's' : ''}
                    </p>
                    {/* Supplier info: years + flag + code */}
                    <div className="flex items-center gap-1 mt-2 text-[12px] text-gray-3">
                      <span>{product.supplierYears} ans</span>
                      <span className="text-gray-4 mx-0.5">&middot;</span>
                      <img
                        src={`https://flagcdn.com/w20/${product.countryCode}.png`}
                        alt={product.countryLabel}
                        className="w-4 h-3 object-cover rounded-[1px]"
                      />
                      <span className="font-medium text-gray-2">{product.countryLabel}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {MONDIAL_PRODUCTS.filter(
                (p) => mondialCountry === 'all' || p.countryCode === mondialCountry
              ).length === 0 && (
                <div className="text-center py-16">
                  <Globe className="w-12 h-12 text-gray-4 mx-auto mb-3" />
                  <p className="text-[15px] text-gray-3">Aucun produit pour ce pays</p>
                  <button
                    onClick={() => setMondialCountry('all')}
                    className="text-orange text-[14px] font-medium mt-2 hover:underline"
                  >
                    Voir tous les pays
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ─── DEFAULT TAB CONTENT (Produits / AI) ─── */}

          {/* ─── LAYOUT: MARKETPLACE ─── Top Vendeurs section */}
          {homepageLayout === 'marketplace' && shops.length > 0 && (
            <div className="bg-white">
              <div className="max-w-[1440px] mx-auto px-6 py-6">
                <h2 className="text-[22px] font-bold text-dark mb-4">Top Vendeurs</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {shops.slice(0, 12).map((shop: any) => (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.slug || shop.id}`}
                      className="shrink-0 w-[200px] bg-gray-6 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[20px] font-bold text-gray-3">
                              {(shop.name || 'S').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-dark truncate">{shop.name}</p>
                          {(shop.verified || shop.isVerified) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-[#E82328] to-[#4A90D9] px-1.5 py-0.5 rounded-full mt-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[12px] text-gray-3">
                        {shop.productCount || shop._count?.products || 0} produits
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Welcome bar (hidden for minimal layout, hidden on mobile) */}
          {homepageLayout !== 'minimal' && (
            <div className="hidden bg-gray-6 border-b border-gray-5 md:block">
              <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-dark">
                  Bienvenue sur EstuaireAchats
                </h2>
                <div className="flex items-center gap-0 text-[13px]">
                  <Link href="/rfq" className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors">
                    <Target className="w-4 h-4" />
                    Demander un devis
                  </Link>
                  <span className="text-gray-4">|</span>
                  <Link href="/top-ranking" className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    Top du classement
                  </Link>
                  <span className="text-gray-4">|</span>
                  <Link href="/search?filter=custom" className="flex items-center gap-1.5 px-4 py-1.5 text-gray-1 hover:text-orange transition-colors">
                    <Zap className="w-4 h-4" />
                    Customization rapide
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: categories horizontal scroll (like Alibaba) */}
          {homepageLayout !== 'minimal' && apiCategories.length > 0 && (
            <div className="bg-white px-3 py-3 md:hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {apiCategories.slice(0, 10).map((cat) => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex flex-col items-center gap-1.5 shrink-0 w-[60px]">
                    <div className="w-[48px] h-[48px] rounded-xl bg-gray-6 flex items-center justify-center">
                      <CategoryIcon name={cat.icon} size={22} className="text-gray-2" />
                    </div>
                    <span className="text-[10px] text-gray-1 text-center leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Main 3-column section (hidden for minimal layout) */}
          {homepageLayout !== 'minimal' && (
            <div className="max-w-[1440px] mx-auto px-3 py-4 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Left: Categories sidebar */}
                <div className="hidden lg:block lg:w-[200px] lg:shrink-0">
                  <div className="bg-white rounded-xl overflow-hidden" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <ul>
                      {apiCategories.map((cat) => (
                        <li key={cat.id}>
                          <Link
                            href={`/categories/${cat.slug}`}
                            className="flex items-center justify-between px-4 py-[11px] text-[13px] text-gray-1 hover:bg-gray-6 hover:text-orange transition-colors group border-b border-gray-5/50 last:border-0"
                          >
                            <span className="flex items-center gap-2">
                              <CategoryIcon name={cat.icon} size={15} className="text-gray-2" />
                              <span className="leading-tight">{cat.name}</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-4 group-hover:text-orange transition-colors shrink-0 ml-1" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Center: 3 explore cards */}
                <div className="flex-1 grid grid-cols-1 gap-4 min-w-0 sm:grid-cols-2 xl:grid-cols-3">
                  {EXPLORE_CARDS.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 min-w-0">
                      <h3 className="text-[15px] font-bold text-dark leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-[13px] text-gray-3 mb-3">{card.subtitle}</p>
                      <div className="flex gap-3">
                        {card.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            className="flex-1 group"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-6 mb-1.5">
                              <img
                                src={p.thumbnailUrl}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <p className="text-[13px] font-bold text-dark">
                              {formatPrice(p.priceMin)}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Promo carousel */}
                <div className="w-full lg:w-[280px] lg:shrink-0">
                  <div className="relative rounded-xl overflow-hidden h-full">
                    <div
                      className={`bg-gradient-to-br ${PROMO_SLIDES[promoIndex].bg} p-5 text-white h-full flex flex-col justify-between transition-all duration-500`}
                    >
                      <div>
                        <h3 className="text-[20px] font-bold mb-1">
                          {PROMO_SLIDES[promoIndex].title}
                        </h3>
                        <p className="text-[13px] text-white/80">
                          {PROMO_SLIDES[promoIndex].subtitle}
                        </p>
                      </div>
                      <div className="flex gap-2 my-3">
                        {exploreSourceProducts.slice(promoIndex * 2, promoIndex * 2 + 3).map((p: any) => (
                          <div key={p.id} className="w-[65px] h-[65px] rounded-lg overflow-hidden bg-white/20">
                            <img
                              src={getProductImg(p)}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/search"
                        className="inline-block bg-white text-dark font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-gray-6 transition-colors w-fit"
                      >
                        {PROMO_SLIDES[promoIndex].cta}
                      </Link>
                    </div>
                    <div className="absolute bottom-3 right-4 flex gap-1.5">
                      {PROMO_SLIDES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPromoIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === promoIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setPromoIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── LAYOUT: MARKETPLACE ─── Boutiques populaires */}
          {homepageLayout === 'marketplace' && shops.length > 0 && (
            <div className="bg-gray-6">
              <div className="max-w-[1440px] mx-auto px-6 py-6">
                <h2 className="text-[22px] font-bold text-dark mb-4">Boutiques populaires</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.slice(0, 6).map((shop: any) => (
                    <div key={shop.id} className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-6 flex items-center justify-center shrink-0">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[24px] font-bold text-gray-3">
                              {(shop.name || 'S').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/shop/${shop.slug || shop.id}`} className="text-[15px] font-bold text-dark hover:text-orange truncate block">
                            {shop.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {(shop.verified || shop.isVerified) && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-[#E82328] to-[#4A90D9] px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            )}
                            <span className="text-[12px] text-gray-3">
                              {shop.productCount || shop._count?.products || 0} produits
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/shop/${shop.slug || shop.id}`}
                          className="shrink-0 text-[12px] font-medium text-orange border border-orange px-3 py-1.5 rounded-full hover:bg-orange hover:text-white transition-colors"
                        >
                          Visiter
                        </Link>
                      </div>
                      {/* Top products from this shop */}
                      {shop.products && shop.products.length > 0 && (
                        <div className="flex gap-2">
                          {shop.products.slice(0, 3).map((p: any, pi: number) => (
                            <Link key={pi} href={`/product/${p.slug || p.id}`} className="flex-1">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-6">
                                <img src={p.thumbnailUrl || p.thumbnail || p.image} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[12px] font-semibold text-dark mt-1 truncate">
                                {p.priceMin ? formatPrice(p.priceMin) : ''}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Banners (hidden for minimal layout) */}
          {homepageLayout !== 'minimal' && (
            <div className="max-w-[1440px] mx-auto px-3 pb-4 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Link
                  href="/search?filter=local"
                  className="relative rounded-xl overflow-hidden bg-[#1B3A5C] p-4 flex items-center gap-3 text-white hover:shadow-lg transition-shadow group sm:p-5 sm:gap-4"
                >
                  <span className="text-3xl">🇨🇲</span>
                  <div>
                    <h3 className="text-[18px] font-bold">Stock local Cameroun</h3>
                    <p className="text-[13px] text-white/70">
                      Livraison rapide depuis Douala & Yaounde
                    </p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                </Link>
                <Link
                  href="/trade-assurance"
                  className="relative rounded-xl overflow-hidden bg-gradient-to-r from-orange to-primary p-5 flex items-center gap-4 text-white hover:shadow-lg transition-shadow group"
                >
                  <Shield className="w-8 h-8" />
                  <div>
                    <h3 className="text-[18px] font-bold">
                      EstuaireAchats <span className="font-normal">Guaranteed</span>
                    </h3>
                    <p className="text-[13px] text-white/70">
                      Commandes 100% protegees avec Trade Assurance
                    </p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Recommended products */}
          <div id="recommended-products" className="max-w-[1440px] mx-auto px-3 pb-8 sm:px-6 sm:pb-10">
            {homepageLayout !== 'minimal' && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] text-gray-3">
                  Recommande pour votre entreprise
                </h2>
                {recTotalProducts > 0 && (
                  <span className="text-[13px] text-gray-3">{recTotalProducts} produits</span>
                )}
              </div>
            )}
            {(productsLoading || recPageLoading) ? (
              <div className={`grid gap-4 ${
                homepageLayout === 'minimal'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              }`}>
                {Array.from({ length: REC_PER_PAGE }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 ${
                homepageLayout === 'minimal'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              }`}>
                {(recommendedProducts.length > 0 ? recommendedProducts : exploreSourceProducts).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {recCurrentPage < recTotalPages && !productsLoading && (
              <div id="rec-scroll-sentinel" className="flex items-center justify-center py-8">
                {recPageLoading ? (
                  <div className="flex items-center gap-2 text-gray-3 text-sm">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  <span className="text-xs text-gray-4">Scroll pour voir plus</span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Floating sidebar (right edge, hidden mobile) ─── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col bg-white rounded-l-lg shadow-lg overflow-hidden">
        <button className="flex flex-col items-center gap-1 px-3 py-3 hover:bg-gray-6 transition-colors border-b border-gray-5">
          <MessageSquare className="w-5 h-5 text-gray-2" />
          <span className="text-[10px] text-gray-3 leading-tight">Messagerie</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-3 hover:bg-gray-6 transition-colors border-b border-gray-5">
          <Wand2 className="w-5 h-5 text-gray-2" />
          <span className="text-[10px] text-gray-3 leading-tight">Accio Work</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-3 hover:bg-gray-6 transition-colors">
          <ScanLine className="w-5 h-5 text-gray-2" />
          <span className="text-[10px] text-gray-3 leading-tight">EA Lens</span>
        </button>
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
    </div>
  );
}
