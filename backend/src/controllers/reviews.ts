import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { ReviewOrigin } from '@prisma/client';

const createReviewSchema = z.object({
  movieId: z.string(),
  reviewerName: z.string().min(1).max(200),
  reviewText: z.string().min(1).max(5000).optional(),
  rating: z.number().min(0).max(100),
  source: z.string().max(200).optional(),
});

export async function getReviews(req: Request, res: Response) {
  try {
    const { movieId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { movieId, approved: true },
      orderBy: [
        { origin: 'asc' }, // CURATED first (lexicographically before USER)
        { helpfulCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    throw error;
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    const body = createReviewSchema.parse(req.body);

    const movie = await prisma.movie.findUnique({
      where: { id: body.movieId },
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found',
      });
    }

    const review = await prisma.review.create({
      data: {
        movieId: body.movieId,
        reviewerName: body.reviewerName,
        reviewText: body.reviewText ?? null,
        rating: body.rating,
        source: body.source,
        approved: false,
        origin: ReviewOrigin.USER,
      },
    });

    res.status(201).json({ success: true, data: review });
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

export async function markReviewHelpful(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });

    res.json({ success: true, data: review });
  } catch (error) {
    throw error;
  }
}
