alter table public.hazop_risk_matrices add column if not exists company_id text;
alter table public.hazop_risk_matrices add column if not exists site_id text;
alter table public.hazop_risk_matrices add column if not exists description text;
alter table public.hazop_risk_matrices add column if not exists is_default_company boolean not null default false;
alter table public.hazop_risk_matrices add column if not exists is_default_site boolean not null default false;
alter table public.hazop_risk_matrices add column if not exists created_at timestamptz not null default now();
alter table public.hazop_risk_matrices add column if not exists updated_at timestamptz not null default now();

alter table public.hazop_risk_matrix_levels add column if not exists severity_level integer;
alter table public.hazop_risk_matrix_levels add column if not exists severity_label text;
alter table public.hazop_risk_matrix_levels add column if not exists likelihood_level integer;
alter table public.hazop_risk_matrix_levels add column if not exists likelihood_label text;
alter table public.hazop_risk_matrix_levels add column if not exists risk_score integer;
alter table public.hazop_risk_matrix_levels add column if not exists risk_level text;
alter table public.hazop_risk_matrix_levels add column if not exists risk_color text;
alter table public.hazop_risk_matrix_levels add column if not exists acceptance_required boolean not null default false;
alter table public.hazop_risk_matrix_levels add column if not exists recommendation_required boolean not null default false;
alter table public.hazop_risk_matrix_levels add column if not exists lopa_required boolean not null default false;
alter table public.hazop_risk_matrix_levels add column if not exists created_at timestamptz not null default now();
alter table public.hazop_risk_matrix_levels add column if not exists updated_at timestamptz not null default now();

update public.hazop_risk_matrix_levels
set risk_level = coalesce(risk_level, level),
    risk_color = coalesce(risk_color, color),
    recommendation_required = coalesce(recommendation_required, requires_recommendation),
    lopa_required = coalesce(lopa_required, requires_lopa),
    acceptance_required = coalesce(acceptance_required, requires_recommendation),
    risk_score = coalesce(risk_score, min_score);

alter table public.hazop_scenarios add column if not exists lopa_trigger_source text;
alter table public.hazop_scenarios add column if not exists lopa_triggered_by text;
alter table public.hazop_scenarios add column if not exists lopa_triggered_at timestamptz;
alter table public.hazop_scenarios add column if not exists acceptance_status text not null default 'Not Required';

create table if not exists public.hazop_scenario_risk_assessments (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text references public.hazop_nodes(id) on delete set null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  risk_matrix_id text,
  initial_severity integer,
  initial_likelihood integer,
  initial_risk_score integer,
  initial_risk_level text,
  initial_risk_color text,
  residual_severity integer,
  residual_likelihood integer,
  residual_risk_score integer,
  residual_risk_level text,
  residual_risk_color text,
  recommendation_required boolean not null default false,
  lopa_required boolean not null default false,
  lopa_trigger_reason text,
  acceptance_required boolean not null default false,
  acceptance_status text not null default 'Not Required',
  assessed_by text,
  assessed_at timestamptz not null default now(),
  assessment_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_risk_acceptances (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text references public.hazop_nodes(id) on delete set null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  risk_assessment_id text,
  acceptance_type text not null,
  justification text not null,
  conditions text,
  expiry_date date,
  review_date date,
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  status text not null default 'Draft',
  attachment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_risk_history (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text references public.hazop_nodes(id) on delete set null,
  scenario_id text references public.hazop_scenarios(id) on delete cascade,
  risk_assessment_id text,
  old_values_json jsonb not null default '{}'::jsonb,
  new_values_json jsonb not null default '{}'::jsonb,
  change_reason text,
  changed_by text,
  change_type text not null default 'Manual',
  created_at timestamptz not null default now()
);

create index if not exists hazop_risk_assessments_study_idx on public.hazop_scenario_risk_assessments (tenant_id, study_id, scenario_id, assessed_at desc);
create index if not exists hazop_risk_acceptances_study_idx on public.hazop_risk_acceptances (tenant_id, study_id, status);
create index if not exists hazop_risk_history_study_idx on public.hazop_risk_history (tenant_id, study_id, created_at desc);

alter table public.hazop_scenario_risk_assessments enable row level security;
alter table public.hazop_risk_acceptances enable row level security;
alter table public.hazop_risk_history enable row level security;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'permissions') then
    execute $sql$
      insert into public.permissions (id, tenant_id, key, module, name, action, description)
      select gen_random_uuid()::text, 'tenant_alkylation', v.key, 'hazop', v.name, v.action, v.description
      from (values
        ('hazop.risk.view', 'View HAZOP Risk Ranking', 'view', 'View HAZOP risk ranking'),
        ('hazop.risk.recalculate', 'Recalculate HAZOP Risk', 'recalculate', 'Recalculate HAZOP scenario risk'),
        ('hazop.risk.accept', 'Request HAZOP Risk Acceptance', 'accept', 'Request documented risk acceptance'),
        ('hazop.risk.accept.approve', 'Approve HAZOP Risk Acceptance', 'approve', 'Approve or reject risk acceptance'),
        ('hazop.risk.lopa.mark', 'Mark HAZOP LOPA Required', 'mark', 'Mark a scenario as LOPA required'),
        ('hazop.risk.lopa.clear', 'Clear HAZOP LOPA Required', 'clear', 'Clear manual LOPA requirement when allowed'),
        ('hazop.risk.export', 'Export HAZOP Risk Register', 'export', 'Export HAZOP risk register')
      ) as v(key, name, action, description)
      on conflict (tenant_id, key) do update set name = excluded.name, action = excluded.action, description = excluded.description
    $sql$;
  end if;
end $$;
