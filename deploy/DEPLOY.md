# Развёртывание RUK LK (Docker)

Два контейнера: **web** (nginx + статика React) и **api** (Spring Boot). Снаружи открыт только порт **80** у `web`.

```
Браузер → web:80 → /        → статика
                  → /api/*  → api:8080 → 1С, UniSender
```

---

## 1. Требования на сервере

- Ubuntu 22.04 / 24.04 (или другой Linux с Docker)
- [Docker Engine](https://docs.docker.com/engine/install/) + Docker Compose v2
- Доступ сервера к 1С (`http://10.10.31.13/...`)

```bash
docker --version
docker compose version
```

---

## 2. Клонирование и секреты

```bash
sudo mkdir -p /opt/ruk-lk && sudo chown "$USER:$USER" /opt/ruk-lk
git clone <URL_РЕПО> /opt/ruk-lk
cd /opt/ruk-lk

cp deploy/application-local.properties.example backend/application-local.properties
nano backend/application-local.properties
```

Заполните: логин/пароль 1С, UniSender (`api-key`, `from-email`). Для теста без почты: `app.auth.fixed-code=123456`.

```bash
cp deploy/env.example .env
nano .env
```

Пример `.env`:

```
VITE_API_BASE_URL=http://203.0.113.10
HTTP_PORT=80
```

`VITE_API_BASE_URL` — тот же адрес, по которому открываете ЛК в браузере.

---

## 3. Сборка и запуск

```bash
docker compose up -d --build
```

Проверка:

```bash
docker compose ps
curl -s http://127.0.0.1/api/health
# {"status":"ok"}
```

В браузере: `http://<IP_СЕРВЕРА>/`

---

## 4. Логи и перезапуск

```bash
docker compose logs -f api
docker compose logs -f web

docker compose restart api
docker compose up -d --build web   # после смены VITE_API_BASE_URL
```

---

## 5. Обновление после `git pull`

```bash
cd /opt/ruk-lk
git pull
docker compose up -d --build
```

Если менялся только backend и не трогали фронт:

```bash
docker compose up -d --build api
```

---

## 6. HTTPS (когда будет домен)

Проще всего — **внешний nginx/Caddy** на хосте с Let's Encrypt, прокси на `127.0.0.1:80` контейнера `web`.  
Либо заменить образ `web` на свой с TLS-сертификатами.

После HTTPS:

1. Обновите `VITE_API_BASE_URL=https://lk.example.com` в `.env`
2. Пересоберите web: `docker compose up -d --build web`
3. В `application-docker.properties` или через переменные включите `server.servlet.session.cookie.secure=true`

---

## 7. Проверка доступа к 1С из контейнера

```bash
docker compose exec api wget -qO- -S --header="Authorization: Basic $(echo -n 'USER:PASS' | base64)" \
  'http://10.10.31.13/universitet_masterkova1/hs/student/profile?studentId=172194' 2>&1 | head
```

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| `application-local.properties`: no such file | создайте файл из `deploy/application-local.properties.example` |
| `Задайте VITE_API_BASE_URL` при сборке | заполните `.env` в корне репозитория |
| Профиль 404 / API не стартует | `docker compose logs api` |
| Сессия сбрасывается | `VITE_API_BASE_URL` ≠ URL в браузере |
| 1С недоступна из контейнера | сеть/VPN; проверьте `wget` из шага 7 |

---

## Файлы

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | сервисы `api` + `web` |
| `backend/Dockerfile` | сборка Spring Boot |
| `deploy/Dockerfile.web` | сборка фронта + nginx |
| `deploy/nginx.conf` | прокси `/api` → `api:8080` |
| `deploy/env.example` | шаблон `.env` |
| `deploy/application-local.properties.example` | секреты backend |
