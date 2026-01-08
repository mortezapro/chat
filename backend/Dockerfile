FROM node:18-alpine

WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-retries 5

COPY package.json ./

RUN npm install --only=production --legacy-peer-deps --no-audit || \
    (sleep 10 && npm install --only=production --legacy-peer-deps --no-audit) || \
    (sleep 20 && npm install --only=production --legacy-peer-deps --no-audit)

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]






