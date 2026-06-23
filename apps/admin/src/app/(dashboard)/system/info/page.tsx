'use client';

import { useState, useEffect } from 'react';
import { Server, Database, HardDrive, Clock, Cpu, MemoryStick, RefreshCcw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const SERVER_INFO = {
  os: 'Ubuntu 22.04.3 LTS',
  hostname: 'estuaire-prod-01.cmr',
  nodeVersion: 'v20.11.0',
  npmVersion: '10.2.4',
  nestjsVersion: '10.3.2',
  nextjsVersion: '14.1.0',
  uptime: '14 jours, 6 heures, 23 minutes',
  uptimeSince: '2026-06-07 08:30:00',
};

const DB_INFO = {
  type: 'PostgreSQL',
  version: '15.4',
  host: 'localhost',
  port: 5432,
  dbName: 'estuaire_prod',
  status: 'Connecte',
  connexionsActives: 12,
  tailleDB: '4.3 Go',
  derniereBackup: '2026-06-21 02:00:00',
};

const CACHE_INFO = {
  type: 'Redis',
  version: '7.2.3',
  host: 'localhost',
  port: 6379,
  status: 'Actif',
  memUsed: '128 Mo',
  memTotal: '512 Mo',
  hits: 98432,
  misses: 1204,
};

const DISK_INFO = [
  { mount: '/', total: '100 Go', used: '42 Go', libre: '58 Go', pct: 42 },
  { mount: '/var/uploads', total: '500 Go', used: '183 Go', libre: '317 Go', pct: 37 },
  { mount: '/var/backups', total: '200 Go', used: '67 Go', libre: '133 Go', pct: 33 },
];

const PERF_INFO = {
  cpuLoad: '12%',
  cpuCores: 4,
  ramTotal: '8 Go',
  ramUsed: '3.2 Go',
  ramPct: 40,
  swapTotal: '2 Go',
  swapUsed: '0.1 Go',
};

function InfoCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-base font-bold text-dark">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-5/50 last:border-0">
      <span className="text-xs text-gray-3">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-dark'}`}>{value}</span>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-success' : 'text-danger'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} />
      {ok ? 'Operationnel' : 'Erreur'}
    </span>
  );
}

