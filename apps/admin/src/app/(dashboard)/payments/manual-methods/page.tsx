'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Pencil, Trash2, Save, X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ManualMethod {
  id: number;
  nom: string;
  description: string;
  instructions: string;
  actif: boolean;
  logo: string;
}

const initialMethods: ManualMethod[] = [
  { id: 1, nom: 'Virement bancaire', description: 'Paiement par virement bancaire', instructions: 'Effectuez un virement vers le compte SCB Cameroun IBAN CM21 0001 0000 1234 5678 9012. Mentionnez votre numero de commande en reference.', actif: true, logo: '🏦' },
  { id: 2, nom: 'Paiement en especes', description: 'Paiement a nos bureaux', instructions: 'Rendez-vous dans nos bureaux au 123 Avenue Kennedy, Douala, du lundi au vendredi de 8h a 17h avec votre numero de commande.', actif: true, logo: '💵' },
  { id: 3, nom: 'Cheque', description: 'Paiement par cheque', instructions: 'Etablissez votre cheque a l\'ordre de "EstuaireAchats SARL" et envoyez-le a notre adresse. Votre commande sera traitee apres encaissement.', actif: false, logo: '📄' },
  { id: 4, nom: 'Western Union', description: 'Transfert international', instructions: 'Effectuez un transfert Western Union au nom de Jean Pierre Mbarga, Douala, Cameroun. Envoyez-nous le MTCN apres le transfert.', actif: true, logo: '🌍' },
];

interface ModalData extends Omit<ManualMethod, 'id'> {
  id?: number;
}

export default function ManualMethodsPage() {
  const [methods, setMethods] = useState<ManualMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ModalData | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_payment_manual_methods')
      .then((res) => { if (res.data && Array.isArray(res.data)) setMethods(res.data); else setMethods(initialMethods); })
      .catch(() => { setMethods(initialMethods); })
      .finally(() => setLoading(false));
  }, []);

  const saveMethods = async (data: ManualMethod[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_payment_manual_methods', { value: data });
    } catch {}
    setSaving(false);
  };

  const openCreate = () => {
    setEditingMethod({ nom: '', description: '', instructions: '', actif: true, logo: '💳' });
    setShowModal(true);
  };

  const openEdit = (method: ManualMethod) => {
    setEditingMethod({ ...method });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingMethod?.nom.trim()) return;
    let updated: ManualMethod[];
    if (editingMethod.id) {
      updated = methods.map((m) => m.id === editingMethod.id ? { ...editingMethod, id: editingMethod.id } as ManualMethod : m);
    } else {
      updated = [...methods, { ...editingMethod, id: Date.now() } as ManualMethod];
    }
    setMethods(updated);
    saveMethods(updated);
    setShowModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cette methode ?')) return;
    const updated = methods.filter((m) => m.id !== id);
    setMethods(updated);
    saveMethods(updated);
  };

  const toggleActive = (id: number) => {
    const updated = methods.map((m) => m.id === id ? { ...m, actif: !m.actif } : m);
    setMethods(updated);
    saveMethods(updated);
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Methode enregistree !</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Methodes de paiement manuelles</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Ajouter une methode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {methods.map((method) => (
          <div key={method.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${method.actif ? 'border-green-400' : 'border-gray-4'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.logo}</span>
                <div>
                  <h3 className="text-base font-bold text-dark">{method.nom}</h3>
                  <p className="text-sm text-gray-3">{method.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(method.id)}
                  className={`relative w-10 h-5 rounded-full transition ${method.actif ? 'bg-primary' : 'bg-gray-4'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${method.actif ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="bg-gray-6/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-2 leading-relaxed">{method.instructions}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(method)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-2 border border-gray-5 rounded-lg hover:bg-gray-6 transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
              <button
                onClick={() => handleDelete(method.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-danger border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${method.actif ? 'bg-green-100 text-green-700' : 'bg-gray-5 text-gray-3'}`}>
                {method.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && editingMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-dark">
                {editingMethod.id ? 'Modifier la methode' : 'Nouvelle methode de paiement'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Emoji</label>
                  <input
                    type="text"
                    value={editingMethod.logo}
                    onChange={(e) => setEditingMethod({ ...editingMethod, logo: e.target.value })}
                    className={inputClass}
                    maxLength={4}
                  />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Nom de la methode *</label>
                  <input
                    type="text"
                    value={editingMethod.nom}
                    onChange={(e) => setEditingMethod({ ...editingMethod, nom: e.target.value })}
                    placeholder="Ex: Virement bancaire"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description courte</label>
                <input
                  type="text"
                  value={editingMethod.description}
                  onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  placeholder="Description affichee au client"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instructions de paiement</label>
                <textarea
                  value={editingMethod.instructions}
                  onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  rows={4}
                  placeholder="Instructions detaillees pour le client..."
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setEditingMethod({ ...editingMethod, actif: !editingMethod.actif })}
                  className={`relative w-11 h-6 rounded-full transition ${editingMethod.actif ? 'bg-primary' : 'bg-gray-4'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editingMethod.actif ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-medium text-gray-2">Methode active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-5 text-gray-2 rounded-lg text-sm hover:bg-gray-6 transition">
                Annuler
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
