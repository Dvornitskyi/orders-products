# ---- 1) сборка ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Адрес бэкенда «вшивается» в сборку: rewrites (/api → бэкенд) и адрес WebSocket для браузера
ARG INTERNAL_API_URL=http://backend:4000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ENV INTERNAL_API_URL=$INTERNAL_API_URL NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL STANDALONE=1
RUN npm run build

# ---- 2) минимальный образ для запуска ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 INTERNAL_API_URL=http://backend:4000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
