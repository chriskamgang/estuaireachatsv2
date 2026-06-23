'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Save, Eye, EyeOff, CheckCircle, Loader2, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { api } from '@/lib/api';

interface ProviderCreds {
  accountSid?: string;
  authToken?: string;
  from?: string;
  apiKey?: string;
  apiSecret?: string;
  sender?: string;
  appId?: string;
  apiUrl?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  username?: string;
  password?: string;
  [key: string]: string | undefined;
}

interface Credentials {
  twilio: ProviderCreds;
  infobip: ProviderCreds;
  vonage: ProviderCreds;
  aws_sns: ProviderCreds;
}

interface NexahConfig {
  user: string;
  password: string;
  senderid: string;
  enabled: boolean;
}

const initialCreds: Credentials = {
  twilio: { accountSid: 'AC****1234abcd', authToken: '****efgh5678', from: '+12345678901' },
  infobip: { apiKey: 'infobip_****key123', sender: 'EstuaireAchats', apiUrl: 'https://xxxx.api.infobip.com' },
  vonage: { apiKey: 'vonage_****abc', apiSecret: 'vonage_secret_****def', from: 'EstuaireAchats' },
  aws_sns: { accessKey: 'AKIA****XXXXX', secretKey: 'aws_secret_****12345', region: 'eu-west-1', sender: 'EstuaireAchats' },
};

function MaskedInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-3 hover:text-primary transition">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-3 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-2 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
      />
      {hint && <p className="text-xs text-gray-3 mt-1">{hint}</p>}
    </div>
  );
}

