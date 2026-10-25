alter table public.executive_management_review_minutes add column if not exists workflow_instance_id text null;
alter table public.executive_management_decisions add column if not exists workflow_instance_id text null;
alter table public.executive_management_review_cycles add column if not exists workflow_template_id text null;

create table if not exists public.executive_management_review_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  default_cycle_workflow_template_id text null,
  minutes_workflow_template_id text null,
  decision_workflow_template_id text null,
  minimum_package_freshness_hours integer not null default 24 check (minimum_package_freshness_hours > 0),
  require_minutes_approval boolean not null default true,
  require_decision_approval boolean not null default true,
  allow_package_publish_with_warnings boolean not null default false,
  reminder_days_before_due integer not null default 7 check (reminder_days_before_due >= 0),
  updated_by text null,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

alter table public.executive_management_review_settings enable row level security;
drop policy if exists executive_management_review_settings_tenant_site_isolation on public.executive_management_review_settings;
create policy executive_management_review_settings_tenant_site_isolation on public.executive_management_review_settings for all
using (company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id') and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true)))
with check (company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id') and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true)));
