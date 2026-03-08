'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    bannerUrl: string | null;
    posterUrl: string | null;
    rating: number | null;
    genre?: string[];
  };
}

export function HeroBanner({ movie }: HeroBannerProps) {
  return (
    <section className="relative h-[55vh] min-h-[360px] sm:h-[65vh] sm:min-h-[420px] md:h-[70vh] md:min-h-[500px] overflow-hidden">
      <div className="absolute inset-0">
        {movie.bannerUrl ? (
          <Image
            src={movie.bannerUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-purple/40 via-background to-neon-cyan/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-end pb-12 sm:pb-16 md:pb-20">
        <motion.div
          className="max-w-2xl w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex gap-3 mb-3">
            {movie.genre?.slice(0, 3).map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded text-xs font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
              >
                {g}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 drop-shadow-2xl">
            {movie.title}
          </h1>
          {movie.description && (
            <p className="text-lg text-white/90 line-clamp-3 mb-4 drop-shadow-lg">
              {movie.description}
            </p>
          )}
          {movie.rating != null && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 shadow-lg">
                <span className="text-sm text-amber-400">★</span>
                <span className="text-sm font-semibold text-amber-300">
                  {movie.rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-white/70">/ 10</span>
              </div>
            </div>
          )}
          <Link
            href={`/movie/${movie.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 transition-colors shadow-neon-cyan"
          >
            View Details
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
