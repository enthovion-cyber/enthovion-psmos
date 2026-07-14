alter table public.incident_evidence_versions enable row level security;
alter table public.incident_evidence_mappings enable row level security;
alter table public.incident_evidence_custody_events enable row level security;
alter table public.incident_evidence_document_links enable row level security;

grant select, insert, update, delete on public.incident_evidence_versions to authenticated;
grant select, insert, update, delete on public.incident_evidence_mappings to authenticated;
grant select, insert, update, delete on public.incident_evidence_custody_events to authenticated;
grant select, insert, update, delete on public.incident_evidence_document_links to authenticated;

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.evidence.view','View incident evidence'],
    array['incidents.evidence.edit','Edit incident evidence'],
    array['incidents.evidence.delete','Delete incident evidence'],
    array['incidents.evidence.download','Download incident evidence'],
    array['incidents.evidence.preview','Preview incident evidence'],
    array['incidents.evidence.version.manage','Manage incident evidence versions'],
    array['incidents.evidence.mapping.manage','Manage incident evidence mappings'],
    array['incidents.evidence.custody.manage','Manage incident evidence custody'],
    array['incidents.evidence.review.request','Request evidence review'],
    array['incidents.evidence.review.approve','Approve evidence review'],
    array['incidents.evidence.review.reject','Reject evidence review'],
    array['incidents.evidence.export_index','Export evidence index'],
    array['incidents.document_links.manage','Manage incident document links']
  ];
begin
  for tenant_record in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_row[1], 'INCIDENTS', permission_row[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
