import { Router } from 'express';
import { getGenres } from '../controllers/genres';

export const genresRouter = Router();

genresRouter.get('/', getGenres);
