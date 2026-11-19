-- Realtime for agent notifications (local + hosted Supabase)

do $$
begin
  alter publication supabase_realtime add table public.applications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.promo_events;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rewards;
exception
  when duplicate_object then null;
end $$;
