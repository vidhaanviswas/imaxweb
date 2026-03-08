import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { generateSlug } from '../utils/slug';

function collectionSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
import { upload } from '../utils/upload';

const createMovieSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  releaseDate: z.string(),
  runtime: z.number().optional(),
  director: z.string().optional(),
  posterUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  trailerUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(10).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  whereToWatch: z.string().optional(),
  officialSite: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().optional().nullable(),
  genreIds: z.array(z.string()).optional(),
  audioLanguageIds: z.array(z.string()).optional(),
  cast: z.array(z.object({
    actorName: z.string(),
    characterName: z.string().optional(),
  })).optional(),
});

const updateMovieSchema = createMovieSchema.partial();

const createReviewSchema = z.object({
  movieId: z.string(),
  reviewerName: z.string().min(1),
  reviewText: z.string().min(1),
  rating: z.number().min(0).max(100),
  source: z.string().optional(),
});

const importCsvSchema = z.object({
  csv: z.string().min(1),
  defaultCategoryId: z.string().optional(),
});

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(','); // simple CSV, no quoted commas
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

export async function getDashboardStats(_req: Request, res: Response) {
  const [totalMovies, topRated, latestMovies, totalReviews, pendingReviews, topViewed, topSearches, topCategories] =
    await Promise.all([
      prisma.movie.count(),
      prisma.movie.findMany({
        take: 5,
        orderBy: { rating: 'desc' },
        where: { rating: { not: null }, published: true },
        include: { category: true, genres: { include: { genre: true } }, audioLanguages: { include: { audioLanguage: true } } },
      }),
      prisma.movie.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { published: true },
        include: { category: true, genres: { include: { genre: true } }, audioLanguages: { include: { audioLanguage: true } } },
      }),
      prisma.review.count(),
      prisma.review.count({ where: { approved: false } }),
      prisma.movie.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        where: { viewCount: { gt: 0 } },
        include: { category: true },
      }),
      prisma.searchQuery.findMany({
        take: 10,
        orderBy: { count: 'desc' },
      }),
      prisma.category.findMany({
        take: 5,
        orderBy: { movies: { _count: 'desc' } },
        include: { _count: { select: { movies: true } } },
      }),
    ]);

  res.json({
    success: true,
    data: {
      totalMovies,
      totalReviews,
      pendingReviews,
      topRated: topRated.map((m) => ({
        ...m,
        genre: m.genres.map((g) => g.genre.name),
        audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
        category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
      })),
      latestMovies: latestMovies.map((m) => ({
        ...m,
        genre: m.genres.map((g) => g.genre.name),
        audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
        category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
      })),
      topViewed: topViewed.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        viewCount: m.viewCount,
        category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
      })),
      topSearches: topSearches.map((s) => ({
        query: s.query,
        count: s.count,
        lastSearched: s.lastSearched,
      })),
      topCategories: topCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        movieCount: c._count.movies,
      })),
    },
  });
}

