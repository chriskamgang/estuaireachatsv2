'use client';

import { useState, useEffect } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';

interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: StaffMember[]; meta?: any }>('/users?perPage=500')
      .then((res) => {
        const admins = (res.data || []).filter(
          (u) => u.role === 'ADMIN' || u.role === 'STAFF'
        );
        setStaff(admins);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<StaffMember>[] = [
    {
      name: 'Nom', key: 'firstName',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.firstName} {item.lastName}</p>
          <p className="text-xs text-gray-3">{item.email}</p>
        </div>
      ),
    },
    { name: 'Telephone', key: 'phone', render: (item) => <span className="text-sm text-gray-2">{item.phone || '-'}</span> },
    {
      name: 'Role', key: 'role',
      render: (item) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${item.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
          {item.role}
        </span>
      ),
    },
    {
      name: 'Statut', key: 'isActive',
      render: (item) => <StatusBadge status={item.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">Gestion du staff</h1>
          <p className="text-sm text-gray-3">{staff.length} membre(s)</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={staff} pagination={{ page: 1, perPage: 20, total: staff.length }} />
      </div>
    </div>
  );
}
