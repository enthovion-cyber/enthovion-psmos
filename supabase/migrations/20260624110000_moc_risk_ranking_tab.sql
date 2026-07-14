alter table moc_risk_assessments add column if not exists status text not null default 'Draft';
alter table moc_risk_assessments add column if not exists safety_score integer not null default 0;
alter table moc_risk_assessments add column if not exists safety_label text not null default 'None';
alter table moc_risk_assessments add column if not exists safety_rationale text;
alter table moc_risk_assessments add column if not exists safety_consequence text;
alter table moc_risk_assessments add column if not exists personnel_exposure text;
alter table moc_risk_assessments add column if not exists process_safety_consequence text;
alter table moc_risk_assessments add column if not exists safety_safeguards text;
alter table moc_risk_assessments add column if not exists environmental_score integer not null default 0;
alter table moc_risk_assessments add column if not exists environmental_label text not null default 'None';
alter table moc_risk_assessments add column if not exists environmental_rationale text;
alter table moc_risk_assessments add column if not exists emissions_impact text;
alter table moc_risk_assessments add column if not exists regulatory_permit_impact text;
alter table moc_risk_assessments add column if not exists spill_release_potential text;
alter table moc_risk_assessments add column if not exists environmental_safeguards text;
alter table moc_risk_assessments add column if not exists production_score integer not null default 0;
alter table moc_risk_assessments add column if not exists production_label text not null default 'None';
alter table moc_risk_assessments add column if not exists production_rationale text;
alter table moc_risk_assessments add column if not exists downtime_impact text;
alter table moc_risk_assessments add column if not exists quality_impact text;
alter table moc_risk_assessments add column if not exists throughput_impact text;
alter table moc_risk_assessments add column if not exists business_continuity_impact text;
alter table moc_risk_assessments add column if not exists production_safeguards text;
alter table moc_risk_assessments add column if not exists overall_rationale text;
alter table moc_risk_assessments add column if not exists additional_hazards text;
alter table moc_risk_assessments add column if not exists existing_safeguards text;
alter table moc_risk_assessments add column if not exists additional_safeguards text;
alter table moc_risk_assessments add column if not exists additional_safeguards_justification text;
alter table moc_risk_assessments add column if not exists assumptions text;
alter table moc_risk_assessments add column if not exists uncertainties text;
alter table moc_risk_assessments add column if not exists risk_acceptance_statement text;
alter table moc_risk_assessments add column if not exists management_justification text;
alter table moc_risk_assessments add column if not exists before_score integer;
alter table moc_risk_assessments add column if not exists before_level text;
alter table moc_risk_assessments add column if not exists after_score integer;
alter table moc_risk_assessments add column if not exists after_level text;
alter table moc_risk_assessments add column if not exists hazop_required boolean not null default false;
alter table moc_risk_assessments add column if not exists pssr_required boolean not null default false;
alter table moc_risk_assessments add column if not exists lopa_required boolean not null default false;
alter table moc_risk_assessments add column if not exists hse_review_required boolean not null default false;
alter table moc_risk_assessments add column if not exists engineering_review_required boolean not null default false;
alter table moc_risk_assessments add column if not exists operations_review_required boolean not null default false;
alter table moc_risk_assessments add column if not exists environmental_review_required boolean not null default false;
alter table moc_risk_assessments add column if not exists management_review_required boolean not null default false;
alter table moc_risk_assessments add column if not exists workflow_impact jsonb not null default '{}'::jsonb;
alter table moc_risk_assessments add column if not exists validation_result jsonb not null default '{}'::jsonb;
alter table moc_risk_assessments add column if not exists critical_alert_sent boolean not null default false;
alter table moc_risk_assessments add column if not exists reassessment_requested_by text;
alter table moc_risk_assessments add column if not exists reassessment_requested_at timestamptz;
alter table moc_risk_assessments add column if not exists reassessment_reason text;
alter table moc_risk_assessments add column if not exists assessed_by text;
alter table moc_risk_assessments add column if not exists assessed_at timestamptz;
alter table moc_risk_assessments add column if not exists completed_by text;
alter table moc_risk_assessments add column if not exists completed_at timestamptz;
alter table moc_risk_assessments add column if not exists locked_by text;
alter table moc_risk_assessments add column if not exists locked_at timestamptz;

