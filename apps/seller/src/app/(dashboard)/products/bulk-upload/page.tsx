'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function BulkUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('seller_accessToken') : null;
    const url = `${API_URL}/products/admin/import-template`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'template-import-produits.csv';
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => alert('Erreur lors du telechargement'));
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setError('Seuls les fichiers CSV sont acceptes');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<any>('/products/admin/import', formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const columns = [
    { name: 'name', desc: 'Nom du produit', required: true },
    { name: 'description', desc: 'Description complete', required: false },
    { name: 'shortDescription', desc: 'Description courte (pour les listes)', required: false },
    { name: 'price', desc: 'Prix en FCFA', required: false },
    { name: 'category', desc: 'Nom de la categorie (ex: electronique)', required: false },
    { name: 'brand', desc: 'Nom de la marque', required: false },
    { name: 'stock', desc: 'Quantite en stock', required: false },
    { name: 'sku', desc: 'Reference produit (SKU)', required: false },
    { name: 'tags', desc: 'Tags separes par ; (ex: tag1;tag2)', required: false },
    { name: 'status', desc: 'DRAFT, ACTIVE ou INACTIVE', required: false },
    { name: 'minOrderQty', desc: 'Quantite minimum de commande', required: false },
    { name: 'unit', desc: 'Unite (piece, carton, kg, lot...)', required: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Import en masse</h1>
          <p className="text-sm text-gray-3">Importez plusieurs produits a la fois via un fichier CSV</p>
        </div>
      </div>

      {/* Etape 1 : Template */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h2 className="text-lg font-bold text-dark">Telecharger le modele CSV</h2>
            <p className="text-sm text-gray-2 mt-1">Telechargez le fichier modele, remplissez-le avec vos produits dans Excel ou Google Sheets, puis importez-le.</p>
          </div>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-lg hover:bg-success/90 transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Telecharger le modele CSV
        </button>
      </div>

      {/* Colonnes du CSV */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-dark">Colonnes du fichier CSV</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-5">
                <th className="text-left py-2 font-medium text-gray-3">Colonne</th>
                <th className="text-left py-2 font-medium text-gray-3">Description</th>
                <th className="text-center py-2 font-medium text-gray-3">Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name} className="border-b border-gray-5 last:border-0">
                  <td className="py-2 font-mono text-xs text-dark">{col.name}</td>
                  <td className="py-2 text-gray-2">{col.desc}</td>
                  <td className="py-2 text-center">
                    {col.required ? (
                      <span className="text-xs bg-danger-soft text-danger px-2 py-0.5 rounded-full font-medium">Oui</span>
                    ) : (
                      <span className="text-xs text-gray-3">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Etape 2 : Import */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h2 className="text-lg font-bold text-dark">Importer les produits</h2>
            <p className="text-sm text-gray-2 mt-1">Glissez votre fichier CSV rempli ou cliquez pour parcourir.</p>
          </div>
        </div>

        {result && (
          <div className="mb-4 p-4 bg-success-soft border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-semibold text-success">Importation terminee</span>
            </div>
            <div className="text-sm text-gray-2 space-y-1">
              <p><strong>{result.data?.created || 0}</strong> produit(s) cree(s) sur <strong>{result.data?.totalLines || 0}</strong> ligne(s)</p>
              {result.data?.errors > 0 && (
                <div className="mt-2">
                  <p className="text-danger font-medium">{result.data.errors} erreur(s) :</p>
                  <ul className="list-disc list-inside mt-1 text-xs text-gray-3">
                    {result.data.errorDetails?.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              <span className="text-sm text-danger">{error}</span>
            </div>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
            dragActive ? 'border-primary bg-primary-soft/20' : 'border-gray-5 hover:border-gray-4'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 text-gray-3 mx-auto mb-3" />
          )}
          <p className="text-sm font-medium text-dark">
            {uploading ? 'Importation en cours...' : 'Glissez-deposez votre fichier CSV ici'}
          </p>
          <p className="text-xs text-gray-3 mt-1">Format CSV uniquement, max 5MB</p>
          {!uploading && (
            <span className="inline-block mt-4 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium">
              Parcourir
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
