'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Ban, ShieldCheck, Users, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  status: string;
  banned: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get<{ data: User[] }>('/users?perPage=500')
      .then((res) => setUsers(res.data.filter(u => u.role === 'CUSTOMER' || u.role === 'USER' || u.role === 'BUYER')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (!name.includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'BANNED' && !c.banned) return false;
      if (statusFilter === 'ACTIVE' && c.banned) return false;
      return true;
    });
  }, [users, search, statusFilter]);

  const columns: Column<User>[] = [
    {
      key: 'avatar', name: 'Avatar',
      render: (c) => (
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
          {c.firstName?.[0] || ''}{c.lastName?.[0] || ''}
        </div>
      ),
    },
    { key: 'nom', name: 'Nom', render: (c) => <span className="font-medium">{c.firstName} {c.lastName}</span> },
    { key: 'email', name: 'Email', render: (c) => <span className="text-sm">{c.email}</span> },
    { key: 'phone', name: 'Telephone', render: (c) => <span className="text-sm">{c.phone || '-'}</span> },
    { key: 'statut', name: 'Statut', render: (c) => <StatusBadge status={c.banned ? 'BANNED' : 'ACTIVE'} /> },
    { key: 'date', name: 'Inscription', render: (c) => formatDate(c.createdAt) },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Clients ({users.length})</h1>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
          <input type="text" placeholder="Rechercher par nom ou email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-5 rounded-lg focus:outline-none focus:border-primary">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="BANNED">Banni</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
