create index if not exists idx_mi_linked_records_company_site on public.mi_linked_records(company_id, site_id);
create index if not exists idx_mi_linked_records_equipment on public.mi_linked_records(equipment_id);
create index if not exists idx_mi_linked_records_source on public.mi_linked_records(source_module, source_record_id);
create index if not exists idx_mi_linked_records_target on public.mi_linked_records(target_module, target_record_id);
create index if not exists idx_mi_document_links_company_site on public.mi_document_links(company_id, site_id);
create index if not exists idx_mi_document_links_equipment on public.mi_document_links(equipment_id);
create index if not exists idx_mi_document_links_record on public.mi_document_links(linked_module, linked_record_id);
create index if not exists idx_mi_document_links_document on public.mi_document_links(document_id);
create index if not exists idx_mi_document_requirements_scope on public.mi_document_requirements(company_id, site_id, requirement_scope, active);
create index if not exists idx_mi_document_evaluations_equipment on public.mi_document_requirement_evaluations(company_id, site_id, equipment_id);
create index if not exists idx_mi_document_waivers_requirement on public.mi_document_waivers(requirement_id, status);
create index if not exists idx_mi_link_history_equipment on public.mi_linked_record_history_events(company_id, site_id, equipment_id, created_at desc);

alter table public.mi_linked_records enable row level security;
alter table public.mi_document_links enable row level security;
alter table public.mi_document_requirements enable row level security;
alter table public.mi_document_requirement_evaluations enable row level security;
alter table public.mi_document_waivers enable row level security;
alter table public.mi_linked_record_history_events enable row level security;
alter table public.mi_linked_record_import_jobs enable row level security;

drop policy if exists mi_linked_records_tenant on public.mi_linked_records;
create policy mi_linked_records_tenant on public.mi_linked_records
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_document_links_tenant on public.mi_document_links;
create policy mi_document_links_tenant on public.mi_document_links
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_document_requirements_tenant on public.mi_document_requirements;
create policy mi_document_requirements_tenant on public.mi_document_requirements
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_document_requirement_evaluations_tenant on public.mi_document_requirement_evaluations;
create policy mi_document_requirement_evaluations_tenant on public.mi_document_requirement_evaluations
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_document_waivers_tenant on public.mi_document_waivers;
create policy mi_document_waivers_tenant on public.mi_document_waivers
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_linked_record_history_events_tenant on public.mi_linked_record_history_events;
create policy mi_linked_record_history_events_tenant on public.mi_linked_record_history_events
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_linked_record_import_jobs_tenant on public.mi_linked_record_import_jobs;
create policy mi_linked_record_import_jobs_tenant on public.mi_linked_record_import_jobs
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));
