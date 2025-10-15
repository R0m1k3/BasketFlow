FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including serve
RUN npm ci && npm install -g serve

# Copy application files
COPY . .

# Build the React app
RUN npm run build

EXPOSE 80

# Serve the build folder on port 80
CMD ["serve", "-s", "build", "-l", "80"]
