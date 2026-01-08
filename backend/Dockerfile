FROM node:18-alpine

WORKDIR /app

RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package.json ./

RUN npm install --only=production --legacy-peer-deps --no-audit

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]






