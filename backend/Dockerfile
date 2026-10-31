FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
# tsx запускает TypeScript напрямую — отдельный шаг сборки не нужен
CMD ["npx", "tsx", "src/index.ts"]
