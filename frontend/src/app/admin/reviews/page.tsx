'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Review } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<(Review & { movie?: { title: string; slug: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    api.admin.reviews.list(token, { approved: filter === 'pending' ? false : undefined })
      .then((res) => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.reviews.approve(token, id);
      setReviews((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.reviews.delete(token, id);
      setReviews((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        Reviews
      </h1>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition ${filter === 'pending' ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass'}`}
        >
          All
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="p-4 rounded-xl glass border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium">{r.reviewerName}</span>
                {r.source && <span className="text-muted-foreground text-sm ml-2">({r.source})</span>}
              </div>
              <span className="text-neon-cyan">{r.rating}%</span>
            </div>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{r.reviewText}</p>
            {r.movie && (
              <p className="text-xs text-muted-foreground mb-2">Movie: {r.movie.title}</p>
            )}
            <div className="flex gap-2">
              {!r.approved && (
                <button
                  onClick={() => handleApprove(r.id)}
                  className="text-sm text-neon-cyan hover:underline"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => handleDelete(r.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No reviews</p>
        )}
      </div>
    </motion.div>
  );
}
