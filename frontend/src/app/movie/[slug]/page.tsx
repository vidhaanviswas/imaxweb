'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, type Movie, type Review, type MovieComment } from '@/lib/api';

type StoredMovie = {
  id: string;
  slug: string;
  title: string;
  posterUrl: string | null;
  rating: number | null;
};

function ReviewsSection({
  reviews,
  movieId,
  helpfulVoted,
  onHelpfulVote,
}: {
  reviews: Review[];
  movieId: string;
  helpfulVoted: Set<string>;
  onHelpfulVote: (id: string) => void;
}) {
  const criticReviews = reviews.filter((r) => r.origin === 'CURATED');
  const userReviews = reviews.filter((r) => r.origin === 'USER' || !r.origin);

  const renderReview = (r: Review) => (
    <div key={r.id} className="p-4 rounded-lg glass">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium">{r.reviewerName}</span>
        <span className="text-neon-cyan">{(r.rating / 10).toFixed(1)} / 10</span>
      </div>
      {r.source && (
        <p className="text-xs text-muted-foreground mb-1">{r.source}</p>
      )}
      {r.reviewText && (
        <p className="text-muted-foreground text-sm">{r.reviewText}</p>
      )}
      {r.origin === 'USER' && r.reviewText && (
        <button
          type="button"
          onClick={() => {
            if (helpfulVoted.has(r.id)) return;
            api.reviews.markHelpful(r.id).then(() => onHelpfulVote(r.id)).catch(console.error);
          }}
          disabled={helpfulVoted.has(r.id)}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>👍</span>
          <span>{(r.helpfulCount ?? 0) > 0 ? `${r.helpfulCount} people found this helpful` : 'Helpful?'}</span>
        </button>
      )}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {criticReviews.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Critic Reviews</h2>
          <div className="space-y-4">{criticReviews.map(renderReview)}</div>
        </div>
      )}
      {userReviews.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">User Reviews</h2>
          <div className="space-y-4">{userReviews.map(renderReview)}</div>
        </div>
      )}
    </motion.section>
  );
}

