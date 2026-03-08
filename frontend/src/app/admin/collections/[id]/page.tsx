'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, type Movie } from '@/lib/api';

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [collection, setCollection] = useState<{ name: string; slug: string; description: string; movieIds: string[] } | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    Promise.all([
      api.admin.collections.byId(token, id),
      api.admin.movies.list(token, { limit: 200 }),
    ])
      .then(([colRes, moviesRes]) => {
        const c = colRes.data;
        setCollection({
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          movieIds: c.movieIds || [],
        });
        setAllMovies(moviesRes.data.movies);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setSaving(true);
    try {
      await api.admin.collections.update(token, id, {
        name: collection.name,
        description: collection.description || undefined,
        movieIds: collection.movieIds,
      });
      router.push('/admin/collections');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleMovie = (movieId: string) => {
    setCollection((c) => {
      if (!c) return null;
      if (c.movieIds.includes(movieId)) {
        return { ...c, movieIds: c.movieIds.filter((x) => x !== movieId) };
      }
      return { ...c, movieIds: [...c.movieIds, movieId] };
    });
  };

  const filteredMovies = allMovies.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading || !collection) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/collections" className="text-muted-foreground hover:text-neon-cyan text-sm">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          Edit Collection
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={collection.name}
            onChange={(e) => setCollection((c) => (c ? { ...c, name: e.target.value } : null))}
            required
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <textarea
            value={collection.description}
            onChange={(e) => setCollection((c) => (c ? { ...c, description: e.target.value } : null))}
            rows={3}
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Movies in this collection</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies..."
            className="w-full px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none mb-3"
          />
          <div className="max-h-64 overflow-y-auto rounded-lg glass border border-white/10 p-2 space-y-1">
            {filteredMovies.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={collection.movieIds.includes(m.id)}
                  onChange={() => toggleMovie(m.id)}
                  className="rounded"
                />
                <span className="flex-1 truncate">{m.title}</span>
                {m.rating != null && (
                  <span className="text-xs text-amber-400">{m.rating.toFixed(1)} ★</span>
                )}
              </label>
            ))}
            {filteredMovies.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">No movies found</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {collection.movieIds.length} movie(s) selected
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link
            href="/admin/collections"
            className="px-6 py-3 rounded-lg glass hover:bg-white/10 inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
