# MFO Agency Platform

Внутренняя мобильная платформа (PWA) для агентства по привлечению клиентов в МФО.

**Стек:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + PostgreSQL + RLS)

## Требования

- Node.js 20 LTS или новее
- Аккаунт [Supabase](https://supabase.com)

## Быстрый старт

### Автоматическая локальная среда (Windows)

Уже выполнено: установка Node.js, `npm install`, сборка проекта.

Осталось **один раз** (нужны права администратора и перезагрузка):

```powershell
cd $env:USERPROFILE\Projects\mfo-agency-platform
powershell -ExecutionPolicy Bypass -File .\scripts\enable-docker.ps1
# перезагрузка ПК → Docker Desktop → Running
npm run setup:local
npm run dev
```

Подробнее: **SETUP-LOCAL.md** (логин админа по умолчанию).

### Ручной старт (облако Supabase)

```bash
cd Projects/mfo-agency-platform
npm install
```

### 2. Supabase

1. Создайте проект в Supabase.
2. В **SQL Editor** выполните файлы по порядку:
   - `supabase/migrations/20260330000000_initial_schema.sql`
   - `supabase/migrations/20260330000001_application_events_agent_insert.sql`
   - `supabase/migrations/20260330000002_audit_insert.sql`
3. (Опционально) `supabase/seed.sql` — пример МФО.

### 3. Первый администратор

1. **Authentication → Users → Add user** — email и пароль.
2. Скопируйте UUID пользователя.
3. В SQL Editor:

```sql
insert into public.profiles (id, full_name, role)
values ('<USER_UUID>', 'Администратор', 'admin');
```

### 4. Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

| Переменная | Где взять |
|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (только сервер) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` локально |

### 5. Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000), войдите как администратор.

### PWA на телефоне

В Chrome/Safari: «Добавить на главный экран». Для production укажите HTTPS и реальный `NEXT_PUBLIC_APP_URL`.

## Роли

| Роль | Раздел |
|------|--------|
| **Агент** | Дашборд, каталог, заявки, вознаграждения, персональные ссылки и QR |
| **Руководитель** | Команда, заявки агентов, подтверждение продаж, аналитика |
| **Администратор** | Пользователи, МФО/офферы, выплаты, журнал |

## Воронка заявки

`link_click` → `application_submitted` → `under_review` → `approved` → `sale_confirmed` → `reward_accrued` → `reward_paid` (или `rejected`).

Продажа засчитывается только после **«Продажа подтверждена»** (руководитель/админ). Начисление вознаграждения при подтверждении делает **админ** (автоматически по сумме оффера). Выплата — кнопка «Выплачено» в админ-дашборде.

## Персональные ссылки

Формат: `{NEXT_PUBLIC_APP_URL}/r/{short_code}` — учёт клика и редирект на URL партнёра.

## План агента

Таблица `plans`. Пример на текущий месяц:

```sql
insert into public.plans (agent_id, period_start, period_end, target_sales)
values ('<AGENT_UUID>', date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date, 10);
```

## Деплой

- **Frontend:** Vercel, те же env-переменные.
- **Backend:** Supabase (уже в облаке).
- В Supabase **Authentication → URL Configuration** добавьте домен приложения.

## Структура

```
app/          — маршруты (agent, manager, admin, login, /r)
actions/      — Server Actions
components/   — UI и layout
lib/          — Supabase, аналитика, утилиты
supabase/     — SQL-миграции
types/        — доменные типы
```

## Безопасность

- Пароли только в Supabase Auth.
- RLS на всех таблицах.
- Service Role Key — только на сервере (создание пользователей, трекинг `/r/`).
- Паспортные и банковские данные заёмщиков не собираются.

## Скрипты

```bash
npm run dev        # разработка
npm run build      # production-сборка
npm run typecheck  # TypeScript
npm run lint       # ESLint
```
