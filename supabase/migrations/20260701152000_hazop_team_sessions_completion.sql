alter table public.hazop_study_team_members
  add column if not exists attendance_requirement text not null default 'All sessions';

alter table public.hazop_team_coverage_requirements
  add column if not exists missing_reason text;

alter table public.hazop_session_action_links
  add column if not exists verification_required boolean not null default false,
  add column if not exists evidence_required boolean not null default false;

update public.hazop_study_team_members
set attendance_requirement = 'All sessions'
where attendance_requirement is null;

update public.hazop_team_coverage_requirements
set missing_reason = discipline || ' participant is required by site policy'
where coverage_status = 'Missing' and missing_reason is null;
