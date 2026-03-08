import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function search(req: Request, res: Response) {
  try {
    const q = (req.query.q as string)?.trim();
    const limit = Math.min(parseInt((req.query.limit as string) || '20'), 50);

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { movies: [], total: 0 },
      });
    }

    const movies = await prisma.movie.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { director: { contains: q, mode: 'insensitive' } },
          {
            cast: {
              some: {
                OR: [
                  { actorName: { contains: q, mode: 'insensitive' } },
                  { characterName: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      },
      take: limit,
      include: {
        category: true,
        genres: { include: { genre: true } },
        audioLanguages: { include: { audioLanguage: true } },
      },
    });

    const formatted = movies.map((m) => ({
      ...m,
      genre: m.genres.map((g) => g.genre.name),
      genres: undefined,
      audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
      audioLanguages: undefined,
      category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
    }));

    // record search query (fire-and-forget)
    prisma.searchQuery
      .upsert({
        where: { query: q.toLowerCase() },
        create: { query: q.toLowerCase(), count: 1 },
        update: { count: { increment: 1 }, lastSearched: new Date() },
      })
      .catch(() => {});

    res.json({
      success: true,
      data: { movies: formatted, total: movies.length },
    });
  } catch (error) {
    throw error;
  }
}
