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

### Step 1: Push your code to GitHub

Ensure your repo is on GitHub (or GitLab).

### Step 2: Create Render account and connect repo

1. Go to [render.com](https://render.com) and sign up
2. **New** → **Blueprint** (or **New** → **Web Service** for manual setup)
3. Connect your GitHub repository containing this project

### Step 3: Deploy with Blueprint (recommended)

If using the `render.yaml` in this repo:

1. **New** → **Blueprint** → Connect your repo
2. Render will detect `render.yaml` and create:
   - PostgreSQL database (`imaxweb-db`)
   - Web service (`imaxweb-api`)

3. **Set these environment variables** in the `imaxweb-api` service (Dashboard → Environment):

   | Key | Value | Notes |
   |-----|-------|-------|
   | `API_URL` | `https://imaxweb-api.onrender.com` | Your backend URL (replace with actual URL after first deploy) |
   | `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Your frontend URL (add both Vercel/Netlify URLs if you deploy to both) |
   | `ADMIN_EMAIL` | `your-admin@example.com` | Admin login email |
   | `ADMIN_PASSWORD` | `your-secure-password` | Admin login password (min 6 chars) |

   **Note:** `DATABASE_URL` and `JWT_SECRET` are auto-configured by the Blueprint.

### Step 4: Manual setup (if not using Blueprint)

1. **Create PostgreSQL**  
   - **New** → **PostgreSQL**  
   - Name: `imaxweb-db`  
   - Plan: Free  

2. **Create Web Service**  
   - **New** → **Web Service**  
   - Connect repo  
   - **Root Directory:** `backend`  
   - **Runtime:** Node  
   - **Build Command:** `npm install && npx prisma generate && npm run build`  
   - **Start Command:** `npm run start`  
   - **Release Command:** `npx prisma migrate deploy && npm run db:seed`  

3. **Environment variables** (same as above, plus):
   - `DATABASE_URL` (from the PostgreSQL service: Connect → Internal)
   - `JWT_SECRET` (generate a strong random string)

4. Deploy.

### Step 5: Get your backend URL

After deploy, your API will be at:
`https://imaxweb-api.onrender.com`  
(or `https://imaxweb-api-xxxx.onrender.com`)

**Render free tier note:** The service spins down after ~15 minutes of inactivity. The first request after that can take 30–60 seconds to respond.

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
| CORS errors | Add the frontend URL to `CORS_ORIGIN` on Render |
| 401 on admin routes | Check `JWT_SECRET` on backend |
| Images not loading | Ensure `API_URL` on backend matches the deployed URL |
| Slow first request | Normal on Render free tier; service spins up after inactivity |
| Migration fails | Ensure `DATABASE_URL` is set and correct |
| Build fails | Check Node version and that `rootDir` / `base` is set correctly |
