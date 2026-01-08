FROM node:18-alpine as builder

WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-retries 5

COPY package.json ./

RUN npm install --legacy-peer-deps --no-audit || \
    (sleep 10 && npm install --legacy-peer-deps --no-audit) || \
    (sleep 20 && npm install --legacy-peer-deps --no-audit)

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]






