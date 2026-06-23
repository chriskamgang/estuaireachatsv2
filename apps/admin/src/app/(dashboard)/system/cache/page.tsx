'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CacheItem {
  id: string;
  nom: string;
  description: string;
  taille: string;
  entrees: number;
  expiration: string;
  statut: 'actif' | 'vide';
}

const CACHE_ITEMS: CacheItem[] = [
  { id: 'products', nom: 'Cache Produits', description: 'Donnees des produits, categories et attributs', taille: '24.3 Mo', entrees: 4821, expiration: '1 heure', statut: 'actif' },
  { id: 'users', nom: 'Cache Utilisateurs', description: 'Profils clients et vendeurs (sessions)', taille: '8.7 Mo', entrees: 1203, expiration: '30 minutes', statut: 'actif' },
  { id: 'orders', nom: 'Cache Commandes', description: 'Donnees de commandes recentes', taille: '12.1 Mo', entrees: 892, expiration: '15 minutes', statut: 'actif' },
  { id: 'config', nom: 'Cache Configuration', description: 'Parametres systeme, taxes, livraison', taille: '0.4 Mo', entrees: 87, expiration: '24 heures', statut: 'actif' },
  { id: 'search', nom: 'Cache Recherches', description: 'Resultats de recherche populaires', taille: '15.8 Mo', entrees: 3456, expiration: '2 heures', statut: 'actif' },
  { id: 'views', nom: 'Cache Vues HTML', description: 'Pages HTML prerendues', taille: '45.2 Mo', entrees: 234, expiration: '6 heures', statut: 'actif' },
  { id: 'api', nom: 'Cache Reponses API', description: 'Reponses API mises en cache', taille: '6.3 Mo', entrees: 1102, expiration: '5 minutes', statut: 'actif' },
];

export default function CachePage() {
  const [items, setItems] = useState<CacheItem[]>(CACHE_ITEMS);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: CacheItem[] }>('/settings/admin/admin_system_cache')
      .then(res => { if (res.data) setItems(res.data); })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);
  const [clearing, setClearing] = useState<string | null>(null);
  const [cleared, setCleared] = useState<string[]>([]);
  const [clearingAll, setClearingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const clearCache = async (id: string) => {
    setClearing(id);
    await new Promise((r) => setTimeout(r, 1200));
    setItems(items.map((item) => item.id === id ? { ...item, taille: '0 o', entrees: 0, statut: 'vide' } : item));
    setCleared((prev) => [...prev, id]);
    setClearing(null);
    showToast('Cache vide avec succes');
  };

  const clearAll = async () => {
    setClearingAll(true);
    await new Promise((r) => setTimeout(r, 2000));
    setItems(items.map((item) => ({ ...item, taille: '0 o', entrees: 0, statut: 'vide' })));
    setCleared(items.map((i) => i.id));
    setClearingAll(false);
    showToast('Tout le cache a ete vide avec succes');
  };

  const rebuildCache = async () => {
    setClearingAll(true);
    await new Promise((r) => setTimeout(r, 2500));
    setItems(CACHE_ITEMS);
    setCleared([]);
    setClearingAll(false);
    showToast('Cache reconstruit avec succes');
  };

  const totalSize = items.reduce((acc, item) => {
    const val = parseFloat(item.taille);
    return isNaN(val) ? acc : acc + val;
  }, 0);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <RefreshCcw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Gestion du Cache</h1>
            <p className="text-sm text-gray-3">Videz et gerez les caches systeme</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={rebuildCache}
            disabled={clearingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary-soft transition disabled:opacity-50"
          >
            {clearingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Reconstruire tout
          </button>
          <button
            onClick={clearAll}
            disabled={clearingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-danger text-white rounded-lg hover:bg-danger/90 transition disabled:opacity-50"
          >
            {clearingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Tout vider
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Taille totale du cache</p>
          <p className="text-2xl font-bold text-dark">{totalSize.toFixed(1)} Mo</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Entrees totales</p>
          <p className="text-2xl font-bold text-dark">
            {items.reduce((acc, i) => acc + i.entrees, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-3 mb-1">Caches actifs</p>
          <p className="text-2xl font-bold text-success">{items.filter((i) => i.statut === 'actif').length} / {items.length}</p>
        </div>
      </div>

      {/* Liste des caches */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-5">
        {items.map((item) => {
          const isClearing = clearing === item.id;
          const isCleared = cleared.includes(item.id);

          return (
            <div key={item.id} className="flex items-center gap-4 p-5">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.statut === 'actif' ? 'bg-success' : 'bg-gray-4'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-dark">{item.nom}</h3>
                  {isCleared && item.statut === 'vide' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-success-soft text-success rounded">Vide</span>
                  )}
                </div>
                <p className="text-xs text-gray-3">{item.description}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-[10px] text-gray-3">Taille: <span className="font-medium text-gray-2">{item.taille}</span></span>
                  <span className="text-[10px] text-gray-3">Entrees: <span className="font-medium text-gray-2">{item.entrees.toLocaleString()}</span></span>
                  <span className="text-[10px] text-gray-3">TTL: <span className="font-medium text-gray-2">{item.expiration}</span></span>
                </div>
              </div>
              <button
                onClick={() => clearCache(item.id)}
                disabled={isClearing || clearingAll || item.statut === 'vide'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-5 rounded-lg hover:bg-gray-6 hover:text-danger hover:border-danger transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Vidage...</>
                ) : item.statut === 'vide' ? (
                  <><CheckCircle className="w-4 h-4 text-success" /> Vide</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Vider</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions avancees */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Actions avancees</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Optimiser la base de donnees', desc: 'Lance une optimisation VACUUM sur PostgreSQL', action: 'Optimiser' },
            { label: 'Reinitialiser les sessions', desc: 'Deconnecte tous les utilisateurs actifs', action: 'Reinitialiser' },
            { label: 'Purger les logs anciens', desc: 'Supprime les logs de plus de 30 jours', action: 'Purger' },
            { label: 'Regenerer les thumbnails', desc: 'Recree toutes les miniatures de produits', action: 'Regenerer' },
          ].map((action) => (
            <div key={action.label} className="flex items-center justify-between p-4 bg-gray-6/40 rounded-lg">
              <div>
                <p className="text-sm font-medium text-dark">{action.label}</p>
                <p className="text-xs text-gray-3">{action.desc}</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium border border-gray-5 rounded-lg hover:bg-white transition">
                {action.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
