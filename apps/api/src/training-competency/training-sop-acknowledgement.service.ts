import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const requirementSources = ['Company Policy', 'Site Policy', 'Unit Requirement', 'Job Role', 'Competency Profile', 'Required Training', 'Training Matrix Rule', 'SOP Revision', 'MOC', 'PSSR', 'PTW Role', 'PSI Change', 'HAZOP Recommendation', 'Incident Lesson Learned', 'Audit Finding', 'Manual'];
const requirementStatuses = ['Draft', 'Active', 'Inactive', 'Pending Review', 'Approved', 'Review Overdue', 'Superseded', 'Archived'];
const versionPolicies = ['Current approved version only', 'Specific version only', 'Current and future versions', 'Re-acknowledge on major revision only', 'Re-acknowledge on any revision', 'Re-acknowledge when owner marks significant change'];
const ackMethods = ['Click acknowledge', 'E-signature acknowledgement', 'Quiz-gated acknowledgement', 'Supervisor-verified acknowledgement', 'HSE-verified acknowledgement', 'Field demonstration acknowledgement', 'Manual acknowledgement import'];
const assignmentStatuses = ['Assigned', 'Pending', 'In Progress', 'Acknowledged', 'Acknowledged Pending Verification', 'Acknowledged Pending Assessment', 'Re-Acknowledgement Required', 'Overdue', 'Rejected', 'Returned', 'Waived', 'Superseded', 'Cancelled', 'Not Applicable'];
const acknowledgementStatuses = ['Pending', 'Acknowledged', 'Acknowledged Pending Verification', 'Acknowledged Pending Assessment', 'Verified', 'Rejected', 'Returned', 'Re-Acknowledgement Required', 'Waived', 'Superseded', 'Reopened', 'Expired', 'Cancelled'];
const verificationStatuses = ['Not Required', 'Pending', 'Verified', 'Rejected', 'Returned', 'Overridden'];
const waiverStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed'];

