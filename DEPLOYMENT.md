# راهنمای Deployment

## 0. تنظیم Proxy/شکن (اختیاری - برای حل مشکل npm install)

### روش 1: استفاده از Proxy در npm

```bash
# تنظیم proxy برای npm
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port

# یا اگر نیاز به authentication دارید
npm config set proxy http://username:password@proxy-server:port
npm config set https-proxy http://username:password@proxy-server:port

# بررسی تنظیمات
npm config get proxy
npm config get https-proxy

# حذف proxy (در صورت نیاز)
npm config delete proxy
npm config delete https-proxy
```

### روش 2: استفاده از v2ray/xray در سرور

```bash
# نصب v2ray
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)

# یا استفاده از xray
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# کانفیگ فایل را در /usr/local/etc/v2ray/config.json یا /usr/local/etc/xray/config.json قرار دهید
# سپس سرویس را راه‌اندازی کنید
systemctl start v2ray
# یا
systemctl start xray

# فعال‌سازی برای startup
systemctl enable v2ray
# یا
systemctl enable xray
```

### روش 3: استفاده از Clash

```bash
# دانلود Clash
wget https://github.com/Dreamacro/clash/releases/download/v1.18.0/clash-linux-amd64-v1.18.0.gz
gunzip clash-linux-amd64-v1.18.0.gz
chmod +x clash-linux-amd64-v1.18.0
mv clash-linux-amd64-v1.18.0 /usr/local/bin/clash

# ایجاد دایرکتوری config
mkdir -p ~/.config/clash

# قرار دادن فایل config.yaml در ~/.config/clash/config.yaml
# سپس اجرا
clash
```

### روش 4: تنظیم Proxy برای Docker Build

```bash
# ایجاد فایل ~/.docker/config.json
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy-server:port",
      "httpsProxy": "http://proxy-server:port",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
EOF

# یا استفاده از environment variables
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port
export NO_PROXY=localhost,127.0.0.1

# سپس build کنید
docker-compose build
```

### روش 5: تنظیم Proxy در Dockerfile

اگر می‌خواهید proxy را مستقیماً در Dockerfile تنظیم کنید، به Dockerfile.dev اضافه کنید:

```dockerfile
ARG HTTP_PROXY
ARG HTTPS_PROXY

RUN if [ -n "$HTTP_PROXY" ]; then \
    npm config set proxy $HTTP_PROXY && \
    npm config set https-proxy $HTTPS_PROXY; \
    fi
```

سپس build کنید:
```bash
docker-compose build --build-arg HTTP_PROXY=http://proxy:port --build-arg HTTPS_PROXY=http://proxy:port
```

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

## 3. تنظیم متغیرهای محیطی (اختیاری)

اگر نیاز به تغییر URL API دارید، فایل `.env` در root پروژه ایجاد کنید:

```bash
cd /path/to/chat-app
nano .env
```

محتوا:
```
JWT_SECRET=your-strong-secret-key-here
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
VITE_API_URL=http://your-domain.com:5001/api
VITE_SOCKET_URL=http://your-domain.com:5001
```

## 4. ساخت و اجرا

```bash
cd /path/to/chat-app
docker-compose build
docker-compose up -d
```

## 5. بررسی وضعیت

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
docker-compose build
docker-compose up -d

# حذف فقط containerها (volumeها باقی می‌مانند)
docker-compose down
```

