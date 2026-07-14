alter table permit_isolations
  add column if not exists equipment_id text references "Equipment"(id) on delete set null,
  add column if not exists equipment_tag text,
  add column if not exists isolation_point_tag text,
  add column if not exists isolation_point_description text,
  add column if not exists breaker_tag text,
  add column if not exists blind_spade_number text,
  add column if not exists current_position text,
  add column if not exists lock_holder_name text,
  add column if not exists lock_holder_user_id text references "User"(id) on delete set null,
  add column if not exists isolation_method text,
  add column if not exists isolation_status text,
  add column if not exists verification_required boolean not null default false,
  add column if not exists second_person_verification_required boolean not null default false,
  add column if not exists confirmed_signature_id text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_signature_id text,
  add column if not exists deisolated_signature_id text,
  add column if not exists removal_verified_by text references "User"(id) on delete set null,
  add column if not exists removal_verified_at timestamptz,
  add column if not exists removal_verified_signature_id text,
  add column if not exists notes text;

update permit_isolations
set
  isolation_point_tag = coalesce(isolation_point_tag, isolation_point),
  isolation_point_description = coalesce(isolation_point_description, source_description),
  current_position = coalesce(current_position, normal_position),
  lock_holder_name = coalesce(lock_holder_name, lock_holder),
  isolation_status = coalesce(isolation_status, status)
where isolation_point_tag is null
   or isolation_point_description is null
   or current_position is null
   or lock_holder_name is null
   or isolation_status is null;

create table if not exists permit_isolation_certificates (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  certificate_number text not null,
  file_url text,
  file_key text,
  generated_by text references "User"(id) on delete set null,
  generated_at timestamptz not null default now(),
  version integer not null default 1,
  status text not null default 'Generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, permit_id, version)
);

create table if not exists permit_isolation_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  isolation_point_id text references permit_isolations(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists permit_isolation_certificates_permit_idx on permit_isolation_certificates(tenant_id, permit_id, generated_at desc);
create index if not exists permit_isolation_history_permit_idx on permit_isolation_history(tenant_id, permit_id, created_at desc);
create index if not exists permit_isolations_loto_idx on permit_isolations(tenant_id, permit_id, isolation_status, second_person_verification_required);

alter table permit_isolation_certificates enable row level security;
alter table permit_isolation_history enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'permit_isolation_certificates' and policyname = 'tenant isolation cert service access') then
    create policy "tenant isolation cert service access" on permit_isolation_certificates for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'permit_isolation_history' and policyname = 'tenant isolation history service access') then
    create policy "tenant isolation history service access" on permit_isolation_history for all to service_role using (true) with check (true);
  end if;
end $$;

-- Permission rows are seeded by supabase/seed/index.ts for this project.
-- Do not insert into a lowercase permissions table here; this database does not use it.
