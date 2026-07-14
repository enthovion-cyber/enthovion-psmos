alter table public.incidents
  add column if not exists previous_status text,
  add column if not exists status_changed_by text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_change_reason text,
  add column if not exists reopened_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists ready_for_review boolean not null default false,
  add column if not exists readiness_status text not null default 'Not Ready',
  add column if not exists readiness_json jsonb not null default '{}'::jsonb,
  add column if not exists blockers_json jsonb not null default '[]'::jsonb,
  add column if not exists lessons_learned_status text not null default 'Not Built Yet',
  add column if not exists barrier_analysis_status text;

do $$
declare
  tenant_row record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.detail.view','View incident detail shell'],
    array['incidents.overview.view','View incident overview tab'],
    array['incidents.edit_basic','Edit incident basic information'],
    array['incidents.status.change','Change incident status'],
    array['incidents.close','Close incidents'],
    array['incidents.reopen','Reopen incidents'],
    array['incidents.void','Void or cancel incidents'],
    array['incidents.medical_fields.view','View protected incident medical fields'],
    array['incidents.psm.review.request','Request incident PSM review'],
    array['incidents.severity.review.request','Request incident severity review'],
    array['incidents.linked_records.view','View incident linked records'],
    array['incidents.export_summary','Export incident summary']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_row[1], 'INCIDENTS', permission_row[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
