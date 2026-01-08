# راه‌اندازی سریع با Docker Desktop (مخصوص کاربران ایرانی)

## مرحله 1: رفع تحریم Docker

### روش 1: استفاده از Docker Registry ایران (پیشنهادی)

1. Docker Desktop را باز کنید
2. به **Settings** (⚙️) بروید
3. **Docker Engine** را انتخاب کنید
4. در قسمت JSON، این را اضافه کنید:

```json
{
  "registry-mirrors": [
    "https://registry.docker.ir"
  ]
}
```

5. **Apply & Restart** را بزنید

### روش 2: استفاده از تحریم‌شکن

اگر روش اول کار نکرد، می‌توانید از سرویس تحریم‌شکن استفاده کنید:

1. به [سرور.آی‌آر](https://server.ir) بروید
2. سرویس تحریم‌شکن را فعال کنید
3. Docker Desktop را با استفاده از پروکسی اجرا کنید

**منبع:** [راهنمای رفع تحریم Docker برای کاربران ایرانی](https://server.ir/blog/methods-to-remove-the-docker-ban-for-iranian/)

## مرحله 2: اجرای پروژه

```bash
docker-compose -f docker-compose.local.yml up --build
```

یا برای اجرا در background:

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

## دسترسی به اپلیکیشن

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: localhost:27017

## دستورات مفید

```bash
# مشاهده لاگ‌ها
docker-compose -f docker-compose.local.yml logs -f

# توقف
docker-compose -f docker-compose.local.yml down

# توقف و حذف volumes
docker-compose -f docker-compose.local.yml down -v
```

## نکته مهم

Docker Desktop برای اولین بار نیاز به دانلود images دارد (mongo و node). این **publish کردن نیست**، فقط دانلود images عمومی از Docker Hub است.

اگر مشکل دسترسی دارید:
- از VPN استفاده کنید
- یا registry mirror را تنظیم کنید (مرحله 1)

