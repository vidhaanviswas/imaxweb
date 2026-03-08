import { Router } from 'express';
import { getAudioLanguages } from '../controllers/audioLanguages';

export const audioLanguagesRouter = Router();

audioLanguagesRouter.get('/', getAudioLanguages);
