FROM node:18-alpine as builder

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NPM_CONFIG_REGISTRY

WORKDIR /app

RUN if [ -n "$HTTP_PROXY" ]; then \
      npm config set proxy $HTTP_PROXY && \
      npm config set https-proxy ${HTTPS_PROXY:-$HTTP_PROXY}; \
    fi && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry ${NPM_CONFIG_REGISTRY:-https://mirror-npm.runflare.com}

COPY package.json ./

RUN npm install --legacy-peer-deps --no-audit

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]






