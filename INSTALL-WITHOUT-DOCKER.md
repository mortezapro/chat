# نصب بدون Docker - Ubuntu 24

## 1. نصب پیش‌نیازها

```bash
sudo apt-get update
sudo apt-get install -y curl wget gnupg ca-certificates
```

## 2. نصب MongoDB

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 3. نصب Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 4. تنظیم DNS

```bash
sudo nano /etc/systemd/resolved.conf
```

اضافه کنید:
```
[Resolve]
DNS=178.22.122.100 185.51.200.2
```

```bash
sudo systemctl restart systemd-resolved
```

## 5. نصب Backend

```bash
cd backend
npm install
cp env.example .env
nano .env
```

تنظیمات:
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRE=7d
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
UPLOAD_PATH=./uploads
```

## 6. نصب Frontend

```bash
cd ../frontend
npm install
npm run build
```

## 7. نصب PM2

```bash
sudo npm install -g pm2
```

## 8. اجرای Backend

```bash
cd ../backend
pm2 start src/server.js --name chat-backend
pm2 save
pm2 startup
```

## 9. نصب Nginx

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/chat-app
```

محتوا:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/chat-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## دستورات مدیریت

```bash
pm2 status
pm2 logs
pm2 restart chat-backend
pm2 stop chat-backend
pm2 delete chat-backend
```

