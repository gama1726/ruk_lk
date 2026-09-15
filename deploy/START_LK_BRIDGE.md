# Мост my.ruc.su → start.ruc.su


Контракт Start
## Поток

1. Студент открывает `https://my.ruc.su/api/student/start/redirect`  
   (или кнопку «Start» в кабинете → тот же URL).
2. Без сессии ЛК → редирект на `app.frontend.login-url?next=/start`.
   После ввода кода студент возвращается на `/start` → снова этот redirect → Start.
3. С сессией ЛК сервером вызывает Start:

```
POST {app.start.api-base-url}{app.start.exchange-path}
Content-Type: application/json
```

4. Start отвечает одноразовым `ticket` (TTL ~60 с).
5. Браузер уходит на:

```
{app.start.frontend-url}{app.start.callback-path}?ticket=...
```

6. Start гасит ticket, создаёт/обновляет пользователя и делает `login()`.

ПДн **не** передаются в query — только ticket.

## Что должен реализовать Start

### 1. `POST /api/internal/lk/exchange`

Тело запроса (JSON):

| Поле | Тип | Описание |
|------|-----|----------|
| `sharedSecret` | string | Общий секрет с ЛК |
| `studentId` | string | Номер зачётки |
| `fullName` | string | ФИО одной строкой |
| `email` | string | Почта (или `{studentId}@student.ruc.su`) |
| `phone` | string | Телефон |
| `gender` | string | Пол из 1С |
| `birthDate` | string | Дата рождения |
| `funding` | string | Вид финансирования |
| `status` | string | Статус обучения |
| `faculty` | string | Факультет |
| `branch` | string | Филиал |
| `department` | string | Кафедра |
| `direction` | string | Направление |
| `level` | string | Уровень образования |
| `educationForm` | string | Форма обучения |
| `group` | string | Группа |
| `course` | string | Курс |
| `paymentStatus` | string | `ok` \| `due` \| `overdue` \| `unknown` \| `not_found` |
| `paymentFound` | boolean | Есть ли договор/график в 1С |
| `contractNumber` | string | Номер договора |
| `contractDate` | string | Дата договора |
| `nextPaymentDate` | string | Ближайший платёж |
| `nextPaymentAmount` | number \| null | Сумма ближайшего платежа |

Ответ **200**:

```json
{
  "ticket": "одноразовый-ключ",
  "expiresInSeconds": 60
}
```

Ошибки:

| Код | Когда |
|-----|--------|
| 401 / 403 | Неверный `sharedSecret` |
| 400 | Нет `studentId` / пустое тело |
| 500 | Внутренняя ошибка Start |

### 2. `GET /account/lk/callback?ticket=...`

- Найти ticket, проверить TTL, **удалить** (одноразовый).
- По `studentId` из payload: найти или создать `CustomUser` + `StudentProfile`.
- Обновить ФИО, email (осторожно при коллизиях), филиал, курс, направление, оплату.
- `django.contrib.auth.login(request, user)`.
- Redirect в ЛК Start (профиль / мои курсы).

Рекомендуемый ключ сопоставления: **зачётка** (`studentId`), не email.

### 3. Кнопка на странице входа Start (опционально)

```
https://my.ruc.su/api/student/start/redirect
```

После входа в ЛК студент снова нажимает Start / открывает тот же URL.

## Секреты на сервере ЛК

В `backend/application-local.properties`:

```properties
app.start.api-base-url=https://start.ruc.su
app.start.frontend-url=https://start.ruc.su
app.start.exchange-secret=ОБЩИЙ_СЕКРЕТ
app.start.exchange-path=/api/internal/lk/exchange
app.start.callback-path=/account/lk/callback
app.frontend.login-url=https://my.ruc.su/login
```

На Start тот же секрет (например `LK_EXCHANGE_SECRET`).

## Пример curl (проверка exchange)

```bash
curl -sS -X POST 'https://start.ruc.su/api/internal/lk/exchange' \
  -H 'Content-Type: application/json' \
  -d '{
    "sharedSecret": "ОБЩИЙ_СЕКРЕТ",
    "studentId": "172194",
    "fullName": "Иванов Иван Иванович",
    "email": "ivanov@example.com",
    "phone": "+79001234567",
    "gender": "Мужской",
    "birthDate": "2004-01-15",
    "funding": "Полное возмещение затрат",
    "status": "Обучается",
    "faculty": "",
    "branch": "",
    "department": "",
    "direction": "Экономика",
    "level": "Бакалавриат",
    "educationForm": "Очная",
    "group": "ЭК-21",
    "course": "2",
    "paymentStatus": "ok",
    "paymentFound": true,
    "contractNumber": "123",
    "contractDate": "2024-09-01",
    "nextPaymentDate": "",
    "nextPaymentAmount": null
  }'
```

Ожидание: `{"ticket":"...","expiresInSeconds":60}`.
