create table if not exists public.lopa_report_templates (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  template_name text not null,
  template_type text not null,
  template_version text not null default '1.0',
  description text,
  sections_json jsonb not null default '[]'::jsonb,
  required_sections_json jsonb not null default '[]'::jsonb,
  output_formats_json jsonb not null default '["PDF"]'::jsonb,
  active boolean not null default true,
  default_template boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_report_source_snapshots (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  snapshot_version integer not null default 1,
  snapshot_status text not null default 'Active',
  study_status_snapshot text,
  approval_snapshot_id text,
  calculation_version_id text,
  sil_snapshot_id text,
  review_workflow_id text,
  data_snapshot_json jsonb not null default '{}'::jsonb,
  snapshot_hash text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_report_generations (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  report_number text not null,
  report_title text not null,
  report_type text not null,
  template_id text,
  template_name_snapshot text,
  template_version_snapshot text,
  report_version integer not null default 1,
  status text not null default 'Draft',
  output_format text not null default 'PDF',
  file_name text,
  file_size bigint,
  storage_provider text,
  storage_key text,
  file_hash text,
  classification text not null default 'Internal',
  official boolean not null default false,
  published boolean not null default false,
  document_id text,
  document_number_snapshot text,
  source_snapshot_id text,
  generation_options_json jsonb not null default '{}'::jsonb,
  redaction_summary_json jsonb,
  error_message text,
  generated_by text,
  generated_at timestamptz,
  superseded_by_report_id text,
  archived_by text,
  archived_at timestamptz,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_report_sections (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  report_generation_id text,
  section_key text not null,
  section_title text not null,
  source_module text,
  required boolean not null default false,
  included boolean not null default true,
  status text not null default 'Not Started',
  missing_data_count integer not null default 0,
  restricted_data_count integer not null default 0,
  sort_order integer not null default 0,
  config_json jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, report_generation_id, section_key)
);

create table if not exists public.lopa_report_packages (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  package_number text not null,
  package_name text not null,
  package_version integer not null default 1,
  status text not null default 'Generated',
  storage_provider text,
  storage_key text,
  file_size bigint,
  file_hash text,
  classification text not null default 'Internal',
  manifest_json jsonb not null default '{}'::jsonb,
  generated_by text,
  generated_at timestamptz,
  archived_by text,
  archived_at timestamptz,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_report_package_items (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  package_id text not null,
  item_type text not null,
  item_title text not null,
  report_generation_id text,
  attachment_id text,
  document_id text,
  storage_key text,
  included boolean not null default true,
  redacted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_report_exports (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  report_generation_id text,
  package_id text,
  export_type text not null,
  output_format text not null,
  status text not null default 'Requested',
  requested_by text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  file_size bigint,
  storage_key text,
  error_message text,
  metadata_json jsonb
);

create table if not exists public.lopa_report_distribution (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  lopa_study_id text not null,
  report_generation_id text,
  package_id text,
  recipient_user_id text,
  recipient_email text not null,
  recipient_role text,
  distribution_method text not null default 'Secure Link',
  access_expires_at timestamptz,
  status text not null default 'Shared',
  shared_by text,
  shared_at timestamptz not null default now(),
  revoked_by text,
  revoked_at timestamptz,
  notes text
);

alter table if exists public.lopa_studies
  add column if not exists final_report_status text default 'Not Started',
  add column if not exists official_report_id text,
  add column if not exists report_readiness_status text default 'Not Ready';

create index if not exists idx_lopa_report_generations_study on public.lopa_report_generations(tenant_id, lopa_study_id, generated_at desc);
create index if not exists idx_lopa_report_sections_study on public.lopa_report_sections(tenant_id, lopa_study_id, sort_order);
create index if not exists idx_lopa_report_packages_study on public.lopa_report_packages(tenant_id, lopa_study_id, generated_at desc);
create index if not exists idx_lopa_report_exports_study on public.lopa_report_exports(tenant_id, lopa_study_id, requested_at desc);
create index if not exists idx_lopa_report_distribution_study on public.lopa_report_distribution(tenant_id, lopa_study_id, shared_at desc);

alter table public.lopa_report_templates enable row level security;
alter table public.lopa_report_source_snapshots enable row level security;
alter table public.lopa_report_generations enable row level security;
alter table public.lopa_report_sections enable row level security;
alter table public.lopa_report_packages enable row level security;
alter table public.lopa_report_package_items enable row level security;
alter table public.lopa_report_exports enable row level security;
alter table public.lopa_report_distribution enable row level security;

grant select, insert, update, delete on public.lopa_report_templates to authenticated;
grant select, insert on public.lopa_report_source_snapshots to authenticated;
grant select, insert, update on public.lopa_report_generations to authenticated;
grant select, insert, update, delete on public.lopa_report_sections to authenticated;
grant select, insert, update on public.lopa_report_packages to authenticated;
grant select, insert, update on public.lopa_report_package_items to authenticated;
grant select, insert, update on public.lopa_report_exports to authenticated;
grant select, insert, update on public.lopa_report_distribution to authenticated;

create or replace function public.prevent_lopa_report_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'LOPA report source snapshots are immutable';
end;
$$;

drop trigger if exists trg_lopa_report_source_snapshot_no_update on public.lopa_report_source_snapshots;
create trigger trg_lopa_report_source_snapshot_no_update
before update or delete on public.lopa_report_source_snapshots
for each row execute function public.prevent_lopa_report_snapshot_mutation();

do $$
declare
  tenant_row record;
  permission_row text[];
  permission_label text;
  permission_rows text[][] := array[
    array['lopa.final_report.view','View LOPA final reports'],
    array['lopa.final_report.preview','Preview LOPA final reports'],
    array['lopa.final_report.generate','Generate LOPA final reports'],
    array['lopa.final_report.generate_draft','Generate draft LOPA reports'],
    array['lopa.final_report.generate_official','Generate official LOPA reports'],
    array['lopa.final_report.download','Download LOPA reports'],
    array['lopa.final_report.export_pdf','Export LOPA reports to PDF'],
    array['lopa.final_report.export_excel','Export LOPA reports to Excel'],
    array['lopa.final_report.export_csv','Export LOPA reports to CSV'],
    array['lopa.final_report.generate_package','Generate LOPA report packages'],
    array['lopa.final_report.mark_official','Mark LOPA reports official'],
    array['lopa.final_report.publish_document_control','Publish LOPA reports to Document Control'],
    array['lopa.final_report.supersede','Supersede LOPA reports'],
    array['lopa.final_report.archive','Archive LOPA reports'],
    array['lopa.final_report.restore','Restore LOPA reports'],
    array['lopa.final_report.share','Share LOPA reports'],
    array['lopa.final_report.redacted_export','Export redacted LOPA reports'],
    array['lopa.final_report.restricted_export','Export restricted LOPA report content'],
    array['lopa.final_report.templates.view','View LOPA report templates'],
    array['lopa.final_report.sections.manage','Manage LOPA report sections'],
    array['lopa.final_report.history.view','View LOPA report history']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      permission_label := permission_row[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_row[1], 'LOPA', permission_label
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_row.id and p."key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
