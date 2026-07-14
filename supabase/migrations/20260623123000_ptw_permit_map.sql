create table if not exists ptw_map_layouts (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete cascade,
  site_id text not null references "Site"(id) on delete cascade,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  layout_name text not null,
  layout_type text not null default 'DATA',
  svg_file_url text,
  image_file_url text,
  width numeric not null default 1200,
  height numeric not null default 720,
  version text not null default '1.0',
  is_active boolean not null default true,
  uploaded_by text references "User"(id) on delete set null,
  uploaded_at timestamptz,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ptw_map_layouts_type_check check (layout_type in ('SVG','IMAGE','DATA'))
);

create table if not exists ptw_map_zones (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete cascade,
  site_id text not null references "Site"(id) on delete cascade,
  layout_id text not null references ptw_map_layouts(id) on delete cascade,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  zone_name text not null,
  zone_type text not null default 'Area',
  svg_element_id text,
  polygon_points jsonb,
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 160,
  height numeric not null default 96,
  color text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ptw_map_zones_type_check check (zone_type in ('Site','Unit','Area','EquipmentZone','HazardZone'))
);

create table if not exists ptw_map_markers (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete cascade,
  site_id text not null references "Site"(id) on delete cascade,
  layout_id text not null references ptw_map_layouts(id) on delete cascade,
  equipment_id text references "Equipment"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  marker_type text not null default 'Equipment',
  label text not null,
  svg_x numeric,
  svg_y numeric,
  latitude numeric,
  longitude numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ptw_map_markers_type_check check (marker_type in ('Permit','Equipment','Conflict','GasWarning','Isolation','Handover','Area'))
);

create index if not exists ptw_map_layouts_scope_idx on ptw_map_layouts(tenant_id, site_id, unit_id, area_id, is_active);
create index if not exists ptw_map_zones_layout_idx on ptw_map_zones(tenant_id, layout_id, site_id);
create index if not exists ptw_map_markers_layout_idx on ptw_map_markers(tenant_id, layout_id, site_id);

alter table ptw_map_layouts enable row level security;
alter table ptw_map_zones enable row level security;
alter table ptw_map_markers enable row level security;
