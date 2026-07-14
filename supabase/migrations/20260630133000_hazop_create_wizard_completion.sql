alter table public.hazop_studies add column if not exists study_reason text;
alter table public.hazop_studies add column if not exists priority text not null default 'Medium';
alter table public.hazop_studies add column if not exists revalidation_interval_months integer not null default 60;
alter table public.hazop_studies add column if not exists process_section text;
alter table public.hazop_studies add column if not exists equipment_tags jsonb not null default '[]'::jsonb;
alter table public.hazop_studies add column if not exists pid_references jsonb not null default '[]'::jsonb;
alter table public.hazop_studies add column if not exists related_chemicals jsonb not null default '[]'::jsonb;
alter table public.hazop_studies add column if not exists scope_description text;
alter table public.hazop_studies add column if not exists out_of_scope_description text;
alter table public.hazop_studies add column if not exists boundaries text;
alter table public.hazop_studies add column if not exists assumptions text;
alter table public.hazop_studies add column if not exists previous_hazop_id text;

alter table public.hazop_study_settings add column if not exists risk_matrix_source text not null default 'Company Default';
alter table public.hazop_study_settings add column if not exists severity_levels jsonb not null default '[]'::jsonb;
alter table public.hazop_study_settings add column if not exists likelihood_levels jsonb not null default '[]'::jsonb;
alter table public.hazop_study_settings add column if not exists risk_colors jsonb not null default '{}'::jsonb;
alter table public.hazop_study_settings add column if not exists acceptance_criteria text;
alter table public.hazop_study_settings add column if not exists lopa_trigger_threshold text;
alter table public.hazop_study_settings add column if not exists parameter_set text;
alter table public.hazop_study_settings add column if not exists node_template text;
alter table public.hazop_study_settings add column if not exists recommendation_workflow text;
alter table public.hazop_study_settings add column if not exists approval_workflow text;
alter table public.hazop_study_settings add column if not exists study_session_plan text;
alter table public.hazop_study_settings add column if not exists report_template text;
alter table public.hazop_study_settings add column if not exists revalidation_policy text;

alter table public.hazop_study_team_members add column if not exists signoff_required boolean not null default false;

alter table public.hazop_nodes add column if not exists process_conditions text;
alter table public.hazop_nodes add column if not exists boundaries text;
alter table public.hazop_nodes add column if not exists pid_references jsonb not null default '[]'::jsonb;

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
select gen_random_uuid()::text, t."id", 'hazop.create.start_preparation', 'hazop', 'Create and Start HAZOP Preparation', 'create', 'Create HAZOP/PHA study and immediately move it to preparation'
from public."Tenant" t
where not exists (
  select 1 from public."Permission" p
  where p."tenantId" = t."id" and p."key" = 'hazop.create.start_preparation'
);

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId"
where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin', 'hse_manager', 'process_engineer')
  and p."key" = 'hazop.create.start_preparation'
on conflict do nothing;
