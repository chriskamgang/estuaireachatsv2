import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de parametrage admin.
 * Stocke les cles de paiement et autres configs dans la table business_settings.
 * Les valeurs sensibles sont masquees en lecture (seuls les 4 derniers caracteres sont affiches).
 */

// Cles de configuration paiement
const PAYMENT_KEYS = {
  // KPay
  kpay_api_key: 'kpay_api_key',
  kpay_secret_key: 'kpay_secret_key',
  kpay_webhook_secret: 'kpay_webhook_secret',
  kpay_enabled: 'kpay_enabled',
  // GFSolutions
  gfs_payment_url: 'gfs_payment_url',
  gfs_api_key: 'gfs_api_key',
  gfs_api_secret: 'gfs_api_secret',
  gfs_enabled: 'gfs_enabled',
  // PayPal
  paypal_client_id: 'paypal_client_id',
  paypal_client_secret: 'paypal_client_secret',
  paypal_mode: 'paypal_mode',
  paypal_enabled: 'paypal_enabled',
  // COD
  cod_enabled: 'cod_enabled',
} as const;

// Cles dont la valeur est sensible (masquee en lecture)
const SENSITIVE_KEYS = new Set([
  'kpay_api_key',
  'kpay_secret_key',
  'kpay_webhook_secret',
  'gfs_api_key',
  'gfs_api_secret',
  'paypal_client_id',
  'paypal_client_secret',
  'anthropic_api_key',
  'unsplash_access_key',
]);

@Injectable()
export class SettingsService {
  private readonly logger = new Logger('SettingsService');

  // Cache en memoire pour eviter les requetes DB repetees
  private cache = new Map<string, string>();
  private cacheLoaded = false;

  constructor(private prisma: PrismaService) {
    this.loadCache().catch(() => {});
  }

  // ==================== CACHE ====================

  private async loadCache() {
    try {
      const settings = await this.prisma.businessSetting.findMany();
      this.cache.clear();
      for (const s of settings) {
        if (s.value !== null) this.cache.set(s.type, s.value);
      }
      this.cacheLoaded = true;
      this.logger.log(`Settings chargees: ${this.cache.size} cle(s)`);
    } catch (e: any) {
      this.logger.warn(`Impossible de charger les settings: ${e.message}`);
    }
  }

  /**
   * Recuperer une valeur depuis le cache, puis la DB, puis l'env.
   * Priorite: DB > ENV > default
   */
  async getValue(key: string, envFallback?: string, defaultValue?: string): Promise<string> {
    // 1. Cache
    if (this.cache.has(key)) return this.cache.get(key)!;

    // 2. DB
    if (!this.cacheLoaded) await this.loadCache();
    if (this.cache.has(key)) return this.cache.get(key)!;

    // 3. ENV
    if (envFallback && process.env[envFallback]) return process.env[envFallback]!;

    return defaultValue || '';
  }

  async getBool(key: string, envFallback?: string, defaultValue = true): Promise<boolean> {
    const val = await this.getValue(key, envFallback);
    if (!val) return defaultValue;
    return val === 'true' || val === '1';
  }

  // ==================== UPSERT ====================

  private async upsert(key: string, value: string | null) {
    await this.prisma.businessSetting.upsert({
      where: { type: key },
      update: { value },
      create: { type: key, value },
    });

    if (value !== null) {
      this.cache.set(key, value);
    } else {
      this.cache.delete(key);
    }
  }

  // ==================== MASQUAGE ====================

  private mask(value: string | null): string {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return '••••••••' + value.slice(-4);
  }

  // ==================== KPAY ====================

  async getKPaySettings() {
    const [apiKey, secretKey, webhookSecret, enabled] = await Promise.all([
      this.getValue('kpay_api_key', 'KPAY_API_KEY'),
      this.getValue('kpay_secret_key', 'KPAY_SECRET_KEY'),
      this.getValue('kpay_webhook_secret', 'KPAY_WEBHOOK_SECRET'),
      this.getBool('kpay_enabled', undefined, true),
    ]);

    const isTest = apiKey.startsWith('kpay_test_');

    return {
      apiKey: this.mask(apiKey),
      secretKey: this.mask(secretKey),
      webhookSecret: this.mask(webhookSecret),
      enabled,
      configured: !!apiKey && !!secretKey,
      environment: apiKey ? (isTest ? 'sandbox' : 'production') : 'non configure',
    };
  }

  async updateKPaySettings(dto: {
    apiKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    mode?: string;
    enabled?: boolean;
  }) {
    if (dto.apiKey !== undefined) await this.upsert('kpay_api_key', dto.apiKey);
    if (dto.secretKey !== undefined) await this.upsert('kpay_secret_key', dto.secretKey);
    if (dto.webhookSecret !== undefined) await this.upsert('kpay_webhook_secret', dto.webhookSecret);
    if (dto.mode !== undefined) await this.upsert('kpay_mode', dto.mode);
    if (dto.enabled !== undefined) await this.upsert('kpay_enabled', String(dto.enabled));

    this.logger.log('[Settings] KPay mis a jour');
    return this.getKPaySettings();
  }

  // ==================== GFS ====================

