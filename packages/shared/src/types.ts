import type { UserRole, OrderStatus, PaymentStatus, PaymentMethod } from './enums';

// ============================
// API Response
// ============================
export interface ApiResponse<T = unknown> {
  result: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> {
  result: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

// ============================
// Auth
// ============================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ============================
// Product
// ============================
export interface PriceTier {
  minQty: number;
  maxQty?: number;
  price: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  image?: string;
  price?: number;
  stock: number;
  sku?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  priceRange: string;
  minOrderQty: number;
  totalSold: number;
  rating: number;
  shopName: string;
  shopYears: number;
  shopCountry: string;
  isVerified: boolean;
  isFeatured: boolean;
  rebuyRate?: number;
  deliveryEstimate?: string;
  certifications: string[];
}

// ============================
// Cart
// ============================
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  tax: number;
  quantity: number;
  variation?: string;
  shopId: string;
  shopName: string;
  maxStock: number;
  minQty: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  itemCount: number;
}

// ============================
// Order
// ============================
export interface OrderListItem {
  id: string;
  code: string;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
  sellerName: string;
}

// ============================
// Locale
// ============================
export type Locale = 'fr' | 'en';
