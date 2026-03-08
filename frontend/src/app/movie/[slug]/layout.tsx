import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

async function getMovie(slug: string) {
  const res = await fetch(`${API_URL}/api/movies/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) return { title: 'Movie | AK IMAX' };

  const title = `${movie.title} | AK IMAX`;
  const description =
    movie.description?.slice(0, 160).replace(/\s+/g, ' ') ||
    `Watch ${movie.title} - ${movie.director ? `Directed by ${movie.director}` : 'Movie'} on AK IMAX`;
  const ogImage = movie.bannerUrl || movie.posterUrl || undefined;
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
      siteName: 'AK IMAX',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: {
      canonical: `/movie/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      ...(year && { 'release-date': String(year) }),
    },
  };
}

export default function MovieLayout({ children }: Props) {
  return <>{children}</>;
}
