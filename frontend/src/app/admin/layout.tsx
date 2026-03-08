'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const ADMIN_PATHS = ['/admin/dashboard', '/admin/movies', '/admin/add-movie', '/admin/collections', '/admin/reviews', '/admin/requests', '/admin/settings'];
const LOGIN_PATH = '/admin/login';

const SidebarContent = ({ pathname, onLinkClick, router }: { pathname: string; onLinkClick?: () => void; router?: ReturnType<typeof useRouter> }) => (
  <>
    <Link href="/admin/dashboard" onClick={onLinkClick} className="block text-xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
      AK IMAX Admin
    </Link>
    <nav className="space-y-1">
      <Link
        href="/admin/dashboard"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/dashboard' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Dashboard
      </Link>
      <Link
        href="/admin/movies"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname.startsWith('/admin/movies') || pathname.startsWith('/admin/add-movie') || pathname.startsWith('/admin/edit-movie') ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Movies
      </Link>
      <Link
        href="/admin/add-movie"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/add-movie' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Add Movie
      </Link>
      <Link
        href="/admin/collections"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname.startsWith('/admin/collections') ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Collections
      </Link>
      <Link
        href="/admin/reviews"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/reviews' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Reviews
      </Link>
      <Link
        href="/admin/requests"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/requests' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Requests
      </Link>
      <Link
        href="/admin/settings"
        onClick={onLinkClick}
        className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/settings' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Settings
      </Link>
    </nav>
    <div className="absolute bottom-4 left-4 right-4">
      <button
        onClick={() => {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          onLinkClick?.();
          router?.push('/admin/login');
          router?.refresh();
        }}
        className="w-full py-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
      >
        Logout
      </button>
      <Link
        href="/"
        onClick={onLinkClick}
        className="block mt-2 text-center text-sm text-muted-foreground hover:text-neon-cyan transition"
      >
        View Site
      </Link>
    </div>
  </>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === LOGIN_PATH;
  const isProtectedPath = ADMIN_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/admin/edit-movie');

  useEffect(() => {
    if (!mounted) return;
    if (isLoginPage) return;
    const token = localStorage.getItem('admin_token');
    if (isProtectedPath && !token) {
      router.replace('/admin/login');
    }
  }, [mounted, pathname, isLoginPage, isProtectedPath, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: hamburger + drawer; Desktop: always-visible sidebar */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border border-white/10 text-foreground hover:bg-white/5 transition"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-white/10 p-4 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent pathname={pathname} onLinkClick={() => setMobileNavOpen(false)} router={router} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - opaque for visibility over any content */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-white/10 p-4 z-40 flex-col">
        <SidebarContent pathname={pathname} router={router} />
      </aside>

      <main className="pt-16 md:pt-8 md:ml-64 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
