import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey || url.includes('your-project-ref') || serviceRoleKey.includes('replace-with')) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const now = () => new Date().toISOString();
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const dateFromNow = (days: number) => daysFromNow(days).slice(0, 10);

async function upsert(table: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`${table} seed failed: ${error.message}`);
}

async function upsertMany(table: string, rows: Record<string, unknown>[]) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`${table} seed failed: ${error.message}`);
}

async function upsertManyByConflict(table: string, rows: Record<string, unknown>[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table} seed failed: ${error.message}`);
}

async function main() {
  const timestamp = now();
  const tenantId = 'tenant_alkylation';
  const siteId = 'site_jubail';
  const companyId = 'company_alkylation';
  const departmentId = 'dept_hse';
  const unitId = 'unit_alky';
  const areaId = 'area_reactor';
  const roleId = 'role_hse_manager';
  const userId = 'user_imran_shah';
  const equipmentId = 'eq_p_101a';

  await upsert('Tenant', {
    id: tenantId,
    name: 'Alkylation Plant',
    slug: 'alkylation-plant',
    status: 'ACTIVE',
    updatedAt: timestamp
  });

  await upsert('Company', {
    id: companyId,
    tenantId,
    name: 'Alkylation Plant',
    legalName: 'Alkylation Plant Operating Company',
    code: 'ALKY',
    status: 'ACTIVE',
    updatedAt: timestamp
  });

  await upsert('Site', {
    id: siteId,
    tenantId,
    companyId,
    name: 'Jubail Industrial City',
    code: 'JIC',
    timezone: 'Asia/Riyadh',
    address: 'Jubail Industrial City',
    updatedAt: timestamp
  });

  await upsert('Department', {
    id: departmentId,
    tenantId,
    siteId,
    name: 'Health, Safety & Environment',
    code: 'HSE',
    updatedAt: timestamp
  });

  await upsert('Unit', {
    id: unitId,
    tenantId,
    siteId,
    name: 'Alkylation Unit',
    code: 'ALKY',
    updatedAt: timestamp
  });

  await upsert('Area', {
    id: areaId,
    tenantId,
    unitId,
    name: 'Reactor Area',
    code: 'REACTOR',
    updatedAt: timestamp
  });

  const roles = [
    ['role_platform_admin', 'platform_admin', 'Platform Admin'],
    ['role_corporate_admin', 'corporate_admin', 'Corporate Admin'],
    ['role_site_admin', 'site_admin', 'Site Admin'],
    ['role_plant_manager', 'plant_manager', 'Plant Manager'],
    [roleId, 'hse_manager', 'HSE Manager'],
    ['role_process_engineer', 'process_engineer', 'Process Engineer'],
    ['role_operations_supervisor', 'operations_supervisor', 'Operations Supervisor'],
    ['role_maintenance_supervisor', 'maintenance_supervisor', 'Maintenance Supervisor'],
    ['role_permit_issuer', 'permit_issuer', 'Permit Issuer'],
    ['role_permit_holder', 'permit_holder', 'Permit Holder'],
    ['role_operator', 'operator', 'Operator'],
    ['role_contractor', 'contractor', 'Contractor'],
    ['role_viewer', 'viewer', 'Viewer']
  ];

  await upsertMany('Role', roles.map(([id, key, name]) => ({
    id,
    tenantId,
    key,
    name,
    scopeType: ['platform_admin'].includes(key) ? 'GLOBAL' : 'TENANT',
    updatedAt: timestamp
  })));

  const permissions = [
    ['perm_equipment_view', 'equipment.view', 'equipment', 'View Equipment'],
    ['perm_equipment_create', 'equipment.create', 'equipment', 'Create Equipment'],
    ['perm_equipment_edit', 'equipment.edit', 'equipment', 'Edit Equipment'],
    ['perm_equipment_delete', 'equipment.delete', 'equipment', 'Delete Equipment'],
    ['perm_equipment_upload', 'equipment.upload', 'equipment', 'Upload Equipment Files'],
    ['perm_equipment_qr_generate', 'equipment.qr.generate', 'equipment', 'Generate Equipment QR'],
    ['perm_actions_view', 'actions.view', 'actions', 'View Actions'],
    ['perm_actions_create', 'actions.create', 'actions', 'Create Actions'],
    ['perm_actions_edit', 'actions.edit', 'actions', 'Edit Actions'],
    ['perm_actions_assign', 'actions.assign', 'actions', 'Assign Actions'],
    ['perm_actions_close', 'actions.close', 'actions', 'Close Actions'],
    ['perm_actions_verify', 'actions.verify', 'actions', 'Verify Actions'],
    ['perm_actions_delete', 'actions.delete', 'actions', 'Delete Actions'],
    ['perm_actions_export', 'actions.export', 'actions', 'Export Actions'],
    ['perm_workflows_view', 'workflows.view', 'workflows', 'View Workflows'],
    ['perm_workflows_create', 'workflows.create', 'workflows', 'Create Workflows'],
    ['perm_workflows_approve', 'workflows.approve', 'workflows', 'Approve Workflows'],
    ['perm_workflow_view', 'workflow.view', 'workflows', 'View Workflow Engine'],
    ['perm_workflow_create', 'workflow.create', 'workflows', 'Start Workflows'],
    ['perm_workflow_edit', 'workflow.edit', 'workflows', 'Edit Workflows'],
    ['perm_workflow_delete', 'workflow.delete', 'workflows', 'Delete Workflow Templates'],
    ['perm_workflow_approve', 'workflow.approve', 'workflows', 'Approve Workflow Steps'],
    ['perm_workflow_reject', 'workflow.reject', 'workflows', 'Reject Workflow Steps'],
    ['perm_workflow_override', 'workflow.override', 'workflows', 'Override Workflows'],
    ['perm_workflow_manage_templates', 'workflow.manage_templates', 'workflows', 'Manage Workflow Templates'],
    ['perm_documents_view', 'documents.view', 'documents', 'View Documents'],
    ['perm_documents_upload', 'documents.upload', 'documents', 'Upload Documents'],
    ['perm_documents_edit', 'documents.edit', 'documents', 'Edit Documents'],
    ['perm_documents_delete', 'documents.delete', 'documents', 'Delete Documents'],
    ['perm_documents_approve', 'documents.approve', 'documents', 'Approve Documents'],
    ['perm_documents_archive', 'documents.archive', 'documents', 'Archive Documents'],
    ['perm_documents_download', 'documents.download', 'documents', 'Download Documents'],
    ['perm_documents_link', 'documents.link', 'documents', 'Link Documents'],
    ['perm_documents_comment', 'documents.comment', 'documents', 'Comment on Documents'],
    ['perm_users_view', 'users.view', 'users', 'View Users'],
    ['perm_users_create', 'users.create', 'users', 'Create Users'],
    ['perm_users_edit', 'users.edit', 'users', 'Edit Users'],
    ['perm_roles_manage', 'roles.manage', 'roles', 'Manage Roles'],
    ['perm_notifications_view', 'notifications.view', 'notifications', 'View Notifications'],
    ['perm_notifications_manage', 'notifications.manage', 'notifications', 'Manage Notifications'],
    ['perm_notifications_preferences', 'notifications.preferences', 'notifications', 'Manage Notification Preferences'],
    ['perm_notifications_test', 'notifications.test', 'notifications', 'Test Notification Channels'],
    ['perm_search_use', 'search.use', 'search', 'Use Search'],
    ['perm_search_reindex', 'search.reindex', 'search', 'Reindex Search'],
    ['perm_ptw_view', 'ptw.view', 'ptw', 'View PTW'],
    ['perm_ptw_create', 'ptw.create', 'ptw', 'Create PTW'],
    ['perm_ptw_edit', 'ptw.edit', 'ptw', 'Edit PTW'],
    ['perm_ptw_submit', 'ptw.submit', 'ptw', 'Submit PTW'],
    ['perm_ptw_approve', 'ptw.approve', 'ptw', 'Approve PTW'],
    ['perm_ptw_issue', 'ptw.issue', 'ptw', 'Issue PTW'],
    ['perm_ptw_activate', 'ptw.activate', 'ptw', 'Activate PTW'],
    ['perm_ptw_suspend', 'ptw.suspend', 'ptw', 'Suspend PTW'],
    ['perm_ptw_extend', 'ptw.extend', 'ptw', 'Extend PTW'],
    ['perm_ptw_close', 'ptw.close', 'ptw', 'Close PTW'],
    ['perm_ptw_cancel', 'ptw.cancel', 'ptw', 'Cancel PTW'],
    ['perm_ptw_gas_test_view', 'ptw.gas_test.view', 'ptw', 'View PTW Gas Tests'],
    ['perm_ptw_gas_test_add', 'ptw.gas_test.add', 'ptw', 'Add PTW Gas Test'],
    ['perm_ptw_gas_test_edit', 'ptw.gas_test.edit', 'ptw', 'Edit PTW Gas Tests'],
    ['perm_ptw_gas_test_delete', 'ptw.gas_test.delete', 'ptw', 'Delete PTW Gas Tests'],
    ['perm_ptw_gas_test_validate', 'ptw.gas_test.validate', 'ptw', 'Validate PTW Gas Tests'],
    ['perm_ptw_gas_thresholds_manage', 'ptw.gas_thresholds.manage', 'ptw', 'Manage PTW Gas Thresholds'],
    ['perm_ptw_isolation_add', 'ptw.isolation.add', 'ptw', 'Add PTW Isolation'],
    ['perm_ptw_isolation_edit', 'ptw.isolation.edit', 'ptw', 'Edit PTW Isolation'],
    ['perm_ptw_isolation_delete', 'ptw.isolation.delete', 'ptw', 'Delete PTW Isolation'],
    ['perm_ptw_isolation_confirm', 'ptw.isolation.confirm', 'ptw', 'Confirm PTW Isolation'],
    ['perm_ptw_isolation_verify', 'ptw.isolation.verify', 'ptw', 'Verify PTW Isolation'],
    ['perm_ptw_isolation_certificate_generate', 'ptw.isolation.certificate.generate', 'ptw', 'Generate PTW Isolation Certificate'],
    ['perm_ptw_deisolation_confirm', 'ptw.deisolation.confirm', 'ptw', 'Confirm PTW De-Isolation'],
    ['perm_ptw_conflict_override', 'ptw.conflict.override', 'ptw', 'Override PTW Conflict'],
    ['perm_ptw_conflict_view', 'ptw.conflict.view', 'ptw', 'View PTW Conflicts'],
    ['perm_ptw_conflict_check', 'ptw.conflict.check', 'ptw', 'Run PTW Conflict Checks'],
    ['perm_ptw_conflict_resolve', 'ptw.conflict.resolve', 'ptw', 'Resolve PTW Conflicts'],
    ['perm_ptw_conflict_override_request', 'ptw.conflict.override.request', 'ptw', 'Request PTW Conflict Override'],
    ['perm_ptw_conflict_override_approve', 'ptw.conflict.override.approve', 'ptw', 'Approve PTW Conflict Override'],
    ['perm_ptw_conflict_false_positive', 'ptw.conflict.false_positive', 'ptw', 'Mark PTW Conflict False Positive'],
    ['perm_ptw_simops_view', 'ptw.simops.view', 'ptw', 'View PTW SIMOPS'],
    ['perm_ptw_simops_create', 'ptw.simops.create', 'ptw', 'Create PTW SIMOPS Review'],
    ['perm_ptw_simops_approve', 'ptw.simops.approve', 'ptw', 'Approve PTW SIMOPS Review'],
    ['perm_ptw_conflict_matrix_manage', 'ptw.conflict_matrix.manage', 'ptw', 'Manage PTW Conflict Matrix'],
    ['perm_ptw_handover', 'ptw.handover', 'ptw', 'PTW Handover'],
    ['perm_ptw_handover_view', 'ptw.handover.view', 'ptw', 'View PTW Shift Handover'],
    ['perm_ptw_handover_create', 'ptw.handover.create', 'ptw', 'Create PTW Shift Handover'],
    ['perm_ptw_handover_edit', 'ptw.handover.edit', 'ptw', 'Edit PTW Shift Handover'],
    ['perm_ptw_handover_acknowledge', 'ptw.handover.acknowledge', 'ptw', 'Acknowledge PTW Shift Handover'],
    ['perm_ptw_handover_complete', 'ptw.handover.complete', 'ptw', 'Complete PTW Shift Handover'],
    ['perm_ptw_handover_suspend', 'ptw.handover.suspend', 'ptw', 'Suspend PTW During Shift Handover'],
    ['perm_ptw_handover_delete', 'ptw.handover.delete', 'ptw', 'Delete PTW Shift Handover'],
    ['perm_ptw_sign', 'ptw.sign', 'ptw', 'Sign PTW'],
    ['perm_ptw_signatures_view', 'ptw.signatures.view', 'ptw', 'View PTW Signatures'],
    ['perm_ptw_signatures_sign', 'ptw.signatures.sign', 'ptw', 'Complete PTW Signatures'],
    ['perm_ptw_signatures_reject', 'ptw.signatures.reject', 'ptw', 'Reject PTW Signatures'],
    ['perm_ptw_signatures_revalidate', 'ptw.signatures.revalidate', 'ptw', 'Revalidate PTW Signatures'],
    ['perm_ptw_signature_requirements_manage', 'ptw.signature_requirements.manage', 'ptw', 'Manage PTW Signature Requirements'],
    ['perm_ptw_attachments_view', 'ptw.attachments.view', 'ptw', 'View PTW Attachments'],
    ['perm_ptw_attachments_upload', 'ptw.attachments.upload', 'ptw', 'Upload PTW Attachments'],
    ['perm_ptw_attachments_preview', 'ptw.attachments.preview', 'ptw', 'Preview PTW Attachments'],
    ['perm_ptw_attachments_download', 'ptw.attachments.download', 'ptw', 'Download PTW Attachments'],
    ['perm_ptw_attachments_delete', 'ptw.attachments.delete', 'ptw', 'Delete PTW Attachments'],
    ['perm_ptw_attachment_requirements_manage', 'ptw.attachment_requirements.manage', 'ptw', 'Manage PTW Attachment Requirements'],
    ['perm_ptw_workforce_view', 'ptw.workforce.view', 'ptw', 'View PTW Workforce'],
    ['perm_ptw_workforce_add', 'ptw.workforce.add', 'ptw', 'Add PTW Workforce'],
    ['perm_ptw_workforce_edit', 'ptw.workforce.edit', 'ptw', 'Edit PTW Workforce'],
    ['perm_ptw_workforce_delete', 'ptw.workforce.delete', 'ptw', 'Delete PTW Workforce'],
    ['perm_ptw_workforce_briefing', 'ptw.workforce.briefing', 'ptw', 'Manage PTW Workforce Briefings'],
    ['perm_ptw_workforce_sign_in', 'ptw.workforce.sign_in', 'ptw', 'PTW Workforce Sign In'],
    ['perm_ptw_workforce_sign_out', 'ptw.workforce.sign_out', 'ptw', 'PTW Workforce Sign Out'],
    ['perm_ptw_workforce_accountability', 'ptw.workforce.accountability', 'ptw', 'PTW Workforce Accountability'],
    ['perm_ptw_workforce_manage', 'ptw.workforce.manage', 'ptw', 'Manage PTW Workforce'],
    ['perm_ptw_template_manage', 'ptw.template.manage', 'ptw', 'Manage PTW Templates'],
    ['perm_ptw_export', 'ptw.export', 'ptw', 'Export PTW'],
    ['perm_ptw_map_view', 'ptw.map.view', 'ptw', 'View PTW Permit Map'],
    ['perm_ptw_map_manage_layouts', 'ptw.map.manage_layouts', 'ptw', 'Manage PTW Map Layouts'],
    ['perm_ptw_map_manage_zones', 'ptw.map.manage_zones', 'ptw', 'Manage PTW Map Zones'],
    ['perm_ptw_map_manage_markers', 'ptw.map.manage_markers', 'ptw', 'Manage PTW Map Markers'],
    ['perm_moc_view', 'moc.view', 'moc', 'View MOC'],
    ['perm_moc_create', 'moc.create', 'moc', 'Create MOC'],
    ['perm_moc_edit', 'moc.edit', 'moc', 'Edit MOC'],
    ['perm_moc_submit', 'moc.submit', 'moc', 'Submit MOC'],
    ['perm_moc_approve', 'moc.approve', 'moc', 'Approve MOC'],
    ['perm_moc_reject', 'moc.reject', 'moc', 'Reject MOC'],
    ['perm_moc_return', 'moc.return', 'moc', 'Return MOC'],
    ['perm_moc_implementation_start', 'moc.implementation.start', 'moc', 'Start MOC Implementation'],
    ['perm_moc_implementation_complete', 'moc.implementation.complete', 'moc', 'Complete MOC Implementation'],
    ['perm_moc_ready_for_startup', 'moc.ready_for_startup', 'moc', 'Mark MOC Ready For Startup'],
    ['perm_moc_close', 'moc.close', 'moc', 'Close MOC'],
    ['perm_moc_cancel', 'moc.cancel', 'moc', 'Cancel MOC'],
    ['perm_moc_export', 'moc.export', 'moc', 'Export MOC Dashboard'],
    ['perm_moc_dashboard_view', 'moc.dashboard.view', 'moc', 'View MOC Dashboard'],
    ['perm_moc_approval_queue_view', 'moc.approval_queue.view', 'moc', 'View MOC Approval Queue'],
    ['perm_moc_temporary_dashboard_view', 'moc.temporary_dashboard.view', 'moc', 'View MOC Temporary Dashboard'],
    ['perm_moc_emergency_dashboard_view', 'moc.emergency_dashboard.view', 'moc', 'View MOC Emergency Dashboard'],
    ['perm_moc_risk_dashboard_view', 'moc.risk_dashboard.view', 'moc', 'View MOC Risk Dashboard'],
    ['perm_moc_temporary_extend', 'moc.temporary.extend', 'moc', 'Extend Temporary MOC'],
    ['perm_moc_pssr_trigger', 'moc.pssr.trigger', 'moc', 'Trigger MOC PSSR'],
    ['perm_moc_upload_documents', 'moc.upload_documents', 'moc', 'Upload MOC Documents'],
    ['perm_moc_attachments_upload', 'moc.attachments.upload', 'moc', 'Upload MOC Attachments'],
    ['perm_moc_generate_actions', 'moc.generate_actions', 'moc', 'Generate MOC Actions'],
    ['perm_moc_impact_view', 'moc.impact.view', 'moc', 'View MOC Impact Assessment'],
    ['perm_moc_impact_edit', 'moc.impact.edit', 'moc', 'Edit MOC Impact Assessment'],
    ['perm_moc_impact_complete', 'moc.impact.complete', 'moc', 'Complete MOC Impact Assessment'],
    ['perm_moc_impact_regenerate_actions', 'moc.impact.regenerate_actions', 'moc', 'Regenerate MOC Impact Actions'],
    ['perm_moc_impact_apply_generated_actions', 'moc.impact.apply_generated_actions', 'moc', 'Apply MOC Generated Actions'],
    ['perm_moc_impact_rules_manage', 'moc.impact_rules.manage', 'moc', 'Manage MOC Impact Rules'],
    ['perm_moc_risk_view', 'moc.risk.view', 'moc', 'View MOC Risk Ranking'],
    ['perm_moc_risk_edit', 'moc.risk.edit', 'moc', 'Edit MOC Risk Ranking'],
    ['perm_moc_risk_complete', 'moc.risk.complete', 'moc', 'Complete MOC Risk Ranking'],
    ['perm_moc_risk_recalculate', 'moc.risk.recalculate', 'moc', 'Recalculate MOC Risk Ranking'],
    ['perm_moc_risk_lock', 'moc.risk.lock', 'moc', 'Lock MOC Risk Ranking'],
    ['perm_moc_risk_unlock', 'moc.risk.unlock', 'moc', 'Unlock MOC Risk Ranking'],
    ['perm_moc_risk_reassessment_request', 'moc.risk.reassessment_request', 'moc', 'Request MOC Risk Reassessment'],
    ['perm_moc_risk_apply_review_requirements', 'moc.risk.apply_review_requirements', 'moc', 'Apply MOC Risk Review Requirements'],
    ['perm_moc_engineering_view', 'moc.engineering.view', 'moc', 'View MOC Engineering Package'],
    ['perm_moc_engineering_upload', 'moc.engineering.upload', 'moc', 'Upload MOC Engineering Documents'],
    ['perm_moc_engineering_link_document', 'moc.engineering.link_document', 'moc', 'Link MOC Engineering Documents'],
    ['perm_moc_engineering_review', 'moc.engineering.review', 'moc', 'Review MOC Engineering Package'],
    ['perm_moc_engineering_approve', 'moc.engineering.approve', 'moc', 'Approve MOC Engineering Package'],
    ['perm_moc_engineering_delete', 'moc.engineering.delete', 'moc', 'Delete MOC Engineering Documents'],
    ['perm_moc_actions_view', 'moc.actions.view', 'moc', 'View MOC Closed-Loop Actions'],
    ['perm_moc_actions_generate', 'moc.actions.generate', 'moc', 'Generate MOC Closed-Loop Actions'],
    ['perm_moc_actions_sync', 'moc.actions.sync', 'moc', 'Sync MOC Closed-Loop Actions'],
    ['perm_moc_actions_create_custom', 'moc.actions.create_custom', 'moc', 'Create Custom MOC Actions'],
    ['perm_moc_actions_mark_no_longer_required', 'moc.actions.mark_no_longer_required', 'moc', 'Mark MOC Action No Longer Required'],
    ['perm_moc_actions_view_blockers', 'moc.actions.view_blockers', 'moc', 'View MOC Action Blockers'],
    ['perm_moc_workflow_view', 'moc.workflow.view', 'moc', 'View MOC Approval Workflow'],
    ['perm_moc_workflow_start', 'moc.workflow.start', 'moc', 'Start MOC Approval Workflow'],
    ['perm_moc_workflow_approve', 'moc.workflow.approve', 'moc', 'Approve MOC Workflow Step'],
    ['perm_moc_workflow_reject', 'moc.workflow.reject', 'moc', 'Reject MOC Workflow Step'],
    ['perm_moc_workflow_return', 'moc.workflow.return', 'moc', 'Return MOC Workflow Step'],
    ['perm_moc_workflow_delegate', 'moc.workflow.delegate', 'moc', 'Delegate MOC Workflow Step'],
    ['perm_moc_workflow_escalate', 'moc.workflow.escalate', 'moc', 'Escalate MOC Workflow'],
    ['perm_moc_workflow_restart', 'moc.workflow.restart', 'moc', 'Restart MOC Workflow'],
    ['perm_moc_temporary_view', 'moc.temporary.view', 'moc', 'View Temporary MOC Controls'],
    ['perm_moc_temporary_edit', 'moc.temporary.edit', 'moc', 'Edit Temporary MOC Controls'],
    ['perm_moc_temporary_approve_extension', 'moc.temporary.approve_extension', 'moc', 'Approve Temporary Extension'],
    ['perm_moc_temporary_close', 'moc.temporary.close', 'moc', 'Close Temporary MOC'],
    ['perm_moc_emergency_view', 'moc.emergency.view', 'moc', 'View Emergency MOC Controls'],
    ['perm_moc_emergency_edit', 'moc.emergency.edit', 'moc', 'Edit Emergency MOC Controls'],
    ['perm_moc_emergency_review', 'moc.emergency.review', 'moc', 'Complete Emergency Review'],
    ['perm_moc_emergency_convert', 'moc.emergency.convert', 'moc', 'Convert Emergency MOC'],
    ['perm_moc_pssr_view', 'moc.pssr.view', 'moc', 'View MOC PSSR Readiness'],
    ['perm_moc_pssr_sync', 'moc.pssr.sync', 'moc', 'Sync MOC PSSR'],
    ['perm_moc_startup_view', 'moc.startup.view', 'moc', 'View Startup Readiness'],
    ['perm_moc_startup_check', 'moc.startup.check', 'moc', 'Run Startup Readiness Check'],
    ['perm_moc_release_for_startup', 'moc.release_for_startup', 'moc', 'Release MOC For Startup'],
    ['perm_moc_return_to_implementation', 'moc.return_to_implementation', 'moc', 'Return MOC To Implementation'],
    ['perm_moc_communication_view', 'moc.communication.view', 'moc', 'View MOC Communication'],
    ['perm_moc_communication_edit', 'moc.communication.edit', 'moc', 'Edit MOC Communication'],
    ['perm_moc_communication_send', 'moc.communication.send', 'moc', 'Send MOC Communication'],
    ['perm_moc_acknowledgement_view', 'moc.acknowledgement.view', 'moc', 'View MOC Acknowledgements'],
    ['perm_moc_acknowledgement_acknowledge', 'moc.acknowledgement.acknowledge', 'moc', 'Acknowledge MOC'],
    ['perm_moc_acknowledgement_waive', 'moc.acknowledgement.waive', 'moc', 'Waive MOC Acknowledgement'],
    ['perm_moc_training_view', 'moc.training.view', 'moc', 'View MOC Training'],
    ['perm_moc_training_create', 'moc.training.create', 'moc', 'Create MOC Training'],
    ['perm_moc_training_complete', 'moc.training.complete', 'moc', 'Complete MOC Training'],
    ['perm_moc_training_verify', 'moc.training.verify', 'moc', 'Verify MOC Training'],
    ['perm_moc_training_waive', 'moc.training.waive', 'moc', 'Waive MOC Training'],
    ['perm_moc_history_view', 'moc.history.view', 'moc', 'View MOC History'],
    ['perm_moc_history_export', 'moc.history.export', 'moc', 'Export MOC History'],
    ['perm_moc_attachments_view', 'moc.attachments.view', 'moc', 'View MOC Attachments'],
    ['perm_moc_attachments_preview', 'moc.attachments.preview', 'moc', 'Preview MOC Attachments'],
    ['perm_moc_attachments_download', 'moc.attachments.download', 'moc', 'Download MOC Attachments'],
    ['perm_moc_attachments_delete', 'moc.attachments.delete', 'moc', 'Delete MOC Attachments'],
    ['perm_moc_attachments_link_document', 'moc.attachments.link_document', 'moc', 'Link MOC Attachment Document'],
    ['perm_moc_report_download', 'moc.report.download', 'moc', 'Download MOC Report'],
    ['perm_settings_manage', 'settings.manage', 'settings', 'Manage Settings']
  ];

  await upsertMany('Permission', permissions.map(([id, key, moduleKey, label]) => ({ id, tenantId, key, moduleKey, label })));

  const privilegedRoleIds = ['role_platform_admin', 'role_corporate_admin', 'role_site_admin', roleId];
  await upsertManyByConflict(
    'RolePermission',
    privilegedRoleIds.flatMap((privilegedRoleId) => permissions.map(([permissionId]) => ({ roleId: privilegedRoleId, permissionId }))),
    'roleId,permissionId'
  );

  await supabase
    .from('RolePermission')
    .delete()
    .eq('roleId', roleId)
    .in('permissionId', ['perm_equipment_write', 'perm_equipment_upload', 'perm_equipment_note', 'perm_equipment_delete']);
  await supabase
    .from('Permission')
    .delete()
    .eq('tenantId', tenantId)
    .in('key', ['equipment.write', 'equipment.upload', 'equipment.note', 'equipment.delete']);

  await upsert('User', {
    id: userId,
    tenantId,
    email: 'imran.shah@psmos.local',
    passwordHash: '$2a$10$iphD8eiVWcc79rmIAiGCB.xslJW8hlSIHMAJUw.DqvMF6zfFhd7sC',
    displayName: 'Imran Shah',
    title: 'HSE Manager',
    department: 'HSE',
    status: 'ACTIVE',
    updatedAt: timestamp
  });

  await upsertManyByConflict('UserProfile', [{
    userId,
    avatarUrl: null,
    phone: '+966-555-0100',
    mobile: '+966-555-0100',
    timezone: 'Asia/Riyadh',
    locale: 'en',
    bio: 'HSE Manager responsible for PSM OS foundation administration.',
    metadata: { demo: true },
    updatedAt: timestamp
  }], 'userId');

  await supabase.from('UserRole').delete().eq('userId', userId);
  await upsert('UserRole', { id: 'userrole_imran_hse_manager', userId, roleId, scopeType: 'TENANT', companyId, siteId, createdAt: timestamp });
  await upsertManyByConflict('UserSite', [{ userId, siteId, companyId, unitId, areaId }], 'userId,siteId');

  await upsert('ContractorCompany', {
    id: 'contractor_abc_maintenance',
    tenantId,
    name: 'ABC Maintenance Services',
    code: 'ABC-MAINT',
    status: 'ACTIVE',
    contactEmail: 'contracts@abc-maint.local',
    contactPhone: '+966-555-0111',
    updatedAt: timestamp
  });

  await upsert('Equipment', {
    id: equipmentId,
    tenantId,
    siteId,
    unitId,
    areaId,
    tag: 'P-101A',
    name: 'Feed Pump A',
    description: 'Centrifugal feed pump supplying deaerated boiler feed water to the deaerator storage tank and boiler drum.',
    type: 'Pump - Centrifugal',
    subtype: 'Centrifugal Pump',
    manufacturer: 'Flowserve',
    model: 'CPX-200',
    serialNumber: 'FS-88492-11',
    commissionDate: '2019-03-15T00:00:00.000Z',
    fabricationYear: 2018,
    systemName: 'Feedwater System',
    buildingZone: 'Boiler Area',
    status: 'ACTIVE',
    criticality: 'HIGH',
    safetyCritical: true,
    classification: 'Rotating Equipment',
    hazardClass: 'Non-Hazardous',
    areaClassification: 'Safe Area',
    fluidName: 'Deaerated Water',
    fluidService: 'Deaerated Water',
    phase: 'Liquid',
    sdsReference: 'SDS-WATER-001',
    exposureLimits: 'Not Applicable',
    environmentalImpact: 'Low',
    designPressure: '150',
    designPressureUnit: 'psig',
    designTemperature: '250',
    designTemperatureUnit: 'C',
    designCode: 'API 610',
    operatingPressure: '40',
    operatingPressureUnit: 'barg',
    operatingTemperature: '120',
    operatingTemperatureUnit: 'C',
    serviceType: 'Critical Service',
    fluidPhase: 'Liquid',
    lotoRequired: true,
    psvProtected: true,
    qrCodePayload: JSON.stringify({ tenantId, equipmentId, tag: 'P-101A' }),
    metadata: { demo: true, source: 'supabase-seed' },
    updatedAt: timestamp
  });

  await upsert('EquipmentQrCode', {
    id: 'qr_p_101a',
    tenantId,
    equipmentId,
    payload: JSON.stringify({ tenantId, equipmentId, tag: 'P-101A' }),
    label: 'P-101A Asset QR',
    generatedById: userId
  });

  await upsertMany('EquipmentTimelineEvent', [
    {
      id: 'timeline_p_101a_commissioned',
      tenantId,
      equipmentId,
      eventType: 'COMMISSIONED',
      title: 'Equipment Commissioned',
      description: 'P-101A commissioned and added to Equipment Registry.',
      actorName: 'Ahmed Khan',
      occurredAt: '2019-03-15T09:00:00.000Z',
      sourceType: 'Equipment',
      sourceId: equipmentId
    },
    {
      id: 'timeline_p_101a_inspection',
      tenantId,
      equipmentId,
      eventType: 'INSPECTION',
      title: 'Inspection Completed',
      description: 'Routine inspection completed.',
      actorName: 'Maintenance Team',
      occurredAt: '2025-03-10T09:00:00.000Z',
      sourceType: 'EquipmentInspection',
      sourceId: 'inspection_p_101a_2025_03'
    }
  ]);

  await upsert('EquipmentInspection', {
    id: 'inspection_p_101a_2025_03',
    tenantId,
    equipmentId,
    inspectionType: 'Routine Inspection',
    inspectionDate: '2025-03-10T00:00:00.000Z',
    inspector: 'Maintenance Team',
    result: 'Completed',
    observation: 'No abnormal vibration or leakage observed.',
    status: 'COMPLETED',
    dueDate: '2025-03-10T00:00:00.000Z',
    nextInspectionDate: '2025-09-10T00:00:00.000Z',
    completedAt: '2025-03-10T10:30:00.000Z',
    intervalMonths: 6,
    rbiPriority: 'HIGH',
    summary: 'Inspection completed successfully.',
    updatedAt: timestamp
  });

  await upsertMany('EquipmentDocument', [
    {
      id: 'doc_pid_001_rev4',
      tenantId,
      equipmentId,
      title: 'PID-001 Rev4',
      documentNo: 'PID-001',
      documentType: 'P&ID',
      fileName: 'PID-001-Rev4.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 245000,
      storageKey: 'demo/equipment/P-101A/PID-001-Rev4.pdf',
      status: 'APPROVED',
      uploadedById: userId
    },
    {
      id: 'doc_p_101a_datasheet',
      tenantId,
      equipmentId,
      title: 'P-101A Datasheet',
      documentNo: 'DS-P-101A',
      documentType: 'Datasheet',
      fileName: 'P-101A-Datasheet.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 512000,
      storageKey: 'demo/equipment/P-101A/P-101A-Datasheet.pdf',
      status: 'APPROVED',
      uploadedById: userId
    }
  ]);

  await upsertMany('document_folders', [
    { id: 'doc_folder_ops', tenant_id: tenantId, site_id: siteId, name: 'Operations', path: '/Operations' },
    { id: 'doc_folder_psi', tenant_id: tenantId, site_id: siteId, name: 'Process Safety Information', path: '/Process Safety Information' },
    { id: 'doc_folder_cert', tenant_id: tenantId, site_id: siteId, name: 'Certificates', path: '/Certificates' }
  ]);

  await upsert('documents', {
    id: 'controlled_doc_pid_001_rev4',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    unit_id: unitId,
    area_id: areaId,
    folder_id: 'doc_folder_psi',
    document_number: 'PID-2026-000001',
    title: 'PID-001 Rev4',
    description: 'Controlled P&ID linked to P-101A and governed by Document Control.',
    document_type: 'P&ID',
    status: 'Active',
    current_version_id: null,
    owner_id: userId,
    created_by: userId,
    metadata: { demo: true, source: 'supabase-seed', equipmentTag: 'P-101A' },
    updated_at: timestamp
  });

  await upsert('document_versions', {
    id: 'controlled_doc_pid_001_rev4_v1',
    tenant_id: tenantId,
    document_id: 'controlled_doc_pid_001_rev4',
    version_number: 'v1.0',
    file_name: 'PID-001-Rev4.pdf',
    file_url: 'demo/documents/PID-001-Rev4.pdf',
    file_type: 'application/pdf',
    file_size: 245000,
    uploaded_by: userId,
    change_summary: 'Initial controlled P&ID import from Equipment Registry seed.',
    is_current: true
  });

  await supabase
    .from('documents')
    .update({ current_version_id: 'controlled_doc_pid_001_rev4_v1', updated_at: timestamp })
    .eq('id', 'controlled_doc_pid_001_rev4');

  await upsert('document_reviews', {
    id: 'controlled_doc_pid_001_rev4_review',
    tenant_id: tenantId,
    document_id: 'controlled_doc_pid_001_rev4',
    review_frequency_months: 12,
    last_review_date: '2026-01-15',
    next_review_date: '2027-01-15',
    review_owner_id: userId,
    review_status: 'Scheduled',
    updated_at: timestamp
  });

  await upsert('document_relations', {
    id: 'controlled_doc_pid_001_rev4_rel_equipment',
    tenant_id: tenantId,
    document_id: 'controlled_doc_pid_001_rev4',
    related_module: 'equipment',
    related_record_id: equipmentId,
    equipment_id: equipmentId,
    relation_type: 'Controlled Document',
    created_by: userId
  });

  await upsertMany('document_tags', [
    { id: 'controlled_doc_pid_001_rev4_tag_psi', tenant_id: tenantId, document_id: 'controlled_doc_pid_001_rev4', tag: 'PSI' },
    { id: 'controlled_doc_pid_001_rev4_tag_p101a', tenant_id: tenantId, document_id: 'controlled_doc_pid_001_rev4', tag: 'P-101A' }
  ]);

  await upsert('document_comments', {
    id: 'controlled_doc_pid_001_rev4_comment',
    tenant_id: tenantId,
    document_id: 'controlled_doc_pid_001_rev4',
    author_id: userId,
    body: 'Seeded controlled document verified against the Equipment Registry document tab.',
    updated_at: timestamp
  });

  await upsert('document_access_logs', {
    id: 'controlled_doc_pid_001_rev4_access_seed',
    tenant_id: tenantId,
    document_id: 'controlled_doc_pid_001_rev4',
    user_id: userId,
    action: 'seed_import'
  });

  const mocId = 'moc_2026_000045';
  await upsert('mocs', {
    id: mocId,
    moc_number: 'MOC-2026-000045',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    department_id: departmentId,
    unit_id: unitId,
    area_id: areaId,
    title: 'Increase reactor feed rate in Alkylation Unit - P-101A upgrade',
    description: 'Upgrade feed pump P-101A and associated controls to support controlled reactor feed rate increase while maintaining operating envelope and protection layers.',
    affected_system: 'Reactor feed system',
    location_description: 'Alkylation Unit / Reactor Area / Feedwater System',
    change_description: {
      currentCondition: 'P-101A currently limits feed rate during peak production campaigns.',
      proposedChange: 'Install upgraded impeller, revise DCS operating limit, update P&ID, and validate feed flow control response.',
      reasonForChange: 'Increase unit throughput while preserving process safety controls.',
      problemStatement: 'Existing pump margin is insufficient for requested operating envelope.',
      businessJustification: 'Improve production flexibility and reduce bottleneck during demand peaks.',
      safetyJustification: 'Formal MOC review required because operating limits, P&ID, training, and PSSR readiness are impacted.',
      expectedBenefit: '15% feed capacity increase with documented safeguards.',
      preChangeState: 'P-101A rated for current normal feed rate and existing alarm/interlock limits.',
      postChangeState: 'P-101A upgraded with revised safe operating limits and verified startup readiness.',
      scopeBoundaries: 'Pump, feed line controls, P&ID, SOP, training, HAZOP deviation review, and PSSR.',
      notIncluded: 'No reactor internals modification and no chemistry recipe change.',
      implementationPlanSummary: 'Complete engineering package, approve MOC, execute installation, close actions, trigger PSSR, and authorize startup.'
    },
    like_for_like: { isLikeForLike: false, justification: 'Not like-for-like because capacity and operating limits change.' },
    change_type: 'Permanent Process Change',
    change_category: 'Equipment',
    priority: 'High',
    risk_level: 'High',
    risk_score: 5,
    status: 'Under Review',
    originator_id: userId,
    requested_start_date: '2026-07-01',
    target_implementation_date: '2026-07-20',
    submitted_at: '2026-06-21T08:30:00.000Z',
    created_by: userId,
    updated_at: timestamp
  });

  await upsert('moc_affected_equipment', {
    id: 'moc_2026_000045_eq_p101a',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    moc_id: mocId,
    equipment_id: equipmentId,
    role: 'PRIMARY',
    equipment_snapshot: { id: equipmentId, tag: 'P-101A', name: 'Feed Pump A', type: 'Pump - Centrifugal', criticality: 'High', safetyCritical: true, system: 'Feedwater System' },
    created_by: userId,
    updated_at: timestamp
  });

  await upsert('moc_risk_assessments', {
    id: 'moc_2026_000045_risk',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    moc_id: mocId,
    safety_impact: 2,
    environmental_impact: 1,
    production_impact: 2,
    total_score: 5,
    risk_level: 'High',
    rationale: 'High risk due to equipment capacity change, operating limit update, and startup readiness dependency.',
    before_risk: { level: 'Medium', score: 4 },
    after_risk: { level: 'High', score: 5 },
    created_by: userId,
    updated_at: timestamp
  });

  await upsert('moc_impact_assessments', {
    id: 'moc_2026_000045_impact',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    moc_id: mocId,
    answers: {
      equipmentAffected: true,
      pidUpdateRequired: true,
      datasheetUpdateRequired: true,
      equipmentRegistryUpdateRequired: true,
      equipmentJustification: 'Pump internals and performance envelope are modified.',
      chemistryAffected: false,
      chemicalsAffected: 'No new chemicals introduced.',
      sdsUpdateRequired: false,
      psiUpdateRequired: true,
      exposureLimitsAffected: false,
      environmentalImpactAffected: false,
      sopUpdateRequired: true,
      affectedSops: 'SOP-AL-201, SOP-AL-305',
      operatingProcedureUpdateRequired: true,
      emergencyProcedureUpdateRequired: false,
      operatingLimitsChanged: true,
      hazopDeviationReviewRequired: true,
      alarmInterlockSetpointsChanged: true,
      safeOperatingEnvelopeChanged: true,
      sisAffected: false,
      esdAffected: false,
      psvAffected: false,
      alarmSystemAffected: true,
      lopaReviewRequired: true,
      sisRevalidationRequired: false,
      trainingRequired: true,
      affectedRoles: 'Operations Supervisor, Board Operator, Field Operator, Maintenance Supervisor',
      trainingRequiredBeforeStartup: true,
      documentControlUpdateRequired: true,
      pidRevisionRequired: true,
      drawingUpdateRequired: true,
      designBasisUpdateRequired: true,
      vendorManualUpdateRequired: true
    },
    created_by: userId,
    updated_at: timestamp
  });

  await upsertMany('moc_engineering_documents', [
    { id: 'moc_2026_000045_doc_pid', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, document_type: 'P&ID redline / markup', title: 'P&ID PID-001 Redline for P-101A Upgrade', file_name: 'PID-001-P101A-redline.pdf', mime_type: 'application/pdf', size_bytes: 412000, storage_key: 'demo/moc/MOC-2026-000045/PID-001-redline.pdf', document_id: 'controlled_doc_pid_001_rev4', justification: 'Controlled P&ID requires revision after feed rate change.', uploaded_by: userId, created_by: userId, controlled_document_status: 'Draft Revision', version_label: 'redline-1' },
    { id: 'moc_2026_000045_doc_basis', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, document_type: 'Design basis document', title: 'P-101A Upgrade Design Basis', file_name: 'P-101A-design-basis.pdf', mime_type: 'application/pdf', size_bytes: 680000, storage_key: 'demo/moc/MOC-2026-000045/design-basis.pdf', uploaded_by: userId, created_by: userId, controlled_document_status: 'Under Review', version_label: 'v0.1' },
    { id: 'moc_2026_000045_doc_datasheet', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, document_type: 'Equipment datasheets', title: 'P-101A Revised Datasheet', file_name: 'P-101A-revised-datasheet.pdf', mime_type: 'application/pdf', size_bytes: 512000, storage_key: 'demo/moc/MOC-2026-000045/datasheet.pdf', uploaded_by: userId, created_by: userId, controlled_document_status: 'Linked', version_label: 'rev-draft' }
  ]);

  await upsertMany('moc_required_actions', [
    { id: 'moc_2026_000045_action_pid', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, action_type: 'P&ID', title: 'Update P&ID / engineering drawings', description: 'Revise PID-001 and associated control loop references.', priority: 'HIGH', required: true, system_generated: true, action_id: 'action_moc_2026_000045_pid', status: 'Created', owner_id: userId, due_date: '2026-07-08', evidence_status: 'Not Uploaded', verification_status: 'Not Verified', linked_module: 'Document Control', required_before_startup: true, required_before_closure: true, source_impact_answer: 'pidUpdateRequired', created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_action_training', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, action_type: 'Training', title: 'Complete training for affected operations roles', description: 'Train operators on new pump operating envelope and alarm response.', priority: 'HIGH', required: true, system_generated: true, status: 'Preview', owner_id: userId, due_date: '2026-07-15', evidence_status: 'Not Uploaded', verification_status: 'Not Verified', linked_module: 'Training', required_before_startup: true, required_before_closure: true, source_impact_answer: 'trainingRequired', created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_action_hazop', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, action_type: 'HAZOP', title: 'Complete HAZOP deviation review', description: 'Review high feed flow deviation and safeguards before implementation.', priority: 'HIGH', required: true, system_generated: true, status: 'Preview', owner_id: userId, due_date: '2026-07-10', evidence_status: 'Not Uploaded', verification_status: 'Not Verified', linked_module: 'HAZOP', required_before_startup: true, required_before_closure: true, source_impact_answer: 'hazopDeviationReviewRequired', created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_action_pssr', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, action_type: 'PSSR', title: 'PSSR required before startup', description: 'Trigger and complete PSSR after implementation and before startup authorization.', priority: 'SAFETY_CRITICAL', required: true, system_generated: true, status: 'Preview', owner_id: userId, due_date: '2026-07-19', evidence_status: 'Not Uploaded', verification_status: 'Not Verified', linked_module: 'PSSR', required_before_startup: true, required_before_closure: true, source_impact_answer: 'pssrRequired', created_by: userId, updated_at: timestamp }
  ]);

  await upsert('moc_pssr_requirements', {
    id: 'moc_2026_000045_pssr',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    moc_id: mocId,
    required: true,
    trigger_reason: 'High risk equipment and operating limit change requires startup readiness verification.',
    linked_pssr_id: null,
    status: 'Required',
    startup_blockers: ['PSSR not completed', 'Training action open', 'P&ID action open'],
    readiness_score: 35,
    created_by: userId,
    updated_at: timestamp
  });

  await upsertMany('moc_communication_records', [
    { id: 'moc_2026_000045_stakeholder_ops', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, record_type: 'Stakeholder', stakeholder_name: 'Operations Shift Team', stakeholder_role: 'Affected Operations', department_id: departmentId, message: 'Operations team included for feed rate upgrade review and startup readiness.', acknowledgement_required: true, acknowledged_at: null, created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_comm_hse', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, record_type: 'Communication', stakeholder_name: 'HSE Manager', stakeholder_role: 'Approver', department_id: departmentId, message: 'High-risk MOC submitted for HSE review.', acknowledgement_required: true, sent_at: '2026-06-21T08:45:00.000Z', acknowledged_at: '2026-06-21T09:10:00.000Z', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('moc_training_requirements', [
    { id: 'moc_2026_000045_training_operator', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, role_name: 'Board Operator', training_topic: 'Revised P-101A operating envelope and alarm response', required_before_startup: true, status: 'Open', linked_training_record_id: null, created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_training_field', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, role_name: 'Field Operator', training_topic: 'Field checks after P-101A upgrade startup', required_before_startup: true, status: 'Open', linked_training_record_id: null, created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('moc_attachments', [
    { id: 'moc_2026_000045_att_photo', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, attachment_type: 'Field photos', title: 'P-101A existing installation photo', file_name: 'P-101A-existing.jpg', mime_type: 'image/jpeg', size_bytes: 1850000, storage_key: 'demo/moc/MOC-2026-000045/P-101A-existing.jpg', uploaded_by: userId, created_by: userId, updated_at: timestamp },
    { id: 'moc_2026_000045_att_minutes', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, attachment_type: 'Meeting notes', title: 'MOC screening meeting notes', file_name: 'MOC-2026-000045-screening-notes.pdf', mime_type: 'application/pdf', size_bytes: 210000, storage_key: 'demo/moc/MOC-2026-000045/screening-notes.pdf', uploaded_by: userId, created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('moc_history_events', [
    { id: 'moc_2026_000045_hist_created', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, event_type: 'MOC_CREATED', title: 'MOC created', description: 'MOC request created from seed data.', actor_id: userId, before_value: null, after_value: { status: 'Draft' }, related_record_type: 'MOC', related_record_id: mocId, related_url: `/moc/${mocId}` },
    { id: 'moc_2026_000045_hist_submitted', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, event_type: 'MOC_SUBMITTED', title: 'MOC submitted', description: 'Submitted for high-risk review workflow.', actor_id: userId, before_value: { status: 'Draft' }, after_value: { status: 'Submitted' }, related_record_type: 'MOC', related_record_id: mocId, related_url: `/moc/${mocId}` },
    { id: 'moc_2026_000045_hist_risk', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, event_type: 'MOC_RISK_CHANGED', title: 'Risk ranking completed', description: 'Risk score set to 5 / High.', actor_id: userId, before_value: { score: 4, level: 'Medium' }, after_value: { score: 5, level: 'High' }, related_record_type: 'MOC', related_record_id: mocId, related_url: `/moc/${mocId}` },
    { id: 'moc_2026_000045_hist_doc', tenant_id: tenantId, company_id: companyId, site_id: siteId, moc_id: mocId, event_type: 'MOC_DOCUMENT_UPLOADED', title: 'Engineering document uploaded', description: 'P&ID redline and design basis added to engineering package.', actor_id: userId, before_value: null, after_value: { documents: 3 }, related_record_type: 'Document', related_record_id: 'moc_2026_000045_doc_pid', related_url: `/moc/${mocId}` }
  ]);

  const pssrId = 'pssr_2026_000021';
  await upsert('pssrs', {
    id: pssrId,
    pssr_number: 'PSSR-2026-000021',
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    department_id: departmentId,
    unit_id: unitId,
    area_id: areaId,
    title: 'PSSR for MOC-2026-000045 - P-101A Feed Pump Upgrade',
    description: 'Pre-startup safety review for upgraded feed pump P-101A, revised operating envelope, P&ID update, procedures, field verification, and startup authorization.',
    pssr_type: 'MOC Startup Review',
    startup_type: 'Startup after MOC',
    trigger_source: 'MOC',
    status: 'Field Verification',
    risk_level: 'High',
    target_startup_at: '2026-07-20T06:00:00.000Z',
    requested_startup_at: '2026-07-19T18:00:00.000Z',
    coordinator_id: userId,
    originator_id: userId,
    startup_scope: {
      startupScopeDescription: 'Authorize startup after P-101A hydraulic upgrade, DCS limit update, updated P&ID, affected SOP revisions, and operator briefing.',
      whatIsBeingStarted: 'P-101A upgraded feed pump and associated reactor feed control loop',
      whatChanged: 'Impeller and operating envelope updated; feed flow limits and alarm response revised.'
    },
    startup_boundaries: 'P-101A pump, suction/discharge valves, reactor feed line, local instruments, DCS feed flow controller, and affected SOPs.',
    startup_hazards: 'High feed flow excursion, seal leak during first run, incorrect valve lineup, and use of non-current operating procedure.',
    startup_prerequisites: 'MOC engineering package reviewed, field walkdown complete, P&ID controlled document linked, affected operators briefed, and startup signoffs complete.',
    temporary_controls: 'Startup to be supervised by Operations Supervisor with Maintenance standby for first two hours.',
    readiness_status: 'Blocked',
    readiness_percent: 68,
    checklist_completion_percent: 62,
    document_readiness_percent: 58,
    training_readiness_percent: 80,
    testing_readiness_percent: 70,
    punch_item_readiness_percent: 55,
    authorization_status: 'Not Authorized',
    created_by: userId,
    submitted_at: '2026-06-22T08:30:00.000Z',
    updated_at: timestamp
  });

  await upsert('pssr_linked_mocs', {
    id: 'pssr_2026_000021_moc_link',
    pssr_id: pssrId,
    moc_id: mocId,
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    relationship_type: 'Trigger Source',
    trigger_reason: 'High-risk equipment and operating limit change requires PSSR before startup.',
    updated_at: timestamp
  });

  await supabase
    .from('moc_pssr_requirements')
    .update({ linked_pssr_id: pssrId, status: 'In Progress', pssr_status: 'Field Verification', readiness_score: 68, updated_at: timestamp })
    .eq('id', 'moc_2026_000045_pssr');

  await upsert('pssr_affected_equipment', {
    id: 'pssr_2026_000021_eq_p101a',
    pssr_id: pssrId,
    equipment_id: equipmentId,
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    is_primary: true,
    equipment_tag_snapshot: 'P-101A',
    equipment_name_snapshot: 'Feed Pump A',
    equipment_type_snapshot: 'Pump - Centrifugal',
    equipment_criticality_snapshot: 'High',
    updated_at: timestamp
  });

  await upsertMany('pssr_checklist_items', [
    { id: 'pssr_chk_001', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Process Safety Information', item_title: 'P&ID update identified and linked', item_description: 'Confirm affected P&ID PID-001 is linked from Document Control or approved redline is available for startup exception.', required: true, required_before_startup: true, evidence_required: true, verification_required: true, owner_id: userId, due_date: '2026-07-16', status: 'Completed', evidence_status: 'Uploaded', verification_status: 'Verified', source: 'MOC Impact Assessment', source_record_id: 'moc_2026_000045_impact', related_moc_id: mocId, related_document_id: 'controlled_doc_pid_001_rev4', startup_blocking: true, created_by: userId, updated_at: timestamp },
    { id: 'pssr_chk_002', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Engineering / Construction Verification', item_title: 'P-101A upgraded impeller installation verified', item_description: 'Maintenance verifies upgraded impeller installation, rotation check, and coupling guard installation.', required: true, required_before_startup: true, evidence_required: true, verification_required: true, owner_id: userId, due_date: '2026-07-17', status: 'In Progress', evidence_status: 'Uploaded', verification_status: 'Pending', source: 'Affected Equipment', source_record_id: 'pssr_2026_000021_eq_p101a', related_equipment_id: equipmentId, startup_blocking: true, created_by: userId, updated_at: timestamp },
    { id: 'pssr_chk_003', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Procedures', item_title: 'SOP-AL-201 revised for new operating envelope', item_description: 'Operations procedure reflects new feed rate limit, alarm response, and startup monitoring steps.', required: true, required_before_startup: true, evidence_required: true, verification_required: true, owner_id: userId, due_date: '2026-07-18', status: 'In Progress', evidence_status: 'Missing', verification_status: 'Pending', source: 'MOC Required Action', source_record_id: 'moc_2026_000045_action_training', related_moc_id: mocId, startup_blocking: true, created_by: userId, updated_at: timestamp },
    { id: 'pssr_chk_004', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Training', item_title: 'Affected board and field operators briefed', item_description: 'Operators briefed on revised operating envelope and field checks after startup.', required: true, required_before_startup: true, evidence_required: true, verification_required: true, owner_id: userId, due_date: '2026-07-18', status: 'Completed', evidence_status: 'Uploaded', verification_status: 'Verified', source: 'MOC Training Requirement', source_record_id: 'moc_2026_000045_training_operator', related_moc_id: mocId, startup_blocking: true, created_by: userId, updated_at: timestamp },
    { id: 'pssr_chk_005', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Safety Systems', item_title: 'Feed flow high alarm response tested', item_description: 'Confirm DCS alarm response and operator acknowledgement path are validated.', required: true, required_before_startup: true, evidence_required: true, verification_required: true, owner_id: userId, due_date: '2026-07-19', status: 'Failed', evidence_status: 'Missing', verification_status: 'Rejected', source: 'Risk Ranking', source_record_id: 'moc_2026_000045_risk', related_moc_id: mocId, startup_blocking: true, created_by: userId, updated_at: timestamp },
    { id: 'pssr_chk_006', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, group_name: 'Startup Authorization', item_title: 'Startup authorization package prepared', item_description: 'Compile final readiness report, blockers, signatures, and startup release recommendation.', required: true, required_before_startup: true, evidence_required: false, verification_required: true, owner_id: userId, due_date: '2026-07-20', status: 'Not Started', evidence_status: 'Not Required', verification_status: 'Pending', source: 'Site Policy', source_record_id: null, startup_blocking: true, created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('pssr_checklist_item_evidence', [
    { id: 'pssr_evd_chk_001', pssr_id: pssrId, checklist_item_id: 'pssr_chk_001', tenant_id: tenantId, company_id: companyId, site_id: siteId, evidence_type: 'Document Control Link', file_name: 'PID-001 Rev4 controlled P&ID', file_key: 'demo/documents/PID-001-Rev4.pdf', file_url: 'demo/documents/PID-001-Rev4.pdf', mime_type: 'application/pdf', file_size: 245000, note: 'Controlled P&ID linked from Document Control.', uploaded_by: userId, accepted_by: userId, accepted_at: '2026-07-16T09:15:00.000Z', updated_at: timestamp },
    { id: 'pssr_evd_chk_002', pssr_id: pssrId, checklist_item_id: 'pssr_chk_002', tenant_id: tenantId, company_id: companyId, site_id: siteId, evidence_type: 'Photo', file_name: 'P-101A-upgraded-impeller-installation.jpg', file_key: 'demo/pssr/PSSR-2026-000021/P-101A-installation.jpg', file_url: 'demo/pssr/PSSR-2026-000021/P-101A-installation.jpg', mime_type: 'image/jpeg', file_size: 1520000, note: 'Maintenance photo after installation and guard reinstatement.', uploaded_by: userId, updated_at: timestamp },
    { id: 'pssr_evd_chk_004', pssr_id: pssrId, checklist_item_id: 'pssr_chk_004', tenant_id: tenantId, company_id: companyId, site_id: siteId, evidence_type: 'Training Record', file_name: 'P-101A-startup-briefing-attendance.pdf', file_key: 'demo/pssr/PSSR-2026-000021/training-attendance.pdf', file_url: 'demo/pssr/PSSR-2026-000021/training-attendance.pdf', mime_type: 'application/pdf', file_size: 188000, note: 'Affected board and field operators attended briefing.', uploaded_by: userId, accepted_by: userId, accepted_at: '2026-07-17T15:30:00.000Z', updated_at: timestamp }
  ]);

  await upsertMany('pssr_checklist_verifications', [
    { id: 'pssr_ver_chk_001', pssr_id: pssrId, checklist_item_id: 'pssr_chk_001', tenant_id: tenantId, company_id: companyId, site_id: siteId, status: 'Verified', verified_by: userId, verified_at: '2026-07-16T09:20:00.000Z', comment: 'Controlled P&ID available and linked.', updated_at: timestamp },
    { id: 'pssr_ver_chk_004', pssr_id: pssrId, checklist_item_id: 'pssr_chk_004', tenant_id: tenantId, company_id: companyId, site_id: siteId, status: 'Verified', verified_by: userId, verified_at: '2026-07-17T15:40:00.000Z', comment: 'Training evidence accepted.', updated_at: timestamp },
    { id: 'pssr_ver_chk_005', pssr_id: pssrId, checklist_item_id: 'pssr_chk_005', tenant_id: tenantId, company_id: companyId, site_id: siteId, status: 'Rejected', rejected_by: userId, rejected_at: '2026-07-18T10:00:00.000Z', rejection_reason: 'Alarm response test evidence missing.', comment: 'Retest required before startup authorization.', updated_at: timestamp }
  ]);

  await upsertMany('pssr_checklist_history', [
    { id: 'pssr_chk_hist_001', pssr_id: pssrId, checklist_item_id: 'pssr_chk_001', tenant_id: tenantId, company_id: companyId, site_id: siteId, event_type: 'CHECKLIST_VERIFIED', title: 'P&ID readiness verified', description: 'Controlled P&ID link verified for startup package.', before_value: null, after_value: { status: 'Verified' }, user_id: userId },
    { id: 'pssr_chk_hist_005', pssr_id: pssrId, checklist_item_id: 'pssr_chk_005', tenant_id: tenantId, company_id: companyId, site_id: siteId, event_type: 'CHECKLIST_VERIFICATION_REJECTED', title: 'Alarm response test rejected', description: 'Verification rejected because alarm response evidence is missing.', before_value: { verification_status: 'Pending' }, after_value: { verification_status: 'Rejected' }, user_id: userId }
  ]);

  await upsertMany('pssr_startup_blockers', [
    { id: 'pssr_blk_alarm_response', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, blocker_type: 'Checklist', blocker_title: 'Rejected verification', blocker_description: 'Feed flow high alarm response test evidence missing.', source_module: 'Checklist', source_record_id: 'pssr_chk_005', severity: 'High', blocking: true, status: 'Open', owner_id: userId, due_date: '2026-07-19', updated_at: timestamp },
    { id: 'pssr_blk_sop_missing', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, blocker_type: 'Document Readiness', blocker_title: 'Required document missing', blocker_description: 'Updated SOP-AL-201 must be approved or justified before startup.', source_module: 'Document Readiness', source_record_id: 'pssr_doc_ready_sop', severity: 'High', blocking: true, status: 'Open', owner_id: userId, due_date: '2026-07-18', updated_at: timestamp }
  ]);

  await upsert('pssr_field_verifications', {
    id: 'pssr_field_2026_000021',
    pssr_id: pssrId,
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    status: 'In Progress',
    completion_percent: 72,
    blockers_count: 1,
    updated_at: timestamp
  });

  await upsert('pssr_equipment_verifications', {
    id: 'pssr_eq_ver_p101a',
    pssr_id: pssrId,
    affected_equipment_id: 'pssr_2026_000021_eq_p101a',
    equipment_id: equipmentId,
    tenant_id: tenantId,
    company_id: companyId,
    site_id: siteId,
    equipment_tag_snapshot: 'P-101A',
    equipment_name_snapshot: 'Feed Pump A',
    equipment_type_snapshot: 'Pump - Centrifugal',
    equipment_criticality_snapshot: 'High',
    status: 'In Progress',
    installation_status: 'Matches Design',
    tag_verified: true,
    qr_verified: true,
    photo_required: true,
    evidence_status: 'Uploaded',
    verified_by: null,
    verified_at: null,
    failed_reason: null,
    updated_at: timestamp
  });

  await upsertMany('pssr_field_checklist_items', [
    { id: 'pssr_field_chk_location', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', tenant_id: tenantId, company_id: companyId, site_id: siteId, checklist_key: 'correct_location', title: 'Equipment installed at correct location', description: 'P-101A installation confirmed in Reactor Area feed pump bay.', status: 'Pass', required: true, startup_blocking: true, evidence_required: false, verification_required: true, comment: 'Location matches P&ID.', updated_at: timestamp },
    { id: 'pssr_field_chk_tag', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', tenant_id: tenantId, company_id: companyId, site_id: siteId, checklist_key: 'tag_matches_pid', title: 'Equipment tag matches P&ID', description: 'Physical tag and QR confirmed against equipment registry.', status: 'Pass', required: true, startup_blocking: true, evidence_required: true, verification_required: true, comment: 'QR scan matched P-101A.', updated_at: timestamp },
    { id: 'pssr_field_chk_guard', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', tenant_id: tenantId, company_id: companyId, site_id: siteId, checklist_key: 'guards_installed', title: 'Guards installed', description: 'Coupling guard installed and bolted after rotation check.', status: 'Pass', required: true, startup_blocking: true, evidence_required: true, verification_required: true, comment: 'Guard photo attached.', updated_at: timestamp },
    { id: 'pssr_field_chk_relief', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', tenant_id: tenantId, company_id: companyId, site_id: siteId, checklist_key: 'relief_path_clear', title: 'Relief path clear', description: 'Confirm no isolation or obstruction affecting relief path.', status: 'Needs Action', required: true, startup_blocking: true, evidence_required: true, verification_required: true, comment: 'Operations requested one more valve lineup confirmation.', updated_at: timestamp }
  ]);

  await upsertMany('pssr_field_evidence', [
    { id: 'pssr_field_evd_tag', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', field_checklist_item_id: 'pssr_field_chk_tag', tenant_id: tenantId, company_id: companyId, site_id: siteId, evidence_type: 'Photo', file_name: 'P-101A-tag-and-qr.jpg', file_key: 'demo/pssr/PSSR-2026-000021/P-101A-tag-qr.jpg', file_url: 'demo/pssr/PSSR-2026-000021/P-101A-tag-qr.jpg', caption: 'P-101A tag and QR match equipment registry.', gps_latitude: 27.004, gps_longitude: 49.658, uploaded_by: userId, updated_at: timestamp },
    { id: 'pssr_field_evd_guard', pssr_id: pssrId, equipment_verification_id: 'pssr_eq_ver_p101a', field_checklist_item_id: 'pssr_field_chk_guard', tenant_id: tenantId, company_id: companyId, site_id: siteId, evidence_type: 'Photo', file_name: 'P-101A-coupling-guard.jpg', file_key: 'demo/pssr/PSSR-2026-000021/P-101A-guard.jpg', file_url: 'demo/pssr/PSSR-2026-000021/P-101A-guard.jpg', caption: 'Coupling guard installed after maintenance work.', gps_latitude: 27.004, gps_longitude: 49.658, uploaded_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('pssr_field_signoffs', [
    { id: 'pssr_field_signoff_verifier', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, signoff_role: 'Field Verifier', required: true, status: 'Signed', signed_by: userId, signed_at: '2026-07-18T09:25:00.000Z', comment: 'Field walkdown substantially complete; relief path item remains open.', updated_at: timestamp },
    { id: 'pssr_field_signoff_operations', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, signoff_role: 'Operations Representative', required: true, status: 'Pending', signed_by: null, signed_at: null, comment: null, updated_at: timestamp },
    { id: 'pssr_field_signoff_engineering', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, signoff_role: 'Engineering Representative', required: true, status: 'Pending', signed_by: null, signed_at: null, comment: null, updated_at: timestamp },
    { id: 'pssr_field_signoff_hse', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, signoff_role: 'HSE Representative', required: true, status: 'Pending', signed_by: null, signed_at: null, comment: null, updated_at: timestamp }
  ]);

  await upsertMany('pssr_document_requirements', [
    { id: 'pssr_doc_req_pid', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, document_type: 'P&ID', document_title: 'Affected P&ID drawings', required: true, required_before_startup: true, source: 'MOC Engineering Package', source_record_id: 'moc_2026_000045_doc_pid', allow_justification: true, owner_id: userId, due_date: '2026-07-16', updated_at: timestamp },
    { id: 'pssr_doc_req_sop', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, document_type: 'SOP', document_title: 'Updated SOP / operating procedure', required: true, required_before_startup: true, source: 'MOC Impact Assessment', source_record_id: 'moc_2026_000045_impact', allow_justification: true, owner_id: userId, due_date: '2026-07-18', updated_at: timestamp },
    { id: 'pssr_doc_req_datasheet', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, document_type: 'Equipment datasheet', document_title: 'P-101A revised datasheet', required: true, required_before_startup: true, source: 'Affected Equipment', source_record_id: equipmentId, allow_justification: true, owner_id: userId, due_date: '2026-07-17', updated_at: timestamp },
    { id: 'pssr_doc_req_design_basis', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, document_type: 'Design basis', document_title: 'P-101A upgrade design basis', required: true, required_before_startup: true, source: 'Risk Ranking', source_record_id: 'moc_2026_000045_risk', allow_justification: true, owner_id: userId, due_date: '2026-07-18', updated_at: timestamp },
    { id: 'pssr_doc_req_startup', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, document_type: 'Startup procedure', document_title: 'Startup monitoring instruction', required: true, required_before_startup: true, source: 'Site Policy', source_record_id: null, allow_justification: true, owner_id: userId, due_date: '2026-07-19', updated_at: timestamp }
  ]);

  await upsertMany('pssr_document_readiness', [
    { id: 'pssr_doc_ready_pid', pssr_id: pssrId, requirement_id: 'pssr_doc_req_pid', tenant_id: tenantId, company_id: companyId, site_id: siteId, controlled_document_id: 'controlled_doc_pid_001_rev4', controlled_document_version_id: 'controlled_doc_pid_001_rev4_v1', document_number: 'PID-001', document_title: 'Affected P&ID drawings', current_version: 'Rev 4', required_version: 'Current approved', status: 'Current', readiness_status: 'Ready', startup_blocking: true, justification: null, updated_at: timestamp },
    { id: 'pssr_doc_ready_sop', pssr_id: pssrId, requirement_id: 'pssr_doc_req_sop', tenant_id: tenantId, company_id: companyId, site_id: siteId, controlled_document_id: null, controlled_document_version_id: null, document_number: 'SOP-AL-201', document_title: 'Updated SOP / operating procedure', current_version: 'Draft Rev 2', required_version: 'Current approved', status: 'Under Review', readiness_status: 'Blocked', startup_blocking: true, justification: null, updated_at: timestamp },
    { id: 'pssr_doc_ready_datasheet', pssr_id: pssrId, requirement_id: 'pssr_doc_req_datasheet', tenant_id: tenantId, company_id: companyId, site_id: siteId, controlled_document_id: null, controlled_document_version_id: null, document_number: 'DS-P-101A', document_title: 'P-101A revised datasheet', current_version: 'Draft', required_version: 'Current approved', status: 'Under Review', readiness_status: 'Pending Revision', startup_blocking: true, justification: null, updated_at: timestamp },
    { id: 'pssr_doc_ready_design_basis', pssr_id: pssrId, requirement_id: 'pssr_doc_req_design_basis', tenant_id: tenantId, company_id: companyId, site_id: siteId, controlled_document_id: null, controlled_document_version_id: null, document_number: 'DB-P-101A', document_title: 'P-101A upgrade design basis', current_version: 'v0.1', required_version: 'Current approved', status: 'Draft', readiness_status: 'Blocked', startup_blocking: true, justification: null, updated_at: timestamp },
    { id: 'pssr_doc_ready_startup', pssr_id: pssrId, requirement_id: 'pssr_doc_req_startup', tenant_id: tenantId, company_id: companyId, site_id: siteId, controlled_document_id: null, controlled_document_version_id: null, document_number: 'TOI-P-101A', document_title: 'Startup monitoring instruction', current_version: 'Temporary instruction', required_version: 'Approved temporary instruction', status: 'Justified Not Required', readiness_status: 'Ready', startup_blocking: false, justification: 'Temporary startup instruction approved for one startup window pending final SOP approval.', justified_by: userId, justified_at: '2026-07-18T12:00:00.000Z', updated_at: timestamp }
  ]);

  await upsertMany('pssr_document_verifications', [
    { id: 'pssr_doc_ver_pid', pssr_id: pssrId, document_readiness_id: 'pssr_doc_ready_pid', tenant_id: tenantId, company_id: companyId, site_id: siteId, status: 'Verified', verified_by: userId, verified_at: '2026-07-16T09:30:00.000Z', comment: 'P&ID current controlled version linked.', updated_at: timestamp },
    { id: 'pssr_doc_ver_sop', pssr_id: pssrId, document_readiness_id: 'pssr_doc_ready_sop', tenant_id: tenantId, company_id: companyId, site_id: siteId, status: 'Rejected', rejected_by: userId, rejected_at: '2026-07-18T10:15:00.000Z', rejection_reason: 'SOP is still under review.', comment: 'Startup blocked until SOP is approved or exception is authorized.', updated_at: timestamp }
  ]);

  await upsertMany('pssr_attachments', [
    { id: 'pssr_att_readiness', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, attachment_type: 'Readiness Report', file_name: 'PSSR-2026-000021-readiness-draft.pdf', file_key: 'demo/pssr/PSSR-2026-000021/readiness-draft.pdf', file_url: 'demo/pssr/PSSR-2026-000021/readiness-draft.pdf', mime_type: 'application/pdf', file_size: 420000, uploaded_by: userId, review_status: 'Draft', updated_at: timestamp },
    { id: 'pssr_att_walkdown', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, attachment_type: 'Field Walkdown', file_name: 'P-101A-field-walkdown-photos.zip', file_key: 'demo/pssr/PSSR-2026-000021/walkdown-photos.zip', file_url: 'demo/pssr/PSSR-2026-000021/walkdown-photos.zip', mime_type: 'application/zip', file_size: 2850000, uploaded_by: userId, review_status: 'Uploaded', updated_at: timestamp }
  ]);

  await upsertMany('pssr_readiness_checks', [
    { id: 'pssr_ready_check_001', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, readiness_status: 'Blocked', readiness_percent: 68, checklist_status: '62%', document_status: '58%', training_status: '80%', testing_status: '70%', punch_status: '55%', authorization_status: 'Not Authorized', blockers_count: 2, checked_by: userId, checked_at: '2026-07-18T12:30:00.000Z' }
  ]);

  await upsertMany('pssr_history_events', [
    { id: 'pssr_hist_created', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, event_category: 'CREATE', event_type: 'PSSR_CREATED', event_title: 'PSSR created from MOC', description: 'PSSR generated for MOC-2026-000045.', user_id: userId, before_value: null, after_value: { status: 'Created' }, is_safety_critical: true },
    { id: 'pssr_hist_checklist', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, event_category: 'CHECKLIST', event_type: 'CHECKLIST_GENERATED', event_title: 'Checklist generated', description: 'PSSR checklist generated from MOC impact, equipment, and site policy.', user_id: userId, before_value: null, after_value: { items: 6 }, is_safety_critical: true },
    { id: 'pssr_hist_field', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, event_category: 'FIELD', event_type: 'FIELD_VERIFICATION_STARTED', event_title: 'Field verification in progress', description: 'Field walkdown records generated for P-101A.', user_id: userId, before_value: null, after_value: { equipment: 1 }, is_safety_critical: true },
    { id: 'pssr_hist_blocked', pssr_id: pssrId, tenant_id: tenantId, company_id: companyId, site_id: siteId, event_category: 'READINESS', event_type: 'PSSR_READINESS_CHECK', event_title: 'Readiness check blocked startup', description: 'Startup remains blocked by alarm response evidence and SOP approval.', user_id: userId, before_value: null, after_value: { readiness: 68, blockers: 2 }, is_safety_critical: true }
  ]);

  await upsertMany('EquipmentLinkedRecord', [
    {
      id: 'linked_ptw_p_101a_0123',
      tenantId,
      equipmentId,
      moduleKey: 'PTW',
      recordType: 'Permit To Work',
      recordId: 'PTW-2025-0123',
      title: 'Hot Work Permit PTW-2025-0123',
      status: 'OPEN',
      priority: 'HIGH',
      url: '/ptw/PTW-2025-0123'
    },
    {
      id: 'linked_moc_p_101a_0045',
      tenantId,
      equipmentId,
      moduleKey: 'MOC',
      recordType: 'Management of Change',
      recordId: mocId,
      title: 'MOC-2026-000045 - P-101A feed rate upgrade',
      status: 'Under Review',
      priority: 'High',
      url: `/moc/${mocId}`
    }
  ]);

  await upsert('EquipmentTimelineEvent', {
    id: 'timeline_p_101a_moc_2026_000045',
    tenantId,
    equipmentId,
    eventType: 'MOC_SUBMITTED',
    title: 'MOC-2026-000045 submitted',
    description: 'P-101A feed rate upgrade MOC submitted for high-risk review.',
    actorName: 'Imran Shah',
    occurredAt: '2026-06-21T08:30:00.000Z',
    sourceType: 'MOC',
    sourceId: mocId
  });

  const permitTypeDefaults = {
    requires_gas_test: false,
    requires_isolation: false,
    requires_rescue_plan: false,
    requires_fire_watch: false,
    type_specific_fields: {},
    updated_at: timestamp
  };

  await upsertMany('permit_types', [
    { ...permitTypeDefaults, id: 'pt_hot_work', tenant_id: tenantId, code: 'HOT_WORK', name: 'Hot Work', color: '#ef4444', description: 'Welding, grinding, cutting, or ignition source work.', requires_gas_test: true, requires_fire_watch: true, default_duration_hours: 12 },
    { ...permitTypeDefaults, id: 'pt_cold_work', tenant_id: tenantId, code: 'COLD_WORK', name: 'Cold Work', color: '#06b6d4', description: 'Mechanical maintenance and non-intrusive work.', default_duration_hours: 12 },
    { ...permitTypeDefaults, id: 'pt_confined_space', tenant_id: tenantId, code: 'CONFINED_SPACE', name: 'Confined Space', color: '#10b981', description: 'Entry into confined spaces with rescue plan.', requires_gas_test: true, requires_rescue_plan: true, default_duration_hours: 8 },
    { ...permitTypeDefaults, id: 'pt_electrical_isolation', tenant_id: tenantId, code: 'ELECTRICAL_ISOLATION', name: 'Electrical Isolation / LOTO', color: '#f59e0b', description: 'Lockout/tagout and electrical isolation.', requires_isolation: true, default_duration_hours: 12 },
    { ...permitTypeDefaults, id: 'pt_excavation', tenant_id: tenantId, code: 'EXCAVATION', name: 'Excavation', color: '#f97316', description: 'Breaking ground and buried services controls.', default_duration_hours: 12 },
    { ...permitTypeDefaults, id: 'pt_radiography', tenant_id: tenantId, code: 'RADIOGRAPHY', name: 'Radiography', color: '#8b5cf6', description: 'Radiography exclusion zone permit.', default_duration_hours: 8 },
    { ...permitTypeDefaults, id: 'pt_working_at_height', tenant_id: tenantId, code: 'WORKING_AT_HEIGHT', name: 'Working at Height', color: '#3b82f6', description: 'Fall protection and rescue plan.', requires_rescue_plan: true, default_duration_hours: 12 },
    { ...permitTypeDefaults, id: 'pt_line_breaking', tenant_id: tenantId, code: 'LINE_BREAKING', name: 'Line Breaking / Equipment Opening', color: '#eab308', description: 'Line break, depressurisation, purge, and residual energy controls.', requires_gas_test: true, requires_isolation: true, default_duration_hours: 8 },
    { ...permitTypeDefaults, id: 'pt_simops', tenant_id: tenantId, code: 'SIMOPS', name: 'Simultaneous Operations / SIMOPS', color: '#64748b', description: 'SIMOPS review and conflict management.', default_duration_hours: 12 }
  ]);

  const permitDefaults = {
    required_controls: {},
    type_specific_data: {},
    extension_count: 0,
    updated_at: timestamp
  };
  const ptwStart = hoursFromNow(-1);
  const ptwIssued = hoursFromNow(-0.75);
  const ptwActivated = hoursFromNow(-0.5);
  const ptw1587End = hoursFromNow(1.6);
  const ptw1588End = hoursFromNow(2.8);
  const gasTestedAt = hoursFromNow(-0.25);
  const gasRetestDueAt = hoursFromNow(0.75);
  const handoverAcknowledgedAt = hoursFromNow(-0.1);

  await upsertMany('permits', [
    {
      ...permitDefaults,
      id: 'ptw_1587',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      unit_id: unitId,
      area_id: areaId,
      permit_number: 'PTW-1587',
      permit_type_id: 'pt_hot_work',
      permit_type: 'HOT_WORK',
      title: 'Welding on P-101A pump casing',
      work_description: 'Welding repair on pump casing discharge flange. Continue fire watch and monitor gas levels.',
      status: 'Active',
      risk_level: 'High',
      equipment_id: equipmentId,
      equipment_tag: 'P-101A',
      equipment_name: 'Feed Pump A',
      location: 'Reactor Area',
      job_area: 'Reactor Area',
      issuer_id: userId,
      holder_id: userId,
      area_authority_id: userId,
      contractor_company_id: 'contractor_abc_maintenance',
      planned_start_at: ptwStart,
      planned_end_at: ptw1587End,
      issued_at: ptwIssued,
      activated_at: ptwActivated,
      required_controls: { fireWatch: true, extinguishers: true, areaBarricaded: true, toolboxTalk: true },
      type_specific_data: { fireWatchAssigned: true, hotWorkShield: true },
      max_personnel: 8,
      created_by: userId
    },
    {
      ...permitDefaults,
      id: 'ptw_1588',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      unit_id: unitId,
      area_id: areaId,
      permit_number: 'PTW-1588',
      permit_type_id: 'pt_confined_space',
      permit_type: 'CONFINED_SPACE',
      title: 'Tank farm confined space inspection',
      work_description: 'Internal inspection of tank T-101 after cleaning and ventilation.',
      status: 'Active',
      risk_level: 'High',
      equipment_id: equipmentId,
      equipment_tag: 'T-101',
      equipment_name: 'Tank T-101',
      location: 'Tank Farm',
      job_area: 'Tank Farm',
      issuer_id: userId,
      holder_id: userId,
      area_authority_id: userId,
      planned_start_at: ptwStart,
      planned_end_at: ptw1588End,
      required_controls: { attendant: true, rescuePlan: true, gasTest: true },
      type_specific_data: { entrants: 2, rescueEquipment: true },
      created_by: userId
    }
  ]);

  await upsertMany('permit_equipment', [
    { id: 'ptw_1587_equipment', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', equipment_id: equipmentId, relation_type: 'Primary', risk_context: { criticality: 'HIGH', safetyCritical: true }, created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_isolations', [
    { id: 'iso_ptw_1587_xv101', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', energy_type: 'Mechanical', source_description: 'Suction valve XV-101', isolation_point: 'XV-101', valve_tag: 'XV-101', required_position: 'Closed', normal_position: 'Open', lock_number: 'L-101', lock_holder: 'Ali Raza', applied_by: userId, verified_by: userId, confirmed_by: userId, confirmed_at: ptwActivated, status: 'Confirmed', created_by: userId, updated_at: timestamp },
    { id: 'iso_ptw_1587_mcc12', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', energy_type: 'Electrical', source_description: 'Breaker MCC-12', isolation_point: 'MCC-12', required_position: 'Locked Out', lock_number: 'E-12', lock_holder: 'Maintenance', applied_by: userId, verified_by: userId, confirmed_by: userId, confirmed_at: ptwActivated, status: 'Confirmed', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_gas_tests', [
    { id: 'gas_ptw_1587_latest', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', test_type: 'Periodic Re-test', test_location: 'Reactor Area - P-201A feed pump', tested_at: gasTestedAt, tester_id: userId, tester_user_id: userId, tester_name: 'Ahmed Khan', instrument_id: 'GTR-1855', instrument_serial_number: 'MSA-ALTAIR-4XR-8842', calibration_date: dateFromNow(-14), calibration_due_date: dateFromNow(180), calibration_expiry_date: dateFromNow(180), ventilation_status: 'Natural Ventilation', weather_condition: 'Light wind from north', o2: 20.8, lel: 0, h2s: 0, co: 0, custom_gases: {}, permit_status_at_test: 'Active', result: 'Pass', result_status: 'Pass', next_test_due_at: gasRetestDueAt, next_retest_due_at: gasRetestDueAt, retest_status: 'Scheduled', validation_details: { failures: [], missing: [] }, notes: 'All readings normal.', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_gas_readings', [
    { id: 'gas_read_ptw_1587_o2', tenant_id: tenantId, gas_test_id: 'gas_ptw_1587_latest', permit_id: 'ptw_1587', company_id: companyId, site_id: siteId, gas_code: 'O2', gas_name: 'Oxygen', value: 20.8, unit: '%', min_limit: 19.5, max_limit: 23.5, pass_fail: 'Pass', threshold_source: 'ptw_thr_base_o2' },
    { id: 'gas_read_ptw_1587_lel', tenant_id: tenantId, gas_test_id: 'gas_ptw_1587_latest', permit_id: 'ptw_1587', company_id: companyId, site_id: siteId, gas_code: 'LEL', gas_name: 'Lower Explosive Limit', value: 0, unit: '%', min_limit: 0, max_limit: 0, pass_fail: 'Pass', threshold_source: 'ptw_thr_hot_lel_rich' },
    { id: 'gas_read_ptw_1587_h2s', tenant_id: tenantId, gas_test_id: 'gas_ptw_1587_latest', permit_id: 'ptw_1587', company_id: companyId, site_id: siteId, gas_code: 'H2S', gas_name: 'Hydrogen Sulfide', value: 0, unit: 'ppm', min_limit: null, max_limit: 1, pass_fail: 'Pass', threshold_source: 'ptw_thr_base_h2s' },
    { id: 'gas_read_ptw_1587_co', tenant_id: tenantId, gas_test_id: 'gas_ptw_1587_latest', permit_id: 'ptw_1587', company_id: companyId, site_id: siteId, gas_code: 'CO', gas_name: 'Carbon Monoxide', value: 0, unit: 'ppm', min_limit: null, max_limit: 25, pass_fail: 'Pass', threshold_source: 'ptw_thr_base_co' }
  ]);

  await upsertMany('permit_gas_test_history', [
    { id: 'gas_hist_ptw_1587_added', tenant_id: tenantId, permit_id: 'ptw_1587', gas_test_id: 'gas_ptw_1587_latest', company_id: companyId, site_id: siteId, event_type: 'GAS_TEST_ADDED', description: 'Periodic gas re-test recorded: Pass', user_id: userId, after_value: { o2: 20.8, lel: 0, h2s: 0, co: 0 } },
    { id: 'gas_hist_ptw_1587_validated', tenant_id: tenantId, permit_id: 'ptw_1587', gas_test_id: 'gas_ptw_1587_latest', company_id: companyId, site_id: siteId, event_type: 'GAS_TEST_VALIDATED', description: 'Gas thresholds validated by backend', user_id: userId, after_value: { result: 'Pass' } }
  ]);

  await upsertMany('permit_conflicts', [
    { id: 'conflict_ptw_1587_1588', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', conflicting_permit_id: 'ptw_1588', conflict_type: 'Area', severity: 'High', description: 'Hot work and confined space permits active in same process area.', status: 'Open', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_workforce', [
    { id: 'workforce_ptw_1587_ali', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', user_id: userId, worker_name: 'Ali Raza', worker_type: 'Contractor', company: 'ABC Maintenance', employer_company: 'ABC Maintenance', trade: 'Welder', role: 'Permit Holder', role_on_permit: 'Permit Holder', phone: '+966-555-0201', contact_number: '+966-555-0201', badge_id: 'B-1001', emergency_contact_name: 'Nadeem Raza', emergency_contact_phone: '+966-555-0301', is_permit_holder: true, is_performing_authority: true, is_area_authority: false, is_permit_issuer: false, is_fire_watch: false, is_attendant: false, is_entry_supervisor: false, is_gas_tester: false, is_isolation_authority: false, briefing_required: true, signed_briefing: true, briefing_completed: true, briefing_completed_at: ptwActivated, briefing_completed_by: userId, signed_in: true, signed_in_at: ptwActivated, signed_in_by: userId, signed_out: false, time_in: ptwActivated, signature: 'Ali Raza', status: 'Signed In', created_by: userId, updated_at: timestamp },
    { id: 'workforce_ptw_1587_safiullah', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', worker_name: 'Safiullah Khan', worker_type: 'Contractor', company: 'ABC Maintenance', employer_company: 'ABC Maintenance', trade: 'Welder Helper', role: 'Fire Watch', role_on_permit: 'Fire Watch', phone: '+966-555-0202', contact_number: '+966-555-0202', badge_id: 'B-1002', emergency_contact_name: 'Imran Khan', emergency_contact_phone: '+966-555-0302', is_permit_holder: false, is_performing_authority: false, is_area_authority: false, is_permit_issuer: false, is_fire_watch: true, is_attendant: false, is_entry_supervisor: false, is_gas_tester: false, is_isolation_authority: false, briefing_required: true, signed_briefing: true, briefing_completed: true, briefing_completed_at: ptwActivated, briefing_completed_by: userId, signed_in: true, signed_in_at: ptwActivated, signed_in_by: userId, signed_out: false, time_in: ptwActivated, signature: 'Safiullah Khan', status: 'Signed In', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_briefings', [
    { id: 'briefing_ptw_1587_toolbox', tenant_id: tenantId, permit_id: 'ptw_1587', company_id: companyId, site_id: siteId, briefing_title: 'PTW-1587 Toolbox Talk', briefing_topic: 'Hot work hazards, fire watch duties, gas re-test interval, emergency muster point', briefing_notes: 'All workers acknowledged hot work controls and emergency response expectations.', conducted_by: userId, conducted_at: ptwActivated, required_for_all_workers: true, completed_count: 2, missing_count: 0, status: 'Complete', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_workforce_history', [
    { id: 'wf_hist_ptw_1587_ali_in', tenant_id: tenantId, permit_id: 'ptw_1587', workforce_id: 'workforce_ptw_1587_ali', company_id: companyId, site_id: siteId, event_type: 'WORKFORCE_SIGNED_IN', description: 'Ali Raza signed in', user_id: userId, after_value: { worker: 'Ali Raza' } },
    { id: 'wf_hist_ptw_1587_toolbox', tenant_id: tenantId, permit_id: 'ptw_1587', workforce_id: null, company_id: companyId, site_id: siteId, event_type: 'WORKFORCE_BRIEFING_CREATED', description: 'Toolbox talk completed', user_id: userId, after_value: { completed: 2, missing: 0 } }
  ]);

  await upsert('permit_handover', { id: 'handover_ptw_1587_day_night', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', outgoing_shift: 'Day Shift 07:00 - 19:00', incoming_shift: 'Night Shift 19:00 - 07:00', outgoing_supervisor_id: userId, incoming_supervisor_id: userId, checklist: { workScopeReviewed: true, isolationsValid: true, gasTestValid: true, fireWatchAssigned: true, noNewHazards: true, emergencyContactsReviewed: true }, acknowledgement: 'Incoming supervisor acknowledges responsibility for permit and associated risks.', acknowledged_at: handoverAcknowledgedAt, created_by: userId, updated_at: timestamp });

  await upsertMany('permit_attachments', [
    { id: 'att_ptw_1587_iso', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', title: 'Isolation Certificate PTW-1587', file_name: 'Isolation Certificate PTW-1587.pdf', mime_type: 'application/pdf', size_bytes: 245000, storage_key: 'demo/ptw/PTW-1587/isolation.pdf', uploaded_by: userId, created_by: userId, updated_at: timestamp },
    { id: 'att_ptw_1587_risk', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', title: 'Risk Assessment PTW-1587', file_name: 'Risk Assessment PTW-1587.pdf', mime_type: 'application/pdf', size_bytes: 320000, storage_key: 'demo/ptw/PTW-1587/risk.pdf', uploaded_by: userId, created_by: userId, updated_at: timestamp }
  ]);

  await upsert('permit_closure_checklists', { id: 'closure_ptw_1587', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', items: { workCompleted: false, toolsRemoved: false, housekeepingCompleted: false, personnelAccounted: false, equipmentSafe: false, areaInspected: false }, created_by: userId, updated_at: timestamp });

  await upsertMany('permit_history', [
    { id: 'hist_ptw_1587_issued', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', event_type: 'PERMIT_ISSUED', title: 'Permit issued', actor_id: userId, created_by: userId, updated_at: timestamp },
    { id: 'hist_ptw_1587_gas', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', event_type: 'GAS_TEST_PASSED', title: 'Gas test completed', actor_id: userId, after_data: { o2: 20.8, lel: 0, h2s: 0, co: 0 }, created_by: userId, updated_at: timestamp },
    { id: 'hist_ptw_1587_handover', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', event_type: 'HANDOVER_ACKNOWLEDGED', title: 'Shift handover acknowledged', actor_id: userId, created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('permit_map_locations', [
    { id: 'map_ptw_1587', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1587', unit_id: unitId, area_id: areaId, label: 'PTW-1587 Hot Work', x: 34, y: 42, radius_m: 25, status: 'Active', created_by: userId, updated_at: timestamp },
    { id: 'map_ptw_1588', tenant_id: tenantId, company_id: companyId, site_id: siteId, permit_id: 'ptw_1588', unit_id: unitId, area_id: areaId, label: 'PTW-1588 Confined Space', x: 38, y: 45, radius_m: 18, status: 'Active', created_by: userId, updated_at: timestamp }
  ]);

  await upsertMany('Action', [
    {
      id: 'action_p_101a_seal_followup',
      tenantId,
      moduleKey: 'equipment',
      sourceType: 'Equipment',
      sourceId: equipmentId,
      title: 'Verify P-101A seal replacement performance',
      description: 'Confirm seal performance after MOC-2025-0045 and attach field evidence.',
      priority: 'HIGH',
      status: 'OPEN',
      assignedToId: userId,
      createdById: userId,
      dueDate: '2026-07-15T00:00:00.000Z',
      evidenceRequired: true,
      verificationRequired: true,
      closedAt: null,
      updatedAt: timestamp
    },
    {
      id: 'action_moc_2026_000045_pid',
      tenantId,
      actionNumber: 'ACT-2026-000045',
      moduleKey: 'MOC',
      sourceType: 'MOC',
      sourceId: mocId,
      title: 'Update P&ID / engineering drawings',
      description: 'Revise PID-001 and associated control loop references for the P-101A feed rate upgrade.',
      priority: 'HIGH',
      status: 'OPEN',
      assignedToId: userId,
      createdById: userId,
      equipmentId,
      siteId,
      departmentId,
      assignedDate: '2026-06-21T08:45:00.000Z',
      dueDate: '2026-07-08T00:00:00.000Z',
      evidenceRequired: true,
      verificationRequired: true,
      closedAt: null,
      updatedAt: timestamp
    }
  ]);

  await upsertMany('EquipmentNote', [
    {
      id: 'note_p_101a_1',
      tenantId,
      equipmentId,
      authorId: userId,
      body: 'Seal replaced during MOC-2025-0045. Performance test completed successfully.',
      updatedAt: timestamp
    },
    {
      id: 'note_p_101a_2',
      tenantId,
      equipmentId,
      authorId: userId,
      body: 'Vibration analysis normal. No abnormal noise observed.',
      updatedAt: timestamp
    }
  ]);

  await upsertMany('workflow_templates', [
    {
      id: 'wf_tpl_moc_standard',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      module: 'MOC',
      name: 'MOC Standard Approval',
      description: 'Originator to process engineering, operations, HSE, and plant manager with conditional high risk routing.',
      status: 'ACTIVE',
      is_default: true,
      created_by: userId
    },
    {
      id: 'wf_tpl_ptw_standard',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      module: 'PTW',
      name: 'PTW Standard Permit Approval',
      description: 'Requester, permit issuer, and area authority approval chain.',
      status: 'ACTIVE',
      is_default: true,
      created_by: userId
    },
    {
      id: 'wf_tpl_pssr_standard',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      module: 'PSSR',
      name: 'PSSR Startup Authorization',
      description: 'Engineering, operations, maintenance, HSE, and plant manager startup authorization.',
      status: 'ACTIVE',
      is_default: true,
      created_by: userId
    },
    {
      id: 'wf_tpl_document_approval',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      module: 'DOCUMENTS',
      name: 'Document Approval',
      description: 'Author, reviewer, and approver document control workflow.',
      status: 'ACTIVE',
      is_default: true,
      created_by: userId
    }
  ]);

  await supabase
    .from('workflow_template_steps')
    .delete()
    .in('template_id', ['wf_tpl_moc_standard', 'wf_tpl_ptw_standard', 'wf_tpl_pssr_standard', 'wf_tpl_document_approval']);

  await upsertMany('workflow_template_steps', [
    { id: 'wf_step_moc_1', template_id: 'wf_tpl_moc_standard', step_name: 'Process Engineer Review', step_type: 'Review', sequence: 1, assigned_role_id: 'role_process_engineer', approval_mode: 'Single', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_moc_2', template_id: 'wf_tpl_moc_standard', step_name: 'Operations Review', step_type: 'Approval', sequence: 2, assigned_role_id: 'role_operations_supervisor', approval_mode: 'Single', parallel_group: 'moc_parallel_review', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_moc_3', template_id: 'wf_tpl_moc_standard', step_name: 'HSE Manager Review', step_type: 'Approval', sequence: 2, assigned_role_id: roleId, approval_mode: 'Single', parallel_group: 'moc_parallel_review', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_moc_4', template_id: 'wf_tpl_moc_standard', step_name: 'Plant Manager Final Approval', step_type: 'Signoff', sequence: 3, assigned_role_id: 'role_plant_manager', approval_mode: 'Single', condition_rule: { field: 'riskLevel', operator: 'in', value: ['High', 'Critical'] }, sla_hours: 24, is_required: true, can_reject: true, can_override: true },
    { id: 'wf_step_ptw_1', template_id: 'wf_tpl_ptw_standard', step_name: 'Permit Issuer Review', step_type: 'Approval', sequence: 1, assigned_role_id: 'role_permit_issuer', approval_mode: 'Single', sla_hours: 4, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_ptw_2', template_id: 'wf_tpl_ptw_standard', step_name: 'Area Authority Approval', step_type: 'Approval', sequence: 2, assigned_role_id: 'role_operations_supervisor', approval_mode: 'Single', sla_hours: 4, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_ptw_3', template_id: 'wf_tpl_ptw_standard', step_name: 'Gas Tester Approval', step_type: 'Review', sequence: 3, assigned_role_id: roleId, approval_mode: 'Single', condition_rule: { field: 'permitType', operator: 'eq', value: 'Confined Space' }, sla_hours: 2, is_required: false, can_reject: true, can_override: false },
    { id: 'wf_step_pssr_1', template_id: 'wf_tpl_pssr_standard', step_name: 'Engineering Signoff', step_type: 'Signoff', sequence: 1, assigned_role_id: 'role_process_engineer', approval_mode: 'Single', parallel_group: 'pssr_parallel_signoff', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_pssr_2', template_id: 'wf_tpl_pssr_standard', step_name: 'Operations Signoff', step_type: 'Signoff', sequence: 1, assigned_role_id: 'role_operations_supervisor', approval_mode: 'Single', parallel_group: 'pssr_parallel_signoff', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_pssr_3', template_id: 'wf_tpl_pssr_standard', step_name: 'HSE Signoff', step_type: 'Signoff', sequence: 2, assigned_role_id: roleId, approval_mode: 'Single', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_pssr_4', template_id: 'wf_tpl_pssr_standard', step_name: 'Plant Manager Authorization', step_type: 'Signoff', sequence: 3, assigned_role_id: 'role_plant_manager', approval_mode: 'Single', sla_hours: 24, is_required: true, can_reject: true, can_override: true },
    { id: 'wf_step_doc_1', template_id: 'wf_tpl_document_approval', step_name: 'Reviewer Check', step_type: 'Review', sequence: 1, assigned_role_id: 'role_process_engineer', approval_mode: 'Single', sla_hours: 24, is_required: true, can_reject: true, can_override: false },
    { id: 'wf_step_doc_2', template_id: 'wf_tpl_document_approval', step_name: 'Approver Signoff', step_type: 'Approval', sequence: 2, assigned_role_id: roleId, approval_mode: 'Single', sla_hours: 24, is_required: true, can_reject: true, can_override: false }
  ]);

  await upsertMany('notification_templates', [
    { id: 'ntpl_action_assigned', tenant_id: tenantId, event_type: 'action.assigned', module: 'actions', title_template: 'Action assigned', message_template: '{{actionNumber}} assigned: {{title}}', email_subject: 'Action assigned', email_body: '{{message}}', sms_body: '{{title}}' },
    { id: 'ntpl_action_overdue', tenant_id: tenantId, event_type: 'action.overdue', module: 'actions', title_template: 'Action overdue', message_template: '{{actionNumber}} is overdue', email_subject: 'Action overdue', email_body: '{{message}}', sms_body: '{{title}}' },
    { id: 'ntpl_equipment_qr_generated', tenant_id: tenantId, event_type: 'equipment.qr.generated', module: 'equipment', title_template: 'Equipment QR generated', message_template: 'QR generated for {{tag}}', email_subject: 'Equipment QR generated', email_body: '{{message}}', sms_body: '{{title}}' }
  ]);

  await upsertMany('notifications', [
    {
      id: 'notif_demo_action_overdue',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      user_id: userId,
      title: 'Action overdue',
      message: 'ACT-2026-000001 requires attention before escalation.',
      type: 'action.overdue',
      module: 'actions',
      related_record_id: 'action_p_101a_seal_followup',
      related_record_type: 'Action',
      related_url: '/actions/action_p_101a_seal_followup',
      priority: 'High',
      status: 'Unread'
    },
    {
      id: 'notif_demo_equipment_qr',
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      user_id: userId,
      title: 'QR generated',
      message: 'QR label generated for P-101A.',
      type: 'equipment.qr.generated',
      module: 'equipment',
      related_record_id: equipmentId,
      related_record_type: 'Equipment',
      related_url: `/equipment/${equipmentId}`,
      priority: 'Normal',
      status: 'Unread'
    }
  ]);

  console.log('Supabase seed completed');
  console.log(`Demo login: imran.shah@psmos.local / ChangeMe123!`);
  console.log(`Demo equipment id: ${equipmentId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
