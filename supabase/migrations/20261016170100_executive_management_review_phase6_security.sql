create table if not exists public.executive_management_review_package_access_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  package_id text not null references public.executive_management_review_packages(id) on delete cascade,
  package_version_id text null references public.executive_management_review_package_versions(id) on delete set null,
  accessed_by text null,
  access_type text not null,
  access_outcome text not null default 'Allowed',
  access_reason text null,
  accessed_at timestamptz not null default now()
);

create index if not exists emr_package_access_idx on public.executive_management_review_package_access_events(company_id, package_id, accessed_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'executive_management_review_cycles','executive_management_review_meetings','executive_management_review_participants',
    'executive_management_review_agenda_items','executive_management_review_packages',
    'executive_management_review_package_versions','executive_management_review_package_sources','executive_management_review_package_access_events',
    'executive_management_review_minutes','executive_management_review_minutes_versions','executive_management_decisions',
    'executive_management_decision_source_links','executive_management_commitments','executive_management_review_carry_forward_items',
    'executive_management_review_readiness_results','executive_management_review_history_events','executive_management_review_policy_versions'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists executive_management_review_tenant_site_isolation on public.%I', table_name);
    execute format($policy$
      create policy executive_management_review_tenant_site_isolation on public.%I for all
      using (
        company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
      ) with check (
        company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
      )
    $policy$, table_name);
  end loop;
end $$;

alter table public.executive_management_review_agenda_templates enable row level security;
drop policy if exists executive_management_review_template_tenant_isolation on public.executive_management_review_agenda_templates;
create policy executive_management_review_template_tenant_isolation on public.executive_management_review_agenda_templates for all
using (company_id is null or company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
with check (company_id is not null and company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
