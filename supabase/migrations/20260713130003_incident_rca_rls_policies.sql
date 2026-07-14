alter table public.incident_rca enable row level security;
alter table public.incident_rca_causal_factors enable row level security;
alter table public.incident_rca_five_why_chains enable row level security;
alter table public.incident_rca_five_why_steps enable row level security;
alter table public.incident_rca_fishbone_items enable row level security;
alter table public.incident_rca_cause_tree_nodes enable row level security;
alter table public.incident_rca_cause_tree_edges enable row level security;
alter table public.incident_rca_root_causes enable row level security;
alter table public.incident_rca_systemic_weaknesses enable row level security;
alter table public.incident_rca_hypotheses enable row level security;
alter table public.incident_rca_reviews enable row level security;

grant select, insert, update, delete on public.incident_rca to authenticated;
grant select, insert, update, delete on public.incident_rca_causal_factors to authenticated;
grant select, insert, update, delete on public.incident_rca_five_why_chains to authenticated;
grant select, insert, update, delete on public.incident_rca_five_why_steps to authenticated;
grant select, insert, update, delete on public.incident_rca_fishbone_items to authenticated;
grant select, insert, update, delete on public.incident_rca_cause_tree_nodes to authenticated;
grant select, insert, update, delete on public.incident_rca_cause_tree_edges to authenticated;
grant select, insert, update, delete on public.incident_rca_root_causes to authenticated;
grant select, insert, update, delete on public.incident_rca_systemic_weaknesses to authenticated;
grant select, insert, update, delete on public.incident_rca_hypotheses to authenticated;
grant select, insert, update, delete on public.incident_rca_reviews to authenticated;

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.rca.view','View incident RCA'],
    array['incidents.rca.edit','Edit incident RCA'],
    array['incidents.rca.method.select','Select RCA method'],
    array['incidents.rca.causal_factors.create','Create RCA causal factors'],
    array['incidents.rca.causal_factors.edit','Edit RCA causal factors'],
    array['incidents.rca.causal_factors.delete','Delete RCA causal factors'],
    array['incidents.rca.root_causes.create','Create RCA root causes'],
    array['incidents.rca.root_causes.edit','Edit RCA root causes'],
    array['incidents.rca.root_causes.delete','Delete RCA root causes'],
    array['incidents.rca.evidence.map','Map RCA evidence'],
    array['incidents.rca.hypotheses.manage','Manage RCA hypotheses'],
    array['incidents.rca.quality.override','Override RCA quality checks'],
    array['incidents.rca.create_capa','Create CAPA from RCA'],
    array['incidents.rca.complete','Complete RCA'],
    array['incidents.rca.reopen','Reopen RCA'],
    array['incidents.rca.review.request','Request RCA review'],
    array['incidents.rca.review.approve','Approve RCA review'],
    array['incidents.rca.review.reject','Reject RCA review']
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
