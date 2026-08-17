create table if not exists public.regulatory_register_items (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  process_system text null,
  chemical_substance text null,
  activity_operation text null,
  requirement_code text not null,
  requirement_title text null,
  source_type text null,
  source_reference_number text null,
  short_summary text null,
  full_reference_url text null,
  version text null,
  effective_date date null,
  expiry_date date null,
  supersedes_item_id text null references public.regulatory_register_items(id) on delete set null,
  superseded_by_item_id text null references public.regulatory_register_items(id) on delete set null,
  register_status text not null default 'Draft',
  applicability_status text not null default 'Not Assessed',
  compliance_status text not null default 'Not Assessed',
  review_status text not null default 'Not Required',
  criticality text null,
  category text null,
  topic text null,
  related_psm_element text null,
  related_module text null,
  risk_basis text null,
  regulatory_impact text null,
  safety_impact text null,
  environmental_impact text null,
  business_impact text null,
  jurisdiction_level text null,
  country text null,
  state_province text null,
  city_municipality text null,
  industrial_zone text null,
  authority_name text null,
  authority_contact_foundation text null,
  language text null,
  legal_owner_regulator_contact_foundation text null,
  owner_user_id text null references public."User"(id) on delete set null,
  compliance_owner_user_id text null references public."User"(id) on delete set null,
  site_owner_user_id text null references public."User"(id) on delete set null,
  reviewer_user_id text null references public."User"(id) on delete set null,
  review_frequency text null,
  next_review_date date null,
  last_review_date date null,
  reminder_settings_foundation jsonb null,
  escalation_owner_user_id text null references public."User"(id) on delete set null,
  evidence_summary_foundation text null,
  last_compliance_check_date date null,
  checked_by_user_id text null references public."User"(id) on delete set null,
  gap_summary_foundation text null,
  action_required boolean not null default false,
  status_rationale text null,
  applicability_rationale text null,
  notes text null,
  linked_audit_count integer not null default 0,
  linked_evidence_count integer not null default 0,
  linked_action_count integer not null default 0,
  locked boolean not null default false,
  locked_by text null references public."User"(id) on delete set null,
  locked_at timestamptz null,
  lock_reason text null,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null references public."User"(id) on delete set null,
  archive_reason text null,
  constraint regulatory_items_status_check check (register_status in ('Draft','Active','Under Review','Approved Foundation','Effective Soon','Effective','Superseded','Archived','Cancelled')),
  constraint regulatory_items_applicability_check check (applicability_status in ('Not Assessed','Applicable','Partially Applicable','Not Applicable','Applicability Review Required','Applicability Under Review','Applicability Approved Foundation','Stale Applicability')),
  constraint regulatory_items_compliance_check check (compliance_status in ('Not Assessed','Compliant Foundation','Partially Compliant Foundation','Non-Compliant Foundation','Evidence Missing','Action Required','CAPA Open','Review Required','Not Applicable','Unknown')),
  constraint regulatory_items_review_check check (review_status in ('Not Required','Review Due','Review Overdue','Under Review','Approved Foundation','Returned Foundation','Rejected Foundation')),
  constraint regulatory_items_code_company_unique unique (company_id, requirement_code)
);

create table if not exists public.regulatory_jurisdictions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  jurisdiction_code text null,
  jurisdiction_name text not null,
  jurisdiction_level text not null,
  country text null,
  state_province text null,
  city_municipality text null,
  industrial_zone text null,
  authority_name text null,
  authority_contact_foundation text null,
  language text null,
  jurisdiction_status text not null default 'Active',
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null references public."User"(id) on delete set null,
  archive_reason text null
);

