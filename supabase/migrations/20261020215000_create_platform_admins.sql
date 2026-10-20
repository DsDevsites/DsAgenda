-- Explicit allowlist for platform-level administrators (DS DevSites operators).
-- Keep this table empty until the owner adds a trusted Auth user UUID via SQL editor.
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
create policy "platform admins can read their own admin flag"
on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()));
grant select on public.platform_admins to authenticated;