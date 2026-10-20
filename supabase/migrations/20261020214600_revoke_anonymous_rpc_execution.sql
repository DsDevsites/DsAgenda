-- Tighten function grants: only authenticated users may call these SECURITY DEFINER RPCs.
revoke all on function public.is_org_member(uuid) from anon;
revoke all on function public.has_org_role(uuid, public.member_role[]) from anon;
revoke all on function public.create_first_organization(text, public.business_kind) from anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.create_first_organization(text, public.business_kind) to authenticated;