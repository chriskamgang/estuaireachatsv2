'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, CheckCircle, Download, AlertCircle, Loader2, History } from 'lucide-react';
import { api } from '@/lib/api';

const CURRENT_VERSION = {
  app: '2.4.1',
  api: '2.4.1',
  admin: '2.4.0',
  seller: '2.4.1',
  releaseDate: '2026-05-10',
};

const AVAILABLE_UPDATE = {
  version: '2.5.0',
  releaseDate: '2026-06-18',
  type: 'MINEURE',
  changelog: [
    'Ajout du support paiement GFSolution',
    'Amelioration des performances de recherche Elasticsearch',
    'Nouveau systeme de recommandation produits par IA',
    'Correction du bug de calcul de commission sur les remises',
    'Interface de gestion des abonnes newsletter redesignee',
    'Support des devises multiples (XAF, EUR, USD)',
    'Amelioration de la securite des tokens JWT',
    'Optimisation des images automatique (WebP)',
  ],
  taille: '45.2 Mo',
  dureeEstimee: '~8 minutes',
};

const HISTORY = [
  { version: '2.4.1', date: '2026-05-10', type: 'PATCH', note: 'Correction bug paiement MTN MoMo' },
  { version: '2.4.0', date: '2026-04-20', type: 'MINEURE', note: 'Ajout systeme de fidélité Club Points' },
  { version: '2.3.5', date: '2026-03-15', type: 'PATCH', note: 'Corrections securite et performance' },
  { version: '2.3.0', date: '2026-02-01', type: 'MINEURE', note: 'Module ventes aux encheres' },
  { version: '2.2.0', date: '2025-12-10', type: 'MINEURE', note: 'Application mobile Flutter v1.0' },
  { version: '2.0.0', date: '2025-09-01', type: 'MAJEURE', note: 'Refonte complete de la plateforme' },
];

const typeColor: Record<string, string> = {
  PATCH: 'bg-gray-5 text-gray-2',
  MINEURE: 'bg-info-soft text-info',
  MAJEURE: 'bg-primary-soft text-primary',
};

export default function SystemUpdatesPage() {
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: unknown }>('/settings/admin/admin_system_updates')
      .then(() => {})
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }
    setUpdating(false);
    setUpdated(true);
  };

  if (pageLoading) {
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
          <ArrowDownUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Mises a jour systeme</h1>
          <p className="text-sm text-gray-3">Verifiez et installez les mises a jour disponibles</p>
        </div>
      </div>

      {/* Version actuelle */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Version actuelle</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Application', version: CURRENT_VERSION.app },
            { label: 'API (NestJS)', version: CURRENT_VERSION.api },
            { label: 'Admin', version: CURRENT_VERSION.admin },
            { label: 'Seller', version: CURRENT_VERSION.seller },
          ].map((v) => (
            <div key={v.label} className="text-center p-4 bg-gray-6/40 rounded-lg">
              <p className="text-xs text-gray-3 mb-1">{v.label}</p>
              <p className="text-xl font-bold text-dark">v{v.version}</p>
              <p className="text-[10px] text-gray-3 mt-0.5">Derniere mise a jour: {CURRENT_VERSION.releaseDate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mise a jour disponible */}
      {!updated ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-primary/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-dark">Mise a jour disponible</h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColor[AVAILABLE_UPDATE.type]}`}>
                  {AVAILABLE_UPDATE.type}
                </span>
              </div>
              <p className="text-sm text-gray-3">
                Version <span className="font-bold text-dark">v{AVAILABLE_UPDATE.version}</span> — publiee le {AVAILABLE_UPDATE.releaseDate}
              </p>
              <p className="text-xs text-gray-3 mt-0.5">
                Taille: {AVAILABLE_UPDATE.taille} — Duree estimee: {AVAILABLE_UPDATE.dureeEstimee}
              </p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition disabled:opacity-60"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {updating ? 'Installation...' : 'Installer maintenant'}
            </button>
          </div>

          {updating && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-3 mb-1.5">
                <span>Progression de la mise a jour...</span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-5 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-3 mt-1">
                {progress < 20 ? 'Telechargement des fichiers...' :
                  progress < 50 ? 'Installation des dependances...' :
                  progress < 80 ? 'Migration de la base de donnees...' :
                  'Redemarrage des services...'}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-2 mb-2">Nouveautes dans cette version:</p>
            <ul className="space-y-1">
              {AVAILABLE_UPDATE.changelog.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-1">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-success-soft border border-success/30 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
          <div>
            <p className="font-bold text-success">Mise a jour reussie !</p>
            <p className="text-sm text-success/80">EstuaireAchats v{AVAILABLE_UPDATE.version} a ete installe avec succes.</p>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-3" />
          <h2 className="text-base font-bold text-dark">Historique des versions</h2>
        </div>
        <div className="space-y-3">
          {HISTORY.map((entry) => (
            <div key={entry.version} className="flex items-center gap-4 py-3 border-b border-gray-5/50 last:border-0">
              <div className="text-center w-16 flex-shrink-0">
                <p className="text-sm font-bold text-dark">v{entry.version}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${typeColor[entry.type]}`}>
                {entry.type}
              </span>
              <p className="flex-1 text-sm text-gray-1">{entry.note}</p>
              <p className="text-xs text-gray-3 flex-shrink-0">{entry.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup avant mise a jour */}
      <div className="bg-warning-soft border border-warning/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">Recommandation</p>
          <p className="text-xs text-warning/80 mt-0.5">
            Avant toute mise a jour, effectuez une sauvegarde complete de la base de donnees et des fichiers uploadés.
            La derniere sauvegarde automatique a ete effectuee le <span className="font-medium">2026-06-21 02:00:00</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
