-- DS Agenda initial multi-tenant schema.
-- Applied to Supabase project DS-Agenda. Keep this migration in version control.
create extension if not exists pgcrypto;

create type public.business_kind as enum ('barbearia', 'estetica');
create type public.member_role as enum ('owner', 'admin', 'professional');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  kind public.business_kind not null,
  slug text unique,
  phone text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  phone text, email text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text, phone text, active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text, duration_minutes integer not null default 30 check (duration_minutes between 5 and 720),
  price_cents integer not null default 0 check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  service_name text not null check (char_length(trim(service_name)) between 2 and 120),
  professional_name text, starts_at timestamptz not null, ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  price_cents integer not null default 0 check (price_cents >= 0),
  notes text, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table public.subscription_accounts (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_code text not null default 'trial',
  status text not null default 'trial' check (status in ('trial','active','past_due','cancelled','suspended')),
  provider text, provider_customer_id text, provider_subscription_id text,
  current_period_end timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_org_name_idx on public.customers (organization_id, lower(name));
create index professionals_org_active_idx on public.professionals (organization_id, active);
create index services_org_active_idx on public.services (organization_id, active);
create index appointments_org_start_idx on public.appointments (organization_id, starts_at);
create index appointments_org_status_idx on public.appointments (organization_id, status);
create index organization_members_user_idx on public.organization_members (user_id, organization_id);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=(select auth.uid()));
$$;
create or replace function public.has_org_role(target_org uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=(select auth.uid()) and m.role=any(allowed_roles));
$$;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.member_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.member_role[]) to authenticated;

create or replace function public.create_first_organization(org_name text, org_kind public.business_kind)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_org_id uuid; clean_name text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 clean_name := trim(coalesce(org_name, ''));
 if char_length(clean_name)<2 or char_length(clean_name)>120 then raise exception 'Organization name must contain between 2 and 120 characters'; end if;
 if exists(select 1 from public.organization_members m where m.user_id=auth.uid()) then raise exception 'User already belongs to an organization'; end if;
 insert into public.organizations(name,kind) values(clean_name,org_kind) returning id into new_org_id;
 insert into public.organization_members(organization_id,user_id,role) values(new_org_id,auth.uid(),'owner');
 insert into public.subscription_accounts(organization_id,plan_code,status) values(new_org_id,'trial','trial');
 return new_org_id;
end;
$$;
revoke all on function public.create_first_organization(text, public.business_kind) from public;
grant execute on function public.create_first_organization(text, public.business_kind) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.subscription_accounts enable row level security;

create policy "members can read their organizations" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "owners and admins can update their organization" on public.organizations for update to authenticated using (public.has_org_role(id,array['owner','admin']::public.member_role[])) with check (public.has_org_role(id,array['owner','admin']::public.member_role[]));
create policy "members can read organization memberships" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "owners and admins can manage memberships" on public.organization_members for all to authenticated using (public.has_org_role(organization_id,array['owner','admin']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));
create policy "members can manage customers" on public.customers for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members can manage professionals" on public.professionals for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members can manage services" on public.services for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members can manage appointments" on public.appointments for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "owners and admins can view subscription" on public.subscription_accounts for select to authenticated using (public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at=now(); return new; end; $$;
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger professionals_updated_at before update on public.professionals for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger subscription_accounts_updated_at before update on public.subscription_accounts for each row execute function public.set_updated_at();