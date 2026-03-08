import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMovieBody(req: Request, _res: Response, next: NextFunction) {
  const { title, description, releaseDate, runtime, genre, rating } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 1) {
    throw new AppError('Title is required', 400);
  }

  if (description !== undefined && typeof description !== 'string') {
    throw new AppError('Description must be a string', 400);
  }

  if (releaseDate !== undefined && isNaN(Date.parse(releaseDate))) {
    throw new AppError('Invalid release date', 400);
  }

  if (runtime !== undefined && (typeof runtime !== 'number' || runtime < 0)) {
    throw new AppError('Runtime must be a positive number', 400);
  }

  if (genre !== undefined && !Array.isArray(genre)) {
    throw new AppError('Genre must be an array', 400);
  }

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 10)) {
    throw new AppError('Rating must be between 1 and 10', 400);
  }

  next();
}

export function validateReviewBody(req: Request, _res: Response, next: NextFunction) {
  const { reviewerName, reviewText, rating } = req.body;

  if (!reviewerName || typeof reviewerName !== 'string' || reviewerName.trim().length < 1) {
    throw new AppError('Reviewer name is required', 400);
  }

  if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 1) {
    throw new AppError('Review text is required', 400);
  }

  if (typeof rating !== 'number' || rating < 0 || rating > 100) {
    throw new AppError('Rating must be between 0 and 100', 400);
  }

  next();
}
