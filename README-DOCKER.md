# راه‌اندازی با Docker

## پیش‌نیازها
- Docker
- Docker Compose

## اجرای Production

```bash
docker-compose up -d
```

پس از اجرا:
- Frontend: http://localhost
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## اجرای Development

```bash
docker-compose -f docker-compose.dev.yml up
```

پس از اجرا:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## دستورات مفید

```bash
# مشاهده لاگ‌ها
docker-compose logs -f

# توقف سرویس‌ها
docker-compose down

# توقف و حذف volumes
docker-compose down -v

# ساخت مجدد images
docker-compose build

# اجرای دستور در container
docker-compose exec backend npm install
docker-compose exec frontend npm install
```

## تنظیمات Environment Variables

برای تنظیمات production، فایل `.env` در root پروژه ایجاد کنید:

```env
JWT_SECRET=your-very-secret-key-here
MONGODB_URI=mongodb://mongodb:27017/chat-app
```






