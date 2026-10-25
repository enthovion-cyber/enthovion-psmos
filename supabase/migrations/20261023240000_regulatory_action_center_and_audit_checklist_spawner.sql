-- Migration: 20261023240000_regulatory_action_center_and_audit_checklist_spawner.sql
-- Connects Regulatory Register Gaps to Universal Action Center and adds Audit Checklist auto-spawner metadata

alter table if exists public.regulatory_evidence_gaps
  add column if not exists universal_action_id text null,
  add column if not exists action_number_snapshot text null,
  add column if not exists action_synced_at timestamptz null;

alter table if exists public.regulatory_applicability_gaps
  add column if not exists universal_action_id text null,
  add column if not exists action_number_snapshot text null,
  add column if not exists action_synced_at timestamptz null;

alter table if exists public.regulatory_obligation_gaps
  add column if not exists universal_action_id text null,
  add column if not exists action_number_snapshot text null,
  add column if not exists action_synced_at timestamptz null;

alter table if exists public.regulatory_compliance_gaps
  add column if not exists universal_action_id text null,
  add column if not exists action_number_snapshot text null,
  add column if not exists action_synced_at timestamptz null;

alter table if exists public.regulatory_audit_mapping_gaps
  add column if not exists universal_action_id text null,
  add column if not exists action_number_snapshot text null,
  add column if not exists action_synced_at timestamptz null;

alter table if exists public.regulatory_audit_mappings
  add column if not exists audit_checklist_code text null,
  add column if not exists audit_checklist_title text null,
  add column if not exists spawned_at timestamptz null;

create index if not exists idx_reg_evidence_gaps_action on public.regulatory_evidence_gaps(universal_action_id);
create index if not exists idx_reg_applicability_gaps_action on public.regulatory_applicability_gaps(universal_action_id);
create index if not exists idx_reg_obligation_gaps_action on public.regulatory_obligation_gaps(universal_action_id);
create index if not exists idx_reg_compliance_gaps_action on public.regulatory_compliance_gaps(universal_action_id);
create index if not exists idx_reg_audit_mapping_gaps_action on public.regulatory_audit_mapping_gaps(universal_action_id);
create index if not exists idx_reg_audit_mappings_checklist_code on public.regulatory_audit_mappings(audit_checklist_code);
