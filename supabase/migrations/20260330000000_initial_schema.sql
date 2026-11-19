-- MFO Agency Platform — initial schema + RLS

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'manager', 'agent');

create type public.application_status as enum (
  'link_click',
  'application_submitted',
  'under_review',
  'approved',
  'sale_confirmed',
  'reward_accrued',
  'reward_paid',
  'rejected'
);

create type public.reward_status as enum ('accrued', 'paid');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'agent',
  manager_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_manager_is_manager check (
    manager_id is null or manager_id <> id
  )
);

create index profiles_role_idx on public.profiles (role);
create index profiles_manager_id_idx on public.profiles (manager_id);

create table public.mfo_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  mfo_id uuid not null references public.mfo_organizations (id) on delete cascade,
  product_name text not null,
  terms text not null,
  agent_reward_amount numeric(12, 2) not null check (agent_reward_amount >= 0),
  partner_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offers_mfo_id_idx on public.offers (mfo_id);
create index offers_is_active_idx on public.offers (is_active);

create table public.agent_offers (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  short_code text not null unique,
  created_at timestamptz not null default now(),
  unique (agent_id, offer_id)
);

create index agent_offers_agent_id_idx on public.agent_offers (agent_id);
create index agent_offers_short_code_idx on public.agent_offers (short_code);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete restrict,
  offer_id uuid not null references public.offers (id) on delete restrict,
  agent_offer_id uuid references public.agent_offers (id) on delete set null,
  status public.application_status not null default 'application_submitted',
  client_label text,
  sale_amount numeric(12, 2),
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_agent_id_idx on public.applications (agent_id);
create index applications_status_idx on public.applications (status);
create index applications_created_at_idx on public.applications (created_at desc);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index application_events_application_id_idx on public.application_events (application_id);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  status public.reward_status not null default 'accrued',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rewards_agent_id_idx on public.rewards (agent_id);
create index rewards_status_idx on public.rewards (status);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  target_sales integer not null check (target_sales > 0),
  created_at timestamptz not null default now(),
  unique (agent_id, period_start, period_end)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- Helpers
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.is_manager_of(agent uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = agent
      and p.manager_id = auth.uid()
      and exists (
        select 1 from public.profiles m
        where m.id = auth.uid() and m.role = 'manager' and m.is_active = true
      )
  );
$$;

create or replace function public.updated_at_trigger()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.updated_at_trigger();
create trigger offers_updated_at before update on public.offers
for each row execute function public.updated_at_trigger();
create trigger applications_updated_at before update on public.applications
for each row execute function public.updated_at_trigger();
create trigger rewards_updated_at before update on public.rewards
for each row execute function public.updated_at_trigger();

-- RLS
alter table public.profiles enable row level security;
alter table public.mfo_organizations enable row level security;
alter table public.offers enable row level security;
alter table public.agent_offers enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.rewards enable row level security;
alter table public.plans enable row level security;
alter table public.audit_log enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (
  id = auth.uid() or public.is_admin() or public.is_manager_of(id)
);

create policy "profiles_update_admin" on public.profiles for update using (
  public.is_admin()
);

create policy "profiles_insert_admin" on public.profiles for insert with check (
  public.is_admin()
);

-- MFO & offers: read all active for authenticated; write admin
create policy "mfo_select_authenticated" on public.mfo_organizations for select using (
  auth.uid() is not null and (is_active = true or public.is_admin())
);

create policy "mfo_admin_all" on public.mfo_organizations for all using (
  public.is_admin()
) with check (public.is_admin());

create policy "offers_select_authenticated" on public.offers for select using (
  auth.uid() is not null and (is_active = true or public.is_admin())
);

create policy "offers_admin_all" on public.offers for all using (
  public.is_admin()
) with check (public.is_admin());

-- Agent offers
create policy "agent_offers_select" on public.agent_offers for select using (
  agent_id = auth.uid() or public.is_admin() or public.is_manager_of(agent_id)
);

create policy "agent_offers_insert_own" on public.agent_offers for insert with check (
  agent_id = auth.uid()
);

-- Applications
create policy "applications_select" on public.applications for select using (
  agent_id = auth.uid() or public.is_admin() or public.is_manager_of(agent_id)
);

create policy "applications_insert" on public.applications for insert with check (
  agent_id = auth.uid()
  or public.is_admin()
  or public.is_manager_of(agent_id)
);

create policy "applications_update" on public.applications for update using (
  public.is_admin()
  or (public.current_user_role() = 'manager' and public.is_manager_of(agent_id))
);

-- Events
create policy "application_events_select" on public.application_events for select using (
  exists (
    select 1 from public.applications a
    where a.id = application_id
      and (a.agent_id = auth.uid() or public.is_admin() or public.is_manager_of(a.agent_id))
  )
);

create policy "application_events_insert" on public.application_events for insert with check (
  public.is_admin()
  or public.current_user_role() = 'manager'
);

-- Rewards
create policy "rewards_select" on public.rewards for select using (
  agent_id = auth.uid() or public.is_admin() or public.is_manager_of(agent_id)
);

create policy "rewards_update_admin" on public.rewards for update using (
  public.is_admin()
);

create policy "rewards_insert_admin" on public.rewards for insert with check (
  public.is_admin()
);

-- Plans
create policy "plans_select" on public.plans for select using (
  agent_id = auth.uid() or public.is_admin() or public.is_manager_of(agent_id)
);

create policy "plans_admin" on public.plans for all using (
  public.is_admin()
) with check (public.is_admin());

-- Audit: admin only
create policy "audit_admin" on public.audit_log for select using (
  public.is_admin()
);

-- Public read for redirect route uses service role; anon can insert link_click via service

-- Analytics view
create or replace view public.v_agent_daily_stats as
select
  a.agent_id,
  date_trunc('day', a.created_at)::date as day,
  count(*) filter (where a.status = 'link_click') as clicks,
  count(*) filter (where a.status not in ('link_click', 'rejected')) as applications,
  count(*) filter (where a.status in ('sale_confirmed', 'reward_accrued', 'reward_paid')) as sales,
  coalesce(sum(r.amount) filter (where r.status in ('accrued', 'paid')), 0) as revenue
from public.applications a
left join public.rewards r on r.application_id = a.id
group by a.agent_id, date_trunc('day', a.created_at)::date;

grant select on public.v_agent_daily_stats to authenticated;
