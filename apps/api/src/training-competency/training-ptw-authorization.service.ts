import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Decision = 'approve' | 'reject' | 'revoke';

const ptwRoles = [
  'Permit Applicant',
  'Permit Receiver',
  'Performing Authority',
  'Permit Issuer',
  'Area Authority',
  'Gas Tester',
  'Isolating Authority',
  'Electrical Isolator',
  'Mechanical Isolator',
  'Confined Space Attendant',
  'Fire Watch',
  'Standby Person',
  'Lifting Supervisor',
  'Excavation Competent Person',
  'Contractor Supervisor',
  'Closure Authority',
  'Shift Handover Receiver',
  'Other'
];

const permitTypes = ['Cold Work', 'Hot Work', 'Confined Space Entry', 'Electrical Work', 'Excavation', 'Line Break', 'Lifting', 'Work at Height', 'Radiography', 'Vehicle Entry', 'SIMOPS', 'General Permit', 'Other'];
const authorizationTypes = ['Role Authorization', 'Permit Type Authorization', 'Site Authorization', 'Unit Authorization', 'Equipment-Specific Authorization', 'Gas Tester Authorization', 'Isolation Authorization', 'Issuing Authority Authorization', 'Performing Authority Authorization', 'Contractor PTW Authorization', 'Temporary Authorization', 'Emergency Authorization'];
const authorizationStatuses = ['Not Evaluated', 'Authorized', 'Partially Authorized', 'Not Authorized', 'Pending Approval', 'Expired', 'Expiring Soon', 'Suspended', 'Revoked', 'Rejected', 'Reauthorization Required', 'Waived / Temporary Authorization'];
const requestStatuses = ['Draft', 'Submitted', 'Under Review', 'Pending Evidence', 'Pending Approval', 'Approved', 'Rejected', 'Returned', 'Converted To Authorization', 'Cancelled'];
const gapTypes = ['Missing PTW Training', 'Training Incomplete', 'Certificate Expired', 'Assessment Failed', 'SOP Acknowledgement Missing', 'Competency Gap', 'Pending Approval', 'Authorization Expired', 'Authorization Suspended', 'Authorization Revoked', 'MOC Reauthorization Required', 'PSSR Reauthorization Required', 'Incident/Audit Reauthorization Required', 'Manual Review Required'];
const gapStatuses = ['Open', 'In Progress', 'Waiting Evidence', 'Waiting Verification', 'Waived', 'Resolved', 'Verified Closed', 'Reopened'];
const waiverStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed'];
const ptwActions = ['Permit Creation', 'Permit Submission', 'Permit Issue', 'Permit Approval', 'Gas Test', 'Isolation Signoff', 'Workforce Assignment', 'Confined Space Role Assignment', 'Hot Work Fire Watch Assignment', 'Shift Handover', 'Permit Closure', 'Signature'];

