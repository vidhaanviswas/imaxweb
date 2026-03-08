const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function clearAdminSessionAndRedirect() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  }
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && options?.headers && (options.headers as Record<string, string>)['Authorization']) {
      clearAdminSessionAndRedirect();
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export async function apiPost<T>(url: string, data: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) clearAdminSessionAndRedirect();
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export async function apiPut<T>(url: string, data: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) clearAdminSessionAndRedirect();
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export async function apiDelete<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) clearAdminSessionAndRedirect();
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export const api = {
  movies: {
    list: (params?: { page?: number; genre?: string; category?: string; audioLanguage?: string; featured?: boolean }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set('page', String(params.page));
      if (params?.genre) search.set('genre', params.genre);
      if (params?.category) search.set('category', params.category);
      if (params?.audioLanguage) search.set('audioLanguage', params.audioLanguage);
      if (params?.featured) search.set('featured', 'true');
      return fetcher<{ data: { movies: Movie[]; pagination: Pagination } }>(
        `/api/movies?${search}`
      );
    },
    bySlug: (slug: string) =>
      fetcher<{ data: Movie }>(`/api/movies/${slug}`),
  },
  search: (q: string) =>
    fetcher<{ data: { movies: Movie[]; total: number } }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),
  genres: () =>
    fetcher<{ data: Genre[] }>('/api/genres'),
  categories: () =>
    fetcher<{ data: Category[] }>('/api/categories'),
  collections: () =>
    fetcher<{ data: CollectionSummary[] }>('/api/collections'),
  collectionBySlug: (slug: string) =>
    fetcher<{ data: Collection }>(`/api/collections/${slug}`),
  audioLanguages: () =>
    fetcher<{ data: AudioLanguage[] }>('/api/audio-languages'),
  reviews: {
    list: (movieId: string) =>
      fetcher<{ data: Review[] }>(`/api/reviews/${movieId}`),
    create: (data: { movieId: string; reviewerName: string; reviewText?: string; rating: number; source?: string }) =>
      apiPost<{ data: Review }>('/api/reviews', data),
    markHelpful: (id: string) =>
      apiPut<{ data: Review }>(`/api/reviews/${id}/helpful`, {}),
  },
  comments: {
    list: (movieId: string) =>
      fetcher<{ data: MovieComment[] }>(`/api/comments/${movieId}`),
    create: (data: { movieId: string; authorName: string; content: string; parentId?: string }) =>
      apiPost<{ data: MovieComment }>('/api/comments', data),
  },
  requests: {
    create: (data: { name: string; email: string; subject: string; message: string; type?: 'general' | 'movie_request' | 'feedback' }) =>
      apiPost<{ success: boolean; message: string }>('/api/requests', data),
  },
  admin: {
    login: (email: string, password: string) =>
      apiPost<{ data: { token: string; user: User } }>('/api/admin/login', { email, password }),
    dashboard: (token: string) =>
      fetcher<{ data: DashboardStats }>('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    movies: {
      byId: (token: string, id: string) =>
        fetcher<{ data: Movie }>(`/api/admin/movies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      list: (token: string, params?: { page?: number; search?: string; limit?: number; published?: boolean }) => {
        const search = new URLSearchParams();
        if (params?.page) search.set('page', String(params.page));
        if (params?.search) search.set('search', params.search);
        if (params?.limit) search.set('limit', String(params.limit));
        if (params?.published !== undefined) search.set('published', String(params.published));
        return fetcher<{ data: { movies: Movie[]; pagination: Pagination } }>(
          `/api/admin/movies?${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },
      create: (token: string, data: CreateMovieInput) =>
        apiPost<{ data: Movie }>('/api/admin/movies', data, token),
      update: (token: string, id: string, data: Partial<CreateMovieInput>) =>
        apiPut<{ data: Movie }>(`/api/admin/movies/${id}`, data, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/movies/${id}`, token),
      importCsv: (token: string, data: { csv: string; defaultCategoryId?: string }) =>
        apiPost<{ data: { created: number; total: number; errors: string[] } }>('/api/admin/movies/import-csv', data, token),
    },
    upload: async (token: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && token) clearAdminSessionAndRedirect();
        throw new Error(json.error || 'Upload failed');
      }
      return json.data.url as string;
    },
    genres: {
      list: (token: string) =>
        fetcher<{ data: Genre[] }>('/api/admin/genres', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      create: (token: string, name: string) =>
        apiPost<{ data: Genre }>('/api/admin/genres', { name }, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/genres/${id}`, token),
    },
    categories: {
      list: (token: string) =>
        fetcher<{ data: Category[] }>('/api/admin/categories', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      create: (token: string, name: string) =>
        apiPost<{ data: Category }>('/api/admin/categories', { name }, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/categories/${id}`, token),
    },
    audioLanguages: {
      list: (token: string) =>
        fetcher<{ data: AudioLanguage[] }>('/api/admin/audio-languages', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      create: (token: string, name: string) =>
        apiPost<{ data: AudioLanguage }>('/api/admin/audio-languages', { name }, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/audio-languages/${id}`, token),
    },
    collections: {
      list: (token: string) =>
        fetcher<{ data: AdminCollection[] }>('/api/admin/collections', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      byId: (token: string, id: string) =>
        fetcher<{ data: AdminCollectionDetail }>(`/api/admin/collections/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      create: (token: string, data: { name: string; description?: string }) =>
        apiPost<{ data: AdminCollection }>('/api/admin/collections', data, token),
      update: (token: string, id: string, data: { name?: string; description?: string; movieIds?: string[] }) =>
        apiPut<{ data: AdminCollection }>(`/api/admin/collections/${id}`, data, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/collections/${id}`, token),
    },
    reviews: {
      list: (token: string, params?: { movieId?: string; approved?: boolean }) => {
        const search = new URLSearchParams();
        if (params?.movieId) search.set('movieId', params.movieId);
        if (params?.approved !== undefined) search.set('approved', String(params.approved));
        return fetcher<{ data: Review[] }>(
          `/api/admin/reviews?${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },
      add: (token: string, data: { movieId: string; reviewerName: string; reviewText: string; rating: number; source?: string }) =>
        apiPost<{ data: Review }>('/api/admin/reviews', data, token),
      approve: (token: string, id: string) =>
        apiPut<{ data: Review }>(`/api/admin/reviews/${id}/approve`, {}, token),
      delete: (token: string, id: string) =>
        apiDelete<{ message: string }>(`/api/admin/reviews/${id}`, token),
    },
    requests: {
      list: (token: string, params?: { page?: number; status?: string; type?: string }) => {
        const search = new URLSearchParams();
        if (params?.page) search.set('page', String(params.page));
        if (params?.status) search.set('status', params.status);
        if (params?.type) search.set('type', params.type);
        return fetcher<{ data: { requests: UserRequest[]; pagination: Pagination } }>(
          `/api/admin/requests?${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },
      updateStatus: (token: string, id: string, status: string) =>
        apiPut<{ data: UserRequest }>(`/api/admin/requests/${id}`, { status }, token),
    },
  },
};

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  releaseDate: string;
  runtime: number | null;
  genre: string[];
  audioLanguage?: string[];
  category?: { id: string; name: string; slug: string } | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  trailerUrl: string | null;
  director: string | null;
  rating: number | null;
  featured: boolean;
  published?: boolean;
  viewCount?: number;
  whereToWatch?: string | null;
  officialSite?: string | null;
  cast?: { actorName: string; characterName: string | null }[];
  reviews?: Review[];
  comments?: MovieComment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  order?: number;
  movieCount?: number;
}

export interface CollectionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  movieCount: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  movies: Movie[];
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  movieCount?: number;
}

export interface AdminCollectionDetail extends AdminCollection {
  movieIds: string[];
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  movieCount?: number;
}

export type ReviewOrigin = 'CURATED' | 'USER';

export interface Review {
  id: string;
  movieId: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  origin?: ReviewOrigin;
  source?: string | null;
  helpfulCount?: number;
  approved?: boolean;
  createdAt: string;
}

export interface MovieComment {
  id: string;
  movieId: string;
  authorName: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  replies?: MovieComment[];
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalMovies: number;
  totalReviews: number;
  pendingReviews: number;
  topRated: Movie[];
  latestMovies: Movie[];
  topViewed: { id: string; title: string; slug: string; viewCount: number; category: { id: string; name: string; slug: string } | null }[];
  topSearches: { query: string; count: number; lastSearched: string }[];
  topCategories: { id: string; name: string; slug: string; movieCount: number }[];
}

export interface UserRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieInput {
  title: string;
  description?: string;
  releaseDate: string;
  runtime?: number;
  director?: string;
  posterUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  rating?: number;
  featured?: boolean;
  published?: boolean;
  categoryId?: string | null;
  genreIds?: string[];
  audioLanguageIds?: string[];
  cast?: { actorName: string; characterName?: string }[];
  whereToWatch?: string;
  officialSite?: string;
}

export interface AudioLanguage {
  id: string;
  name: string;
  slug: string;
  movieCount?: number;
}
