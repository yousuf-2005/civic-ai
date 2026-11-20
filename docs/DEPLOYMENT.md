# Civic AI Deployment Guide — Hugging Face Spaces & Production

This guide explains how to package and deploy Civic AI to Hugging Face Spaces (or any standard Docker-compatible container cloud provider).

---

## 1. Deployment Model: Unified Docker Container

Hugging Face Spaces runs applications inside isolated Linux containers listening on port `7860`.
For Civic AI, we use a multi-stage Docker build:
1. **Stage 1 (Node.js)**: Builds the React / TypeScript frontend into static assets in `dist/`.
2. **Stage 2 (Python)**: Installs backend requirements, copies the backend code, mounts the built frontend static assets, and runs FastAPI via Uvicorn.
3. **Serving Strategy**: FastAPI serves `/api/*` for REST endpoints and `/uploads/*` for validated complaint imagery, while serving the built React frontend (`index.html` and assets) for all other routes via SPA fallback.

---

## 2. Setting Up on Hugging Face Spaces

1. Create a new Space on [Hugging Face](https://huggingface.co/new-space):
   - **Space Name**: `civic-ai`
   - **License**: `mit` or `apache-2.0`
   - **Space SDK**: Select **Docker** (Blank)
   - **Hardware**: Free CPU basic (2 vCPU, 16 GB RAM) is sufficient.

2. Configure Space Secrets:
   Navigate to **Settings** > **Variables and secrets** in your Hugging Face Space:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API Key)*
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `SECRET_KEY`: *(A random 32+ character hex string for JWT signing)*
   - `AI_MOCK_MODE`: `false` *(Set to `true` if you want demo mode without API billing)*
   - `ADMIN_INITIAL_EMAIL`: *(Optional bootstrap email for initial admin)*
   - `ADMIN_INITIAL_PASSWORD`: *(Optional bootstrap password)*

3. Push the repository to your Hugging Face Space Git remote:
   ```bash
   git remote add space https://huggingface.co/spaces/<your-username>/civic-ai
   git push space main
   ```

---

## 3. Important Notes on Persistent Storage

> [!WARNING]
> Hugging Face free CPU spaces have **ephemeral filesystems**. When the space restarts or rebuilds:
> - SQLite database changes will reset unless you attach persistent storage.
> - Uploaded images in `uploads/` will be reset.

### Recommended Path for Production:
1. **Attach Persistent Storage**: Under Hugging Face Space Settings, activate persistent storage tier if available and set `DATABASE_URL=sqlite:////data/civic_ai.db` and `UPLOAD_DIR=/data/uploads`.
2. **Cloud Database & Cloud Storage**:
   - Change `DATABASE_URL` to a hosted PostgreSQL instance (e.g. Supabase, Neon, or Cloud SQL).
   - Change image storage adapter to AWS S3, Cloudflare R2, or Google Cloud Storage.
