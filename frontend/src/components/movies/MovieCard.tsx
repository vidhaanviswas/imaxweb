'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
    rating: number | null;
    genre?: string[];
    category?: { id: string; name: string; slug: string } | null;
  };
}

export function MovieCard({ movie }: MovieCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / 20);
    mouseY.set((e.clientY - top) / 20);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateX = useMotionTemplate`${mouseY}deg`;
  const rotateY = useMotionTemplate`${mouseX}deg`;

  return (
    <Link href={`/movie/${movie.slug}`}>
      <motion.article
        className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden glass cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.03, zIndex: 10 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
      >
        <div className="absolute inset-0">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">🎬</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-white line-clamp-2 drop-shadow-lg">
            {movie.title}
          </h3>
          {movie.rating != null && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 w-fit">
              <span className="text-amber-400 text-sm">★</span>
              <span className="font-bold text-amber-400 text-sm">{movie.rating.toFixed(1)}</span>
              <span className="text-amber-400/80 text-xs">/10</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
          {movie.category && (
            <Link
              href={`/category/${movie.category.slug}`}
              className="px-2 py-0.5 rounded-full bg-neon-purple/80 text-xs text-white hover:bg-neon-purple"
              onClick={(e) => e.stopPropagation()}
            >
              {movie.category.name}
            </Link>
          )}
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-xs text-white/90 ml-auto">
            {movie.genre?.[0] || 'Movie'}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}