function CommentsSection({
  comments,
  movieId,
  onNewComment,
  onNewReply,
}: {
  comments: MovieComment[];
  movieId: string;
  onNewComment: (comment: MovieComment) => void;
  onNewReply: (parentId: string, reply: MovieComment) => void;
}) {
  const [form, setForm] = useState({ authorName: '', content: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({ authorName: '', content: '' });
  const [replyLoading, setReplyLoading] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.55 }}
    >
      <h2 className="text-xl font-bold mb-4">Discussion</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setLoading(true);
          try {
            const res = await api.comments.create({
              movieId,
              authorName: form.authorName.trim(),
              content: form.content.trim(),
            });
            onNewComment(res.data);
            setForm({ authorName: '', content: '' });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to post');
          } finally {
            setLoading(false);
          }
        }}
        className="mb-6 space-y-3"
      >
        <input
          type="text"
          value={form.authorName}
          onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
          required
          maxLength={200}
          placeholder="Your name"
          className="w-full px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none text-sm"
        />
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          required
          minLength={1}
          maxLength={2000}
          rows={3}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-2 rounded-lg glass border border-white/10 focus:border-neon-cyan outline-none resize-none text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium hover:bg-neon-cyan/90 disabled:opacity-50 text-sm"
        >
          {loading ? 'Posting...' : 'Post comment'}
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comments yet. Start the discussion!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-4 rounded-lg glass">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{c.content}</p>
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="mt-2 text-xs text-neon-cyan hover:underline"
              >
                {replyingTo === c.id ? 'Cancel' : 'Reply'}
              </button>

              {replyingTo === c.id && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setReplyLoading(true);
                    try {
                      const res = await api.comments.create({
                        movieId,
                        authorName: replyForm.authorName.trim(),
                        content: replyForm.content.trim(),
                        parentId: c.id,
                      });
                      onNewReply(c.id, res.data);
                      setReplyingTo(null);
                      setReplyForm({ authorName: '', content: '' });
                    } catch { /* show error */ } finally {
                      setReplyLoading(false);
                    }
                  }}
                  className="mt-3 pt-3 border-t border-white/10 space-y-2"
                >
                  <input
                    type="text"
                    value={replyForm.authorName}
                    onChange={(e) => setReplyForm((f) => ({ ...f, authorName: e.target.value }))}
                    required
                    placeholder="Your name"
                    className="w-full px-3 py-1.5 rounded-lg bg-background/50 border border-white/10 text-sm"
                  />
                  <textarea
                    value={replyForm.content}
                    onChange={(e) => setReplyForm((f) => ({ ...f, content: e.target.value }))}
                    required
                    rows={2}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-1.5 rounded-lg bg-background/50 border border-white/10 text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="px-3 py-1.5 rounded-lg bg-neon-cyan/80 text-background text-sm"
                  >
                    Reply
                  </button>
                </form>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-2">
                  {c.replies.map((reply) => (
                    <div key={reply.id} className="py-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{reply.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.section>
  );
}

export default function MoviePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 70 });
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [commentForm, setCommentForm] = useState({ authorName: '', content: '' });
  const [commentError, setCommentError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({ authorName: '', content: '' });
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.movies.bySlug(slug)
      .then((res) => setMovie(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('helpful_voted');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setHelpfulVoted(new Set(ids));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!movie) return;
    if (typeof window === 'undefined') return;

    try {
      const rawWatchlist = localStorage.getItem('watchlist');
      const parsedWatchlist: StoredMovie[] = rawWatchlist ? JSON.parse(rawWatchlist) : [];
      const inList = parsedWatchlist.some((m) => m.id === movie.id);
      setIsInWatchlist(inList);

      const entry: StoredMovie = {
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
      };

      // Update watchlist entry details (title/poster/rating) if it already exists
      if (inList) {
        const updated = parsedWatchlist.map((m) => (m.id === movie.id ? entry : m));
        localStorage.setItem('watchlist', JSON.stringify(updated));
      }

      // Recently viewed list
      const rawRecent = localStorage.getItem('recently_viewed');
      const parsedRecent: StoredMovie[] = rawRecent ? JSON.parse(rawRecent) : [];
      const filtered = parsedRecent.filter((m) => m.id !== movie.id);
      const nextRecent = [entry, ...filtered].slice(0, 20);
      localStorage.setItem('recently_viewed', JSON.stringify(nextRecent));
    } catch {
      // Ignore localStorage errors
    }
  }, [movie]);

  useEffect(() => {
    if (!movie) return;

    setSimilarLoading(true);
    api.movies
      .list({
        genre: movie.genre?.[0],
        category: movie.category?.slug,
      })
      .then((res) => {
        const sims = res.data.movies
          .filter((m) => m.id !== movie.id)
          .slice(0, 8);
        setSimilarMovies(sims);
      })
      .catch(console.error)
      .finally(() => setSimilarLoading(false));
  }, [movie]);

  const toggleWatchlist = () => {
    if (!movie) return;
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('watchlist');
      const current: StoredMovie[] = raw ? JSON.parse(raw) : [];
      const exists = current.some((m) => m.id === movie.id);
      let next: StoredMovie[];

      if (exists) {
        next = current.filter((m) => m.id !== movie.id);
        setIsInWatchlist(false);
      } else {
        const entry: StoredMovie = {
          id: movie.id,
          slug: movie.slug,
          title: movie.title,
          posterUrl: movie.posterUrl,
          rating: movie.rating,
        };
        next = [entry, ...current];
        setIsInWatchlist(true);
      }

      localStorage.setItem('watchlist', JSON.stringify(next));
    } catch {
      // Ignore localStorage errors
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Link href="/" className="text-neon-cyan hover:underline">Back to Home</Link>
      </div>
    );
  }

  const trailerId = movie.trailerUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];

  return (
    <div>
      {/* Cinematic header */}
      <section className="relative h-[50vh] min-h-[320px] sm:h-[55vh] sm:min-h-[380px] md:h-[60vh] md:min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          {movie.bannerUrl ? (
            <Image
              src={movie.bannerUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-purple/40 via-background to-neon-cyan/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 h-full flex flex-col sm:flex-row gap-4 sm:gap-8 items-end pb-8 sm:pb-12">
          <motion.div
            className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-end w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-shrink-0 w-32 sm:w-40 md:w-48 lg:w-56 aspect-[2/3] rounded-xl overflow-hidden glass shadow-2xl mx-auto sm:mx-0">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  width={224}
                  height={336}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">🎬</div>
              )}
            </div>
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {movie.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/80 mb-4">
                {movie.releaseDate && (
                  <span>{new Date(movie.releaseDate).getFullYear()}</span>
                )}
                {movie.runtime && (
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                )}
                {movie.director && (
                  <span>Directed by {movie.director}</span>
                )}
              </div>
              {movie.rating != null && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 shadow-lg">
                    <span className="text-sm text-amber-400">★</span>
                    <span className="text-sm font-semibold text-amber-300">
                      {movie.rating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-white/70">/ 10</span>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={toggleWatchlist}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    isInWatchlist
                      ? 'bg-neon-cyan text-background border-neon-cyan hover:bg-neon-cyan/90'
                      : 'bg-black/60 text-white border-white/20 hover:bg-white/10'
                  }`}
                >
                  {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window === 'undefined') return;
                    const shareUrl = window.location.href;
                    const text = `Check out ${movie.title} on AK IMAX`;

                    const copyToClipboard = () => {
                      const ta = document.createElement('textarea');
                      ta.value = shareUrl;
                      ta.setAttribute('readonly', '');
                      ta.style.position = 'fixed';
                      ta.style.left = '-9999px';
                      ta.style.top = '0';
                      ta.style.opacity = '0';
                      document.body.appendChild(ta);
                      ta.focus();
                      ta.select();
                      ta.setSelectionRange(0, shareUrl.length);
                      const ok = document.execCommand('copy');
                      document.body.removeChild(ta);
                      if (ok) {
                        setShareFeedback('Link copied!');
                        setTimeout(() => setShareFeedback(null), 2000);
                      } else if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          setShareFeedback('Link copied!');
                          setTimeout(() => setShareFeedback(null), 2000);
                        }).catch(() => {});
                      }
                    };

                    if (typeof navigator.share === 'function') {
                      try {
                        await navigator.share({
                          title: movie.title,
                          text,
                          url: shareUrl,
                        });
                        setShareFeedback('Shared!');
                        setTimeout(() => setShareFeedback(null), 2000);
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          copyToClipboard();
                        }
                      }
                    } else {
                      copyToClipboard();
                    }
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-white/20 bg-black/50 text-white hover:bg-white/10 transition relative"
                >
                  {shareFeedback || 'Share'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {(movie.category || (movie.genre && movie.genre.length > 0) || (movie.audioLanguage && movie.audioLanguage.length > 0)) && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex flex-wrap gap-2">
                  {movie.category && (
                    <Link
                      href={`/category/${movie.category.slug}`}
                      className="px-2 py-1 rounded text-xs font-medium bg-neon-purple/30 text-neon-purple border border-neon-purple/50 hover:bg-neon-purple/50 transition"
                    >
                      {movie.category.name}
                    </Link>
                  )}
                  {movie.genre?.map((g) => (
                    <Link
                      key={g}
                      href={`/genre/${g.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-2 py-1 rounded text-xs font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 transition"
                    >
                      {g}
                    </Link>
                  ))}
                  {movie.audioLanguage?.map((al) => (
                    <span
                      key={al}
                      className="px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    >
                      {al}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {movie.description && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
              </motion.section>
            )}

            {trailerId && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-bold mb-4">Trailer</h2>
                <div className="aspect-video rounded-xl overflow-hidden glass">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerId}`}
                    title="Trailer"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </motion.section>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold mb-4">Cast</h2>
                <div className="flex flex-wrap gap-4">
                  {movie.cast.map((c) => (
                    <div
                      key={`${c.actorName}-${c.characterName}`}
                      className="px-4 py-2 rounded-lg glass"
                    >
                      <span className="font-medium">{c.actorName}</span>
                      {c.characterName && (
                        <span className="text-muted-foreground text-sm block">{c.characterName}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {movie.reviews && movie.reviews.length > 0 && (
              <ReviewsSection
                reviews={movie.reviews}
                movieId={movie.id}
                helpfulVoted={helpfulVoted}
                onHelpfulVote={(id) => {
                  setHelpfulVoted((prev) => {
                    const next = new Set(prev);
                    next.add(id);
                    try {
                      localStorage.setItem('helpful_voted', JSON.stringify(Array.from(next)));
                    } catch { /* ignore */ }
                    return next;
                  });
                  setMovie((m) => m ? {
                    ...m,
                    reviews: m.reviews?.map((r) =>
                      r.id === id ? { ...r, helpfulCount: (r.helpfulCount ?? 0) + 1 } : r
                    ) ?? [],
                  } : null);
                }}
              />
            )}

            {/* Comments / Discussion */}
            <CommentsSection
              comments={movie.comments ?? []}
              movieId={movie.id}
              onNewComment={(comment) => {
                setMovie((m) => m ? {
                  ...m,
                  comments: m.comments ? [comment as MovieComment, ...m.comments] : [comment as MovieComment],
                } : null);
              }}
              onNewReply={(parentId, reply) => {
                setMovie((m) => {
                  if (!m?.comments) return m;
                  return {
                    ...m,
                    comments: m.comments.map((c) =>
                      c.id === parentId
                        ? { ...c, replies: [...(c.replies ?? []), reply as MovieComment] }
                        : c
                    ),
                  };
                });
              }}
            />

            {!similarLoading && similarMovies.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <h2 className="text-xl font-bold mb-4">More like this</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {similarMovies.map((m) => (
                    <Link
                      key={m.id}
                      href={`/movie/${m.slug}`}
                      className="group rounded-lg overflow-hidden glass hover:bg-white/5 transition flex flex-col"
                    >
                      <div className="relative w-full aspect-[2/3] bg-muted overflow-hidden">
                        {m.posterUrl ? (
                          <Image
                            src={m.posterUrl}
                            alt={m.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎬
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <p className="text-sm font-medium line-clamp-2">{m.title}</p>
                        {m.rating != null && (
                          <p className="mt-1 text-xs text-amber-300">
                            {m.rating.toFixed(1)} ★
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.aside
              className="sticky top-24 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Details
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {movie.rating != null && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-2xl">★</span>
                      <div>
                        <p className="text-xs font-medium text-amber-400/90 uppercase tracking-wider">Rating</p>
                        <p className="text-lg font-bold text-amber-300">{movie.rating.toFixed(1)} / 10</p>
                      </div>
                    </div>
                  )}
                  {movie.releaseDate && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">📅</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Release Date</p>
                        <p className="font-medium">{new Date(movie.releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  {movie.runtime && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center text-neon-purple">⏱</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Runtime</p>
                        <p className="font-medium">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</p>
                      </div>
                    </div>
                  )}
                  {movie.director && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">🎬</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Director</p>
                        <p className="font-medium">{movie.director}</p>
                      </div>
                    </div>
                  )}
                  {movie.genre && movie.genre.length > 0 && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center text-neon-purple">🎭</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Genres</p>
                        <p className="font-medium">{movie.genre.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {movie.audioLanguage && movie.audioLanguage.length > 0 && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">🔊</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio</p>
                        <p className="font-medium">{movie.audioLanguage.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {movie.whereToWatch && (
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">▶</span>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Where to watch</p>
                        <p className="font-medium text-sm whitespace-pre-line">{movie.whereToWatch}</p>
                      </div>
                    </div>
                  )}
                  {movie.officialSite && (
                    <div className="pt-2">
                      <a
                        href={movie.officialSite}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/40 transition"
                      >
                        <span>🔗</span>
                        <span className="text-sm font-medium truncate">Official Website</span>
                        <span className="ml-auto shrink-0">↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Rate form */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Rate
                  </h3>
                </div>
                <div className="p-5">
                  {reviewSubmitted ? (
                    <p className="text-neon-cyan text-sm">Thanks! Your rating has been submitted and will appear after approval.</p>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setReviewError('');
                        setReviewLoading(true);
                        try {
                          await api.reviews.create({
                            movieId: movie.id,
                            reviewerName: reviewForm.reviewerName.trim(),
                            rating: reviewForm.rating,
                          });
                          setReviewSubmitted(true);
                          setReviewForm({ reviewerName: '', rating: 70 });
                        } catch (err) {
                          setReviewError(err instanceof Error ? err.message : 'Failed to submit');
                        } finally {
                          setReviewLoading(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Your name</label>
                        <input
                          type="text"
                          value={reviewForm.reviewerName}
                          onChange={(e) => setReviewForm((f) => ({ ...f, reviewerName: e.target.value }))}
                          required
                          maxLength={200}
                          className="w-full px-3 py-2 rounded-lg bg-background/50 border border-white/10 focus:border-neon-cyan outline-none text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rating (1–10 stars)</label>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm((f) => ({ ...f, rating: star * 10 }))}
                                className={`px-0.5 text-lg transition-colors ${
                                  reviewForm.rating >= star * 10
                                    ? 'text-amber-400'
                                    : 'text-white/30 hover:text-amber-300'
                                }`}
                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {(reviewForm.rating / 10).toFixed(1)} / 10
                          </span>
                        </div>
                      </div>
                      {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}
                      <button
                        type="submit"
                        disabled={reviewLoading}
                        className="w-full px-4 py-2 rounded-lg bg-neon-cyan text-background font-medium hover:bg-neon-cyan/90 disabled:opacity-50 text-sm"
                      >
                        {reviewLoading ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.aside>
          </div>
        </div>
      </div>
    </div>
  );
}
