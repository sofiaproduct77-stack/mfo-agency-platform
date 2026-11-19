-- Promo events / goals with bonus rewards for agents

create table public.promo_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reward_amount numeric(12, 2) not null check (reward_amount >= 0),
  period_start date not null,
  period_end date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_events enable row level security;

create policy "promo_events_select_active" on public.promo_events
for select using (
  auth.uid() is not null and (is_active = true or public.is_admin())
);

create policy "promo_events_admin" on public.promo_events
for all using (public.is_admin()) with check (public.is_admin());
