'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, type Movie } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { motion } from 'framer-motion';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.movies.list({ category: slug })
      .then((res) => setMovies(res.data.movies))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {categoryName}
      </motion.h1>

      {movies.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No movies in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