  async getGfsSettings() {
    const [paymentUrl, apiKey, apiSecret, enabled] = await Promise.all([
      this.getValue('gfs_payment_url', 'GFS_PAYMENT_URL', 'https://pay.gfsolutions.cm'),
      this.getValue('gfs_api_key', 'GFS_API_KEY'),
      this.getValue('gfs_api_secret', 'GFS_API_SECRET'),
      this.getBool('gfs_enabled', undefined, true),
    ]);

    return {
      paymentUrl,
      apiKey: this.mask(apiKey),
      apiSecret: this.mask(apiSecret),
      enabled,
      configured: !!apiKey && !!apiSecret,
    };
  }

  async updateGfsSettings(dto: {
    paymentUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    callbackUrl?: string;
    enabled?: boolean;
  }) {
    if (dto.paymentUrl !== undefined) await this.upsert('gfs_payment_url', dto.paymentUrl);
    if (dto.apiKey !== undefined) await this.upsert('gfs_api_key', dto.apiKey);
    if (dto.apiSecret !== undefined) await this.upsert('gfs_api_secret', dto.apiSecret);
    if (dto.callbackUrl !== undefined) await this.upsert('gfs_callback_url', dto.callbackUrl);
    if (dto.enabled !== undefined) await this.upsert('gfs_enabled', String(dto.enabled));

    this.logger.log('[Settings] GFSolutions mis a jour');
    return this.getGfsSettings();
  }

  // ==================== PAYPAL ====================

  async getPaypalSettings() {
    const [clientId, clientSecret, mode, enabled] = await Promise.all([
      this.getValue('paypal_client_id', 'PAYPAL_CLIENT_ID'),
      this.getValue('paypal_client_secret', 'PAYPAL_CLIENT_SECRET'),
      this.getValue('paypal_mode', 'PAYPAL_MODE', 'sandbox'),
      this.getBool('paypal_enabled', undefined, false),
    ]);

    return {
      clientId: this.mask(clientId),
      clientSecret: this.mask(clientSecret),
      mode,
      enabled,
      configured: !!clientId && !!clientSecret,
    };
  }

  async updatePaypalSettings(dto: {
    clientId?: string;
    clientSecret?: string;
    mode?: string;
    enabled?: boolean;
  }) {
    if (dto.clientId !== undefined) await this.upsert('paypal_client_id', dto.clientId);
    if (dto.clientSecret !== undefined) await this.upsert('paypal_client_secret', dto.clientSecret);
    if (dto.mode !== undefined) await this.upsert('paypal_mode', dto.mode);
    if (dto.enabled !== undefined) await this.upsert('paypal_enabled', String(dto.enabled));

    this.logger.log('[Settings] PayPal mis a jour');
    return this.getPaypalSettings();
  }

  // ==================== COD ====================

  async getCodEnabled(): Promise<boolean> {
    return this.getBool('cod_enabled', undefined, true);
  }

  async setCodEnabled(enabled: boolean) {
    await this.upsert('cod_enabled', String(enabled));
    return { enabled };
  }

  // ==================== AI / INTELLIGENCE ARTIFICIELLE ====================

  async getAiSettings() {
    const [anthropicKey, unsplashKey] = await Promise.all([
      this.getValue('anthropic_api_key', 'ANTHROPIC_API_KEY'),
      this.getValue('unsplash_access_key', 'UNSPLASH_ACCESS_KEY'),
    ]);

    return {
      anthropicKey: this.mask(anthropicKey),
      unsplashKey: this.mask(unsplashKey),
      hasAnthropicKey: !!anthropicKey && anthropicKey !== 'sk-ant-your-key-here',
      hasUnsplashKey: !!unsplashKey && unsplashKey !== 'your-unsplash-access-key-here',
    };
  }

  async updateAiSettings(dto: {
    anthropicKey?: string;
    unsplashKey?: string;
  }) {
    if (dto.anthropicKey !== undefined) await this.upsert('anthropic_api_key', dto.anthropicKey);
    if (dto.unsplashKey !== undefined) await this.upsert('unsplash_access_key', dto.unsplashKey);

    this.logger.log('[Settings] AI settings mis a jour');
    return this.getAiSettings();
  }

  // ==================== VUE GLOBALE ====================

  async getAllPaymentSettings() {
    const [kpay, gfs, paypal, codEnabled] = await Promise.all([
      this.getKPaySettings(),
      this.getGfsSettings(),
      this.getPaypalSettings(),
      this.getCodEnabled(),
    ]);

    return {
      result: true,
      data: {
        kpay,
        gfs,
        paypal,
        cod: { enabled: codEnabled },
      },
    };
  }

  /**
   * Recharger le cache depuis la DB (utile apres un update)
   */
  async reloadCache() {
    await this.loadCache();
    return { result: true, message: 'Cache recharge' };
  }

  // ==================== GENERIC ADMIN SETTINGS ====================

  /**
   * Recuperer un parametre admin generique par cle.
   * La valeur est stockee en JSON dans BusinessSetting.value.
   */
  async getSettingByKey(key: string): Promise<any> {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: key },
    });

    if (!setting || setting.value === null) {
      return null;
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  /**
   * Creer ou mettre a jour un parametre admin generique.
   * La valeur est serialisee en JSON.
   */
  async updateSettingByKey(key: string, value: any): Promise<any> {
    const serialized = JSON.stringify(value);

    await this.prisma.businessSetting.upsert({
      where: { type: key },
      update: { value: serialized },
      create: { type: key, value: serialized },
    });

    // Mettre a jour le cache
    this.cache.set(key, serialized);

    this.logger.log(`[Settings] Cle "${key}" mise a jour`);

    return value;
  }
}
