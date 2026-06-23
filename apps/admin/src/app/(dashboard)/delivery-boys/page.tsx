'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bike, Plus, Pencil, Trash2, Eye, MapPin, Loader2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface DeliveryBoy {
  id: string;
  userId: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: string;
  avatar?: string;
  earning: number;
  livraisonsTotal: number;
  livraisonsEnCours: number;
  dateInscription: string;
}

export default function DeliveryBoysPage() {
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState<DeliveryBoy | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ perPage: '50' });
      if (search) params.set('search', search);
      const res = await api.get<{ data: DeliveryBoy[] }>(`/delivery/boys?${params}`);
      if (res.data && Array.isArray(res.data)) {
        setBoys(res.data);
      } else {
        setBoys([]);
      }
    } catch {
      setBoys([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce livreur ?')) return;
    try {
      await api.delete(`/delivery/boys/${id}`);
      setBoys(boys.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur suppression');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch<{ data: { id: string; status: string } }>(`/delivery/boys/${id}/toggle`);
      setBoys(boys.map((b) => b.id === id ? { ...b, statut: res.data.status } : b));
    } catch (err: any) {
      alert(err.message || 'Erreur changement statut');
    }
  };

  const openCreateModal = () => {
    setEditingBoy(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (boy: DeliveryBoy) => {
    setEditingBoy(boy);
    setForm({ firstName: boy.prenom, lastName: boy.nom, email: boy.email, phone: boy.telephone, password: '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      setError('Nom et prenom sont requis');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingBoy) {
        const res = await api.patch<{ data: any }>(`/delivery/boys/${editingBoy.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
        });
        setBoys(boys.map((b) => b.id === editingBoy.id ? {
          ...b,
          prenom: res.data.prenom || form.firstName,
          nom: res.data.nom || form.lastName,
          email: res.data.email || form.email,
          telephone: res.data.telephone || form.phone,
        } : b));
      } else {
        const res = await api.post<{ data: DeliveryBoy }>('/delivery/boys', {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password || undefined,
        });
        if (res.data) {
          setBoys([res.data, ...boys]);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<DeliveryBoy>[] = [
    {
      name: 'Livreur', key: 'nom', render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center font-bold text-primary text-sm">
            {item.prenom?.[0] || ''}{item.nom?.[0] || ''}
          </div>
          <div>
            <p className="text-sm font-medium text-dark">{item.prenom} {item.nom}</p>
            <p className="text-xs text-gray-3">{item.telephone || item.email || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Livraisons', key: 'livraisonsTotal', render: (item) => (
        <div>
          <p className="text-sm font-semibold text-dark">{item.livraisonsTotal}</p>
          {item.livraisonsEnCours > 0 && (
            <p className="text-xs text-info">{item.livraisonsEnCours} en cours</p>
          )}
        </div>
      ),
    },
    {
      name: 'Gains', key: 'earning', render: (item) => (
        <span className="text-sm text-dark">{(item.earning || 0).toLocaleString('fr-FR')} FCFA</span>
      ),
    },
    { name: 'Depuis', key: 'dateInscription', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.dateInscription)}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleToggleStatus(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title={item.statut === 'ACTIVE' ? 'Desactiver' : 'Activer'}>
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

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
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Livreurs</h1>
            <p className="text-sm text-gray-3">{boys.length} livreur(s) enregistre(s)</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Ajouter un livreur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total livreurs', val: boys.length, color: 'text-dark' },
          { label: 'Actifs', val: boys.filter((b) => b.statut === 'ACTIVE').length, color: 'text-success' },
          { label: 'En livraison', val: boys.reduce((a, b) => a + (b.livraisonsEnCours || 0), 0), color: 'text-primary' },
          { label: 'Livraisons totales', val: boys.reduce((a, b) => a + (b.livraisonsTotal || 0), 0), color: 'text-info' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[220px]"
          placeholder="Rechercher un livreur..."
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {boys.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-3">Aucun livreur enregistre</div>
        ) : (
          <DataTable columns={columns} data={boys} pagination={{ page: 1, perPage: 20, total: boys.length }} />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark">
                {editingBoy ? 'Modifier le livreur' : 'Ajouter un livreur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition">
                <X className="w-5 h-5 text-gray-3" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Prenom *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Prenom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Nom *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Nom" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="email@exemple.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Telephone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="6XXXXXXXX" />
              </div>
              {!editingBoy && (
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Mot de passe</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Defaut: delivery123" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-2 hover:text-dark transition">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition disabled:opacity-50">
                {saving ? 'Enregistrement...' : editingBoy ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
