'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Smartphone, Wifi, WifiOff, RefreshCw, LogOut, CheckCircle } from 'lucide-react';

export default function WhatsAppPage() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get<{ status: string; qrCode: string | null }>('/whatsapp/status');
      setStatus(res.status as any);
      setQrCode(res.qrCode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling quand on attend le scan du QR
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      await fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, fetchStatus]);

  // Arreter le polling quand connecte
  useEffect(() => {
    if (status === 'connected') setPolling(false);
  }, [status]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ status: string; qrCode: string | null }>('/whatsapp/connect');
      setStatus(res.status as any);
      setQrCode(res.qrCode);
      setPolling(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/disconnect');
      setStatus('disconnected');
      setQrCode(null);
      setPolling(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-dark mb-6 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-green-600" /> WhatsApp Business
      </h1>

      <div className="max-w-lg mx-auto">
        {/* Status card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark">Statut de connexion</h2>
            <div className="flex items-center gap-2">
              {status === 'connected' ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-600 font-medium">Connecte</span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-sm text-yellow-600 font-medium">En attente du scan...</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-sm text-red-600 font-medium">Deconnecte</span>
                </>
              )}
            </div>
          </div>

          {status === 'connected' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-700 mb-2">WhatsApp est connecte !</p>
              <p className="text-sm text-gray-500 mb-6">
                Les notifications de commande seront envoyees automatiquement aux clients, boutiques et agents call center.
              </p>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Deconnecter
              </button>
            </div>
          ) : qrCode ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Scannez ce QR code avec WhatsApp sur votre telephone :
              </p>
              <p className="text-xs text-gray-400 mb-4">
                WhatsApp &gt; Menu &gt; Appareils connectes &gt; Connecter un appareil
              </p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-yellow-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                En attente du scan...
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6">
                WhatsApp n&apos;est pas connecte. Connectez-vous pour envoyer des notifications automatiques.
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
              >
                <Wifi className="w-4 h-4" />
                {loading ? 'Connexion...' : 'Connecter WhatsApp'}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-medium text-green-800 mb-2">Notifications automatiques</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Quand un client passe une commande → message au client, boutique et call center</li>
            <li>• Quand le call center confirme → message de confirmation au client</li>
            <li>• Quand le call center annule → message d&apos;annulation au client</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
