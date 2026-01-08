# راهنمای Deployment

## 1. بررسی پورت‌ها

```bash
netstat -tulpn | grep -E ':(80|5001|27017)'
```

## 2. تنظیم Environment

```bash
cd backend
cp env.example .env
nano .env
```

تنظیمات:
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/chat-app
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRE=7d
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
UPLOAD_PATH=./uploads
```

## 3. ساخت و اجرا

```bash
cd /path/to/chat-app
docker-compose build --no-cache
docker-compose up -d
```

## 4. بررسی وضعیت

```bash
docker-compose ps
docker-compose logs -f
```

## دستورات مدیریت

```bash
# مشاهده لاگ‌ها
docker-compose logs -f backend
docker-compose logs -f frontend

# توقف
docker-compose stop

# راه‌اندازی مجدد
docker-compose restart

# به‌روزرسانی (بدون حذف volume)
git pull
docker-compose build --no-cache
docker-compose up -d

# حذف فقط containerها (volumeها باقی می‌مانند)
docker-compose down
```

