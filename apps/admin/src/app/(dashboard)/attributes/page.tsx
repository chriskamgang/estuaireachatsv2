'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface AttributeValue {
  id: number;
  value: string;
}

interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAttr, setEditAttr] = useState<Attribute | null>(null);
  const [form, setForm] = useState({ name: '', valuesText: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Attribute[] }>('/attributes');
      setAttributes(res.data);
    } catch (err) {
      console.error('Erreur chargement attributs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditAttr(null);
    setForm({ name: '', valuesText: '' });
    setShowModal(true);
  };

  const openEdit = (attr: Attribute) => {
    setEditAttr(attr);
    setForm({ name: attr.name, valuesText: attr.values.map(v => v.value).join(', ') });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet attribut ?')) return;
    try {
      await api.delete(`/attributes/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editAttr) {
        // Update attribute name
        await api.patch(`/attributes/${editAttr.id}`, { name: form.name });
        // Parse new values
        const newValues = form.valuesText.split(',').map(v => v.trim()).filter(v => v);
        const existingValues = editAttr.values.map(v => v.value);
        // Add new values
        for (const val of newValues) {
          if (!existingValues.includes(val)) {
            await api.post(`/attributes/${editAttr.id}/values`, { value: val });
          }
        }
        // Remove old values
        for (const existing of editAttr.values) {
          if (!newValues.includes(existing.value)) {
            await api.delete(`/attributes/values/${existing.id}`);
          }
        }
      } else {
        // Create attribute
        const res = await api.post<{ id: number }>('/attributes', { name: form.name });
        // Add values
        const values = form.valuesText.split(',').map(v => v.trim()).filter(v => v);
        const attrId = (res as { id: number }).id;
        if (attrId) {
          for (const val of values) {
            await api.post(`/attributes/${attrId}/values`, { value: val });
          }
        }
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const columns: Column<Attribute>[] = [
    { name: 'Nom', key: 'name', render: (item) => <span className="font-medium text-dark">{item.name}</span> },
    {
      name: 'Valeurs',
      key: 'values',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-[400px]">
          {item.values.slice(0, 8).map(v => (
            <span key={v.id} className="px-2 py-0.5 bg-gray-6 text-gray-2 rounded text-xs">{v.value}</span>
          ))}
          {item.values.length > 8 && <span className="px-2 py-0.5 bg-gray-6 text-gray-3 rounded text-xs">+{item.values.length - 8}</span>}
        </div>
      ),
    },
    { name: 'Nb valeurs', key: 'count', render: (item) => <span>{item.values.length}</span> },
    {
      name: 'Actions', key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

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
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><Layers className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Attributs</h1>
            <p className="text-sm text-gray-3">Tailles, memoires, configurations, materiaux...</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter un attribut
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={attributes} pagination={{ page: 1, perPage: 20, total: attributes.length }} />
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editAttr ? 'Modifier l\'attribut' : 'Ajouter un attribut'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Taille, Memoire, RAM..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Valeurs (separees par des virgules)</label>
                <textarea value={form.valuesText} onChange={(e) => setForm({ ...form, valuesText: e.target.value })} rows={3} placeholder="XS, S, M, L, XL, XXL" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">Chaque valeur separee par une virgule</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium">
                  {editAttr ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
