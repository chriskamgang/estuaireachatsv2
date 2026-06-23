import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

/**
 * Service d'integration KPay (https://admin.kpay.site)
 * Gere MTN MoMo, Orange Money et le mode passerelle hebergee.
 *
 * Docs: https://docs.kpay.site
 * Providers Cameroun: MTN_MOMO_CMR, ORANGE_CMR
 * Modes: USSD (provider + phoneNumber) / GATEWAY (page hebergee)
 *
 * Les cles sont lues depuis: DB (SettingsService) > ENV > vide
 */

// Mapping PaymentMethod interne -> KPay provider code
const METHOD_TO_PROVIDER: Record<string, string> = {
  MTN_MOMO: 'MTN_MOMO_CMR',
  ORANGE_MONEY: 'ORANGE_CMR',
};

export interface KPayInitResult {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  externalId: string;
  provider?: string;
  phoneNumber?: string;
  gatewayUrl?: string;
  isTest: boolean;
  message: string;
}

export interface KPayStatusResult {
  id: string;
  reference: string;
  status: string;
  amount: number;
  netAmount?: number;
  feeAmount?: number;
  currency: string;
  externalId: string;
  provider?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface KPayWithdrawResult {
  id: string;
  reference: string;
  status: string;
  amount: number;
  netAmount?: number;
  feeAmount?: number;
  currency: string;
  externalId: string;
  provider?: string;
  gatewayUrl?: string;
  isTest: boolean;
  message: string;
}

@Injectable()
export class KPayService {
  private readonly logger = new Logger('KPayService');
  private readonly baseUrl = 'https://admin.kpay.site';

  constructor(private settings: SettingsService) {}

  private async getApiKey(): Promise<string> {
    return this.settings.getValue('kpay_api_key', 'KPAY_API_KEY');
  }

  private async getSecretKey(): Promise<string> {
    return this.settings.getValue('kpay_secret_key', 'KPAY_SECRET_KEY');
  }

  private async getWebhookSecret(): Promise<string> {
    return this.settings.getValue('kpay_webhook_secret', 'KPAY_WEBHOOK_SECRET');
  }

  async isConfigured(): Promise<boolean> {
    const [apiKey, secretKey] = await Promise.all([this.getApiKey(), this.getSecretKey()]);
    return !!apiKey && !!secretKey;
  }

  async isTestMode(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return apiKey.startsWith('kpay_test_');
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const [apiKey, secretKey] = await Promise.all([this.getApiKey(), this.getSecretKey()]);
    return {
      'X-API-Key': apiKey,
      'X-Secret-Key': secretKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Resout le provider KPay depuis la methode interne
   */
  resolveProvider(method: string): string | undefined {
    return METHOD_TO_PROVIDER[method];
  }

  /**
   * Formate le telephone: 237XXXXXXXXX (sans +)
   */
  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\.+]/g, '');
    if (!cleaned.startsWith('237')) {
      cleaned = '237' + cleaned;
    }
    return cleaned;
  }

  // ==================== PAIEMENT MODE USSD ====================

  async initPaymentUssd(params: {
    amount: number;
    provider: string;
    phoneNumber: string;
    externalId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<KPayInitResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('KPay non configure (KPAY_API_KEY manquant)');
    }

    const body = {
      amount: Math.round(params.amount),
      provider: params.provider,
      phoneNumber: this.formatPhone(params.phoneNumber),
      externalId: params.externalId,
      description: params.description,
      metadata: params.metadata,
    };

    this.logger.log(`[USSD] Init paiement: ${params.externalId} — ${params.amount} XAF — ${params.provider}`);

    const res = await this.request('/api/v1/payments/init', 'POST', body);
    return res as KPayInitResult;
  }

  // ==================== PAIEMENT MODE GATEWAY ====================

