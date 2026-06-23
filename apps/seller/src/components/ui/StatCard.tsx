'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  gradient?: string;
  icon: LucideIcon;
}

function WaveSvg() {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="h-[40px] opacity-20">
      <path
        d="M0 30 Q100 0 200 30 T400 30 V60 H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function StatCard({ title, value, gradient, icon: Icon }: StatCardProps) {
  if (gradient) {
    return (
      <div
        className="stat-card-wave rounded-xl p-5 text-white"
        style={{ background: gradient }}
      >
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <WaveSvg />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-3">{title}</p>
          <p className="text-2xl font-bold text-dark mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
