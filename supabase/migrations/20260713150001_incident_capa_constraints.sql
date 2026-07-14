do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incident_capa_status_chk') then
    alter table public.incident_capa add constraint incident_capa_status_chk
    check (status in ('Not Started','Required','Open','Overdue','In Progress','Review Requested','Approved','Rejected','Completed','Closed','Not Required'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_item_required_chk') then
    alter table public.incident_capa_items add constraint incident_capa_item_required_chk
    check (length(trim(action_title_snapshot)) > 0 and length(trim(action_type)) > 0 and length(trim(priority)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_item_status_chk') then
    alter table public.incident_capa_items add constraint incident_capa_item_status_chk
    check (status in ('Draft','Assigned','Accepted','In Progress','Completed','Evidence Submitted','Verification Pending','Verified Effective','Rework Required','Overdue','Escalated','Cancelled','Closed'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_item_evidence_chk') then
    alter table public.incident_capa_items add constraint incident_capa_item_evidence_chk
    check (evidence_status in ('Not Required','Not Submitted','Submitted','Accepted','Rejected','More Evidence Requested'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_item_verification_method_chk') then
    alter table public.incident_capa_items add constraint incident_capa_item_verification_method_chk
    check (verification_required = false or nullif(verification_method, '') is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_verification_effective_chk') then
    alter table public.incident_capa_verifications add constraint incident_capa_verification_effective_chk
    check (effective in ('Yes','No','Not Determined'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_capa_reviews_status_chk') then
    alter table public.incident_capa_reviews add constraint incident_capa_reviews_status_chk
    check (status in ('Requested','Approved','Rejected','Reopened','Withdrawn'));
  end if;
end $$;
