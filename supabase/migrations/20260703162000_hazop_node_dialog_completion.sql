alter table public.hazop_nodes add column if not exists owner_id text;
alter table public.hazop_nodes add column if not exists complex_id text;
alter table public.hazop_nodes add column if not exists boundary_limits text;
alter table public.hazop_nodes add column if not exists parameter_configurations jsonb not null default '[]'::jsonb;
alter table public.hazop_nodes add column if not exists selected_parameters jsonb not null default '[]'::jsonb;
alter table public.hazop_nodes add column if not exists equipment_link_snapshots jsonb not null default '[]'::jsonb;
alter table public.hazop_nodes add column if not exists document_version_snapshots jsonb not null default '[]'::jsonb;

create table if not exists public.hazop_master_parameters (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  company_id text,
  site_id text,
  name text not null,
  category text not null default 'Process',
  unit_hint text,
  is_custom boolean not null default false,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_node_equipment_links (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text not null references public.hazop_nodes(id) on delete cascade,
  equipment_id text not null,
  equipment_tag text,
  equipment_name text,
  equipment_type text,
  criticality text,
  status text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (tenant_id, node_id, equipment_id)
);

create table if not exists public.hazop_node_document_links (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text not null references public.hazop_nodes(id) on delete cascade,
  document_id text not null,
  document_number text,
  document_title text,
  document_type text,
  revision text,
  status text,
  effective_date date,
  pinned_version text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (tenant_id, node_id, document_id)
);

create table if not exists public.hazop_node_parameters (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text not null references public.hazop_nodes(id) on delete cascade,
  parameter_name text not null,
  parameter_category text,
  normal_operating_range text,
  design_range text,
  unit_of_measurement text,
  high_limit text,
  low_limit text,
  related_equipment_id text,
  related_document_id text,
  safety_concern text,
  notes text,
  is_custom boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, node_id, lower(parameter_name))
);

create index if not exists hazop_node_equipment_links_node_idx on public.hazop_node_equipment_links (node_id);
create index if not exists hazop_node_document_links_node_idx on public.hazop_node_document_links (node_id);
create index if not exists hazop_node_parameters_node_idx on public.hazop_node_parameters (node_id);
create unique index if not exists hazop_master_parameters_scope_name_idx on public.hazop_master_parameters (coalesce(tenant_id, ''), coalesce(site_id, ''), lower(name));

insert into public.hazop_master_parameters (id, tenant_id, name, category, unit_hint, is_custom, active)
select gen_random_uuid()::text, null, v.name, v.category, v.unit_hint, false, true
from (values
  ('Flow', 'Process', 'm3/h'),
  ('Pressure', 'Process', 'barg'),
  ('Temperature', 'Process', 'degC'),
  ('Level', 'Process', '%'),
  ('Composition', 'Process', '%'),
  ('Concentration', 'Process', 'ppm'),
  ('pH', 'Process', 'pH'),
  ('Phase', 'Process', null),
  ('Reaction', 'Reaction', null),
  ('Mixing / Agitation', 'Mechanical', 'rpm'),
  ('Utility Supply', 'Utility', null),
  ('Cooling', 'Utility', null),
  ('Heating', 'Utility', null),
  ('Power', 'Utility', 'kW'),
  ('Instrument Air', 'Utility', 'barg'),
  ('Nitrogen / Inerting', 'Utility', 'barg'),
  ('Drain / Vent', 'Containment', null),
  ('Containment', 'Containment', null),
  ('Other', 'Other', null)
) as v(name, category, unit_hint)
where not exists (
  select 1 from public.hazop_master_parameters p
  where p.tenant_id is null and lower(p.name) = lower(v.name)
);

alter table public.hazop_master_parameters enable row level security;
alter table public.hazop_node_equipment_links enable row level security;
alter table public.hazop_node_document_links enable row level security;
alter table public.hazop_node_parameters enable row level security;

grant select, insert, update, delete on public.hazop_master_parameters to authenticated, service_role;
grant select, insert, update, delete on public.hazop_node_equipment_links to authenticated, service_role;
grant select, insert, update, delete on public.hazop_node_document_links to authenticated, service_role;
grant select, insert, update, delete on public.hazop_node_parameters to authenticated, service_role;
