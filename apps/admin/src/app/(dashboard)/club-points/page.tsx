'use client';

import { useState, useEffect } from 'react';
import { Star, Save, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface PointEntry {
  id: number;
  utilisateur: string;
  pointsGagnes: number;
  pointsConvertis: number;
  pointsRestants: number;
  date: string;
}

const defaultPoints: PointEntry[] = [
  { id: 1, utilisateur: 'Jean Mbarga', pointsGagnes: 1250, pointsConvertis: 500, pointsRestants: 750, date: '2026-06-15' },
  { id: 2, utilisateur: 'Marie Ngo', pointsGagnes: 890, pointsConvertis: 200, pointsRestants: 690, date: '2026-06-14' },
  { id: 3, utilisateur: 'Paul Atangana', pointsGagnes: 2300, pointsConvertis: 1800, pointsRestants: 500, date: '2026-06-14' },
  { id: 4, utilisateur: 'Sophie Ekane', pointsGagnes: 450, pointsConvertis: 0, pointsRestants: 450, date: '2026-06-13' },
  { id: 5, utilisateur: 'Albert Fouda', pointsGagnes: 5600, pointsConvertis: 4000, pointsRestants: 1600, date: '2026-06-12' },
  { id: 6, utilisateur: 'Francoise Bella', pointsGagnes: 320, pointsConvertis: 100, pointsRestants: 220, date: '2026-06-11' },
  { id: 7, utilisateur: 'Eric Njoh', pointsGagnes: 1850, pointsConvertis: 850, pointsRestants: 1000, date: '2026-06-10' },
  { id: 8, utilisateur: 'Christine Owona', pointsGagnes: 970, pointsConvertis: 500, pointsRestants: 470, date: '2026-06-09' },
];

export default function ClubPointsPage() {
  const [tauxPoint, setTauxPoint] = useState(1);
  const [tauxAchat, setTauxAchat] = useState(100);
  const [actif, setActif] = useState(true);
  const [configSaved, setConfigSaved] = useState(false);
  const [points, setPoints] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ earnRate?: number; conversionRate?: number; active?: boolean }>('/club-points/config').catch(() => null),
      api.get<{ data: PointEntry[] }>('/settings/admin/admin_club_points_overview').catch(() => null),
    ]).then(([configRes, listRes]) => {
      if (configRes) {
        if (configRes.earnRate != null) setTauxAchat(configRes.earnRate);
        if (configRes.conversionRate != null) setTauxPoint(configRes.conversionRate);
        if (configRes.active != null) setActif(configRes.active);
      }
      if (listRes?.data) setPoints(listRes.data); else setPoints(defaultPoints);
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.patch('/club-points/config', { earnRate: tauxAchat, conversionRate: tauxPoint, active: actif });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const columns: Column<PointEntry>[] = [
    { name: 'Utilisateur', key: 'utilisateur', render: (item) => <span className="font-medium text-dark">{item.utilisateur}</span> },
    { name: 'Points gagnes', key: 'pointsGagnes', render: (item) => <span className="font-semibold text-primary">{item.pointsGagnes.toLocaleString('fr-FR')}</span> },
    { name: 'Points convertis', key: 'pointsConvertis', render: (item) => item.pointsConvertis.toLocaleString('fr-FR') },
    { name: 'Points restants', key: 'pointsRestants', render: (item) => <span className="font-semibold">{item.pointsRestants.toLocaleString('fr-FR')}</span> },
    { name: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Star className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Club Points</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Configuration</h2>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-2 mb-1">1 point = X FCFA</label>
            <input type="number" min={1} value={tauxPoint} onChange={(e) => setTauxPoint(Number(e.target.value))} className="w-32 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-2 mb-1">X FCFA = 1 point</label>
            <input type="number" min={1} value={tauxAchat} onChange={(e) => setTauxAchat(Number(e.target.value))} className="w-32 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-2">Actif</span>
            <button type="button" onClick={() => setActif(!actif)} className={`relative w-11 h-6 rounded-full transition ${actif ? 'bg-primary' : 'bg-gray-4'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${actif ? 'translate-x-5' : ''}`} />
            </button>
          </label>
          <button onClick={handleSaveConfig} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            <Save className="w-4 h-4" />
            {configSaved ? 'Enregistre !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">Historique des points</h2>
        </div>
        <DataTable columns={columns} data={points} />
      </div>
    </div>
  );
}
