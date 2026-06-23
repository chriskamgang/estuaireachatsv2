'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, ShoppingCart, TrendingUp, Target, Download, Loader2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface ReportsData {
  totalRevenue: number;
  totalOrders: number;
  avgBasket: number;
  topProduits: Array<{ nom: string; ventes: number; montant: number }>;
  topVendeurs: Array<{ nom: string; commandes: number; revenus: number }>;
  revenusMensuels: Array<{ mois: string; montant: number }>;
  commandesParStatut: Array<{ statut: string; count: number; color: string }>;
}

const statusLabels: Record<string, string> = {
  DELIVERED: 'Livrees',
  SHIPPED: 'Expediees',
  PROCESSING: 'En traitement',
  CONFIRMED: 'Confirmees',
  PENDING: 'En attente',
  CANCELLED: 'Annulees',
  REFUNDED: 'Remboursees',
};

export default function ReportsPage() {
  const [dateDebut, setDateDebut] = useState('2025-01-01');
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: ReportsData }>(
        `/orders/admin/reports?dateFrom=${dateDebut}&dateTo=${dateFin}`,
      );
      setData(res.data);
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = () => {
    if (!data) return;

    const lines: string[] = [];
    lines.push('=== RAPPORT ESTUAIRE ACHATS ===');
    lines.push(`Periode: ${dateDebut} a ${dateFin}`);
    lines.push(`Revenus total: ${data.totalRevenue} FCFA`);
    lines.push(`Commandes total: ${data.totalOrders}`);
    lines.push(`Panier moyen: ${Math.round(data.avgBasket)} FCFA`);
    lines.push('');

    lines.push('=== TOP PRODUITS ===');
    lines.push('Rang,Produit,Ventes,Montant FCFA');
    data.topProduits.forEach((p, i) => {
      lines.push(`${i + 1},"${p.nom}",${p.ventes},${p.montant}`);
    });
    lines.push('');

    lines.push('=== TOP VENDEURS ===');
    lines.push('Rang,Vendeur,Commandes,Revenus FCFA');
    data.topVendeurs.forEach((v, i) => {
      lines.push(`${i + 1},"${v.nom}",${v.commandes},${v.revenus}`);
    });
    lines.push('');

    lines.push('=== REVENUS MENSUELS ===');
    lines.push('Mois,Montant FCFA');
    data.revenusMensuels.forEach((r) => {
      lines.push(`${r.mois},${r.montant}`);
    });
    lines.push('');

    lines.push('=== COMMANDES PAR STATUT ===');
    lines.push('Statut,Nombre');
    data.commandesParStatut.forEach((c) => {
      lines.push(`${statusLabels[c.statut] || c.statut},${c.count}`);
    });

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${dateDebut}-${dateFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-3">Erreur lors du chargement des rapports</p>
      </div>
    );
  }

  const maxRevenu = Math.max(...data.revenusMensuels.map((r) => r.montant), 1);
  const totalCommandes = data.commandesParStatut.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Rapports & Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            <span className="text-gray-3 text-sm">a</span>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Revenus total" value={formatPrice(data.totalRevenue)} icon={TrendingUp} gradient="linear-gradient(135deg, #3390f3, #1a6dd4)" />
        <StatCard title="Commandes total" value={data.totalOrders.toLocaleString('fr-FR')} icon={ShoppingCart} gradient="linear-gradient(135deg, #00A06A, #008555)" />
        <StatCard title="Panier moyen" value={formatPrice(Math.round(data.avgBasket))} icon={Target} gradient="linear-gradient(135deg, #F5A623, #D4880A)" />
        <StatCard title="Produits vendus" value={data.topProduits.reduce((s, p) => s + p.ventes, 0).toLocaleString('fr-FR')} icon={BarChart3} gradient="linear-gradient(135deg, #8B5CF6, #6D28D9)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus mensuels - bar chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Revenus mensuels</h2>
          {data.revenusMensuels.length === 0 ? (
            <p className="text-sm text-gray-3 text-center py-16">Aucune donnee sur cette periode</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {data.revenusMensuels.map((r) => (
                <div key={r.mois} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-3 font-medium">{formatPrice(r.montant)}</span>
                  <div className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition" style={{ height: `${(r.montant / maxRevenu) * 140}px` }} />
                  <span className="text-xs font-medium text-gray-2">{r.mois}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commandes par statut */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Commandes par statut</h2>
          {data.commandesParStatut.length === 0 ? (
            <p className="text-sm text-gray-3 text-center py-16">Aucune commande sur cette periode</p>
          ) : (
            <div className="flex items-center gap-8">
              <div className="w-40 h-40 rounded-full border-8 border-gray-5 relative flex items-center justify-center">
                <span className="text-2xl font-bold text-dark">{totalCommandes.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex-1 space-y-3">
                {data.commandesParStatut.map((c) => (
                  <div key={c.statut} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm text-gray-2">{statusLabels[c.statut] || c.statut}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dark">{c.count}</span>
                      <span className="text-xs text-gray-3">({totalCommandes > 0 ? ((c.count / totalCommandes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top 10 produits */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Top 10 produits</h2>
          {data.topProduits.length === 0 ? (
            <p className="text-sm text-gray-3 text-center py-8">Aucun produit vendu sur cette periode</p>
          ) : (
            <div className="space-y-3">
              {data.topProduits.map((p, i) => (
                <div key={`${p.nom}-${i}`} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary text-white' : 'bg-gray-5 text-gray-2'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{p.nom}</p>
                    <p className="text-xs text-gray-3">{p.ventes} ventes</p>
                  </div>
                  <span className="text-sm font-semibold text-dark">{formatPrice(p.montant)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 vendeurs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Top 5 vendeurs</h2>
          {data.topVendeurs.length === 0 ? (
            <p className="text-sm text-gray-3 text-center py-8">Aucun vendeur sur cette periode</p>
          ) : (
            <div className="space-y-3">
              {data.topVendeurs.map((v, i) => (
                <div key={`${v.nom}-${i}`} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary text-white' : 'bg-gray-5 text-gray-2'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{v.nom}</p>
                    <p className="text-xs text-gray-3">{v.commandes} commandes</p>
                  </div>
                  <span className="text-sm font-semibold text-dark">{formatPrice(v.revenus)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
