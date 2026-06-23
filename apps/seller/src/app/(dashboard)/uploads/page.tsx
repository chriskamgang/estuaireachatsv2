'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Upload, Image, FileText, Film, Music, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface FileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image className="w-5 h-5 text-primary" />;
  if (type.startsWith('video/')) return <Film className="w-5 h-5 text-warning" />;
  if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-info" />;
  if (type.includes('pdf')) return <FileText className="w-5 h-5 text-success" />;
  return <FileText className="w-5 h-5 text-gray-3" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await api.get<any>('/upload/my');
      if (res.data) {
        setFiles(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);
        await api.upload('/upload', formData);
      }
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du telechargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    try {
      await api.delete(`/upload/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Fichiers telecharges</h1>
        </div>
        <label className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition text-sm font-medium cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Envoi...' : 'Telecharger un fichier'}
          <input type="file" className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div
          className="border-2 border-dashed border-gray-5 rounded-lg p-8 text-center mb-6"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-10 h-10 text-gray-3 mx-auto mb-3" />
          <p className="text-sm text-gray-2">Glissez-deposez vos fichiers ici</p>
          <p className="text-xs text-gray-3 mt-1">PNG, JPG, PDF, MP4 jusqu&apos;a 20MB</p>
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-gray-3 text-center py-8">Aucun fichier telecharge</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-6 transition">
                <div className="w-10 h-10 rounded-lg bg-gray-6 flex items-center justify-center">
                  <FileIcon type={file.fileType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{file.fileName}</p>
                  <p className="text-xs text-gray-3">{formatSize(file.fileSize)}</p>
                </div>
                <span className="text-xs text-gray-3">{formatDate(file.createdAt)}</span>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
