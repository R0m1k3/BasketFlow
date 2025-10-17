FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client (pas de migration)
RUN npx prisma generate

# Copy application
COPY . .

EXPOSE 3888

CMD ["npm", "start"]
