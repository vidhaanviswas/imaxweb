import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { authRouter } from './routes/auth';
import { moviesRouter } from './routes/movies';
import { reviewsRouter } from './routes/reviews';
import { commentsRouter } from './routes/comments';
import { searchRouter } from './routes/search';
import { genresRouter } from './routes/genres';
import { categoriesRouter } from './routes/categories';
import { collectionsRouter } from './routes/collections';
import { audioLanguagesRouter } from './routes/audioLanguages';
import { requestsRouter } from './routes/requests';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many login attempts' },
});
app.use('/api/admin/login', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/admin', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/search', searchRouter);
app.use('/api/genres', genresRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/audio-languages', audioLanguagesRouter);
app.use('/api/requests', requestsRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
