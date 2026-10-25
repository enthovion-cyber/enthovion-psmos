-- PTW Safety Gates, SCE/SIF Bypass, and Emergency Suspend System
-- Migration: 20261023220000_ptw_safety_gates_and_emergency_suspend.sql

-- 1. Add SCE / SIF Bypass tracking columns to permit_isolations
alter table if exists public.permit_isolations
  add column if not exists is_safety_critical boolean not null default false,
  add column if not exists is_sif_bypass boolean not null default false,
  add column if not exists sif_tag text,
  add column if not exists sil_rating text,
  add column if not exists bypass_reason text,
  add column if not exists bypass_certificate_number text,
  add column if not exists bypass_authorized_by text references public."User"(id) on delete set null,
  add column if not exists bypass_authorized_at timestamptz,
  add column if not exists bypass_risk_assessment_attached boolean not null default false,
  add column if not exists bypass_status text not null default 'Not Required';

create index if not exists idx_permit_isolations_sce on public.permit_isolations(tenant_id, is_safety_critical, is_sif_bypass);

-- 2. Create emergency suspension audit log table
create table if not exists public.permit_emergency_suspensions (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null references public."Site"(id) on delete cascade,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  alarm_type text not null default 'PLANT_ESD',
  reason text not null,
  suspended_by text references public."User"(id) on delete set null,
  suspended_at timestamptz not null default now(),
  permits_affected_count integer not null default 0,
  affected_permit_ids_json jsonb not null default '[]'::jsonb,
  status text not null default 'Active',
  resumed_at timestamptz,
  resumed_by text references public."User"(id) on delete set null,
  resume_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_permit_emergency_suspensions_site on public.permit_emergency_suspensions(tenant_id, site_id, status);

alter table public.permit_emergency_suspensions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'permit_emergency_suspensions' and policyname = 'tenant emergency suspension service access') then
    create policy "tenant emergency suspension service access" on public.permit_emergency_suspensions for all to service_role using (true) with check (true);
  end if;
end $$;
