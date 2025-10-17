FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY public ./public
COPY src ./src
COPY server.js ./

# Build the React app
RUN npm run build

EXPOSE 4000

# Use custom Express server with proxy
CMD ["node", "server.js"]
