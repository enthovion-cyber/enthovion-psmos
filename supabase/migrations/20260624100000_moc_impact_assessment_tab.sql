alter table moc_impact_assessments add column if not exists company_id text;
alter table moc_impact_assessments add column if not exists site_id text;
alter table moc_impact_assessments add column if not exists status text not null default 'Not Started';
alter table moc_impact_assessments add column if not exists pssr_required boolean not null default false;
alter table moc_impact_assessments add column if not exists hazop_required boolean not null default false;
alter table moc_impact_assessments add column if not exists lopa_required boolean not null default false;
alter table moc_impact_assessments add column if not exists training_required boolean not null default false;
alter table moc_impact_assessments add column if not exists document_update_required boolean not null default false;
alter table moc_impact_assessments add column if not exists environmental_review_required boolean not null default false;
alter table moc_impact_assessments add column if not exists quality_review_required boolean not null default false;
alter table moc_impact_assessments add column if not exists startup_blockers_count integer not null default 0;
alter table moc_impact_assessments add column if not exists closure_blockers_count integer not null default 0;
alter table moc_impact_assessments add column if not exists completed_by text;
alter table moc_impact_assessments add column if not exists completed_at timestamptz;
alter table moc_impact_assessments add column if not exists created_by text;

create table if not exists moc_impact_answers (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  assessment_id text not null references moc_impact_assessments(id) on delete cascade,
  impact_area text not null,
  question_key text not null,
  answer_value jsonb,
  justification text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moc_impact_answers_unique unique(moc_id, question_key)
);

