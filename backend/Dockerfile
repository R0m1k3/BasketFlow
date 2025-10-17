FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application
COPY . .

EXPOSE 3888

# Push schema to database then start server
CMD sh -c "npx prisma db push --accept-data-loss --skip-generate && npm start"
