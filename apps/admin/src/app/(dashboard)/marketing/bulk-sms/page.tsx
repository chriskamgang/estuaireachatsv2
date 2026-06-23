'use client';

import { useState, useEffect, useMemo } from 'react';
import { Smartphone, Send, Users, CheckCircle, Loader2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const TEMPLATES = [
  { id: 1, nom: 'Promotion Flash', texte: 'EstuaireAchats : Flash sale 48h ! Jusqu\'a -40% sur toute la boutique electronique. Profitez maintenant : estuaireachats.cm/promo' },
  { id: 2, nom: 'Rappel panier', texte: 'Bonjour, vous avez des articles dans votre panier ! Completez votre commande avant rupture de stock : estuaireachats.cm/panier' },
  { id: 3, nom: 'Nouveau produit', texte: 'Nouveau produit disponible sur EstuaireAchats ! Decouvrez notre nouvelle collection et profitez de la livraison gratuite pendant 24h.' },
  { id: 4, nom: 'Confirmation commande', texte: 'Votre commande a ete confirmee et est en cours de traitement. Suivez votre livraison sur : estuaireachats.cm/mes-commandes' },
];

const MAX_CHARS = 160;

type RecipientSource = 'manual' | 'users' | 'subscribers';

interface SendResult {
  success: number;
  failed: number;
  errors: string[];
  total: number;
}

export default function BulkSmsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [senderId, setSenderId] = useState('EstuaireAchats');
  const [planifie, setPlanifie] = useState(false);
  const [dateEnvoi, setDateEnvoi] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // SMS balance
  const [balance, setBalance] = useState<number | string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Recipient source
  const [recipientSource, setRecipientSource] = useState<RecipientSource>('manual');
  const [manualNumbers, setManualNumbers] = useState('');
  const [usersPhones, setUsersPhones] = useState<string[]>([]);
  const [subscribersInfo, setSubscribersInfo] = useState<string[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Load balance on mount
  useEffect(() => {
    Promise.all([
      loadBalance(),
      api.get<{ data: unknown }>('/settings/admin/admin_bulk_sms_config').catch(() => {}),
    ]).finally(() => setPageLoading(false));
  }, []);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await api.get<{ data: any }>('/sms/balance');
      setBalance(res.data?.balance ?? res.data ?? '—');
    } catch {
      setBalance('Erreur');
    }
    setBalanceLoading(false);
  };

  const loadUsersPhones = async () => {
    setLoadingRecipients(true);
    try {
      const res = await api.get<{ data: any }>('/users?perPage=1000');
      const users = res.data?.data || res.data || [];
      const phones: string[] = users
        .map((u: any) => u.phone || u.mobile || u.telephone || '')
        .filter((p: string) => p.trim().length > 0);
      setUsersPhones(phones);
    } catch {
      setUsersPhones([]);
    }
    setLoadingRecipients(false);
  };

  const loadSubscribers = async () => {
    setLoadingRecipients(true);
    try {
      const res = await api.get<{ data: any }>('/subscribers?perPage=1000');
      const subs = res.data?.data || res.data || [];
      const emails: string[] = subs
        .map((s: any) => s.email || '')
        .filter((e: string) => e.trim().length > 0);
      setSubscribersInfo(emails);
    } catch {
      setSubscribersInfo([]);
    }
    setLoadingRecipients(false);
  };

  // Parse manual numbers
  const parsedManualNumbers = useMemo(() => {
    if (!manualNumbers.trim()) return [];
    return manualNumbers
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  }, [manualNumbers]);

  // Get recipients list based on source
  const recipients = useMemo(() => {
    switch (recipientSource) {
      case 'manual':
        return parsedManualNumbers;
      case 'users':
        return usersPhones;
      case 'subscribers':
        return subscribersInfo; // emails for info display
      default:
        return [];
    }
  }, [recipientSource, parsedManualNumbers, usersPhones, subscribersInfo]);

  const targetCount = recipientSource === 'manual' ? parsedManualNumbers.length : recipientSource === 'users' ? usersPhones.length : 0;
  const nbSms = Math.ceil(message.length / MAX_CHARS) || 1;
  const charsLeft = MAX_CHARS - (message.length % MAX_CHARS || MAX_CHARS);
  const coutEstime = targetCount * nbSms * 15; // 15 FCFA par SMS

  const handleTemplate = (id: number) => {
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (tmpl) { setMessage(tmpl.texte); setSelectedTemplate(id); }
  };

  const handleSourceChange = (source: RecipientSource) => {
    setRecipientSource(source);
    if (source === 'users' && usersPhones.length === 0) {
      loadUsersPhones();
    }
    if (source === 'subscribers' && subscribersInfo.length === 0) {
      loadSubscribers();
    }
  };

  const handleSend = async () => {
    if (!message.trim() || targetCount === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const mobiles = recipientSource === 'manual' ? parsedManualNumbers : usersPhones;
      const res = await api.post<{ data: any }>('/sms/send', {
        mobiles,
        message,
        senderid: senderId,
      });

      const result: SendResult = {
        success: res.data?.success ?? targetCount,
        failed: res.data?.failed ?? 0,
        errors: res.data?.errors ?? [],
        total: targetCount,
      };
      setSendResult(result);

      // Save to history
      try {
        const historyEntry = {
          date: new Date().toISOString(),
          recipientCount: targetCount,
          message: message.substring(0, 100),
          senderId,
          source: recipientSource,
          result,
        };
        const existingHistory = await api.get<{ data: any }>('/settings/admin/admin_bulk_sms_history').catch(() => ({ data: [] }));
        const history = Array.isArray(existingHistory.data) ? existingHistory.data : [];
        history.unshift(historyEntry);
        await api.put('/settings/admin/admin_bulk_sms_history', { value: history.slice(0, 50) });
      } catch {}

      // Refresh balance
      loadBalance();
    } catch (err: any) {
      setSendResult({
        success: 0,
        failed: targetCount,
        errors: [err?.response?.data?.message || 'Erreur lors de l\'envoi des SMS'],
        total: targetCount,
      });
    }
    setSending(false);
  };

  const handleReset = () => {
    setSendResult(null);
    setMessage('');
    setManualNumbers('');
    setRecipientSource('manual');
    setSelectedTemplate(null);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">SMS en Masse</h1>
            <p className="text-sm text-gray-3">Envoyez des messages SMS groupes via Nexah SMS</p>
          </div>
        </div>

        {/* Balance display */}
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-5">
          <div className="text-right">
            <p className="text-xs text-gray-3">Solde SMS Nexah</p>
            <p className="text-lg font-bold text-primary">
              {balanceLoading ? (
                <span className="flex items-center gap-1 text-gray-3 text-sm"><Loader2 className="w-3 h-3 animate-spin" /> ...</span>
              ) : (
                <>{balance !== null ? balance : '—'} credits</>
              )}
            </p>
          </div>
          <button
            onClick={loadBalance}
            disabled={balanceLoading}
            className="p-1.5 rounded-lg hover:bg-gray-6 transition text-gray-3 hover:text-primary disabled:opacity-50"
            title="Rafraichir"
          >
            <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {sendResult ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${sendResult.failed === 0 ? 'bg-success-soft' : sendResult.success === 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
            {sendResult.failed === 0 ? (
              <CheckCircle className="w-8 h-8 text-success" />
            ) : sendResult.success === 0 ? (
              <XCircle className="w-8 h-8 text-red-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">
            {sendResult.failed === 0 ? 'SMS envoyes avec succes !' : sendResult.success === 0 ? 'Echec de l\'envoi' : 'Envoi partiellement reussi'}
          </h2>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{sendResult.success}</p>
              <p className="text-xs text-gray-3">Reussis</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{sendResult.failed}</p>
              <p className="text-xs text-gray-3">Echoues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-dark">{sendResult.total}</p>
              <p className="text-xs text-gray-3">Total</p>
            </div>
          </div>
          {sendResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left max-w-md mx-auto">
              <p className="text-xs font-semibold text-red-700 mb-1">Erreurs :</p>
              {sendResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">- {err}</p>
              ))}
            </div>
          )}
          <p className="text-gray-3 mb-6">Cout total: <span className="font-semibold text-dark">{coutEstime.toLocaleString()} FCFA</span></p>
          <button onClick={handleReset} className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition">
            Envoyer une nouvelle campagne
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Formulaire */}
          <div className="col-span-2 space-y-5">
            {/* Expediteur */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-dark mb-4">Expediteur</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Nom expediteur (Sender ID)</label>
                <input
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value.slice(0, 11))}
                  maxLength={11}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Max 11 caracteres"
                />
                <p className="text-xs text-gray-3 mt-1">{senderId.length}/11 caracteres</p>
              </div>
            </div>

            {/* Source des destinataires */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-dark mb-4">Destinataires</h2>

              {/* Source selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleSourceChange('manual')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${recipientSource === 'manual' ? 'bg-primary text-white border-primary' : 'border-gray-5 text-gray-2 hover:border-primary hover:text-primary'}`}
                >
                  Saisie manuelle
                </button>
                <button
                  onClick={() => handleSourceChange('users')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${recipientSource === 'users' ? 'bg-primary text-white border-primary' : 'border-gray-5 text-gray-2 hover:border-primary hover:text-primary'}`}
                >
                  Tous les utilisateurs
                </button>
                <button
                  onClick={() => handleSourceChange('subscribers')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${recipientSource === 'subscribers' ? 'bg-primary text-white border-primary' : 'border-gray-5 text-gray-2 hover:border-primary hover:text-primary'}`}
                >
                  Abonnes newsletter
                </button>
              </div>

              {recipientSource === 'manual' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-2 mb-1">Numeros de telephone (un par ligne ou separes par des virgules)</label>
                  <textarea
                    value={manualNumbers}
                    onChange={(e) => setManualNumbers(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none font-mono"
                    placeholder={"237690000001\n237690000002\n237670000003"}
                  />
                  <p className="text-xs text-gray-3 mt-1">{parsedManualNumbers.length} numero(s) detecte(s)</p>
                </div>
              )}

              {recipientSource === 'users' && (
                <div>
                  {loadingRecipients ? (
                    <div className="flex items-center gap-2 text-gray-3 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" /> Chargement des utilisateurs...
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-dark">
                          <Users className="w-4 h-4 inline mr-1" />
                          {usersPhones.length} utilisateurs avec numero de telephone
                        </p>
                        <button onClick={loadUsersPhones} className="text-xs text-primary hover:underline">Recharger</button>
                      </div>
                      {usersPhones.length > 0 && (
                        <p className="text-xs text-gray-3">
                          Premiers numeros : {usersPhones.slice(0, 5).join(', ')}{usersPhones.length > 5 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {recipientSource === 'subscribers' && (
                <div>
                  {loadingRecipients ? (
                    <div className="flex items-center gap-2 text-gray-3 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" /> Chargement des abonnes...
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {subscribersInfo.length} abonne(s) trouves (emails uniquement).
                        Les SMS necessitent des numeros de telephone. Utilisez "Tous les utilisateurs" ou la saisie manuelle pour envoyer des SMS.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Templates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-dark mb-3">Modeles de message</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplate(tmpl.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${selectedTemplate === tmpl.id ? 'bg-primary text-white border-primary' : 'border-gray-5 text-gray-2 hover:border-primary hover:text-primary'}`}
                  >
                    {tmpl.nom}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-2 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                  placeholder="Redigez votre message SMS ici..."
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${charsLeft < 20 ? 'text-danger' : 'text-gray-3'}`}>
                    {message.length} caracteres ({nbSms} SMS{nbSms > 1 ? ' — message long' : ''})
                  </p>
                  <p className="text-xs text-gray-3">
                    160 car. = 1 SMS | 320 = 2 SMS | 480 = 3 SMS
                  </p>
                </div>
              </div>
            </div>

            {/* Planification */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planifie}
                    onChange={(e) => setPlanifie(e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-bold text-dark">Planifier l'envoi</span>
                </label>
              </div>
              {planifie && (
                <div>
                  <label className="block text-xs font-semibold text-gray-2 mb-1">Date et heure d'envoi</label>
                  <input
                    type="datetime-local"
                    value={dateEnvoi}
                    onChange={(e) => setDateEnvoi(e.target.value)}
                    className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recap */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-4">
              <h2 className="text-sm font-bold text-dark mb-4">Resume de la campagne</h2>
              <div className="space-y-3">
                {/* Balance */}
                <div className="flex items-center justify-between py-2.5 border-b border-gray-5 bg-primary/5 rounded-lg px-3 -mx-1">
                  <span className="text-xs font-semibold text-primary">Solde SMS</span>
                  <span className="text-sm font-bold text-primary">
                    {balanceLoading ? '...' : balance !== null ? `${balance} credits` : '—'}
                  </span>
                </div>

                <div className="flex items-center gap-3 py-2.5 border-b border-gray-5">
                  <Users className="w-4 h-4 text-gray-3" />
                  <div>
                    <p className="text-xs text-gray-3">Destinataires</p>
                    <p className="text-lg font-bold text-dark">{targetCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-5">
                  <span className="text-gray-3">Nb de SMS</span>
                  <span className="font-medium text-dark">{nbSms} par contact</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-5">
                  <span className="text-gray-3">Total SMS</span>
                  <span className="font-medium text-dark">{(targetCount * nbSms).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-5">
                  <span className="text-gray-3">Prix unitaire</span>
                  <span className="font-medium text-dark">15 FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm font-semibold text-dark">Cout estime</span>
                  <span className="text-base font-bold text-primary">{coutEstime.toLocaleString()} FCFA</span>
                </div>
              </div>

              {planifie && dateEnvoi && (
                <div className="mt-3 p-2.5 bg-info-soft rounded-lg">
                  <p className="text-xs text-info font-medium">Planifie pour</p>
                  <p className="text-sm text-info">{new Date(dateEnvoi).toLocaleString('fr-FR')}</p>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!message.trim() || sending || targetCount === 0}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send className="w-4 h-4" /> {planifie ? 'Planifier' : 'Envoyer maintenant'}</>
                )}
              </button>

              {targetCount === 0 && recipientSource === 'manual' && (
                <p className="text-xs text-amber-600 mt-2 text-center">Ajoutez des numeros de telephone pour envoyer</p>
              )}
            </div>

            {/* Apercu SMS */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-dark mb-3">Apercu SMS</h2>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-4 max-w-full">
                <p className="text-[10px] text-gray-3 mb-1">{senderId}</p>
                <p className="text-sm text-dark leading-relaxed">{message || 'Votre message apparaitra ici...'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