update moc_risk_assessments
set
  safety_score = coalesce(safety_score, safety_impact, 0),
  environmental_score = coalesce(environmental_score, environmental_impact, 0),
  production_score = coalesce(production_score, production_impact, 0),
  safety_label = case coalesce(safety_score, safety_impact, 0) when 0 then 'None' when 1 then 'Minor' when 2 then 'Significant' else 'Major' end,
  environmental_label = case coalesce(environmental_score, environmental_impact, 0) when 0 then 'None' when 1 then 'Minor' when 2 then 'Significant' else 'Major' end,
  production_label = case coalesce(production_score, production_impact, 0) when 0 then 'None' when 1 then 'Minor' when 2 then 'Significant' else 'Major' end,
  after_score = coalesce(after_score, total_score),
  after_level = coalesce(after_level, risk_level),
  overall_rationale = coalesce(overall_rationale, rationale);

create table if not exists moc_risk_history (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  risk_assessment_id text references moc_risk_assessments(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  actor_id text,
  before_value jsonb,
  after_value jsonb,
  risk_score_before integer,
  risk_score_after integer,
  risk_level_before text,
  risk_level_after text,
  created_at timestamptz not null default now()
);

create table if not exists moc_risk_review_requirements (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  risk_assessment_id text references moc_risk_assessments(id) on delete cascade,
  review_type text not null,
  title text not null,
  description text,
  source text not null default 'risk',
  required boolean not null default true,
  required_before_approval boolean not null default true,
  required_before_startup boolean not null default false,
  owner_role text,
  owner_id text,
  due_date date,
  status text not null default 'Pending',
  action_id text,
  evidence_required boolean not null default false,
  verification_required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (moc_id, review_type, source)
);

create index if not exists moc_risk_history_moc_idx on moc_risk_history(tenant_id, moc_id, created_at desc);
create index if not exists moc_risk_review_requirements_moc_idx on moc_risk_review_requirements(tenant_id, moc_id, status);
create index if not exists moc_risk_assessments_level_idx on moc_risk_assessments(tenant_id, site_id, risk_level, status);

alter table moc_risk_history enable row level security;
alter table moc_risk_review_requirements enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_risk_view', 'tenant_alkylation', 'moc.risk.view', 'MOC', 'View MOC risk ranking'),
  ('perm_moc_risk_edit', 'tenant_alkylation', 'moc.risk.edit', 'MOC', 'Edit MOC risk ranking'),
  ('perm_moc_risk_complete', 'tenant_alkylation', 'moc.risk.complete', 'MOC', 'Complete MOC risk ranking'),
  ('perm_moc_risk_recalculate', 'tenant_alkylation', 'moc.risk.recalculate', 'MOC', 'Recalculate MOC risk ranking'),
  ('perm_moc_risk_lock', 'tenant_alkylation', 'moc.risk.lock', 'MOC', 'Lock MOC risk ranking'),
  ('perm_moc_risk_unlock', 'tenant_alkylation', 'moc.risk.unlock', 'MOC', 'Unlock MOC risk ranking'),
  ('perm_moc_risk_reassessment_request', 'tenant_alkylation', 'moc.risk.reassessment_request', 'MOC', 'Request MOC risk reassessment'),
  ('perm_moc_risk_apply_review_requirements', 'tenant_alkylation', 'moc.risk.apply_review_requirements', 'MOC', 'Apply MOC risk review requirements')
on conflict (id) do update set key = excluded.key, "moduleKey" = excluded."moduleKey", label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'HSE Manager', 'Plant Manager')
  and p.key like 'moc.risk.%'
on conflict do nothing;
