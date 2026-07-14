do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incident_barrier_analysis_status_chk') then
    alter table public.incident_barrier_analysis
      add constraint incident_barrier_analysis_status_chk
      check (analysis_status in ('Not Started','Required','In Progress','Review Requested','Approved','Rejected','Completed','Reopened','Not Required'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barriers_type_required_chk') then
    alter table public.incident_barriers
      add constraint incident_barriers_type_required_chk
      check (length(trim(barrier_name)) > 0 and length(trim(barrier_type)) > 0 and length(trim(expected_function)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barriers_demand_chk') then
    alter table public.incident_barriers
      add constraint incident_barriers_demand_chk
      check (demand_occurred in ('Yes','No','Unknown'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barriers_credit_chk') then
    alter table public.incident_barriers
      add constraint incident_barriers_credit_chk
      check (credited_ipl in ('Yes','No','Not Determined','Study Validation Required'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barriers_performance_chk') then
    alter table public.incident_barriers
      add constraint incident_barriers_performance_chk
      check (performance_status in ('Performed','Degraded','Failed','Bypassed','Missing','Not demanded','Not determined'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barriers_failure_detail_chk') then
    alter table public.incident_barriers
      add constraint incident_barriers_failure_detail_chk
      check (
        performance_status not in ('Failed','Degraded','Bypassed','Missing')
        or (failure_mode is not null and failure_description is not null)
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barrier_followups_status_chk') then
    alter table public.incident_barrier_followups
      add constraint incident_barrier_followups_status_chk
      check (status in ('Open','In Progress','Completed','Cancelled','Superseded'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'incident_barrier_reviews_status_chk') then
    alter table public.incident_barrier_reviews
      add constraint incident_barrier_reviews_status_chk
      check (status in ('Requested','Approved','Rejected','Reopened','Withdrawn'));
  end if;
end $$;
