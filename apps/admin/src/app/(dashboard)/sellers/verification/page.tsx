'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Save, GripVertical, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Document {
  id: number;
  nom: string;
  description: string;
  obligatoire: boolean;
  typesFichiers: string;
  tailleMax: number;
}

interface VerificationSettings {
  documents: Document[];
  autoApprove: boolean;
  minDocs: number;
  reviewDelay: number;
  message: string;
}

const DEFAULT_SETTINGS: VerificationSettings = {
  documents: [
    { id: 1, nom: 'Piece d\'identite nationale', description: 'CNI, Passeport ou carte consulaire en cours de validite', obligatoire: true, typesFichiers: 'JPG, PNG, PDF', tailleMax: 5 },
    { id: 2, nom: 'Registre de commerce', description: 'Document officiel d\'enregistrement de l\'entreprise', obligatoire: true, typesFichiers: 'PDF', tailleMax: 10 },
    { id: 3, nom: 'Justificatif de domicile', description: 'Facture d\'electricite, d\'eau ou quittance de loyer de moins de 3 mois', obligatoire: true, typesFichiers: 'JPG, PNG, PDF', tailleMax: 5 },
    { id: 4, nom: 'Numero contribuable', description: 'Attestation de localisation ou de contribution fiscale', obligatoire: false, typesFichiers: 'PDF', tailleMax: 5 },
    { id: 5, nom: 'Releve bancaire', description: 'Releve bancaire des 3 derniers mois', obligatoire: false, typesFichiers: 'PDF', tailleMax: 10 },
    { id: 6, nom: 'Photo de la boutique physique', description: 'Photo de la devanture ou du local commercial si applicable', obligatoire: false, typesFichiers: 'JPG, PNG', tailleMax: 8 },
  ],
  autoApprove: false,
  minDocs: 3,
  reviewDelay: 48,
  message: 'Bienvenue sur EstuaireAchats ! Pour completer votre inscription en tant que vendeur, veuillez soumettre les documents suivants. Assurez-vous que les documents sont lisibles et en cours de validite. Notre equipe examinera votre dossier dans un delai de 48 heures.',
};

export default function SellerVerificationPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [minDocs, setMinDocs] = useState(3);
  const [reviewDelay, setReviewDelay] = useState(48);
  const [message, setMessage] = useState('');
  const [newDoc, setNewDoc] = useState({ nom: '', description: '', obligatoire: true, typesFichiers: 'PDF', tailleMax: 5 });
  const [showAddForm, setShowAddForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ value: VerificationSettings }>('/settings/admin/admin_seller_verification');
      if (res.value && res.value.documents) {
        setDocuments(res.value.documents);
        setAutoApprove(res.value.autoApprove);
        setMinDocs(res.value.minDocs);
        setReviewDelay(res.value.reviewDelay);
        setMessage(res.value.message);
      } else {
        setDocuments(DEFAULT_SETTINGS.documents);
        setAutoApprove(DEFAULT_SETTINGS.autoApprove);
        setMinDocs(DEFAULT_SETTINGS.minDocs);
        setReviewDelay(DEFAULT_SETTINGS.reviewDelay);
        setMessage(DEFAULT_SETTINGS.message);
      }
    } catch {
      setDocuments(DEFAULT_SETTINGS.documents);
      setAutoApprove(DEFAULT_SETTINGS.autoApprove);
      setMinDocs(DEFAULT_SETTINGS.minDocs);
      setReviewDelay(DEFAULT_SETTINGS.reviewDelay);
      setMessage(DEFAULT_SETTINGS.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    try {
      await api.put('/settings/admin/admin_seller_verification', {
        value: { documents, autoApprove, minDocs, reviewDelay, message },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const toggleObligatoire = (id: number) => {
    setDocuments(documents.map((d) => d.id === id ? { ...d, obligatoire: !d.obligatoire } : d));
  };

  const handleDelete = (id: number) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const handleAddDoc = () => {
    if (!newDoc.nom.trim()) return;
    setDocuments([...documents, { ...newDoc, id: Date.now() }]);
    setNewDoc({ nom: '', description: '', obligatoire: true, typesFichiers: 'PDF', tailleMax: 5 });
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <span className="text-sm font-medium">Configuration enregistree avec succes</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Verification des Vendeurs</h1>
          <p className="text-sm text-gray-3">Configurez les documents requis pour l'inscription des vendeurs</p>
        </div>
      </div>

      {/* Parametres generaux */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-4">Parametres generaux</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Nombre minimum de documents</label>
            <input
              type="number"
              min={1}
              value={minDocs}
              onChange={(e) => setMinDocs(Number(e.target.value))}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Delai de verification (heures)</label>
            <input
              type="number"
              min={1}
              value={reviewDelay}
              onChange={(e) => setReviewDelay(Number(e.target.value))}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <div>
              <label htmlFor="autoApprove" className="text-sm font-medium text-dark cursor-pointer">Approbation automatique</label>
              <p className="text-xs text-gray-3">Approuver sans verification manuelle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents requis */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-dark">Documents requis</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary/20 transition"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-6/50 rounded-xl border border-gray-5 space-y-3">
            <h3 className="text-sm font-semibold text-dark">Nouveau document</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Nom du document</label>
                <input
                  value={newDoc.nom}
                  onChange={(e) => setNewDoc({ ...newDoc, nom: e.target.value })}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Ex: Carte professionnelle"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Types de fichiers acceptes</label>
                <input
                  value={newDoc.typesFichiers}
                  onChange={(e) => setNewDoc({ ...newDoc, typesFichiers: e.target.value })}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="PDF, JPG, PNG"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-2 mb-1">Description</label>
              <input
                value={newDoc.description}
                onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Instructions pour le vendeur..."
              />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Taille max (Mo)</label>
                <input
                  type="number"
                  min={1}
                  value={newDoc.tailleMax}
                  onChange={(e) => setNewDoc({ ...newDoc, tailleMax: Number(e.target.value) })}
                  className="w-24 border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={newDoc.obligatoire}
                  onChange={(e) => setNewDoc({ ...newDoc, obligatoire: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-sm text-dark">Document obligatoire</span>
              </label>
              <button onClick={handleAddDoc} className="mt-4 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                Ajouter
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-4 bg-gray-6/30 rounded-xl border border-gray-5/50">
              <div className="pt-0.5 text-gray-4 cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-dark">{doc.nom}</span>
                  {doc.obligatoire ? (
                    <span className="px-1.5 py-0.5 bg-danger-soft text-danger text-[10px] font-medium rounded">Obligatoire</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-gray-5 text-gray-2 text-[10px] font-medium rounded">Optionnel</span>
                  )}
                </div>
                <p className="text-xs text-gray-3">{doc.description}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-[10px] text-gray-3">Formats: <span className="font-medium text-gray-2">{doc.typesFichiers}</span></span>
                  <span className="text-[10px] text-gray-3">Max: <span className="font-medium text-gray-2">{doc.tailleMax} Mo</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleObligatoire(doc.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${doc.obligatoire ? 'bg-warning-soft text-warning hover:bg-warning/20' : 'bg-success-soft text-success hover:bg-success/20'}`}
                >
                  {doc.obligatoire ? 'Rendre optionnel' : 'Rendre obligatoire'}
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message d'accueil */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-dark mb-3">Message d'instructions pour les vendeurs</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Save className="w-4 h-4" /> Enregistrer la configuration
        </button>
      </div>
    </div>
  );
}
