alter table permit_signatures
  add column if not exists signature_requirement_id text,
  add column if not exists signature_role text,
  add column if not exists signature_purpose text not null default 'Approval',
  add column if not exists required_for_status text,
  add column if not exists assigned_user_id text references "User"(id) on delete set null,
  add column if not exists assigned_role_id text,
  add column if not exists assigned_department_id text,
  add column if not exists status text not null default 'Pending',
  add column if not exists signed_at timestamptz,
  add column if not exists signature_id text,
  add column if not exists user_agent text,
  add column if not exists comment text,
  add column if not exists rejection_reason text,
  add column if not exists correction_required text,
  add column if not exists expires_at timestamptz,
  add column if not exists revalidation_required boolean not null default false;

update permit_signatures
set
  signature_role = coalesce(signature_role, signature_type),
  status = case when signed_by is not null then 'Signed' else status end,
  signed_at = coalesce(signed_at, created_at),
  signature_id = coalesce(signature_id, id)
where signature_role is null or signed_at is null or signature_id is null;

create table if not exists permit_signature_requirements (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  permit_type text,
  risk_level text,
  area_classification text,
  equipment_criticality text,
  signature_role text not null,
  signature_purpose text not null,
  required_for_status text not null,
  assigned_role_id text,
  is_required boolean not null default true,
  condition_rule jsonb not null default '{}'::jsonb,
  expires_on_extension boolean not null default false,
  expires_on_suspension boolean not null default false,
  requires_revalidation boolean not null default false,
  is_active boolean not null default true,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_signature_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  signature_id text references permit_signatures(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_permit_signatures_permit_status on permit_signatures(tenant_id, permit_id, status, signature_role);
create index if not exists idx_permit_signature_requirements_scope on permit_signature_requirements(tenant_id, site_id, permit_type, is_active);
create index if not exists idx_permit_signature_history_permit on permit_signature_history(tenant_id, permit_id, created_at desc);

alter table permit_signature_requirements enable row level security;
alter table permit_signature_history enable row level security;

notify pgrst, 'reload schema';