export async function createMovie(req: Request, res: Response) {
  const body = createMovieSchema.parse(req.body);
  const slug = generateSlug(body.title);

  const existing = await prisma.movie.findUnique({ where: { slug } });
  if (existing) {
    throw new AppError('Movie with this title already exists', 400);
  }

  const movie = await prisma.movie.create({
    data: {
      title: body.title,
      slug,
      description: body.description ?? null,
      releaseDate: new Date(body.releaseDate),
      runtime: body.runtime ?? null,
      director: body.director ?? null,
      posterUrl: body.posterUrl ?? null,
      bannerUrl: body.bannerUrl ?? null,
      trailerUrl: body.trailerUrl || null,
      rating: body.rating ?? null,
      featured: body.featured ?? false,
      published: body.published ?? true,
      whereToWatch: body.whereToWatch ?? null,
      officialSite: body.officialSite || null,
      categoryId: body.categoryId ?? null,
      genres: body.genreIds?.length
        ? { create: body.genreIds.map((g) => ({ genreId: g })) }
        : undefined,
      audioLanguages: body.audioLanguageIds?.length
        ? { create: body.audioLanguageIds.map((id) => ({ audioLanguageId: id })) }
        : undefined,
      cast: body.cast?.length
        ? {
            create: body.cast.map((c, i) => ({
              actorName: c.actorName,
              characterName: c.characterName ?? null,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      genres: { include: { genre: true } },
      audioLanguages: { include: { audioLanguage: true } },
      cast: true,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...movie,
      genre: movie.genres.map((g) => g.genre.name),
      audioLanguage: movie.audioLanguages.map((a) => a.audioLanguage.name),
      category: movie.category ? { id: movie.category.id, name: movie.category.name, slug: movie.category.slug } : null,
    },
  });
}

export async function updateMovie(req: Request, res: Response) {
  const { id } = req.params;
  const body = updateMovieSchema.parse(req.body);

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Movie not found', 404);
  }

  const slug = body.title ? generateSlug(body.title) : undefined;
  if (slug && slug !== existing.slug) {
    const duplicate = await prisma.movie.findUnique({ where: { slug } });
    if (duplicate) throw new AppError('Movie with this title already exists', 400);
  }

  if (body.genreIds !== undefined) {
    await prisma.movieGenre.deleteMany({ where: { movieId: id } });
  }

  if (body.audioLanguageIds !== undefined) {
    await prisma.movieAudioLanguage.deleteMany({ where: { movieId: id } });
  }

  if (body.cast !== undefined) {
    await prisma.castMember.deleteMany({ where: { movieId: id } });
  }

  const movie = await prisma.movie.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(slug && { slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.releaseDate && { releaseDate: new Date(body.releaseDate) }),
      ...(body.runtime !== undefined && { runtime: body.runtime }),
      ...(body.director !== undefined && { director: body.director }),
      ...(body.posterUrl !== undefined && { posterUrl: body.posterUrl }),
      ...(body.bannerUrl !== undefined && { bannerUrl: body.bannerUrl }),
      ...(body.trailerUrl !== undefined && { trailerUrl: body.trailerUrl || null }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.whereToWatch !== undefined && { whereToWatch: body.whereToWatch }),
      ...(body.officialSite !== undefined && { officialSite: body.officialSite || null }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      ...(body.genreIds?.length && {
        genres: {
          create: body.genreIds.map((g) => ({ genreId: g })),
        },
      }),
      ...(body.audioLanguageIds?.length && {
        audioLanguages: {
          create: body.audioLanguageIds.map((aid) => ({ audioLanguageId: aid })),
        },
      }),
      ...(body.cast?.length && {
        cast: {
          create: body.cast.map((c, i) => ({
            actorName: c.actorName,
            characterName: c.characterName ?? null,
            order: i,
          })),
        },
      }),
    },
    include: {
      category: true,
      genres: { include: { genre: true } },
      audioLanguages: { include: { audioLanguage: true } },
      cast: true,
    },
  });

  res.json({
    success: true,
    data: {
      ...movie,
      genre: movie.genres.map((g) => g.genre.name),
      audioLanguage: movie.audioLanguages.map((a) => a.audioLanguage.name),
      category: movie.category ? { id: movie.category.id, name: movie.category.name, slug: movie.category.slug } : null,
    },
  });
}

export async function deleteMovie(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Movie not found', 404);
  }

  await prisma.movie.delete({ where: { id } });
  res.json({ success: true, message: 'Movie deleted' });
}

export async function importMoviesFromCsv(req: Request, res: Response) {
  const body = importCsvSchema.parse(req.body);
  const rows = parseCsv(body.csv);

  if (!rows.length) {
    return res.status(400).json({ success: false, error: 'No rows found in CSV' });
  }

  let created = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const title = row.title || row.Title;
      const releaseDate = row.releaseDate || row.release_date || row.ReleaseDate;
      if (!title || !releaseDate) {
        errors.push(`Row ${index + 2}: missing title or releaseDate`);
        continue;
      }

      const slug = generateSlug(title);
      const existing = await prisma.movie.findUnique({ where: { slug } });
      if (existing) {
        errors.push(`Row ${index + 2}: movie with slug "${slug}" already exists, skipping`);
        continue;
      }

      let categoryId: string | null = null;
      const categorySlug = row.categorySlug || row.category || row.CategorySlug;
      if (categorySlug) {
        const cat = await prisma.category.findFirst({
          where: {
            OR: [
              { slug: categorySlug.toLowerCase() },
              { name: { equals: categorySlug, mode: 'insensitive' } },
            ],
          },
        });
        if (cat) categoryId = cat.id;
      } else if (body.defaultCategoryId) {
        categoryId = body.defaultCategoryId;
      }

      const rating = row.rating ? Number(row.rating) : undefined;
      const runtime = row.runtime ? Number(row.runtime) : undefined;

      await prisma.movie.create({
        data: {
          title,
          slug,
          description: row.description || row.overview || null,
          releaseDate: new Date(releaseDate),
          runtime: Number.isFinite(runtime || NaN) ? runtime : null,
          director: row.director || null,
          posterUrl: row.posterUrl || null,
          bannerUrl: row.bannerUrl || null,
          trailerUrl: row.trailerUrl || null,
          rating: Number.isFinite(rating || NaN) ? rating : null,
          featured: row.featured === 'true',
          published: (row.published ?? 'true') !== 'false',
          whereToWatch: row.whereToWatch || null,
          officialSite: row.officialSite || null,
          categoryId,
        },
      });
      created += 1;
    } catch (err) {
      errors.push(`Row ${index + 2}: ${(err as Error).message}`);
    }
  }

  res.json({
    success: true,
    data: {
      created,
      total: rows.length,
      errors,
    },
  });
}

