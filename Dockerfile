# Multi-stage Dockerfile for Civic AI (Hugging Face Spaces & Cloud Containers)

# -------------------------------------------------------------
# Stage 1: Build React TypeScript Frontend
# -------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Python Runtime
# -------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    ENVIRONMENT=production \
    UPLOAD_DIR=/app/backend/uploads \
    DATABASE_URL=sqlite:////app/backend/civic_ai.db

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create uploads storage folder
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

# Bootstrap SQLite database tables and demo seed
RUN python -m app.cli init-db && python -m app.cli seed-demo

# Hugging Face Spaces runs on port 7860
EXPOSE 7860

# Start Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
