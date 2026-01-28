# راهنمای استفاده از Seed برای ایجاد کاربران Mock

این اسکریپت 10 کاربر نمونه به دیتابیس اضافه می‌کند که می‌توانید با آن‌ها تست کنید.

## نحوه اجرا

### اگر از Docker استفاده می‌کنید:

```bash
docker exec -it chat-app-backend npm run seed
```

### اگر به صورت محلی اجرا می‌کنید:

```bash
cd backend
npm run seed
```

## اطلاعات ورود

**رمز عبور همه کاربران:** `123456`

### لیست کاربران:

1. **علی احمدی**
   - Username: `ali_ahmadi`
   - Email: `ali@example.com`
   - وضعیت: آفلاین

2. **سارا محمدی**
   - Username: `sara_mohammadi`
   - Email: `sara@example.com`
   - وضعیت: آنلاین

3. **رضا کریمی**
   - Username: `reza_karimi`
   - Email: `reza@example.com`
   - وضعیت: آفلاین

4. **مریم حسنی**
   - Username: `maryam_hasani`
   - Email: `maryam@example.com`
   - وضعیت: آنلاین

5. **امیر نصیری**
   - Username: `amir_nasiri`
   - Email: `amir@example.com`
   - وضعیت: آفلاین

6. **زهرا رحیمی**
   - Username: `zahra_rahimi`
   - Email: `zahra@example.com`
   - وضعیت: آنلاین

7. **حسین فرجی**
   - Username: `hossein_faraji`
   - Email: `hossein@example.com`
   - وضعیت: آفلاین

8. **فاطمه عزیزی**
   - Username: `fatemeh_azizi`
   - Email: `fatemeh@example.com`
   - وضعیت: آنلاین

9. **محمد رضایی**
   - Username: `mohammad_rezaei`
   - Email: `mohammad@example.com`
   - وضعیت: آفلاین

10. **نرگس صادقی**
    - Username: `narges_sadeghi`
    - Email: `narges@example.com`
    - وضعیت: آنلاین

## نکات مهم

- اگر کاربری با همان ایمیل یا نام کاربری وجود داشته باشد، از ایجاد مجدد آن صرف‌نظر می‌شود
- برای پاک کردن همه کاربران و ایجاد مجدد، می‌توانید خطوط مربوط به `deleteMany` را در فایل `seed.js` فعال کنید
- همه کاربران دارای نام، نام خانوادگی، بیوگرافی و شماره تماس هستند










