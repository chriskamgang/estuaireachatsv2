'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  isDefault: boolean;
}

const emptyForm = { name: '', phone: '', address: '', city: '', country: 'Cameroun' };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Address[] }>('/addresses')
      .then((res) => setAddresses(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setFormData({ name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, country: addr.country });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.patch<{ data: Address }>(`/addresses/${editingId}`, formData);
        if (res.data) {
          setAddresses((prev) => prev.map((a) => (a.id === editingId ? res.data : a)));
        }
      } else {
        const res = await api.post<{ data: Address }>('/addresses', {
          ...formData,
          isDefault: addresses.length === 0,
        });
        if (res.data) {
          setAddresses((prev) => [...prev, res.data]);
        }
      }
      setShowForm(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}`, { isDefault: true });
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-dark">Mes adresses</h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light"
          >
            <Plus size={16} />
            Ajouter une adresse
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <MapPin size={48} className="mb-4 text-gray-4" />
            <p className="text-lg font-medium text-gray-2">Aucune adresse enregistree</p>
            <p className="mt-1 text-sm text-gray-3">Ajoutez une adresse de livraison</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="relative rounded-lg border border-gray-5 p-5 transition-shadow hover:shadow-md"
              >
                {addr.isDefault && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[11px] font-semibold text-green">
                    <Check size={12} />
                    Par defaut
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-orange" />
                  <h3 className="font-semibold text-dark">{addr.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-gray-2">
                  <p>{addr.phone}</p>
                  <p>{addr.address}</p>
                  <p>{addr.city}, {addr.country}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(addr)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-5 px-3 py-1.5 text-xs font-medium text-gray-2 transition-colors hover:border-orange hover:text-orange"
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                  {!addr.isDefault && (
                    <>
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-5 px-3 py-1.5 text-xs font-medium text-gray-2 transition-colors hover:border-green hover:text-green"
                      >
                        <Check size={12} />
                        Par defaut
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-5 px-3 py-1.5 text-xs font-medium text-gray-2 transition-colors hover:border-primary hover:text-primary"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark">
                {editingId ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-3 transition-colors hover:bg-gray-6 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
                  placeholder="Nom et prenom"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-1">Telephone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
                  placeholder="Rue, quartier..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
                    placeholder="Douala"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-1">Pays</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-lg border border-gray-5 px-4 py-2.5 text-sm text-dark outline-none focus:border-orange"
                    placeholder="Cameroun"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-5 py-2.5 text-sm font-medium text-gray-2 transition-colors hover:bg-gray-6"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-orange py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
