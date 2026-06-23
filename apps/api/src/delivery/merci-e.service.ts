import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

/**
 * Service d'integration Merci E (plateforme de livraison/ride-hailing).
 *
 * Ref: /Users/chrisdev/Documents/Main-File-March-06-2026/
 * API: Laravel REST (POST /api/v1/request/delivery/create)
 * Temps reel: Firebase Realtime Database
 *
 * Les cles sont lues depuis: DB (SettingsService) > ENV
 */

export interface MerciEDeliveryRequest {
  requestId: string;
  status: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  vehicleNumber?: string;
  estimatedTime?: number;
  trackingUrl?: string;
}

export interface MerciEEstimate {
  distance: number;
  duration: number;
  price: number;
  currency: string;
}

@Injectable()
export class MerciEService {
  private readonly logger = new Logger('MerciEService');

  constructor(private settings: SettingsService) {}

  private async getBaseUrl(): Promise<string> {
    return this.settings.getValue('merci_e_api_url', 'MERCI_E_API_URL', 'http://localhost:8001');
  }

  private async getApiToken(): Promise<string> {
    return this.settings.getValue('merci_e_api_token', 'MERCI_E_API_TOKEN');
  }

  async isConfigured(): Promise<boolean> {
    const [url, token] = await Promise.all([this.getBaseUrl(), this.getApiToken()]);
    return !!url && !!token;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getApiToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Estimer le cout et le temps de livraison
   */
  async estimate(params: {
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
  }): Promise<MerciEEstimate> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('Merci E non configure');
    }

    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    const body = {
      pick_lat: params.pickupLat,
      pick_lng: params.pickupLng,
      drop_lat: params.dropLat,
      drop_lng: params.dropLng,
      transport_type: 'delivery',
    };

    try {
      const res = await fetch(`${baseUrl}/api/v1/request/list-packages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new BadRequestException(data.message || 'Erreur estimation Merci E');
      }

      // Extraire le package livraison (le moins cher)
      const packages = data.data || [];
      const deliveryPkg = packages[0];

      return {
        distance: deliveryPkg?.distance || 0,
        duration: deliveryPkg?.duration || 0,
        price: deliveryPkg?.price || 0,
        currency: 'XAF',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`[MerciE] Erreur estimation: ${err.message}`);
      throw new BadRequestException('Erreur communication Merci E: ' + err.message);
    }
  }

  /**
   * Creer une demande de livraison sur Merci E
   */
  async createDeliveryRequest(params: {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    pickupContactName: string;
    pickupContactPhone: string;
    dropAddress: string;
    dropLat: number;
    dropLng: number;
    dropContactName: string;
    dropContactPhone: string;
    packageDescription: string;
    orderId: string;
  }): Promise<MerciEDeliveryRequest> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('Merci E non configure');
    }

    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    const body = {
      pick_lat: params.pickupLat,
      pick_lng: params.pickupLng,
      drop_lat: params.dropLat,
      drop_lng: params.dropLng,
      pick_address: params.pickupAddress,
      drop_address: params.dropAddress,
      goods_type: params.packageDescription,
      sender_name: params.pickupContactName,
      sender_phone: params.pickupContactPhone,
      receiver_name: params.dropContactName,
      receiver_phone: params.dropContactPhone,
      payment_opt: 'CASH',
      transport_type: 'delivery',
      note: `Commande EstuaireAchats #${params.orderId}`,
    };

    this.logger.log(`[MerciE] Creation livraison pour commande: ${params.orderId}`);

    try {
      const res = await fetch(`${baseUrl}/api/v1/request/delivery/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        this.logger.warn(`[MerciE] Erreur ${res.status}: ${JSON.stringify(data)}`);
        throw new BadRequestException(data.message || 'Erreur creation livraison Merci E');
      }

      this.logger.log(`[MerciE] Livraison creee: ${data.data?.id || 'N/A'}`);

      return {
        requestId: data.data?.id?.toString() || '',
        status: data.data?.is_completed ? 'COMPLETED' : 'SEARCHING_DRIVER',
        driverId: data.data?.driver_id?.toString(),
        estimatedTime: data.data?.estimated_time,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`[MerciE] Erreur creation: ${err.message}`);
      throw new BadRequestException('Erreur communication Merci E: ' + err.message);
    }
  }

  /**
   * Recuperer le statut d'une livraison
   */
  async getDeliveryStatus(requestId: string): Promise<any> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('Merci E non configure');
    }

    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    try {
      const res = await fetch(`${baseUrl}/api/v1/request/history/${requestId}`, {
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new BadRequestException(data.message || 'Livraison introuvable');
      }

      const req = data.data;

      return {
        requestId: req?.id?.toString(),
        status: this.mapStatus(req),
        driverName: req?.driverDetail?.data?.name,
        driverPhone: req?.driverDetail?.data?.mobile,
        driverPhoto: req?.driverDetail?.data?.profile_picture,
        vehicleNumber: req?.driverDetail?.data?.car_number,
        pickupAddress: req?.pick_address,
        dropAddress: req?.drop_address,
        price: req?.request_bill?.data?.total_amount,
        currency: 'XAF',
        createdAt: req?.trip_start_time,
        completedAt: req?.completed_at,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Erreur communication Merci E: ' + err.message);
    }
  }

  /**
   * Annuler une livraison
   */
  async cancelDelivery(requestId: string, reason?: string): Promise<{ success: boolean }> {
    if (!(await this.isConfigured())) {
      throw new BadRequestException('Merci E non configure');
    }

    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    try {
      const res = await fetch(`${baseUrl}/api/v1/request/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          request_id: requestId,
          reason: reason || 'Annulation commande EstuaireAchats',
        }),
      });

      const data = await res.json();
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }

  private mapStatus(req: any): string {
    if (!req) return 'UNKNOWN';
    if (req.is_completed) return 'DELIVERED';
    if (req.is_cancelled) return 'CANCELLED';
    if (req.driver_id && !req.is_trip_start) return 'DRIVER_ASSIGNED';
    if (req.is_trip_start && !req.is_completed) return 'IN_TRANSIT';
    if (req.is_driver_arrived) return 'DRIVER_ARRIVED';
    return 'SEARCHING_DRIVER';
  }
}
