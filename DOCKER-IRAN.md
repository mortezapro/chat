# راهنمای رفع تحریم Docker برای کاربران ایرانی

بر اساس [راهنمای سرور.آی‌آر](https://server.ir/blog/methods-to-remove-the-docker-ban-for-iranian/)

## روش 1: استفاده از Docker Registry ایران (پیشنهادی)

این روش بدون نیاز به VPN یا تحریم‌شکن کار می‌کند.

### مراحل:

1. **Docker Desktop** را باز کنید
2. به **Settings** (⚙️) بروید
3. **Docker Engine** را انتخاب کنید
4. در قسمت JSON، `registry-mirrors` را اضافه کنید. کد شما باید شبیه این باشد:

**قبل:**
```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false
}
```

**بعد (اضافه کردن registry-mirrors):**
```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://registry.docker.ir"
  ]
}
```

**نکته:** فقط خطوط `"registry-mirrors"` را اضافه کنید، بقیه تنظیمات را تغییر ندهید.

5. **Apply & Restart** را بزنید

### تست کردن:

```bash
docker pull hello-world
```

اگر بدون خطا دانلود شد، تنظیمات درست است.

## روش 2: استفاده از سرویس تحریم‌شکن

اگر روش اول کار نکرد:

1. به [سرور.آی‌آر](https://server.ir) بروید
2. سرویس **تحریم‌شکن** را فعال کنید
3. Docker Desktop را با استفاده از پروکسی اجرا کنید

## پس از رفع تحریم

```bash
# اجرای پروژه
docker-compose -f docker-compose.local.yml up --build

# یا برای development
docker-compose -f docker-compose.dev.yml up --build
```

## دسترسی به اپلیکیشن

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017

## نکات مهم

- این تنظیمات فقط برای **دانلود** images است، نه publish کردن
- Docker Registry ایران یک mirror از Docker Hub است
- اگر مشکل داشتید، از سرویس تحریم‌شکن استفاده کنید

## منبع

[راهنمای کامل رفع تحریم Docker - سرور.آی‌آر](https://server.ir/blog/methods-to-remove-the-docker-ban-for-iranian/)

