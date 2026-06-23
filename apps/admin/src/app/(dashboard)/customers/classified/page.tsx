'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Eye, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface ClassifiedProduct {
  id: number;
  titre: string;
  client: string;
  email: string;
  categorie: string;
  prix: number;
  localisation: string;
  datePublication: string;
  dateExpiration: string;
  vues: number;
  statut: string;
  description: string;
}

const defaultClassifieds: ClassifiedProduct[] = [
  { id: 1, titre: 'Vends iPhone 13 Pro 256Go', client: 'Jean Mbarga', email: 'jean.mbarga@gmail.com', categorie: 'Telephonie', prix: 280000, localisation: 'Douala, Akwa', datePublication: '2026-06-10', dateExpiration: '2026-07-10', vues: 145, statut: 'ACTIF', description: 'iPhone 13 Pro en parfait etat, couleur sierra blue, complet avec boite et accessoires originaux.' },
  { id: 2, titre: 'Location appartement F3 meuble', client: 'Sophie Ngo', email: 'sophie.ngo@yahoo.fr', categorie: 'Immobilier', prix: 120000, localisation: 'Yaounde, Bastos', datePublication: '2026-06-12', dateExpiration: '2026-07-12', vues: 89, statut: 'EN_ATTENTE', description: 'Appartement 3 pieces entierement meuble au quartier Bastos, Yaounde.' },
  { id: 3, titre: 'Toyota Corolla 2019 essence', client: 'Paul Atangana', email: 'p.atangana@hotmail.com', categorie: 'Automobile', prix: 4800000, localisation: 'Douala, Deido', datePublication: '2026-06-08', dateExpiration: '2026-07-08', vues: 312, statut: 'ACTIF', description: 'Toyota Corolla 2019, essence, 45000 km, bien entretenue, climatisation.' },
  { id: 4, titre: 'Cours particuliers mathematiques', client: 'Marie Fouda', email: 'marie.fouda@gmail.com', categorie: 'Services', prix: 5000, localisation: 'Douala', datePublication: '2026-06-15', dateExpiration: '2026-07-15', vues: 56, statut: 'ACTIF', description: 'Cours de mathematiques pour collegiens et lyceens. 5000 FCFA / heure.' },
  { id: 5, titre: 'Machine a coudre Singer', client: 'Eric Bella', email: 'eric.bella@gmail.com', categorie: 'Equipements', prix: 35000, localisation: 'Bafoussam', datePublication: '2026-06-14', dateExpiration: '2026-07-14', vues: 78, statut: 'EN_ATTENTE', description: 'Machine a coudre Singer modele 4411, tres peu utilisee, en excellent etat.' },
  { id: 6, titre: 'Terrain 500m2 viabilise', client: 'Christine Owona', email: 'c.owona@yahoo.fr', categorie: 'Immobilier', prix: 8500000, localisation: 'Kribi', datePublication: '2026-06-05', dateExpiration: '2026-07-05', vues: 189, statut: 'EXPIRE', description: 'Terrain 500m2 viabilise proche de la mer a Kribi. Titre foncier disponible.' },
  { id: 7, titre: 'Velo electrique Xiaomi', client: 'Albert Tabi', email: 'a.tabi@gmail.com', categorie: 'Sport', prix: 95000, localisation: 'Douala, Bonamoussadi', datePublication: '2026-06-18', dateExpiration: '2026-07-18', vues: 34, statut: 'REJETE', description: 'Velo electrique Xiaomi presque neuf, 2 ans de garantie restante.' },
];

const categories = ['', 'Telephonie', 'Immobilier', 'Automobile', 'Services', 'Equipements', 'Sport'];

export default function CustomerClassifiedPage() {
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [classifieds, setClassifieds] = useState<ClassifiedProduct[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: ClassifiedProduct[] }>('/settings/admin/admin_customers_classified')
      .then(res => { if (res.data) setClassifieds(res.data); else setClassifieds(defaultClassifieds); })
      .catch(() => setClassifieds(defaultClassifieds))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = classifieds.filter((c) => {
    const matchSearch = c.titre.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categorieFilter || c.categorie === categorieFilter;
    const matchStatut = !statutFilter || c.statut === statutFilter;
    return matchSearch && matchCat && matchStatut;
  });

  const handleApprove = (id: number) => {
    setClassifieds((prev) => prev.map((c) => c.id === id ? { ...c, statut: 'ACTIF' } : c));
  };

  const handleReject = (id: number) => {
    if (!confirm('Rejeter cette annonce ?')) return;
    setClassifieds((prev) => prev.map((c) => c.id === id ? { ...c, statut: 'REJETE' } : c));
  };

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer definitivement cette annonce ?')) return;
    setClassifieds((prev) => prev.filter((c) => c.id !== id));
  };

  const columns: Column<ClassifiedProduct>[] = [
    {
      name: 'Annonce',
      key: 'titre',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.titre}</p>
          <p className="text-xs text-gray-3">{item.client} · {item.localisation}</p>
        </div>
      ),
    },
    {
      name: 'Categorie',
      key: 'categorie',
      render: (item) => <span className="text-sm">{item.categorie}</span>,
    },
    {
      name: 'Prix',
      key: 'prix',
      render: (item) => <span className="font-semibold text-primary">{formatPrice(item.prix)}</span>,
    },
    {
      name: 'Vues',
      key: 'vues',
      render: (item) => <span className="text-sm">{item.vues}</span>,
    },
    {
      name: 'Publication',
      key: 'datePublication',
      render: (item) => (
        <div>
          <p className="text-xs">{formatDate(item.datePublication)}</p>
          <p className="text-xs text-gray-3">Exp: {formatDate(item.dateExpiration)}</p>
        </div>
      ),
    },
    {
      name: 'Statut',
      key: 'statut',
      render: (item) => <StatusBadge status={item.statut} />,
    },
    {
      name: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Voir description">
            <Eye className="w-4 h-4" />
          </button>
          {item.statut === 'EN_ATTENTE' && (
            <>
              <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-3 hover:text-green-600 transition" title="Approuver">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-3 hover:text-red-500 transition" title="Rejeter">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Produits classes par clients</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total annonces', value: classifieds.length },
          { label: 'En attente', value: classifieds.filter(c => c.statut === 'EN_ATTENTE').length },
          { label: 'Actives', value: classifieds.filter(c => c.statut === 'ACTIF').length },
          { label: 'Vues totales', value: classifieds.reduce((s, c) => s + c.vues, 0).toLocaleString('fr-FR') },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-3 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input type="text" placeholder="Rechercher titre ou client..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <select value={categorieFilter} onChange={(e) => setCategorieFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">Toutes les categories</option>
            {categories.filter(Boolean).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="ACTIF">Actif</option>
            <option value="EXPIRE">Expire</option>
            <option value="REJETE">Rejete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 10, total: filtered.length }} />
        {expanded && (
          <div className="border-t border-gray-5 p-4 bg-blue-50">
            <p className="text-sm font-medium text-gray-2 mb-1">Description de l&apos;annonce :</p>
            <p className="text-sm text-dark">{classifieds.find(c => c.id === expanded)?.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
