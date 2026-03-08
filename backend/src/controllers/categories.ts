import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { movies: true } },
    },
  });

  res.json({
    success: true,
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      order: c.order,
      movieCount: c._count.movies,
    })),
  });
}
