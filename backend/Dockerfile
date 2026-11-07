FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY test ./test

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

# Migrations run on start (use entrypoint or command in compose)
CMD ["node", "src/server.js"]
