# syntax=docker/dockerfile:1
# Build context: raíz del repo  (docker build -f docker/frontend/Dockerfile .)
# Exclusiones del contexto: docker/frontend/Dockerfile.dockerignore
FROM node:24-alpine AS builder

WORKDIR /app

# Misma versión de pnpm que declara package.json (packageManager).
RUN npm install -g pnpm@11.24.0

COPY fronted/package.json fronted/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY fronted/ ./

# Empty uses the frontend nginx as a same-origin API gateway.
# Never use Kubernetes-internal DNS or localhost here.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# Imagen final: nginx sin root (UID 101), escucha en 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
