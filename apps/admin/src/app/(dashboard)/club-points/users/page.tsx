'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface PointTransaction {
  id: number;
  utilisateur: string;
  email: string;
  type: string;
  points: number;
  description: string;
  commande: string;
  date: string;
  solde: number;
}

interface UserPoints {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  totalGagne: number;
  totalDepense: number;
  solde: number;
  niveau: string;
  derniereActivite: string;
}

const defaultUsers: UserPoints[] = [
  { id: 1, nom: 'Albert Fouda', email: 'a.fouda@gmail.com', telephone: '+237 677 11 22 33', totalGagne: 5600, totalDepense: 4000, solde: 1600, niveau: 'Gold', derniereActivite: '2026-06-21' },
  { id: 2, nom: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', telephone: '+237 699 22 33 44', totalGagne: 1250, totalDepense: 500, solde: 750, niveau: 'Silver', derniereActivite: '2026-06-15' },
  { id: 3, nom: 'Marie Ngo', email: 'marie.ngo@yahoo.fr', telephone: '+237 655 33 44 55', totalGagne: 890, totalDepense: 200, solde: 690, niveau: 'Silver', derniereActivite: '2026-06-14' },
  { id: 4, nom: 'Paul Atangana', email: 'p.atangana@hotmail.com', telephone: '+237 677 44 55 66', totalGagne: 2300, totalDepense: 1800, solde: 500, niveau: 'Gold', derniereActivite: '2026-06-14' },
  { id: 5, nom: 'Sophie Ekane', email: 's.ekane@gmail.com', telephone: '+237 690 55 66 77', totalGagne: 450, totalDepense: 0, solde: 450, niveau: 'Bronze', derniereActivite: '2026-06-13' },
  { id: 6, nom: 'Eric Njoh', email: 'e.njoh@yahoo.fr', telephone: '+237 677 66 77 88', totalGagne: 1850, totalDepense: 850, solde: 1000, niveau: 'Silver', derniereActivite: '2026-06-10' },
  { id: 7, nom: 'Christine Owona', email: 'c.owona@hotmail.com', telephone: '+237 699 77 88 99', totalGagne: 970, totalDepense: 500, solde: 470, niveau: 'Silver', derniereActivite: '2026-06-09' },
  { id: 8, nom: 'Francoise Bella', email: 'f.bella@gmail.com', telephone: '+237 655 88 99 00', totalGagne: 320, totalDepense: 100, solde: 220, niveau: 'Bronze', derniereActivite: '2026-06-11' },
];

const defaultTransactions: PointTransaction[] = [
  { id: 1, utilisateur: 'Albert Fouda', email: 'a.fouda@gmail.com', type: 'GAGNES', points: 1850, description: 'Achat Samsung Galaxy A55', commande: 'ORD-1234', date: '2026-06-20', solde: 1600 },
  { id: 2, utilisateur: 'Albert Fouda', email: 'a.fouda@gmail.com', type: 'DEPENSES', points: -500, description: 'Echange points', commande: '-', date: '2026-06-18', solde: -250 },
  { id: 3, utilisateur: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', type: 'GAGNES', points: 250, description: 'Achat Ecouteurs JBL', commande: 'ORD-1235', date: '2026-06-15', solde: 750 },
  { id: 4, utilisateur: 'Marie Ngo', email: 'marie.ngo@yahoo.fr', type: 'BONUS', points: 200, description: 'Bonus parrainage', commande: '-', date: '2026-06-14', solde: 690 },
  { id: 5, utilisateur: 'Paul Atangana', email: 'p.atangana@hotmail.com', type: 'DEPENSES', points: -1800, description: 'Reduction commande', commande: 'ORD-1230', date: '2026-06-14', solde: 500 },
  { id: 6, utilisateur: 'Sophie Ekane', email: 's.ekane@gmail.com', type: 'GAGNES', points: 450, description: 'Achat Tablette Lenovo', commande: 'ORD-1236', date: '2026-06-13', solde: 450 },
  { id: 7, utilisateur: 'Eric Njoh', email: 'e.njoh@yahoo.fr', type: 'EXPIRES', points: -200, description: 'Points expires (1 an)', commande: '-', date: '2026-06-10', solde: 1000 },
  { id: 8, utilisateur: 'Christine Owona', email: 'c.owona@hotmail.com', type: 'GAGNES', points: 970, description: 'Achat MacBook Pro', commande: 'ORD-1228', date: '2026-06-09', solde: 470 },
];

const niveaux = ['', 'Bronze', 'Silver', 'Gold', 'Platinum'];

export default function ClubPointsUsersPage() {
  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'historique'>('utilisateurs');
  const [search, setSearch] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [users, setUsers] = useState<UserPoints[]>(defaultUsers);
  const [transactions, setTransactions] = useState<PointTransaction[]>(defaultTransactions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { users?: UserPoints[]; transactions?: PointTransaction[] } }>('/settings/admin/admin_club_points_users')
      .then(res => {
        if (res.data) {
          if (res.data.users) setUsers(res.data.users);
          if (res.data.transactions) setTransactions(res.data.transactions);
        }
      })
      .catch(() => {
        api.get<{ data: UserPoints[] }>('/users?perPage=500')
          .then(res => { if (res.data) setUsers(res.data); })
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchNiveau = !niveauFilter || u.niveau === niveauFilter;
    return matchSearch && matchNiveau;
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch = t.utilisateur.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const niveauColor = (n: string) => {
    switch (n) {
      case 'Gold': return 'bg-yellow-100 text-yellow-700';
      case 'Silver': return 'bg-gray-100 text-gray-600';
      case 'Platinum': return 'bg-purple-100 text-purple-700';
      default: return 'bg-amber-50 text-amber-700';
    }
  };

  const userColumns: Column<UserPoints>[] = [
    { name: 'Utilisateur', key: 'nom', render: (u) => (<div><p className="font-medium text-dark">{u.nom}</p><p className="text-xs text-gray-3">{u.email}</p></div>) },
    { name: 'Niveau', key: 'niveau', render: (u) => <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${niveauColor(u.niveau)}`}>{u.niveau}</span> },
    { name: 'Points gagnes', key: 'totalGagne', render: (u) => <span className="font-semibold text-green-600">{u.totalGagne.toLocaleString('fr-FR')}</span> },
    { name: 'Points depenses', key: 'totalDepense', render: (u) => <span className="font-semibold text-red-500">{u.totalDepense.toLocaleString('fr-FR')}</span> },
    { name: 'Solde actuel', key: 'solde', render: (u) => <span className="font-bold text-primary">{u.solde.toLocaleString('fr-FR')} pts</span> },
    { name: 'Derniere activite', key: 'derniereActivite', render: (u) => <span className="text-sm">{formatDate(u.derniereActivite)}</span> },
    { name: 'Actions', key: 'actions', render: () => (
      <button className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Eye className="w-4 h-4" /></button>
    )},
  ];

  const txColumns: Column<PointTransaction>[] = [
    { name: 'Date', key: 'date', render: (t) => <span className="text-sm">{formatDate(t.date)}</span> },
    { name: 'Utilisateur', key: 'utilisateur', render: (t) => <span className="font-medium text-dark">{t.utilisateur}</span> },
    { name: 'Type', key: 'type', render: (t) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        t.type === 'GAGNES' ? 'bg-green-100 text-green-700' :
        t.type === 'DEPENSES' ? 'bg-red-100 text-red-700' :
        t.type === 'BONUS' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-500'
      }`}>{t.type}</span>
    )},
    { name: 'Points', key: 'points', render: (t) => (
      <span className={`font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
        {t.points > 0 ? '+' : ''}{t.points.toLocaleString('fr-FR')}
      </span>
    )},
    { name: 'Description', key: 'description', render: (t) => <span className="text-sm">{t.description}</span> },
    { name: 'Commande', key: 'commande', render: (t) => <span className="font-mono text-xs text-primary">{t.commande}</span> },
  ];

  if (loading) {
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
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Points des utilisateurs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Membres actifs', value: users.length },
          { label: 'Points distribues', value: users.reduce((s, u) => s + u.totalGagne, 0).toLocaleString('fr-FR') },
          { label: 'Points en circulation', value: users.reduce((s, u) => s + u.solde, 0).toLocaleString('fr-FR') },
          { label: 'Membres Gold+', value: users.filter(u => u.niveau === 'Gold' || u.niveau === 'Platinum').length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-6 rounded-xl p-1 w-fit">
        {(['utilisateurs', 'historique'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-gray-2 hover:text-dark'}`}>
            {tab === 'utilisateurs' ? 'Classement utilisateurs' : 'Historique transactions'}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          {activeTab === 'utilisateurs' ? (
            <select value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Tous les niveaux</option>
              {niveaux.filter(Boolean).map((n) => <option key={n}>{n}</option>)}
            </select>
          ) : (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Tous les types</option>
              <option value="GAGNES">Gagnes</option>
              <option value="DEPENSES">Depenses</option>
              <option value="BONUS">Bonus</option>
              <option value="EXPIRES">Expires</option>
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {activeTab === 'utilisateurs' ? (
          <DataTable columns={userColumns} data={filteredUsers} pagination={{ page: 1, perPage: 10, total: filteredUsers.length }} />
        ) : (
          <DataTable columns={txColumns} data={filteredTransactions} pagination={{ page: 1, perPage: 10, total: filteredTransactions.length }} />
        )}
      </div>
    </div>
  );
}
