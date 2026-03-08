'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

type StoredMovie = {
  id: string;
  slug: string;
  title: string;
  posterUrl: string | null;
  rating: number | null;
};

export default function WatchlistPage() {
  const [items, setItems] = useState<StoredMovie[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('watchlist');
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setItems(
          parsed.filter(
            (m): m is StoredMovie =>
              typeof m === 'object' &&
              m !== null &&
              'id' in m &&
              'slug' in m &&
              'title' in m
          )
        );
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const removeFromWatchlist = (id: string) => {
    setItems((current) => {
      const next = current.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('watchlist', JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 sm:py-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          Your Watchlist
        </h1>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-neon-cyan transition"
        >
          ← Back to Home
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="max-w-md p-6 rounded-xl glass border border-white/10">
          <p className="text-muted-foreground">
            Your watchlist is empty. Browse movies and click &quot;Add to Watchlist&quot; to save them
            here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {items.map((m) => (
            <div
              key={m.id}
              className="group rounded-xl overflow-hidden glass border border-white/10 flex flex-col"
            >
              <Link
                href={`/movie/${m.slug}`}
                className="relative w-full aspect-[2/3] bg-muted overflow-hidden"
              >
                {m.posterUrl ? (
                  <Image
                    src={m.posterUrl}
                    alt={m.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🎬
                  </div>
                )}
              </Link>
              <div className="p-3 flex-1 flex flex-col">
                <Link href={`/movie/${m.slug}`} className="font-medium text-sm line-clamp-2">
                  {m.title}
                </Link>
                {m.rating != null && (
                  <p className="mt-1 text-xs text-amber-300">{m.rating.toFixed(1)} ★</p>
                )}
                <button
                  type="button"
                  onClick={() => removeFromWatchlist(m.id)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 self-start"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

