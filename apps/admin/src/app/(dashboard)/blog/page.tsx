'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, Eye, Loader2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  status: string;
  categoryId: number;
  category?: { id: number; name: string };
  views?: number;
  createdAt: string;
}

interface ModalProps {
  article: Partial<Article> | null;
  categories: { id: number; name: string }[];
  onClose: () => void;
  onSave: (a: Partial<Article>) => void;
}

function ArticleModal({ article, categories, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<Partial<Article>>(article || { title: '', slug: '', content: '', excerpt: '', image: '', author: '', status: 'DRAFT', categoryId: undefined });
  const set = (k: keyof Article, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f,
      title: v,
      slug: v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-5">
          <h2 className="text-lg font-bold text-dark">{article?.id ? 'Modifier l\'article' : 'Nouvel article'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Titre</label>
            <input value={form.title || ''} onChange={(e) => handleTitleChange(e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Titre de l'article" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-2 mb-1">Categorie</label>
              <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Choisir...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-2 mb-1">Statut</label>
              <select value={form.status || 'DRAFT'} onChange={(e) => set('status', e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="ACTIVE">Publie</option>
                <option value="DRAFT">Brouillon</option>
                <option value="INACTIVE">Archive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Auteur</label>
            <input value={form.author || ''} onChange={(e) => set('author', e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Nom de l'auteur" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Extrait</label>
            <input value={form.excerpt || ''} onChange={(e) => set('excerpt', e.target.value)} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Court resume de l'article" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-2 mb-1">Contenu</label>
            <textarea value={form.content || ''} onChange={(e) => set('content', e.target.value)} rows={5} className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" placeholder="Contenu de l'article..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-2 hover:bg-gray-6 rounded-lg transition">Annuler</button>
          <button onClick={() => onSave(form)} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Article> | null | false>(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [postsRes, catsRes] = await Promise.all([
        api.get<{ data: Article[] }>('/blog/posts?page=1&perPage=50'),
        api.get<{ data: { id: number; name: string }[] }>('/blog/categories'),
      ]);
      setArticles(postsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error('Erreur chargement articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || a.category?.name === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (form: Partial<Article>) => {
    try {
      if (form.id) {
        await api.patch(`/blog/posts/${form.id}`, {
          title: form.title,
          slug: form.slug,
          content: form.content,
          excerpt: form.excerpt,
          image: form.image,
          author: form.author,
          status: form.status,
          categoryId: form.categoryId,
        });
      } else {
        await api.post('/blog/posts', {
          title: form.title,
          slug: form.slug,
          content: form.content,
          excerpt: form.excerpt,
          image: form.image,
          author: form.author,
          status: form.status,
          categoryId: form.categoryId,
        });
      }
      setModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde article:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await api.delete(`/blog/posts/${id}`);
      loadData();
    } catch (err) {
      console.error('Erreur suppression article:', err);
    }
  };

  const uniqueCategories = [...new Set(articles.map((a) => a.category?.name).filter(Boolean))] as string[];

  const columns: Column<Article>[] = [
    { name: 'Titre', key: 'title', render: (item) => <span className="font-medium text-dark">{item.title}</span> },
    { name: 'Categorie', key: 'category', render: (item) => <span className="px-2 py-0.5 bg-primary-soft text-primary text-xs font-medium rounded-full">{item.category?.name || '-'}</span> },
    { name: 'Auteur', key: 'author', render: (item) => <span className="text-gray-1">{item.author}</span> },
    { name: 'Vues', key: 'views', render: (item) => <span className="flex items-center gap-1 text-gray-2"><Eye className="w-3.5 h-3.5" />{(item.views || 0).toLocaleString()}</span> },
    { name: 'Date', key: 'createdAt', render: (item) => <span className="text-gray-3 text-xs">{formatDate(item.createdAt)}</span> },
    { name: 'Statut', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
    {
      name: 'Actions', key: 'actions', render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setModal(item)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-danger transition"><Trash2 className="w-4 h-4" /></button>
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
      {modal !== false && (
        <ArticleModal article={modal} categories={categories} onClose={() => setModal(false)} onSave={handleSave} />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Articles du Blog</h1>
            <p className="text-sm text-gray-3">{articles.length} articles au total</p>
          </div>
        </div>
        <button onClick={() => setModal(null)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[220px]" placeholder="Rechercher un article..." />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            <option value="">Toutes les categories</option>
            {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <DataTable columns={columns} data={filtered} pagination={{ page: 1, perPage: 20, total: filtered.length }} />
      </div>
    </div>
  );
}
