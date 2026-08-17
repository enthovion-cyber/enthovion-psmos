grant select, insert, update, delete on table public.psi_process_chemistry to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_chemical_roles to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_conditions to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_hazards to service_role;
grant select, insert, update, delete on table public.psi_unwanted_reaction_scenarios to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_controls to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_document_links to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_completeness_evaluations to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_history_events to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_import_jobs to service_role;

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text, t.id, p.key, 'psi', p.label
from public."Tenant" t
cross join (values
  ('psi.process_chemistry.view', 'View PSI process chemistry'),
  ('psi.process_chemistry.create', 'Create PSI process chemistry'),
  ('psi.process_chemistry.edit', 'Edit PSI process chemistry'),
  ('psi.process_chemistry.archive', 'Archive PSI process chemistry'),
  ('psi.process_chemistry.import', 'Import PSI process chemistry'),
  ('psi.process_chemistry.export', 'Export PSI process chemistry'),
  ('psi.process_chemistry.link_chemical', 'Link PSI process chemistry chemicals'),
  ('psi.process_chemistry.remove_chemical', 'Remove PSI process chemistry chemicals'),
  ('psi.process_chemistry.manage_conditions', 'Manage PSI process chemistry conditions'),
  ('psi.process_chemistry.manage_hazards', 'Manage PSI process chemistry hazards'),
  ('psi.process_chemistry.manage_scenarios', 'Manage PSI unwanted reaction scenarios'),
  ('psi.process_chemistry.manage_controls', 'Manage PSI process chemistry controls'),
  ('psi.process_chemistry.run_completeness_check', 'Run PSI process chemistry completeness check'),
  ('psi.process_chemistry.submit_review', 'Submit PSI process chemistry review'),
  ('psi.process_chemistry.approve', 'Approve PSI process chemistry'),
  ('psi.process_chemistry.reject', 'Reject PSI process chemistry')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
