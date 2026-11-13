# ---- build: compile TypeScript and generate the Prisma client ----
FROM node:22-alpine AS build
# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- runtime: only production deps, compiled JS and the Prisma schema/migrations ----
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/health || exit 1
# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
