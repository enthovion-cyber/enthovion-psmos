alter table public.incidents
  add column if not exists severity_review_required boolean not null default false,
  add column if not exists risk_matrix_config_missing boolean not null default false,
  add column if not exists psm_pse_review_required boolean not null default false,
  add column if not exists pse_threshold_config_missing boolean not null default false,
  add column if not exists current_site_condition text;

alter table public.incident_people_initial
  add column if not exists people_involved boolean not null default false,
  add column if not exists injured_person_count integer,
  add column if not exists employee_involved boolean not null default false,
  add column if not exists contractor_involved boolean not null default false,
  add column if not exists visitor_involved boolean not null default false;

alter table public.incident_equipment_chemical_initial
  add column if not exists equipment_location text;

alter table public.incident_immediate_actions_initial
  add column if not exists current_site_condition text;

alter table public.incident_initial_evidence
  add column if not exists source text,
  add column if not exists upload_status text not null default 'Uploaded',
  add column if not exists confidential boolean not null default false,
  add column if not exists medical_confidential boolean not null default false;