export async function getMovieById(req: Request, res: Response) {
  const { id } = req.params;
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      category: true,
      genres: { include: { genre: true } },
      audioLanguages: { include: { audioLanguage: true } },
      cast: { orderBy: { order: 'asc' } },
    },
  });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({
    success: true,
    data: {
      ...movie,
      genre: movie.genres.map((g) => g.genre.name),
      audioLanguage: movie.audioLanguages.map((a) => a.audioLanguage.name),
      category: movie.category ? { id: movie.category.id, name: movie.category.name, slug: movie.category.slug } : null,
    },
  });
}

export async function getAllAdminMovies(req: Request, res: Response) {
  const { page = '1', limit = '20', search, published } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = Math.min(parseInt(limit as string) || 20, 200);

  const where: Record<string, unknown> =
    typeof search === 'string' && search.length
      ? {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' as const } },
            { slug: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

  if (published === 'true') where.published = true;
  if (published === 'false') where.published = false;

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        genres: { include: { genre: true } },
        audioLanguages: { include: { audioLanguage: true } },
        cast: { take: 3 },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.movie.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      movies: movies.map((m) => ({
        ...m,
        genre: m.genres.map((g) => g.genre.name),
        audioLanguage: m.audioLanguages.map((a) => a.audioLanguage.name),
        category: m.category ? { id: m.category.id, name: m.category.name, slug: m.category.slug } : null,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    },
  });
}

export async function addReview(req: Request, res: Response) {
  const body = createReviewSchema.parse(req.body);

  const movie = await prisma.movie.findUnique({ where: { id: body.movieId } });
  if (!movie) throw new AppError('Movie not found', 404);

  const review = await prisma.review.create({
    data: {
      movieId: body.movieId,
      reviewerName: body.reviewerName,
      reviewText: body.reviewText,
      rating: body.rating,
      source: body.source ?? null,
      approved: true,
      origin: 'CURATED',
    },
  });

  res.status(201).json({ success: true, data: review });
}

export async function getReviews(req: Request, res: Response) {
  const { movieId, approved } = req.query;

  const where: Record<string, unknown> = {};
  if (movieId) where.movieId = movieId;
  if (approved !== undefined) where.approved = approved === 'true';

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { movie: { select: { title: true, slug: true } } },
  });

  res.json({ success: true, data: reviews });
}

export async function approveReview(req: Request, res: Response) {
  const { id } = req.params;
  const review = await prisma.review.update({
    where: { id },
    data: { approved: true },
  });
  res.json({ success: true, data: review });
}

export async function deleteReview(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.review.delete({ where: { id } });
  res.json({ success: true, message: 'Review deleted' });
}

export async function getGenres(_req: Request, res: Response) {
  const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: genres });
}

export async function getCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  res.json({ success: true, data: categories });
}

