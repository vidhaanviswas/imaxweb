# AK IMAX - Movie Discovery Platform

A production-ready movie discovery platform similar to Rotten Tomatoes, with a modern 3D colorful UI and powerful admin dashboard.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, PostgreSQL, Prisma
- **Auth**: JWT
- **Storage**: Local uploads (VPS) or S3-compatible

## Project Structure

```
imaxweb/
├── frontend/          # Next.js app
├── backend/           # Express API
├── shared/            # Shared TypeScript types
├── docker-compose.yml
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in the project root and fill in values:

```bash
cp .env.example .env
```

Create `frontend/.env.local` for Next.js:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Database

**Option A: Docker (recommended)**

```bash
docker-compose up -d db
```

**Option B: Local PostgreSQL**

Create a database named `imaxweb`.

### 4. Prisma Setup

```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

Seed creates admin user: `admin@cinemax.com` / `admin123`

### 5. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Admin: http://localhost:3000/admin/login

## API Endpoints

### Public
- `GET /api/movies` - List movies (pagination, genre, featured)
- `GET /api/movies/:slug` - Movie by slug
- `GET /api/search?q=` - Search
- `GET /api/genres` - Genres
- `GET /api/reviews/:movieId` - Reviews for movie
- `POST /api/reviews` - Submit review (awaiting approval)

### Admin (JWT required)
- `POST /api/admin/login` - Login
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/movies` - List movies
- `GET /api/admin/movies/:id` - Movie by id
- `POST /api/admin/movies` - Create movie
- `PUT /api/admin/movies/:id` - Update movie
- `DELETE /api/admin/movies/:id` - Delete movie
- `POST /api/admin/upload` - Upload poster/banner
- `GET /api/admin/reviews` - List reviews
- `POST /api/admin/reviews` - Add review (auto-approved)
- `PUT /api/admin/reviews/:id/approve` - Approve review
- `DELETE /api/admin/reviews/:id` - Delete review
- `GET /api/admin/genres` - List genres
- `POST /api/admin/genres` - Create genre
- `DELETE /api/admin/genres/:id` - Delete genre

## Deployment

### Frontend (Vercel/Netlify)

1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Deploy from `frontend/` directory

### Backend (VPS Ubuntu)

1. **Setup**

```bash
# Install Node 20, PM2, Nginx
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm install -g pm2
```

2. **Build & Run**

```bash
cd backend
npm ci
npm run build
npm run db:migrate
pm2 start dist/index.js --name imaxweb-api
pm2 save && pm2 startup
```

3. **Nginx Reverse Proxy**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /path/to/imaxweb/backend/uploads;
    }
}
```

4. **SSL (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Docker

```bash
# Build backend first
cd backend && npm run build

# Run
docker-compose up -d
```

## Security

- JWT authentication for admin
- Rate limiting (100 req/15min API, 5 req/15min login)
- Helmet headers
- CORS configured
- Input validation with Zod
- bcrypt password hashing

## Pages

### Public
- `/` - Homepage with hero & movie rows
- `/movies` - All movies
- `/movie/[slug]` - Movie detail
- `/genre/[genre]` - Movies by genre
- `/search` - Search
- `/trending` - Trending movies
- `/top-rated` - Top rated

### Admin
- `/admin/login` - Login
- `/admin/dashboard` - Dashboard
- `/admin/movies` - Movie list
- `/admin/add-movie` - Add movie
- `/admin/edit-movie/[id]` - Edit movie
- `/admin/reviews` - Review management
- `/admin/settings` - Genres

## License

MIT
