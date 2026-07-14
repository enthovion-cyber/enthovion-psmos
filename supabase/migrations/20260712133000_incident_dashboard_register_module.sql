create table if not exists public.incidents (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_number text not null,
  title text not null,
  short_description text,
  event_type text not null default 'Incident',
  classification text not null default 'Other',
  status text not null default 'Reported',
  event_datetime timestamptz,
  reported_datetime timestamptz default now(),
  reported_by text,
  investigation_owner_id text,
  due_date date,
  site_area_id text,
  unit_id text,
  area_id text,
  location_text text,
  actual_severity text not null default 'Negligible',
  potential_severity text not null default 'Negligible',
  likelihood text,
  potential_risk_score numeric,
  investigation_priority text not null default 'Low',
  investigation_level_required text,
  is_psm_incident boolean not null default false,
  is_process_safety_event boolean not null default false,
  pse_tier text not null default 'Not Determined',
  lopc_status text,
  released_material_id text,
  released_material text,
  released_quantity numeric,
  release_unit text,
  threshold_quantity numeric,
  threshold_exceeded boolean,
  release_duration interval,
  fire_explosion_occurred boolean not null default false,
  injury_occurred boolean not null default false,
  environmental_impact boolean not null default false,
  community_impact boolean not null default false,
  regulatory_reporting_required boolean not null default false,
  contractor_involved boolean not null default false,
  equipment_involved boolean not null default false,
  chemical_involved boolean not null default false,
  rca_required boolean not null default false,
  rca_status text not null default 'Not Required',
  formal_team_required boolean not null default false,
  moc_required boolean not null default false,
  pssr_required boolean not null default false,
  hazop_review_required boolean not null default false,
  lopa_review_required boolean not null default false,
  mechanical_integrity_followup_required boolean not null default false,
  evidence_status text not null default 'Not Started',
  action_status text not null default 'No Actions',
  open_actions_count integer not null default 0,
  overdue_actions_count integer not null default 0,
  linked_records_count integer not null default 0,
  restricted boolean not null default false,
  confidential boolean not null default false,
  tags_json jsonb not null default '[]'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz
);

create table if not exists public.incident_history_events (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text,
  event_number integer not null default 1,
  event_type text not null,
  event_category text,
  event_title text not null,
  event_description text,
  related_record_type text,
  related_record_id text,
  actor_user_id text,
  actor_role text,
  severity text not null default 'Info',
  reason text,
  before_values_json jsonb,
  after_values_json jsonb,
  metadata_json jsonb,
  source_system text default 'PSM OS',
  audit_log_id text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_register_saved_views (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  user_id text not null,
  view_name text not null,
  filters_json jsonb not null default '{}'::jsonb,
  columns_json jsonb not null default '[]'::jsonb,
  sort_json jsonb not null default '{}'::jsonb,
  visibility text not null default 'Private',
  default_view boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_classification_reviews (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  review_type text not null,
  previous_value_json jsonb,
  new_value_json jsonb,
  basis text,
  reviewed_by text,
  reviewed_at timestamptz,
  status text not null default 'Pending Review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_dashboard_metrics_cache (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  metric_key text not null,
  metric_value_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index if not exists idx_incidents_tenant_site_updated on public.incidents(tenant_id, site_id, updated_at desc);
create index if not exists idx_incidents_number on public.incidents(tenant_id, incident_number);
create index if not exists idx_incident_history_incident on public.incident_history_events(tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_saved_views_user on public.incident_register_saved_views(tenant_id, user_id, updated_at desc);

alter table public.incidents enable row level security;
alter table public.incident_history_events enable row level security;
alter table public.incident_register_saved_views enable row level security;
alter table public.incident_classification_reviews enable row level security;
alter table public.incident_dashboard_metrics_cache enable row level security;

grant select, insert, update, delete on public.incidents to authenticated;
grant select, insert on public.incident_history_events to authenticated;
grant select, insert, update, delete on public.incident_register_saved_views to authenticated;
grant select, insert, update on public.incident_classification_reviews to authenticated;
grant select, insert, update, delete on public.incident_dashboard_metrics_cache to authenticated;

create or replace function public.prevent_incident_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Incident history events are immutable';
end;
$$;

drop trigger if exists trg_incident_history_no_update on public.incident_history_events;
create trigger trg_incident_history_no_update
before update or delete on public.incident_history_events
for each row execute function public.prevent_incident_history_mutation();

do $$
declare
  tenant_row record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.view','View incidents'],
    array['incidents.register.view','View incident register'],
    array['incidents.summary.view','View incident summary'],
    array['incidents.create','Report incidents'],
    array['incidents.edit','Edit incident triage'],
    array['incidents.assign','Assign incident owner'],
    array['incidents.bulk_update','Bulk update incidents'],
    array['incidents.export','Export incidents'],
    array['incidents.restricted.view','View restricted incidents'],
    array['incidents.confidential.view','View confidential incidents'],
    array['incidents.psm.view','View PSM incidents'],
    array['incidents.psm.classify','Classify PSM/PSE incidents'],
    array['incidents.severity.review','Review incident severity'],
    array['incidents.saved_views.create','Create incident saved views'],
    array['incidents.saved_views.share','Share incident saved views'],
    array['incidents.actions.create','Create incident actions'],
    array['incidents.history.view','View incident history']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_row[1], 'INCIDENTS', permission_row[2]
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_row.id and p."key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
