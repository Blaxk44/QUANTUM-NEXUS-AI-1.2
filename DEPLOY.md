# Deployment Guide

This application is ready to be deployed to Vercel, but there are some important considerations regarding the database.

## ⚠️ Critical Database Warning

This application currently uses **SQLite** (`nexus.db`), which creates a local database file.

**Vercel is a serverless platform with an ephemeral file system.** This means:
1.  The `nexus.db` file will be **reset** every time your serverless function restarts (which happens frequently).
2.  Any users, deposits, or settings you create will be **lost** immediately.

### Recommended Solution: Cloud Database

For a production deployment on Vercel, you **MUST** migrate to a cloud database.
Recommended options:
-   **Vercel Postgres** (Easiest integration)
-   **Turso** (SQLite compatible, easiest migration from better-sqlite3)
-   **Supabase** (PostgreSQL)
-   **Neon** (PostgreSQL)

## Deployment Steps

1.  **Push to GitHub/GitLab/Bitbucket**:
    Push this code to a git repository.

2.  **Import to Vercel**:
    -   Go to Vercel Dashboard -> Add New -> Project.
    -   Import your repository.

3.  **Configure Build Settings**:
    -   Framework Preset: `Vite`
    -   Build Command: `npm run build`
    -   Output Directory: `dist`
    -   Install Command: `npm install`

4.  **Environment Variables**:
    Add the following environment variables in Vercel:
    -   `SESSION_SECRET`: A long random string.
    -   `GEMINI_API_KEY`: Your Gemini API key.
    -   `NODE_ENV`: `production`

5.  **Deploy**:
    Click Deploy.

## If using Vercel Postgres (Example)

1.  Create a Postgres database in your Vercel project.
2.  Update `server.ts` to use `@vercel/postgres` instead of `better-sqlite3`.
3.  Update the SQL queries to match PostgreSQL syntax (mostly compatible, but check `AUTOINCREMENT` vs `SERIAL`).

## Temporary Demo Mode

If you just want to see the UI on Vercel and don't care about data persistence:
1.  The app will deploy as-is.
2.  It will create a fresh `nexus.db` in memory or temporary storage on every request/restart.
3.  You can log in with the default admin credentials, but your session might be lost quickly.
