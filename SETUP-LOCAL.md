# Локальный запуск одной командой (после Docker)

## Что уже сделано на машине

- Node.js LTS установлен
- `npm install` выполнен
- Docker Desktop установлен
- Проект успешно собирается (`npm run build`)

## Что нужно один раз подтвердить в Windows

Docker показывает: **Virtual Machine Platform is not enabled**.

1. Если появилось окно UAC «Разрешить изменения» — нажмите **Да** (включение WSL).
2. После установки компонентов **перезагрузите ПК**.
3. Запустите **Docker Desktop** и дождитесь статуса **Running**.

## Запуск платформы

В PowerShell:

```powershell
cd $env:USERPROFILE\Projects\mfo-agency-platform
npm run setup:local
npm run dev
```

`setup:local` поднимает Supabase локально, применяет миграции, создаёт `.env.local`, админа и тестовый оффер.

### Вход по умолчанию

| | |
|---|---|
| URL | http://localhost:3000/login |
| Email | admin@mfo-agency.local |
| Пароль | Admin123456! |

Пароль можно переопределить перед setup:

```powershell
$env:MFO_ADMIN_PASSWORD = "YourSecurePass123!"
npm run setup:local
```

## Облачный Supabase (без Docker)

1. Создайте проект на https://supabase.com  
2. Выполните SQL из `supabase/migrations/`  
3. Заполните `.env.local` по `.env.example`  
4. Создайте админа в Auth + `profiles` (см. README.md)

## Тест с телефона (без платного сервера)

Телефон и ПК должны быть в **одной Wi‑Fi**. Платить за хостинг не нужно — сайт крутится у вас дома.

1. Узнайте IPv4 ПК (PowerShell): `ipconfig` → строка **IPv4** у Wi‑Fi, например `192.168.1.42`.

2. В `.env.local` временно подставьте IP вместо `localhost` (перезапустите `npm run dev` после сохранения):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321
   NEXT_PUBLIC_APP_URL=http://192.168.1.42:3000
   ```

   Ключи `NEXT_PUBLIC_SUPABASE_ANON_KEY` и `SUPABASE_SERVICE_ROLE_KEY` не меняйте.

3. Supabase уже слушает порты на ПК (`npm run db:start` или `supabase start`).

4. Запуск приложения для локальной сети:

   ```powershell
   npm run dev:lan
   ```

   (`dev:lan` = Next.js на `0.0.0.0`, не только на localhost.)

5. На телефоне откройте `http://192.168.1.42:3000` (свой IP).

6. Если не открывается — **брандмауэр Windows**: разрешите Node.js / порты **3000** и **54321** для частной сети.

**Ограничения:** это HTTP, не интернет снаружи дома. PWA «на главный экран» на iOS частично требует HTTPS — для быстрой проверки UI и логина обычно хватает браузера. Доступ из другой сети (мобильный интернет вне дома) — бесплатные туннели вроде [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) или ngrok (сложнее, т.к. нужно пробросить и Next, и Supabase).

После теста можно вернуть в `.env.local` `localhost`, если удобнее работать только на ПК.
