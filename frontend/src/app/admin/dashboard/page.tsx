'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, type DashboardStats } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.dashboard(token)
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground">Failed to load dashboard</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl glass border border-white/10">
          <p className="text-muted-foreground text-sm">Total Movies</p>
          <p className="text-3xl font-bold text-neon-cyan">{stats.totalMovies}</p>
        </div>
        <div className="p-6 rounded-xl glass border border-white/10">
          <p className="text-muted-foreground text-sm">Total Reviews</p>
          <p className="text-3xl font-bold text-neon-purple">{stats.totalReviews}</p>
        </div>
        <div className="p-6 rounded-xl glass border border-white/10">
          <p className="text-muted-foreground text-sm">Pending Reviews</p>
          <p className="text-3xl font-bold text-neon-pink">{stats.pendingReviews}</p>
          {stats.pendingReviews > 0 && (
            <Link href="/admin/reviews" className="text-sm text-neon-cyan hover:underline mt-2 inline-block">
              Review now →
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Top Rated</h2>
          <div className="space-y-2">
            {stats.topRated.map((m) => (
              <Link
                key={m.id}
                href={`/movie/${m.slug}`}
                className="block p-3 rounded-lg glass hover:bg-white/10 transition"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {m.rating != null ? `${m.rating.toFixed(1)} ★` : '-'}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Latest Movies</h2>
          <div className="space-y-2">
            {stats.latestMovies.map((m) => (
              <Link
                key={m.id}
                href={`/admin/edit-movie/${m.id}`}
                className="block p-3 rounded-lg glass hover:bg-white/10 transition"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {new Date(m.releaseDate).getFullYear()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Most Viewed</h2>
          <div className="space-y-2">
            {stats.topViewed.length === 0 && (
              <p className="text-sm text-muted-foreground">No view data yet.</p>
            )}
            {stats.topViewed.map((m) => (
              <Link
                key={m.id}
                href={`/movie/${m.slug}`}
                className="block p-3 rounded-lg glass hover:bg-white/10 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    {m.category && (
                      <p className="text-xs text-muted-foreground">{m.category.name}</p>
                    )}
                  </div>
                  <p className="text-sm text-neon-cyan">{m.viewCount} views</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Top Searches</h2>
          <div className="space-y-1">
            {stats.topSearches.length === 0 && (
              <p className="text-sm text-muted-foreground">Search data will appear here.</p>
            )}
            {stats.topSearches.map((q) => (
              <div key={q.query} className="flex justify-between items-center p-2 rounded-lg glass">
                <span className="text-sm">{q.query}</span>
                <span className="text-xs text-muted-foreground">{q.count} searches</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Top Categories</h2>
          <div className="space-y-1">
            {stats.topCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
            {stats.topCategories.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-2 rounded-lg glass">
                <span className="text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.movieCount} movies</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/add-movie"
          className="px-6 py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 transition"
        >
          Add Movie
        </Link>
        <Link
          href="/admin/movies"
          className="px-6 py-3 rounded-lg glass hover:bg-white/10 transition"
        >
          View All Movies
        </Link>
      </div>
    </motion.div>
  );
}
