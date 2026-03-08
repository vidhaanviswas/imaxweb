import { Router } from 'express';
import { getCategories } from '../controllers/categories';

export const categoriesRouter = Router();

categoriesRouter.get('/', getCategories);
