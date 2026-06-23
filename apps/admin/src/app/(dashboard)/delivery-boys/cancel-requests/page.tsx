'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, CheckCircle, XCircle, Eye, X, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface CancelRequest {
  id: number;
  ref: string;
  livreur: string;
  commande: string;
  client: string;
  raison: string;
  details: string;
  statut: string;
  date: string;
}

const DEFAULT_REQUESTS: CancelRequest[] = [
  { id: 1, ref: 'CR-001', livreur: 'Rodrigue Nkoa', commande: 'CMD-20240601-012', client: 'Ngono Marie', raison: 'Client absent', details: 'Le client n\'etait pas present a l\'adresse de livraison apres 3 tentatives de contact telephonique.', statut: 'PENDING', date: '2026-06-05' },
  { id: 2, ref: 'CR-002', livreur: 'Franck Mvondo', commande: 'CMD-20240602-034', client: 'Biya Paul', raison: 'Adresse introuvable', details: 'L\'adresse indiquee dans la commande n\'existe pas selon la localisation GPS.', statut: 'APPROVED', date: '2026-06-06' },
  { id: 3, ref: 'CR-003', livreur: 'Stephane Biya', commande: 'CMD-20240603-007', client: 'Kamga Serge', raison: 'Client refuse la commande', details: 'Le client dit avoir recu le meme produit d\'un autre vendeur et refuse de receptionner.', statut: 'PENDING', date: '2026-06-07' },
  { id: 4, ref: 'CR-004', livreur: 'Herve Kamga', commande: 'CMD-20240604-056', client: 'Tchoupo Alice', raison: 'Panne vehicule', details: 'La moto est tombee en panne en route, impossible de finaliser la livraison aujourd\'hui.', statut: 'APPROVED', date: '2026-06-08' },
  { id: 5, ref: 'CR-005', livreur: 'Martial Ondoua', commande: 'CMD-20240605-022', client: 'Nguemo Claire', raison: 'Zone inaccessible', details: 'La zone de livraison est inondee suite aux pluies et inaccessible avec le vehicule.', statut: 'PENDING', date: '2026-06-09' },
  { id: 6, ref: 'CR-006', livreur: 'Cyrille Abega', commande: 'CMD-20240606-041', client: 'Mvondo Eric', raison: 'Colis endommage', details: 'Le colis a ete endommage pendant le transport. Le client a refuse de le receptionner.', statut: 'REJECTED', date: '2026-06-10' },
  { id: 7, ref: 'CR-007', livreur: 'Boris Nlend', commande: 'CMD-20240607-018', client: 'Bello Fatima', raison: 'Client absent', details: 'Troisieme tentative de livraison sans succes. Le client ne repond pas aux appels.', statut: 'APPROVED', date: '2026-06-11' },
  { id: 8, ref: 'CR-008', livreur: 'Rodrigue Nkoa', commande: 'CMD-20240608-089', client: 'Ondoua Pierre', raison: 'Erreur d\'adresse', details: 'L\'adresse dans le systeme est incomplete. Le livreur a contacte le client mais pas de reponse.', statut: 'PENDING', date: '2026-06-12' },
];

const raisonColor: Record<string, string> = {
  'Client absent': 'bg-warning-soft text-warning',
  'Adresse introuvable': 'bg-danger-soft text-danger',
  'Client refuse la commande': 'bg-danger-soft text-danger',
  'Panne vehicule': 'bg-info-soft text-info',
  'Zone inaccessible': 'bg-warning-soft text-warning',
  'Colis endommage': 'bg-danger-soft text-danger',
  'Erreur d\'adresse': 'bg-warning-soft text-warning',
};

