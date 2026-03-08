import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getCollections(_req: Request, res: Response) {
  const collections = await prisma.collection.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { movies: true } },
    },
  });

  res.json({
    success: true,
    data: collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      order: c.order,
      movieCount: c._count.movies,
    })),
  });
}

export async function getCollectionBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      movies: {
        orderBy: { order: 'asc' },
        include: {
          movie: {
            include: {
              category: true,
              genres: { include: { genre: true } },
              audioLanguages: { include: { audioLanguage: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      error: 'Collection not found',
    });
  }

  const movies = collection.movies.map((mc) => {
    const m = mc.movie;
    return {
      ...m,
      genre: m.genres.map((g) => g.genre.name),
      genres: undefined,
      audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
      audioLanguages: undefined,
      category: m.category
        ? { id: m.category.id, name: m.category.name, slug: m.category.slug }
        : null,
    };
  });

  res.json({
    success: true,
    data: {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      order: collection.order,
      movies,
    },
  });
}
