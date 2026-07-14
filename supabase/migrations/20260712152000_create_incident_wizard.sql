alter table public.incidents
  add column if not exists detailed_description text,
  add column if not exists reporter_department text,
  add column if not exists reporter_contact text,
  add column if not exists reporter_role text,
  add column if not exists anonymous_report boolean not null default false,
  add column if not exists gps_location_json jsonb,
  add column if not exists shift text,
  add column if not exists workgroup text,
  add column if not exists weather_condition text,
  add column if not exists operating_mode text,
  add column if not exists ptw_involved boolean not null default false,
  add column if not exists ptw_id text,
  add column if not exists moc_involved boolean not null default false,
  add column if not exists moc_id text,
  add column if not exists pssr_involved boolean not null default false,
  add column if not exists pssr_id text,
  add column if not exists activity_at_time text,
  add column if not exists abnormal_condition text,
  add column if not exists immediate_consequence text,
  add column if not exists potential_consequence text,
  add column if not exists suspected_initial_cause text,
  add column if not exists witnesses_known boolean not null default false,
  add column if not exists emergency_response_activated boolean not null default false,
  add column if not exists operation_stopped boolean not null default false,
  add column if not exists equipment_isolated boolean not null default false,
  add column if not exists area_barricaded boolean not null default false,
  add column if not exists actual_consequence_category text,
  add column if not exists actual_injury_severity text,
  add column if not exists actual_environmental_impact text,
  add column if not exists actual_asset_damage text,
  add column if not exists actual_production_impact text,
  add column if not exists actual_financial_impact numeric,
  add column if not exists actual_consequence_notes text,
  add column if not exists potential_consequence_category text,
  add column if not exists potential_injury_severity text,
  add column if not exists potential_environmental_impact text,
  add column if not exists potential_asset_damage text,
  add column if not exists potential_process_safety_consequence text,
  add column if not exists high_potential_near_miss boolean not null default false,
  add column if not exists fatality_potential boolean not null default false,
  add column if not exists major_process_safety_potential boolean not null default false,
  add column if not exists pse_classification_status text not null default 'Not Determined',
  add column if not exists acute_release boolean,
  add column if not exists toxic_exposure_occurred boolean not null default false,
  add column if not exists injury_fatality_occurred boolean not null default false,
  add column if not exists indoor_outdoor_release text,
  add column if not exists pse_classification_basis text,
  add column if not exists pse_reviewer_required boolean not null default false,
  add column if not exists area_safe_now text,
  add column if not exists restart_blocked boolean not null default false,
  add column if not exists temporary_control_expiration date,
  add column if not exists immediate_action_notes text,
  add column if not exists ptw_review_required boolean not null default false,
  add column if not exists equipment_inspection_required boolean not null default false,
  add column if not exists sds_chemical_review_required boolean not null default false,
  add column if not exists notification_required boolean not null default false,
  add column if not exists draft_json jsonb,
  add column if not exists current_step integer not null default 1,
  add column if not exists submitted_by text,
  add column if not exists submitted_at timestamptz;

create table if not exists public.incident_people_initial (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  person_type text,
  person_name text,
  job_role text,
  employee_id text,
  contractor_company text,
  injury_occurred boolean not null default false,
  illness_occurred boolean not null default false,
  exposure_occurred boolean not null default false,
  injury_type text,
  body_part text,
  treatment_type text,
  lost_time_potential boolean not null default false,
  medical_treatment_required boolean not null default false,
  hospitalization boolean not null default false,
  fatality boolean not null default false,
  ppe_used boolean,
  ppe_issue_suspected boolean not null default false,
  exposure_route text,
  chemical_exposure boolean not null default false,
  confidential_notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_equipment_chemical_initial (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  equipment_involved boolean not null default false,
  equipment_id text,
  equipment_tag_snapshot text,
  equipment_name_snapshot text,
  equipment_type_snapshot text,
  equipment_status text,
  maintenance_overdue_suspected boolean not null default false,
  safeguard_involved boolean not null default false,
  safeguard_failed boolean not null default false,
  ipl_involved boolean not null default false,
  sis_sif_involved boolean not null default false,
  psv_relief_involved boolean not null default false,
  alarm_interlock_involved boolean not null default false,
  chemical_involved boolean not null default false,
  chemical_id text,
  chemical_name_snapshot text,
  cas_number_snapshot text,
  sds_id text,
  sds_link text,
  material_state text,
  estimated_quantity_involved numeric,
  released_quantity numeric,
  release_unit text,
  process_condition text,
  temperature text,
  pressure text,
  flow_rate text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_immediate_actions_initial (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  action_key text not null,
  action_label text not null,
  completed boolean not null default false,
  notes text,
  owner_id text,
  temporary_control boolean not null default false,
  temporary_control_expiry date,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_initial_evidence (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text,
  draft_id text,
  evidence_type text,
  file_name text,
  description text,
  storage_provider text,
  storage_key text,
  file_type text,
  mime_type text,
  file_size bigint,
  classification text,
  restricted boolean not null default false,
  collected_by text,
  collected_at timestamptz,
  notes text,
  uploaded_by text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.incident_drafts (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  created_by text not null,
  draft_json jsonb not null default '{}'::jsonb,
  current_step integer not null default 1,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incident_people_initial_incident on public.incident_people_initial(tenant_id, incident_id);
create index if not exists idx_incident_equipment_chemical_initial_incident on public.incident_equipment_chemical_initial(tenant_id, incident_id);
create index if not exists idx_incident_immediate_actions_initial_incident on public.incident_immediate_actions_initial(tenant_id, incident_id);
create index if not exists idx_incident_initial_evidence_incident on public.incident_initial_evidence(tenant_id, incident_id);
create index if not exists idx_incident_drafts_created_by on public.incident_drafts(tenant_id, created_by, updated_at desc);

alter table public.incident_people_initial enable row level security;
alter table public.incident_equipment_chemical_initial enable row level security;
alter table public.incident_immediate_actions_initial enable row level security;
alter table public.incident_initial_evidence enable row level security;
alter table public.incident_drafts enable row level security;

grant select, insert, update, delete on public.incident_people_initial to authenticated;
grant select, insert, update, delete on public.incident_equipment_chemical_initial to authenticated;
grant select, insert, update, delete on public.incident_immediate_actions_initial to authenticated;
grant select, insert, update, delete on public.incident_initial_evidence to authenticated;
grant select, insert, update, delete on public.incident_drafts to authenticated;

do $$
declare
  tenant_row record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.draft.create','Create incident drafts'],
    array['incidents.draft.edit','Edit incident drafts'],
    array['incidents.draft.delete','Delete incident drafts'],
    array['incidents.submit','Submit incidents'],
    array['incidents.restricted.create','Create restricted incidents'],
    array['incidents.confidential.create','Create confidential incidents'],
    array['incidents.medical_fields.manage','Manage incident medical fields'],
    array['incidents.evidence.upload','Upload incident evidence'],
    array['incidents.followup.override','Override incident follow-up recommendations'],
    array['incidents.equipment.lookup','Lookup incident equipment'],
    array['incidents.chemical.lookup','Lookup incident chemicals'],
    array['incidents.ptw.lookup','Lookup PTW for incidents'],
    array['incidents.moc.lookup','Lookup MOC for incidents'],
    array['incidents.pssr.lookup','Lookup PSSR for incidents']
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
