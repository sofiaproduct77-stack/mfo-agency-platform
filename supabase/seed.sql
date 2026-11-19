-- Dev seed: sample MFO (run after first admin profile exists)
-- Replace admin user creation via Supabase Auth dashboard +:
-- insert into public.profiles (id, full_name, role) values ('<USER_UUID>', 'Администратор', 'admin');

insert into public.mfo_organizations (name, website_url, is_active)
values
  ('Пример МФО', 'https://example.com', true)
on conflict do nothing;

-- Offers require mfo id — run in SQL editor after org insert:
-- insert into public.offers (mfo_id, product_name, terms, agent_reward_amount, partner_url)
-- select id, 'Займ до 30 000 ₽', 'Ставка от 0% первый займ', 500, 'https://example.com/apply'
-- from public.mfo_organizations where name = 'Пример МФО' limit 1;
