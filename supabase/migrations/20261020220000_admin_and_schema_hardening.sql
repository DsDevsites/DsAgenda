-- Harden access to the platform-admin allowlist.
-- Platform status must be managed through trusted SQL/service-side operations only.
drop policy if exists "platform admins can read their own admin flag" on public.platform_admins;
revoke all on public.platform_admins from anon, authenticated;
