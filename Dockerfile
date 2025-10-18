FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Build frontend
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm ci --only=production
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

# Setup backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src

EXPOSE 3888

# Push schema to database then start server
CMD sh -c "npx prisma db push --accept-data-loss --skip-generate && npm start"
