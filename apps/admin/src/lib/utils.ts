import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-success-soft text-success',
    APPROVED: 'bg-success-soft text-success',
    PAID: 'bg-success-soft text-success',
    DELIVERED: 'bg-success-soft text-success',
    COMPLETED: 'bg-success-soft text-success',
    PENDING: 'bg-warning-soft text-warning',
    PROCESSING: 'bg-info-soft text-info',
    CONFIRMED: 'bg-info-soft text-info',
    SHIPPED: 'bg-primary-soft text-primary',
    CANCELLED: 'bg-danger-soft text-danger',
    REJECTED: 'bg-danger-soft text-danger',
    FAILED: 'bg-danger-soft text-danger',
    BANNED: 'bg-danger-soft text-danger',
    SUSPENDED: 'bg-danger-soft text-danger',
    INACTIVE: 'bg-gray-5 text-gray-2',
    DRAFT: 'bg-gray-5 text-gray-2',
    REFUNDED: 'bg-info-soft text-info',
  };
  return map[status] || 'bg-gray-5 text-gray-2';
}
