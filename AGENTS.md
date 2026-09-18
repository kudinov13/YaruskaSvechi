# Yaruska (SvechiOne) — свечной магазин

## Стек
React + TypeScript + Vite. Сборка: `npm run build` (tsc -b && vite build). Dev: `npm run dev -- --host 127.0.0.1`.

## Деплой

Прод: https://yaruska.ru (сервер 157.22.193.196, Ubuntu, nginx, SSL Let's Encrypt с авто-продлением).

Git remotes:
- `origin` → https://github.com/kudinov13/YaruskaSvechi.git (бэкап)
- `prod` → `yaruska:/srv/git/yaruska.git` (bare-репо на сервере с post-receive хуком)

**Деплой = `git push prod main`.** Хук сам делает checkout → `npm ci` → `npm run build` → rsync `dist/` в `/var/www/yaruska`.

## SSH

`ssh yaruska` — беспарольный root-доступ (ключ `~/.ssh/yaruska_key`, алиас в `~/.ssh/config`).
Пароль root: Artemmatvey2022 (известен пользователю).

Серверные пути:
- `/var/www/yaruska` — веб-рут nginx
- `/srv/git/yaruska.git` — bare-репо + post-receive хук
- `/opt/yaruska-build` — рабочая директория сборки на сервере
- `/etc/nginx/sites-available/yaruska.ru` — конфиг nginx

## API / fallback

Бэкенд (`server/`, Express + Prisma) не запущен. `src/lib/api.ts` имеет `withFallback` — при недоступности API работают демо-данные (товары, регистрация/вход через localStorage `demo_users`, заказы `demo_orders`).
