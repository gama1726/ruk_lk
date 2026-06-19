# Личный кабинет студента РУК

Клиентская часть личного кабинета для Российского университета кооперации. Пока работает на мок-данных, без backend.

## Как запустить

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

## Что внутри

```
src/
  pages/     — экраны (home.tsx, schedule.tsx…)
  layout/    — оболочка входа и кабинета
  ui/        — кнопки, поля, таблицы
  styles/    — цвета и глобальные стили
  paths.ts   — адреса разделов
  router.tsx — маршруты
```

Цвета — в `src/styles/tokens.css`. Моки — в `src/mocks/`.

## JSDoc

В `auth.ts`, `study.ts`, `mocks/` и layout-обёртках описания через JSDoc: `@param`, `@returns`, `@example`, `@see`, `@remarks`. Поля типов комментируем inline. UI-компоненты без очевидной логики не раздуваем.

## Backend

Когда будет API — прописать адрес в `.env`, дописать клиент запросов и заменить моки. Авторизацию через cookie/SSO, без токенов в localStorage.
