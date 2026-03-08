import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

async function getCollection(slug: string) {
  const res = await fetch(`${API_URL}/api/collections/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: 'Collection | AK IMAX' };

  const title = `${collection.name} | AK IMAX`;
  const description =
    collection.description?.slice(0, 160).replace(/\s+/g, ' ') ||
    `Browse ${collection.movies?.length ?? 0} movies in ${collection.name} on AK IMAX`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'AK IMAX',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/collection/${slug}`,
    },
  };
}

export default function CollectionLayout({ children }: Props) {
  return <>{children}</>;
}
