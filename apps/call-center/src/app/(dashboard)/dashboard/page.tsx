'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ShoppingBag, Phone, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalPending: number;
  totalToday: number;
  callsToday: number;
  confirmedToday: number;
  scheduledCallbacks: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<{ data?: DashboardStats } & DashboardStats>('/call-center/dashboard').then((res) => {
      setStats(res.data || res);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { label: 'Commandes en attente', value: stats.totalPending, icon: Clock, color: 'text-warning', bg: 'bg-warning-soft' },
    { label: 'Commandes aujourd\'hui', value: stats.totalToday, icon: ShoppingBag, color: 'text-info', bg: 'bg-info-soft' },
    { label: 'Appels aujourd\'hui', value: stats.callsToday, icon: Phone, color: 'text-primary', bg: 'bg-primary-soft' },
    { label: 'Confirmees aujourd\'hui', value: stats.confirmedToday, icon: CheckCircle, color: 'text-success', bg: 'bg-success-soft' },
    { label: 'Rappels planifies', value: stats.scheduledCallbacks, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger-soft' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-dark mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark">{card.value}</p>
            <p className="text-xs text-gray-3 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
