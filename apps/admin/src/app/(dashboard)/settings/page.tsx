'use client';

import { useState, useEffect } from 'react';
import { Settings, Upload, Save, ExternalLink, Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Tab = 'general' | 'paiements' | 'livraison' | 'notifications' | 'ia';

const tabs: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'paiements', label: 'Paiements' },
  { key: 'livraison', label: 'Livraison' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'ia', label: 'Intelligence Artificielle' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saved, setSaved] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // General
  const [nomSite, setNomSite] = useState('EstuaireAchats');
  const [devise, setDevise] = useState('XAF');
  const [langue, setLangue] = useState('fr');

  // Livraison
  const [fraisDefaut, setFraisDefaut] = useState(1500);
  const [seuilGratuit, setSeuilGratuit] = useState(50000);

  // Notifications
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@estuaireachats.cm');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [smsApiKey, setSmsApiKey] = useState('');

  useEffect(() => {
    api.get<{ data: { general?: { nomSite?: string; devise?: string; langue?: string }; livraison?: { fraisDefaut?: number; seuilGratuit?: number }; notifications?: { smtpHost?: string; smtpPort?: string; smtpUser?: string; smtpPassword?: string; smsProvider?: string; smsApiKey?: string } } }>('/settings/admin/admin_general_settings')
      .then(res => {
        if (res.data?.general) {
          if (res.data.general.nomSite) setNomSite(res.data.general.nomSite);
          if (res.data.general.devise) setDevise(res.data.general.devise);
          if (res.data.general.langue) setLangue(res.data.general.langue);
        }
        if (res.data?.livraison) {
          if (res.data.livraison.fraisDefaut !== undefined) setFraisDefaut(res.data.livraison.fraisDefaut);
          if (res.data.livraison.seuilGratuit !== undefined) setSeuilGratuit(res.data.livraison.seuilGratuit);
        }
        if (res.data?.notifications) {
          if (res.data.notifications.smtpHost) setSmtpHost(res.data.notifications.smtpHost);
          if (res.data.notifications.smtpPort) setSmtpPort(res.data.notifications.smtpPort);
          if (res.data.notifications.smtpUser) setSmtpUser(res.data.notifications.smtpUser);
          if (res.data.notifications.smtpPassword) setSmtpPassword(res.data.notifications.smtpPassword);
          if (res.data.notifications.smsProvider) setSmsProvider(res.data.notifications.smsProvider);
          if (res.data.notifications.smsApiKey) setSmsApiKey(res.data.notifications.smsApiKey);
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  // IA
  const [anthropicKey, setAnthropicKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showUnsplashKey, setShowUnsplashKey] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ hasKey: boolean; maskedKey: string; hasUnsplashKey?: boolean; maskedUnsplashKey?: string } | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (activeTab === 'ia') {
      api.get<{ data: { hasAnthropicKey: boolean; anthropicKey: string; hasUnsplashKey: boolean; unsplashKey: string } }>('/settings/ai')
        .then(res => {
          setAiStatus({
            hasKey: res.data.hasAnthropicKey,
            maskedKey: res.data.anthropicKey,
            hasUnsplashKey: res.data.hasUnsplashKey,
            maskedUnsplashKey: res.data.unsplashKey,
          });
        })
        .catch(() => setAiStatus(null));
    }
  }, [activeTab]);

  const saveAiConfig = async () => {
    if (!anthropicKey.trim() && !unsplashKey.trim()) return;
    setAiSaving(true);
    setAiError('');
    try {
      const body: Record<string, string> = {};
      if (anthropicKey.trim()) body.anthropicKey = anthropicKey;
      if (unsplashKey.trim()) body.unsplashKey = unsplashKey;

      const res = await api.patch<{ data: { hasAnthropicKey: boolean; anthropicKey: string; hasUnsplashKey: boolean; unsplashKey: string } }>('/settings/ai', body);
      setAnthropicKey('');
      setUnsplashKey('');
      setSaved('ia');
      setTimeout(() => setSaved(null), 3000);
      setAiStatus({
        hasKey: res.data.hasAnthropicKey,
        maskedKey: res.data.anthropicKey,
        hasUnsplashKey: res.data.hasUnsplashKey,
        maskedUnsplashKey: res.data.unsplashKey,
      });
    } catch {
      setAiError('Erreur lors de la sauvegarde. Verifiez votre connexion.');
    }
    setAiSaving(false);
  };

  const handleSave = async (section: string) => {
    const payload: Record<string, unknown> = {};
    if (section === 'general') payload.general = { nomSite, devise, langue };
    if (section === 'livraison') payload.livraison = { fraisDefaut, seuilGratuit };
    if (section === 'notifications') payload.notifications = { smtpHost, smtpPort, smtpUser, smtpPassword, smsProvider, smsApiKey };
    try {
      await api.put('/settings/admin/admin_general_settings', { value: payload });
    } catch {}
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Parametres generaux</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-medium transition border-b-2 ${
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-3 hover:text-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Nom du site</label>
                <input type="text" value={nomSite} onChange={(e) => setNomSite(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Logo</label>
                <div className="border-2 border-dashed border-gray-5 rounded-lg p-6 text-center hover:border-primary/50 transition cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-3 mx-auto mb-2" />
                  <p className="text-sm text-gray-3">Cliquez pour uploader le logo</p>
                  <p className="text-xs text-gray-4 mt-1">PNG, JPG, SVG - max 2MB</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Favicon</label>
                <div className="border-2 border-dashed border-gray-5 rounded-lg p-6 text-center hover:border-primary/50 transition cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-3 mx-auto mb-2" />
                  <p className="text-sm text-gray-3">Cliquez pour uploader le favicon</p>
                  <p className="text-xs text-gray-4 mt-1">ICO, PNG - 32x32 ou 64x64</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Devise par defaut</label>
                  <select value={devise} onChange={(e) => setDevise(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="XAF">FCFA (XAF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-2 mb-1">Langue par defaut</label>
                  <select value={langue} onChange={(e) => setLangue(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <button onClick={() => handleSave('general')} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                <Save className="w-4 h-4" />
                {saved === 'general' ? 'Enregistre !' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* Paiements Tab */}
          {activeTab === 'paiements' && (
            <div className="max-w-xl">
              <p className="text-sm text-gray-3 mb-4">Configurez les methodes de paiement acceptees sur la plateforme.</p>
              <Link href="/payments/config" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                <ExternalLink className="w-4 h-4" />
                Acceder a la configuration des paiements
              </Link>
            </div>
          )}

          {/* Livraison Tab */}
          {activeTab === 'livraison' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Frais de livraison par defaut (FCFA)</label>
                <input type="number" min={0} value={fraisDefaut} onChange={(e) => setFraisDefaut(Number(e.target.value))} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Livraison gratuite a partir de (FCFA)</label>
                <input type="number" min={0} value={seuilGratuit} onChange={(e) => setSeuilGratuit(Number(e.target.value))} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                <p className="text-xs text-gray-3 mt-1">Mettre 0 pour desactiver la livraison gratuite.</p>
              </div>
              <button onClick={() => handleSave('livraison')} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                <Save className="w-4 h-4" />
                {saved === 'livraison' ? 'Enregistre !' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h3 className="text-base font-bold text-dark mb-3">Configuration SMTP (Email)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-2 mb-1">Host</label>
                      <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-2 mb-1">Port</label>
                      <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-2 mb-1">Utilisateur</label>
                    <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-2 mb-1">Mot de passe</label>
                    <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="••••••••" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-dark mb-3">Configuration SMS</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-2 mb-1">Fournisseur</label>
                    <select value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Nexmo</option>
                      <option value="africastalking">Africa&apos;s Talking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-2 mb-1">API Key</label>
                    <input type="password" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="••••••••" />
                  </div>
                </div>
              </div>
              <button onClick={() => handleSave('notifications')} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                <Save className="w-4 h-4" />
                {saved === 'notifications' ? 'Enregistre !' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* IA Tab */}
          {activeTab === 'ia' && (
            <div className="space-y-6 max-w-xl">
              {/* Header */}
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Sparkles className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-dark">Mode IA — EstuaireAchats</h3>
                  <p className="text-xs text-gray-2 mt-1">
                    L&apos;IA utilise Claude (Anthropic) pour le chat sourcing, l&apos;analyse de produits par image,
                    et le remplissage automatique des fiches produits. Unsplash est utilise pour suggerer des images similaires.
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-2">Statut</label>
                <div className="space-y-2">
                  {aiStatus ? (
                    <>
                      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                        aiStatus.hasKey ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        {aiStatus.hasKey ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${aiStatus.hasKey ? 'text-green-800' : 'text-yellow-800'}`}>
                            Claude API {aiStatus.hasKey ? 'active' : 'non configuree'}
                          </p>
                          {aiStatus.hasKey && <p className="text-xs text-green-600 mt-0.5">Cle : {aiStatus.maskedKey}</p>}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          aiStatus.hasKey ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {aiStatus.hasKey ? 'Chat IA + Analyse produits' : 'Requis'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                        aiStatus.hasUnsplashKey ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        {aiStatus.hasUnsplashKey ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${aiStatus.hasUnsplashKey ? 'text-green-800' : 'text-gray-500'}`}>
                            Unsplash API {aiStatus.hasUnsplashKey ? 'active' : 'non configuree'}
                          </p>
                          {aiStatus.hasUnsplashKey && <p className="text-xs text-green-600 mt-0.5">Cle : {aiStatus.maskedUnsplashKey}</p>}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          aiStatus.hasUnsplashKey ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {aiStatus.hasUnsplashKey ? 'Images similaires' : 'Optionnel'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-3">Chargement du statut...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Anthropic API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">
                  Cle API Anthropic (Claude)
                </label>
                <p className="text-xs text-gray-3 mb-2">
                  Obtenez votre cle sur{' '}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    console.anthropic.com
                  </a>
                  {' '} — Utilisee pour le chat IA et l&apos;analyse de produits par image.
                </p>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-3 hover:text-dark transition"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Unsplash API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">
                  Cle API Unsplash (optionnel)
                </label>
                <p className="text-xs text-gray-3 mb-2">
                  Obtenez votre cle sur{' '}
                  <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    unsplash.com/developers
                  </a>
                  {' '} — Utilisee pour suggerer des images similaires lors de la creation de produits.
                </p>
                <div className="relative">
                  <input
                    type={showUnsplashKey ? 'text' : 'password'}
                    value={unsplashKey}
                    onChange={(e) => setUnsplashKey(e.target.value)}
                    placeholder="Votre Access Key Unsplash..."
                    className="w-full border border-gray-5 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnsplashKey(!showUnsplashKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-3 hover:text-dark transition"
                  >
                    {showUnsplashKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model info */}
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-1">Modele utilise</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-dark">Claude Sonnet 4</span>
                  <span className="text-xs text-gray-3 bg-gray-200 px-2 py-0.5 rounded-full">claude-sonnet-4-20250514</span>
                </div>
                <p className="text-xs text-gray-3 mt-1">Utilise pour : chat sourcing (FR/EN), analyse d&apos;images produits, remplissage automatique des fiches.</p>
              </div>

              {/* Fonctionnalites */}
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-2">Fonctionnalites IA</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Chat sourcing acheteurs', needs: 'Claude', active: aiStatus?.hasKey },
                    { label: 'Analyse image produit', needs: 'Claude', active: aiStatus?.hasKey },
                    { label: 'Auto-remplissage fiches', needs: 'Claude', active: aiStatus?.hasKey },
                    { label: 'Images similaires', needs: 'Unsplash', active: aiStatus?.hasUnsplashKey },
                  ].map((f) => (
                    <div key={f.label} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                      f.active ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {f.active ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span className="font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {aiError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{aiError}</p>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={saveAiConfig}
                disabled={(!anthropicKey.trim() && !unsplashKey.trim()) || aiSaving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  (anthropicKey.trim() || unsplashKey.trim()) && !aiSaving
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {aiSaving ? 'Enregistrement...' : saved === 'ia' ? 'Configuration sauvegardee !' : 'Sauvegarder la configuration IA'}
              </button>

              {saved === 'ia' && (
                <p className="text-xs text-green-600 bg-green-50 p-3 rounded-lg">
                  Configuration IA sauvegardee avec succes.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
