'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ImportResult {
  totalLines: number;
  created: number;
  errors: number;
  errorDetails: string[];
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError('');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_accessToken') : null;
      const res = await fetch(`${API_URL}/products/admin/import-template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur telechargement template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-import-produits.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du telechargement du template');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    setResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_accessToken') : null;
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/products/admin/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setResult(data.data);
      setFile(null);
      // Reset file input
      const input = document.getElementById('csv-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Upload className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Import en masse</h1>
          <p className="text-sm text-gray-3">Importez vos produits depuis un fichier CSV ou Excel</p>
        </div>
      </div>

      {/* Import result */}
      {result && (
        <div className={`p-4 rounded-xl border ${result.errors > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            {result.errors > 0 ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-medium text-sm text-dark">
                Import termine : {result.created} produit(s) cree(s) sur {result.totalLines} ligne(s)
              </p>
              {result.errors > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-yellow-700 font-medium">{result.errors} erreur(s) :</p>
                  <ul className="mt-1 text-xs text-yellow-700 space-y-0.5">
                    {result.errorDetails.map((e, i) => (
                      <li key={i}>- {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-dark">1. Telecharger le modele</h2>
          <p className="text-sm text-gray-2">Telechargez le fichier modele CSV et remplissez-le avec vos produits.</p>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition"
          >
            <Download className="w-4 h-4" /> Telecharger le modele CSV
          </button>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Colonnes requises :</p>
                <p>name, description, price, category, brand, stock, sku, tags</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-dark">2. Importer le fichier</h2>
          <p className="text-sm text-gray-2">Selectionnez votre fichier CSV rempli pour importer les produits.</p>
          <div
            onClick={() => document.getElementById('csv-input')?.click()}
            className="border-2 border-dashed border-gray-4 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition"
          >
            <input id="csv-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <FileSpreadsheet className="w-10 h-10 text-gray-3 mx-auto mb-3" />
            {file ? (
              <p className="text-sm font-medium text-dark">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-dark">Glissez un fichier ou cliquez</p>
                <p className="text-xs text-gray-3 mt-1">CSV, XLSX (max 5MB)</p>
              </>
            )}
          </div>
          <button onClick={handleImport} disabled={!file || importing} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {importing ? 'Importation en cours...' : 'Importer les produits'}
          </button>
        </div>
      </div>
    </div>
  );
}
