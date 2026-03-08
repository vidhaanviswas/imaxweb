'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Genre, type Category, type AudioLanguage } from '@/lib/api';

export default function AdminSettingsPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newGenre, setNewGenre] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAudioLanguage, setNewAudioLanguage] = useState('');
  const [audioLanguages, setAudioLanguages] = useState<AudioLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [audioLanguagesLoading, setAudioLanguagesLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.genres.list(token)
      .then((res) => setGenres(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.categories.list(token)
      .then((res) => setCategories(res.data))
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.audioLanguages.list(token)
      .then((res) => setAudioLanguages(res.data))
      .catch(console.error)
      .finally(() => setAudioLanguagesLoading(false));
  }, []);

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenre.trim()) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await api.admin.genres.create(token, newGenre.trim());
      setGenres((g) => [...g, res.data]);
      setNewGenre('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add genre');
    }
  };

  const handleDeleteGenre = async (id: string) => {
    if (!confirm('Delete this genre?')) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.genres.delete(token, id);
      setGenres((g) => g.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await api.admin.categories.create(token, newCategory.trim());
      setCategories((c) => [...c, res.data]);
      setNewCategory('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.categories.delete(token, id);
      setCategories((c) => c.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleAddAudioLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudioLanguage.trim()) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await api.admin.audioLanguages.create(token, newAudioLanguage.trim());
      setAudioLanguages((a) => [...a, res.data]);
      setNewAudioLanguage('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add audio language');
    }
  };

  const handleDeleteAudioLanguage = async (id: string) => {
    if (!confirm('Delete this audio language?')) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.audioLanguages.delete(token, id);
      setAudioLanguages((a) => a.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        Settings
      </h1>

      <section>
        <h2 className="text-xl font-bold mb-4">Genres</h2>
        <form onSubmit={handleAddGenre} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="New genre name"
            className="flex-1 px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
          <button
            type="submit"
            disabled={!newGenre.trim()}
            className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <div className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            genres.map((g) => (
              <div
                key={g.id}
                className="flex justify-between items-center p-3 rounded-lg glass"
              >
                <span>{g.name}</span>
                <button
                  onClick={() => handleDeleteGenre(g.id)}
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Origin/format (e.g. Hollywood, Bollywood, Anime, Series).
        </p>
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-purple outline-none"
          />
          <button
            type="submit"
            disabled={!newCategory.trim()}
            className="px-4 py-2 rounded-lg bg-neon-purple text-background font-medium disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <div className="space-y-2">
          {categoriesLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center p-3 rounded-lg glass"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Audio Languages</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Languages available for movies (e.g. English, Hindi, Japanese).
        </p>
        <form onSubmit={handleAddAudioLanguage} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAudioLanguage}
            onChange={(e) => setNewAudioLanguage(e.target.value)}
            placeholder="New audio language"
            className="flex-1 px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
          />
          <button
            type="submit"
            disabled={!newAudioLanguage.trim()}
            className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <div className="space-y-2">
          {audioLanguagesLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            audioLanguages.map((al) => (
              <div
                key={al.id}
                className="flex justify-between items-center p-3 rounded-lg glass"
              >
                <span>{al.name}</span>
                <button
                  onClick={() => handleDeleteAudioLanguage(al.id)}
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
