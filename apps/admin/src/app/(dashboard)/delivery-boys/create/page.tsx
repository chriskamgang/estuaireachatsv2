'use client';

import { useState } from 'react';
import { UserPlus, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const ZONES = [
  'Douala Akwa', 'Douala Bonaberi', 'Douala Deido', 'Douala Akwa Nord', 'Douala New Bell',
  'Yaounde Centre', 'Yaounde Bastos', 'Yaounde Biyem-Assi', 'Yaounde Mfoundi',
  'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Bertoua', 'Ebolowa', 'Limbe', 'Kribi',
];

const VEHICULES = ['Moto', 'Voiture', 'Velo', 'A pied'];

interface FormData {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  zone: string;
  vehicule: string;
  numeroPiece: string;
  numeroPlaqueVehicule: string;
  dateNaissance: string;
  adresse: string;
  motDePasse: string;
  confirmerMotDePasse: string;
  urgenceNom: string;
  urgenceTel: string;
}

const EMPTY_FORM: FormData = {
  prenom: '', nom: '', email: '', telephone: '', zone: '', vehicule: 'Moto',
  numeroPiece: '', numeroPlaqueVehicule: '', dateNaissance: '', adresse: '',
  motDePasse: '', confirmerMotDePasse: '',
  urgenceNom: '', urgenceTel: '',
};

export default function CreateDeliveryBoyPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (k: keyof FormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.prenom) newErrors.prenom = 'Requis';
    if (!form.nom) newErrors.nom = 'Requis';
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Email invalide';
    if (!form.telephone || form.telephone.length < 9) newErrors.telephone = 'Telephone invalide';
    if (!form.zone) newErrors.zone = 'Selectionnez une zone';
    if (!form.motDePasse || form.motDePasse.length < 6) newErrors.motDePasse = 'Minimum 6 caracteres';
    if (form.motDePasse !== form.confirmerMotDePasse) newErrors.confirmerMotDePasse = 'Mots de passe differents';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await api.put('/settings/admin/admin_delivery_boys', { value: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm(EMPTY_FORM);
    } catch {}
  };

  const Field = ({ label, k, type = 'text', placeholder = '' }: { label: string; k: keyof FormData; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-2 mb-1">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors[k] ? 'border-danger' : 'border-gray-5'}`}
      />
      {errors[k] && <p className="text-xs text-danger mt-0.5">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
          <span className="text-sm font-medium">Livreur cree avec succes !</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/delivery-boys" className="p-2 rounded-lg hover:bg-gray-6 text-gray-3 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Ajouter un Livreur</h1>
            <p className="text-sm text-gray-3">Remplissez les informations du nouveau livreur</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prenom *" k="prenom" placeholder="ex: Rodrigue" />
              <Field label="Nom *" k="nom" placeholder="ex: Nkoa" />
              <Field label="Email *" k="email" type="email" placeholder="email@exemple.com" />
              <Field label="Telephone *" k="telephone" placeholder="677 11 22 33" />
              <Field label="Date de naissance" k="dateNaissance" type="date" />
              <Field label="Numero piece d'identite" k="numeroPiece" placeholder="CNI ou Passeport" />
            </div>
            <div className="mt-4">
              <Field label="Adresse complete" k="adresse" placeholder="Quartier, rue, ville" />
            </div>
          </div>

          {/* Infos vehicule et zone */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Zone et vehicule</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Zone de livraison *</label>
                <select
                  value={form.zone}
                  onChange={(e) => set('zone', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.zone ? 'border-danger' : 'border-gray-5'}`}
                >
                  <option value="">Selectionner une zone</option>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                {errors.zone && <p className="text-xs text-danger mt-0.5">{errors.zone}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Type de vehicule</label>
                <select
                  value={form.vehicule}
                  onChange={(e) => set('vehicule', e.target.value)}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {VEHICULES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <Field label="Numero de plaque" k="numeroPlaqueVehicule" placeholder="ex: LT 1234 A" />
            </div>
          </div>

          {/* Contact urgence */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Contact d'urgence</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom et prenom" k="urgenceNom" placeholder="Contact en cas d'urgence" />
              <Field label="Telephone" k="urgenceTel" placeholder="677 00 00 00" />
            </div>
          </div>
        </div>

        {/* Compte et identifiants */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Acces au compte</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.motDePasse}
                    onChange={(e) => set('motDePasse', e.target.value)}
                    placeholder="Min. 6 caracteres"
                    className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.motDePasse ? 'border-danger' : 'border-gray-5'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-3"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.motDePasse && <p className="text-xs text-danger mt-0.5">{errors.motDePasse}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Confirmer mot de passe *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmerMotDePasse}
                  onChange={(e) => set('confirmerMotDePasse', e.target.value)}
                  placeholder="Repetez le mot de passe"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.confirmerMotDePasse ? 'border-danger' : 'border-gray-5'}`}
                />
                {errors.confirmerMotDePasse && <p className="text-xs text-danger mt-0.5">{errors.confirmerMotDePasse}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-dark mb-4">Parametres</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" />
                <span className="text-sm text-dark">Compte actif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" />
                <span className="text-sm text-dark">Notifications SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" />
                <span className="text-sm text-dark">Notifications email</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Save className="w-4 h-4" /> Enregistrer le livreur
          </button>

          <Link
            href="/delivery-boys"
            className="block w-full text-center py-2.5 border border-gray-5 text-sm font-medium text-gray-2 rounded-lg hover:bg-gray-6 transition"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
