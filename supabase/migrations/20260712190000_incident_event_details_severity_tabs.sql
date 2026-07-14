alter table public.incidents
  add column if not exists classification_review_status text not null default 'Not Started',
  add column if not exists classification_review_requested_by text,
  add column if not exists classification_review_requested_at timestamptz,
  add column if not exists classification_review_decision text,
  add column if not exists classification_review_decided_by text,
  add column if not exists classification_review_decided_at timestamptz,
  add column if not exists classification_review_reason text,
  add column if not exists psm_pse_review_required boolean not null default false,
  add column if not exists pse_threshold_config_missing boolean not null default false,
  add column if not exists severity_review_status text not null default 'Not Reviewed',
  add column if not exists severity_review_requested_by text,
  add column if not exists severity_review_requested_at timestamptz,
  add column if not exists severity_review_decision text,
  add column if not exists severity_review_decided_by text,
  add column if not exists severity_review_decided_at timestamptz,
  add column if not exists severity_review_reason text,
  add column if not exists severity_reviewed_by text,
  add column if not exists severity_reviewed_at timestamptz,
  add column if not exists likelihood_basis text,
  add column if not exists probability_basis text,
  add column if not exists exposure_frequency text,
  add column if not exists controls_present text,
  add column if not exists risk_score_status text,
  add column if not exists risk_matrix_version text,
  add column if not exists risk_matrix_snapshot_json jsonb,
  add column if not exists risk_calculated_at timestamptz,
  add column if not exists actual_consequence text;

alter table public.incident_classification_reviews
  add column if not exists review_status text,
  add column if not exists requested_by text,
  add column if not exists requested_at timestamptz,
  add column if not exists review_reason text,
  add column if not exists before_values_json jsonb,
  add column if not exists after_values_json jsonb;

create table if not exists public.incident_severity_reviews (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  review_status text not null default 'Pending Review',
  requested_by text,
  requested_at timestamptz,
  review_reason text,
  decision text,
  decided_by text,
  decided_at timestamptz,
  decision_reason text,
  before_values_json jsonb,
  after_values_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incident_severity_reviews_incident
  on public.incident_severity_reviews(tenant_id, incident_id, created_at desc);

alter table public.incident_severity_reviews enable row level security;
grant select, insert, update on public.incident_severity_reviews to authenticated;

do $$
declare
  tenant_row record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.event_details.view','View incident event details'],
    array['incidents.event_details.edit','Edit incident event details'],
    array['incidents.classification.view','View incident classification'],
    array['incidents.classification.edit','Edit incident classification'],
    array['incidents.classification.review.request','Request incident classification review'],
    array['incidents.classification.review.approve','Approve incident classification review'],
    array['incidents.classification.review.reject','Reject incident classification review'],
    array['incidents.psm.review','Review incident PSM/PSE classification'],
    array['incidents.severity.view','View incident severity/risk matrix'],
    array['incidents.severity.edit','Edit incident severity/risk matrix'],
    array['incidents.severity.recalculate','Recalculate incident potential risk'],
    array['incidents.severity.review.request','Request incident severity review'],
    array['incidents.severity.review.approve','Approve incident severity review'],
    array['incidents.severity.review.reject','Reject incident severity review'],
    array['incidents.risk_matrix.view','View incident risk matrix']
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
