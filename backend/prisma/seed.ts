import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password: hashedPassword, tokenVersion: { increment: 1 } },
      create: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    // Invalidate all other admin sessions (e.g. when switching from old hardcoded admin)
    await prisma.user.updateMany({
      where: { role: 'ADMIN', id: { not: admin.id } },
      data: { tokenVersion: { increment: 1 } },
    });
    console.log('Admin user:', admin.email);
  } else {
    console.log('Skipping admin creation: set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create an admin.');
  }

  const genres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Documentary'];
  for (const name of genres) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    await prisma.genre.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  console.log('Created genres');

  const categories = [
    { name: 'Hollywood', slug: 'hollywood', order: 1 },
    { name: 'Bollywood', slug: 'bollywood', order: 2 },
    { name: 'Anime', slug: 'anime', order: 3 },
    { name: 'Cartoon', slug: 'cartoon', order: 4 },
    { name: 'Series', slug: 'series', order: 5 },
    { name: 'K-Drama', slug: 'k-drama', order: 6 },
    { name: 'Tollywood', slug: 'tollywood', order: 7 },
    { name: 'Documentary', slug: 'documentary', order: 8 },
    { name: 'Indie', slug: 'indie', order: 9 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log('Created categories');

  const audioLanguages = ['English', 'Hindi', 'Japanese', 'Korean', 'Tamil', 'Telugu', 'Spanish', 'French', 'Mandarin', 'Malayalam'];
  for (const name of audioLanguages) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    await prisma.audioLanguage.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  console.log('Created audio languages');

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
