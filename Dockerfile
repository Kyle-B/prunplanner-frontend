FROM --platform=$BUILDPLATFORM node:lts-alpine AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable

# Pass build-time env variables
ARG BUILD_REVISION
ARG BUILD_CREATED
ARG VITE_API_BASE_URL
ARG VITE_SHARE_BASE_URL
ARG VITE_GAME_DATA_STALE_MINUTES_BUILDINGS
ARG VITE_GAME_DATA_STALE_MINUTES_RECIPES
ARG VITE_GAME_DATA_STALE_MINUTES_MATERIALS
ARG VITE_GAME_DATA_STALE_MINUTES_EXCHANGES
ARG VITE_GAME_DATA_STALE_MINUTES_PLANETS
ARG VITE_INDEXEDDB_DBNAME

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SHARE_BASE_URL=$VITE_SHARE_BASE_URL \
    VITE_GAME_DATA_STALE_MINUTES_BUILDINGS=$VITE_GAME_DATA_STALE_MINUTES_BUILDINGS \
    VITE_GAME_DATA_STALE_MINUTES_RECIPES=$VITE_GAME_DATA_STALE_MINUTES_RECIPES \
    VITE_GAME_DATA_STALE_MINUTES_MATERIALS=$VITE_GAME_DATA_STALE_MINUTES_MATERIALS \
    VITE_GAME_DATA_STALE_MINUTES_EXCHANGES=$VITE_GAME_DATA_STALE_MINUTES_EXCHANGES \
    VITE_GAME_DATA_STALE_MINUTES_PLANETS=$VITE_GAME_DATA_STALE_MINUTES_PLANETS \
    VITE_INDEXEDDB_DBNAME=$VITE_INDEXEDDB_DBNAME

# Copy package manager files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy
COPY . .

# Build
RUN pnpm run build

# --- PRODUCTION STAGE ---
FROM devforth/spa-to-http:1.0.9 AS production
COPY --from=build /app/dist/ .

ARG BUILD_REVISION
ARG BUILD_CREATED

# Metadata
LABEL org.opencontainers.image.title="PRUNplanner Frontend"
LABEL org.opencontainers.image.description="Vue3/Vite SPA served by spa-to-http"
LABEL org.opencontainers.image.source="https://github.com/PRUNplanner/frontend"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.authors="Jan Placht <jplacht+prunplanner@gmail.com>"
LABEL org.opencontainers.image.revision=$BUILD_REVISION
LABEL org.opencontainers.image.created=$BUILD_CREATED
