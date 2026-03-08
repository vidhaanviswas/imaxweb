import { Router } from 'express';
import { getReviews, createReview, markReviewHelpful } from '../controllers/reviews';

export const reviewsRouter = Router();

reviewsRouter.get('/:movieId', getReviews);
reviewsRouter.post('/', createReview);
reviewsRouter.put('/:id/helpful', markReviewHelpful);
