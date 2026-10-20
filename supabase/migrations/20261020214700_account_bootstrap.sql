-- Safely create the first organization after signup and bind its creator as owner.
create or replace function public.create_first_organization(org_name text, org_kind public.business_kind)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
  clean_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  clean_name := trim(coalesce(org_name, ''));
  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Organization name must contain between 2 and 120 characters';
  end if;
  if org_kind not in ('barbearia'::public.business_kind, 'estetica'::public.business_kind) then
    raise exception 'Invalid organization type';
  end if;
  if exists(select 1 from public.organization_members m where m.user_id = auth.uid()) then
    raise exception 'User already belongs to an organization';
  end if;
  insert into public.organizations(name, kind)
  values(clean_name, org_kind)
  returning id into new_org_id;
  insert into public.organization_members(organization_id, user_id, role)
  values(new_org_id, auth.uid(), 'owner');
  insert into public.subscription_accounts(organization_id, plan_code, status)
  values(new_org_id, 'trial', 'trial');
  return new_org_id;
end;
$$;
revoke all on function public.create_first_organization(text, public.business_kind) from public;
revoke all on function public.create_first_organization(text, public.business_kind) from anon;
grant execute on function public.create_first_organization(text, public.business_kind) to authenticated;