export default function SystemInfoPage() {
  const [serverInfo, setServerInfo] = useState(SERVER_INFO);
  const [dbInfo, setDbInfo] = useState(DB_INFO);
  const [cacheInfo, setCacheInfo] = useState(CACHE_INFO);
  const [diskInfo, setDiskInfo] = useState(DISK_INFO);
  const [perfInfo, setPerfInfo] = useState(PERF_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { server?: typeof SERVER_INFO; db?: typeof DB_INFO; cache?: typeof CACHE_INFO; disk?: typeof DISK_INFO; perf?: typeof PERF_INFO } }>('/settings/admin/admin_system_info')
      .then(res => {
        if (res.data?.server) setServerInfo(res.data.server);
        if (res.data?.db) setDbInfo(res.data.db);
        if (res.data?.cache) setCacheInfo(res.data.cache);
        if (res.data?.disk) setDiskInfo(res.data.disk);
        if (res.data?.perf) setPerfInfo(res.data.perf);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Informations Systeme</h1>
            <p className="text-sm text-gray-3">Etat en temps reel du serveur et des services</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-2 border border-gray-5 rounded-lg hover:bg-gray-6 transition">
          <RefreshCcw className="w-4 h-4" /> Rafraichir
        </button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Serveur Web', ok: true },
          { label: 'Base de donnees', ok: true },
          { label: 'Cache Redis', ok: true },
          { label: 'File d\'attente', ok: true },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <StatusDot ok={s.ok} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Serveur */}
        <InfoCard icon={Server} title="Informations Serveur">
          <InfoRow label="Systeme d'exploitation" value={serverInfo.os} />
          <InfoRow label="Hostname" value={serverInfo.hostname} />
          <InfoRow label="Node.js" value={serverInfo.nodeVersion} highlight />
          <InfoRow label="npm" value={serverInfo.npmVersion} />
          <InfoRow label="NestJS" value={serverInfo.nestjsVersion} />
          <InfoRow label="Next.js" value={serverInfo.nextjsVersion} />
          <InfoRow label="Uptime" value={serverInfo.uptime} highlight />
          <InfoRow label="Actif depuis" value={serverInfo.uptimeSince} />
        </InfoCard>

        {/* Base de donnees */}
        <InfoCard icon={Database} title="Base de Donnees">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-3">Statut</span>
            <StatusDot ok={true} />
          </div>
          <InfoRow label="Type" value={dbInfo.type} />
          <InfoRow label="Version" value={dbInfo.version} highlight />
          <InfoRow label="Base de donnees" value={dbInfo.dbName} />
          <InfoRow label="Connexions actives" value={dbInfo.connexionsActives} />
          <InfoRow label="Taille de la base" value={dbInfo.tailleDB} highlight />
          <InfoRow label="Derniere backup" value={dbInfo.derniereBackup} />
        </InfoCard>

        {/* Cache */}
        <InfoCard icon={MemoryStick} title="Cache Redis">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-3">Statut</span>
            <StatusDot ok={true} />
          </div>
          <InfoRow label="Version" value={cacheInfo.version} highlight />
          <InfoRow label="Memoire utilisee" value={cacheInfo.memUsed} />
          <InfoRow label="Memoire totale" value={cacheInfo.memTotal} />
          <InfoRow label="Cache hits" value={cacheInfo.hits.toLocaleString()} highlight />
          <InfoRow label="Cache misses" value={cacheInfo.misses.toLocaleString()} />
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-3 mb-1">
              <span>Taux de reussite</span>
              <span className="text-success font-medium">{Math.round(cacheInfo.hits / (cacheInfo.hits + cacheInfo.misses) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-5 rounded-full h-1.5">
              <div className="bg-success h-1.5 rounded-full" style={{ width: `${Math.round(cacheInfo.hits / (cacheInfo.hits + cacheInfo.misses) * 100)}%` }} />
            </div>
          </div>
        </InfoCard>

        {/* Performance CPU/RAM */}
        <InfoCard icon={Cpu} title="Performance">
          <InfoRow label="Charge CPU" value={perfInfo.cpuLoad} highlight />
          <InfoRow label="Coeurs CPU" value={perfInfo.cpuCores} />
          <div className="py-2 border-b border-gray-5/50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-3">RAM utilise</span>
              <span className="font-medium text-dark">{perfInfo.ramUsed} / {perfInfo.ramTotal}</span>
            </div>
            <div className="w-full bg-gray-5 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${perfInfo.ramPct}%` }} />
            </div>
            <span className="text-[10px] text-gray-3">{perfInfo.ramPct}% utilise</span>
          </div>
          <div className="py-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-3">Swap</span>
              <span className="font-medium text-dark">{perfInfo.swapUsed} / {perfInfo.swapTotal}</span>
            </div>
            <div className="w-full bg-gray-5 rounded-full h-2">
              <div className="bg-info h-2 rounded-full" style={{ width: '5%' }} />
            </div>
          </div>
        </InfoCard>
      </div>

      {/* Disque */}
      <InfoCard icon={HardDrive} title="Espace Disque">
        <div className="space-y-4">
          {diskInfo.map((disk) => (
            <div key={disk.mount}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-dark">{disk.mount}</span>
                <span className="text-gray-3">{disk.used} / {disk.total} — {disk.libre} libre</span>
              </div>
              <div className="w-full bg-gray-5 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${disk.pct > 80 ? 'bg-danger' : disk.pct > 60 ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${disk.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-3 mt-0.5">{disk.pct}% utilise</p>
            </div>
          ))}
        </div>
      </InfoCard>

      {/* Uptime horloge */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center">
          <Clock className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-xs text-gray-3">Serveur en ligne depuis</p>
          <p className="text-lg font-bold text-dark">{serverInfo.uptime}</p>
          <p className="text-xs text-gray-3">Depuis le {serverInfo.uptimeSince}</p>
        </div>
      </div>
    </div>
  );
}
