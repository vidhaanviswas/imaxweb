import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getAudioLanguages(_req: Request, res: Response) {
  const languages = await prisma.audioLanguage.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { movies: true } },
    },
  });

  res.json({
    success: true,
    data: languages.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      movieCount: l._count.movies,
    })),
  });
}
