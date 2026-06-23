'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Save, Pencil, CheckCircle, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface PointProduct {
  id: number;
  nom: string;
  categorie: string;
  prix: number;
  pointsGagnes: number;
  pointsBonus: number;
  multipliateur: number;
  statut: string;
  actif: boolean;
}

const defaultProducts: PointProduct[] = [
  { id: 1, nom: 'Samsung Galaxy A55', categorie: 'Telephonie', prix: 185000, pointsGagnes: 1850, pointsBonus: 200, multipliateur: 1, statut: 'ACTIF', actif: true },
  { id: 2, nom: 'MacBook Pro M3', categorie: 'Informatique', prix: 950000, pointsGagnes: 9500, pointsBonus: 1000, multipliateur: 1, statut: 'ACTIF', actif: true },
  { id: 3, nom: 'Ecouteurs JBL', categorie: 'Accessoires', prix: 25000, pointsGagnes: 250, pointsBonus: 0, multipliateur: 1, statut: 'ACTIF', actif: true },
  { id: 4, nom: 'Samsung QLED 65"', categorie: 'Electronique', prix: 450000, pointsGagnes: 4500, pointsBonus: 500, multipliateur: 2, statut: 'DOUBLE_POINTS', actif: true },
  { id: 5, nom: 'Drone DJI Mini 4', categorie: 'Electronique', prix: 280000, pointsGagnes: 2800, pointsBonus: 0, multipliateur: 1, statut: 'ACTIF', actif: true },
  { id: 6, nom: 'Tablette Lenovo M10', categorie: 'Informatique', prix: 120000, pointsGagnes: 1200, pointsBonus: 300, multipliateur: 1, statut: 'ACTIF', actif: true },
  { id: 7, nom: 'Refrigerateur Samsung', categorie: 'Electromenager', prix: 185000, pointsGagnes: 1850, pointsBonus: 0, multipliateur: 1.5, statut: 'POINTS_BONUS', actif: true },
  { id: 8, nom: 'Canape en cuir', categorie: 'Mobilier', prix: 145000, pointsGagnes: 0, pointsBonus: 0, multipliateur: 0, statut: 'EXCLURE', actif: false },
];

export default function ClubPointsProductsPage() {
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ pointsBonus: 0, multipliateur: 1, actif: true });
  const [products, setProducts] = useState<PointProduct[]>([]);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: PointProduct[] }>('/settings/admin/admin_club_points_products')
      .then(res => { if (res.data) setProducts(res.data); else setProducts(defaultProducts); })
      .catch(() => {
        api.get<{ data: PointProduct[] }>('/products/admin/all?perPage=200')
          .then(res => { if (res.data) setProducts(res.data); else setProducts(defaultProducts); })
          .catch(() => setProducts(defaultProducts));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map((p) => p.categorie))];

  const filtered = products.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categorieFilter || p.categorie === categorieFilter;
    return matchSearch && matchCat;
  });

  const startEdit = (product: PointProduct) => {
    setEditingId(product.id);
    setEditValues({ pointsBonus: product.pointsBonus, multipliateur: product.multipliateur, actif: product.actif });
  };

  const saveEdit = (id: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const pointsGagnes = Math.round((p.prix / 100) * editValues.multipliateur);
      const statut = !editValues.actif ? 'EXCLURE' : editValues.multipliateur > 1 ? 'DOUBLE_POINTS' : editValues.pointsBonus > 0 ? 'POINTS_BONUS' : 'ACTIF';
      return { ...p, pointsBonus: editValues.pointsBonus, multipliateur: editValues.multipliateur, actif: editValues.actif, pointsGagnes, statut };
    }));
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
    setEditingId(null);
  };

  const columns: Column<PointProduct>[] = [
    {
      name: 'Produit',
      key: 'nom',
      render: (item) => (
        <div>
          <p className="font-medium text-dark">{item.nom}</p>
          <p className="text-xs text-gray-3">{item.categorie}</p>
        </div>
      ),
    },
    {
      name: 'Prix',
      key: 'prix',
      render: (item) => <span className="font-semibold">{formatPrice(item.prix)}</span>,
    },
    {
      name: 'Points gagnes',
      key: 'pointsGagnes',
      render: (item) => (
        <span className={`font-bold ${item.actif ? 'text-primary' : 'text-gray-3'}`}>
          {item.actif ? item.pointsGagnes.toLocaleString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      name: 'Points bonus',
      key: 'pointsBonus',
      render: (item) =>
        editingId === item.id ? (
          <input
            type="number"
            min={0}
            value={editValues.pointsBonus}
            onChange={(e) => setEditValues((v) => ({ ...v, pointsBonus: Number(e.target.value) }))}
            className="w-20 border border-gray-5 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <span className={item.pointsBonus > 0 ? 'font-semibold text-green-600' : 'text-gray-3'}>{item.pointsBonus || '-'}</span>
        ),
    },
    {
      name: 'Multiplicateur',
      key: 'multipliateur',
      render: (item) =>
        editingId === item.id ? (
          <select
            value={editValues.multipliateur}
            onChange={(e) => setEditValues((v) => ({ ...v, multipliateur: Number(e.target.value) }))}
            className="border border-gray-5 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={0}>0x (Exclure)</option>
            <option value={1}>x1 (Normal)</option>
            <option value={1.5}>x1.5</option>
            <option value={2}>x2 (Double)</option>
            <option value={3}>x3 (Triple)</option>
          </select>
        ) : (
          <span className={`font-semibold ${item.multipliateur > 1 ? 'text-amber-600' : ''}`}>
            x{item.multipliateur}
          </span>
        ),
    },
    {
      name: 'Points actifs',
      key: 'actif',
      render: (item) =>
        editingId === item.id ? (
          <button
            type="button"
            onClick={() => setEditValues((v) => ({ ...v, actif: !v.actif }))}
            className={`relative w-10 h-5 rounded-full transition ${editValues.actif ? 'bg-primary' : 'bg-gray-4'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editValues.actif ? 'translate-x-5' : ''}`} />
          </button>
        ) : (
          <span className={`text-xs font-medium ${item.actif ? 'text-green-600' : 'text-gray-3'}`}>
            {item.actif ? 'Oui' : 'Non'}
          </span>
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
          {editingId === item.id ? (
            <>
              <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition">
                <Save className="w-3 h-3" /> Sauv.
              </button>
              <button onClick={() => setEditingId(null)} className="px-2 py-1 border border-gray-5 text-gray-2 rounded text-xs hover:bg-gray-6 transition">
                Annuler
              </button>
            </>
          ) : (
            <>
              {savedId === item.id && <CheckCircle className="w-4 h-4 text-green-500" />}
              <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition" title="Modifier">
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
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
          <Package className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Points par produit</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Regle de calcul :</strong> Points gagnes = (Prix / 100) x Multiplicateur + Points bonus.
          Un multiplicateur de 0 exclut le produit du programme de points.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            value={categorieFilter}
            onChange={(e) => setCategorieFilter(e.target.value)}
            className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Toutes les categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          pagination={{ page: 1, perPage: 10, total: filtered.length }}
        />
      </div>
    </div>
  );
}
