# Questly — serviço único: builda o frontend e serve tudo pelo backend (FastAPI).

# ---- Stage 1: build do frontend (PWA precisa de Node 20+) ----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: backend + frontend estático ----
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# dist do frontend buildado no stage anterior; main.py o serve via FRONTEND_DIST.
COPY --from=frontend /app/frontend/dist ./frontend/dist
ENV FRONTEND_DIST=/app/frontend/dist

EXPOSE 8000
# Railway injeta $PORT; fallback 8000 para rodar localmente.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
