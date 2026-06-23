import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import * as crypto from 'crypto';

/**
 * Service d'integration GFSolutions Payment Gateway
 * Passerelle marchand: creation de lien de paiement, le client paie avec son compte GFS.
 *
 * Les cles sont lues depuis: DB (SettingsService) > ENV > vide
 */

export interface GFSPaymentResult {
  paymentRef: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  orderId: string;
  expiresAt: string;
  status: string;
  id: string;
}

export interface GFSPaymentStatus {
  paymentRef: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  transactionId?: string;
}

@Injectable()
export class GfsService {
  private readonly logger = new Logger('GfsService');

  constructor(private settings: SettingsService) {}

  private async getBaseUrl(): Promise<string> {
    return this.settings.getValue('gfs_payment_url', 'GFS_PAYMENT_URL', 'https://pay.gfsolutions.cm');
  }

  private async getApiKey(): Promise<string> {
    return this.settings.getValue('gfs_api_key', 'GFS_API_KEY');
  }

  private async getApiSecret(): Promise<string> {
    return this.settings.getValue('gfs_api_secret', 'GFS_API_SECRET');
  }

  async isConfigured(): Promise<boolean> {
    const [apiKey, apiSecret] = await Promise.all([this.getApiKey(), this.getApiSecret()]);
    return !!apiKey && !!apiSecret;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const [apiKey, apiSecret] = await Promise.all([this.getApiKey(), this.getApiSecret()]);
    return {
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creer un lien de paiement GFSolutions.
   * Le client est redirige vers pay.gfsolutions.cm pour payer avec son compte GFS.
   */
  async createPayment(params: {
    amount: number;
    orderId: string;
    description?: string;
    callbackUrl?: string;
    returnUrl?: string;
    metadata?: string;
    expiresInMinutes?: number;
  }): Promise<GFSPaymentResult> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('GFSolutions non configure (GFS_API_KEY manquant)');
    }

    if (params.amount < 100) {
      throw new BadRequestException('Montant minimum GFSolutions: 100 FCFA');
    }

    const body = {
      amount: Math.round(params.amount),
      orderId: params.orderId,
      description: params.description,
      callbackUrl: params.callbackUrl,
      returnUrl: params.returnUrl,
      metadata: params.metadata,
      expiresInMinutes: params.expiresInMinutes || 30,
    };

    this.logger.log(`[GFS] Creation paiement: ${params.orderId} — ${params.amount} XAF`);

    const [baseUrl, headers] = await Promise.all([this.getBaseUrl(), this.getHeaders()]);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/v1/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      this.logger.error(`[GFS] Erreur reseau: ${err.message}`);
      throw new BadRequestException('Erreur communication GFSolutions: ' + err.message);
    }

    const data = await res.json();

    if (!res.ok) {
      this.logger.warn(`[GFS] Erreur ${res.status}: ${JSON.stringify(data)}`);
      throw new BadRequestException(data.message || `Erreur GFSolutions (${res.status})`);
    }

    this.logger.log(`[GFS] Paiement cree: ${data.paymentRef}`);
    return data as GFSPaymentResult;
  }

  /**
   * Verifier le statut d'un paiement
   */
  async getPaymentStatus(paymentRef: string): Promise<GFSPaymentStatus> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('GFSolutions non configure');
    }

    const [baseUrl, headers] = await Promise.all([this.getBaseUrl(), this.getHeaders()]);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/v1/payments/${paymentRef}`, {
        headers,
      });
    } catch (err: any) {
      throw new BadRequestException('Erreur communication GFSolutions: ' + err.message);
    }

    const data = await res.json();
    if (!res.ok) {
      throw new BadRequestException(data.message || 'Paiement GFS introuvable');
    }

    return data as GFSPaymentStatus;
  }

  /**
   * Verifier la signature du webhook GFSolutions (HMAC-SHA256 sur le body)
   */
  async verifyWebhookSignature(rawBody: Buffer, signature: string): Promise<boolean> {
    const apiKey = await this.getApiKey();
    if (!apiKey || !signature) return false;

    const expected = crypto
      .createHmac('sha256', apiKey)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature.replace('sha256=', '')),
        Buffer.from(expected),
      );
    } catch {
      return false;
    }
  }
}
