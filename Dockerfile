# EduTrack: one container = FastAPI API + built Vite SPA (same origin, no CORS setup)

# 1) Build the frontend
FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# 2) Python runtime
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend ./backend
COPY --from=web /app/dist ./dist
WORKDIR /app/backend
# Hosts (Render, Railway, Fly...) inject PORT; set EDUTRACK_DB_PATH to a mounted volume to keep data across deploys
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
