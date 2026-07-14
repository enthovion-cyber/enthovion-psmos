-- HAZOP approval workflow compatibility patch.
-- The API writes workflow lifecycle metadata added after the original table migration.
alter table public.hazop_approval_workflows
  add column if not exists workflow_name text,
  add column if not exists workflow_engine_id text,
  add column if not exists current_step text,
  add column if not exists required_final_approver_role text,
  add column if not exists requested_by text,
  add column if not exists requested_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists returned_by text,
  add column if not exists returned_at timestamptz,
  add column if not exists return_reason text,
  add column if not exists closed_by text,
  add column if not exists closed_at timestamptz,
  add column if not exists closure_comment text,
  add column if not exists reopened_by text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopen_reason text;

update public.hazop_approval_workflows
set
  workflow_name = coalesce(workflow_name, 'HAZOP Review & Sign-Off'),
  current_step = coalesce(current_step, status, 'Preparation'),
  required_final_approver_role = coalesce(required_final_approver_role, 'Plant Manager')
where workflow_name is null
   or current_step is null
   or required_final_approver_role is null;

notify pgrst, 'reload schema';
