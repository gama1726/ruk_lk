# Техдизайн: справки и оправданные отсутствия

Согласовано с [`07-open-questions.md`](07-open-questions.md) и [`01-requirements.md`](01-requirements.md).

## Опора на текущий код

| Тема | Где |
|------|-----|
| Кампусы | `LkAbsenceReportCampus` |
| Секции админов | `LkAdminSection` |
| Preview | `PreviewStudents`, `FeaturesController` |
| Сжатие картинок | `PassPhotoValidationService.normalizeForStorage` |
| Локальное хранение | `PassPhotoStorageService` + `app.pass-photo.storage-dir` |
| Сборка отчёта / 21:00 | `LkAbsenceReportService`, `LkAbsenceReportAutoScheduler` |
| Уведомления | email / MAX отправители как у OTP / absence notice |
| Кампус профиля | cabinet / branch catalog (как для статистики кабинета) |

## Feature / доступ

- Студент и родитель: `previewStudents.isPreviewStudent(studentId)` на каждом API.
- Админ: секции `CERTIFICATE_REVIEW_HEAD|KAZAN|KRASNODAR`.
- Позже: глобальный `app.certificates.enabled` без preview.

## Секции и UI админки

Три секции + **три пункта меню** (не один фильтр).  
`requireSection` строго по кампусу заявки.  
Миграция enum/CHECK — по образцу прошлых миграций секций.

## Модель

### `lk_certificate_request`

- `id`, `student_id`, `campus` (из профиля при создании, immutable)
- `submitted_by`: `STUDENT` | `PARENT` + опционально id/фио родителя
- `type`: `SICK_LEAVE` | `MILITARY_EXEMPTION` | `OTHER`
- `status`: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`
- `comment`, `rejection_reason`
- `approved_from`, `approved_to` (date, not null iff APPROVED)
- `reviewed_by`, `reviewed_at`
- timestamps

**Период = поля на заявке.** Отдельной таблицы календаря нет.  
Исключение из отчёта: `status=APPROVED AND campus=? AND approved_from <= :d AND approved_to >= :d`.

### `lk_certificate_attachment`

- `request_id`, `storage_key`, `original_filename`, `content_type`, `size_bytes`, `kind` (`ORIGINAL_PDF` | `NORMALIZED_IMAGE`)

## Файлы

| Тип | Обработка |
|-----|-----------|
| JPG/PNG/HEIC | `normalizeForStorage` (как pass-photo: max edge, JPEG quality, потолок после сжатия) |
| PDF | сохранить as-is, лимит **50 МБ** на upload |

- Upload multipart, max 50 МБ, **до 5** вложений (`spring.servlet.multipart` + явная проверка).
- Storage: `app.certificates.storage-dir` на volume (зеркало pass-photo).
- Download только через API сессии.
- Retention job: удалять файлы спустя **30 дней** после `REJECTED`/`CANCELLED`/`approved_to`.

Почему не S3 на этапе 1: у pass-photo уже диск; проще тот же ops (бэкап volume). Интерфейс `CertificateStorage` оставить сменным.

## Настройки кампуса (notify)

Таблица/entity настроек справок по кампусу (или поля рядом с absence settings):

- `notify_email` (nullable) — если не пусто, при новой `PENDING` шлём письмо на этот адрес.
- UI: в каждом разделе справок или отдельной странице настроек (супер-админ / админ с секцией).

## API

### Студент `/api/student/certificates`

- list / create(+files) / get / download attachment / cancel  
- Guard: student session + preview + ownership  

### Родитель `/api/auth/parent/...` или `/api/parent/certificates`

- те же операции в контексте `ParentSession.studentId`  
- Guard: parent session + preview(ребёнок) + ownership  

### Админ `/api/lk-admin/certificates/{campus}`

- list PENDING(+фильтры) / get / download / approve `{from,to}` / reject `{reason}`  
- Guard: секция этого campus  

## Exclusion в отчёте

В `LkAbsenceReportService` при формировании кандидатов на день `D`:

```text
excused = certificateRequestRepo.findApprovedStudentIds(campus, D)
// убрать excused из absent/monitoring set
```

Не обновлять rows уже сохранённого отчёта при позднем approve.

## Уведомления

- На `PENDING`: админам с секцией кампуса (email учётки — default; уточнить общий ящик позже).
- На approve/reject: email и/или MAX заявителю (студент — контакты профиля; родитель — контакты parent session), текст с периодом или причиной.

## Тесты

- Preview / parent / campus isolation  
- Approve без дат / reject без причины → 400  
- Image normalized; PDF unchanged; >50MB reject  
- Exclusion query; «поздний approve не трогает saved report»  

## Порядок кода

1. Секции + меню админки ×3  
2. Entity + disk storage + normalize reuse  
3. Student + parent API/UI (preview)  
4. Admin approve/reject + notifications  
5. Hook exclusion в absence report  
6. Staging allowlist  