@Injectable()
export class TrainingPtwAuthorizationService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, rules, authorizations, requests, gaps, waivers, checks] = await Promise.all([
      this.dashboardSummary(user, query),
      this.rules(user, { ...query, limit: 8 }),
      this.authorizations(user, { ...query, limit: 8 }),
      this.requests(user, { ...query, limit: 8 }),
      this.gaps(user, { ...query, limit: 8 }),
      this.waivers(user, { ...query, limit: 8 }),
      this.checkLogs(user, { ...query, limit: 8 })
    ]);
    const authRows = await this.authRows(user, query);
    return {
      header: {
        title: 'PTW Role Authorization',
        subtitle: 'Operational PTW role eligibility based on training, certificates, assessments, SOP acknowledgements, competency and approvals.',
        activeSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      bySite: this.aggregate(authRows, 'site_id'),
      byUnit: this.aggregate(authRows, 'unit_id'),
      byRole: this.aggregate(authRows, 'ptw_role'),
      byPermitType: this.aggregateByPermitType(authRows),
      byWorkerType: await this.workerTypeAggregation(user, authRows),
      expiringPreview: (await this.expiring(user, { ...query, limit: 8 })).rows,
      expiredPreview: (await this.expired(user, { ...query, limit: 8 })).rows,
      pendingApprovalPreview: (await this.pendingApproval(user, { ...query, limit: 8 })).rows,
      suspendedRevokedPreview: authRows.filter((row) => ['Suspended', 'Revoked'].includes(row.authorization_status)).slice(0, 8),
      safetyCriticalGaps: gaps.rows.filter((gap) => ['Critical', 'High'].includes(gap.gap_severity)),
      recentAuthorizationChanges: (await this.history(user, { ...query, limit: 8 })).rows,
      recentAuthorizationDenials: checks.rows.filter((row) => row.blocked),
      rulesPreview: rules.rows,
      authorizationsPreview: authorizations.rows,
      requestsPreview: requests.rows,
      gapsPreview: gaps.rows,
      waiversPreview: waivers.rows
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [rules, auths, requests, gaps, waivers, checks] = await Promise.all([
      this.ruleRows(user, query),
      this.authRows(user, query),
      this.requestRows(user, query),
      this.gapRows(user, query),
      this.waiverRows(user, query),
      this.checkRows(user, query)
    ]);
    const roleCount = (role: string) => auths.filter((row) => row.ptw_role === role && row.authorization_status === 'Authorized').length;
    return {
      totalAuthorizationRules: rules.length,
      activeAuthorizationRules: rules.filter((row) => row.rule_status === 'Active').length,
      authorizedWorkers: new Set(auths.filter((row) => row.authorization_status === 'Authorized').map((row) => row.worker_id)).size,
      partiallyAuthorizedWorkers: new Set(auths.filter((row) => row.authorization_status === 'Partially Authorized').map((row) => row.worker_id)).size,
      notAuthorizedWorkers: new Set([...auths.filter((row) => ['Not Authorized', 'Expired', 'Suspended', 'Revoked'].includes(row.authorization_status)).map((row) => row.worker_id), ...gaps.map((row) => row.worker_id)]).size,
      pendingAuthorizationRequests: requests.filter((row) => ['Draft', 'Submitted', 'Under Review', 'Pending Evidence'].includes(row.request_status)).length,
      pendingApproval: auths.filter((row) => row.approval_status === 'Pending Approval' || row.authorization_status === 'Pending Approval').length,
      expiringAuthorizations: auths.filter((row) => this.daysToExpiry(row) !== null && Number(this.daysToExpiry(row)) >= 0 && Number(this.daysToExpiry(row)) <= 30).length,
      expiredAuthorizations: auths.filter((row) => row.authorization_status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < new Date())).length,
      suspendedAuthorizations: auths.filter((row) => row.authorization_status === 'Suspended').length,
      revokedAuthorizations: auths.filter((row) => row.authorization_status === 'Revoked').length,
      gasTestersAuthorized: roleCount('Gas Tester'),
      isolatingAuthoritiesAuthorized: roleCount('Isolating Authority') + roleCount('Electrical Isolator') + roleCount('Mechanical Isolator'),
      permitIssuersAuthorized: roleCount('Permit Issuer'),
      performingAuthoritiesAuthorized: roleCount('Performing Authority'),
      areaAuthoritiesAuthorized: roleCount('Area Authority'),
      fireWatchAuthorized: roleCount('Fire Watch'),
      confinedSpaceAttendantsAuthorized: roleCount('Confined Space Attendant'),
      ptwTrainingGaps: gaps.filter((row) => ['Missing PTW Training', 'Training Incomplete'].includes(row.gap_type)).length,
      ptwCertificateGaps: gaps.filter((row) => row.gap_type === 'Certificate Expired').length,
      ptwAssessmentGaps: gaps.filter((row) => row.gap_type === 'Assessment Failed').length,
      ptwSopAcknowledgementGaps: gaps.filter((row) => row.gap_type === 'SOP Acknowledgement Missing').length,
      ptwCompetencyGaps: gaps.filter((row) => row.gap_type === 'Competency Gap').length,
      mocPssrDrivenReauthorizationRequired: auths.filter((row) => row.reauthorization_required || ['MOC Reauthorization Required', 'PSSR Reauthorization Required'].includes(row.reauthorization_reason)).length,
      authorizationWaiversActive: waivers.filter((row) => row.waiver_status === 'Approved' && (!row.expiry_date || new Date(row.expiry_date) > new Date())).length,
      ptwActionsBlockedByAuthorization: checks.filter((row) => row.blocked).length,
      recentAuthorizationChanges: (await this.history(user, { ...query, limit: 100 })).rows.length
    };
  }

  dashboardBySite(user: RequestUser, query: Row = {}) { return this.authRows(user, query).then((rows) => this.aggregate(rows, 'site_id')); }
  dashboardByUnit(user: RequestUser, query: Row = {}) { return this.authRows(user, query).then((rows) => this.aggregate(rows, 'unit_id')); }
  dashboardByRole(user: RequestUser, query: Row = {}) { return this.authRows(user, query).then((rows) => this.aggregate(rows, 'ptw_role')); }
  dashboardExpiringPreview(user: RequestUser, query: Row = {}) { return this.expiring(user, { ...query, limit: query.limit ?? 8 }); }
  dashboardGapsPreview(user: RequestUser, query: Row = {}) { return this.gaps(user, { ...query, limit: query.limit ?? 8 }); }

  async rules(user: RequestUser, query: Row = {}) {
    const rows = this.filterRules(await this.ruleRows(user, query), query);
    return { ...this.paginate(rows, query), summary: { total: rows.length, active: rows.filter((row) => row.rule_status === 'Active').length, draft: rows.filter((row) => row.rule_status === 'Draft').length, safetyCritical: rows.filter((row) => row.safety_critical).length } };
  }

  async createRule(user: RequestUser, dto: Row) {
    this.requireText(dto.ruleTitle ?? dto.rule_title, 'Rule title is required.');
    this.requireText(dto.ptwRole ?? dto.ptw_role, 'PTW role is required.');
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const id = randomUUID();
    const now = new Date().toISOString();
    const rule = this.compact({
      id,
      company_id: user.tenantId,
      site_id: siteId,
      rule_code: dto.ruleCode ?? dto.rule_code ?? `PTW-AUTH-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
      rule_title: dto.ruleTitle ?? dto.rule_title,
      description: dto.description,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      ptw_role: dto.ptwRole ?? dto.ptw_role,
      permit_types_json: this.arrayValue(dto.permitTypes ?? dto.permit_types_json),
      authorization_type: dto.authorizationType ?? dto.authorization_type ?? 'Role Authorization',
      safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical),
      psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical),
      simops_critical: Boolean(dto.simopsCritical ?? dto.simops_critical),
      gas_testing_required: Boolean(dto.gasTestingRequired ?? dto.gas_testing_required),
      isolation_authority_required: Boolean(dto.isolationAuthorityRequired ?? dto.isolation_authority_required),
      confined_space_role: Boolean(dto.confinedSpaceRole ?? dto.confined_space_role),
      hot_work_role: Boolean(dto.hotWorkRole ?? dto.hot_work_role),
      electrical_role: Boolean(dto.electricalRole ?? dto.electrical_role),
      contractor_role_allowed: Boolean(dto.contractorRoleAllowed ?? dto.contractor_role_allowed),
      minimum_experience_requirement_json: dto.minimumExperienceRequirement ?? dto.minimum_experience_requirement_json,
      rule_status: dto.ruleStatus ?? dto.rule_status ?? 'Draft',
      review_status: dto.reviewStatus ?? dto.review_status ?? 'Not Reviewed',
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now
    });
    const inserted = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').insert(rule).select('*').single());
    await this.upsertRuleChildren(user, inserted, dto);
    await this.writeHistory(user, 'Created', `PTW authorization rule created: ${inserted.rule_title}`, null, inserted, { rule_id: inserted.id, site_id: inserted.site_id });
    return this.ruleDetail(user, inserted.id);
  }

  async ruleDetail(user: RequestUser, ruleId: string) {
    const rule = await this.assertRule(user, ruleId);
    const [scopes, evidenceRules, approvalRules, expiryRules, enforcementRules, authorizations, requests, gaps, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_ptw_authorization_rule_scopes').select('*').eq('company_id', user.tenantId).eq('rule_id', ruleId)),
      this.safeMany<Row>(this.db.from('training_ptw_authorization_evidence_rules').select('*').eq('company_id', user.tenantId).eq('rule_id', ruleId)),
      this.safeMany<Row>(this.db.from('training_ptw_authorization_approval_rules').select('*').eq('company_id', user.tenantId).eq('rule_id', ruleId)),
      this.safeMany<Row>(this.db.from('training_ptw_authorization_expiry_rules').select('*').eq('company_id', user.tenantId).eq('rule_id', ruleId)),
      this.safeMany<Row>(this.db.from('training_ptw_authorization_enforcement_rules').select('*').eq('company_id', user.tenantId).eq('rule_id', ruleId)),
      this.authRows(user, { ruleId, limit: 12 }),
      this.requestRows(user, { ruleId, limit: 12 }),
      this.gapRows(user, { ruleId, limit: 12 }),
      this.history(user, { ruleId, limit: 12 })
    ]);
    return { rule, scopes, evidenceRules, approvalRules, expiryRules, enforcementRules, authorizations, requests, gaps, history: history.rows };
  }

  async updateRule(user: RequestUser, ruleId: string, dto: Row) {
    const before = await this.assertRule(user, ruleId);
    if (before.rule_status === 'Active' && dto.ptwRole && dto.ptwRole !== before.ptw_role) throw new BadRequestException('Active rule PTW role cannot be changed without archive/reactivate workflow.');
    const patch = this.compact({
      rule_title: dto.ruleTitle ?? dto.rule_title,
      description: dto.description,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      ptw_role: dto.ptwRole ?? dto.ptw_role,
      permit_types_json: dto.permitTypes ?? dto.permit_types_json,
      authorization_type: dto.authorizationType ?? dto.authorization_type,
      safety_critical: dto.safetyCritical ?? dto.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical,
      simops_critical: dto.simopsCritical ?? dto.simops_critical,
      gas_testing_required: dto.gasTestingRequired ?? dto.gas_testing_required,
      isolation_authority_required: dto.isolationAuthorityRequired ?? dto.isolation_authority_required,
      confined_space_role: dto.confinedSpaceRole ?? dto.confined_space_role,
      hot_work_role: dto.hotWorkRole ?? dto.hot_work_role,
      electrical_role: dto.electricalRole ?? dto.electrical_role,
      contractor_role_allowed: dto.contractorRoleAllowed ?? dto.contractor_role_allowed,
      rule_status: dto.ruleStatus ?? dto.rule_status,
      review_status: dto.reviewStatus ?? dto.review_status,
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').update(patch).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.upsertRuleChildren(user, after, dto);
    await this.writeHistory(user, 'Updated', `PTW authorization rule updated: ${after.rule_title}`, before, after, { rule_id: ruleId, site_id: after.site_id });
    return this.ruleDetail(user, ruleId);
  }

  async archiveRule(user: RequestUser, ruleId: string, dto: Row = {}) {
    const before = await this.assertRule(user, ruleId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').update({ rule_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? dto.archiveReason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, 'Archived', `PTW authorization rule archived: ${after.rule_title}`, before, after, { rule_id: ruleId, site_id: after.site_id });
    return after;
  }

  async reactivateRule(user: RequestUser, ruleId: string) {
    const before = await this.assertRule(user, ruleId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').update({ rule_status: 'Draft', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, 'Reactivated', `PTW authorization rule reactivated: ${after.rule_title}`, before, after, { rule_id: ruleId, site_id: after.site_id });
    return after;
  }

  async activateRule(user: RequestUser, ruleId: string) {
    const before = await this.assertRule(user, ruleId);
    if (!before.ptw_role) throw new BadRequestException('PTW role is required before activation.');
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').update({ rule_status: 'Active', review_status: before.safety_critical ? 'Pending Review' : 'Approved', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, 'Activated', `PTW authorization rule activated: ${after.rule_title}`, before, after, { rule_id: ruleId, site_id: after.site_id });
    return after;
  }

  async previewEligibleWorkers(user: RequestUser, ruleId: string, query: Row = {}) {
    const rule = await this.assertRule(user, ruleId);
    const workers = await this.workerRows(user, { ...query, siteId: rule.site_id ?? query.siteId });
    return { rows: this.eligibleWorkersForRule(workers, rule), total: workers.length, eligible: this.eligibleWorkersForRule(workers, rule).length, rule };
  }

  async evaluateRuleWorkers(user: RequestUser, ruleId: string, dto: Row = {}) {
    const preview = await this.previewEligibleWorkers(user, ruleId, dto);
    const rows = [];
    for (const worker of preview.rows) {
      rows.push(await this.createOrUpdateAuthorizationFromRule(user, preview.rule, worker, { source: 'Rule Evaluation' }));
    }
    return { rows, total: rows.length, rule: preview.rule };
  }

  async generateRequests(user: RequestUser, ruleId: string, dto: Row = {}) {
    const preview = await this.previewEligibleWorkers(user, ruleId, dto);
    const rows = [];
    for (const worker of preview.rows) {
      rows.push(await this.createRequest(user, { workerId: worker.id, ruleId, requestedPtwRole: preview.rule.ptw_role, requestedPermitTypes: preview.rule.permit_types_json, requestSource: 'Rule Auto Generation', requestReason: dto.reason ?? 'Generated from active PTW authorization rule.' }));
    }
    return { rows, total: rows.length };
  }

  async authorizations(user: RequestUser, query: Row = {}) {
    const rows = this.filterAuthorizations(await this.authRows(user, query), query).map((row) => ({ ...row, days_to_expiry: this.daysToExpiry(row) }));
    return { ...this.paginate(rows, query), summary: this.authorizationSummary(rows) };
  }

  async createAuthorization(user: RequestUser, dto: Row) {
    this.requireText(dto.workerId ?? dto.worker_id, 'Worker is required.');
    this.requireText(dto.ptwRole ?? dto.ptw_role, 'PTW role is required.');
    const worker = await this.assertWorker(user, dto.workerId ?? dto.worker_id);
    const rule = dto.ruleId || dto.rule_id ? await this.assertRule(user, dto.ruleId ?? dto.rule_id) : null;
    const siteId = dto.siteId ?? dto.site_id ?? rule?.site_id ?? worker.primary_site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const now = new Date().toISOString();
    const auth = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? worker.primary_unit_id,
      area_id: dto.areaId ?? dto.area_id ?? worker.primary_area_id,
      equipment_id: dto.equipmentId ?? dto.equipment_id,
      worker_id: worker.id,
      linked_user_id: worker.linked_user_id,
      rule_id: rule?.id ?? dto.ruleId ?? dto.rule_id,
      ptw_role: dto.ptwRole ?? dto.ptw_role,
      permit_types_json: this.arrayValue(dto.permitTypes ?? dto.permit_types_json ?? rule?.permit_types_json),
      authorization_scope_json: dto.authorizationScope ?? dto.authorization_scope_json ?? {},
      authorization_status: dto.authorizationStatus ?? dto.authorization_status ?? 'Not Evaluated',
      evidence_status: dto.evidenceStatus ?? dto.evidence_status ?? 'Missing Evidence',
      approval_status: dto.approvalStatus ?? dto.approval_status ?? 'Not Submitted',
      effective_date: dto.effectiveDate ?? dto.effective_date,
      expiry_date: dto.expiryDate ?? dto.expiry_date ?? this.defaultExpiryDate(rule),
      notes: dto.notes,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now
    });
    const inserted = await this.db.single<Row>(this.db.from('training_ptw_authorizations').insert(auth).select('*').single());
    await this.evaluateAuthorization(user, inserted.id, { reason: 'Initial authorization evaluation' });
    await this.writeHistory(user, 'Created', `PTW authorization created for ${worker.display_name ?? worker.id}`, null, inserted, { authorization_id: inserted.id, worker_id: worker.id, site_id: inserted.site_id });
    return this.authorizationDetail(user, inserted.id);
  }

  async authorizationDetail(user: RequestUser, authorizationId: string) {
    const authorization = await this.assertAuthorization(user, authorizationId);
    const [worker, rule, evaluations, gaps, waivers, history] = await Promise.all([
      this.assertWorker(user, authorization.worker_id).catch(() => null),
      authorization.rule_id ? this.assertRule(user, authorization.rule_id).catch(() => null) : Promise.resolve(null),
      this.safeMany<Row>(this.db.from('training_ptw_authorization_evaluations').select('*').eq('company_id', user.tenantId).eq('authorization_id', authorizationId).order('evaluated_at', { ascending: false })),
      this.gapRows(user, { authorizationId }),
      this.waiverRows(user, { authorizationId }),
      this.history(user, { authorizationId, limit: 25 })
    ]);
    return { authorization: { ...authorization, worker, rule, days_to_expiry: this.daysToExpiry(authorization) }, worker, rule, evaluations, gaps, waivers, history: history.rows };
  }

  async updateAuthorization(user: RequestUser, authorizationId: string, dto: Row) {
    const before = await this.assertAuthorization(user, authorizationId);
    if (['Authorized', 'Waived / Temporary Authorization'].includes(before.authorization_status) && dto.ptwRole && dto.ptwRole !== before.ptw_role) throw new BadRequestException('Current authorization role cannot be changed. Use renewal, suspension or revocation workflow.');
    const patch = this.compact({
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      equipment_id: dto.equipmentId ?? dto.equipment_id,
      permit_types_json: dto.permitTypes ?? dto.permit_types_json,
      authorization_scope_json: dto.authorizationScope ?? dto.authorization_scope_json,
      effective_date: dto.effectiveDate ?? dto.effective_date,
      expiry_date: dto.expiryDate ?? dto.expiry_date,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update(patch).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.evaluateAuthorization(user, authorizationId, { reason: 'Authorization updated' });
    await this.writeHistory(user, 'Updated', 'PTW authorization updated', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return this.authorizationDetail(user, authorizationId);
  }

  async evaluateAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    const authorization = await this.assertAuthorization(user, authorizationId);
    const worker = await this.assertWorker(user, authorization.worker_id);
    const rule = authorization.rule_id ? await this.assertRule(user, authorization.rule_id).catch(() => null) : null;
    const checklist = await this.evidenceChecklist(user, worker, authorization, rule);
    const missing = checklist.filter((item) => item.status !== 'Satisfied' && item.mandatory);
    const expired = authorization.expiry_date && new Date(authorization.expiry_date) < new Date();
    const approvalPending = ['Pending Approval', 'Submitted'].includes(String(authorization.approval_status));
    const status = expired ? 'Expired' : missing.length ? 'Not Authorized' : approvalPending ? 'Pending Approval' : 'Authorized';
    const evidenceStatus = missing.length ? this.firstEvidenceStatus(missing) : 'Complete';
    const summary = { missingEvidence: missing, reason: dto.reason ?? null, worker: worker.display_name ?? worker.id, rule: rule?.rule_title ?? null };
    const evaluation = await this.db.single<Row>(this.db.from('training_ptw_authorization_evaluations').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: authorization.site_id,
      unit_id: authorization.unit_id,
      area_id: authorization.area_id,
      worker_id: worker.id,
      authorization_id: authorization.id,
      rule_id: rule?.id ?? null,
      evaluation_status: 'Completed',
      authorization_status: status,
      evidence_status: evidenceStatus,
      approval_status: authorization.approval_status,
      ptw_check_result: status === 'Authorized' ? 'Allowed' : 'Blocked',
      missing_training_count: missing.filter((item) => item.type === 'Training').length,
      expired_certificate_count: missing.filter((item) => item.type === 'Certificate').length,
      failed_assessment_count: missing.filter((item) => item.type === 'Assessment').length,
      sop_ack_gap_count: missing.filter((item) => item.type === 'SOP').length,
      competency_gap_count: missing.filter((item) => item.type === 'Competency').length,
      matrix_gap_count: missing.filter((item) => item.type === 'Matrix').length,
      blocker_count: missing.length,
      evidence_checklist_json: checklist,
      result_summary_json: summary,
      evaluated_by: user.id
    }).select('*').single());
    const before = authorization;
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: status, evidence_status: evidenceStatus, days_to_expiry: this.daysToExpiry(authorization), last_evaluated_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorization.id).select('*').single());
    await this.rebuildGaps(user, after, checklist);
    await this.updateWorkerPtwSummary(user, worker.id);
    await this.writeHistory(user, 'Evaluated', `PTW authorization evaluated: ${status}`, before, after, { authorization_id: authorization.id, worker_id: worker.id, site_id: authorization.site_id });
    return { authorization: after, evaluation, checklist };
  }

  async submitAuthorizationApproval(user: RequestUser, authorizationId: string, dto: Row = {}) {
    const before = await this.assertAuthorization(user, authorizationId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ approval_status: 'Pending Approval', authorization_status: 'Pending Approval', notes: dto.reason ?? before.notes, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.writeHistory(user, 'Submitted', 'PTW authorization submitted for approval', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async approveAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    const before = await this.assertAuthorization(user, authorizationId);
    if (before.evidence_status !== 'Complete' && !before.waiver_id) throw new BadRequestException('Authorization cannot be approved with missing mandatory evidence unless a valid waiver exists.');
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: 'Authorized', approval_status: 'Approved', authorized_by: user.id, authorized_at: new Date().toISOString(), effective_date: before.effective_date ?? new Date().toISOString().slice(0, 10), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.updateWorkerPtwSummary(user, after.worker_id);
    await this.writeHistory(user, 'Approved', 'PTW authorization approved', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async rejectAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.rejectionReason, 'Rejection reason is required.');
    const before = await this.assertAuthorization(user, authorizationId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: 'Rejected', approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason ?? dto.rejectionReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.updateWorkerPtwSummary(user, after.worker_id);
    await this.writeHistory(user, 'Rejected', 'PTW authorization rejected', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async renewAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    const before = await this.assertAuthorization(user, authorizationId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: 'Not Evaluated', approval_status: dto.approvalRequired ? 'Pending Approval' : before.approval_status, expiry_date: dto.expiryDate ?? dto.expiry_date ?? this.defaultExpiryDate(null), reauthorization_required: false, reauthorization_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.evaluateAuthorization(user, authorizationId, { reason: 'Renewal evaluation' });
    await this.writeHistory(user, 'Renewed', 'PTW authorization renewal started', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async suspendAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.suspensionReason, 'Suspension reason is required.');
    const before = await this.assertAuthorization(user, authorizationId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: 'Suspended', suspended_by: user.id, suspended_at: new Date().toISOString(), suspension_reason: dto.reason ?? dto.suspensionReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.updateWorkerPtwSummary(user, after.worker_id);
    await this.writeHistory(user, 'Suspended', 'PTW authorization suspended', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async revokeAuthorization(user: RequestUser, authorizationId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.revocationReason, 'Revocation reason is required.');
    const before = await this.assertAuthorization(user, authorizationId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorizations').update({ authorization_status: 'Revoked', revoked_by: user.id, revoked_at: new Date().toISOString(), revocation_reason: dto.reason ?? dto.revocationReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', authorizationId).select('*').single());
    await this.updateWorkerPtwSummary(user, after.worker_id);
    await this.writeHistory(user, 'Revoked', 'PTW authorization revoked', before, after, { authorization_id: authorizationId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async requests(user: RequestUser, query: Row = {}) { const rows = this.filterRequests(await this.requestRows(user, query), query); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'request_status') }; }

  async createRequest(user: RequestUser, dto: Row) {
    this.requireText(dto.workerId ?? dto.worker_id, 'Worker is required.');
    this.requireText(dto.requestedPtwRole ?? dto.requested_ptw_role, 'Requested PTW role is required.');
    const worker = await this.assertWorker(user, dto.workerId ?? dto.worker_id);
    const rule = dto.ruleId || dto.rule_id ? await this.assertRule(user, dto.ruleId ?? dto.rule_id) : null;
    const siteId = dto.siteId ?? dto.site_id ?? rule?.site_id ?? worker.primary_site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_requests').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? worker.primary_unit_id,
      area_id: dto.areaId ?? dto.area_id ?? worker.primary_area_id,
      worker_id: worker.id,
      rule_id: rule?.id ?? null,
      requested_ptw_role: dto.requestedPtwRole ?? dto.requested_ptw_role,
      requested_permit_types_json: this.arrayValue(dto.requestedPermitTypes ?? dto.requested_permit_types_json ?? rule?.permit_types_json),
      requested_scope_json: dto.requestedScope ?? dto.requested_scope_json ?? {},
      request_source: dto.requestSource ?? dto.request_source ?? 'Manual',
      request_reason: dto.requestReason ?? dto.request_reason,
      request_status: dto.requestStatus ?? dto.request_status ?? 'Draft',
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      approver_user_id: dto.approverUserId ?? dto.approver_user_id,
      due_date: dto.dueDate ?? dto.due_date
    }).select('*').single());
    await this.writeHistory(user, 'Created', 'PTW authorization request created', null, row, { request_id: row.id, worker_id: row.worker_id, site_id: row.site_id });
    return row;
  }

  async requestDetail(user: RequestUser, requestId: string) {
    const request = await this.assertRequest(user, requestId);
    const [worker, rule, gaps, history] = await Promise.all([
      this.assertWorker(user, request.worker_id).catch(() => null),
      request.rule_id ? this.assertRule(user, request.rule_id).catch(() => null) : Promise.resolve(null),
      this.gapRows(user, { requestId }),
      this.history(user, { requestId, limit: 25 })
    ]);
    return { request, worker, rule, gaps, history: history.rows };
  }

  async updateRequest(user: RequestUser, requestId: string, dto: Row) {
    const before = await this.assertRequest(user, requestId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_requests').update(this.compact({ request_reason: dto.requestReason ?? dto.request_reason, request_status: dto.requestStatus ?? dto.request_status, reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id, approver_user_id: dto.approverUserId ?? dto.approver_user_id, due_date: dto.dueDate ?? dto.due_date, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', requestId).select('*').single());
    await this.writeHistory(user, 'Updated', 'PTW authorization request updated', before, after, { request_id: requestId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async submitRequest(user: RequestUser, requestId: string, dto: Row = {}) {
    const before = await this.assertRequest(user, requestId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_requests').update({ request_status: 'Submitted', submitted_by: user.id, submitted_at: new Date().toISOString(), request_reason: dto.reason ?? before.request_reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', requestId).select('*').single());
    await this.writeHistory(user, 'Submitted', 'PTW authorization request submitted', before, after, { request_id: requestId, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async decideRequest(user: RequestUser, requestId: string, decision: 'approve' | 'reject' | 'return', dto: Row = {}) {
    const before = await this.assertRequest(user, requestId);
    if (decision !== 'approve') this.requireText(dto.reason ?? dto.decisionReason, `${decision} reason is required.`);
    let converted: Row | null = null;
    let requestStatus = decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Returned';
    if (decision === 'approve') {
      converted = (await this.createAuthorization(user, { workerId: before.worker_id, ruleId: before.rule_id, ptwRole: before.requested_ptw_role, permitTypes: before.requested_permit_types_json, siteId: before.site_id, unitId: before.unit_id, areaId: before.area_id })).authorization;
      requestStatus = 'Converted To Authorization';
    }
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_requests').update({ request_status: requestStatus, decided_by: user.id, decided_at: new Date().toISOString(), decision_reason: dto.reason ?? dto.decisionReason ?? null, converted_authorization_id: converted?.id ?? null, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', requestId).select('*').single());
    await this.writeHistory(user, decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Returned', `PTW authorization request ${requestStatus}`, before, after, { request_id: requestId, worker_id: after.worker_id, site_id: after.site_id });
    return { request: after, authorization: converted };
  }

  async evaluations(user: RequestUser, query: Row = {}) { const rows = await this.evaluationRows(user, query); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'authorization_status') }; }

  async evaluate(user: RequestUser, dto: Row = {}) {
    if (dto.authorizationId || dto.authorization_id) return this.evaluateAuthorization(user, dto.authorizationId ?? dto.authorization_id, dto);
    if (dto.workerId || dto.worker_id) return this.evaluateWorker(user, dto.workerId ?? dto.worker_id, dto);
    const auths = await this.authRows(user, dto);
    const rows = [];
    for (const auth of auths) rows.push(await this.evaluateAuthorization(user, auth.id, dto));
    return { rows, total: rows.length };
  }

  async evaluateWorker(user: RequestUser, workerId: string, dto: Row = {}) {
    await this.assertWorker(user, workerId);
    const auths = await this.authRows(user, { ...dto, workerId });
    const rows = [];
    for (const auth of auths) rows.push(await this.evaluateAuthorization(user, auth.id, dto));
    return { rows, total: rows.length };
  }

  async authorizationCheck(user: RequestUser, dto: Row = {}) {
    const workerId = dto.workerId ?? dto.worker_id;
    const linkedUserId = dto.userId ?? dto.user_id ?? dto.linkedUserId ?? dto.linked_user_id;
    const ptwRole = dto.ptwRole ?? dto.ptw_role;
    const ptwAction = dto.ptwAction ?? dto.ptw_action ?? 'PTW Action';
    if (!workerId && !linkedUserId) throw new BadRequestException('Worker or linked user is required for PTW authorization check.');
    this.requireText(ptwRole, 'PTW role is required for authorization check.');
    const worker = workerId ? await this.assertWorker(user, workerId) : await this.workerByLinkedUser(user, linkedUserId);
    const query = { workerId: worker.id, siteId: dto.siteId ?? dto.site_id ?? worker.primary_site_id };
    const auths = this.filterAuthorizations(await this.authRows(user, query), { ptwRole, permitType: dto.permitType ?? dto.permit_type });
    const valid = auths.find((row) => row.authorization_status === 'Authorized' && (!row.expiry_date || new Date(row.expiry_date) >= new Date()));
    const status = valid ? 'Authorized' : auths[0]?.authorization_status ?? 'Not Authorized';
    const disabledReason = valid ? null : this.checkReason(status, ptwRole);
    const blocked = !valid;
    const log = await this.db.single<Row>(this.db.from('training_ptw_authorization_check_logs').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? worker.primary_site_id,
      unit_id: dto.unitId ?? dto.unit_id ?? worker.primary_unit_id,
      area_id: dto.areaId ?? dto.area_id ?? worker.primary_area_id,
      worker_id: worker.id,
      linked_user_id: worker.linked_user_id ?? linkedUserId ?? null,
      authorization_id: valid?.id ?? auths[0]?.id ?? null,
      rule_id: valid?.rule_id ?? auths[0]?.rule_id ?? null,
      ptw_id: dto.ptwId ?? dto.ptw_id ?? dto.permitId ?? dto.permit_id,
      ptw_role: ptwRole,
      permit_type: dto.permitType ?? dto.permit_type,
      ptw_action: ptwAction,
      check_result: valid ? 'Allowed' : 'Blocked',
      blocked,
      disabled_reason: disabledReason,
      evidence_status: valid?.evidence_status ?? auths[0]?.evidence_status ?? 'Missing Evidence',
      authorization_status: status,
      metadata_json: dto,
      checked_by: user.id
    }).select('*').single()).catch(() => null);
    if (blocked) {
      await this.writeHistory(user, 'PTW Action Blocked', disabledReason ?? 'PTW authorization check blocked action', null, log, { worker_id: worker.id, site_id: dto.siteId ?? dto.site_id ?? worker.primary_site_id, source_record_id: log?.id });
    }
    return { allowed: !blocked, blocked, checkResult: valid ? 'Allowed' : 'Blocked', disabledReason, worker, authorization: valid ?? null, authorizationStatus: status, evidenceStatus: valid?.evidence_status ?? auths[0]?.evidence_status ?? 'Missing Evidence', log };
  }

  authorizedWorkers(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, authorizationStatus: 'Authorized' }); }
  permitAuthorizationCheck(user: RequestUser, permitId: string, dto: Row = {}) { return this.authorizationCheck(user, { ...dto, permitId }); }
  permitRoleAuthorization(user: RequestUser, permitId: string, query: Row = {}) { return this.checkLogs(user, { ...query, ptwId: permitId }); }
  permitWorkforceAuthorization(user: RequestUser, permitId: string, query: Row = {}) { return this.authorizedWorkers(user, { ...query, ptwId: permitId }); }

  async gaps(user: RequestUser, query: Row = {}) { const rows = this.filterGaps(await this.gapRows(user, query), query); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'gap_status') }; }
  expired(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, authorizationStatus: 'Expired' }); }
  expiring(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, expiring: 'true' }); }
  suspended(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, authorizationStatus: 'Suspended' }); }
  pendingApproval(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, approvalStatus: 'Pending Approval' }); }
  blockedWorkers(user: RequestUser, query: Row = {}) { return this.gaps(user, { ...query, gapStatus: query.gapStatus ?? 'Open' }); }
  gasTesters(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, ptwRole: 'Gas Tester' }); }
  isolatingAuthorities(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, ptwRole: query.ptwRole ?? 'Isolating Authority' }); }
  permitIssuers(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, ptwRole: 'Permit Issuer' }); }
  performingAuthorities(user: RequestUser, query: Row = {}) { return this.authorizations(user, { ...query, ptwRole: 'Performing Authority' }); }
  workerAuthorizations(user: RequestUser, workerId: string, query: Row = {}) { return this.authorizations(user, { ...query, workerId }); }
  workerGaps(user: RequestUser, workerId: string, query: Row = {}) { return this.gaps(user, { ...query, workerId }); }
  workerHistory(user: RequestUser, workerId: string, query: Row = {}) { return this.history(user, { ...query, workerId }); }
  scopedSite(user: RequestUser, siteId: string, query: Row = {}) { this.assertSiteAccess(user, siteId); return this.authorizations(user, { ...query, siteId }); }
  scopedUnit(user: RequestUser, unitId: string, query: Row = {}) { return this.authorizations(user, { ...query, unitId }); }
  scopedArea(user: RequestUser, areaId: string, query: Row = {}) { return this.authorizations(user, { ...query, areaId }); }

  gapDetail(user: RequestUser, gapId: string) { return this.assertGap(user, gapId); }
  async createGapAction(user: RequestUser, gapId: string, dto: Row = {}) {
    const gap = await this.assertGap(user, gapId);
    const actionId = dto.actionId ?? dto.action_id ?? randomUUID();
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_gaps').update({ action_id: actionId, gap_status: 'In Progress', last_detected_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select('*').single());
    await this.writeHistory(user, 'Action Created', `Action linked to PTW authorization gap: ${gap.gap_title}`, gap, after, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return after;
  }
  async markGapResolved(user: RequestUser, gapId: string, dto: Row = {}) {
    const gap = await this.assertGap(user, gapId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_gaps').update({ gap_status: 'Resolved', resolved_by: user.id, resolved_at: new Date().toISOString(), resolution_notes: dto.reason ?? dto.notes ?? null }).eq('company_id', user.tenantId).eq('id', gapId).select('*').single());
    await this.writeHistory(user, 'Resolved', `PTW authorization gap resolved: ${gap.gap_title}`, gap, after, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return after;
  }
  async verifyGap(user: RequestUser, gapId: string, dto: Row = {}) {
    const gap = await this.assertGap(user, gapId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_gaps').update({ gap_status: 'Verified Closed', verified_by: user.id, verified_at: new Date().toISOString(), resolution_notes: dto.reason ?? gap.resolution_notes }).eq('company_id', user.tenantId).eq('id', gapId).select('*').single());
    await this.writeHistory(user, 'Verified', `PTW authorization gap verified: ${gap.gap_title}`, gap, after, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return after;
  }
  async reopenGap(user: RequestUser, gapId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.reopenReason, 'Reopen reason is required.');
    const gap = await this.assertGap(user, gapId);
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_gaps').update({ gap_status: 'Reopened', reopened_by: user.id, reopened_at: new Date().toISOString(), reopen_reason: dto.reason ?? dto.reopenReason }).eq('company_id', user.tenantId).eq('id', gapId).select('*').single());
    await this.writeHistory(user, 'Reopened', `PTW authorization gap reopened: ${gap.gap_title}`, gap, after, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return after;
  }

  async waivers(user: RequestUser, query: Row = {}) { const rows = this.filterWaivers(await this.waiverRows(user, query), query); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'waiver_status') }; }
  async requestWaiver(user: RequestUser, gapId: string, dto: Row) {
    const gap = await this.assertGap(user, gapId);
    this.requireText(dto.reason, 'Waiver reason is required.');
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_waivers').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: gap.site_id,
      unit_id: gap.unit_id,
      area_id: gap.area_id,
      worker_id: gap.worker_id,
      authorization_id: gap.authorization_id,
      request_id: gap.request_id,
      gap_id: gap.id,
      waiver_type: dto.waiverType ?? dto.waiver_type ?? 'Temporary Authorization',
      waiver_status: 'Requested',
      requested_ptw_role: gap.ptw_role,
      requested_scope_json: dto.requestedScope ?? dto.requested_scope_json ?? {},
      reason: dto.reason,
      risk_justification: dto.riskJustification ?? dto.risk_justification,
      compensating_controls: dto.compensatingControls ?? dto.compensating_controls,
      expiry_date: dto.expiryDate ?? dto.expiry_date,
      requested_by: user.id
    }).select('*').single());
    await this.writeHistory(user, 'Waiver Requested', `PTW authorization waiver requested for ${gap.gap_title}`, null, row, { waiver_id: row.id, gap_id: gap.id, worker_id: gap.worker_id, site_id: gap.site_id });
    return row;
  }
  async decideWaiver(user: RequestUser, waiverId: string, decision: Decision, dto: Row = {}) {
    const before = await this.assertWaiver(user, waiverId);
    const status = decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Revoked';
    if (decision !== 'approve') this.requireText(dto.reason ?? dto.decisionReason, `${status} reason is required.`);
    const patch: Row = { waiver_status: status, decision_reason: dto.reason ?? dto.decisionReason ?? null, updated_at: new Date().toISOString() };
    if (decision === 'approve') Object.assign(patch, { approved_by: user.id, approved_at: new Date().toISOString() });
    if (decision === 'reject') Object.assign(patch, { rejected_by: user.id, rejected_at: new Date().toISOString() });
    if (decision === 'revoke') Object.assign(patch, { revoked_by: user.id, revoked_at: new Date().toISOString() });
    const after = await this.db.single<Row>(this.db.from('training_ptw_authorization_waivers').update(patch).eq('company_id', user.tenantId).eq('id', waiverId).select('*').single());
    if (decision === 'approve' && after.authorization_id) {
      await this.db.single(this.db.from('training_ptw_authorizations').update({ waiver_id: after.id, authorization_status: 'Waived / Temporary Authorization', approval_status: 'Approved', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', after.authorization_id).select('id').single()).catch(() => null);
    }
    await this.writeHistory(user, `Waiver ${status}`, `PTW authorization waiver ${status.toLowerCase()}`, before, after, { waiver_id: waiverId, gap_id: after.gap_id, worker_id: after.worker_id, site_id: after.site_id });
    return after;
  }

  async checkLogs(user: RequestUser, query: Row = {}) { const rows = await this.checkRows(user, query); return this.paginate(rows, query); }
  async history(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_history_events').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('rule_id', query.ruleId);
    if (query.authorizationId) req = req.eq('authorization_id', query.authorizationId);
    if (query.requestId) req = req.eq('request_id', query.requestId);
    if (query.gapId) req = req.eq('gap_id', query.gapId);
    return this.paginate(await this.safeMany<Row>(req.order('created_at', { ascending: false })), query);
  }
  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const rows = await this.safeMany<Row>(this.db.from('training_ptw_authorization_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId));
    return rows[0] ?? { company_id: user.tenantId, site_id: siteId, auto_evaluate_on_worker_change: true, auto_evaluate_on_rule_change: true, block_ptw_on_missing_authorization: true, expire_authorization_on_certificate_expiry: true, suspend_authorization_on_failed_assessment: true, allow_emergency_override: false, require_esign_for_safety_critical_authorization: true, default_expiry_warning_days: 30 };
  }
  async updateSettings(user: RequestUser, dto: Row = {}) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const existing = await this.settings(user, { siteId });
    const payload = this.compact({ id: existing.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, auto_evaluate_on_worker_change: dto.autoEvaluateOnWorkerChange ?? dto.auto_evaluate_on_worker_change, auto_evaluate_on_rule_change: dto.autoEvaluateOnRuleChange ?? dto.auto_evaluate_on_rule_change, block_ptw_on_missing_authorization: dto.blockPtwOnMissingAuthorization ?? dto.block_ptw_on_missing_authorization, expire_authorization_on_certificate_expiry: dto.expireAuthorizationOnCertificateExpiry ?? dto.expire_authorization_on_certificate_expiry, suspend_authorization_on_failed_assessment: dto.suspendAuthorizationOnFailedAssessment ?? dto.suspend_authorization_on_failed_assessment, allow_emergency_override: dto.allowEmergencyOverride ?? dto.allow_emergency_override, require_esign_for_safety_critical_authorization: dto.requireEsignForSafetyCriticalAuthorization ?? dto.require_esign_for_safety_critical_authorization, default_expiry_warning_days: dto.defaultExpiryWarningDays ?? dto.default_expiry_warning_days, settings_json: dto.settingsJson ?? dto.settings_json, updated_by: user.id, updated_at: new Date().toISOString() });
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_settings').upsert(payload, { onConflict: 'company_id,site_id' }).select('*').single());
    await this.writeHistory(user, 'Settings Updated', 'PTW authorization settings updated', existing, row, { site_id: siteId });
    return row;
  }
  importTemplate() { return { columns: ['rule_code', 'rule_title', 'ptw_role', 'permit_types', 'authorization_type', 'site_code', 'unit_code', 'area_code', 'worker_email', 'worker_id', 'authorization_status', 'effective_date', 'expiry_date', 'evidence_status', 'approval_status', 'safety_critical', 'blocks_ptw_action'] }; }
  async importRows(user: RequestUser, dto: Row = {}) { return { accepted: 0, rejected: 0, message: 'PTW authorization import endpoint is ready for validated rows; no rows were processed because bulk import mapping was not provided.', rows: dto.rows ?? [] }; }
  async exportRows(user: RequestUser, query: Row = {}) { return { generatedAt: new Date().toISOString(), rules: (await this.rules(user, query)).rows, authorizations: (await this.authorizations(user, query)).rows, gaps: (await this.gaps(user, query)).rows }; }
  lookups() { return { ptwRoles, permitTypes, authorizationTypes, authorizationStatuses, requestStatuses, gapTypes, gapStatuses, waiverStatuses, ptwActions }; }
  lookup(name: string) { return { values: (this.lookups() as Row)[name] ?? [] }; }

  private async upsertRuleChildren(user: RequestUser, rule: Row, dto: Row) {
    const scope = dto.scope ?? dto.scopeJson ?? dto.scope_json ?? {};
    await this.db.single(this.db.from('training_ptw_authorization_rule_scopes').upsert({
      id: dto.scopeId ?? `${rule.id}_scope`,
      company_id: user.tenantId,
      site_id: rule.site_id,
      rule_id: rule.id,
      scope_type: scope.scopeType ?? dto.scopeType ?? 'Site',
      site_scope_id: scope.siteId ?? dto.siteScopeId ?? rule.site_id,
      unit_id: scope.unitId ?? dto.unitId ?? dto.unit_id,
      area_id: scope.areaId ?? dto.areaId ?? dto.area_id,
      equipment_id: scope.equipmentId ?? dto.equipmentId ?? dto.equipment_id,
      department_id: scope.departmentId ?? dto.departmentId ?? dto.department_id,
      worker_type_filter: scope.workerType ?? dto.workerTypeFilter ?? dto.worker_type_filter,
      employer_type_filter: scope.employerType ?? dto.employerTypeFilter ?? dto.employer_type_filter,
      contractor_company_filter: scope.contractorCompany ?? dto.contractorCompanyFilter ?? dto.contractor_company_filter,
      job_role_filter: scope.jobRole ?? dto.jobRoleFilter ?? dto.job_role_filter,
      competency_profile_id: scope.competencyProfileId ?? dto.competencyProfileId ?? dto.competency_profile_id,
      required_training_item_id: scope.requiredTrainingItemId ?? dto.requiredTrainingItemId ?? dto.required_training_item_id,
      ptw_role_candidate: scope.ptwRoleCandidate ?? dto.ptwRoleCandidate ?? dto.ptw_role_candidate,
      specific_worker_id: scope.specificWorkerId ?? dto.specificWorkerId ?? dto.specific_worker_id,
      auto_evaluate_eligible_workers: Boolean(scope.autoEvaluateEligibleWorkers ?? dto.autoEvaluateEligibleWorkers ?? dto.auto_evaluate_eligible_workers),
      auto_generate_requests: Boolean(scope.autoGenerateRequests ?? dto.autoGenerateRequests ?? dto.auto_generate_requests),
      applicability_rule_json: scope.applicabilityRule ?? dto.applicabilityRuleJson ?? dto.applicability_rule_json ?? {}
    }, { onConflict: 'id' }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('training_ptw_authorization_evidence_rules').upsert({
      id: `${rule.id}_evidence`,
      company_id: user.tenantId,
      site_id: rule.site_id,
      rule_id: rule.id,
      required_training_items_json: dto.requiredTrainingItems ?? dto.required_training_items_json ?? [],
      matrix_rule_ids_json: dto.matrixRuleIds ?? dto.matrix_rule_ids_json ?? [],
      competency_requirement_ids_json: dto.competencyRequirementIds ?? dto.competency_requirement_ids_json ?? [],
      certificate_categories_json: dto.certificateCategories ?? dto.certificate_categories_json ?? [],
      assessment_ids_json: dto.assessmentIds ?? dto.assessment_ids_json ?? [],
      sop_ack_requirement_ids_json: dto.sopAckRequirementIds ?? dto.sop_ack_requirement_ids_json ?? [],
      training_completion_required: dto.trainingCompletionRequired ?? dto.training_completion_required ?? true,
      matrix_status_required: Boolean(dto.matrixStatusRequired ?? dto.matrix_status_required),
      competency_status_required: Boolean(dto.competencyStatusRequired ?? dto.competency_status_required),
      certificate_required: Boolean(dto.certificateRequired ?? dto.certificate_required),
      assessment_required: Boolean(dto.assessmentRequired ?? dto.assessment_required),
      sop_ack_required: Boolean(dto.sopAckRequired ?? dto.sop_ack_required),
      practical_verification_required: Boolean(dto.practicalVerificationRequired ?? dto.practical_verification_required),
      supervisor_approval_required: Boolean(dto.supervisorApprovalRequired ?? dto.supervisor_approval_required),
      hse_approval_required: Boolean(dto.hseApprovalRequired ?? dto.hse_approval_required),
      ptw_owner_approval_required: Boolean(dto.ptwOwnerApprovalRequired ?? dto.ptw_owner_approval_required),
      evidence_document_required: Boolean(dto.evidenceDocumentRequired ?? dto.evidence_document_required),
      esign_required: Boolean(dto.esignRequired ?? dto.esign_required),
      manual_verification_allowed: Boolean(dto.manualVerificationAllowed ?? dto.manual_verification_allowed),
      evidence_validity_days: dto.evidenceValidityDays ?? dto.evidence_validity_days
    }, { onConflict: 'id' }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('training_ptw_authorization_approval_rules').upsert({ id: `${rule.id}_approval`, company_id: user.tenantId, site_id: rule.site_id, rule_id: rule.id, approval_required: dto.approvalRequired ?? dto.approval_required ?? rule.safety_critical, approval_route: dto.approvalRoute ?? dto.approval_route ?? 'Supervisor / HSE / PTW Owner Approval', approver_role: dto.approverRole ?? dto.approver_role, approver_user_id: dto.approverUserId ?? dto.approver_user_id, supervisor_approval_required: Boolean(dto.supervisorApprovalRequired ?? dto.supervisor_approval_required), hse_approval_required: Boolean(dto.hseApprovalRequired ?? dto.hse_approval_required), operations_manager_approval_required: Boolean(dto.operationsManagerApprovalRequired ?? dto.operations_manager_approval_required), site_manager_approval_required: Boolean(dto.siteManagerApprovalRequired ?? dto.site_manager_approval_required), ptw_coordinator_approval_required: Boolean(dto.ptwCoordinatorApprovalRequired ?? dto.ptw_coordinator_approval_required), esign_required: Boolean(dto.esignRequired ?? dto.esign_required), approval_sla_hours: dto.approvalSlaHours ?? dto.approval_sla_hours, escalation_rule_json: dto.escalationRuleJson ?? dto.escalation_rule_json ?? {} }, { onConflict: 'id' }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('training_ptw_authorization_expiry_rules').upsert({ id: `${rule.id}_expiry`, company_id: user.tenantId, site_id: rule.site_id, rule_id: rule.id, no_expiry_allowed: Boolean(dto.noExpiryAllowed ?? dto.no_expiry_allowed), renewal_required: dto.renewalRequired ?? dto.renewal_required ?? true, renewal_interval_days: dto.renewalIntervalDays ?? dto.renewal_interval_days, expiry_warning_days: dto.expiryWarningDays ?? dto.expiry_warning_days ?? 30, grace_period_days: dto.gracePeriodDays ?? dto.grace_period_days ?? 0, reauthorize_after_certificate_expiry: dto.reauthorizeAfterCertificateExpiry ?? dto.reauthorize_after_certificate_expiry ?? true, reauthorize_after_assessment_failure: dto.reauthorizeAfterAssessmentFailure ?? dto.reauthorize_after_assessment_failure ?? true, reauthorize_after_sop_revision: dto.reauthorizeAfterSopRevision ?? dto.reauthorize_after_sop_revision ?? true, reauthorize_after_moc: Boolean(dto.reauthorizeAfterMoc ?? dto.reauthorize_after_moc), reauthorize_after_pssr_startup_change: Boolean(dto.reauthorizeAfterPssrStartupChange ?? dto.reauthorize_after_pssr_startup_change), reauthorize_after_incident: dto.reauthorizeAfterIncident ?? dto.reauthorize_after_incident ?? true, reauthorize_after_audit_finding: dto.reauthorizeAfterAuditFinding ?? dto.reauthorize_after_audit_finding ?? true, reauthorize_after_psi_change: Boolean(dto.reauthorizeAfterPsiChange ?? dto.reauthorize_after_psi_change), suspension_rule_json: dto.suspensionRuleJson ?? dto.suspension_rule_json ?? {} }, { onConflict: 'id' }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('training_ptw_authorization_enforcement_rules').upsert({ id: `${rule.id}_enforcement`, company_id: user.tenantId, site_id: rule.site_id, rule_id: rule.id, block_permit_creation_if_applicant_unauthorized: Boolean(dto.blockPermitCreationIfApplicantUnauthorized ?? dto.block_permit_creation_if_applicant_unauthorized), block_permit_submission_if_applicant_unauthorized: dto.blockPermitSubmissionIfApplicantUnauthorized ?? dto.block_permit_submission_if_applicant_unauthorized ?? true, block_permit_issue_if_issuer_unauthorized: dto.blockPermitIssueIfIssuerUnauthorized ?? dto.block_permit_issue_if_issuer_unauthorized ?? true, block_permit_approval_if_approver_unauthorized: dto.blockPermitApprovalIfApproverUnauthorized ?? dto.block_permit_approval_if_approver_unauthorized ?? true, block_gas_test_if_gas_tester_unauthorized: dto.blockGasTestIfGasTesterUnauthorized ?? dto.block_gas_test_if_gas_tester_unauthorized ?? true, block_isolation_signoff_if_isolator_unauthorized: dto.blockIsolationSignoffIfIsolatorUnauthorized ?? dto.block_isolation_signoff_if_isolator_unauthorized ?? true, block_workforce_assignment_if_performing_authority_unauthorized: dto.blockWorkforceAssignmentIfPerformingAuthorityUnauthorized ?? dto.block_workforce_assignment_if_performing_authority_unauthorized ?? true, block_confined_space_role_if_unauthorized: dto.blockConfinedSpaceRoleIfUnauthorized ?? dto.block_confined_space_role_if_unauthorized ?? true, block_hot_work_fire_watch_if_unauthorized: dto.blockHotWorkFireWatchIfUnauthorized ?? dto.block_hot_work_fire_watch_if_unauthorized ?? true, block_shift_handover_if_receiver_unauthorized: Boolean(dto.blockShiftHandoverIfReceiverUnauthorized ?? dto.block_shift_handover_if_receiver_unauthorized), block_permit_closure_if_closure_authority_unauthorized: Boolean(dto.blockPermitClosureIfClosureAuthorityUnauthorized ?? dto.block_permit_closure_if_closure_authority_unauthorized), warning_only_mode: Boolean(dto.warningOnlyMode ?? dto.warning_only_mode), emergency_override_allowed: Boolean(dto.emergencyOverrideAllowed ?? dto.emergency_override_allowed), override_approval_role: dto.overrideApprovalRole ?? dto.override_approval_role, override_max_duration_hours: dto.overrideMaxDurationHours ?? dto.override_max_duration_hours }, { onConflict: 'id' }).select('id').single()).catch(() => null);
  }

  private async createOrUpdateAuthorizationFromRule(user: RequestUser, rule: Row, worker: Row, options: Row = {}) {
    const existing = await this.safeMany<Row>(this.db.from('training_ptw_authorizations').select('*').eq('company_id', user.tenantId).eq('worker_id', worker.id).eq('rule_id', rule.id).eq('ptw_role', rule.ptw_role).limit(1));
    if (existing[0]) return this.evaluateAuthorization(user, existing[0].id, options);
    return this.createAuthorization(user, { workerId: worker.id, ruleId: rule.id, ptwRole: rule.ptw_role, permitTypes: rule.permit_types_json, siteId: rule.site_id ?? worker.primary_site_id });
  }

  private async evidenceChecklist(user: RequestUser, worker: Row, authorization: Row, rule: Row | null) {
    const [matrixSummaryRows, matrixGaps] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_matrix_worker_summaries').select('*').eq('company_id', user.tenantId).eq('worker_id', worker.id).limit(1)),
      this.safeMany<Row>(this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId).eq('worker_id', worker.id).eq('ptw_blocker', true))
    ]);
    const summary = matrixSummaryRows[0] ?? {};
    const roleCritical = Boolean(rule?.safety_critical || rule?.gas_testing_required || rule?.isolation_authority_required);
    return [
      { type: 'Training', label: 'Required PTW training complete', mandatory: true, status: ['Complete', 'Current'].includes(worker.training_status) || Number(summary.incomplete_count ?? 0) === 0 ? 'Satisfied' : 'Training Incomplete', source: 'Training Records / Training Matrix' },
      { type: 'Matrix', label: 'No active PTW matrix blocker', mandatory: true, status: matrixGaps.filter((gap) => !['Verified Closed', 'Waived'].includes(gap.gap_status)).length ? 'Missing Evidence' : 'Satisfied', source: 'Training Matrix', gaps: matrixGaps },
      { type: 'Certificate', label: 'Certificate current where required', mandatory: roleCritical, status: !roleCritical || ['Current', 'Not Applicable'].includes(worker.certification_status) ? 'Satisfied' : 'Certificate Expired', source: 'Certifications' },
      { type: 'Assessment', label: 'Assessment passed where required', mandatory: Boolean(rule?.safety_critical), status: !rule?.safety_critical || !['Failed', 'Not Competent'].includes(worker.competency_status) ? 'Satisfied' : 'Assessment Failed', source: 'Assessments / Competency' },
      { type: 'SOP', label: 'SOP acknowledgement current where required', mandatory: Boolean(rule?.psm_critical), status: !rule?.psm_critical || ['Complete', 'Current', 'Not Applicable'].includes(worker.sop_acknowledgement_status) ? 'Satisfied' : 'SOP Acknowledgement Missing', source: 'SOP Acknowledgements' },
      { type: 'Competency', label: 'Competency profile valid', mandatory: true, status: ['Competent', 'Competent With Restrictions', 'Not Applicable'].includes(worker.competency_status) ? 'Satisfied' : 'Competency Gap', source: 'Roles & Competency Profiles' }
    ];
  }

  private async rebuildGaps(user: RequestUser, authorization: Row, checklist: Row[]) {
    const missing = checklist.filter((item) => item.mandatory && item.status !== 'Satisfied');
    for (const item of missing) {
      const gapId = `${authorization.id}_${String(item.type).toLowerCase()}`;
      await this.db.single(this.db.from('training_ptw_authorization_gaps').upsert({
        id: gapId,
        company_id: user.tenantId,
        site_id: authorization.site_id,
        unit_id: authorization.unit_id,
        area_id: authorization.area_id,
        worker_id: authorization.worker_id,
        authorization_id: authorization.id,
        rule_id: authorization.rule_id,
        gap_type: item.status,
        gap_title: `${item.status}: ${authorization.ptw_role}`,
        gap_status: 'Open',
        gap_severity: ['Certificate Expired', 'Assessment Failed', 'Competency Gap'].includes(item.status) ? 'Critical' : 'High',
        ptw_role: authorization.ptw_role,
        evidence_expected: item.label,
        evidence_found: item.source,
        owner_user_id: authorization.linked_user_id ?? null,
        last_detected_at: new Date().toISOString()
      }, { onConflict: 'id' }).select('id').single()).catch(() => null);
    }
  }

  private async updateWorkerPtwSummary(user: RequestUser, workerId: string) {
    const auths = await this.authRows(user, { workerId });
    const status = auths.some((row) => row.authorization_status === 'Authorized') ? (auths.some((row) => row.authorization_status !== 'Authorized') ? 'Partially Authorized' : 'Authorized') : auths.length ? 'Not Authorized' : 'Not Assessed';
    await this.db.single(this.db.from('training_workers').update({ ptw_authorization_status: status, updated_at: new Date().toISOString(), updated_by: user.id }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
  }

  private async ruleRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_rules').select('*').eq('company_id', user.tenantId);
    if (query.includeArchived !== 'true') req = req.is('archived_at', null);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }
  private async authRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorizations').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('rule_id', query.ruleId);
    if (query.authorizationId) req = req.eq('id', query.authorizationId);
    if (query.unitId) req = req.eq('unit_id', query.unitId);
    if (query.areaId) req = req.eq('area_id', query.areaId);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }
  private async requestRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_requests').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('rule_id', query.ruleId);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }
  private async evaluationRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_evaluations').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.authorizationId) req = req.eq('authorization_id', query.authorizationId);
    return this.safeMany<Row>(req.order('evaluated_at', { ascending: false }));
  }
  private async gapRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_gaps').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('rule_id', query.ruleId);
    if (query.authorizationId) req = req.eq('authorization_id', query.authorizationId);
    if (query.requestId) req = req.eq('request_id', query.requestId);
    return this.safeMany<Row>(req.order('last_detected_at', { ascending: false }));
  }
  private async waiverRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_waivers').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.authorizationId) req = req.eq('authorization_id', query.authorizationId);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }
  private async checkRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_ptw_authorization_check_logs').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ptwId) req = req.eq('ptw_id', query.ptwId);
    return this.safeMany<Row>(req.order('checked_at', { ascending: false }));
  }
  private async workerRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('primary_site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'primary_site_id');
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private filterRules(rows: Row[], query: Row) {
    let result = rows;
    if (query.ptwRole) result = result.filter((row) => row.ptw_role === query.ptwRole);
    if (query.ruleStatus) result = result.filter((row) => row.rule_status === query.ruleStatus);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical);
    const search = String(query.search ?? '').toLowerCase();
    if (search) result = result.filter((row) => [row.rule_code, row.rule_title, row.ptw_role].some((value) => String(value ?? '').toLowerCase().includes(search)));
    return result;
  }
  private filterAuthorizations(rows: Row[], query: Row) {
    let result = rows;
    if (query.authorizationStatus) result = result.filter((row) => row.authorization_status === query.authorizationStatus);
    if (query.approvalStatus) result = result.filter((row) => row.approval_status === query.approvalStatus);
    if (query.ptwRole) result = result.filter((row) => row.ptw_role === query.ptwRole);
    if (query.permitType) result = result.filter((row) => this.arrayValue(row.permit_types_json).includes(query.permitType));
    if (query.expiring === 'true') result = result.filter((row) => this.daysToExpiry(row) !== null && Number(this.daysToExpiry(row)) >= 0 && Number(this.daysToExpiry(row)) <= 30);
    const search = String(query.search ?? '').toLowerCase();
    if (search) result = result.filter((row) => [row.ptw_role, row.authorization_status, row.worker_id].some((value) => String(value ?? '').toLowerCase().includes(search)));
    return result;
  }
  private filterRequests(rows: Row[], query: Row) {
    let result = rows;
    if (query.requestStatus) result = result.filter((row) => row.request_status === query.requestStatus);
    if (query.ptwRole) result = result.filter((row) => row.requested_ptw_role === query.ptwRole);
    return result;
  }
  private filterGaps(rows: Row[], query: Row) {
    let result = rows;
    if (query.gapStatus) result = result.filter((row) => row.gap_status === query.gapStatus);
    if (query.gapType) result = result.filter((row) => row.gap_type === query.gapType);
    if (query.ptwRole) result = result.filter((row) => row.ptw_role === query.ptwRole);
    return result;
  }
  private filterWaivers(rows: Row[], query: Row) {
    let result = rows;
    if (query.waiverStatus) result = result.filter((row) => row.waiver_status === query.waiverStatus);
    return result;
  }

  private eligibleWorkersForRule(workers: Row[], rule: Row) {
    return workers.filter((worker) => {
      if (rule.contractor_role_allowed === false && worker.worker_type === 'Contractor' && ['Contractor PTW Authorization', 'Performing Authority Authorization'].includes(rule.authorization_type) === false) return false;
      return worker.employment_status === 'Active' && !worker.archived_at;
    });
  }

  private async assertRule(user: RequestUser, ruleId: string) {
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_rules').select('*').eq('company_id', user.tenantId).eq('id', ruleId).single());
    if (!row) throw new NotFoundException('PTW authorization rule was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }
  private async assertAuthorization(user: RequestUser, authorizationId: string) {
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorizations').select('*').eq('company_id', user.tenantId).eq('id', authorizationId).single());
    if (!row) throw new NotFoundException('PTW authorization was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }
  private async assertRequest(user: RequestUser, requestId: string) {
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_requests').select('*').eq('company_id', user.tenantId).eq('id', requestId).single());
    if (!row) throw new NotFoundException('PTW authorization request was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }
  private async assertGap(user: RequestUser, gapId: string) {
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_gaps').select('*').eq('company_id', user.tenantId).eq('id', gapId).single());
    if (!row) throw new NotFoundException('PTW authorization gap was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }
  private async assertWaiver(user: RequestUser, waiverId: string) {
    const row = await this.db.single<Row>(this.db.from('training_ptw_authorization_waivers').select('*').eq('company_id', user.tenantId).eq('id', waiverId).single());
    if (!row) throw new NotFoundException('PTW authorization waiver was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }
  private async assertWorker(user: RequestUser, workerId: string) {
    const row = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single());
    if (!row) throw new NotFoundException('Worker profile was not found.');
    if (row.primary_site_id) this.assertSiteAccess(user, row.primary_site_id);
    return row;
  }
  private async workerByLinkedUser(user: RequestUser, linkedUserId: string) {
    const row = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('linked_user_id', linkedUserId).maybeSingle());
    if (!row) throw new NotFoundException('No workforce profile is linked to the selected user.');
    if (row.primary_site_id) this.assertSiteAccess(user, row.primary_site_id);
    return row;
  }

  private scope(user: RequestUser) { return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) }; }
  private siteScopedBase(user: RequestUser, req: any, column = 'site_id') {
    const scope = this.scope(user);
    if (scope.selectedSiteId) return req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId));
    if (!scope.corporateView && scope.allowedSiteIds.length) return req.in(column, scope.allowedSiteIds);
    if (!scope.corporateView) return req.eq(column, '__no_site_access__');
    return req;
  }
  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }
  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row = {}) {
    const history = { id: randomUUID(), company_id: user.tenantId, site_id: scope.site_id ?? after?.site_id ?? null, unit_id: scope.unit_id ?? after?.unit_id ?? null, area_id: scope.area_id ?? after?.area_id ?? null, worker_id: scope.worker_id ?? after?.worker_id ?? null, authorization_id: scope.authorization_id ?? after?.authorization_id ?? after?.id ?? null, rule_id: scope.rule_id ?? after?.rule_id ?? null, request_id: scope.request_id ?? after?.request_id ?? null, gap_id: scope.gap_id ?? after?.gap_id ?? null, waiver_id: scope.waiver_id ?? after?.waiver_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before, after_value_json: after, actor_user_id: user.id, source_record_id: scope.source_record_id ?? after?.id ?? scope.authorization_id ?? scope.rule_id ?? scope.request_id ?? scope.gap_id ?? null };
    await this.db.single(this.db.from('training_ptw_authorization_history_events').insert(history).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.ptw_authorization.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingPtwAuthorization', entityId: history.source_record_id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null);
  }
  private countBy(rows: Row[], field: string) { return Object.entries(rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [String(row[field] ?? 'Unknown')]: (acc[String(row[field] ?? 'Unknown')] ?? 0) + 1 }), {})).map(([label, count]) => ({ label, count })); }
  private aggregate(rows: Row[], field: string) { return this.countBy(rows, field).map((row) => ({ ...row, authorized: rows.filter((item) => String(item[field] ?? 'Unknown') === row.label && item.authorization_status === 'Authorized').length, blocked: rows.filter((item) => String(item[field] ?? 'Unknown') === row.label && item.authorization_status !== 'Authorized').length })); }
  private aggregateByPermitType(rows: Row[]) { const expanded = rows.flatMap((row) => this.arrayValue(row.permit_types_json).map((permitType) => ({ ...row, permitType }))); return this.aggregate(expanded, 'permitType'); }
  private async workerTypeAggregation(user: RequestUser, authRows: Row[]) {
    const workers = await this.workerRows(user, {});
    const byWorker = new Map(workers.map((worker) => [worker.id, worker]));
    return this.aggregate(authRows.map((row) => ({ ...row, worker_type: byWorker.get(row.worker_id)?.worker_type ?? 'Unknown' })), 'worker_type');
  }
  private authorizationSummary(rows: Row[]) { return { total: rows.length, authorized: rows.filter((row) => row.authorization_status === 'Authorized').length, pendingApproval: rows.filter((row) => row.approval_status === 'Pending Approval').length, expired: rows.filter((row) => row.authorization_status === 'Expired').length, suspended: rows.filter((row) => row.authorization_status === 'Suspended').length, revoked: rows.filter((row) => row.authorization_status === 'Revoked').length }; }
  private daysToExpiry(row: Row) { if (!row.expiry_date) return null; return Math.ceil((new Date(row.expiry_date).getTime() - Date.now()) / 86400000); }
  private defaultExpiryDate(rule: Row | null) { const days = Number(rule?.renewal_interval_days ?? 365); const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
  private firstEvidenceStatus(items: Row[]) { return String(items[0]?.status ?? 'Missing Evidence'); }
  private checkReason(status: string, ptwRole: string) { return `Worker is not authorized for ${ptwRole}. Current authorization status: ${status}.`; }
  private requireText(value: unknown, message: string) { if (!String(value ?? '').trim()) throw new BadRequestException(message); }
  private paginate(rows: Row[], query: Row = {}) { const page = Math.max(Number(query.page ?? 1), 1); const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 500); return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, lastUpdated: new Date().toISOString() }; }
  private arrayValue(value: unknown): string[] { if (Array.isArray(value)) return value.map(String); if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean); return []; }
  private compact<T extends Row>(obj: T) { return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>; }
  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> { return this.db.many<T>(query).catch(() => []); }
}
