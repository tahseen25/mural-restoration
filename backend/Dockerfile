# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 5000

CMD ["node", "server.js"]
