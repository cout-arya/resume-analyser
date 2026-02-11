FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Ensure data directory exists for vector store
RUN mkdir -p data/vectors

EXPOSE 5000

CMD ["node", "server.js"]
