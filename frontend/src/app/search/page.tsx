'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type Movie } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { motion } from 'framer-motion';

type SortOption = 'relevance' | 'rating_desc' | 'rating_asc' | 'year_desc' | 'year_asc';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedAudio, setSelectedAudio] = useState<string>('all');
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const doSearch = useCallback(() => {
    if (!query.trim() || query.length < 2) {
      setMovies([]);
      return;
    }
    setLoading(true);
    api.search(query)
      .then((res) => setMovies(res.data.movies))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (q) {
      setQuery(q);
      if (q.length >= 2) {
        setLoading(true);
        api.search(q)
          .then((res) => setMovies(res.data.movies))
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }
  }, [q]);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const m of movies) {
      m.genre?.forEach((g) => set.add(g));
    }
    return Array.from(set).sort();
  }, [movies]);

  const availableAudio = useMemo(() => {
    const set = new Set<string>();
    for (const m of movies) {
      m.audioLanguage?.forEach((a) => set.add(a));
    }
    return Array.from(set).sort();
  }, [movies]);

  const yearBounds = useMemo(() => {
    const years: number[] = [];
    for (const m of movies) {
      if (m.releaseDate) {
        years.push(new Date(m.releaseDate).getFullYear());
      }
    }
    if (!years.length) return { min: undefined as number | undefined, max: undefined as number | undefined };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [movies]);

  const filteredAndSorted = useMemo(() => {
    let result = movies.slice();

    if (selectedGenre !== 'all') {
      result = result.filter((m) => m.genre?.includes(selectedGenre));
    }
    if (selectedAudio !== 'all') {
      result = result.filter((m) => m.audioLanguage?.includes(selectedAudio));
    }

    const minY = minYear ? parseInt(minYear, 10) : undefined;
    const maxY = maxYear ? parseInt(maxYear, 10) : undefined;

    if (minY || maxY) {
      result = result.filter((m) => {
        if (!m.releaseDate) return false;
        const y = new Date(m.releaseDate).getFullYear();
        if (minY && y < minY) return false;
        if (maxY && y > maxY) return false;
        return true;
      });
    }

    switch (sortBy) {
      case 'rating_desc':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'rating_asc':
        result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case 'year_desc':
        result.sort(
          (a, b) =>
            (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0) -
            (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0),
        );
        break;
      case 'year_asc':
        result.sort(
          (a, b) =>
            (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0) -
            (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0),
        );
        break;
      default:
        break;
    }

    return result;
  }, [movies, selectedGenre, selectedAudio, minYear, maxYear, sortBy]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Search Movies
      </motion.h1>

      <div className="max-w-xl mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Search by title, description, director..."
            className="flex-1 px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/30 outline-none transition"
          />
          <button
            onClick={doSearch}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 transition disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </div>

      {movies.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3 md:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background text-sm border border-white/10 focus:border-neon-cyan outline-none"
            >
              <option value="all">All genres</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Audio language</label>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background text-sm border border-white/10 focus:border-neon-cyan outline-none"
            >
              <option value="all">All languages</option>
              {availableAudio.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Year from {yearBounds.min ?? ''}
              </label>
              <input
                type="number"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg bg-background text-sm border border-white/10 focus:border-neon-cyan outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                to {yearBounds.max ?? ''}
              </label>
              <input
                type="number"
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg bg-background text-sm border border-white/10 focus:border-neon-cyan outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg bg-background text-sm border border-white/10 focus:border-neon-cyan outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="rating_desc">Rating: high to low</option>
                <option value="rating_asc">Rating: low to high</option>
                <option value="year_desc">Year: newest first</option>
                <option value="year_asc">Year: oldest first</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && query.length >= 2 && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredAndSorted.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">
              No movies found for &quot;{query}&quot; with current filters.
            </p>
          ) : (
            filteredAndSorted.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {query.length < 2 && !loading && (
        <p className="text-muted-foreground">Enter at least 2 characters to search.</p>
      )}
    </div>
  );
}
