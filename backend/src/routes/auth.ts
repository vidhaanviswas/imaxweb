import { Router } from 'express';
import { login } from '../controllers/auth';

export const authRouter = Router();

authRouter.post('/login', login);
