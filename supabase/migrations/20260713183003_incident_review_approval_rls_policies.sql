alter table public.incident_review_approvals enable row level security;
alter table public.incident_reviewers enable row level security;
alter table public.incident_review_decisions enable row level security;
alter table public.incident_review_blockers enable row level security;
alter table public.incident_change_requests enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'incident_review_approvals',
    'incident_reviewers',
    'incident_review_decisions',
    'incident_review_blockers',
    'incident_change_requests'
  ]
  loop
    execute format('drop policy if exists "%s tenant select" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant insert" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant update" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant delete" on public.%I', table_name, table_name);
    execute format('create policy "%s tenant select" on public.%I for select to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant insert" on public.%I for insert to authenticated with check (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant update" on public.%I for update to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id''))) with check (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant delete" on public.%I for delete to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
  end loop;
end $$;

do $$
declare
  tenant_record record;
  permission_item text[];
begin
  for tenant_record in select id from public."Tenant" loop
    foreach permission_item slice 1 in array array[
      array['incidents.review_approval.view','View incident review and approval'],
      array['incidents.review_approval.start_workflow','Start incident review approval workflow'],
      array['incidents.review_approval.add_reviewer','Add incident reviewers and approvers'],
      array['incidents.review_approval.edit_reviewer','Edit incident reviewers and approvers'],
      array['incidents.review_approval.remove_reviewer','Remove incident reviewers and approvers'],
      array['incidents.review_approval.approve','Approve incident investigation'],
      array['incidents.review_approval.reject','Reject incident investigation'],
      array['incidents.review_approval.request_changes','Request incident investigation changes'],
      array['incidents.review_approval.delegate','Delegate incident review'],
      array['incidents.review_approval.escalate','Escalate incident review'],
      array['incidents.review_approval.override_blocker','Override incident review blocker'],
      array['incidents.review_approval.e_sign','E-sign incident approval'],
      array['incidents.review_approval.request_closure','Request incident closure'],
      array['incidents.review_approval.close','Close incident from review approval'],
      array['incidents.review_approval.reopen','Reopen incident from review approval']
    ]
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_item[1], 'INCIDENTS', permission_item[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_item[1]
      );
    end loop;
  end loop;
end $$;
