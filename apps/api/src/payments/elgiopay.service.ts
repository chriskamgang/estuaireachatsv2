import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ElgioPayService {
  private readonly logger = new Logger('ElgioPayService');
  private client: AxiosInstance | null = null;

  constructor(private settings: SettingsService) {}

  private async getClient(): Promise<AxiosInstance> {
    if (this.client) return this.client;

    const baseUrl = await this.settings.getSettingByKey('elgiopay_api_url') || 'https://sandbox-api.elgiopay.com';
    const secretKey = await this.settings.getSettingByKey('elgiopay_secret_key');

    if (!secretKey) {
      throw new Error('ElgioPay secret key non configuree. Configurez-la dans Admin > Parametres.');
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    return this.client;
  }

  resetClient() {
    this.client = null;
  }

  /**
   * Etape 1 : Initialiser le paiement par carte
   */
  async initPayment(): Promise<any> {
    const client = await this.getClient();

    try {
      const res = await client.post('/api/v1/card-payment/init', {});
      this.logger.log(`[ElgioPay] Init OK`);
      return res.data;
    } catch (err: any) {
      this.logger.error(`[ElgioPay] Init erreur: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
      throw new Error(err.response?.data?.message || 'Erreur initialisation paiement par carte');
    }
  }

  /**
   * Etape 2 : Traiter le paiement avec le paymentMethodId Stripe
   */
  async processPayment(paymentData: {
    amount: number;
    currency?: string;
    paymentMethodId: string;
    cardholderName: string;
    customerEmail?: string;
    description?: string;
    reference?: string;
  }): Promise<any> {
    const client = await this.getClient();

    const payload = {
      amount: paymentData.amount,
      currency: paymentData.currency || 'XAF',
      payment_method_id: paymentData.paymentMethodId,
      customer_name: paymentData.cardholderName,
      customer_email: paymentData.customerEmail || '',
      description: paymentData.description,
      reference: paymentData.reference,
    };
    this.logger.log(`[ElgioPay] Process payload: ${JSON.stringify(payload)}`);

    try {
      const res = await client.post('/api/v1/card-payment/process', payload);

      this.logger.log(`[ElgioPay] Process OK: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (err: any) {
      const errData = err.response?.data;
      this.logger.error(`[ElgioPay] Process erreur (HTTP ${err.response?.status}): ${errData ? JSON.stringify(errData) : err.message}`);

      // Si le paiement necessite confirmation (3DS), retourner la reponse au lieu de throw
      if (errData?.error === 'PAYMENT_REQUIRES_ACTION' || errData?.payment_intent_status === 'requires_confirmation') {
        this.logger.log(`[ElgioPay] Payment requires confirmation, will call confirm...`);
        return { ...errData, requires_confirmation: true };
      }

      throw new Error(errData?.message || 'Erreur traitement paiement par carte');
    }
  }

  /**
   * Etape 3 : Confirmer le paiement
   */
  async confirmPayment(paymentData: Record<string, any>): Promise<any> {
    const client = await this.getClient();

    try {
      const res = await client.post('/api/v1/card-payment/confirm', paymentData);
      this.logger.log(`[ElgioPay] Confirm OK`);
      return res.data;
    } catch (err: any) {
      this.logger.error(`[ElgioPay] Confirm erreur: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
      throw new Error(err.response?.data?.message || 'Erreur confirmation paiement par carte');
    }
  }
}
