'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { api, type Movie, type Category } from '@/lib/api';

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<boolean | undefined>(undefined); // undefined = all
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; total: number; errors: string[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchMovies = (page = 1) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    api.admin.movies.list(token, { page, search: search || undefined, published: publishedFilter })
      .then((res) => {
        setMovies(res.data.movies);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies(pagination.page);
  }, [pagination.page, publishedFilter]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.categories.list(token).then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchMovies(1);
  };

  const handlePublishedFilter = (value: 'all' | 'published' | 'draft') => {
    setPublishedFilter(value === 'all' ? undefined : value === 'published');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleImport = async () => {
    if (!importCsv.trim()) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await api.admin.movies.importCsv(token, {
        csv: importCsv.trim(),
        defaultCategoryId: importCategoryId || undefined,
      });
      setImportResult(res.data);
      if (res.data.created > 0) {
        setImportCsv('');
        fetchMovies(pagination.page);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.movies.delete(token, id);
      setMovies((m) => m.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          Movies
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={publishedFilter === undefined ? 'all' : publishedFilter ? 'published' : 'draft'}
            onChange={(e) => handlePublishedFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="px-3 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies..."
            className="px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium">
            Search
          </button>
        </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Link
          href="/admin/add-movie"
          className="inline-block px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 transition"
        >
          + Add Movie
        </Link>
        <button
          type="button"
          onClick={() => setImportOpen((o) => !o)}
          className="px-4 py-2 rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition"
        >
          {importOpen ? '− Hide Import' : '+ Import from CSV'}
        </button>
      </div>

      {importOpen && (
        <div className="p-4 rounded-xl glass border border-white/10 space-y-3">
          <h3 className="font-semibold">Bulk import from CSV</h3>
          <p className="text-sm text-muted-foreground">
            Paste CSV with header row. Required columns: <code>title</code>, <code>releaseDate</code>. Optional: description, runtime, director, rating, categorySlug, posterUrl, published (true/false).
          </p>
          <textarea
            value={importCsv}
            onChange={(e) => setImportCsv(e.target.value)}
            placeholder="title,releaseDate,description&#10;Inception,2010-07-16,A mind-bending thriller..."
            rows={6}
            className="w-full px-4 py-2 rounded-lg bg-background/50 border border-white/10 focus:border-neon-cyan outline-none font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={importCategoryId}
              onChange={(e) => setImportCategoryId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-background/50 border border-white/10 focus:border-neon-cyan outline-none"
            >
              <option value="">No default category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading || !importCsv.trim()}
              className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium hover:bg-neon-cyan/90 disabled:opacity-50"
            >
              {importLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
          {importResult && (
            <div className="text-sm">
              <p className="text-neon-cyan">Created {importResult.created} of {importResult.total} movies.</p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 text-red-400 text-xs space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4">Poster</th>
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Scores</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="w-12 h-18 rounded overflow-hidden bg-muted">
                      {m.posterUrl ? (
                        <Image src={m.posterUrl} alt="" width={48} height={72} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg min-h-[72px]">🎬</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{m.title}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${m.published !== false ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {m.published !== false ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {m.rating != null ? `${m.rating.toFixed(1)} ★` : '-'}
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <Link
                      href={`/admin/edit-movie/${m.id}`}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/20 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(m.id, m.title)}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-lg glass disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 rounded-lg glass disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}
