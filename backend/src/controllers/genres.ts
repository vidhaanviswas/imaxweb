import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getGenres(req: Request, res: Response) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { movies: true } },
      },
    });

    res.json({
      success: true,
      data: genres.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        movieCount: g._count.movies,
      })),
    });
  } catch (error) {
    throw error;
  }
}
