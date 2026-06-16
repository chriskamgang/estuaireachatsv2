// ============================
// App
// ============================
export const APP_NAME = 'EstuaireAchats';
export const APP_DOMAIN = 'estuaireachats.com';
export const APP_VERSION = '1.0.0';

// ============================
// Devise
// ============================
export const CURRENCY_CODE = 'XAF';
export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_LOCALE = 'fr-FR';

export function formatPrice(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

// ============================
// Locales
// ============================
export const LOCALES = ['fr', 'en'] as const;
export const DEFAULT_LOCALE = 'fr';

// ============================
// Couleurs
// ============================
export const COLORS = {
  primary: '#E82328',
  primaryLight: '#FF3338',
  secondary: '#4A90D9',
  orange: '#FF6A00',
  green: '#00A06A',
  dark: '#191919',
  gray1: '#333333',
  gray2: '#666666',
  gray3: '#999999',
  gray4: '#CCCCCC',
  gray5: '#E8E8E8',
  gray6: '#F5F5F5',
  white: '#FFFFFF',
} as const;

// ============================
// Methodes de paiement
// ============================
export const PAYMENT_METHODS = {
  MTN_MOMO: { code: 'mtn_momo', label: 'MTN Mobile Money', icon: 'mtn' },
  ORANGE_MONEY: { code: 'orange_money', label: 'Orange Money', icon: 'orange' },
  PAYPAL: { code: 'paypal', label: 'PayPal', icon: 'paypal' },
  COD: { code: 'cod', label: 'Paiement a la livraison', icon: 'cash' },
  WALLET: { code: 'wallet', label: 'Portefeuille', icon: 'wallet' },
} as const;

// ============================
// Pagination
// ============================
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================
// Upload
// ============================
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_PRODUCT_IMAGES = 10;
