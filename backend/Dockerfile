FROM node:18-alpine

WORKDIR /app

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NPM_CONFIG_REGISTRY

RUN if [ -n "$HTTP_PROXY" ]; then \
      npm config set proxy $HTTP_PROXY && \
      npm config set https-proxy ${HTTPS_PROXY:-$HTTP_PROXY}; \
    fi && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry ${NPM_CONFIG_REGISTRY:-https://mirror-npm.runflare.com}

COPY package.json ./

RUN npm install --only=production --legacy-peer-deps --no-audit

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]






