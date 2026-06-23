'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Trash2, Download, Image, FileText, Film, File, Search, Grid, List, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface UploadedFile {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  userId: number;
  createdAt: string;
  nom: string;
  type: 'image' | 'document' | 'video' | 'autre';
  taille: string;
  uploadePar: string;
  date: string;
}

function getFileType(mimeType: string): 'image' | 'document' | 'video' | 'autre' {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType?.startsWith('video/')) return 'video';
  return 'autre';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function mapUpload(u: { id: number; fileName: string; filePath: string; fileType: string; fileSize: number; userId: number; createdAt: string }): UploadedFile {
  return {
    ...u,
    nom: u.fileName,
    type: getFileType(u.fileType),
    taille: formatFileSize(u.fileSize),
    uploadePar: `User #${u.userId}`,
    date: u.createdAt,
  };
}

const typeIcon: Record<string, React.ElementType> = {
  image: Image,
  document: FileText,
  video: Film,
  autre: File,
};

const typeColor: Record<string, string> = {
  image: 'text-primary bg-primary-soft',
  document: 'text-warning bg-warning-soft',
  video: 'text-info bg-info-soft',
  autre: 'text-gray-2 bg-gray-5',
};

const PALETTE = [
  'bg-red-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100',
  'bg-purple-100', 'bg-pink-100', 'bg-indigo-100', 'bg-orange-100',
];

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: { id: number; fileName: string; filePath: string; fileType: string; fileSize: number; userId: number; createdAt: string }[] }>('/upload/admin/list?page=1&perPage=100');
      setFiles(res.data.map(mapUpload));
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = files.filter((f) => {
    const matchSearch = !search || f.nom.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || f.type === typeFilter;
    return matchSearch && matchType;
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    try {
      await api.delete(`/upload/admin/${id}`);
      setSelected(selected.filter((i) => i !== id));
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Supprimer ${selected.length} fichier(s) ?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/upload/admin/${id}`)));
      setSelected([]);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleUpload = () => {
    inputRef.current?.click();
  };

  const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Gestionnaire de Fichiers</h1>
            <p className="text-sm text-gray-3">{files.length} fichiers — {formatFileSize(totalSize)} utilises</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger border border-danger rounded-lg hover:bg-danger-soft transition"
            >
              <Trash2 className="w-4 h-4" /> Supprimer ({selected.length})
            </button>
          )}
          <input ref={inputRef} type="file" multiple className="hidden" />
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Upload className="w-4 h-4" /> Telecharger
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Images', count: files.filter((f) => f.type === 'image').length, icon: Image, color: 'text-primary' },
          { label: 'Documents', count: files.filter((f) => f.type === 'document').length, icon: FileText, color: 'text-warning' },
          { label: 'Videos', count: files.filter((f) => f.type === 'video').length, icon: Film, color: 'text-info' },
          { label: 'Autres', count: files.filter((f) => f.type === 'autre').length, icon: File, color: 'text-gray-2' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <Icon className={`w-6 h-6 ${stat.color}`} />
              <div>
                <p className="text-lg font-bold text-dark">{stat.count}</p>
                <p className="text-xs text-gray-3">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Rechercher un fichier..."
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Tous les types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
          </select>
          <div className="ml-auto flex items-center gap-1 bg-gray-6 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-5'}`}>
              <Grid className="w-4 h-4 text-gray-2" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-5'}`}>
              <List className="w-4 h-4 text-gray-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone d'upload drag & drop */}
      <div
        onClick={handleUpload}
        className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:bg-primary-soft/30 hover:border-primary/60 transition"
      >
        <Upload className="w-8 h-8 text-primary/50 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-2">Cliquez ou glissez-deposez des fichiers ici</p>
        <p className="text-xs text-gray-3 mt-0.5">Supporte: JPG, PNG, PDF, MP4, SVG, XLSX — Max 50 Mo par fichier</p>
      </div>

      {/* Grille / Liste */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((file, idx) => {
            const Icon = typeIcon[file.type] || File;
            const isSelected = selected.includes(file.id);
            return (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={`relative bg-white rounded-xl shadow-sm border-2 overflow-hidden cursor-pointer transition ${isSelected ? 'border-primary' : 'border-transparent hover:border-gray-5'}`}
              >
                <div className={`h-20 flex items-center justify-center ${PALETTE[idx % PALETTE.length]}`}>
                  <Icon className={`w-8 h-8 ${typeColor[file.type].split(' ')[0]}`} />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-dark truncate" title={file.nom}>{file.nom}</p>
                  <p className="text-[10px] text-gray-3">{file.taille}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">&#10003;</span>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                  className="absolute bottom-1.5 right-1.5 p-1 rounded bg-white/80 hover:bg-danger-soft text-gray-3 hover:text-danger transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-5">
          {filtered.map((file) => {
            const Icon = typeIcon[file.type] || File;
            return (
              <div key={file.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-6/30 transition">
                <input
                  type="checkbox"
                  checked={selected.includes(file.id)}
                  onChange={() => toggleSelect(file.id)}
                  className="accent-primary"
                />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor[file.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{file.nom}</p>
                </div>
                <span className="text-xs text-gray-3 w-20 text-right">{file.taille}</span>
                <span className="text-xs text-gray-3 w-28 text-right hidden md:block">{file.uploadePar}</span>
                <span className="text-xs text-gray-3 w-24 text-right">{formatDate(file.date)}</span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
