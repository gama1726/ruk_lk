# Развёртывание RUK LK (Docker)

Два контейнера: **web** (nginx + статика React) и **api** (Spring Boot).  
Снаружи Docker открыт порт **80** у `web`; TLS обычно на **внешнем nginx** хоста.

Прод: **https://my.ruc.su**

```
Браузер → nginx хоста :443 (TLS)
        → 127.0.0.1:80 (docker web)
            → /        → статика
            → /api/*   → api:8080 → 1С, UniSender, MAX
```

---

## 1. Требования на сервере

- Ubuntu 22.04 / 24.04 (или другой Linux с Docker)
- [Docker Engine](https://docs.docker.com/engine/install/) + Docker Compose v2
- Доступ сервера к 1С (`http://10.10.31.13/...`)
- Для прода: внешний nginx + сертификат для `my.ruc.su`

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

Заполните: логин/пароль 1С, UniSender (`api-key`, `from-email`), учётки админ-панели пропусков
(`app.admin.spo.username` / `password`, `app.admin.he.username` / `password`).  
Если MAX включён (`app.max.enabled=true`) — обязателен `app.max.webhook-secret`.

**Не задавайте `app.auth.fixed-code` в prod** — приложение с профилем `prod` не стартует.

### Админ-панель фото для пропуска

Две отдельные очереди по треку студента (СПО / ВО). Вход по логину и паролю из `application-local.properties`
(при старте API учётки создаются или обновляются). Сессии СПО, ВО и студенческого ЛК независимы.

| URL | Назначение |
|-----|------------|
| `https://my.ruc.su/admin/pass-photos` | Единый вход (СПО и ВО) |
| `https://my.ruc.su/admin/pass-photos/login` | То же — форма входа |
| `https://my.ruc.su/admin/pass-photos/spo` | Очередь СПО (после входа) |
| `https://my.ruc.su/admin/pass-photos/he` | Очередь ВО (после входа) |

Старые URL `/admin/pass-photos/spo/login` и `/he/login` перенаправляют на единый вход.
После логина открывается очередь по роли учётки (например `admin-spo` или `admin-vo`).

```bash
cp deploy/env.example .env
nano .env
```

Пример `.env` для прода:

```
# опционально (по умолчанию фронт использует origin страницы)
# VITE_API_BASE_URL=https://my.ruc.su
HTTP_PORT=80
```

---

## 3. Сборка и запуск

```bash
docker compose up -d --build
```

Проверка с хоста:

```bash
docker compose ps
curl -s http://127.0.0.1/api/health
# {"status":"ok"}
```

В браузере: `https://my.ruc.su/` (после настройки TLS, §6).

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

Если менялся только backend:

```bash
docker compose up -d --build api
```

---

## 6. HTTPS для my.ruc.su

TLS на **хосте**, Docker остаётся на `127.0.0.1:80`.

1. Скопируйте пример и подставьте пути к сертификатам:

```bash
sudo cp deploy/nginx-host.my.ruc.su.example.conf /etc/nginx/sites-available/my.ruc.su
# отредактируйте ssl_certificate / ssl_certificate_key
sudo ln -sf /etc/nginx/sites-available/my.ruc.su /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

2. Убедитесь, что в примере есть:
   - редирект `http` → `https`
   - `proxy_set_header X-Forwarded-Proto https;`
   - HSTS и прочие security headers

3. В API уже включено (профили `prod` + `docker`):

```properties
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.same-site=lax
```

После смены cookie-настроек: `docker compose up -d --build api` (или restart api).

4. Проверка:

```bash
curl -sI https://my.ruc.su/login | head
curl -sI http://my.ruc.su/login | head
# HTTP должен отдавать 301 на https
```

Ожидаемо в HTTPS-ответе: `Strict-Transport-Security`, `X-Content-Type-Options`, и т.д.

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
| `fixed-code` / webhook-secret и API не стартует | уберите `fixed-code` в prod; задайте `webhook-secret` если MAX enabled |
| Сессия не держится / нет cookie | откройте сайт по **https://**; проверьте `X-Forwarded-Proto` на внешнем nginx |
| HTTP открывается без редиректа | настройте §6 (301 на HTTPS) |
| 1С недоступна из контейнера | сеть/VPN; проверьте `wget` из шага 7 |

---

## Файлы

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | сервисы `api` + `web` |
| `backend/Dockerfile` | сборка Spring Boot |
| `deploy/Dockerfile.web` | сборка фронта + nginx |
| `deploy/nginx.conf` | nginx **внутри** контейнера web |
| `deploy/nginx-host.my.ruc.su.example.conf` | nginx **на хосте** (TLS + HSTS) |
| `deploy/env.example` | шаблон `.env` |
| `deploy/application-local.properties.example` | секреты backend |
