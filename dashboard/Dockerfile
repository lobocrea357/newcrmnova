# Etapa 1: Instalación de dependencias
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Etapa 2: Construcción de la aplicación
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Variables de entorno necesarias para el build
# Estas se pasarán como build args desde docker-compose
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Etapa 3: Imagen final de producción
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Crear un usuario y grupo no-root para mayor seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar dependencias de producción
COPY --from=deps /app/node_modules ./node_modules

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

# Cambiar al usuario no-root
USER nextjs

EXPOSE 3000
ENV PORT=3000

# El comando para iniciar el servidor de producción de Next.js
CMD ["npm", "start"]
