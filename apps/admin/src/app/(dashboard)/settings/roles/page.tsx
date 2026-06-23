'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Pencil, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Role { id: number; name: string; permissions: string[]; usersCount: number; }

const allPermissions = [
  'products.view', 'products.create', 'products.edit', 'products.delete',
  'orders.view', 'orders.manage', 'customers.view', 'customers.manage',
  'sellers.view', 'sellers.manage', 'settings.view', 'settings.manage',
  'reports.view', 'marketing.manage', 'support.manage',
];

const defaultRoles: Role[] = [
  { id: 1, name: 'Super Admin', permissions: allPermissions, usersCount: 1 },
  { id: 2, name: 'Gestionnaire', permissions: ['products.view', 'products.edit', 'orders.view', 'orders.manage', 'customers.view', 'reports.view'], usersCount: 3 },
  { id: 3, name: 'Support', permissions: ['orders.view', 'customers.view', 'support.manage'], usersCount: 2 },
  { id: 4, name: 'Marketing', permissions: ['products.view', 'marketing.manage', 'reports.view'], usersCount: 1 },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', permissions: [] as string[] });

  useEffect(() => {
    api.get<{ data: any }>('/settings/admin/admin_roles')
      .then((res) => { if (res.data && Array.isArray(res.data)) setRoles(res.data); else setRoles(defaultRoles); })
      .catch(() => { setRoles(defaultRoles); })
      .finally(() => setLoading(false));
  }, []);

  const saveRoles = async (data: Role[]) => {
    setSaving(true);
    try {
      await api.put('/settings/admin/admin_roles', { value: data });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const openCreate = () => { setEditRole(null); setForm({ name: '', permissions: [] }); setShowModal(true); };
  const openEdit = (r: Role) => { setEditRole(r); setForm({ name: r.name, permissions: [...r.permissions] }); setShowModal(true); };

  const togglePerm = (p: string) => {
    setForm(prev => ({ ...prev, permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Role[];
    if (editRole) { updated = roles.map(r => r.id === editRole.id ? { ...r, ...form } : r); }
    else { updated = [...roles, { id: Date.now(), ...form, usersCount: 0 }]; }
    setRoles(updated);
    saveRoles(updated);
    setShowModal(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-dark">Roles & Permissions</h1>
          {saved && <span className="text-xs text-green-600 font-medium">Enregistre !</span>}
        </div>
        <button onClick={openCreate} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-dark">{role.name}</h3>
              <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-3 mb-3">{role.usersCount} membre(s)</p>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map(p => <span key={p} className="px-2 py-0.5 bg-gray-6 text-gray-2 rounded text-xs">{p}</span>)}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-5">
              <h2 className="text-lg font-bold text-dark">{editRole ? 'Modifier le role' : 'Ajouter un role'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-6 transition"><X className="w-5 h-5 text-gray-3" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-2 mb-1">Nom du role</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-2 mb-2">Permissions</label>
                <div className="border border-gray-5 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {allPermissions.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} className="rounded text-primary focus:ring-primary" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-5 text-gray-2 hover:bg-gray-6 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium">{editRole ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