export default function OTPCredentialsPage() {
  const [creds, setCreds] = useState<Credentials>(initialCreds);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [tested, setTested] = useState<string | null>(null);

  // Nexah SMS state
  const [nexahConfig, setNexahConfig] = useState<NexahConfig>({ user: '', password: '', senderid: 'EstuaireAchats', enabled: false });
  const [nexahSaving, setNexahSaving] = useState(false);
  const [nexahSaved, setNexahSaved] = useState(false);
  const [nexahBalance, setNexahBalance] = useState<number | string | null>(null);
  const [nexahBalanceLoading, setNexahBalanceLoading] = useState(false);
  const [nexahTestPhone, setNexahTestPhone] = useState('');
  const [nexahTestMessage, setNexahTestMessage] = useState('Test SMS EstuaireAchats');
  const [nexahTestSending, setNexahTestSending] = useState(false);
  const [nexahTestResult, setNexahTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: any }>('/settings/admin/admin_otp_credentials')
        .then((res) => { if (res.data) setCreds({ ...initialCreds, ...res.data }); })
        .catch(() => {}),
      api.get<{ data: NexahConfig }>('/sms/config')
        .then((res) => { if (res.data) setNexahConfig(res.data); })
        .catch(() => {}),
      loadNexahBalance(),
    ]).finally(() => setLoading(false));
  }, []);

  const loadNexahBalance = async () => {
    setNexahBalanceLoading(true);
    try {
      const res = await api.get<{ data: any }>('/sms/balance');
      setNexahBalance(res.data?.balance ?? res.data ?? '—');
    } catch {
      setNexahBalance('Erreur');
    }
    setNexahBalanceLoading(false);
  };

  const update = (provider: keyof Credentials, field: string, value: string) => {
    setCreds((prev) => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }));
  };

  const handleSave = async (provider: string) => {
    setSaving(provider);
    try {
      await api.put('/settings/admin/admin_otp_credentials', { value: creds });
      setSaved(provider);
      setTimeout(() => setSaved(null), 2500);
    } catch {}
    setSaving(null);
  };

  const handleTest = (provider: string) => {
    setTested(provider);
    setTimeout(() => setTested(null), 3000);
  };

  const handleNexahSave = async () => {
    setNexahSaving(true);
    try {
      await api.put('/sms/config', {
        user: nexahConfig.user,
        password: nexahConfig.password,
        senderid: nexahConfig.senderid,
        enabled: nexahConfig.enabled,
      });
      setNexahSaved(true);
      setTimeout(() => setNexahSaved(false), 2500);
    } catch {}
    setNexahSaving(false);
  };

  const handleNexahTest = async () => {
    if (!nexahTestPhone.trim()) return;
    setNexahTestSending(true);
    setNexahTestResult(null);
    try {
      const res = await api.post<{ data: any }>('/sms/send-test', {
        mobile: nexahTestPhone,
        message: nexahTestMessage,
      });
      setNexahTestResult({ success: true, message: 'SMS de test envoye avec succes !' });
    } catch (err: any) {
      setNexahTestResult({ success: false, message: err?.response?.data?.message || 'Echec de l\'envoi du SMS de test' });
    }
    setNexahTestSending(false);
  };

  const SaveBtn = ({ provider }: { provider: string }) => (
    <div className="flex gap-2 mt-5">
      <button onClick={() => handleTest(provider)} className="flex items-center gap-2 border border-gray-5 text-gray-2 px-4 py-2 rounded-lg hover:bg-gray-6 transition text-sm font-medium">
        {tested === provider ? '✓ SMS envoye !' : 'Tester la connexion'}
      </button>
      <button onClick={() => handleSave(provider)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium">
        {saved === provider ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved === provider ? 'Enregistre !' : 'Enregistrer'}
      </button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Credentials OTP / SMS</h1>
          <p className="text-sm text-gray-3">Configurez les cles API de vos fournisseurs SMS</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Securite :</strong> Ces credentials sont sensibles. Ils sont chiffres en base de donnees et jamais exposes dans les logs.
          Assurez-vous de ne les partager avec personne.
        </p>
      </div>

      {/* Nexah SMS — Primary Provider */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-primary p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-dark">Nexah SMS</h2>
                <span className="text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded-full">Principal</span>
              </div>
              <p className="text-xs text-gray-3">Fournisseur SMS principal pour le Cameroun</p>
            </div>
          </div>
          {/* Toggle Actif */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-gray-2">{nexahConfig.enabled ? 'Actif' : 'Inactif'}</span>
            <button
              type="button"
              onClick={() => setNexahConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${nexahConfig.enabled ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${nexahConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Config fields */}
          <div className="space-y-4">
            <TextInput
              label="Utilisateur"
              value={nexahConfig.user}
              onChange={(v) => setNexahConfig((prev) => ({ ...prev, user: v }))}
              hint="Nom d'utilisateur Nexah SMS"
            />
            <MaskedInput
              label="Mot de passe"
              value={nexahConfig.password}
              onChange={(v) => setNexahConfig((prev) => ({ ...prev, password: v }))}
            />
            <TextInput
              label="Sender ID"
              value={nexahConfig.senderid}
              onChange={(v) => setNexahConfig((prev) => ({ ...prev, senderid: v }))}
              hint="Nom qui apparait comme expediteur (max 11 caracteres)"
            />

            {/* Solde SMS */}
            <div>
              <label className="block text-sm font-medium text-gray-2 mb-1">Solde SMS</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-5 rounded-lg px-3 py-2 text-sm font-semibold text-dark">
                  {nexahBalanceLoading ? (
                    <span className="flex items-center gap-2 text-gray-3"><Loader2 className="w-3 h-3 animate-spin" /> Chargement...</span>
                  ) : (
                    <span>{nexahBalance !== null ? nexahBalance : '—'} credits</span>
                  )}
                </div>
                <button
                  onClick={loadNexahBalance}
                  disabled={nexahBalanceLoading}
                  className="p-2 border border-gray-5 rounded-lg hover:bg-gray-6 transition text-gray-3 hover:text-primary disabled:opacity-50"
                  title="Rafraichir le solde"
                >
                  <RefreshCw className={`w-4 h-4 ${nexahBalanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleNexahSave}
                disabled={nexahSaving}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"
              >
                {nexahSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : nexahSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {nexahSaved ? 'Enregistre !' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Test SMS */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-dark flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> Tester l'envoi SMS
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Numero de telephone</label>
                <input
                  type="text"
                  value={nexahTestPhone}
                  onChange={(e) => setNexahTestPhone(e.target.value)}
                  placeholder="237XXXXXXXXX"
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-2 mb-1">Message de test</label>
                <textarea
                  value={nexahTestMessage}
                  onChange={(e) => setNexahTestMessage(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>
              <button
                onClick={handleNexahTest}
                disabled={nexahTestSending || !nexahTestPhone.trim()}
                className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nexahTestSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {nexahTestSending ? 'Envoi...' : 'Envoyer SMS de test'}
              </button>
              {nexahTestResult && (
                <div className={`text-sm p-2 rounded-lg ${nexahTestResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {nexahTestResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Other providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Twilio */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <span className="text-sm font-bold text-red-600">Tw</span>
            </div>
            <h2 className="text-lg font-bold text-dark">Twilio</h2>
          </div>
          <div className="space-y-4">
            <MaskedInput label="Account SID" value={creds.twilio.accountSid || ''} onChange={(v) => update('twilio', 'accountSid', v)} hint="Commence par AC..." />
            <MaskedInput label="Auth Token" value={creds.twilio.authToken || ''} onChange={(v) => update('twilio', 'authToken', v)} />
            <TextInput label="Numero expediteur" value={creds.twilio.from || ''} onChange={(v) => update('twilio', 'from', v)} hint="Format E.164 : +12345678901" />
          </div>
          <SaveBtn provider="twilio" />
        </div>

        {/* Infobip */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <span className="text-sm font-bold text-pink-600">Ib</span>
            </div>
            <h2 className="text-lg font-bold text-dark">Infobip</h2>
          </div>
          <div className="space-y-4">
            <MaskedInput label="API Key" value={creds.infobip.apiKey || ''} onChange={(v) => update('infobip', 'apiKey', v)} />
            <TextInput label="API URL" value={creds.infobip.apiUrl || ''} onChange={(v) => update('infobip', 'apiUrl', v)} hint="URL personnalisee de votre instance" />
            <TextInput label="Nom expediteur" value={creds.infobip.sender || ''} onChange={(v) => update('infobip', 'sender', v)} hint="Max 11 caracteres" />
          </div>
          <SaveBtn provider="infobip" />
        </div>

        {/* Vonage */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">Vx</span>
            </div>
            <h2 className="text-lg font-bold text-dark">Vonage (Nexmo)</h2>
          </div>
          <div className="space-y-4">
            <MaskedInput label="API Key" value={creds.vonage.apiKey || ''} onChange={(v) => update('vonage', 'apiKey', v)} />
            <MaskedInput label="API Secret" value={creds.vonage.apiSecret || ''} onChange={(v) => update('vonage', 'apiSecret', v)} />
            <TextInput label="Nom / Numero expediteur" value={creds.vonage.from || ''} onChange={(v) => update('vonage', 'from', v)} />
          </div>
          <SaveBtn provider="vonage" />
        </div>

        {/* AWS SNS */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-bold text-orange-600">AWS</span>
            </div>
            <h2 className="text-lg font-bold text-dark">AWS SNS</h2>
          </div>
          <div className="space-y-4">
            <MaskedInput label="Access Key ID" value={creds.aws_sns.accessKey || ''} onChange={(v) => update('aws_sns', 'accessKey', v)} hint="Commence par AKIA..." />
            <MaskedInput label="Secret Access Key" value={creds.aws_sns.secretKey || ''} onChange={(v) => update('aws_sns', 'secretKey', v)} />
            <TextInput label="Region AWS" value={creds.aws_sns.region || ''} onChange={(v) => update('aws_sns', 'region', v)} hint="Ex: eu-west-1, us-east-1" />
            <TextInput label="Nom expediteur" value={creds.aws_sns.sender || ''} onChange={(v) => update('aws_sns', 'sender', v)} />
          </div>
          <SaveBtn provider="aws_sns" />
        </div>
      </div>
    </div>
  );
}
