'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MovieCard } from './MovieCard';
import type { Movie } from '@/lib/api';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  seeAllHref?: string;
}

export function MovieRow({ title, movies, seeAllHref }: MovieRowProps) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <motion.h2
          className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm text-neon-cyan hover:underline shrink-0"
          >
            See all →
          </Link>
        )}
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-hide">
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <MovieCard movie={movie} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
