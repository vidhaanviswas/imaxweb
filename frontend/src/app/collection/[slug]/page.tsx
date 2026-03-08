'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, type Collection } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.collectionBySlug(slug)
      .then((res) => setCollection(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Collection not found</h1>
        <Link href="/" className="text-neon-cyan hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 sm:py-12"
    >
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-neon-cyan mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-3 text-muted-foreground max-w-2xl">{collection.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{collection.movies.length} movies</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {collection.movies.map((movie, i) => (
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

      {collection.movies.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No movies in this collection yet.</p>
      )}
    </motion.div>
  );
}
