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

**Деплой = `git push prod main`.** Хук: checkout → `npm ci` → `npm run build` (с `VITE_API_URL=/api`) → rsync `dist/` → `/var/www/yaruska`; затем rsync `server/` → `/opt/yaruska-api` → `npm ci` → `prisma generate` + `db push` → `systemctl restart yaruska-api`.

## Сервер
`ssh yaruska` — беспарольный root (ключ `~/.ssh/yaruska_key`).

- `/var/www/yaruska` — веб-рут nginx
- `/opt/yaruska-api` — бэкенд (systemd юнит `yaruska-api`, env в `.env`)
- `/opt/yaruska-api/.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT=4000`
- `/srv/git/yaruska.git` — bare-репо + post-receive (копия хука: `deploy/post-receive`)
- `/etc/nginx/sites-available/yaruska.ru` — nginx (копия: `deploy/nginx-yaruska.conf`)
- БД: PostgreSQL, база `yaruska`, пользователь `yaruska` / `Yaruska2022Db`

## API
- nginx проксирует `/api` → `127.0.0.1:4000`, `/uploads` → бэкенд
- Фронт собирается с `VITE_API_URL=/api` (same-origin)
- Fallback в `src/lib/api.ts` (`withFallback`) — демо-режим при недоступном API: демо-админ `ekozza@bk.ru`, пароли хэшируются SHA-256, заказы в `localStorage` (`demo_users`, `demo_orders`)
- Проверка API: `curl https://yaruska.ru/api/health`

## Deploy helpers
`deploy/` — post-receive хук, nginx-конфиг, systemd-юнит (секретные `.env`/SQL-файлы в .gitignore).