  async initPaymentGateway(params: {
    amount: number;
    externalId: string;
    returnUrl: string;
    cancelUrl?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<KPayInitResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('KPay non configure (KPAY_API_KEY manquant)');
    }

    const body = {
      amount: Math.round(params.amount),
      externalId: params.externalId,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      description: params.description,
      metadata: params.metadata,
    };

    this.logger.log(`[GATEWAY] Init paiement: ${params.externalId} — ${params.amount} XAF`);

    const res = await this.request('/api/v1/payments/init', 'POST', body);
    return res as KPayInitResult;
  }

  // ==================== STATUT PAIEMENT ====================

  async getPaymentStatus(paymentId: string): Promise<KPayStatusResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('KPay non configure');
    }

    return this.request(`/api/v1/payments/${paymentId}`, 'GET') as Promise<KPayStatusResult>;
  }

  // ==================== RETRAIT (payout vendeur) ====================

  async initWithdraw(params: {
    amount: number;
    provider: string;
    phoneNumber: string;
    externalId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<KPayWithdrawResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('KPay non configure');
    }

    const body = {
      amount: Math.round(params.amount),
      provider: params.provider,
      phoneNumber: this.formatPhone(params.phoneNumber),
      externalId: params.externalId,
      description: params.description,
      metadata: params.metadata,
    };

    this.logger.log(`[WITHDRAW] Init retrait: ${params.externalId} — ${params.amount} XAF — ${params.provider}`);

    return this.request('/api/v1/payments/withdraw', 'POST', body) as Promise<KPayWithdrawResult>;
  }

  async getWithdrawStatus(withdrawId: string): Promise<KPayStatusResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('KPay non configure');
    }

    return this.request(`/api/v1/payments/withdraw/${withdrawId}`, 'GET') as Promise<KPayStatusResult>;
  }

  // ==================== UTILITAIRES ====================

  async predictProvider(phoneNumber: string): Promise<{ country: string; provider: string; phoneNumber: string }> {
    return this.request('/api/v1/payments/predict-provider', 'POST', {
      phoneNumber: this.formatPhone(phoneNumber),
    }) as any;
  }

  async getAvailability(): Promise<any[]> {
    return this.request('/api/v1/payments/availability', 'GET') as any;
  }

  async getBalance(): Promise<any[]> {
    return this.request('/api/v1/payments/balance', 'GET') as any;
  }

  // ==================== WEBHOOK SIGNATURE ====================

  async verifyWebhookSignature(rawBody: Buffer, signature: string): Promise<boolean> {
    const secret = await this.getWebhookSecret();
    if (!secret || !signature) return false;

    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Verifie la signature de retour passerelle (query string)
   */
  async verifyGatewayReturn(query: {
    status: string;
    reference: string;
    externalId?: string;
    ts: string;
    sig: string;
  }): Promise<boolean> {
    const secret = await this.getWebhookSecret();
    if (!secret || !query.sig) return false;

    const crypto = require('crypto');
    const stringToSign = `${query.status}|${query.reference}|${query.externalId || ''}|${query.ts}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    try {
      const valid = crypto.timingSafeEqual(Buffer.from(query.sig), Buffer.from(expected));
      const age = Date.now() - Number(query.ts);
      return valid && age < 10 * 60 * 1000;
    } catch {
      return false;
    }
  }

  // ==================== HTTP CLIENT ====================

  private async request(path: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers = await this.getHeaders();

    let res: any;
    try {
      res = await axios({
        method,
        url,
        headers,
        data: body,
        timeout: 30000,
      });
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        this.logger.warn(`[KPay] Erreur ${err.response.status}: ${JSON.stringify(data)}`);

        if (err.response.status === 429) {
          throw new BadRequestException('Trop de requetes KPay, reessayez dans quelques secondes');
        }

        throw new BadRequestException(data?.message || `Erreur KPay (${err.response.status})`);
      }
      this.logger.error(`[KPay] Erreur reseau: ${err.message}`);
      throw new BadRequestException('Erreur communication KPay: ' + err.message);
    }

    this.logger.log(`[KPay] ${method} ${path} — OK`);
    return res.data;
  }
}
