'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function BulkExportPage() {
  const [format, setFormat] = useState('csv');
  const [scope, setScope] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_accessToken') : null;
      const res = await fetch(
        `${API_URL}/products/admin/export?format=${format}&scope=${scope}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `produits-${scope}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Download className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Export en masse</h1>
          <p className="text-sm text-gray-3">Exportez vos produits dans un fichier CSV ou Excel</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-2 mb-1">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
            <option value="csv">CSV (.csv)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-2 mb-1">Produits a exporter</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass}>
            <option value="all">Tous les produits</option>
            <option value="active">Produits actifs uniquement</option>
            <option value="draft">Brouillons uniquement</option>
            <option value="wholesale">Produits en gros</option>
            <option value="digital">Produits numeriques</option>
          </select>
        </div>

        <div className="bg-gray-6/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Filter className="w-4 h-4 text-gray-3 mt-0.5" />
            <div className="text-xs text-gray-2">
              <p className="font-medium mb-1">Colonnes exportees :</p>
              <p>ID, Nom, Description, Prix, Categorie, Marque, Stock, SKU, Tags, Statut, Date de creation</p>
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting} className="w-full px-4 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Exportation en cours...' : `Exporter en ${format.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