create table if not exists moc_generated_action_rules (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  impact_area text not null,
  question_key text not null,
  trigger_value text not null default 'true',
  action_title_template text not null,
  action_description_template text not null,
  linked_module text not null,
  owner_role_id text,
  priority_rule text not null default 'MEDIUM',
  due_date_rule text not null default '14d',
  required_before_approval boolean not null default false,
  required_before_startup boolean not null default false,
  required_before_closure boolean not null default true,
  evidence_required boolean not null default true,
  verification_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_generated_action_links (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  impact_answer_id text references moc_impact_answers(id) on delete set null,
  action_id text,
  generated_from_rule_id text references moc_generated_action_rules(id) on delete set null,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moc_generated_action_links_unique unique(moc_id, generated_from_rule_id)
);

create index if not exists moc_impact_answers_moc_idx on moc_impact_answers(tenant_id, moc_id, impact_area);
create index if not exists moc_generated_action_rules_lookup_idx on moc_generated_action_rules(impact_area, question_key, is_active);
create index if not exists moc_generated_action_links_moc_idx on moc_generated_action_links(tenant_id, moc_id, status);

alter table moc_impact_answers enable row level security;
alter table moc_generated_action_rules enable row level security;
alter table moc_generated_action_links enable row level security;

insert into "Permission" ("id", "tenantId", "key", "moduleKey", "label")
values
  ('perm_moc_impact_view', 'tenant_alkylation', 'moc.impact.view', 'moc', 'View MOC Impact Assessment'),
  ('perm_moc_impact_edit', 'tenant_alkylation', 'moc.impact.edit', 'moc', 'Edit MOC Impact Assessment'),
  ('perm_moc_impact_complete', 'tenant_alkylation', 'moc.impact.complete', 'moc', 'Complete MOC Impact Assessment'),
  ('perm_moc_impact_regenerate_actions', 'tenant_alkylation', 'moc.impact.regenerate_actions', 'moc', 'Regenerate MOC Impact Actions'),
  ('perm_moc_impact_apply_generated_actions', 'tenant_alkylation', 'moc.impact.apply_generated_actions', 'moc', 'Apply MOC Generated Actions'),
  ('perm_moc_impact_rules_manage', 'tenant_alkylation', 'moc.impact_rules.manage', 'moc', 'Manage MOC Impact Action Rules')
on conflict ("id") do update set
  "key" = excluded."key",
  "moduleKey" = excluded."moduleKey",
  "label" = excluded."label";

insert into moc_generated_action_rules
  (id, tenant_id, company_id, site_id, impact_area, question_key, trigger_value, action_title_template, action_description_template, linked_module, priority_rule, due_date_rule, required_before_approval, required_before_startup, required_before_closure, evidence_required, verification_required)
values
  ('moc_rule_equipment_registry', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'equipment', 'equipmentRegistryUpdateRequired', 'true', 'Update Equipment Registry', 'Update equipment master data and criticality for this MOC.', 'Equipment Registry', 'MEDIUM', '10d', false, false, true, true, true),
  ('moc_rule_pid_update', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'equipment', 'pidUpdateRequired', 'true', 'Update P&ID / engineering drawings', 'Revise affected P&IDs and engineering drawings through Document Control.', 'Document Control', 'HIGH', '10d', false, true, true, true, true),
  ('moc_rule_datasheet', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'equipment', 'equipmentDatasheetUpdateRequired', 'true', 'Update equipment datasheet', 'Revise equipment datasheet and link the controlled document.', 'Document Control', 'MEDIUM', '14d', false, false, true, true, true),
  ('moc_rule_inspection', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'equipment', 'pressureBoundaryAffected', 'true', 'Inspection / MI review', 'Review inspection plan, pressure boundary integrity, and mechanical integrity requirements.', 'Mechanical Integrity', 'HIGH', '10d', false, true, true, true, true),
  ('moc_rule_relief', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'equipment', 'reliefDeviceAffected', 'true', 'Relief device review', 'Review PSV/relief device sizing, setpoint, and protection basis.', 'Process Safety', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_sds', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'chemistry', 'sdsUpdateRequired', 'true', 'SDS update', 'Update SDS and chemical safety information.', 'Document Control', 'MEDIUM', '14d', false, false, true, true, true),
  ('moc_rule_psi_chemical', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'chemistry', 'psiChemicalDataUpdateRequired', 'true', 'PSI chemical register update', 'Update process safety information and chemical register.', 'Document Control', 'MEDIUM', '14d', false, false, true, true, true),
  ('moc_rule_hse_chemical', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'chemistry', 'toxicityChanged', 'true', 'HSE chemical review', 'Review toxic, flammable, corrosive, exposure, and environmental controls.', 'HSE', 'HIGH', '7d', true, true, true, true, true),
  ('moc_rule_sop', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'procedure', 'sopUpdateRequired', 'true', 'SOP revision', 'Revise affected SOPs through Document Control.', 'Document Control', 'MEDIUM', '14d', false, false, true, true, true),
  ('moc_rule_emergency_procedure', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'procedure', 'emergencyProcedureUpdateRequired', 'true', 'Emergency procedure update', 'Review and update emergency procedure impacts.', 'HSE', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_loto', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'procedure', 'lotoProcedureUpdateRequired', 'true', 'LOTO / isolation procedure update', 'Review lockout-tagout and isolation procedure impacts.', 'PTW', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_operating_limits', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'operating_limits', 'operatingLimitsChanged', 'true', 'Operating Limits Register update', 'Update the operating limits register and safe operating envelope.', 'Document Control', 'HIGH', '10d', false, true, true, true, true),
  ('moc_rule_controls_review', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'operating_limits', 'alarmSetpointsChanged', 'true', 'Alarm/interlock setpoint review', 'Review alarm, interlock, and trip setpoint changes.', 'Process Control', 'HIGH', '7d', true, true, true, true, true),
  ('moc_rule_hazop', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'operating_limits', 'hazopDeviationReviewRequired', 'true', 'HAZOP deviation review', 'Complete HAZOP deviation review for changed operating envelope.', 'HAZOP', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_lopa', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'safety_systems', 'lopaReviewRequired', 'true', 'LOPA review', 'Complete LOPA/SIL review for safety system impact.', 'LOPA', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_sis', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'safety_systems', 'sisAffected', 'true', 'SIS revalidation', 'Revalidate SIS design basis, proof test, and safety requirements.', 'SIS', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_cause_effect', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'safety_systems', 'causeEffectUpdateRequired', 'true', 'Cause & effect update', 'Update cause and effect controlled document.', 'Document Control', 'HIGH', '10d', false, true, true, true, true),
  ('moc_rule_cybersecurity', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'safety_systems', 'cybersecurityReviewRequired', 'true', 'Cybersecurity review', 'Review software, DCS, network, and cyber security impacts.', 'Cybersecurity', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_training', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'training', 'trainingRequired', 'true', 'Training completion verification', 'Complete training for all affected roles and verify records.', 'Training', 'HIGH', '14d', false, true, true, true, true),
  ('moc_rule_document_control', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'documents', 'documentControlUpdateRequired', 'true', 'Controlled document update', 'Create required controlled document revisions.', 'Document Control', 'MEDIUM', '14d', false, false, true, true, true),
  ('moc_rule_environmental', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'environmental', 'environmentalImpactAffected', 'true', 'Environmental review', 'Review permit, emissions, wastewater, waste, monitoring, and regulatory impacts.', 'Environmental', 'HIGH', '10d', true, true, true, true, true),
  ('moc_rule_regulatory', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'environmental', 'regulatoryNotificationRequired', 'true', 'Regulatory notification', 'Prepare and track regulatory notification requirements.', 'Compliance', 'HIGH', '7d', true, true, true, true, true),
  ('moc_rule_quality', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'quality', 'productQualityAffected', 'true', 'Quality review', 'Review product quality, laboratory testing, and customer specification impacts.', 'Quality', 'MEDIUM', '10d', true, false, true, true, true),
  ('moc_rule_commissioning', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'quality', 'commissioningTestRequired', 'true', 'Commissioning test', 'Define and complete commissioning test before startup authorization.', 'Operations', 'HIGH', '10d', false, true, true, true, true)
on conflict (id) do update set
  action_title_template = excluded.action_title_template,
  action_description_template = excluded.action_description_template,
  linked_module = excluded.linked_module,
  priority_rule = excluded.priority_rule,
  due_date_rule = excluded.due_date_rule,
  required_before_approval = excluded.required_before_approval,
  required_before_startup = excluded.required_before_startup,
  required_before_closure = excluded.required_before_closure,
  evidence_required = excluded.evidence_required,
  verification_required = excluded.verification_required,
  is_active = true,
  updated_at = now();
