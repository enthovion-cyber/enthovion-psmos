alter table public.hazop_nodes add column if not exists company_id text;
alter table public.hazop_nodes add column if not exists site_id text;
alter table public.hazop_nodes add column if not exists unit_id text;
alter table public.hazop_nodes add column if not exists area_id text;
alter table public.hazop_nodes add column if not exists normal_operating_conditions text;
alter table public.hazop_nodes add column if not exists process_conditions_json jsonb not null default '{}'::jsonb;
alter table public.hazop_nodes add column if not exists related_chemical_ids jsonb not null default '[]'::jsonb;
alter table public.hazop_nodes add column if not exists assumptions text;
alter table public.hazop_nodes add column if not exists exclusions text;

alter table public.hazop_deviations add column if not exists company_id text;
alter table public.hazop_deviations add column if not exists site_id text;

alter table public.hazop_scenarios add column if not exists company_id text;
alter table public.hazop_scenarios add column if not exists site_id text;
alter table public.hazop_scenarios add column if not exists row_number integer;
alter table public.hazop_scenarios add column if not exists guideword text;
alter table public.hazop_scenarios add column if not exists parameter text;
alter table public.hazop_scenarios add column if not exists deviation_text text;
alter table public.hazop_scenarios add column if not exists risk_color text;
alter table public.hazop_scenarios add column if not exists lopa_trigger_reason text;
alter table public.hazop_scenarios add column if not exists notes text;

update public.hazop_scenarios s
set
  row_number = coalesce(s.row_number, cast(regexp_replace(coalesce(s.scenario_number, '0'), '\D', '', 'g') as integer)),
  guideword = coalesce(s.guideword, (select d.guideword from public.hazop_deviations d where d.id = s.deviation_id)),
  parameter = coalesce(s.parameter, (select d.parameter from public.hazop_deviations d where d.id = s.deviation_id)),
  deviation_text = coalesce(s.deviation_text, (select d.deviation from public.hazop_deviations d where d.id = s.deviation_id)),
  company_id = coalesce(s.company_id, st.company_id),
  site_id = coalesce(s.site_id, st.site_id)
from public.hazop_studies st
where s.study_id = st.id;

update public.hazop_nodes n
set company_id = coalesce(n.company_id, st.company_id),
    site_id = coalesce(n.site_id, st.site_id),
    unit_id = coalesce(n.unit_id, st.unit_id),
    area_id = coalesce(n.area_id, st.area_id)
from public.hazop_studies st
where n.study_id = st.id;

alter table public.hazop_safeguards add column if not exists company_id text;
alter table public.hazop_safeguards add column if not exists site_id text;
alter table public.hazop_safeguards add column if not exists study_id text;
alter table public.hazop_safeguards add column if not exists equipment_id text;
alter table public.hazop_safeguards add column if not exists document_id text;
alter table public.hazop_safeguards add column if not exists credited_for_risk_reduction boolean not null default false;
alter table public.hazop_safeguards add column if not exists updated_at timestamptz not null default now();

update public.hazop_safeguards sg
set study_id = coalesce(sg.study_id, sc.study_id),
    company_id = coalesce(sg.company_id, sc.company_id),
    site_id = coalesce(sg.site_id, sc.site_id),
    credited_for_risk_reduction = coalesce(sg.credited_for_risk_reduction, sg.ipl_credit)
from public.hazop_scenarios sc
where sg.scenario_id = sc.id;

create index if not exists hazop_scenarios_node_row_idx on public.hazop_scenarios (node_id, row_number);
create index if not exists hazop_scenarios_lopa_idx on public.hazop_scenarios (study_id, lopa_required);
create index if not exists hazop_safeguards_scenario_idx on public.hazop_safeguards (scenario_id);

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'permissions') then
    execute $sql$
      insert into public.permissions (id, tenant_id, key, module, name, action, description)
      select gen_random_uuid()::text, 'tenant_alkylation', v.key, 'hazop', v.name, v.action, v.description
      from (values
        ('hazop.risk.edit', 'Edit HAZOP Risk', 'edit', 'Edit HAZOP scenario risk ranking'),
        ('hazop.export', 'Export HAZOP Worksheet', 'export', 'Export HAZOP worksheet and node register')
      ) as v(key, name, action, description)
      on conflict (tenant_id, key) do update set name = excluded.name, action = excluded.action, description = excluded.description
    $sql$;
  end if;
end $$;
