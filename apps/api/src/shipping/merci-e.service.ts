import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ShippingEstimate,
  DeliveryRequest,
  DeliveryStatus,
  PackageType,
  GoodsType,
  MerciEApiResponse,
} from './interfaces/shipping.interfaces';

@Injectable()
export class MerciEService {
  private readonly logger = new Logger(MerciEService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.MERCI_E_API_URL || 'http://localhost:8001/api/v1';
    this.token = process.env.MERCI_E_API_TOKEN || '';
  }

  /**
   * Headers d'authentification pour l'API Merci E
   */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Appel HTTP generique vers l'API Merci E
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.log(`MerciE API ${method} ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request<MerciEApiResponse<T>>({
          method,
          url,
          data,
          headers: this.getHeaders(),
          timeout: 30000,
        }),
      );

      if (response.data && response.data.success === false) {
        this.logger.warn(`MerciE API error: ${response.data.message}`);
        throw new HttpException(
          response.data.message || 'Erreur API Merci E',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data?.data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const axiosError = error as any;
      const status = axiosError?.response?.status || HttpStatus.SERVICE_UNAVAILABLE;
      const message =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        'Service de livraison indisponible';

      this.logger.error(
        `MerciE API error: ${method} ${url} - ${status} - ${message}`,
        axiosError?.stack,
      );

      throw new HttpException(
        `Service de livraison Merci E indisponible: ${message}`,
        status >= 400 && status < 600 ? status : HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Calculer les frais de livraison (estimation)
   */
  async calculateShippingFee(params: {
    pickLat: number;
    pickLng: number;
    dropLat: number;
    dropLng: number;
    vehicleType?: string;
    packageType?: string;
  }): Promise<ShippingEstimate> {
    const data = {
      pick_lat: params.pickLat,
      pick_lng: params.pickLng,
      drop_lat: params.dropLat,
      drop_lng: params.dropLng,
      vehicle_type: params.vehicleType || 'bike',
      package_type: params.packageType || 'small',
    };

    const response = await this.request<any>('POST', '/delivery/estimate', data);

    return {
      totalFee: response.total_fee || response.totalFee || 0,
      currency: response.currency || 'XAF',
      distance: response.distance || 0,
      duration: response.duration || '',
      vehicleType: response.vehicle_type || response.vehicleType || params.vehicleType || 'bike',
      packageType: response.package_type || response.packageType || params.packageType,
    };
  }

  /**
   * Creer une demande de livraison
   */
  async createDeliveryRequest(params: {
    pickAddress: string;
    pickLat: number;
    pickLng: number;
    pickPocName: string;
    pickPocMobile: string;
    dropAddress: string;
    dropLat: number;
    dropLng: number;
    dropPocName: string;
    dropPocMobile: string;
    goodsTypeId?: number;
    goodsQuantity?: string;
    paymentOpt?: number; // 0=card, 1=cash, 2=wallet
    paidAt?: string; // 'Sender' | 'Receiver'
    stops?: Array<{
      address: string;
      lat: number;
      lng: number;
      pocName: string;
      pocMobile: string;
    }>;
  }): Promise<DeliveryRequest> {
    const data: any = {
      pick_address: params.pickAddress,
      pick_lat: params.pickLat,
      pick_lng: params.pickLng,
      pick_poc_name: params.pickPocName,
      pick_poc_mobile: params.pickPocMobile,
      drop_address: params.dropAddress,
      drop_lat: params.dropLat,
      drop_lng: params.dropLng,
      drop_poc_name: params.dropPocName,
      drop_poc_mobile: params.dropPocMobile,
      goods_type_id: params.goodsTypeId || 1,
      goods_quantity: params.goodsQuantity || '1',
      payment_opt: params.paymentOpt ?? 2, // wallet par defaut
      paid_at: params.paidAt || 'Sender',
    };

    if (params.stops && params.stops.length > 0) {
      data.stops = params.stops.map((stop) => ({
        address: stop.address,
        lat: stop.lat,
        lng: stop.lng,
        poc_name: stop.pocName,
        poc_mobile: stop.pocMobile,
      }));
    }

    const response = await this.request<any>('POST', '/delivery/request', data);

    return {
      requestId: response.request_id || response.requestId || response.id,
      orderNumber: response.order_number || response.orderNumber || '',
      status: response.status || 'PENDING',
      trackingUrl: response.tracking_url || response.trackingUrl,
      estimatedPickupTime: response.estimated_pickup_time || response.estimatedPickupTime,
      estimatedDeliveryTime: response.estimated_delivery_time || response.estimatedDeliveryTime,
      totalFee: response.total_fee || response.totalFee || 0,
      currency: response.currency || 'XAF',
    };
  }

  /**
   * Recuperer le statut d'une livraison
   */
  async getDeliveryStatus(requestId: string): Promise<DeliveryStatus> {
    const response = await this.request<any>('GET', `/delivery/status/${requestId}`);

    return {
      requestId: response.request_id || response.requestId || requestId,
      status: response.status || 'UNKNOWN',
      driverName: response.driver_name || response.driverName,
      driverPhone: response.driver_phone || response.driverPhone,
      driverPhoto: response.driver_photo || response.driverPhoto,
      vehiclePlate: response.vehicle_plate || response.vehiclePlate,
      currentLat: response.current_lat || response.currentLat,
      currentLng: response.current_lng || response.currentLng,
      updatedAt: response.updated_at || response.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Recuperer les types de colis disponibles
   */
  async getPackageTypes(): Promise<PackageType[]> {
    const response = await this.request<any[]>('GET', '/delivery/package-types');

    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || null,
    }));
  }

  /**
   * Recuperer les types de marchandises
   */
  async getGoodsTypes(): Promise<GoodsType[]> {
    const response = await this.request<any[]>('GET', '/delivery/goods-types');

    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || null,
    }));
  }
}
