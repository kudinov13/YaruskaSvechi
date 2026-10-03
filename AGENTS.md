# Yaruska (SvechiOne) — свечной магазин

## Стек
- Фронт: React + TypeScript + Vite. Сборка: `npm run build` (tsc -b && vite build). Dev: `npm run dev -- --host 127.0.0.1`.
- Бэкенд: `server/` — Express + Prisma + PostgreSQL + JWT + bcrypt.

## Админ
- Email: `ekozza@bk.ru`, пароль: `Artemmatvey2022` (bcrypt-хэш в БД, SHA-256 в демо-fallback)
- Админка: https://yaruska.ru/admin

## Деплой
Прод: https://yaruska.ru (сервер 157.22.193.196, Ubuntu, nginx, PostgreSQL, SSL Let's Encrypt с авто-продлением).

Git remotes:
- `origin` → https://github.com/kudinov13/YaruskaSvechi.git (бэкап)
- `prod` → `yaruska:/srv/git/yaruska.git` (bare-репо с post-receive хуком)

**Деплой = `git push prod main`.** Хук: checkout → `npm ci` → `npm run build` (с `VITE_API_URL=/api`) → rsync `dist/` → `/var/www/yaruska`; затем rsync `server/` → `/opt/yaruska-api` → `npm ci` → `prisma generate` + `db push` + `node prisma/seed-fragrances.js` → `systemctl restart yaruska-api`.

## Сервер
`ssh yaruska` — беспарольный root (ключ `~/.ssh/yaruska_key`).

- `/var/www/yaruska` — веб-рут nginx
- `/opt/yaruska-api` — бэкенд (systemd юнит `yaruska-api`, env в `.env`)
- `/opt/yaruska-api/.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT=4000`, `TELEGRAM_*` (уведомления)
- Уведомления о заказах в Telegram: `server/src/services/telegram.js` → бот @YaruskaUved_bot пишет админу (chat_id `1018181946`) через `TELEGRAM_PROXY` (api.telegram.org с сервера недоступен напрямую). Админу нужно один раз нажать /start в боте — иначе `chat not found`.
- `/srv/git/yaruska.git` — bare-репо + post-receive (копия хука: `deploy/post-receive`)
- `/etc/nginx/sites-available/yaruska.ru` — nginx (копия: `deploy/nginx-yaruska.conf`)
- БД: PostgreSQL, база `yaruska`, пользователь `yaruska` / `Yaruska2022Db`

## API
- nginx проксирует `/api` → `127.0.0.1:4000`, `/uploads` → бэкенд
- Фронт собирается с `VITE_API_URL=/api` (same-origin)
- Fallback в `src/lib/api.ts` (`withFallback`) — демо-режим при недоступном API: демо-админ `ekozza@bk.ru`, пароли хэшируются SHA-256, заказы в `localStorage` (`demo_users`, `demo_orders`)
- Проверка API: `curl https://yaruska.ru/api/health`
- Ароматы: таблица `Fragrance`, сид `server/prisma/fragrances.json` (только добавляет недостающие). Публично: `GET /api/products/fragrances`; админ-CRUD: `/api/admin/fragrances` + вкладка «Ароматы» в админке. Фронт берёт список через `useFragrances()` (кэш + статик-фолбэк `src/lib/fragrances.ts`). Выбор аромата обязателен: на карточке товара и при чекауте; попадает в `Order.comment`.

## Deploy helpers
`deploy/` — post-receive хук, nginx-конфиг, systemd-юнит, health-check и schema-скрипты (секретные `.env`/SQL-файлы в .gitignore).

## Переезд на новый ПК
1. `git clone https://github.com/kudinov13/YaruskaSvechi.git` (repo приватный — нужен доступ к аккаунту kudinov13).
2. Настроить SSH к серверу: скопировать ключ `~/.ssh/yaruska_key` со старой машины и добавить в `~/.ssh/config`:
   `Host yaruska → HostName 157.22.193.196, User root, IdentityFile ~/.ssh/yaruska_key`
3. Секреты НЕ в репо — вытянуть с сервера: `scp yaruska:/opt/yaruska-api/.env server/.env` (шаблон переменных: `server/.env.example`).
4. Локально: `npm ci`, `cd server && npm ci && npx prisma generate`. Фронт `npm run dev`, бэк `npm run dev` в `server/`.
5. Деплой: `git remote add prod yaruska:/srv/git/yaruska.git` → `git push prod main`.
6. Загруженные фото товаров лежат только на сервере (`/opt/yaruska-api/uploads`) — для локальной копии: `scp -r yaruska:/opt/yaruska-api/uploads server/uploads`.
