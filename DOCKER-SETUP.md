# راهنمای راه‌اندازی Docker

## مشکل دسترسی به Docker Hub

اگر با خطای `403 Forbidden` مواجه شدید، یکی از این راه‌حل‌ها را امتحان کنید:

### راه‌حل 1: لاگین به Docker Hub

```bash
docker login
```

سپس username و password خود را وارد کنید.

### راه‌حل 2: استفاده از Personal Access Token

1. به https://hub.docker.com/settings/security بروید
2. یک Personal Access Token ایجاد کنید
3. با token لاگین کنید:

```bash
docker login -u YOUR_USERNAME -p YOUR_TOKEN
```

### راه‌حل 3: استفاده از VPN

اگر در ایران هستید، ممکن است نیاز به VPN داشته باشید.

### راه‌حل 4: استفاده از Docker Registry ایران (پیشنهادی برای کاربران ایرانی)

می‌توانید از Docker Registry ایران استفاده کنید. در تنظیمات Docker Desktop:
- Settings > Docker Engine
- اضافه کردن:

```json
{
  "registry-mirrors": [
    "https://registry.docker.ir"
  ]
}
```

**منبع:** [راهنمای رفع تحریم Docker برای کاربران ایرانی](https://server.ir/blog/methods-to-remove-the-docker-ban-for-iranian/)

### راه‌حل 5: استفاده از سرویس تحریم‌شکن

اگر registry mirror کار نکرد، می‌توانید از سرویس تحریم‌شکن استفاده کنید:
- به [سرور.آی‌آر](https://server.ir) بروید
- سرویس تحریم‌شکن را فعال کنید
- Docker Desktop را با استفاده از پروکسی اجرا کنید

### راه‌حل 5: دانلود دستی Images

```bash
# دانلود MongoDB
docker pull mongo:7

# دانلود Node.js
docker pull node:18-alpine

# دانلود Nginx
docker pull nginx:alpine
```

## پس از رفع مشکل

```bash
# ساخت و اجرای پروژه
docker-compose up -d --build

# یا برای development
docker-compose -f docker-compose.dev.yml up --build
```

## بررسی وضعیت

```bash
# مشاهده container ها
docker ps

# مشاهده لاگ‌ها
docker-compose logs -f

# توقف
docker-compose down
```

