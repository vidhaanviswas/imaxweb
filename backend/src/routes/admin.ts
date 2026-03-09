import { Router } from 'express';
import {
  getDashboardStats,
  createMovie,
  updateMovie,
  deleteMovie,
  importMovieFromOmdb,
  addReview,
  approveReview,
  getReviews,
  deleteReview,
  getGenres,
  createGenre,
  deleteGenre,
  getCategories,
  createCategory,
  deleteCategory,
  getAudioLanguages,
  createAudioLanguage,
  deleteAudioLanguage,
  getAdminCollections,
  getAdminCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  uploadPoster,
  getAllAdminMovies,
  getMovieById,
  getRequests,
  updateRequestStatus,
  importMoviesFromCsv,
} from '../controllers/admin';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { upload } from '../utils/upload';

export const adminRouter = Router();

// All admin routes require auth
adminRouter.use(authMiddleware);
adminRouter.use(adminOnly);

// Dashboard
adminRouter.get('/dashboard', getDashboardStats);

// Movies CRUD (import-csv before :id so it's not captured)
adminRouter.get('/movies', getAllAdminMovies);
adminRouter.post('/movies/import-csv', importMoviesFromCsv);
adminRouter.post('/movies/from-omdb', importMovieFromOmdb);
adminRouter.get('/movies/:id', getMovieById);
adminRouter.post('/movies', createMovie);
adminRouter.put('/movies/:id', updateMovie);
adminRouter.delete('/movies/:id', deleteMovie);
// File upload (returns URL for use in movie poster/banner)
adminRouter.post('/upload', upload.single('file'), uploadPoster);

// Reviews
adminRouter.get('/reviews', getReviews);
adminRouter.post('/reviews', addReview);
adminRouter.put('/reviews/:id/approve', approveReview);
adminRouter.delete('/reviews/:id', deleteReview);

// Genres
adminRouter.get('/genres', getGenres);
adminRouter.post('/genres', createGenre);
adminRouter.delete('/genres/:id', deleteGenre);

// Categories
adminRouter.get('/categories', getCategories);
adminRouter.post('/categories', createCategory);
adminRouter.delete('/categories/:id', deleteCategory);

// Audio languages
adminRouter.get('/audio-languages', getAudioLanguages);
adminRouter.post('/audio-languages', createAudioLanguage);
adminRouter.delete('/audio-languages/:id', deleteAudioLanguage);

// Collections
adminRouter.get('/collections', getAdminCollections);
adminRouter.get('/collections/:id', getAdminCollectionById);
adminRouter.post('/collections', createCollection);
adminRouter.put('/collections/:id', updateCollection);
adminRouter.delete('/collections/:id', deleteCollection);

// User requests
adminRouter.get('/requests', getRequests);
adminRouter.put('/requests/:id', updateRequestStatus);
