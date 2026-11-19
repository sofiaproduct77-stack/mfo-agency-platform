create policy "audit_insert_actor" on public.audit_log
for insert
with check (actor_id = auth.uid());
