'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, type AdminCollection } from '@/lib/api';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCollections = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    api.admin.collections
      .list(token)
      .then((res) => setCollections(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setCreating(true);
    try {
      await api.admin.collections.create(token, {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      });
      setCreateName('');
      setCreateDesc('');
      fetchCollections();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"?`)) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.collections.delete(token, id);
      setCollections((c) => c.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        Collections
      </h1>

      <form onSubmit={handleCreate} className="p-4 rounded-xl glass border border-white/10 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Collection name (e.g. Oscar Winners)"
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 focus:border-neon-cyan outline-none"
        />
        <input
          type="text"
          value={createDesc}
          onChange={(e) => setCreateDesc(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 focus:border-neon-cyan outline-none"
        />
        <button
          type="submit"
          disabled={creating || !createName.trim()}
          className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium hover:bg-neon-cyan/90 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-4 rounded-lg glass border border-white/10"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  /collection/{c.slug} · {c.movieCount ?? 0} movies
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/collections/${c.id}`}
                  className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/20 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">No collections yet. Create one above.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
