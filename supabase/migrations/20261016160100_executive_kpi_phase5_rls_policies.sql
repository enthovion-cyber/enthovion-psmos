-- Phase 5 tenant/site isolation. Service-role API access bypasses RLS; direct clients are constrained here.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'executive_risk_priority_policy_versions','executive_risk_cases','executive_risk_case_source_links',
    'executive_risk_case_action_links','executive_risk_case_ownership_history','executive_escalation_rules',
    'executive_escalations','executive_escalation_events','executive_risk_case_acknowledgments',
    'executive_management_decisions','executive_risk_verification_records','executive_overdue_action_snapshots',
    'executive_risk_aggregation_runs','executive_risk_history_events'
  ] loop
    execute format('drop policy if exists executive_phase5_tenant_site_isolation on public.%I', table_name);
    execute format($policy$
      create policy executive_phase5_tenant_site_isolation on public.%I for all
      using (
        company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
      )
      with check (
        company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
      )
    $policy$, table_name);
  end loop;
end $$;
