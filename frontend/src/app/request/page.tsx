'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function RequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general' as 'general' | 'movie_request' | 'feedback',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requests.create({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        type: form.type,
      });
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '', type: 'general' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-2xl">
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Submit a Request
      </motion.h1>
      <motion.p
        className="text-muted-foreground mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Request a movie to be added, send feedback, or get in touch. Submissions are reviewed in the admin panel.
      </motion.p>

      {submitted ? (
        <motion.div
          className="p-6 rounded-xl glass border border-neon-cyan/30 text-center"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-neon-cyan font-medium">Request submitted successfully.</p>
          <p className="text-muted-foreground text-sm mt-2">It will be reviewed soon.</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 text-sm text-neon-cyan hover:underline"
          >
            Submit another
          </button>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 rounded-xl glass border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div>
            <label className="block text-sm font-medium mb-2">Request type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
            >
              <option value="general">General inquiry</option>
              <option value="movie_request">Request a movie</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={200}
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              required
              maxLength={300}
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none"
              placeholder="Brief subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none resize-none"
              placeholder="Your request or message..."
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-neon-cyan text-background font-semibold hover:bg-neon-cyan/90 disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </motion.form>
      )}
    </div>
  );
}
