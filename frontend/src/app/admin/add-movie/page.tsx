'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, type Genre, type Category, type AudioLanguage, type CreateMovieInput } from '@/lib/api';

export default function AddMoviePage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [audioLanguages, setAudioLanguages] = useState<AudioLanguage[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateMovieInput & { cast: { actorName: string; characterName: string }[] }>({
    title: '',
    description: '',
    releaseDate: new Date().toISOString().slice(0, 10),
    runtime: undefined,
    director: '',
    posterUrl: '',
    bannerUrl: '',
    trailerUrl: '',
    rating: undefined,
    featured: false,
    published: true,
    whereToWatch: '',
    officialSite: '',
    categoryId: null,
    genreIds: [],
    audioLanguageIds: [],
    cast: [{ actorName: '', characterName: '' }],
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    Promise.all([
      api.admin.genres.list(token).then((res) => setGenres(res.data)),
      api.admin.categories.list(token).then((res) => setCategories(res.data)),
      api.admin.audioLanguages.list(token).then((res) => setAudioLanguages(res.data)),
    ]).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    try {
      const payload: CreateMovieInput = {
        ...form,
        cast: form.cast.filter((c) => c.actorName.trim()).map((c) => ({
          actorName: c.actorName.trim(),
          characterName: c.characterName.trim() || undefined,
        })),
      };
      await api.admin.movies.create(token, payload);
      router.push('/admin/movies');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add movie');
    } finally {
      setLoading(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const url = await api.admin.upload(token, file);
      setForm((f) => ({ ...f, posterUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const url = await api.admin.upload(token, file);
      setForm((f) => ({ ...f, bannerUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const addCast = () => setForm((f) => ({ ...f, cast: [...f.cast, { actorName: '', characterName: '' }] }));
  const updateCast = (i: number, field: 'actorName' | 'characterName', v: string) => {
    setForm((f) => ({
      ...f,
      cast: f.cast.map((c, idx) => (idx === i ? { ...c, [field]: v } : c)),
    }));
  };
  const removeCast = (i: number) => {
    setForm((f) => ({ ...f, cast: f.cast.filter((_, idx) => idx !== i) }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl"
    >
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        Add Movie
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Release Date *</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg bg-background text-white border border-white/10 focus:border-neon-cyan outline-none date-red-icon"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Runtime (min)</label>
            <input
              type="number"
              value={form.runtime || ''}
              onChange={(e) => setForm((f) => ({ ...f, runtime: e.target.value ? parseInt(e.target.value) : undefined }))}
              min={1}
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Director</label>
          <input
            type="text"
            value={form.director || ''}
            onChange={(e) => setForm((f) => ({ ...f, director: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Where to watch</label>
            <textarea
              value={form.whereToWatch || ''}
              onChange={(e) => setForm((f) => ({ ...f, whereToWatch: e.target.value }))}
              rows={3}
              placeholder="e.g. Netflix (IN), Amazon Prime, Theatres"
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none resize-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Official site URL</label>
            <input
              type="url"
              value={form.officialSite || ''}
              onChange={(e) => setForm((f) => ({ ...f, officialSite: e.target.value }))}
              placeholder="https://www.officialsite.com"
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={form.categoryId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value || null }))}
            className="w-full px-4 py-3 rounded-lg bg-background text-white border border-white/10 focus:border-neon-cyan outline-none"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.genreIds?.includes(g.id)}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      genreIds: e.target.checked
                        ? [...(f.genreIds || []), g.id]
                        : (f.genreIds || []).filter((id) => id !== g.id),
                    }));
                  }}
                  className="rounded"
                />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audio Languages</label>
          <div className="flex flex-wrap gap-2">
            {audioLanguages.map((al) => (
              <label key={al.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.audioLanguageIds?.includes(al.id)}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      audioLanguageIds: e.target.checked
                        ? [...(f.audioLanguageIds || []), al.id]
                        : (f.audioLanguageIds || []).filter((id) => id !== al.id),
                    }));
                  }}
                  className="rounded"
                />
                <span>{al.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Poster</label>
            <input type="file" accept="image/*" onChange={handlePosterUpload} className="text-sm" />
            {form.posterUrl && <p className="text-xs text-green-400 mt-1">Uploaded</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Banner</label>
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="text-sm" />
            {form.bannerUrl && <p className="text-xs text-green-400 mt-1">Uploaded</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Trailer URL (YouTube)</label>
          <input
            type="url"
            value={form.trailerUrl || ''}
            onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Rating (IMDB style, 1–10 stars)</label>
          <select
            value={form.rating ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className="w-full px-4 py-3 rounded-lg bg-background text-white border border-white/10 focus:border-neon-cyan outline-none"
          >
            <option value="">No rating</option>
            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="rounded"
            />
            <span>Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published ?? true}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="rounded"
            />
            <span>Published (visible on site)</span>
          </label>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Cast</label>
            <button type="button" onClick={addCast} className="text-sm text-neon-cyan hover:underline">
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {form.cast.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Actor name"
                  value={c.actorName}
                  onChange={(e) => updateCast(i, 'actorName', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 text-sm"
                />
                <input
                  type="text"
                  placeholder="Character"
                  value={c.characterName}
                  onChange={(e) => updateCast(i, 'characterName', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 text-sm"
                />
                <button type="button" onClick={() => removeCast(i)} className="text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Movie'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg glass hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
