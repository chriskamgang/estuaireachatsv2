'use client';

import {
  Package,
  Shirt,
  Smartphone,
  Dribbble,
  Sparkles,
  Diamond,
  Home,
  PersonStanding,
  Footprints,
  Luggage,
  PackageOpen,
  Baby,
  SprayCan,
  Hospital,
  Gift,
  PawPrint,
  BookOpen,
  Factory,
  Store,
  HardHat,
  Building2,
  Armchair,
  Lightbulb,
  Refrigerator,
  Wrench,
  Car,
  Hammer,
  Sun,
  Zap,
  Shield,
  Forklift,
  FlaskConical,
  Settings,
  Cpu,
  Truck,
  Wheat,
  Layers,
  Cog,
  Handshake,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  checkroom: Shirt,
  smartphone: Smartphone,
  sports_soccer: Dribbble,
  face_retouching_natural: Sparkles,
  diamond: Diamond,
  home: Home,
  directions_run: PersonStanding,
  hiking: Footprints,
  luggage: Luggage,
  inventory_2: PackageOpen,
  child_friendly: Baby,
  cleaning_services: SprayCan,
  local_hospital: Hospital,
  card_giftcard: Gift,
  pets: PawPrint,
  menu_book: BookOpen,
  factory: Factory,
  storefront: Store,
  construction: HardHat,
  domain: Building2,
  chair: Armchair,
  lightbulb: Lightbulb,
  kitchen: Refrigerator,
  build: Wrench,
  directions_car: Car,
  hardware: Hammer,
  solar_power: Sun,
  electrical_services: Zap,
  security: Shield,
  forklift: Forklift,
  science: FlaskConical,
  settings: Settings,
  memory: Cpu,
  local_shipping: Truck,
  agriculture: Wheat,
  category: Layers,
  precision_manufacturing: Cog,
  handshake: Handshake,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Package;
  return iconMap[name] || Package;
}

interface CategoryIconProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export default function CategoryIcon({ name, size = 18, className = '' }: CategoryIconProps) {
  const Icon = getCategoryIcon(name);
  return <Icon size={size} className={className} />;
}