interface DetailModalProps {
  req: CancelRequest;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

function DetailModal({ req, onClose, onApprove, onReject }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <div>
            <h2 className="text-lg font-bold text-dark">Demande {req.ref}</h2>
            <p className="text-xs text-gray-3">Annulation de livraison</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-3">Livreur</p>
              <p className="text-sm font-medium text-dark">{req.livreur}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Commande</p>
              <code className="text-xs text-primary">{req.commande}</code>
            </div>
            <div>
              <p className="text-xs text-gray-3">Client</p>
              <p className="text-sm font-medium text-dark">{req.client}</p>
            </div>
            <div>
              <p className="text-xs text-gray-3">Date</p>
              <p className="text-sm text-gray-1">{formatDate(req.date)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-3 mb-1">Raison</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${raisonColor[req.raison] || 'bg-gray-5 text-gray-2'}`}>
              {req.raison}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-3 mb-1">Details</p>
            <div className="bg-gray-6/50 rounded-lg p-3">
              <p className="text-sm text-gray-1">{req.details}</p>
            </div>
          </div>
        </div>
        {req.statut === 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-5 flex gap-3">
            <button
              onClick={() => { onReject(req.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border border-danger text-danger rounded-lg hover:bg-danger-soft transition"
            >
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
            <button
              onClick={() => { onApprove(req.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-success text-white rounded-lg hover:bg-success/90 transition"
            >
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
          </div>
        )}
        {req.statut !== 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-5">
            <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CancelRequestsPage() {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CancelRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ value: CancelRequest[] }>('/settings/admin/admin_delivery_cancel_requests');
      if (res.value && Array.isArray(res.value) && res.value.length > 0) {
        setRequests(res.value);
      } else {
        setRequests(DEFAULT_REQUESTS);
      }
    } catch {
      setRequests(DEFAULT_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = statusFilter ? requests.filter((r) => r.statut === statusFilter) : requests;

  const saveToSettings = async (updated: CancelRequest[]) => {
    try {
      await api.put('/settings/admin/admin_delivery_cancel_requests', { value: updated });
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const handleApprove = (id: number) => {
    const updated = requests.map((r) => r.id === id ? { ...r, statut: 'APPROVED' } : r);
    setRequests(updated);
    saveToSettings(updated);
  };

  const handleReject = (id: number) => {
    const updated = requests.map((r) => r.id === id ? { ...r, statut: 'REJECTED' } : r);
    setRequests(updated);
    saveToSettings(updated);
  };

  const columns: Column<CancelRequest>[] = [
    { name: 'Ref', key: 'ref', render: (item) => <code className="text-xs font-mono text-primary">{item.ref}</code> },
    { name: 'Livreur', key: 'livreur', render: (item) => <span className="text-sm font-medium text-dark">{item.livreur}</span> },
    { name: 'Commande', key: 'commande', render: (item) => <code className="text-xs text-gray-2">{item.commande}</code> },
    { name: 'Client', key: 'client', render: (item) => <span className="text-gray-1">{item.client}</span> },
    {
      name: 'Raison', key: 'raison', render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${raisonColor[item.raison] || 'bg-gray-5 text-gray-2'}`}>
          {item.raison}
        </span>
      ),
    },
    { name: 'Date', key: 'date', render: (item) => <span className="text-xs text-gray-3">{formatDate(item.date)}</span> },
    { name: 'Statut', key: 'statut', render: (item) => <StatusBadge status={item.statut === 'APPROVED' ? 'COMPLETED' : item.statut === 'REJECTED' ? 'CANCELLED' : 'PENDING'} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelected(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>
          {item.statut === 'PENDING' && (
            <>
              <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-success transition"><CheckCircle className="w-4 h-4" /></button>
              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><XCircle className="w-4 h-4" /></button>
            </>
          )}
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
      {selected && (
        <DetailModal req={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={handleReject} />
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <RefreshCcw className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Demandes d'Annulation</h1>
          <p className="text-sm text-gray-3">
            {requests.filter((r) => r.statut === 'PENDING').length} demandes en attente de traitement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente', val: requests.filter((r) => r.statut === 'PENDING').length, color: 'text-warning' },
          { label: 'Approuvees', val: requests.filter((r) => r.statut === 'APPROVED').length, color: 'text-success' },
          { label: 'Rejetees', val: requests.filter((r) => r.statut === 'REJECTED').length, color: 'text-danger' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvees</option>
          <option value="REJECTED">Rejetees</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
      </div>
    </div>
  );
}