export async function createCategory(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    throw new AppError('Category name is required', 400);
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const maxOrder = await prisma.category.findFirst({ orderBy: { order: 'desc' }, select: { order: true } });
  const category = await prisma.category.create({
    data: { name: name.trim(), slug, order: (maxOrder?.order ?? 0) + 1 },
  });
  res.status(201).json({ success: true, data: category });
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted' });
}

export async function createGenre(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    throw new AppError('Genre name is required', 400);
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const genre = await prisma.genre.create({
    data: { name: name.trim(), slug },
  });
  res.status(201).json({ success: true, data: genre });
}

export async function deleteGenre(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.genre.delete({ where: { id } });
  res.json({ success: true, message: 'Genre deleted' });
}

export async function getAudioLanguages(_req: Request, res: Response) {
  const languages = await prisma.audioLanguage.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: languages });
}

export async function createAudioLanguage(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    throw new AppError('Audio language name is required', 400);
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const language = await prisma.audioLanguage.create({
    data: { name: name.trim(), slug },
  });
  res.status(201).json({ success: true, data: language });
}

export async function deleteAudioLanguage(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.audioLanguage.delete({ where: { id } });
  res.json({ success: true, message: 'Audio language deleted' });
}

export async function uploadPoster(req: Request, res: Response) {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const baseUrl = process.env.API_URL || 'http://localhost:4000';
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url } });
}

export async function getRequests(req: Request, res: Response) {
  const { status, type, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = Math.min(parseInt(limit as string), 50);

  const where: Record<string, unknown> = {};
  if (status && typeof status === 'string') where.status = status;
  if (type && typeof type === 'string') where.type = type;

  const [requests, total] = await Promise.all([
    prisma.userRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userRequest.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      requests,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    },
  });
}

export async function updateRequestStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['pending', 'read', 'resolved'].includes(status)) {
    throw new AppError('Valid status required (pending, read, resolved)', 400);
  }
  const userRequest = await prisma.userRequest.update({
    where: { id },
    data: { status },
  });
  res.json({ success: true, data: userRequest });
}

export async function getAdminCollections(_req: Request, res: Response) {
  const collections = await prisma.collection.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { movies: true } } },
  });
  res.json({
    success: true,
    data: collections.map((c) => ({
      ...c,
      movieCount: c._count.movies,
    })),
  });
}

export async function getAdminCollectionById(req: Request, res: Response) {
  const { id } = req.params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      movies: { orderBy: { order: 'asc' }, include: { movie: true } },
    },
  });
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({
    success: true,
    data: {
      ...collection,
      movieIds: collection.movies.map((mc) => mc.movieId),
    },
  });
}

export async function createCollection(req: Request, res: Response) {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    throw new AppError('Collection name is required', 400);
  }
  const slug = collectionSlug(name.trim());
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) throw new AppError('Collection with this slug already exists', 400);
  const maxOrder = await prisma.collection.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const collection = await prisma.collection.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });
  res.status(201).json({ success: true, data: collection });
}

export async function updateCollection(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, movieIds } = req.body;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) throw new AppError('Collection not found', 404);

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name.trim();
    const slug = collectionSlug(name.trim());
    if (slug !== existing.slug) {
      const duplicate = await prisma.collection.findUnique({ where: { slug } });
      if (duplicate) throw new AppError('Collection with this slug already exists', 400);
      data.slug = slug;
    }
  }
  if (description !== undefined) data.description = description?.trim() || null;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.collection.update({ where: { id }, data });
    }
    if (Array.isArray(movieIds)) {
      await tx.movieCollection.deleteMany({ where: { collectionId: id } });
      if (movieIds.length > 0) {
        await tx.movieCollection.createMany({
          data: movieIds.map((movieId: string, i: number) => ({
            movieId,
            collectionId: id,
            order: i,
          })),
        });
      }
    }
  });

  const updated = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { movies: true } } },
  });
  res.json({ success: true, data: updated });
}

export async function deleteCollection(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.collection.delete({ where: { id } });
  res.json({ success: true, message: 'Collection deleted' });
}

export async function createAdminUser(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password required', 400);
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: 'ADMIN' },
  });
  res.status(201).json({
    success: true,
    data: { id: user.id, email: user.email, role: user.role },
  });
}
