FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including serve
RUN npm ci && npm install -g serve

# Copy application files (excluding .env files)
COPY public ./public
COPY src ./src

# Copy Docker-specific env file for build
COPY .env.docker .env.production

# Build the React app (uses .env.production)
RUN npm run build

EXPOSE 80

# Serve the build folder on port 80 with proxying to backend
CMD ["serve", "-s", "build", "-l", "80", "--cors"]
