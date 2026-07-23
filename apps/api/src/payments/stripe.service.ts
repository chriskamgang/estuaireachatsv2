import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger('StripeService');
  private stripeClient: Stripe | null = null;

  constructor(private settings: SettingsService) {}

  private async getStripe(): Promise<Stripe> {
    if (this.stripeClient) return this.stripeClient;

    const secretKey = await this.settings.getSettingByKey('stripe_secret_key');
    if (!secretKey) {
      throw new Error('Stripe secret key non configuree');
    }

    this.stripeClient = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' as any });
    return this.stripeClient;
  }

  /**
   * Reinitialise le client Stripe (apres changement de cle dans les settings)
   */
  resetClient() {
    this.stripeClient = null;
  }

  /**
   * Cree un PaymentIntent pour le montant donne (en FCFA).
   * Stripe attend le montant en centimes de la devise.
   * Pour XAF (zero-decimal currency), on envoie le montant tel quel.
   */
  async createPaymentIntent(params: {
    amount: number;
    combinedOrderId: string;
    description?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const stripe = await this.getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount),
      currency: 'xaf',
      description: params.description || `Commande EstuaireAchats`,
      metadata: {
        combinedOrderId: params.combinedOrderId,
      },
    });

    this.logger.log(`[Stripe] PaymentIntent cree: ${paymentIntent.id} — ${params.amount} XAF`);

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Verifie la signature du webhook Stripe
   */
  async verifyWebhookSignature(rawBody: Buffer, signature: string): Promise<Stripe.Event> {
    const stripe = await this.getStripe();
    const webhookSecret = await this.settings.getSettingByKey('stripe_webhook_secret');

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret non configure');
    }

    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  /**
   * Recupere un PaymentIntent par son ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = await this.getStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
