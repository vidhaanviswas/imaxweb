'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { api, type Category, type CollectionSummary } from '@/lib/api';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/trending', label: 'Trending' },
  { href: '/top-rated', label: 'Top Rated' },
  { href: '/search', label: 'Search' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/request', label: 'Request' },
];

export function Header() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [moviesOpen, setMoviesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoviesOpen, setMobileMoviesOpen] = useState(false);

  useEffect(() => {
    api.categories()
      .then((res) => setCategories(res.data))
      .catch(console.error);
  }, []);
  useEffect(() => {
    api.collections()
      .then((res) => setCollections(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoviesOpen(false);
    setMobileMoviesOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  const isMoviesActive = (pathname?.startsWith('/category/') || pathname?.startsWith('/collection/')) ?? false;

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      className={`relative block py-2 text-base font-medium transition-colors md:py-0 md:inline-block md:text-sm ${
        pathname === href ? 'text-neon-cyan' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      {pathname === href && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-cyan rounded hidden md:block"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 safe-area-inset-top">
      <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <motion.span
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            AK IMAX
          </motion.span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navLinks.slice(0, 1).map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          <div
            className="relative"
            onMouseEnter={() => setMoviesOpen(true)}
            onMouseLeave={() => setMoviesOpen(false)}
          >
            <span
              className={`relative inline-flex items-center gap-1 text-sm font-medium transition-colors cursor-default ${
                isMoviesActive ? 'text-neon-cyan' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Movies
              <span className={`text-xs transition-transform ${moviesOpen ? 'rotate-180' : ''}`}>▾</span>
            </span>
            <AnimatePresence>
              {moviesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 pt-1 -mt-1"
                >
                  <div className="py-3 px-3 min-w-[260px] rounded-lg bg-background border border-white/20 shadow-xl">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <p className="col-span-2 mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Categories
                      </p>
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/category/${c.slug}`}
                          className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        >
                          {c.name}
                        </Link>
                      ))}
                      {collections.length > 0 && (
                        <>
                          <p className="col-span-2 mt-2 pt-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-t border-white/5">
                            Collections
                          </p>
                          {collections.map((c) => (
                            <Link
                              key={c.id}
                              href={`/collection/${c.slug}`}
                              className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {navLinks.slice(1).map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/admin/login"
            className="text-xs sm:text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
          >
            Admin
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu - rendered via portal to avoid stacking context issues */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 top-14 sm:top-16 bg-black/60 backdrop-blur-sm z-[9998]"
                  onClick={() => setMobileOpen(false)}
                  aria-hidden="true"
                />
                <motion.nav
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden fixed left-0 right-0 top-14 sm:top-16 z-[9999] max-h-[calc(100vh-4rem)] overflow-y-auto bg-background border-b border-white/20 shadow-xl"
                  aria-label="Mobile navigation"
                >
                  <div className="container mx-auto px-4 py-4 space-y-1">
                    {navLinks.slice(0, 1).map((link) => (
                      <NavLink key={link.href} href={link.href} label={link.label} />
                    ))}
                    <div className="overflow-visible">
                      <button
                        type="button"
                        onClick={() => setMobileMoviesOpen((o) => !o)}
                        className={`flex w-full items-center justify-between py-2 text-base font-medium transition-colors ${
                          isMoviesActive ? 'text-neon-cyan' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-expanded={mobileMoviesOpen}
                        aria-controls="mobile-movies-panel"
                      >
                        Movies
                        <span className={`text-xs transition-transform ${mobileMoviesOpen ? 'rotate-180' : ''}`}>▾</span>
                      </button>
                      {mobileMoviesOpen && (
                        <div
                          id="mobile-movies-panel"
                          className="pl-4 pt-2 pb-3 mt-1 space-y-1 border-l-2 border-neon-cyan/50 ml-2 bg-background"
                        >
                          <p className="text-xs text-muted-foreground font-medium">Categories</p>
                          {categories.map((c) => (
                            <Link
                              key={c.id}
                              href={`/category/${c.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {c.name}
                            </Link>
                          ))}
                          {collections.length > 0 && (
                            <>
                              <p className="pt-2 text-xs text-muted-foreground font-medium">Collections</p>
                              {collections.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/collection/${c.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  {c.name}
                                </Link>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {navLinks.slice(1).map((link) => (
                      <NavLink key={link.href} href={link.href} label={link.label} />
                    ))}
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}
