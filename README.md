# MFO Agency Platform

**Цифровая воронка для МФО-агентства:** агенты ведут клиентов по офферам через персональные ссылки и QR, руководители подтверждают продажи, админы управляют выплатами и МФО-партнёрами. Работает как **PWA** — удобно с телефона, без отдельного мобильного приложения в сторах.

### Ключевые возможности

- Личный кабинет **агента**: каталог офферов, заявки, доход, план продаж на месяц, шаринг ссылок.
- Кабинет **руководителя**: команда, аналитика, подтверждение продаж.
- **Админка**: пользователи, офферы, аудит, выплаты вознаграждений.
- Трекинг **/r/{short_code}** → клик → партнёрский URL; события заявки до статуса `reward_paid`.
- **RLS** в PostgreSQL — каждый видит только свои данные по роли.

**Стек:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + PostgreSQL + RLS)

## Анимации и UX-движение

Интерфейс заточен под **мобильный PWA**: отклик на жесты, загрузки без «мигания», праздник при успехе. Стили — в `app/globals.css`, логика — в client-компонентах.

| Эффект | Где | Как работает |
|--------|-----|----------------|
| **Pull-to-refresh** | Оболочка агента | `PullToRefresh` — потянуть сверху, кольцо прогресса, `router.refresh()` |
| **Переключение вкладок** | Доход, офферы и др. | Класс `animate-tab-enter` (`@keyframes tab-enter`) — слайд + fade |
| **Тосты агента** | Продажи, события в реальном времени | `AgentToastProvider` + `animate-fade-in`, авто-скрытие ~4 с |
| **Конфетти + вибрация** | Подтверждённая продажа | `lib/celebration.ts` — `canvas-confetti`, `navigator.vibrate`, уважает reduced motion |
| **Скелетоны** | Дашборд при загрузке | `skeleton-shimmer` — бегущий блик по плейсхолдерам |
| **Градиентные поверхности** | Карточки, фон кабинета | `surface-gradient-drift` / `shimmer` — мягкое движение фона |
| **Успех плана продаж** | Прогресс-бар | `progress-success-glow` при достижении цели |
| **Нижняя навигация** | Agent layout | Индикатор активного таба с плавным `transition` по позиции |
| **Фон страницы** | Login / shell | `page-backdrop-orbit` — медленное орбитальное свечение |

Уведомления о заявках подтягиваются через Supabase realtime → короткая анимация появления без перезагрузки всей страницы.

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
