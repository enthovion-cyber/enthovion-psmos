-- HAZOP Review & Sign-Off hardening.
-- Keeps the sign-off matrix real-time friendly and prevents duplicate active rows.

alter table public.hazop_signoffs
  add column if not exists requested_by text,
  add column if not exists requested_at timestamptz,
  add column if not exists signed_by text,
  add column if not exists signed_at timestamptz,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists e_signature_id text,
  add column if not exists signature_snapshot jsonb,
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by_change_id text,
  add column if not exists updated_at timestamptz not null default now();

update public.hazop_signoffs
set status = case
  when status is null or trim(status) = '' then 'Pending Request'
  when lower(status) in ('pending', 'pending request', 'pending_request') then 'Pending Request'
  when lower(status) in ('requested', 'pending sign-off', 'pending signoff', 'pending_signoff') then 'Requested'
  when lower(status) = 'signed' then 'Signed'
  when lower(status) = 'rejected' then 'Rejected'
  when lower(status) in ('returned', 'returned for rework', 'returned_for_rework') then 'Returned for Rework'
  when lower(status) = 'superseded' then 'Superseded'
  when lower(status) in ('not required', 'not_required') then 'Not Required'
  else status
end,
updated_at = now()
where status is null
   or lower(status) in ('pending', 'pending request', 'pending_request', 'requested', 'pending sign-off', 'pending signoff', 'pending_signoff', 'signed', 'rejected', 'returned', 'returned for rework', 'returned_for_rework', 'superseded', 'not required', 'not_required');

with ranked as (
  select
    ctid,
    row_number() over (
      partition by tenant_id, study_id, coalesce(signoff_role, signature_role, 'HAZOP Sign-off'), coalesce(assigned_user_id, signer_user_id, 'unassigned')
      order by case when status = 'Signed' then 0 else 1 end, coalesce(updated_at, created_at, now()) desc
    ) as rn
  from public.hazop_signoffs
  where coalesce(status, '') <> 'Superseded'
)
update public.hazop_signoffs s
set status = 'Superseded',
    superseded_at = coalesce(s.superseded_at, now()),
    updated_at = now(),
    comment = coalesce(s.comment, 'Superseded automatically during HAZOP sign-off matrix de-duplication.')
from ranked r
where s.ctid = r.ctid
  and r.rn > 1;

create unique index if not exists hazop_signoffs_active_role_assignee_uniq
  on public.hazop_signoffs (
    tenant_id,
    study_id,
    coalesce(signoff_role, signature_role, 'HAZOP Sign-off'),
    coalesce(assigned_user_id, signer_user_id, 'unassigned')
  )
  where coalesce(status, '') <> 'Superseded';

notify pgrst, 'reload schema';
