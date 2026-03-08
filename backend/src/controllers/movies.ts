import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getMovies(req: Request, res: Response) {
  try {
    const {
      page = '1',
      limit = '20',
      genre,
      category,
      audioLanguage,
      featured,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = Math.min(parseInt(limit as string), 50);

    const where: Record<string, unknown> = {
      published: true,
    };

    if (featured === 'true') {
      where.featured = true;
    }

    if (category && typeof category === 'string') {
      where.category = { slug: category };
    }

    if (genre && typeof genre === 'string') {
      where.genres = {
        some: {
          genre: {
            OR: [
              { slug: genre },
              { name: { equals: genre, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    if (audioLanguage && typeof audioLanguage === 'string') {
      where.audioLanguages = {
        some: {
          audioLanguage: {
            OR: [
              { slug: audioLanguage },
              { name: { equals: audioLanguage, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip,
        take,
        orderBy: { [sort as string]: order },
        include: {
          category: true,
          genres: { include: { genre: true } },
          audioLanguages: { include: { audioLanguage: true } },
          cast: { orderBy: { order: 'asc' }, take: 5 },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.movie.count({ where }),
    ]);

    const formatted = movies.map((m) => ({
      ...m,
      genre: m.genres.map((g) => g.genre.name),
      genres: undefined,
      audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
      audioLanguages: undefined,
      category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
    }));

    res.json({
      success: true,
      data: {
        movies: formatted,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getMovieBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { slug, published: true },
      include: {
        category: true,
        genres: { include: { genre: true } },
        audioLanguages: { include: { audioLanguage: true } },
        cast: { orderBy: { order: 'asc' } },
        reviews: {
          where: { approved: true },
          orderBy: [
            { origin: 'asc' },
            { helpfulCount: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        comments: {
          where: { approved: true, parentId: null },
          orderBy: { createdAt: 'desc' },
          include: {
            replies: {
              where: { approved: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found',
      });
    }

    // increment view count (fire-and-forget)
    prisma.movie
      .update({
        where: { id: movie.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    const formatted = {
      ...movie,
      genre: movie.genres.map((g) => g.genre.name),
      genres: undefined,
      audioLanguage: movie.audioLanguages.map((a) => a.audioLanguage.name),
      audioLanguages: undefined,
      category: movie.category ? { id: movie.category.id, name: movie.category.name, slug: movie.category.slug } : null,
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    throw error;
  }
}
