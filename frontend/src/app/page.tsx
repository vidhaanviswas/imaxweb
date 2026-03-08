'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Movie, type CollectionSummary } from '@/lib/api';
import { HeroBanner } from '@/components/movies/HeroBanner';
import { MovieRow } from '@/components/movies/MovieRow';
import { MovieCard } from '@/components/movies/MovieCard';

type StoredMovie = {
  id: string;
  slug: string;
  title: string;
  posterUrl: string | null;
  rating: number | null;
};

export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [latest, setLatest] = useState<Movie[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionMovies, setCollectionMovies] = useState<Record<string, Movie[]>>({});
  const [recent, setRecent] = useState<StoredMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.movies.list({ featured: true }),
      api.movies.list({ page: 1 }),
      api.collections(),
    ])
      .then(([featuredRes, latestRes, collectionsRes]) => {
        setFeatured(featuredRes.data.movies);
        setLatest(latestRes.data.movies.slice(0, 12));
        const cols = (collectionsRes.data || []).filter((c) => c.movieCount > 0).slice(0, 4);
        setCollections(cols);
        return cols;
      })
      .then((cols) => {
        if (cols.length === 0) return;
        return Promise.all(
          cols.map((c) =>
            api.collectionBySlug(c.slug).then((res) => ({ slug: c.slug, movies: res.data.movies })),
          ),
        );
      })
      .then((results) => {
        if (!results) return;
        const map: Record<string, Movie[]> = {};
        results.forEach((r) => {
          if (r) map[r.slug] = r.movies.slice(0, 12);
        });
        setCollectionMovies(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('recently_viewed');
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setRecent(
          parsed.filter(
            (m): m is StoredMovie =>
              typeof m === 'object' &&
              m !== null &&
              'id' in m &&
              'slug' in m &&
              'title' in m
          ),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const heroMovie = featured[0] || latest[0];

  const surprisePool = useMemo(() => {
    const ids = new Set<string>();
    const all: Movie[] = [];
    for (const m of [...featured, ...latest]) {
      if (!ids.has(m.id)) {
        ids.add(m.id);
        all.push(m);
      }
    }
    return all;
  }, [featured, latest]);

  const handleSurpriseMe = () => {
    if (surprisePool.length === 0) return;
    const random = surprisePool[Math.floor(Math.random() * surprisePool.length)];
    router.push(`/movie/${random.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {heroMovie && <HeroBanner movie={heroMovie} />}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Explore Movies</h2>
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="self-start px-4 py-2 rounded-full bg-neon-cyan text-background text-sm font-medium hover:bg-neon-cyan/90 transition"
          >
            Surprise me
          </button>
        </div>

        {featured.length > 0 && (
          <MovieRow title="Featured" movies={featured} />
        )}

        <MovieRow title="Latest Movies" movies={latest} />

        {collections.map((c) => {
          const movies = collectionMovies[c.slug] || [];
          if (movies.length === 0) return null;
          return (
            <MovieRow
              key={c.id}
              title={c.name}
              movies={movies}
              seeAllHref={`/collection/${c.slug}`}
            />
          );
        })}

        {recent.length > 0 && (
          <section className="mt-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Recently viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recent.slice(0, 10).map((m) => (
                <MovieCard
                  key={m.id}
                  movie={{
                    id: m.id,
                    slug: m.slug,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    rating: m.rating,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
