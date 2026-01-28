# راهنمای تنظیم DNS

## روش 1: تنظیم DNS در لینوکس (توصیه می‌شود)

### Ubuntu/Debian

```bash
sudo nano /etc/systemd/resolved.conf
```

اضافه کنید:
```
[Resolve]
DNS=178.22.122.100 185.51.200.2
```

سپس:
```bash
sudo systemctl restart systemd-resolved
```

### CentOS/RHEL

```bash
sudo nano /etc/resolv.conf
```

اضافه کنید:
```
nameserver 178.22.122.100
nameserver 185.51.200.2
```

## روش 2: تنظیم DNS در Docker Daemon

```bash
sudo nano /etc/docker/daemon.json
```

اضافه کنید:
```json
{
  "dns": ["178.22.122.100", "185.51.200.2"]
}
```

سپس:
```bash
sudo systemctl restart docker
```

## روش 3: تنظیم DNS در docker-compose.yml

در فایل `docker-compose.yml` به هر service اضافه کنید:

```yaml
services:
  backend:
    dns:
      - 178.22.122.100
      - 185.51.200.2
  
  frontend:
    dns:
      - 178.22.122.100
      - 185.51.200.2
```

سپس:
```bash
docker-compose down
docker-compose up -d
```

## بررسی DNS

```bash
# در لینوکس
nslookup registry.npmjs.org

# در container
docker exec -it chat-app-backend nslookup registry.npmjs.org
```





