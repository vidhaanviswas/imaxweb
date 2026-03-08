export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  releaseDate: Date;
  runtime: number | null;
  genre: string[];
  posterUrl: string | null;
  bannerUrl: string | null;
  trailerUrl: string | null;
  criticScore: number | null;
  audienceScore: number | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  cast?: CastMember[];
  reviews?: Review[];
  genres?: Genre[];
}

export interface CastMember {
  id: string;
  movieId: string;
  actorName: string;
  characterName: string | null;
}

export interface Review {
  id: string;
  movieId: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  approved: boolean;
  createdAt: Date;
}

export interface Genre {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
