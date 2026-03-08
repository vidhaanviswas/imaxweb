import { Router } from 'express';
import { getCollections, getCollectionBySlug } from '../controllers/collections';

export const collectionsRouter = Router();

collectionsRouter.get('/', getCollections);
collectionsRouter.get('/:slug', getCollectionBySlug);
