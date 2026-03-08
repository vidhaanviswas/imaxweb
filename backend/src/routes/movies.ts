import { Router } from 'express';
import { getMovies, getMovieBySlug } from '../controllers/movies';

export const moviesRouter = Router();

moviesRouter.get('/', getMovies);
moviesRouter.get('/:slug', getMovieBySlug);
