'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
    // Open in new tab with auth
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-import-produits.csv';
    // Use fetch to download with auth header
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
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
      setError(err.message || 'Erreur lors de l\'importation');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Import en masse</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Telecharger le modele</h2>
        <p className="text-sm text-gray-2 mb-4">Telechargez le fichier modele CSV, remplissez-le avec vos produits puis importez-le.</p>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Telecharger le modele CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Importer les produits</h2>

        {result && (
          <div className="mb-4 p-4 bg-success-soft border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-semibold text-success">Importation reussie</span>
            </div>
            <p className="text-sm text-gray-2">
              {result.imported || result.data?.imported || 0} produit(s) importe(s).
              {result.errors?.length > 0 && ` ${result.errors.length} erreur(s).`}
            </p>
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
          className={`border-2 border-dashed rounded-lg p-10 text-center transition ${
            dragActive ? 'border-primary bg-primary-soft/20' : 'border-gray-5'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
        >
          {uploading ? (
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 text-gray-3 mx-auto mb-3" />
          )}
          <p className="text-sm text-gray-2">
            {uploading ? 'Importation en cours...' : 'Glissez-deposez votre fichier CSV ici'}
          </p>
          <p className="text-xs text-gray-3 mt-1">Format CSV uniquement, max 5MB</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition text-sm font-medium disabled:opacity-50"
          >
            Parcourir
          </button>
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
