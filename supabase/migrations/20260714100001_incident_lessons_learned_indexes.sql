create index if not exists idx_incident_lessons_tenant_incident on public.incident_lessons (tenant_id, incident_id);
create index if not exists idx_incident_lessons_site_status on public.incident_lessons (tenant_id, site_id, review_status);
create index if not exists idx_incident_lessons_owner_due on public.incident_lessons (tenant_id, owner_id, due_date);
create unique index if not exists idx_incident_lessons_number_unique on public.incident_lessons (tenant_id, incident_id, lesson_number);

create index if not exists idx_incident_lesson_source_links_incident on public.incident_lesson_source_links (tenant_id, incident_id);
create index if not exists idx_incident_lesson_source_links_lesson on public.incident_lesson_source_links (tenant_id, lesson_id);
create index if not exists idx_incident_lesson_distributions_incident on public.incident_lesson_distributions (tenant_id, incident_id);
create index if not exists idx_incident_lesson_distributions_lesson on public.incident_lesson_distributions (tenant_id, lesson_id);
create index if not exists idx_incident_lesson_ack_incident on public.incident_lesson_acknowledgements (tenant_id, incident_id);
create index if not exists idx_incident_lesson_ack_lesson_status on public.incident_lesson_acknowledgements (tenant_id, lesson_id, acknowledgement_status);
create index if not exists idx_incident_lesson_reviews_incident on public.incident_lesson_reviews (tenant_id, incident_id);
