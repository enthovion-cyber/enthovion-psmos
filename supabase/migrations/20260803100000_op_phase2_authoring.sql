-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 2 Authoring & Content
-- Revisions, structured sections, digital steps, OSHA hazard callouts, SOL bindings, and templates.

create table if not exists public.op_revisions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_number integer not null default 1,
  revision_label text not null default 'Rev 1.0',
  status text not null default 'Draft',
  change_summary text null,
  change_reason text not null default 'Initial Draft',
  moc_id text null,
  document_version_id text null,
  effective_date date null,
  superseded_at timestamptz null,
  content_hash text null,
  locked boolean not null default false,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_revisions_status_check check (status in ('Draft','In Review','Review Complete','Pending Approval','Approved','Published','Superseded','Archived')),
  constraint op_revisions_unique_number unique (company_id, procedure_id, revision_number)
);

create table if not exists public.op_sections (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  section_order integer not null default 10,
  section_title text not null,
  section_kind text not null default 'steps',
  content_markdown text null,
  content_json jsonb null,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_sections_kind_check check (section_kind in ('purpose','scope','hazards','ppe','prerequisites','operating_limits','steps','emergency_response','references','attachments'))
);

create table if not exists public.op_steps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  section_id text not null references public.op_sections(id) on delete cascade,
  parent_step_id text null references public.op_steps(id) on delete cascade,
  step_order integer not null default 10,
  step_number text not null,
  step_title text null,
  step_text text not null,
  step_type text not null default 'action',
  role_required text null,
  is_critical boolean not null default false,
  requires_signoff boolean not null default false,
  requires_witness boolean not null default false,
  expected_value text null,
  min_value numeric null,
  max_value numeric null,
  uom text null,
  psi_sol_id text null,
  equipment_id text null,
  equipment_tag text null,
  estimated_duration_minutes integer null,
  branch_condition text null,
  branch_next_step text null,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_steps_type_check check (step_type in ('action','check','verify','record_value','decision','caution','warning','note','hold_point','sign_off','two_person_verify','timer','photo'))
);

create table if not exists public.op_step_hazards (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  step_id text not null references public.op_steps(id) on delete cascade,
  hazard_level text not null default 'WARNING',
  hazard_text text not null,
  consequence_of_deviation text null,
  corrective_steps text null,
  ppe_required text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint op_step_hazards_level_check check (hazard_level in ('NOTE','CAUTION','WARNING','DANGER'))
);

create table if not exists public.op_step_comments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  step_id text null references public.op_steps(id) on delete set null,
  comment_text text not null,
  author_user_id text null references public."User"(id) on delete set null,
  is_resolved boolean not null default false,
  resolved_by text null references public."User"(id) on delete set null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.op_templates (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_type_code text not null,
  template_name text not null,
  description text null,
  is_default boolean not null default false,
  sections_json jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_op_revisions_proc on public.op_revisions(procedure_id, revision_number desc);
create index if not exists idx_op_sections_rev on public.op_sections(revision_id, section_order);
create index if not exists idx_op_steps_sec on public.op_steps(section_id, step_order);
create index if not exists idx_op_steps_rev on public.op_steps(revision_id, step_order);
create index if not exists idx_op_steps_parent on public.op_steps(parent_step_id);
create index if not exists idx_op_step_hazards_step on public.op_step_hazards(step_id);
create index if not exists idx_op_step_comments_rev on public.op_step_comments(revision_id);
create index if not exists idx_op_templates_type on public.op_templates(company_id, procedure_type_code);

-- Enable RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'op_revisions','op_sections','op_steps','op_step_hazards','op_step_comments','op_templates'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.op_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.op_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.op_company_site_visible(company_id, site_id)) with check (public.op_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.op_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

-- Seed standard procedure templates for common types
do $$
declare
  tenant_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    insert into public.op_templates (id, company_id, procedure_type_code, template_name, description, is_default, sections_json)
    values (
      gen_random_uuid()::text,
      tenant_row.id,
      'NORMAL_OPERATION',
      'Standard Operating Procedure Template',
      'Standard OSHA 1910.119(f)(1) section layout for continuous operations.',
      true,
      '[
        {"title": "1.0 Purpose & Scope", "kind": "purpose", "order": 10},
        {"title": "2.0 Safety, Health & PPE", "kind": "hazards", "order": 20},
        {"title": "3.0 Safe Operating Limits (SOL)", "kind": "operating_limits", "order": 30},
        {"title": "4.0 Prerequisites & Alignment", "kind": "prerequisites", "order": 40},
        {"title": "5.0 Step-by-Step Operating Instructions", "kind": "steps", "order": 50},
        {"title": "6.0 Emergency Procedures & Deviations", "kind": "emergency_response", "order": 60},
        {"title": "7.0 References & P&IDs", "kind": "references", "order": 70}
      ]'::jsonb
    ) on conflict do nothing;

    insert into public.op_templates (id, company_id, procedure_type_code, template_name, description, is_default, sections_json)
    values (
      gen_random_uuid()::text,
      tenant_row.id,
      'SWP_LOTO',
      'Safe Work Practice: Lockout / Tagout Template',
      'Equipment isolation protocol compliant with 1910.119(f)(4) and 1910.147.',
      true,
      '[
        {"title": "1.0 Scope & Hazardous Energy Sources", "kind": "purpose", "order": 10},
        {"title": "2.0 Required Isolation Devices & Locks", "kind": "prerequisites", "order": 20},
        {"title": "3.0 Step-by-Step De-energization & Zero Energy Verification", "kind": "steps", "order": 30},
        {"title": "4.0 Re-energization & Restoring Equipment", "kind": "steps", "order": 40}
      ]'::jsonb
    ) on conflict do nothing;
  end loop;
end $$;
