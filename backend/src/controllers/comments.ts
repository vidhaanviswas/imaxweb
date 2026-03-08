import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createCommentSchema = z.object({
  movieId: z.string(),
  authorName: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function getComments(req: Request, res: Response) {
  try {
    const { movieId } = req.params;

    const comments = await prisma.movieComment.findMany({
      where: { movieId, approved: true, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          where: { approved: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    throw error;
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const body = createCommentSchema.parse(req.body);

    const movie = await prisma.movie.findUnique({
      where: { id: body.movieId },
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found',
      });
    }

    if (body.parentId) {
      const parent = await prisma.movieComment.findFirst({
        where: { id: body.parentId, movieId: body.movieId },
      });
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment not found',
        });
      }
    }

    const comment = await prisma.movieComment.create({
      data: {
        movieId: body.movieId,
        authorName: body.authorName.trim(),
        content: body.content.trim(),
        parentId: body.parentId ?? null,
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }
    throw error;
  }
}
