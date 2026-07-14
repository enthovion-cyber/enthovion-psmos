do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incident_linked_records_link_status_chk') then
    alter table public.incident_linked_records add constraint incident_linked_records_link_status_chk
    check (link_status in ('Active','Pending review','Needs update','Broken','Stale','Superseded','Restricted','Archived','Not accessible'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_linked_records_relationship_chk') then
    alter table public.incident_linked_records add constraint incident_linked_records_relationship_chk
    check (relationship in ('Source record','Related record','Generated from incident','Follow-up required','Evidence support','Review required','Update required','Supersedes','Superseded by','Reference only'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_linked_records_required_status_chk') then
    alter table public.incident_required_links add constraint incident_linked_records_required_status_chk
    check (status in ('Not Required','Missing','Linked','Complete','Blocked','Review Required'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_record_impacts_type_chk') then
    alter table public.incident_record_impacts add constraint incident_record_impacts_type_chk
    check (impact_type in ('No change required','Review required','Revision required','Revalidation required','Inspection required','MOC required','PSSR required','Training update required','Procedure update required','Risk assessment update required','LOPA/SIL review required','MI/work order required'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_record_impacts_status_chk') then
    alter table public.incident_record_impacts add constraint incident_record_impacts_status_chk
    check (update_status in ('Not Required','Required','Assigned','In Progress','Completed','Overdue','Blocked'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_linked_record_reviews_status_chk') then
    alter table public.incident_linked_record_reviews add constraint incident_linked_record_reviews_status_chk
    check (status in ('Requested','Approved','Rejected','Reopened','Withdrawn'));
  end if;
end $$;
