import { Router } from 'express';
import { createRequest } from '../controllers/requests';

export const requestsRouter = Router();

requestsRouter.post('/', createRequest);
