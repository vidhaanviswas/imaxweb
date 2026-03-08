# Deployment Guide: imaxweb

Deploy **AK IMAX** to production using:
- **Backend + PostgreSQL**: Render
- **Frontend**: Vercel or Netlify

---

## Overview

| Component | Platform | URL |
|-----------|----------|-----|
| Backend API | Render | `https://imaxweb-api.onrender.com` |
| PostgreSQL | Render | (internal) |
| Frontend | Vercel or Netlify | `https://your-site.vercel.app` |

---

## Part 1: Deploy Backend + Database on Render

### ⭐ Recommended: Use Native Node.js (not Docker)

Use the steps below. **Do not** choose "Docker" when creating the service.

---

### Step 1: Push code to GitHub

1. Open terminal in your project folder
2. Run:
   ```bash
   git add .
   git commit -m "Prepare for Render deploy"
   git push origin main
   ```
3. Replace `main` with your branch name if different

---

### Step 2: Create Render account

1. Go to [render.com](https://render.com)
2. Click **Get Started**
3. Sign up with GitHub (recommended for easy repo link)

---

### Step 3: Create database first

1. In the Render Dashboard, click **New +**
2. Select **PostgreSQL**
3. Configure:
   - **Name:** `imaxweb-db`
   - **Database:** `imaxweb` (or leave default)
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **Create Database**
5. Wait until status is **Available**
6. Go to the database page → **Connect** → copy the **Internal Database URL** (you’ll need it for the Web Service)

---

### Step 4: Create Web Service (backend API)

1. Click **New +** → **Web Service**
2. Connect your GitHub account if asked
3. Find your `imaxweb` repo and click **Connect**
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `imaxweb-api` |
   | **Region** | Same as database |
   | **Branch** | `main` |
   | **Root Directory** | `backend` ⚠️ Important |
   | **Runtime** | **Node** (not Docker) |
   | **Build Command** | `npm install && npx prisma generate && npm run build` |
   | **Start Command** | `npm run start` |

5. Under **Advanced** → **Release Command**, add:
   ```
   npx prisma migrate deploy && npm run db:seed
   ```

---

### Step 5: Add environment variables

1. On the Web Service page, go to **Environment**
2. Click **Add Environment Variable**
3. Add these one by one:

   | Key | Value | Where to get it |
   |-----|-------|-----------------|
   | `NODE_ENV` | `production` | Type manually |
   | `DATABASE_URL` | `postgresql://...` | From PostgreSQL service → Connect → **Internal** URL |
   | `JWT_SECRET` | Random string | Type a long random string (e.g. 32+ chars) or generate one |
   | `API_URL` | `https://imaxweb-api.onrender.com` | After first deploy, use your actual URL (see Step 6) |
   | `CORS_ORIGIN` | `https://your-site.vercel.app` | Your frontend URL; use `*` temporarily if no frontend yet |
   | `ADMIN_EMAIL` | `admin@yourdomain.com` | Your admin email |
   | `ADMIN_PASSWORD` | `YourSecurePassword123` | Your admin password (min 6 chars) |

4. Click **Save Changes**

---

### Step 6: Deploy

1. Click **Create Web Service**
2. Render will build and deploy (first run can take 5–10 minutes)
3. When done, copy your service URL (e.g. `https://imaxweb-api.onrender.com`)
4. If `API_URL` was a placeholder, update it in **Environment** with this URL and trigger **Manual Deploy**

---

### Step 7: Test the backend

1. Visit: `https://your-service.onrender.com/api/health`
2. You should see: `{"status":"ok","timestamp":"..."}`

---

### Alternative: Blueprint (one-click)

If you prefer auto-setup:

1. **New +** → **Blueprint**
2. Connect your repo
3. Render reads `render.yaml` and creates DB + Web Service
4. You still need to set in **Environment** (marked `sync: false`):
   - `API_URL`
   - `CORS_ORIGIN`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

---

### ⚠️ If you used Docker and got "npm ci" error

You may have selected **Docker** as the runtime. This project is set up for **Node.js**.

1. Go to your Web Service → **Settings**
2. Change **Runtime** from Docker to **Node**
3. Set **Root Directory** to `backend`
4. Set Build and Start commands as in Step 4 above
5. **Manual Deploy** → **Clear build cache & deploy**

---

### Render free tier note

The service sleeps after ~15 minutes of inactivity. The first request after that can take 30–60 seconds to respond.

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Connect repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. **Add New** → **Project**
3. Import your GitHub repository

### Step 2: Configure project

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `frontend` (important for monorepo)
- **Build Command:** `npm run build` (default)
- **Output Directory:** leave default

### Step 3: Environment variables

Add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://imaxweb-api.onrender.com` (your Render backend URL) |

### Step 4: Deploy

Click **Deploy**. Your site will be at `https://your-project.vercel.app`.

---

## Part 3: Deploy Frontend on Netlify (alternative)

### Step 1: Connect repo

1. Go to [netlify.com](https://netlify.com) and sign in
2. **Add new site** → **Import an existing project**
3. Connect your Git provider and repository

### Step 2: Build settings

- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** leave default (Next.js plugin handles it)

### Step 3: Environment variables

Add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://imaxweb-api.onrender.com` |

### Step 4: Deploy

Deploy. Your site will be at `https://random-name.netlify.app`.

---

## After deployment

### 1. Update CORS on the backend

In Render → `imaxweb-api` → Environment, set:

- `CORS_ORIGIN` = your frontend URL (e.g. `https://imaxweb.vercel.app`)

For multiple frontends, use a comma-separated list:

`https://imaxweb.vercel.app,https://imaxweb.netlify.app`

### 2. Admin login

- URL: `https://your-frontend.vercel.app/admin/login`
- Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` from backend env vars

---

## File uploads

The app stores images in `uploads/` on the server. On Render’s free tier the filesystem is **ephemeral**, so:

- Files disappear on redeploy or restart
- For production, consider cloud storage (e.g. Cloudflare R2, AWS S3) with signed URLs

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **"npm ci" / "package-lock.json" error** | You're using Docker. Switch to **Node** runtime and set Root Directory to `backend`. Or use the Dockerfile we fixed (it now uses `npm install`). |
| **CORS errors** | Add your frontend URL to `CORS_ORIGIN` on Render → Environment. Use comma for multiple: `https://a.vercel.app,https://b.netlify.app` |
| **401 on admin routes** | Verify `JWT_SECRET` is set. Log out and log in again with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. |
| **Images not loading** | Set `API_URL` to your backend URL, e.g. `https://imaxweb-api.onrender.com` |
| **Slow first request** | Normal on free tier; service wakes from sleep. First request can take 30–60 seconds. |
| **Migration fails** | Check `DATABASE_URL` (use Internal URL from PostgreSQL). Ensure migrations exist in `backend/prisma/migrations/`. |
| **Build fails** | Root Directory must be `backend`. Build command: `npm install && npx prisma generate && npm run build` |
| **"Module not found" / Prisma errors** | Prisma must run before build. Order: `prisma generate` → `npm run build` |