create table if not exists public.regulatory_item_jurisdictions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  jurisdiction_id text not null references public.regulatory_jurisdictions(id) on delete cascade,
  primary_jurisdiction boolean not null default false,
  linked_by text null references public."User"(id) on delete set null,
  linked_at timestamptz not null default now(),
  removed_by text null references public."User"(id) on delete set null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_item_scopes (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  scope_type text not null,
  scope_record_id text not null,
  scope_label text null,
  applicability_status text null,
  applicability_rationale text null,
  linked_by text null references public."User"(id) on delete set null,
  linked_at timestamptz not null default now(),
  removed_by text null references public."User"(id) on delete set null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_item_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  linked_module text not null,
  linked_object_type text not null,
  linked_record_id text not null,
  link_role text not null default 'Foundation Link',
  link_status text not null default 'Linked Foundation',
  source_snapshot_json jsonb null,
  link_reason text null,
  linked_by text null references public."User"(id) on delete set null,
  linked_at timestamptz not null default now(),
  removed_by text null references public."User"(id) on delete set null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_item_review_foundation (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  review_status text not null default 'Not Required',
  review_type text not null default 'Foundation Review',
  reviewer_user_id text null references public."User"(id) on delete set null,
  review_due_date date null,
  submitted_by text null references public."User"(id) on delete set null,
  submitted_at timestamptz null,
  decision_by text null references public."User"(id) on delete set null,
  decision_at timestamptz null,
  decision text null,
  decision_comment text null,
  approval_request_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_item_status_history (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  status_type text not null,
  old_status text null,
  new_status text not null,
  status_reason text null,
  changed_by text null references public."User"(id) on delete set null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null references public."User"(id) on delete set null,
  source_module text not null default 'Regulatory Register',
  source_record_id text null,
  audit_log_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  require_owner_for_active_item boolean not null default true,
  require_review_date_for_active_item boolean not null default true,
  require_rationale_for_applicability boolean not null default true,
  require_rationale_for_not_applicable boolean not null default true,
  require_risk_basis_for_critical_item boolean not null default true,
  default_review_frequency text null,
  review_due_soon_days integer not null default 30,
  effective_soon_days integer not null default 60,
  allow_compliance_status_foundation_edit boolean not null default true,
  require_review_for_compliance_status_change boolean not null default false,
  allow_audit_mapping_links boolean not null default true,
  allow_evidence_links boolean not null default true,
  allow_action_links boolean not null default true,
  auto_notify_owner_review_due boolean not null default true,
  auto_notify_owner_review_overdue boolean not null default true,
  auto_notify_owner_effective_soon boolean not null default true,
  settings_json jsonb null,
  updated_by text null references public."User"(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint regulatory_settings_scope_unique unique (company_id, site_id)
);

create index if not exists idx_regulatory_items_company_site_status on public.regulatory_register_items(company_id, site_id, register_status);
create index if not exists idx_regulatory_items_company_site_applicability on public.regulatory_register_items(company_id, site_id, applicability_status);
create index if not exists idx_regulatory_items_company_site_compliance on public.regulatory_register_items(company_id, site_id, compliance_status);
create index if not exists idx_regulatory_items_company_site_criticality on public.regulatory_register_items(company_id, site_id, criticality);
create index if not exists idx_regulatory_items_code on public.regulatory_register_items(requirement_code);
create index if not exists idx_regulatory_items_category on public.regulatory_register_items(category);
create index if not exists idx_regulatory_items_owner on public.regulatory_register_items(owner_user_id);
create index if not exists idx_regulatory_items_review_date on public.regulatory_register_items(next_review_date);
create index if not exists idx_regulatory_items_effective_date on public.regulatory_register_items(effective_date);
create index if not exists idx_regulatory_jurisdictions_scope on public.regulatory_jurisdictions(company_id, site_id, jurisdiction_level);
create index if not exists idx_regulatory_item_jurisdictions_item on public.regulatory_item_jurisdictions(regulatory_item_id, jurisdiction_id);
create index if not exists idx_regulatory_item_scopes_item on public.regulatory_item_scopes(regulatory_item_id, scope_type, scope_record_id);
create index if not exists idx_regulatory_item_links_item on public.regulatory_item_links(regulatory_item_id, linked_module, linked_record_id);
create index if not exists idx_regulatory_history_item on public.regulatory_history_events(regulatory_item_id, created_at desc);

alter table public.regulatory_register_items enable row level security;
alter table public.regulatory_jurisdictions enable row level security;
alter table public.regulatory_item_jurisdictions enable row level security;
alter table public.regulatory_item_scopes enable row level security;
alter table public.regulatory_item_links enable row level security;
alter table public.regulatory_item_review_foundation enable row level security;
alter table public.regulatory_item_status_history enable row level security;
alter table public.regulatory_history_events enable row level security;
alter table public.regulatory_settings enable row level security;

grant select, insert, update, delete on public.regulatory_register_items to authenticated;
grant select, insert, update, delete on public.regulatory_jurisdictions to authenticated;
grant select, insert, update, delete on public.regulatory_item_jurisdictions to authenticated;
grant select, insert, update, delete on public.regulatory_item_scopes to authenticated;
grant select, insert, update, delete on public.regulatory_item_links to authenticated;
grant select, insert, update on public.regulatory_item_review_foundation to authenticated;
grant select, insert on public.regulatory_item_status_history to authenticated;
grant select, insert on public.regulatory_history_events to authenticated;
grant select, insert, update on public.regulatory_settings to authenticated;

create or replace function public.regulatory_jwt_tenant_id()
returns text
language plpgsql
stable
as $$
begin
  return nullif(auth.jwt() ->> 'tenantId', '');
exception when others then
  return null;
end;
$$;

create or replace function public.regulatory_jwt_site_id()
returns text
language plpgsql
stable
as $$
begin
  return coalesce(nullif(auth.jwt() ->> 'selectedSiteId', ''), nullif(auth.jwt() ->> 'activeSiteId', ''));
exception when others then
  return null;
end;
$$;

create or replace function public.regulatory_company_site_visible(row_company_id text, row_site_id text)
returns boolean
language sql
stable
as $$
  select row_company_id = public.regulatory_jwt_tenant_id()
    and (row_site_id is null or public.regulatory_jwt_site_id() is null or row_site_id = public.regulatory_jwt_site_id());
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_register_items',
    'regulatory_jurisdictions',
    'regulatory_item_jurisdictions',
    'regulatory_item_scopes',
    'regulatory_item_links',
    'regulatory_item_review_foundation',
    'regulatory_item_status_history',
    'regulatory_history_events',
    'regulatory_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

create or replace function public.prevent_regulatory_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Regulatory history events are immutable';
end;
$$;

drop trigger if exists trg_regulatory_history_no_update on public.regulatory_history_events;
create trigger trg_regulatory_history_no_update
before update or delete on public.regulatory_history_events
for each row execute function public.prevent_regulatory_history_mutation();

insert into public.regulatory_settings (id, company_id)
select gen_random_uuid()::text, t.id
from public."Tenant" t
where not exists (
  select 1 from public.regulatory_settings s
  where s.company_id = t.id and s.site_id is null
);

do $$
declare
  permission_key text;
  tenant_row record;
  permission_label text;
  permission_keys text[] := array[
    'regulatory.view',
    'regulatory.dashboard.view',
    'regulatory.register.view',
    'regulatory.item.view',
    'regulatory.item.create',
    'regulatory.item.edit',
    'regulatory.item.archive',
    'regulatory.item.reactivate',
    'regulatory.item.lock',
    'regulatory.item.unlock',
    'regulatory.item.assign_owner',
    'regulatory.item.change_status',
    'regulatory.item.change_applicability',
    'regulatory.item.change_compliance_status',
    'regulatory.jurisdiction.view',
    'regulatory.jurisdiction.create',
    'regulatory.jurisdiction.edit',
    'regulatory.scope.view',
    'regulatory.scope.manage',
    'regulatory.link.view',
    'regulatory.link.manage',
    'regulatory.audit_mapping.view',
    'regulatory.audit_mapping.link',
    'regulatory.evidence.view',
    'regulatory.evidence.link',
    'regulatory.action.view',
    'regulatory.action.link',
    'regulatory.review.view',
    'regulatory.review.submit',
    'regulatory.report.view',
    'regulatory.history.view',
    'regulatory.settings.view',
    'regulatory.settings.edit'
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_key in array permission_keys loop
      permission_label := initcap(replace(replace(permission_key, 'regulatory.', ''), '_', ' '));
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'regulatory', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
