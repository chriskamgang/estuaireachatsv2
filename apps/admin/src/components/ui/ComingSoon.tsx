'use client';

import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">{title}</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Construction className="w-16 h-16 text-gray-4 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark mb-2">Bientot disponible</h2>
        <p className="text-sm text-gray-3 max-w-md mx-auto">
          {description || 'Cette fonctionnalite est en cours de developpement et sera disponible prochainement.'}
        </p>
      </div>
    </div>
  );
}
