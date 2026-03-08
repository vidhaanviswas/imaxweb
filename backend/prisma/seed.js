import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    // Default admin credentials: admin@cinemax.com / admin123 (change in production!)
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cinemax.com' },
        update: {},
        create: {
            email: 'admin@cinemax.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('Admin user:', admin.email);
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
//# sourceMappingURL=seed.js.map