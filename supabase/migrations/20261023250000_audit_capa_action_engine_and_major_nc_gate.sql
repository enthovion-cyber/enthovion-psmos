-- Migration: 20261023250000_audit_capa_action_engine_and_major_nc_gate.sql
-- Description: Adds Universal Action Engine columns to audit_capa_actions and Hard Closure Gate columns to audit_executions

alter table if exists public.audit_capa_actions
  add column if not exists action_number_snapshot text,
  add column if not exists action_synced_at timestamptz,
  add column if not exists action_sync_status text default 'Pending';

create index if not exists audit_capa_actions_action_number_idx
  on public.audit_capa_actions(action_number_snapshot);

alter table if exists public.audit_executions
  add column if not exists major_nc_blockers_count int not null default 0,
  add column if not exists closure_blocked boolean not null default false,
  add column if not exists closure_blocker_summary_json jsonb,
  add column if not exists major_nc_waiver_approved_by text,
  add column if not exists major_nc_waiver_reason text,
  add column if not exists major_nc_waiver_granted_at timestamptz;

create index if not exists audit_executions_major_nc_gate_idx
  on public.audit_executions(closure_blocked, major_nc_blockers_count);
