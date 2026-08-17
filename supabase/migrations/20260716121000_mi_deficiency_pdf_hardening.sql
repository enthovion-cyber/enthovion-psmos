alter table public.mi_deviations
  add column if not exists submitted_at timestamptz,
  add column if not exists approver_user_id text,
  add column if not exists closure_requirement text,
  add column if not exists extension_reason text,
  add column if not exists extension_requested_at timestamptz,
  add column if not exists extension_approved_at timestamptz;

alter table public.mi_deficiencies
  add column if not exists source_summary text,
  add column if not exists evidence_document_id text,
  add column if not exists universal_action_id text,
  add column if not exists work_order_id text,
  add column if not exists moc_id text,
  add column if not exists inspection_record_id text,
  add column if not exists pm_record_id text,
  add column if not exists calibration_record_id text,
  add column if not exists relief_test_id text,
  add column if not exists safeguard_test_id text,
  add column if not exists impairment_id text;

create index if not exists mi_deficiencies_owner_idx on public.mi_deficiencies(company_id, site_id, owner_user_id, status);
create index if not exists mi_deficiencies_due_idx on public.mi_deficiencies(company_id, site_id, due_date, status);
create index if not exists mi_deficiencies_source_idx on public.mi_deficiencies(company_id, source_module, source_record_id);
create index if not exists mi_deviations_expiry_idx on public.mi_deviations(company_id, site_id, expiry_date, status);
