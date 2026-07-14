do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incident_review_approvals_review_status_chk') then
    alter table public.incident_review_approvals
      add constraint incident_review_approvals_review_status_chk
      check (review_status in ('Not Started','Not Ready','Ready for Review','Workflow in progress','Approval Pending','Changes Requested','Rejected','Approved','Closed','Reopened','Reapproval Required'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_review_approvals_closure_status_chk') then
    alter table public.incident_review_approvals
      add constraint incident_review_approvals_closure_status_chk
      check (closure_status in ('Not Ready','Ready for Closure','Closure Requested','Approved for Closure','Closed','Closure Rejected','Reopened'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_reviewers_status_chk') then
    alter table public.incident_reviewers
      add constraint incident_reviewers_status_chk
      check (status in ('Not Started','Pending','In Review','Approved','Rejected','Changes Requested','Delegated','Escalated','Skipped by authorized override'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_reviewers_decision_chk') then
    alter table public.incident_reviewers
      add constraint incident_reviewers_decision_chk
      check (decision is null or decision in ('Approved','Approved with comments','Rejected','Changes requested','Information requested','Delegated','Escalated','Override approved'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_review_decisions_decision_chk') then
    alter table public.incident_review_decisions
      add constraint incident_review_decisions_decision_chk
      check (decision in ('Approved','Approved with comments','Rejected','Changes requested','Information requested','Delegated','Escalated','Override approved','E-Signed','Closure Requested','Closed','Reopened'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_review_blockers_severity_chk') then
    alter table public.incident_review_blockers
      add constraint incident_review_blockers_severity_chk
      check (severity in ('Low','Medium','High','Critical'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_review_blockers_status_chk') then
    alter table public.incident_review_blockers
      add constraint incident_review_blockers_status_chk
      check (status in ('Open','Resolved','Accepted by exception','Overridden','Closed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_change_requests_status_chk') then
    alter table public.incident_change_requests
      add constraint incident_change_requests_status_chk
      check (status in ('Open','Assigned','In Progress','Resolved','Reopened','Closed','Cancelled'));
  end if;
end $$;

create unique index if not exists uq_incident_review_approval_one
  on public.incident_review_approvals (tenant_id, incident_id);

create unique index if not exists uq_incident_change_request_number
  on public.incident_change_requests (tenant_id, incident_id, request_number);
