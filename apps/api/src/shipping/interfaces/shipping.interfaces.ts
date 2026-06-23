// ============================================================
// Interfaces pour les reponses de l'API Merci E
// ============================================================

export interface ShippingEstimate {
  totalFee: number;
  currency: string;
  distance: number; // en km
  duration: string; // ex: "25 min"
  vehicleType: string;
  packageType?: string;
}

export interface DeliveryRequest {
  requestId: string;
  orderNumber: string;
  status: string;
  trackingUrl?: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  totalFee: number;
  currency: string;
}

export interface DeliveryStatus {
  requestId: string;
  status: string; // PENDING, ACCEPTED, PICKED_UP, ON_THE_WAY, DELIVERED, CANCELLED
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  vehiclePlate?: string;
  currentLat?: number;
  currentLng?: number;
  updatedAt: string;
}

export interface PackageType {
  id: number;
  name: string;
  description?: string;
}

export interface GoodsType {
  id: number;
  name: string;
  description?: string;
}

export interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  deliveryStatus: string;
  merciERequestId?: string;
  trackingUrl?: string;
  driverName?: string;
  driverPhone?: string;
  currentLat?: number;
  currentLng?: number;
  estimatedDeliveryTime?: string;
  timeline: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  label: string;
  timestamp: string | null;
  isCompleted: boolean;
}

export interface ShippingAddress {
  address: string;
  lat: number;
  lng: number;
  fullName: string;
  phone: string;
  city?: string;
}

export interface MerciEApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
