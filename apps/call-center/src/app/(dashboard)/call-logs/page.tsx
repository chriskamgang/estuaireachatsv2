'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CallLog {
  id: string;
  callResult: string;
  duration: number | null;
  notes: string | null;
  createdAt: string;
  agent: { firstName: string; lastName: string };
  order: { id: string; orderNumber: string; status: string; total: number; buyer: { firstName: string; lastName: string; phone: string | null } };
}

const RESULT_LABELS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmee', cls: 'bg-success-soft text-green-700' },
  NO_ANSWER: { label: 'Pas de reponse', cls: 'bg-warning-soft text-yellow-700' },
  CANCELLED: { label: 'Annulee', cls: 'bg-danger-soft text-red-700' },
  CALLBACK: { label: 'Rappeler', cls: 'bg-info-soft text-blue-700' },
  WRONG_NUMBER: { label: 'Mauvais numero', cls: 'bg-gray-100 text-gray-700' },
  OTHER: { label: 'Autre', cls: 'bg-gray-100 text-gray-700' },
};

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: CallLog[]; total: number; totalPages: number }>(`/call-center/call-logs?page=${page}&perPage=20`);
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <h1 className="text-xl font-bold text-dark mb-6 flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" /> Journal des appels
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-3">Aucun appel enregistre</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-5 bg-gray-6">
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">N° Commande</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Resultat</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Duree</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const resultInfo = RESULT_LABELS[log.callResult] || { label: log.callResult, cls: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={log.id} className="border-b border-gray-5 hover:bg-gray-6/50">
                      <td className="px-4 py-3 text-xs text-gray-3">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${log.order.id}`} className="font-medium text-primary hover:underline">
                          {log.order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>{log.order.buyer.firstName} {log.order.buyer.lastName}</div>
                        {log.order.buyer.phone && <span className="text-xs text-gray-3">{log.order.buyer.phone}</span>}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatPrice(log.order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', resultInfo.cls)}>
                          {resultInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-3">
                        {log.duration ? `${Math.floor(log.duration / 60)}min ${log.duration % 60}s` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-2 max-w-[200px] truncate">{log.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-5">
            <p className="text-xs text-gray-3">{total} appel(s)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
