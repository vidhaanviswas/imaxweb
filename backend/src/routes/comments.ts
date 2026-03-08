import { Router } from 'express';
import { getComments, createComment } from '../controllers/comments';

export const commentsRouter = Router();

commentsRouter.get('/:movieId', getComments);
commentsRouter.post('/', createComment);
