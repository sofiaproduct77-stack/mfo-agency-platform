drop policy if exists "application_events_insert" on public.application_events;

create policy "application_events_insert" on public.application_events
for insert
with check (
  public.is_admin()
  or public.current_user_role() = 'manager'
  or exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.agent_id = auth.uid()
  )
);