@Injectable()
export class TrainingSopAcknowledgementService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, register, bySite, byUnit, pending, overdue, revisionImpact, waivers] = await Promise.all([
      this.dashboardSummary(user, query),
      this.assignments(user, { ...query, limit: query.limit ?? 10 }),
      this.dashboardBySite(user, query),
      this.dashboardByUnit(user, query),
      this.assignments(user, { ...query, statusView: 'pending', limit: 8 }),
      this.assignments(user, { ...query, statusView: 'overdue', limit: 8 }),
      this.revisionImpact(user, { ...query, limit: 8 }),
      this.waivers(user, { ...query, limit: 8 })
    ]);
    return {
      header: {
        title: 'SOP Acknowledgements',
        subtitle: 'Controlled proof that workers acknowledged current approved procedures',
        selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      bySite,
      byUnit,
      byDepartment: this.countBy(register.allRows ?? register.rows, 'worker.department_name'),
      byJobRole: this.countBy(register.allRows ?? register.rows, 'worker.job_title'),
      pendingPreview: pending.rows,
      overduePreview: overdue.rows,
      reacknowledgementRequired: (register.allRows ?? []).filter((row: Row) => row.acknowledgement_status === 'Re-Acknowledgement Required').slice(0, 8),
      safetyCriticalGaps: (register.allRows ?? []).filter((row: Row) => row.safety_critical_work_blocker).slice(0, 8),
      blockers: (register.allRows ?? []).filter((row: Row) => row.ptw_blocker || row.moc_blocker || row.pssr_blocker).slice(0, 8),
      currentVersionGaps: (register.allRows ?? []).filter((row: Row) => row.current_version_gap).slice(0, 8),
      recentCompleted: (register.allRows ?? []).filter((row: Row) => row.acknowledgement_status === 'Acknowledged' || row.acknowledgement_status === 'Verified').slice(0, 8),
      recentRejected: (register.allRows ?? []).filter((row: Row) => ['Rejected', 'Returned'].includes(row.acknowledgement_status)).slice(0, 8),
      recentRevisionImpacts: revisionImpact.rows,
      activeWaivers: waivers.rows.filter((row: Row) => row.approval_status === 'Approved')
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [requirements, assignments, impacts] = await Promise.all([
      this.scopedRequirements(user, query),
      this.scopedAssignments(user, query),
      this.safeMany<Row>(this.siteScoped(user, this.db.from('training_sop_ack_revision_impacts').select('*').eq('company_id', user.tenantId), query))
    ]);
    const workersAssigned = new Set(assignments.map((row) => row.worker_id).filter(Boolean)).size;
    return {
      totalRequirements: requirements.length,
      activeRequirements: requirements.filter((row) => row.requirement_status === 'Active').length,
      workersAssigned,
      pendingAcknowledgements: assignments.filter((row) => row.runtime_status === 'Pending' || row.acknowledgement_status === 'Pending').length,
      completedAcknowledgements: assignments.filter((row) => ['Acknowledged', 'Verified'].includes(row.runtime_status)).length,
      overdueAcknowledgements: assignments.filter((row) => row.runtime_overdue).length,
      reacknowledgementRequired: assignments.filter((row) => row.runtime_status === 'Re-Acknowledgement Required').length,
      currentVersionGaps: assignments.filter((row) => row.runtime_current_version_gap).length,
      supersededVersionAcknowledgements: assignments.filter((row) => row.runtime_current_version_gap && ['Acknowledged', 'Verified'].includes(row.acknowledgement_status)).length,
      safetyCriticalSopGaps: assignments.filter((row) => row.safety_critical_work_blocker && !['Acknowledged', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      ptwSopBlockers: assignments.filter((row) => row.ptw_blocker && !['Acknowledged', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      mocSopBlockers: assignments.filter((row) => row.moc_blocker && !['Acknowledged', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      pssrSopBlockers: assignments.filter((row) => row.pssr_blocker && !['Acknowledged', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      pendingVerification: assignments.filter((row) => row.verification_status === 'Pending').length,
      rejectedAcknowledgements: assignments.filter((row) => row.acknowledgement_status === 'Rejected').length,
      waiversActive: assignments.filter((row) => row.acknowledgement_status === 'Waived').length,
      sopsMissingAcknowledgementRule: 0,
      recentSopRevisionImpacts: impacts.length,
      matrixGapsFromSopAcknowledgements: assignments.filter((row) => row.matrix_gap_id || row.ptw_blocker || row.moc_blocker || row.pssr_blocker).length,
      competencyGapsFromSopAcknowledgements: assignments.filter((row) => row.competency_gap_id || row.safety_critical_work_blocker).length
    };
  }

  async dashboardBySite(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedAssignments(user, query);
    const sites = await this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId));
    const bySite = new Map(sites.map((site) => [site.id, site]));
    return Object.entries(this.groupBy(rows, 'site_id')).map(([siteId, items]) => ({
      siteId: siteId === 'null' ? null : siteId,
      siteName: bySite.get(siteId)?.name ?? (siteId === 'null' ? 'No site scope' : siteId),
      total: items.length,
      pending: items.filter((row) => row.runtime_status === 'Pending').length,
      completed: items.filter((row) => ['Acknowledged', 'Verified'].includes(row.runtime_status)).length,
      overdue: items.filter((row) => row.runtime_overdue).length,
      blockers: items.filter((row) => row.ptw_blocker || row.moc_blocker || row.pssr_blocker || row.safety_critical_work_blocker).length,
      readinessPercent: this.percent(items.filter((row) => ['Acknowledged', 'Verified', 'Waived'].includes(row.runtime_status)).length, items.length)
    }));
  }

  async dashboardByUnit(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedAssignments(user, query);
    const units = await this.safeMany<Row>(this.db.from('Unit').select('id,name,code').eq('tenantId', user.tenantId));
    const byUnit = new Map(units.map((unit) => [unit.id, unit]));
    return Object.entries(this.groupBy(rows, 'unit_id')).map(([unitId, items]) => ({
      unitId: unitId === 'null' ? null : unitId,
      unitName: byUnit.get(unitId)?.name ?? (unitId === 'null' ? 'No unit scope' : unitId),
      total: items.length,
      pending: items.filter((row) => row.runtime_status === 'Pending').length,
      completed: items.filter((row) => ['Acknowledged', 'Verified'].includes(row.runtime_status)).length,
      overdue: items.filter((row) => row.runtime_overdue).length,
      currentVersionGaps: items.filter((row) => row.runtime_current_version_gap).length
    }));
  }

  async requirements(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyRequirementFilters(await this.scopedRequirements(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, page, limit, total: allRows.length, summary: await this.dashboardSummary(user, query), filters: this.lookups(), savedViews: ['All Requirements', 'Active', 'Draft', 'Pending Review', 'Safety-Critical', 'PTW Blockers', 'MOC Blockers', 'PSSR Blockers', 'Archived'] };
  }

  async createRequirement(user: RequestUser, dto: Row) {
    this.validateRequirement(user, dto, false);
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    await this.assertUniqueRequirementCode(user, dto.requirementCode ?? dto.requirement_code, siteId);
    const now = new Date().toISOString();
    const row = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      requirement_code: String(dto.requirementCode ?? dto.requirement_code).trim(),
      requirement_title: String(dto.requirementTitle ?? dto.requirement_title).trim(),
      description: dto.description,
      requirement_source: dto.requirementSource ?? dto.requirement_source ?? 'Manual',
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      requirement_status: dto.requirementStatus ?? dto.requirement_status ?? 'Draft',
      review_status: dto.reviewStatus ?? dto.review_status ?? 'Draft',
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      sop_id: dto.sopId ?? dto.sop_id,
      document_id: dto.documentId ?? dto.document_id,
      sop_title: dto.sopTitle ?? dto.sop_title ?? dto.documentTitle,
      document_number: dto.documentNumber ?? dto.document_number,
      required_version: dto.requiredVersion ?? dto.required_version,
      revision_number: dto.revisionNumber ?? dto.revision_number,
      current_version_at_requirement: dto.currentVersionAtRequirement ?? dto.current_version_at_requirement ?? dto.requiredVersion ?? dto.required_version,
      current_version_policy: dto.currentVersionPolicy ?? dto.current_version_policy ?? 'Current approved version only',
      document_status: dto.documentStatus ?? dto.document_status,
      document_owner: dto.documentOwner ?? dto.document_owner,
      document_url: dto.documentUrl ?? dto.document_url,
      safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical),
      psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical),
      ptw_critical: Boolean(dto.ptwCritical ?? dto.ptw_critical),
      moc_critical: Boolean(dto.mocCritical ?? dto.moc_critical),
      pssr_critical: Boolean(dto.pssrCritical ?? dto.pssr_critical),
      blocks_ptw_authorization: Boolean(dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization),
      blocks_moc_implementation: Boolean(dto.blocksMocImplementation ?? dto.blocks_moc_implementation),
      blocks_pssr_startup: Boolean(dto.blocksPssrStartup ?? dto.blocks_pssr_startup),
      blocks_safety_critical_work: Boolean(dto.blocksSafetyCriticalWork ?? dto.blocks_safety_critical_work),
      creates_action_if_missing: Boolean(dto.createsActionIfMissing ?? dto.creates_action_if_missing),
      sends_notification_if_missing: dto.sendsNotificationIfMissing ?? dto.sends_notification_if_missing ?? true,
      escalates_if_overdue: Boolean(dto.escalatesIfOverdue ?? dto.escalates_if_overdue),
      gap_severity: dto.gapSeverity ?? dto.gap_severity,
      waiver_allowed: dto.waiverAllowed ?? dto.waiver_allowed ?? true,
      waiver_approval_role: dto.waiverApprovalRole ?? dto.waiver_approval_role,
      temporary_waiver_max_duration_days: this.numberOrNull(dto.temporaryWaiverMaxDurationDays ?? dto.temporary_waiver_max_duration_days),
      sync_to_matrix: dto.syncToMatrix ?? dto.sync_to_matrix ?? true,
      sync_to_competency: dto.syncToCompetency ?? dto.sync_to_competency ?? true,
      sync_status: dto.syncStatus ?? dto.sync_status ?? 'Not Synced',
      required_training_item_id: dto.requiredTrainingItemId ?? dto.required_training_item_id,
      matrix_rule_id: dto.matrixRuleId ?? dto.matrix_rule_id,
      competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id,
      competency_requirement_id: dto.competencyRequirementId ?? dto.competency_requirement_id,
      training_record_id: dto.trainingRecordId ?? dto.training_record_id,
      assessment_id: dto.assessmentId ?? dto.assessment_id,
      notes: dto.notes,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now
    });
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').insert(row).select().single()), 'SOP acknowledgement requirement was not returned by the database.');
    await this.upsertRequirementChildren(user, inserted, dto);
    await this.writeHistory(user, 'Created', 'SOP acknowledgement requirement created', null, inserted, { requirement_id: inserted.id, site_id: inserted.site_id });
    if (['Active', 'Approved'].includes(inserted.requirement_status) && (dto.autoGenerateAssignments ?? dto.auto_generate_assignments ?? true)) await this.generateAssignments(user, inserted.id, { reason: 'Generated during requirement activation' });
    return this.requirementDetail(user, inserted.id);
  }

  async requirementDetail(user: RequestUser, requirementId: string) {
    const requirement = await this.assertRequirement(user, requirementId);
    const [scopes, dueRules, evidenceRules, links, assignments, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_sop_ack_requirement_scopes').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId)),
      this.safeMany<Row>(this.db.from('training_sop_ack_due_rules').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId)),
      this.safeMany<Row>(this.db.from('training_sop_ack_evidence_rules').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId)),
      this.safeMany<Row>(this.db.from('training_sop_ack_links').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId).is('removed_at', null)),
      this.assignments(user, { requirementId, limit: 100 }),
      this.history(user, { requirementId, limit: 20 })
    ]);
    return { requirement, scopes, dueRules, evidenceRules, links, assignments: assignments.rows, history: history.rows, preview: await this.previewAffectedWorkers(user, requirementId, {}) };
  }

  async updateRequirement(user: RequestUser, requirementId: string, dto: Row) {
    const before = await this.assertRequirement(user, requirementId);
    if (['Archived', 'Superseded'].includes(before.requirement_status)) throw new BadRequestException('Archived or superseded SOP acknowledgement requirements cannot be edited.');
    this.validateRequirement(user, { ...before, ...dto }, true);
    const siteId = dto.siteId ?? dto.site_id ?? before.site_id;
    if (siteId) this.assertSiteAccess(user, siteId);
    const payload = this.compact({
      site_id: siteId,
      requirement_code: dto.requirementCode ?? dto.requirement_code,
      requirement_title: dto.requirementTitle ?? dto.requirement_title,
      description: dto.description,
      requirement_source: dto.requirementSource ?? dto.requirement_source,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      requirement_status: dto.requirementStatus ?? dto.requirement_status,
      review_status: dto.reviewStatus ?? dto.review_status,
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      sop_id: dto.sopId ?? dto.sop_id,
      document_id: dto.documentId ?? dto.document_id,
      sop_title: dto.sopTitle ?? dto.sop_title ?? dto.documentTitle,
      document_number: dto.documentNumber ?? dto.document_number,
      required_version: dto.requiredVersion ?? dto.required_version,
      revision_number: dto.revisionNumber ?? dto.revision_number,
      current_version_at_requirement: dto.currentVersionAtRequirement ?? dto.current_version_at_requirement,
      current_version_policy: dto.currentVersionPolicy ?? dto.current_version_policy,
      document_status: dto.documentStatus ?? dto.document_status,
      document_owner: dto.documentOwner ?? dto.document_owner,
      document_url: dto.documentUrl ?? dto.document_url,
      safety_critical: dto.safetyCritical ?? dto.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical,
      ptw_critical: dto.ptwCritical ?? dto.ptw_critical,
      moc_critical: dto.mocCritical ?? dto.moc_critical,
      pssr_critical: dto.pssrCritical ?? dto.pssr_critical,
      blocks_ptw_authorization: dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization,
      blocks_moc_implementation: dto.blocksMocImplementation ?? dto.blocks_moc_implementation,
      blocks_pssr_startup: dto.blocksPssrStartup ?? dto.blocks_pssr_startup,
      blocks_safety_critical_work: dto.blocksSafetyCriticalWork ?? dto.blocks_safety_critical_work,
      creates_action_if_missing: dto.createsActionIfMissing ?? dto.creates_action_if_missing,
      sends_notification_if_missing: dto.sendsNotificationIfMissing ?? dto.sends_notification_if_missing,
      escalates_if_overdue: dto.escalatesIfOverdue ?? dto.escalates_if_overdue,
      gap_severity: dto.gapSeverity ?? dto.gap_severity,
      waiver_allowed: dto.waiverAllowed ?? dto.waiver_allowed,
      waiver_approval_role: dto.waiverApprovalRole ?? dto.waiver_approval_role,
      temporary_waiver_max_duration_days: this.numberOrNull(dto.temporaryWaiverMaxDurationDays ?? dto.temporary_waiver_max_duration_days),
      sync_to_matrix: dto.syncToMatrix ?? dto.sync_to_matrix,
      sync_to_competency: dto.syncToCompetency ?? dto.sync_to_competency,
      sync_status: dto.syncStatus ?? dto.sync_status,
      required_training_item_id: dto.requiredTrainingItemId ?? dto.required_training_item_id,
      matrix_rule_id: dto.matrixRuleId ?? dto.matrix_rule_id,
      competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id,
      competency_requirement_id: dto.competencyRequirementId ?? dto.competency_requirement_id,
      training_record_id: dto.trainingRecordId ?? dto.training_record_id,
      assessment_id: dto.assessmentId ?? dto.assessment_id,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').update(payload).eq('company_id', user.tenantId).eq('id', requirementId).select().single()), 'Updated SOP acknowledgement requirement was not returned by the database.');
    await this.upsertRequirementChildren(user, row, dto);
    await this.writeHistory(user, 'Updated', 'SOP acknowledgement requirement updated', before, row, { requirement_id: row.id, site_id: row.site_id });
    return this.requirementDetail(user, row.id);
  }

  async archiveRequirement(user: RequestUser, requirementId: string, dto: Row = {}) {
    const before = await this.assertRequirement(user, requirementId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').update({ requirement_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? dto.archiveReason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', requirementId).select().single()), 'Archived requirement was not returned by the database.');
    await this.writeHistory(user, 'Archived', 'SOP acknowledgement requirement archived', before, row, { requirement_id: row.id, reason: dto.reason ?? null });
    return row;
  }

  async reactivateRequirement(user: RequestUser, requirementId: string, dto: Row = {}) {
    const before = await this.assertRequirement(user, requirementId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').update({ requirement_status: dto.requirementStatus ?? 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', requirementId).select().single()), 'Reactivated requirement was not returned by the database.');
    await this.writeHistory(user, 'Reactivated', 'SOP acknowledgement requirement reactivated', before, row, { requirement_id: row.id, reason: dto.reason ?? null });
    return row;
  }

  async activateRequirement(user: RequestUser, requirementId: string, dto: Row = {}) {
    const before = await this.assertRequirement(user, requirementId);
    this.validateRequirement(user, before, true);
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').update({ requirement_status: 'Active', review_status: before.safety_critical ? (dto.reviewStatus ?? 'Approved') : (before.review_status ?? 'Approved'), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', requirementId).select().single()), 'Activated requirement was not returned by the database.');
    await this.writeHistory(user, 'Activated', 'SOP acknowledgement requirement activated', before, row, { requirement_id: row.id });
    const generated = dto.generateAssignments === false ? null : await this.generateAssignments(user, requirementId, { reason: dto.reason ?? 'Generated during activation' });
    return { requirement: row, generated };
  }

  async previewAffectedWorkers(user: RequestUser, requirementId: string, query: Row = {}) {
    const requirement = await this.assertRequirement(user, requirementId);
    const workers = await this.affectedWorkers(user, requirement, query);
    return {
      requirementId,
      estimatedAffectedWorkers: workers.length,
      workers: workers.slice(0, Math.min(Number(query.limit ?? 50), 100)),
      warnings: requirement.safety_critical && !requirement.owner_user_id ? ['Safety-critical requirement is missing an owner.'] : [],
      blockers: !requirement.sop_id && !requirement.document_id ? ['Active requirement needs an SOP or Document Control link.'] : []
    };
  }

  async generateAssignments(user: RequestUser, requirementId: string, dto: Row = {}) {
    const requirement = await this.assertRequirement(user, requirementId);
    if (!['Active', 'Approved'].includes(requirement.requirement_status)) throw new BadRequestException('Assignments can only be generated for active or approved SOP acknowledgement requirements.');
    const settings = await this.settings(user, { siteId: requirement.site_id });
    const workers = await this.affectedWorkers(user, requirement, dto);
    const dueRules = await this.safeMany<Row>(this.db.from('training_sop_ack_due_rules').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId).limit(1));
    const dueRule = dueRules[0] ?? {};
    const evidence = (await this.safeMany<Row>(this.db.from('training_sop_ack_evidence_rules').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirementId).limit(1)))[0] ?? {};
    const rows = workers.map((worker) => this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: worker.primary_site_id ?? requirement.site_id,
      unit_id: worker.primary_unit_id ?? worker.current_role_assignment?.unit_id,
      area_id: worker.primary_area_id ?? worker.current_role_assignment?.area_id,
      worker_id: worker.id,
      requirement_id: requirement.id,
      sop_id: requirement.sop_id,
      document_id: requirement.document_id,
      required_version: requirement.required_version,
      current_version_at_assignment: requirement.current_version_at_requirement ?? requirement.required_version,
      assignment_source: dto.assignmentSource ?? 'Requirement generation',
      required_because: dto.reason ?? this.requiredBecause(requirement, worker),
      due_date: this.calculateDueDate(requirement, dueRule, settings),
      expiry_date: null,
      assignment_status: 'Assigned',
      acknowledgement_status: 'Pending',
      verification_status: evidence.supervisor_verification_required || evidence.hse_verification_required || evidence.approval_required ? 'Pending' : 'Not Required',
      esignature_status: evidence.esign_required ? 'Required' : 'Not Required',
      assessment_status: evidence.assessment_required ? 'Required' : 'Not Required',
      overdue: false,
      current_version_gap: false,
      ptw_blocker: Boolean(requirement.blocks_ptw_authorization),
      moc_blocker: Boolean(requirement.blocks_moc_implementation),
      pssr_blocker: Boolean(requirement.blocks_pssr_startup),
      safety_critical_work_blocker: Boolean(requirement.blocks_safety_critical_work),
      assigned_by: user.id
    }));
    const inserted = rows.length ? await this.safeMany<Row>(this.db.from('training_sop_ack_assignments').upsert(rows, { onConflict: 'company_id,worker_id,requirement_id' }).select()) : [];
    await Promise.all(inserted.map((row) => this.updateWorkerSopStatus(user, row.worker_id).catch(() => null)));
    const run = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_evaluation_runs').insert({ id: randomUUID(), company_id: user.tenantId, site_id: requirement.site_id, run_scope: 'Requirement', scope_record_id: requirement.id, triggered_by_type: 'User', triggered_by_user_id: user.id, status: 'Completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString(), total_workers: workers.length, evaluated_workers: workers.length, assignments_created: inserted.length, result_summary_json: { requirement_id: requirement.id, worker_ids: workers.map((worker) => worker.id) } }).select().single()), 'SOP acknowledgement generation run was not returned by the database.');
    await this.writeHistory(user, 'Assigned', 'SOP acknowledgement assignments generated', null, { count: inserted.length, run }, { requirement_id: requirement.id, site_id: requirement.site_id });
    return { run, rows: inserted, totalWorkers: workers.length, assignmentsCreated: inserted.length };
  }

  async evaluateRequirement(user: RequestUser, requirementId: string, dto: Row = {}) {
    const result = await this.generateAssignments(user, requirementId, { ...dto, reason: dto.reason ?? 'Evaluation run' });
    await this.writeHistory(user, 'Evaluated', 'SOP acknowledgement requirement evaluated', null, result, { requirement_id: requirementId });
    return result;
  }

  async assignments(user: RequestUser, query: Row = {}) {
    let rows = this.sortRows(this.applyAssignmentFilters(await this.scopedAssignments(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = rows;
    rows = rows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit, summary: this.assignmentSummary(allRows), filters: this.lookups(), savedViews: ['All Assignments', 'Pending', 'Overdue', 'Completed', 'Re-Acknowledgement Required', 'Current Version Gaps', 'Safety-Critical', 'PTW Blockers', 'MOC Blockers', 'PSSR Blockers', 'Pending Verification', 'Waived'] };
  }

  async assignmentDetail(user: RequestUser, assignmentId: string) {
    const assignment = await this.assertAssignment(user, assignmentId);
    const [acknowledgements, waivers, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_sop_acknowledgements').select('*').eq('company_id', user.tenantId).eq('assignment_id', assignmentId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_sop_ack_waivers').select('*').eq('company_id', user.tenantId).eq('assignment_id', assignmentId).order('created_at', { ascending: false })),
      this.history(user, { assignmentId, limit: 25 })
    ]);
    return { assignment, acknowledgements, waivers, history: history.rows };
  }

  async sendReminder(user: RequestUser, assignmentId: string, dto: Row = {}) {
    const before = await this.assertAssignment(user, assignmentId);
    const row = await this.updateAssignment(user, before, { last_notification_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'Notification Sent', dto.message ?? 'SOP acknowledgement reminder sent through Notification Center adapter');
    return { assignment: row, notification: { adapter: 'Notification Center', status: 'Queued / adapter pending', message: dto.message ?? null } };
  }

  async cancelAssignment(user: RequestUser, assignmentId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Cancellation reason is required.');
    const before = await this.assertAssignment(user, assignmentId);
    return this.updateAssignment(user, before, { assignment_status: 'Cancelled', acknowledgement_status: 'Cancelled', cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason, updated_at: new Date().toISOString() }, 'Cancelled', 'SOP acknowledgement assignment cancelled');
  }

  async requestReacknowledgement(user: RequestUser, assignmentId: string, dto: Row = {}) {
    const before = await this.assertAssignment(user, assignmentId);
    return this.updateAssignment(user, before, { assignment_status: 'Assigned', acknowledgement_status: 'Re-Acknowledgement Required', current_version_gap: true, last_notification_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'Re-Acknowledgement Requested', dto.reason ?? 'SOP re-acknowledgement requested');
  }

  async acknowledge(user: RequestUser, assignmentId: string, dto: Row = {}) {
    const assignment = await this.assertAssignment(user, assignmentId);
    const requirement = await this.assertRequirement(user, assignment.requirement_id);
    const evidence = (await this.safeMany<Row>(this.db.from('training_sop_ack_evidence_rules').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirement.id).limit(1)))[0] ?? {};
    const version = dto.acknowledgedVersion ?? dto.acknowledged_version ?? assignment.required_version ?? requirement.required_version ?? requirement.current_version_at_requirement;
    this.requireText(version, 'Acknowledged SOP/document version is required.');
    if (!this.versionSatisfiesRequirement(requirement, String(version), dto.overrideReason ?? dto.override_reason)) {
      throw new BadRequestException('Worker cannot acknowledge a wrong or superseded SOP/document version without an authorized override reason.');
    }
    const pendingAssessment = Boolean(evidence.assessment_required) && !['Passed', 'Verified Passed'].includes(String(dto.assessmentStatus ?? dto.assessment_status ?? ''));
    const pendingVerification = Boolean(evidence.supervisor_verification_required || evidence.hse_verification_required || evidence.approval_required);
    const pendingEsign = Boolean(evidence.esign_required) && !['Signed', 'Completed'].includes(String(dto.esignatureStatus ?? dto.esignature_status ?? ''));
    const status = pendingAssessment ? 'Acknowledged Pending Assessment' : pendingVerification ? 'Acknowledged Pending Verification' : pendingEsign ? 'Acknowledged Pending Verification' : 'Acknowledged';
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_acknowledgements').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: assignment.site_id,
      unit_id: assignment.unit_id,
      area_id: assignment.area_id,
      worker_id: assignment.worker_id,
      assignment_id: assignment.id,
      requirement_id: requirement.id,
      sop_id: requirement.sop_id,
      document_id: requirement.document_id,
      acknowledged_version: version,
      current_version_at_acknowledgement: requirement.current_version_at_requirement ?? requirement.required_version,
      declaration_text: dto.declarationText ?? dto.declaration_text ?? evidence.declaration_text ?? 'I have read and understood the current approved SOP/procedure.',
      acknowledgement_method: dto.acknowledgementMethod ?? dto.acknowledgement_method ?? evidence.acknowledgement_method ?? 'Click acknowledge',
      acknowledgement_status: status,
      acknowledged_by_user_id: user.id,
      acknowledged_at: new Date().toISOString(),
      ip_address: dto.ipAddress ?? dto.ip_address ?? null,
      user_agent: dto.userAgent ?? dto.user_agent ?? null,
      esignature_id: dto.esignatureId ?? dto.esignature_id ?? null,
      esignature_status: dto.esignatureStatus ?? dto.esignature_status ?? (evidence.esign_required ? 'Required' : 'Not Required'),
      assessment_id: dto.assessmentId ?? dto.assessment_id ?? evidence.assessment_id ?? null,
      assessment_result_id: dto.assessmentResultId ?? dto.assessment_result_id ?? null,
      assessment_status: dto.assessmentStatus ?? dto.assessment_status ?? (evidence.assessment_required ? 'Required' : 'Not Required'),
      evidence_document_id: dto.evidenceDocumentId ?? dto.evidence_document_id ?? null,
      verification_status: pendingVerification || pendingEsign ? 'Pending' : 'Not Required',
      source_snapshot_json: { requirement, assignment, evidenceRule: evidence, document: { sop_title: requirement.sop_title, document_number: requirement.document_number, document_status: requirement.document_status, required_version: requirement.required_version } }
    }).select().single()), 'SOP acknowledgement record was not returned by the database.');
    await this.updateAssignment(user, assignment, { acknowledgement_status: status, assignment_status: status, verification_status: row.verification_status, esignature_status: row.esignature_status, assessment_status: row.assessment_status, current_version_gap: false, completed_at: ['Acknowledged', 'Verified'].includes(status) ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, 'Acknowledged', 'Worker acknowledged SOP/document version');
    await this.updateWorkerSopStatus(user, assignment.worker_id);
    return row;
  }

  async acknowledgementDetail(user: RequestUser, acknowledgementId: string) {
    const acknowledgement = await this.assertAcknowledgement(user, acknowledgementId);
    const [assignment, requirement, history, waivers] = await Promise.all([
      this.assertAssignment(user, acknowledgement.assignment_id),
      this.assertRequirement(user, acknowledgement.requirement_id),
      this.history(user, { acknowledgementId, limit: 30 }),
      this.waivers(user, { assignmentId: acknowledgement.assignment_id, limit: 25 })
    ]);
    return { acknowledgement, assignment, requirement, history: history.rows, waivers: waivers.rows };
  }

  async verifyAcknowledgement(user: RequestUser, acknowledgementId: string, dto: Row = {}) {
    const before = await this.assertAcknowledgement(user, acknowledgementId);
    const row = await this.updateAcknowledgement(user, before, { acknowledgement_status: 'Verified', verification_status: 'Verified', verified_by: user.id, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'Verified', dto.reason ?? 'SOP acknowledgement verified');
    await this.updateWorkerSopStatus(user, row.worker_id);
    return row;
  }

  async rejectAcknowledgement(user: RequestUser, acknowledgementId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Rejection reason is required.');
    const before = await this.assertAcknowledgement(user, acknowledgementId);
    return this.updateAcknowledgement(user, before, { acknowledgement_status: 'Rejected', verification_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, updated_at: new Date().toISOString() }, 'Rejected', 'SOP acknowledgement rejected');
  }

  async returnAcknowledgement(user: RequestUser, acknowledgementId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Return reason is required.');
    const before = await this.assertAcknowledgement(user, acknowledgementId);
    return this.updateAcknowledgement(user, before, { acknowledgement_status: 'Returned', verification_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: dto.reason, updated_at: new Date().toISOString() }, 'Returned', 'SOP acknowledgement returned for correction');
  }

  async reopenAcknowledgement(user: RequestUser, acknowledgementId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.assertAcknowledgement(user, acknowledgementId);
    return this.updateAcknowledgement(user, before, { acknowledgement_status: 'Reopened', verification_status: 'Pending', reopened_by: user.id, reopened_at: new Date().toISOString(), reopen_reason: dto.reason, updated_at: new Date().toISOString() }, 'Reopened', 'SOP acknowledgement reopened through controlled correction workflow');
  }

  pending(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'pending' }); }
  overdue(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'overdue' }); }
  completed(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'completed' }); }
  reacknowledgementRequired(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'reacknowledgement-required' }); }
  currentVersionGaps(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'current-version-gaps' }); }
  safetyCritical(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'safety-critical' }); }
  ptwBlockers(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'ptw-blockers' }); }
  mocBlockers(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'moc-blockers' }); }
  pssrBlockers(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'pssr-blockers' }); }
  verification(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, verificationStatus: query.verificationStatus ?? 'Pending' }); }
  workerAcknowledgements(user: RequestUser, workerId: string, query: Row = {}) { return this.assignments(user, { ...query, workerId }); }
  workerPending(user: RequestUser, workerId: string, query: Row = {}) { return this.assignments(user, { ...query, workerId, statusView: 'pending' }); }
  sopAcknowledgements(user: RequestUser, sopId: string, query: Row = {}) { return this.assignments(user, { ...query, sopId }); }
  documentAcknowledgements(user: RequestUser, documentId: string, query: Row = {}) { return this.assignments(user, { ...query, documentId }); }
  scopedSite(user: RequestUser, siteId: string, query: Row = {}) { this.assertSiteAccess(user, siteId); return this.assignments(user, { ...query, siteId }); }
  scopedUnit(user: RequestUser, unitId: string, query: Row = {}) { return this.assignments(user, { ...query, unitId }); }
  scopedArea(user: RequestUser, areaId: string, query: Row = {}) { return this.assignments(user, { ...query, areaId }); }

  async detectRevisionImpact(user: RequestUser, dto: Row = {}) {
    const requirementId = dto.requirementId ?? dto.requirement_id ?? null;
    const requirement = requirementId ? await this.assertRequirement(user, requirementId) : null;
    const assignments = requirement ? await this.scopedAssignments(user, { requirementId }) : await this.scopedAssignments(user, dto);
    const impacted = assignments.filter((row) => row.required_version && (dto.newVersion ?? dto.new_version) && row.required_version !== (dto.newVersion ?? dto.new_version));
    if (impacted.length) {
      await this.safeMany(this.db.from('training_sop_ack_assignments').update({ acknowledgement_status: 'Re-Acknowledgement Required', assignment_status: 'Assigned', current_version_gap: true, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).in('id', impacted.map((row) => row.id)).select());
    }
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_revision_impacts').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: requirement?.site_id ?? dto.siteId ?? dto.site_id ?? null,
      requirement_id: requirement?.id ?? null,
      sop_id: dto.sopId ?? dto.sop_id ?? requirement?.sop_id ?? null,
      document_id: dto.documentId ?? dto.document_id ?? requirement?.document_id ?? null,
      old_version: dto.oldVersion ?? dto.old_version ?? requirement?.required_version ?? null,
      new_version: dto.newVersion ?? dto.new_version ?? null,
      revision_type: dto.revisionType ?? dto.revision_type ?? 'SOP/document revision',
      revision_reason: dto.reason ?? dto.revisionReason ?? dto.revision_reason ?? null,
      significant_change: Boolean(dto.significantChange ?? dto.significant_change),
      reacknowledgement_required: impacted.length > 0,
      impacted_assignment_count: impacted.length,
      impacted_worker_count: new Set(impacted.map((item) => item.worker_id)).size,
      matrix_impacted: impacted.some((item) => item.ptw_blocker || item.moc_blocker || item.pssr_blocker),
      competency_impacted: impacted.some((item) => item.safety_critical_work_blocker),
      ptw_impacted: impacted.some((item) => item.ptw_blocker),
      moc_impacted: impacted.some((item) => item.moc_blocker),
      pssr_impacted: impacted.some((item) => item.pssr_blocker),
      triggered_by_module: dto.triggeredByModule ?? dto.triggered_by_module ?? 'Manual',
      triggered_by_record_id: dto.triggeredByRecordId ?? dto.triggered_by_record_id ?? null
    }).select().single()), 'Revision impact record was not returned by the database.');
    await this.writeHistory(user, 'Revision Impact Detected', 'SOP revision impact detected', null, row, { requirement_id: row.requirement_id, site_id: row.site_id });
    return row;
  }

  async revisionImpact(user: RequestUser, query: Row = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let req: any = this.siteScoped(user, this.db.from('training_sop_ack_revision_impacts').select('*').eq('company_id', user.tenantId), query);
    if (query.requirementId) req = req.eq('requirement_id', query.requirementId);
    if (query.sopId) req = req.eq('sop_id', query.sopId);
    if (query.documentId) req = req.eq('document_id', query.documentId);
    const rows = await this.safeMany<Row>(req.order('detected_at', { ascending: false }).limit(limit));
    return { rows, total: rows.length, lastUpdated: new Date().toISOString() };
  }

  async requestWaiver(user: RequestUser, assignmentId: string, dto: Row) {
    this.requireText(dto.waiverReason ?? dto.waiver_reason ?? dto.reason, 'Waiver reason is required.');
    const assignment = await this.assertAssignment(user, assignmentId);
    const requirement = await this.assertRequirement(user, assignment.requirement_id);
    if (!requirement.waiver_allowed) throw new BadRequestException('Waiver is not allowed for this SOP acknowledgement requirement.');
    const waiverType = dto.waiverType ?? dto.waiver_type ?? 'Temporary';
    if (waiverType === 'Temporary') this.requireText(dto.expiryDate ?? dto.expiry_date, 'Temporary waiver expiry date is required.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_waivers').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: assignment.site_id,
      worker_id: assignment.worker_id,
      assignment_id: assignment.id,
      requirement_id: assignment.requirement_id,
      waiver_type: waiverType,
      waiver_reason: dto.waiverReason ?? dto.waiver_reason ?? dto.reason,
      risk_justification: dto.riskJustification ?? dto.risk_justification ?? null,
      compensating_control: dto.compensatingControl ?? dto.compensating_control ?? null,
      expiry_date: dto.expiryDate ?? dto.expiry_date ?? null,
      linked_moc_id: dto.linkedMocId ?? dto.linked_moc_id ?? null,
      linked_pssr_id: dto.linkedPssrId ?? dto.linked_pssr_id ?? null,
      linked_ptw_id: dto.linkedPtwId ?? dto.linked_ptw_id ?? null,
      evidence_document_id: dto.evidenceDocumentId ?? dto.evidence_document_id ?? null,
      approval_status: 'Requested',
      e_signature_status: requirement.safety_critical ? 'Required if approved' : 'Not Required',
      created_by: user.id
    }).select().single()), 'SOP acknowledgement waiver was not returned by the database.');
    await this.updateAssignment(user, assignment, { waiver_id: row.id, updated_at: new Date().toISOString() }, 'Waiver Requested', 'SOP acknowledgement waiver requested');
    return row;
  }

  async waivers(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let req: any = this.siteScoped(user, this.db.from('training_sop_ack_waivers').select('*').eq('company_id', user.tenantId), query);
    if (query.assignmentId) req = req.eq('assignment_id', query.assignmentId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.status) req = req.eq('approval_status', query.status);
    const allRows = await this.safeMany<Row>(req.order('created_at', { ascending: false }));
    return { rows: allRows.slice((page - 1) * limit, page * limit), allRows, page, limit, total: allRows.length, filters: this.lookups() };
  }

  async decideWaiver(user: RequestUser, waiverId: string, decision: 'Approved' | 'Rejected' | 'Revoked', dto: Row = {}) {
    const before = await this.assertWaiver(user, waiverId);
    if (['Rejected', 'Revoked'].includes(decision)) this.requireText(dto.reason, `${decision} reason is required.`);
    const update = decision === 'Approved'
      ? { approval_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, updated_at: new Date().toISOString() }
        : { approval_status: 'Revoked', revoked_by: user.id, revoked_at: new Date().toISOString(), revoke_reason: dto.reason, updated_at: new Date().toISOString() };
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_waivers').update(update).eq('company_id', user.tenantId).eq('id', waiverId).select().single()), 'Updated waiver was not returned by the database.');
    if (decision === 'Approved') {
      const assignment = await this.assertAssignment(user, row.assignment_id);
      await this.updateAssignment(user, assignment, { acknowledgement_status: 'Waived', assignment_status: 'Waived', waiver_id: row.id, updated_at: new Date().toISOString() }, 'Waived', 'SOP acknowledgement waiver approved');
    }
    await this.writeHistory(user, `Waiver ${decision}`, `SOP acknowledgement waiver ${decision.toLowerCase()}`, before, row, { waiver_id: row.id, assignment_id: row.assignment_id, worker_id: row.worker_id });
    return row;
  }

  importTemplate() {
    return {
      requirementColumns: ['requirement_code', 'requirement_title', 'requirement_source', 'sop_reference', 'document_number', 'required_version', 'current_version_policy', 'site_code', 'unit_code', 'area_code', 'department_code', 'job_role', 'worker_type', 'employer_type', 'contractor_company', 'ptw_role', 'due_days_after_assignment', 'reacknowledge_on_sop_revision', 'esign_required', 'assessment_required', 'assessment_code', 'supervisor_verification_required', 'hse_verification_required', 'safety_critical', 'psm_critical', 'ptw_critical', 'moc_critical', 'pssr_critical', 'blocks_ptw_authorization', 'blocks_moc_implementation', 'blocks_pssr_startup', 'waiver_allowed', 'owner_email', 'active'],
      completionColumns: ['worker_identifier', 'worker_email', 'employee_id', 'contractor_id', 'requirement_code', 'sop_reference', 'document_number', 'acknowledged_version', 'acknowledged_at', 'acknowledgement_method', 'esignature_reference', 'assessment_result_reference', 'verification_status', 'notes'],
      lookups: this.lookups()
    };
  }

  async importRows(user: RequestUser, dto: Row = {}) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const errors: Row[] = [];
    const created: Row[] = [];
    for (const [index, row] of rows.entries()) {
      try {
        if (row.requirement_code || row.requirementCode) {
          created.push(await this.createRequirement(user, this.mapImportRequirement(row)));
        } else {
          errors.push({ row: index + 1, message: 'Row is missing requirement_code. Completion import is validated but not committed without a matching assignment.' });
        }
      } catch (error) {
        errors.push({ row: index + 1, message: error instanceof Error ? error.message : String(error) });
      }
    }
    await this.writeHistory(user, 'Imported', 'SOP acknowledgement import processed', null, { created: created.length, errors }, {});
    return { created, errors, valid: errors.length === 0, importedAt: new Date().toISOString() };
  }

  async exportRows(user: RequestUser, query: Row = {}) {
    const data = query.type === 'requirements' ? await this.requirements(user, { ...query, limit: 100 }) : await this.assignments(user, { ...query, limit: 100 });
    await this.writeHistory(user, 'Exported', 'SOP acknowledgement export requested', null, { query, rows: data.rows?.length ?? 0 }, {});
    return { exportType: query.format ?? 'csv', generatedAt: new Date().toISOString(), data };
  }

  async history(user: RequestUser, query: Row = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let req: any = this.siteScoped(user, this.db.from('training_sop_ack_history_events').select('*').eq('company_id', user.tenantId), query);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.requirementId) req = req.eq('requirement_id', query.requirementId);
    if (query.assignmentId) req = req.eq('assignment_id', query.assignmentId);
    if (query.acknowledgementId) req = req.eq('acknowledgement_id', query.acknowledgementId);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }).limit(limit));
    return { rows, total: rows.length, lastUpdated: new Date().toISOString() };
  }

  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    let req: any = this.db.from('training_sop_ack_settings').select('*').eq('company_id', user.tenantId);
    req = siteId ? req.or(`site_id.is.null,site_id.eq.${siteId}`) : req.is('site_id', null);
    const rows = await this.safeMany<Row>(req.order('site_id', { ascending: false }).limit(1));
    return rows[0] ?? {
      company_id: user.tenantId,
      site_id: siteId,
      default_due_days_after_assignment: 14,
      default_reminder_days_before_due: 7,
      default_reacknowledge_on_major_revision: true,
      require_esign_for_safety_critical_sop: true,
      require_verification_for_safety_critical_sop: false,
      require_assessment_for_critical_sop: false,
      auto_generate_assignments_on_requirement_activation: true,
      auto_reacknowledge_on_sop_revision: true,
      auto_update_matrix_on_acknowledgement: true,
      auto_update_competency_on_acknowledgement: true,
      auto_notify_workers: true,
      auto_notify_supervisors_on_overdue: true,
      auto_create_actions_for_overdue_critical: false,
      block_ptw_on_missing_sop_ack: true,
      block_moc_on_missing_sop_ack: true,
      block_pssr_on_missing_sop_ack: true,
      allow_safety_critical_waivers: false,
      require_esign_for_blocker_waiver: true,
      settings_json: {}
    };
  }

  async updateSettings(user: RequestUser, dto: Row = {}) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    const before = await this.settings(user, { siteId });
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_settings').upsert({
      id: before.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      default_due_days_after_assignment: this.numberOrDefault(dto.defaultDueDaysAfterAssignment ?? dto.default_due_days_after_assignment, before.default_due_days_after_assignment ?? 14),
      default_reminder_days_before_due: this.numberOrDefault(dto.defaultReminderDaysBeforeDue ?? dto.default_reminder_days_before_due, before.default_reminder_days_before_due ?? 7),
      default_reacknowledge_on_major_revision: dto.defaultReacknowledgeOnMajorRevision ?? dto.default_reacknowledge_on_major_revision ?? before.default_reacknowledge_on_major_revision ?? true,
      require_esign_for_safety_critical_sop: dto.requireEsignForSafetyCriticalSop ?? dto.require_esign_for_safety_critical_sop ?? before.require_esign_for_safety_critical_sop ?? true,
      require_verification_for_safety_critical_sop: dto.requireVerificationForSafetyCriticalSop ?? dto.require_verification_for_safety_critical_sop ?? before.require_verification_for_safety_critical_sop ?? false,
      require_assessment_for_critical_sop: dto.requireAssessmentForCriticalSop ?? dto.require_assessment_for_critical_sop ?? before.require_assessment_for_critical_sop ?? false,
      auto_generate_assignments_on_requirement_activation: dto.autoGenerateAssignmentsOnRequirementActivation ?? dto.auto_generate_assignments_on_requirement_activation ?? before.auto_generate_assignments_on_requirement_activation ?? true,
      auto_reacknowledge_on_sop_revision: dto.autoReacknowledgeOnSopRevision ?? dto.auto_reacknowledge_on_sop_revision ?? before.auto_reacknowledge_on_sop_revision ?? true,
      auto_update_matrix_on_acknowledgement: dto.autoUpdateMatrixOnAcknowledgement ?? dto.auto_update_matrix_on_acknowledgement ?? before.auto_update_matrix_on_acknowledgement ?? true,
      auto_update_competency_on_acknowledgement: dto.autoUpdateCompetencyOnAcknowledgement ?? dto.auto_update_competency_on_acknowledgement ?? before.auto_update_competency_on_acknowledgement ?? true,
      auto_notify_workers: dto.autoNotifyWorkers ?? dto.auto_notify_workers ?? before.auto_notify_workers ?? true,
      auto_notify_supervisors_on_overdue: dto.autoNotifySupervisorsOnOverdue ?? dto.auto_notify_supervisors_on_overdue ?? before.auto_notify_supervisors_on_overdue ?? true,
      auto_create_actions_for_overdue_critical: dto.autoCreateActionsForOverdueCritical ?? dto.auto_create_actions_for_overdue_critical ?? before.auto_create_actions_for_overdue_critical ?? false,
      block_ptw_on_missing_sop_ack: dto.blockPtwOnMissingSopAck ?? dto.block_ptw_on_missing_sop_ack ?? before.block_ptw_on_missing_sop_ack ?? true,
      block_moc_on_missing_sop_ack: dto.blockMocOnMissingSopAck ?? dto.block_moc_on_missing_sop_ack ?? before.block_moc_on_missing_sop_ack ?? true,
      block_pssr_on_missing_sop_ack: dto.blockPssrOnMissingSopAck ?? dto.block_pssr_on_missing_sop_ack ?? before.block_pssr_on_missing_sop_ack ?? true,
      allow_safety_critical_waivers: dto.allowSafetyCriticalWaivers ?? dto.allow_safety_critical_waivers ?? before.allow_safety_critical_waivers ?? false,
      require_esign_for_blocker_waiver: dto.requireEsignForBlockerWaiver ?? dto.require_esign_for_blocker_waiver ?? before.require_esign_for_blocker_waiver ?? true,
      settings_json: dto.settingsJson ?? dto.settings_json ?? before.settings_json ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'company_id,site_id' }).select().single()), 'SOP acknowledgement settings were not returned by the database.');
    await this.writeHistory(user, 'Settings Updated', 'SOP acknowledgement settings updated', before, row, { site_id: siteId });
    return row;
  }

  lookups() {
    return {
      'sop-ack-requirement-sources': requirementSources,
      'sop-ack-requirement-statuses': requirementStatuses,
      'sop-version-policies': versionPolicies,
      'sop-ack-methods': ackMethods,
      'sop-ack-assignment-statuses': assignmentStatuses,
      'sop-ack-statuses': acknowledgementStatuses,
      'sop-ack-verification-statuses': verificationStatuses,
      'sop-ack-waiver-statuses': waiverStatuses
    };
  }

  lookup(name: string) {
    return { values: this.lookups()[name as keyof ReturnType<TrainingSopAcknowledgementService['lookups']>] ?? [] };
  }

  private async scopedRequirements(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_sop_ack_requirements').select('*').eq('company_id', user.tenantId), query);
    if (query.includeArchived !== 'true') req = req.is('archived_at', null);
    return this.safeMany<Row>(req);
  }

  private async scopedAssignments(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_sop_ack_assignments').select('*').eq('company_id', user.tenantId), query);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.requirementId) req = req.eq('requirement_id', query.requirementId);
    if (query.sopId) req = req.eq('sop_id', query.sopId);
    if (query.documentId) req = req.eq('document_id', query.documentId);
    if (query.unitId) req = req.eq('unit_id', query.unitId);
    if (query.areaId) req = req.eq('area_id', query.areaId);
    const rows = await this.safeMany<Row>(req);
    return this.hydrateAssignments(user, rows.map((row) => this.withRuntimeAssignmentStatus(row)));
  }

  private async hydrateAssignments(user: RequestUser, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return [];
    const workerIds = [...new Set(rows.map((row) => row.worker_id).filter(Boolean))];
    const requirementIds = [...new Set(rows.map((row) => row.requirement_id).filter(Boolean))];
    const [workers, requirements] = await Promise.all([
      workerIds.length ? this.safeMany<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).in('id', workerIds)) : [],
      requirementIds.length ? this.safeMany<Row>(this.db.from('training_sop_ack_requirements').select('*').eq('company_id', user.tenantId).in('id', requirementIds)) : []
    ]);
    const workerById = new Map(workers.map((worker) => [worker.id, worker]));
    const requirementById = new Map(requirements.map((req) => [req.id, req]));
    return rows.map((row): Row => ({ ...row, worker: workerById.get(row.worker_id) ?? null, requirement: requirementById.get(row.requirement_id) ?? null }));
  }

  private applyRequirementFilters(rows: Row[], query: Row) {
    return rows.filter((row) => {
      if (query.status && row.requirement_status !== query.status) return false;
      if (query.requirementSource && row.requirement_source !== query.requirementSource) return false;
      if (query.safetyCritical === 'true' && !row.safety_critical) return false;
      if (query.ptwBlocker === 'true' && !row.blocks_ptw_authorization) return false;
      if (query.mocBlocker === 'true' && !row.blocks_moc_implementation) return false;
      if (query.pssrBlocker === 'true' && !row.blocks_pssr_startup) return false;
      const search = String(query.search ?? '').toLowerCase();
      if (search && ![row.requirement_code, row.requirement_title, row.sop_title, row.document_number].some((value) => String(value ?? '').toLowerCase().includes(search))) return false;
      return true;
    });
  }

  private applyAssignmentFilters(rows: Row[], query: Row) {
    return rows.filter((row) => {
      if (query.verificationStatus && row.verification_status !== query.verificationStatus) return false;
      if (query.esignatureStatus && row.esignature_status !== query.esignatureStatus) return false;
      if (query.assessmentStatus && row.assessment_status !== query.assessmentStatus) return false;
      const view = query.statusView;
      if (view === 'pending' && !['Pending', 'Assigned', 'In Progress'].includes(row.runtime_status)) return false;
      if (view === 'overdue' && !row.runtime_overdue) return false;
      if (view === 'completed' && !['Acknowledged', 'Verified'].includes(row.runtime_status)) return false;
      if (view === 'reacknowledgement-required' && row.runtime_status !== 'Re-Acknowledgement Required') return false;
      if (view === 'current-version-gaps' && !row.runtime_current_version_gap) return false;
      if (view === 'safety-critical' && !row.safety_critical_work_blocker) return false;
      if (view === 'ptw-blockers' && !row.ptw_blocker) return false;
      if (view === 'moc-blockers' && !row.moc_blocker) return false;
      if (view === 'pssr-blockers' && !row.pssr_blocker) return false;
      const search = String(query.search ?? '').toLowerCase();
      if (search && ![row.required_because, row.required_version, row.worker?.display_name, row.requirement?.requirement_title, row.requirement?.sop_title].some((value) => String(value ?? '').toLowerCase().includes(search))) return false;
      return true;
    });
  }

  private withRuntimeAssignmentStatus(row: Row): Row {
    const now = new Date();
    const due = row.due_date ? new Date(`${row.due_date}T23:59:59`) : null;
    const overdue = Boolean(due && due.getTime() < now.getTime() && !['Acknowledged', 'Verified', 'Waived', 'Cancelled', 'Not Applicable'].includes(row.acknowledgement_status));
    const currentVersionGap = Boolean(row.current_version_gap);
    return {
      ...row,
      runtime_overdue: overdue,
      runtime_current_version_gap: currentVersionGap,
      runtime_status: overdue ? 'Overdue' : currentVersionGap ? 'Re-Acknowledgement Required' : row.acknowledgement_status
    };
  }

  private assignmentSummary(rows: Row[]) {
    return {
      total: rows.length,
      pending: rows.filter((row) => row.runtime_status === 'Pending').length,
      completed: rows.filter((row) => ['Acknowledged', 'Verified'].includes(row.runtime_status)).length,
      overdue: rows.filter((row) => row.runtime_overdue).length,
      currentVersionGaps: rows.filter((row) => row.runtime_current_version_gap).length,
      pendingVerification: rows.filter((row) => row.verification_status === 'Pending').length,
      rejected: rows.filter((row) => row.acknowledgement_status === 'Rejected').length,
      waived: rows.filter((row) => row.acknowledgement_status === 'Waived').length,
      blockers: rows.filter((row) => row.ptw_blocker || row.moc_blocker || row.pssr_blocker || row.safety_critical_work_blocker).length
    };
  }

  private async upsertRequirementChildren(user: RequestUser, requirement: Row, dto: Row) {
    const scopes = Array.isArray(dto.scopes) && dto.scopes.length ? dto.scopes : [this.defaultScope(requirement, dto)];
    await this.safeMany(this.db.from('training_sop_ack_requirement_scopes').delete().eq('company_id', user.tenantId).eq('requirement_id', requirement.id).select());
    await this.safeMany(this.db.from('training_sop_ack_requirement_scopes').insert(scopes.map((scope: Row) => this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: requirement.site_id,
      requirement_id: requirement.id,
      scope_type: scope.scopeType ?? scope.scope_type ?? 'Site',
      site_scope_id: scope.siteScopeId ?? scope.site_scope_id ?? requirement.site_id,
      department_id: scope.departmentId ?? scope.department_id,
      unit_id: scope.unitId ?? scope.unit_id,
      area_id: scope.areaId ?? scope.area_id,
      equipment_id: scope.equipmentId ?? scope.equipment_id,
      worker_type_filter: scope.workerTypeFilter ?? scope.worker_type_filter,
      employer_type_filter: scope.employerTypeFilter ?? scope.employer_type_filter,
      contractor_company_filter: scope.contractorCompanyFilter ?? scope.contractor_company_filter,
      job_role_filter: scope.jobRoleFilter ?? scope.job_role_filter,
      competency_profile_id: scope.competencyProfileId ?? scope.competency_profile_id,
      ptw_role_filter: scope.ptwRoleFilter ?? scope.ptw_role_filter,
      required_training_item_id: scope.requiredTrainingItemId ?? scope.required_training_item_id,
      matrix_rule_id: scope.matrixRuleId ?? scope.matrix_rule_id,
      specific_worker_id: scope.specificWorkerId ?? scope.specific_worker_id,
      applicability_rule_json: scope.applicabilityRuleJson ?? scope.applicability_rule_json,
      auto_generate_assignments: scope.autoGenerateAssignments ?? scope.auto_generate_assignments ?? true
    }))).select());
    await this.upsertOne('training_sop_ack_due_rules', {
      company_id: user.tenantId,
      site_id: requirement.site_id,
      requirement_id: requirement.id,
      initial_due_rule_json: dto.initialDueRuleJson ?? dto.initial_due_rule_json ?? null,
      due_days_after_assignment: this.numberOrNull(dto.dueDaysAfterAssignment ?? dto.due_days_after_assignment),
      due_days_after_sop_effective_date: this.numberOrNull(dto.dueDaysAfterSopEffectiveDate ?? dto.due_days_after_sop_effective_date),
      due_before_site_access: Boolean(dto.dueBeforeSiteAccess ?? dto.due_before_site_access),
      due_before_unit_assignment: Boolean(dto.dueBeforeUnitAssignment ?? dto.due_before_unit_assignment),
      due_before_ptw_authorization: Boolean(dto.dueBeforePtwAuthorization ?? dto.due_before_ptw_authorization),
      due_before_moc_implementation: Boolean(dto.dueBeforeMocImplementation ?? dto.due_before_moc_implementation),
      due_before_pssr_startup: Boolean(dto.dueBeforePssrStartup ?? dto.due_before_pssr_startup),
      due_before_safety_critical_task: Boolean(dto.dueBeforeSafetyCriticalTask ?? dto.due_before_safety_critical_task),
      grace_period_days: this.numberOrNull(dto.gracePeriodDays ?? dto.grace_period_days),
      reminder_days_before_due: this.numberOrNull(dto.reminderDaysBeforeDue ?? dto.reminder_days_before_due),
      recurring: Boolean(dto.recurring),
      recurrence_interval_days: this.numberOrNull(dto.recurrenceIntervalDays ?? dto.recurrence_interval_days),
      reacknowledge_on_sop_revision: dto.reacknowledgeOnSopRevision ?? dto.reacknowledge_on_sop_revision ?? true,
      reacknowledge_on_major_revision_only: dto.reacknowledgeOnMajorRevisionOnly ?? dto.reacknowledge_on_major_revision_only ?? true,
      reacknowledge_after_moc: Boolean(dto.reacknowledgeAfterMoc ?? dto.reacknowledge_after_moc),
      reacknowledge_after_incident: Boolean(dto.reacknowledgeAfterIncident ?? dto.reacknowledge_after_incident),
      reacknowledge_after_psi_change: Boolean(dto.reacknowledgeAfterPsiChange ?? dto.reacknowledge_after_psi_change),
      expiry_rule_json: dto.expiryRuleJson ?? dto.expiry_rule_json ?? null,
      notes: dto.dueRuleNotes ?? null
    });
    await this.upsertOne('training_sop_ack_evidence_rules', {
      company_id: user.tenantId,
      site_id: requirement.site_id,
      requirement_id: requirement.id,
      simple_acknowledgement_required: dto.simpleAcknowledgementRequired ?? dto.simple_acknowledgement_required ?? true,
      esign_required: dto.esignRequired ?? dto.esign_required ?? false,
      declaration_text: dto.declarationText ?? dto.declaration_text ?? 'I have read and understood the current approved SOP/procedure.',
      assessment_required: dto.assessmentRequired ?? dto.assessment_required ?? false,
      assessment_id: dto.assessmentId ?? dto.assessment_id ?? null,
      minimum_passing_score: this.numberOrNull(dto.minimumPassingScore ?? dto.minimum_passing_score),
      supervisor_verification_required: Boolean(dto.supervisorVerificationRequired ?? dto.supervisor_verification_required),
      hse_verification_required: Boolean(dto.hseVerificationRequired ?? dto.hse_verification_required),
      document_evidence_required: Boolean(dto.documentEvidenceRequired ?? dto.document_evidence_required),
      evidence_document_id: dto.evidenceDocumentId ?? dto.evidence_document_id ?? null,
      attestation_statement: dto.attestationStatement ?? dto.attestation_statement ?? null,
      rejection_allowed: dto.rejectionAllowed ?? dto.rejection_allowed ?? true,
      verification_role: dto.verificationRole ?? dto.verification_role ?? null,
      approval_required: Boolean(dto.approvalRequired ?? dto.approval_required),
      acknowledgement_method: dto.acknowledgementMethod ?? dto.acknowledgement_method ?? 'Click acknowledge'
    });
  }

  private async upsertOne(table: string, payload: Row) {
    const existing = await this.safeMany<Row>(this.db.from(table).select('id').eq('company_id', payload.company_id).eq('requirement_id', payload.requirement_id).limit(1));
    return this.db.single<Row>(this.db.from(table).upsert({ id: existing[0]?.id ?? randomUUID(), ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select().single());
  }

  private defaultScope(requirement: Row, dto: Row) {
    return {
      scope_type: dto.scopeType ?? dto.scope_type ?? (dto.specificWorkerId || dto.specific_worker_id ? 'Specific workers' : 'Site'),
      site_scope_id: dto.siteScopeId ?? dto.site_scope_id ?? requirement.site_id,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      department_id: dto.departmentId ?? dto.department_id,
      worker_type_filter: dto.workerTypeFilter ?? dto.worker_type_filter,
      employer_type_filter: dto.employerTypeFilter ?? dto.employer_type_filter,
      contractor_company_filter: dto.contractorCompanyFilter ?? dto.contractor_company_filter,
      job_role_filter: dto.jobRoleFilter ?? dto.job_role_filter,
      ptw_role_filter: dto.ptwRoleFilter ?? dto.ptw_role_filter,
      specific_worker_id: dto.specificWorkerId ?? dto.specific_worker_id,
      auto_generate_assignments: dto.autoGenerateAssignments ?? dto.auto_generate_assignments ?? true
    };
  }

  private async affectedWorkers(user: RequestUser, requirement: Row, query: Row = {}) {
    const scopes = await this.safeMany<Row>(this.db.from('training_sop_ack_requirement_scopes').select('*').eq('company_id', user.tenantId).eq('requirement_id', requirement.id));
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    const siteIds = [...new Set(scopes.map((scope) => scope.site_scope_id ?? scope.site_id ?? requirement.site_id).filter(Boolean))];
    if (query.workerId) req = req.eq('id', query.workerId);
    else if (siteIds.length) req = req.in('primary_site_id', siteIds);
    else req = this.siteScoped(user, req, {});
    const workers = await this.safeMany<Row>(req);
    if (!scopes.length) return workers;
    return workers.filter((worker) => scopes.some((scope) => {
      if (scope.specific_worker_id && worker.id !== scope.specific_worker_id) return false;
      if (scope.worker_type_filter && worker.worker_type !== scope.worker_type_filter) return false;
      if (scope.employer_type_filter && worker.employer_type !== scope.employer_type_filter) return false;
      if (scope.contractor_company_filter && worker.contractor_company_name !== scope.contractor_company_filter) return false;
      if (scope.job_role_filter && worker.job_title !== scope.job_role_filter) return false;
      if (scope.site_scope_id && worker.primary_site_id !== scope.site_scope_id) return false;
      return true;
    }));
  }

  private calculateDueDate(requirement: Row, dueRule: Row, settings: Row) {
    const days = this.numberOrDefault(dueRule.due_days_after_assignment, settings.default_due_days_after_assignment ?? 14);
    const base = requirement.effective_date && dueRule.due_days_after_sop_effective_date !== null && dueRule.due_days_after_sop_effective_date !== undefined
      ? new Date(`${requirement.effective_date}T00:00:00`)
      : new Date();
    const addDays = dueRule.due_days_after_sop_effective_date ?? days;
    base.setDate(base.getDate() + Number(addDays));
    return base.toISOString().slice(0, 10);
  }

  private validateRequirement(user: RequestUser, dto: Row, allowPartial: boolean) {
    this.requireText(dto.requirementTitle ?? dto.requirement_title, 'Requirement title is required.');
    this.requireText(dto.requirementCode ?? dto.requirement_code, 'Requirement code is required.');
    const status = dto.requirementStatus ?? dto.requirement_status;
    if (['Active', 'Approved'].includes(status)) {
      if (!dto.sopId && !dto.sop_id && !dto.documentId && !dto.document_id) throw new BadRequestException('Active SOP acknowledgement requirement requires an SOP Library item or Document Control document.');
    }
    if ((dto.safetyCritical ?? dto.safety_critical) && !allowPartial && !(dto.ownerUserId ?? dto.owner_user_id)) throw new BadRequestException('Safety-critical SOP acknowledgement requirement requires an owner.');
    if ((dto.recurring || dto.recurring === true) && !(dto.recurrenceIntervalDays ?? dto.recurrence_interval_days)) throw new BadRequestException('Recurring acknowledgement requires recurrence interval days.');
    for (const [key, label] of [['dueDaysAfterAssignment', 'Due days after assignment'], ['gracePeriodDays', 'Grace period days'], ['reminderDaysBeforeDue', 'Reminder days before due']] as Array<[string, string]>) {
      const value = dto[key] ?? dto[this.snake(key)];
      if (value !== undefined && value !== null && Number(value) < 0) throw new BadRequestException(`${label} must be non-negative.`);
    }
    const blocker = dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization ?? dto.blocksMocImplementation ?? dto.blocks_moc_implementation ?? dto.blocksPssrStartup ?? dto.blocks_pssr_startup ?? dto.blocksSafetyCriticalWork ?? dto.blocks_safety_critical_work;
    if (blocker && !(dto.safetyCritical ?? dto.safety_critical) && !(dto.psmCritical ?? dto.psm_critical)) throw new BadRequestException('Blocking requirement requires safety-critical or PSM-critical justification.');
    if (dto.siteId ?? dto.site_id) this.assertSiteAccess(user, dto.siteId ?? dto.site_id);
  }

  private async assertUniqueRequirementCode(user: RequestUser, code: string, siteId: string | null) {
    let req: any = this.db.from('training_sop_ack_requirements').select('id').eq('company_id', user.tenantId).eq('requirement_code', code);
    req = siteId ? req.eq('site_id', siteId) : req.is('site_id', null);
    const rows = await this.safeMany<Row>(req.limit(1));
    if (rows.length) throw new BadRequestException('Requirement code must be unique per company/site scope.');
  }

  private async assertRequirement(user: RequestUser, requirementId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_requirements').select('*').eq('company_id', user.tenantId).eq('id', requirementId).single()), 'SOP acknowledgement requirement not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAssignment(user: RequestUser, assignmentId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_assignments').select('*').eq('company_id', user.tenantId).eq('id', assignmentId).single()), 'SOP acknowledgement assignment not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return this.withRuntimeAssignmentStatus(row);
  }

  private async assertAcknowledgement(user: RequestUser, acknowledgementId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_acknowledgements').select('*').eq('company_id', user.tenantId).eq('id', acknowledgementId).single()), 'SOP acknowledgement record not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertWaiver(user: RequestUser, waiverId: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_waivers').select('*').eq('company_id', user.tenantId).eq('id', waiverId).single()), 'SOP acknowledgement waiver not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async updateAssignment(user: RequestUser, before: Row, update: Row, eventType: string, title: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_ack_assignments').update(update).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated SOP acknowledgement assignment was not returned by the database.');
    await this.writeHistory(user, eventType, title, before, row, { assignment_id: row.id, requirement_id: row.requirement_id, worker_id: row.worker_id, site_id: row.site_id });
    await this.updateWorkerSopStatus(user, row.worker_id).catch(() => null);
    return row;
  }

  private async updateAcknowledgement(user: RequestUser, before: Row, update: Row, eventType: string, title: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_sop_acknowledgements').update(update).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated SOP acknowledgement was not returned by the database.');
    const assignment = await this.assertAssignment(user, row.assignment_id);
    await this.updateAssignment(user, assignment, { acknowledgement_status: row.acknowledgement_status, verification_status: row.verification_status, completed_at: row.acknowledgement_status === 'Verified' ? new Date().toISOString() : assignment.completed_at, updated_at: new Date().toISOString() }, eventType, title);
    await this.writeHistory(user, eventType, title, before, row, { acknowledgement_id: row.id, assignment_id: row.assignment_id, requirement_id: row.requirement_id, worker_id: row.worker_id, site_id: row.site_id });
    return row;
  }

  private async updateWorkerSopStatus(user: RequestUser, workerId: string) {
    const rows = await this.scopedAssignments(user, { workerId });
    const status = rows.some((row) => row.runtime_overdue) ? 'Overdue' : rows.some((row) => row.runtime_current_version_gap || row.runtime_status === 'Re-Acknowledgement Required') ? 'Re-Acknowledgement Required' : rows.some((row) => ['Pending', 'Assigned', 'In Progress', 'Acknowledged Pending Verification', 'Acknowledged Pending Assessment'].includes(row.runtime_status)) ? 'Incomplete' : rows.length ? 'Complete' : 'Not Assessed';
    await this.db.single<Row>(this.db.from('training_workers').update({ sop_acknowledgement_status: status, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
  }

  private versionSatisfiesRequirement(requirement: Row, version: string, overrideReason?: string) {
    if (overrideReason) return true;
    if (!requirement.required_version) return true;
    if (requirement.current_version_policy === 'Current and future versions') return true;
    return String(requirement.required_version) === String(version);
  }

  private requiredBecause(requirement: Row, worker: Row) {
    return [requirement.requirement_source, worker.job_title, worker.primary_site_id].filter(Boolean).join(' / ') || 'SOP acknowledgement requirement';
  }

  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row = {}) {
    const event = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: scope.site_id ?? after?.site_id ?? before?.site_id ?? null,
      unit_id: scope.unit_id ?? after?.unit_id ?? before?.unit_id ?? null,
      area_id: scope.area_id ?? after?.area_id ?? before?.area_id ?? null,
      worker_id: scope.worker_id ?? after?.worker_id ?? before?.worker_id ?? null,
      requirement_id: scope.requirement_id ?? after?.requirement_id ?? before?.requirement_id ?? null,
      assignment_id: scope.assignment_id ?? after?.assignment_id ?? before?.assignment_id ?? null,
      acknowledgement_id: scope.acknowledgement_id ?? after?.acknowledgement_id ?? before?.acknowledgement_id ?? after?.id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: scope.reason ?? scope.message ?? null,
      before_value_json: before as JsonValue,
      after_value_json: after as JsonValue,
      actor_user_id: user.id,
      source_module: 'Training SOP Acknowledgements',
      source_record_id: scope.requirement_id ?? scope.assignment_id ?? scope.acknowledgement_id ?? after?.id ?? null
    };
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.sop_ack.${eventType.toLowerCase().replace(/\s+/g, '_')}`, entityType: 'TrainingSopAcknowledgement', entityId: event.source_record_id ?? undefined, before: before as JsonValue, after: after as JsonValue, metadata: scope as JsonValue }).catch(() => null);
    await this.db.single<Row>(this.db.from('training_sop_ack_history_events').insert(event).select().single()).catch(() => null);
  }

  private siteScoped(user: RequestUser, req: any, query: Row) {
    if (query.siteId) {
      this.assertSiteAccess(user, query.siteId);
      return req.eq('site_id', query.siteId);
    }
    const selected = user.selectedSiteId ?? user.activeSiteId ?? null;
    if (selected) return req.or(`site_id.is.null,site_id.eq.${selected}`);
    const allowed = user.siteIds ?? [];
    return allowed.length ? req.or(`site_id.is.null,site_id.in.(${allowed.join(',')})`) : req;
  }

  private assertSiteAccess(user: RequestUser, siteId: string) {
    const allowed = user.siteIds ?? [];
    const selected = user.selectedSiteId ?? user.activeSiteId ?? null;
    if (selected && selected !== siteId) throw new ForbiddenException('You do not have access to the selected site.');
    if (allowed.length && !allowed.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
  }

  private mapImportRequirement(row: Row) {
    return {
      requirementCode: row.requirement_code,
      requirementTitle: row.requirement_title,
      requirementSource: row.requirement_source,
      sopTitle: row.sop_reference,
      documentNumber: row.document_number,
      requiredVersion: row.required_version,
      currentVersionPolicy: row.current_version_policy,
      workerTypeFilter: row.worker_type,
      employerTypeFilter: row.employer_type,
      contractorCompanyFilter: row.contractor_company,
      jobRoleFilter: row.job_role,
      ptwRoleFilter: row.ptw_role,
      dueDaysAfterAssignment: row.due_days_after_assignment,
      reacknowledgeOnSopRevision: row.reacknowledge_on_sop_revision,
      esignRequired: row.esign_required,
      assessmentRequired: row.assessment_required,
      supervisorVerificationRequired: row.supervisor_verification_required,
      hseVerificationRequired: row.hse_verification_required,
      safetyCritical: row.safety_critical,
      psmCritical: row.psm_critical,
      ptwCritical: row.ptw_critical,
      mocCritical: row.moc_critical,
      pssrCritical: row.pssr_critical,
      blocksPtwAuthorization: row.blocks_ptw_authorization,
      blocksMocImplementation: row.blocks_moc_implementation,
      blocksPssrStartup: row.blocks_pssr_startup,
      waiverAllowed: row.waiver_allowed,
      requirementStatus: row.active === true || row.active === 'true' ? 'Active' : 'Draft'
    };
  }

  private groupBy(rows: Row[], key: string): Record<string, Row[]> {
    return rows.reduce<Record<string, Row[]>>((acc, row) => {
      const value = key.split('.').reduce<any>((current, part) => current?.[part], row);
      const group = String(value ?? 'null');
      acc[group] = [...(acc[group] ?? []), row];
      return acc;
    }, {});
  }

  private countBy(rows: Row[], key: string) {
    return Object.entries(this.groupBy(rows, key)).map(([value, items]) => ({ value: value === 'null' ? 'Not set' : value, count: items.length }));
  }

  private sortRows(rows: Row[], sort: string): Row[] {
    const [rawField, direction] = sort.split('.');
    const field = rawField || 'updated_at';
    return [...rows].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      return direction === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }

  private compact(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private numberOrNull(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private numberOrDefault(value: unknown, fallback: number) {
    const number = this.numberOrNull(value);
    return number === null ? fallback : number;
  }

  private percent(count: number, total: number) {
    return total ? Math.round((count / total) * 100) : 0;
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private must<T>(value: T | null | undefined, message: string): T {
    if (!value) throw new NotFoundException(message);
    return value;
  }

  private async safeMany<T>(query: PromiseLike<any>) {
    return this.db.many<T>(query).catch((error) => {
      throw error;
    });
  }

  private snake(value: string) {
    return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
