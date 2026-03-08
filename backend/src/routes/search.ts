import { Router } from 'express';
import { search } from '../controllers/search';

export const searchRouter = Router();

searchRouter.get('/', search);
