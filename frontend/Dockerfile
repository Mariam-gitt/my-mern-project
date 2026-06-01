# ── Stage 1: Build React app ─────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Point API calls at the backend container via Nginx proxy
ENV REACT_APP_API_URL=/api

RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────
FROM nginx:1.25-alpine

# Copy built React files
COPY --from=build /app/build /usr/share/nginx/html

# Nginx config: SPA fallback + proxy /api → backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
