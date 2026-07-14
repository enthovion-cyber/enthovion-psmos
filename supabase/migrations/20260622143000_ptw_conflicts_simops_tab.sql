alter table permit_conflicts
  add column if not exists override_status text not null default 'Not Requested',
  add column if not exists reason text,
  add column if not exists area_id text,
  add column if not exists unit_id text,
  add column if not exists equipment_id text,
  add column if not exists conflicting_equipment_id text,
  add column if not exists distance_meters numeric,
  add column if not exists detected_by text,
  add column if not exists detected_at timestamptz not null default now(),
  add column if not exists resolved_by text,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_notes text,
  add column if not exists required_controls jsonb not null default '[]'::jsonb,
  add column if not exists recommended_action text,
  add column if not exists why_it_matters text;

create table if not exists permit_conflict_overrides (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  conflict_id text not null references permit_conflicts(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  requested_by text references "User"(id) on delete set null,
  requested_at timestamptz not null default now(),
  justification text not null,
  required_controls jsonb not null default '[]'::jsonb,
  approved_by text references "User"(id) on delete set null,
  approved_at timestamptz,
  rejected_by text references "User"(id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  status text not null default 'Pending Approval',
  signature_id text,
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permit_conflict_overrides_status_check check (status in ('Pending Approval','Approved','Rejected','Cancelled'))
);

create table if not exists permit_simops_reviews (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  simops_required boolean not null default false,
  coordinator_id text references "User"(id) on delete set null,
  coordinator_name text,
  concurrent_work_description text,
  interaction_hazards text,
  required_controls text,
  control_room_acknowledged boolean not null default false,
  control_room_acknowledged_by text references "User"(id) on delete set null,
  control_room_acknowledged_at timestamptz,
  area_authority_reviewed boolean not null default false,
  area_authority_reviewed_by text references "User"(id) on delete set null,
  area_authority_reviewed_at timestamptz,
  status text not null default 'Required',
  comments text,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permit_simops_reviews_status_check check (status in ('Not Required','Required','Under Review','Approved','Rejected','Completed'))
);

create table if not exists permit_simops_controls (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  simops_review_id text not null references permit_simops_reviews(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  control_description text not null,
  responsible_user_id text references "User"(id) on delete set null,
  due_at timestamptz,
  status text not null default 'Open',
  completed_by text references "User"(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_conflict_matrix_rules (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  unit_id text,
  area_classification text,
  permit_type_a text not null,
  permit_type_b text not null,
  conflict_type text not null,
  severity text not null default 'High',
  block_activation boolean not null default true,
  override_allowed boolean not null default true,
  required_control text,
  radius_meters numeric,
  is_active boolean not null default true,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_conflict_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  conflict_id text references permit_conflicts(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_permit_conflicts_permit_status on permit_conflicts(tenant_id, permit_id, status, severity);
create index if not exists idx_permit_conflict_overrides_conflict on permit_conflict_overrides(tenant_id, conflict_id, created_at desc);
create index if not exists idx_permit_simops_reviews_permit on permit_simops_reviews(tenant_id, permit_id, created_at desc);
create index if not exists idx_permit_simops_controls_review on permit_simops_controls(tenant_id, simops_review_id);
create index if not exists idx_permit_conflict_matrix_rules_site on permit_conflict_matrix_rules(tenant_id, site_id, is_active);
create index if not exists idx_permit_conflict_history_permit on permit_conflict_history(tenant_id, permit_id, created_at desc);

alter table permit_conflict_overrides enable row level security;
alter table permit_simops_reviews enable row level security;
alter table permit_simops_controls enable row level security;
alter table permit_conflict_matrix_rules enable row level security;
alter table permit_conflict_history enable row level security;

notify pgrst, 'reload schema';
