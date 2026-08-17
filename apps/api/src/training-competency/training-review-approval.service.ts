import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const approvalStatuses = ['Draft', 'Submitted', 'Pending Approval', 'In Review', 'Returned', 'Rejected', 'Approved', 'Completed', 'Cancelled', 'Escalated', 'Stale', 'Validation Failed'];
const sourceModules = ['Training Matrix', 'Roles & Competency', 'Required Training', 'Training Records', 'Certifications', 'Assessments', 'SOP Acknowledgements', 'MOC Training', 'PSSR Training', 'PTW Authorization', 'Reports / Export'];
const sourceRecordTypes = ['Matrix rule', 'Matrix requirement', 'Matrix waiver', 'Matrix bulk change', 'Matrix import job', 'Competency profile', 'Competency requirement', 'Competency waiver', 'Competency evaluation override', 'Profile version', 'Training library item', 'Training item version', 'Evidence policy', 'Training item archive/reactivation', 'Safety-critical completion record', 'Manual completion record', 'Attendance correction', 'Completion verification override', 'Training record waiver', 'Certificate verification', 'Certificate rejection/revocation', 'Certificate renewal', 'Safety-critical certificate override', 'Assessment library item', 'Assessment result manual grading', 'Failed safety-critical assessment override', 'Assessment result verification', 'Safety-critical SOP acknowledgement', 'SOP acknowledgement waiver', 'Re-acknowledgement override', 'Current version gap waiver', 'MOC training requirement', 'MOC training readiness snapshot', 'MOC implementation/closure/startup blocker waiver', 'PSSR training readiness record', 'PSSR startup/handover blocker waiver', 'PTW authorization rule', 'PTW authorization request', 'PTW authorization record', 'PTW waiver / emergency override', 'PTW suspension/revocation', 'Restricted report export', 'Audit evidence package', 'Scheduled restricted report', 'Report template approval'];
const stageTypes = ['Single Reviewer', 'Role Based Reviewer', 'Sequential Approval', 'Parallel Approval', 'Any One Approval', 'All Reviewers Approval', 'Conditional Approval', 'Escalation Stage'];
const decisions = ['Approve', 'Approve With Conditions', 'Reject', 'Return For Correction', 'Request More Evidence', 'Escalate', 'Reassign', 'Cancel'];
const priorities = ['Low', 'Normal', 'High', 'Urgent', 'Safety Critical'];
const validationStatuses = ['Not Run', 'Passed', 'Passed With Warnings', 'Failed', 'Stale', 'Needs Revalidation'];
const staleStatuses = ['Current', 'Stale', 'Needs Revalidation', 'Source Changed', 'Evidence Changed', 'Reviewer Access Changed'];

@Injectable()
export class TrainingReviewApprovalService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, inbox, overdue, packages, rules, escalations] = await Promise.all([
      this.dashboardSummary(user, query),
      this.inbox(user, { ...query, limit: 8 }),
      this.filtered(user, 'overdue', { ...query, limit: 8 }),
      this.packages(user, { ...query, limit: 10 }),
      this.rules(user, { ...query, limit: 8 }),
      this.escalations(user, { ...query, limit: 8 })
    ]);
    const rows = await this.requestRows(user, query);
    return {
      header: { title: 'Training Review & Approval', subtitle: 'Training-controlled review packages, validation, e-signature status, stale detection, waivers, and approval rules.', lastUpdated: new Date().toISOString() },
      summary,
      inboxPreview: inbox.rows,
      overduePreview: overdue.rows,
      pendingByModule: this.countBy(rows.filter((row) => ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)), 'source_module'),
      overdueByReviewer: this.countBy((await this.stageRows(user, query)).filter((stage) => stage.stage_status !== 'Completed' && this.isPast(stage.due_at)), 'reviewer_user_id'),
      safetyCriticalPending: rows.filter((row) => row.safety_critical && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).slice(0, 10),
      waiverApprovals: rows.filter((row) => String(row.source_record_type ?? '').toLowerCase().includes('waiver')).slice(0, 10),
      ptwAuthorizationApprovals: rows.filter((row) => row.source_module === 'PTW Authorization').slice(0, 10),
      staleApprovalPackages: rows.filter((row) => row.stale_status !== 'Current').slice(0, 10),
      validationFailurePreview: rows.filter((row) => ['Failed', 'Stale', 'Needs Revalidation'].includes(row.validation_status)).slice(0, 10),
      recentApprovals: rows.filter((row) => ['Approved', 'Completed'].includes(row.approval_status)).slice(0, 10),
      recentRejectionsReturns: rows.filter((row) => ['Rejected', 'Returned'].includes(row.approval_status)).slice(0, 10),
      approvalWorkloadByRole: this.countBy(await this.participantRows(user, query), 'role_name'),
      slaPerformance: this.countBy(rows, 'sla_status'),
      rulesPreview: rules.rows,
      escalationsPreview: escalations.rows
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [requests, stages, participants, rules] = await Promise.all([this.requestRows(user, query), this.stageRows(user, query), this.participantRows(user, query), this.ruleRows(user, query)]);
    const myId = user.id;
    const myAssigned = new Set(participants.filter((p) => p.user_id === myId && !['Completed', 'Cancelled'].includes(p.participant_status)).map((p) => p.approval_request_id));
    return {
      totalApprovalRequests: requests.length,
      pendingMyReview: requests.filter((row) => myAssigned.has(row.id) && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      mySubmissions: requests.filter((row) => row.submitted_by === myId).length,
      pendingApproval: requests.filter((row) => ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      overdueReviews: requests.filter((row) => this.isPast(row.due_date) && !['Approved', 'Completed', 'Rejected', 'Cancelled'].includes(row.approval_status)).length,
      returnedRequests: requests.filter((row) => row.approval_status === 'Returned').length,
      rejectedRequests: requests.filter((row) => row.approval_status === 'Rejected').length,
      approvedRequests: requests.filter((row) => row.approval_status === 'Approved').length,
      completedRequests: requests.filter((row) => row.approval_status === 'Completed').length,
      escalatedRequests: requests.filter((row) => row.approval_status === 'Escalated').length,
      staleApprovalPackages: requests.filter((row) => row.stale_status !== 'Current').length,
      validationFailures: requests.filter((row) => ['Failed', 'Stale', 'Needs Revalidation'].includes(row.validation_status)).length,
      eSignaturesPending: stages.filter((stage) => stage.esign_required && stage.stage_status !== 'Completed').length,
      safetyCriticalPending: requests.filter((row) => row.safety_critical && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      waiversPending: requests.filter((row) => String(row.source_record_type ?? '').toLowerCase().includes('waiver') && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      ptwAuthorizationsPending: requests.filter((row) => row.source_module === 'PTW Authorization' && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      mocTrainingApprovalsPending: requests.filter((row) => row.source_module === 'MOC Training' && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      pssrTrainingApprovalsPending: requests.filter((row) => row.source_module === 'PSSR Training' && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      reportsPendingApproval: requests.filter((row) => row.source_module === 'Reports / Export' && ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status)).length,
      averageApprovalTime: this.averageApprovalHours(requests),
      slaBreaches: requests.filter((row) => row.sla_status === 'Breached').length,
      activeRules: rules.filter((row) => row.rule_status === 'Active').length
    };
  }

  async inbox(user: RequestUser, query: Row = {}) {
    const rows = await this.requestRows(user, { ...query, approvalStatus: query.approvalStatus ?? undefined });
    const assignments = await this.participantRows(user, query);
    const myIds = new Set(assignments.filter((p) => p.user_id === user.id || (!p.user_id && p.role_name && (user.permissions ?? []).length)).map((p) => p.approval_request_id));
    return this.paginate(this.filterRows(rows.filter((row) => myIds.has(row.id) && !['Completed', 'Cancelled'].includes(row.approval_status)), query), query);
  }

  async submissions(user: RequestUser, query: Row = {}) {
    return this.paginate(this.filterRows((await this.requestRows(user, query)).filter((row) => row.submitted_by === user.id), query), query);
  }

  async filtered(user: RequestUser, view: string, query: Row = {}) {
    const nowFiltered = (await this.requestRows(user, query)).filter((row) => {
      if (view === 'pending') return ['Submitted', 'Pending Approval', 'In Review'].includes(row.approval_status);
      if (view === 'overdue') return this.isPast(row.due_date) && !['Approved', 'Completed', 'Rejected', 'Cancelled'].includes(row.approval_status);
      if (view === 'returned') return row.approval_status === 'Returned';
      if (view === 'rejected') return row.approval_status === 'Rejected';
      if (view === 'approved') return row.approval_status === 'Approved';
      if (view === 'completed') return row.approval_status === 'Completed';
      if (view === 'escalated') return row.approval_status === 'Escalated';
      if (view === 'stale') return row.stale_status !== 'Current';
      if (view === 'validation-failures') return ['Failed', 'Stale', 'Needs Revalidation'].includes(row.validation_status);
      return true;
    });
    return this.paginate(this.filterRows(nowFiltered, query), query);
  }

  async packages(user: RequestUser, query: Row = {}) {
    return this.paginate(this.filterRows(await this.requestRows(user, query), query), query);
  }

  async createPackage(user: RequestUser, dto: Row = {}) {
    this.requireText(dto.sourceModule ?? dto.source_module, 'Source module is required.');
    this.requireText(dto.sourceRecordType ?? dto.source_record_type, 'Source record type is required.');
    this.requireText(dto.sourceRecordId ?? dto.source_record_id, 'Source record ID is required.');
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const now = new Date();
    const id = randomUUID();
    const sourceSnapshot = dto.sourceSnapshot ?? dto.source_snapshot_json ?? { sourceModule: dto.sourceModule ?? dto.source_module, sourceRecordType: dto.sourceRecordType ?? dto.source_record_type, sourceRecordId: dto.sourceRecordId ?? dto.source_record_id, submittedAt: now.toISOString() };
    const settings = await this.settings(user, { siteId });
    const due = dto.dueDate ?? dto.due_date ?? this.addHours(now, Number(settings.default_approval_sla_hours ?? 72));
    const row = await this.db.single<Row>(this.db.from('training_approval_requests').insert(this.compact({
      id,
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      approval_code: dto.approvalCode ?? dto.approval_code ?? `TAR-${now.getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
      approval_title: dto.approvalTitle ?? dto.approval_title ?? `${dto.sourceModule ?? dto.source_module} approval`,
      source_module: dto.sourceModule ?? dto.source_module,
      source_record_type: dto.sourceRecordType ?? dto.source_record_type,
      source_record_id: dto.sourceRecordId ?? dto.source_record_id,
      source_record_title: dto.sourceRecordTitle ?? dto.source_record_title,
      source_snapshot_json: sourceSnapshot,
      current_snapshot_hash: this.hash(sourceSnapshot),
      submitted_by: user.id,
      submitted_at: now.toISOString(),
      approval_status: dto.approvalStatus ?? dto.approval_status ?? 'Submitted',
      priority: dto.priority ?? 'Normal',
      safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical),
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? 'Internal',
      validation_status: 'Not Run',
      stale_status: 'Current',
      due_date: due
    })).select('*').single());
    const stage = await this.createDefaultStage(user, row, dto);
    await this.db.single(this.db.from('training_approval_requests').update({ current_stage_id: stage.id }).eq('company_id', user.tenantId).eq('id', row.id).select('id').single()).catch(() => null);
    await this.validate(user, row.id, { validationType: 'Submission' });
    await this.writeHistory(user, row.id, 'Submitted', `Training approval submitted: ${row.approval_title}`, null, row);
    return this.packageDetail(user, row.id);
  }

  async packageDetail(user: RequestUser, approvalId: string) {
    const request = await this.assertRequest(user, approvalId);
    const [stages, participants, decisions, comments, validations, evidence, esignatures, escalations, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_approval_stages').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('stage_order')),
      this.safeMany<Row>(this.db.from('training_approval_participants').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('assigned_at')),
      this.safeMany<Row>(this.db.from('training_approval_decisions').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('decided_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_approval_comments').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).is('deleted_at', null).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_approval_validation_results').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('validated_at', { ascending: false })),
      this.evidence(user, approvalId),
      this.safeMany<Row>(this.db.from('training_approval_esignature_links').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_approval_escalations').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('escalated_at', { ascending: false })),
      this.history(user, { approvalId, limit: 100 }).then((r) => r.rows)
    ]);
    return { request, stages, participants, decisions, comments, validations, evidence: evidence.rows ?? evidence, esignatures, escalations, history, actions: this.actions(user, request) };
  }

  async snapshot(user: RequestUser, approvalId: string) {
    const request = await this.assertRequest(user, approvalId);
    return { approvalId, sourceSnapshot: request.source_snapshot_json, currentSnapshotHash: request.current_snapshot_hash, staleStatus: request.stale_status, staleReason: request.stale_reason };
  }

  async evidence(user: RequestUser, approvalId: string) {
    await this.assertRequest(user, approvalId);
    const rows = await this.safeMany<Row>(this.db.from('training_approval_evidence_links').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('linked_at', { ascending: false }));
    return { rows, total: rows.length, summary: this.countBy(rows, 'evidence_status') };
  }

  async history(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_approval_history_events').select('*').eq('company_id', user.tenantId);
    req = query.approvalId ? req.eq('approval_request_id', query.approvalId) : this.siteScopedBase(user, req);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }));
    return this.paginate(rows, query);
  }

  async validate(user: RequestUser, approvalId: string, dto: Row = {}) {
    const before = await this.assertRequest(user, approvalId);
    const checks = this.validationChecks(before);
    const errors = checks.filter((check) => check.status === 'Failed');
    const warnings = checks.filter((check) => check.status === 'Warning');
    const status = errors.length ? 'Failed' : warnings.length ? 'Passed With Warnings' : 'Passed';
    const result = await this.db.single<Row>(this.db.from('training_approval_validation_results').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: before.site_id,
      approval_request_id: approvalId,
      validation_status: status,
      validation_type: dto.validationType ?? dto.validation_type ?? 'Manual',
      checks_json: checks,
      warnings_json: warnings,
      errors_json: errors,
      stale_reasons_json: before.stale_status === 'Current' ? [] : [before.stale_reason ?? before.stale_status],
      validated_by: user.id
    }).select('*').single());
    const after = await this.db.single<Row>(this.db.from('training_approval_requests').update({ validation_status: status, approval_status: status === 'Failed' ? 'Validation Failed' : before.approval_status, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', approvalId).select('*').single());
    await this.writeHistory(user, approvalId, 'Validated', `Training approval validation ${status}`, before, after);
    return result;
  }

  async approve(user: RequestUser, approvalId: string, dto: Row = {}) { return this.decide(user, approvalId, 'Approve', dto); }
  async approveWithConditions(user: RequestUser, approvalId: string, dto: Row = {}) {
    this.requireText(dto.condition ?? dto.conditions ?? dto.reason, 'Approve with conditions requires a condition or action.');
    return this.decide(user, approvalId, 'Approve With Conditions', dto);
  }
  async reject(user: RequestUser, approvalId: string, dto: Row = {}) { this.requireText(dto.reason ?? dto.decisionReason, 'Reject requires a reason.'); return this.decide(user, approvalId, 'Reject', dto); }
  async returnForCorrection(user: RequestUser, approvalId: string, dto: Row = {}) { this.requireText(dto.reason ?? dto.decisionReason, 'Return for correction requires a reason.'); return this.decide(user, approvalId, 'Return For Correction', dto); }
  async requestCorrection(user: RequestUser, approvalId: string, dto: Row = {}) { this.requireText(dto.reason ?? dto.decisionReason, 'Request correction requires a reason.'); return this.decide(user, approvalId, 'Request More Evidence', dto); }

  async escalate(user: RequestUser, approvalId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.escalationReason, 'Escalation reason is required.');
    const before = await this.assertRequest(user, approvalId);
    const escalation = await this.db.single<Row>(this.db.from('training_approval_escalations').insert(this.compact({ id: randomUUID(), company_id: user.tenantId, site_id: before.site_id, approval_request_id: approvalId, stage_id: before.current_stage_id, escalation_reason: dto.reason ?? dto.escalationReason, escalated_to_user_id: dto.escalatedToUserId ?? dto.escalated_to_user_id, escalated_to_role: dto.escalatedToRole ?? dto.escalated_to_role, escalated_by: user.id })).select('*').single());
    const after = await this.updateRequestStatus(user, approvalId, 'Escalated');
    await this.writeHistory(user, approvalId, 'Escalated', `Training approval escalated: ${escalation.escalation_reason}`, before, after);
    return escalation;
  }

  async reassign(user: RequestUser, approvalId: string, dto: Row = {}) {
    this.requireText(dto.userId ?? dto.user_id ?? dto.reviewerUserId, 'Reassignment requires a reviewer user ID.');
    const request = await this.assertRequest(user, approvalId);
    const stageId = dto.stageId ?? dto.stage_id ?? request.current_stage_id;
    const participant = await this.db.single<Row>(this.db.from('training_approval_participants').insert({ id: randomUUID(), company_id: user.tenantId, site_id: request.site_id, approval_request_id: approvalId, stage_id: stageId, user_id: dto.userId ?? dto.user_id ?? dto.reviewerUserId, role_name: dto.roleName ?? dto.role_name ?? 'Reviewer', participant_type: 'Reviewer', participant_status: 'Assigned', delegated_from_user_id: user.id }).select('*').single());
    await this.writeHistory(user, approvalId, 'Reassigned', `Training approval reassigned to ${participant.user_id}`, request, participant);
    return participant;
  }

  async cancel(user: RequestUser, approvalId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.cancelReason, 'Cancellation reason is required.');
    const before = await this.assertRequest(user, approvalId);
    const after = await this.db.single<Row>(this.db.from('training_approval_requests').update({ approval_status: 'Cancelled', cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason ?? dto.cancelReason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', approvalId).select('*').single());
    await this.writeHistory(user, approvalId, 'Cancelled', `Training approval cancelled: ${after.cancel_reason}`, before, after);
    return after;
  }

  async resubmit(user: RequestUser, approvalId: string, dto: Row = {}) {
    const before = await this.assertRequest(user, approvalId);
    if (!['Returned', 'Rejected', 'Stale', 'Validation Failed'].includes(before.approval_status)) throw new BadRequestException('Only returned, rejected, stale, or validation-failed packages can be resubmitted.');
    const after = await this.db.single<Row>(this.db.from('training_approval_requests').update({ approval_status: 'Submitted', stale_status: 'Current', stale_reason: null, submitted_by: user.id, submitted_at: new Date().toISOString(), source_snapshot_json: dto.sourceSnapshot ?? before.source_snapshot_json, current_snapshot_hash: this.hash(dto.sourceSnapshot ?? before.source_snapshot_json), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', approvalId).select('*').single());
    await this.validate(user, approvalId, { validationType: 'Resubmission' });
    await this.writeHistory(user, approvalId, 'Resubmitted', `Training approval resubmitted: ${after.approval_title}`, before, after);
    return this.packageDetail(user, approvalId);
  }

  async comment(user: RequestUser, approvalId: string, dto: Row = {}) {
    this.requireText(dto.commentText ?? dto.comment_text ?? dto.comment, 'Comment text is required.');
    const request = await this.assertRequest(user, approvalId);
    const row = await this.db.single<Row>(this.db.from('training_approval_comments').insert({ id: randomUUID(), company_id: user.tenantId, site_id: request.site_id, approval_request_id: approvalId, stage_id: dto.stageId ?? dto.stage_id ?? request.current_stage_id, comment_text: dto.commentText ?? dto.comment_text ?? dto.comment, comment_type: dto.commentType ?? dto.comment_type ?? 'General', created_by: user.id }).select('*').single());
    await this.writeHistory(user, approvalId, 'Commented', 'Training approval comment added', null, row);
    return row;
  }

  async rules(user: RequestUser, query: Row = {}) {
    return this.paginate(this.filterRows(await this.ruleRows(user, query), query), query);
  }

  async createRule(user: RequestUser, dto: Row = {}) {
    this.requireText(dto.ruleTitle ?? dto.rule_title, 'Rule title is required.');
    this.requireText(dto.sourceModule ?? dto.source_module, 'Source module is required.');
    this.requireText(dto.sourceRecordType ?? dto.source_record_type, 'Source record type is required.');
    const siteId = dto.siteId ?? dto.site_id ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const stages = dto.stages ?? dto.stages_json ?? [{ stageName: 'Reviewer Approval', stageOrder: 1, stageType: 'Single Reviewer', reviewerRole: 'Reviewer', slaHours: 72 }];
    if (!Array.isArray(stages) || !stages.length) throw new BadRequestException('Active approval rule must have at least one stage.');
    const row = await this.db.single<Row>(this.db.from('training_approval_rules').insert(this.compact({ id: randomUUID(), company_id: user.tenantId, site_id: siteId, rule_code: dto.ruleCode ?? dto.rule_code ?? `TARULE-${Date.now()}`, rule_title: dto.ruleTitle ?? dto.rule_title, source_module: dto.sourceModule ?? dto.source_module, source_record_type: dto.sourceRecordType ?? dto.source_record_type, trigger_event: dto.triggerEvent ?? dto.trigger_event ?? 'Submit', scope_json: dto.scope ?? dto.scope_json ?? {}, safety_critical_only: Boolean(dto.safetyCriticalOnly ?? dto.safety_critical_only), criticality_threshold: dto.criticalityThreshold ?? dto.criticality_threshold, stages_json: stages, validation_requirements_json: dto.validationRequirements ?? dto.validation_requirements_json ?? [], esign_required: Boolean(dto.esignRequired ?? dto.esign_required), lock_source_after_approval: dto.lockSourceAfterApproval ?? dto.lock_source_after_approval ?? true, rule_status: dto.ruleStatus ?? dto.rule_status ?? 'Draft', owner_user_id: dto.ownerUserId ?? dto.owner_user_id, created_by: user.id, updated_by: user.id })).select('*').single());
    await this.writeHistory(user, null, 'Rule Created', `Training approval rule created: ${row.rule_title}`, null, row);
    return row;
  }

  async ruleDetail(user: RequestUser, ruleId: string) {
    const row = await this.assertRule(user, ruleId);
    return { rule: row, relatedPackages: (await this.requestRows(user, { sourceModule: row.source_module, sourceRecordType: row.source_record_type })).slice(0, 25) };
  }

  async updateRule(user: RequestUser, ruleId: string, dto: Row = {}) {
    const before = await this.assertRule(user, ruleId);
    const after = await this.db.single<Row>(this.db.from('training_approval_rules').update(this.compact({ rule_title: dto.ruleTitle ?? dto.rule_title, source_module: dto.sourceModule ?? dto.source_module, source_record_type: dto.sourceRecordType ?? dto.source_record_type, trigger_event: dto.triggerEvent ?? dto.trigger_event, scope_json: dto.scope ?? dto.scope_json, safety_critical_only: dto.safetyCriticalOnly ?? dto.safety_critical_only, criticality_threshold: dto.criticalityThreshold ?? dto.criticality_threshold, stages_json: dto.stages ?? dto.stages_json, validation_requirements_json: dto.validationRequirements ?? dto.validation_requirements_json, esign_required: dto.esignRequired ?? dto.esign_required, lock_source_after_approval: dto.lockSourceAfterApproval ?? dto.lock_source_after_approval, rule_status: dto.ruleStatus ?? dto.rule_status, owner_user_id: dto.ownerUserId ?? dto.owner_user_id, updated_by: user.id, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, null, 'Rule Updated', `Training approval rule updated: ${after.rule_title}`, before, after);
    return after;
  }

  async archiveRule(user: RequestUser, ruleId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.archiveReason, 'Archive reason is required.');
    const before = await this.assertRule(user, ruleId);
    const after = await this.db.single<Row>(this.db.from('training_approval_rules').update({ rule_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? dto.archiveReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, null, 'Rule Archived', `Training approval rule archived: ${after.rule_title}`, before, after);
    return after;
  }

  async activateRule(user: RequestUser, ruleId: string) {
    const before = await this.assertRule(user, ruleId);
    const stages = before.stages_json;
    if (!Array.isArray(stages) || !stages.length) throw new BadRequestException('Active approval rule must have at least one stage.');
    const after = await this.db.single<Row>(this.db.from('training_approval_rules').update({ rule_status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select('*').single());
    await this.writeHistory(user, null, 'Rule Activated', `Training approval rule activated: ${after.rule_title}`, before, after);
    return after;
  }

  async esignatures(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_approval_esignature_links').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }));
    return this.paginate(rows, query);
  }

  async escalations(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_approval_escalations').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    const rows = await this.safeMany<Row>(req.order('escalated_at', { ascending: false }));
    return this.paginate(rows, query);
  }

  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const rows = await this.safeMany<Row>(this.db.from('training_approval_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId));
    return rows[0] ?? { company_id: user.tenantId, site_id: siteId, require_approval_for_safety_critical_profiles: true, require_approval_for_required_training: true, require_approval_for_safety_critical_training_records: true, require_approval_for_safety_critical_certificates: true, require_approval_for_assessment_overrides: true, require_approval_for_sop_ack_waivers: true, require_approval_for_moc_training_waivers: true, require_approval_for_pssr_training_waivers: true, require_approval_for_ptw_authorizations: true, require_approval_for_ptw_emergency_override: true, require_approval_for_restricted_reports: false, require_esign_for_safety_critical_approval: true, auto_escalate_overdue_approvals: true, default_approval_sla_hours: 72, auto_lock_source_after_approval: true, stale_approval_blocks_decision: true, settings_json: {} };
  }

  async updateSettings(user: RequestUser, dto: Row = {}) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const before = await this.settings(user, { siteId });
    const after = await this.db.single<Row>(this.db.from('training_approval_settings').upsert(this.compact({ id: before.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, require_approval_for_safety_critical_profiles: dto.requireApprovalForSafetyCriticalProfiles ?? dto.require_approval_for_safety_critical_profiles, require_approval_for_required_training: dto.requireApprovalForRequiredTraining ?? dto.require_approval_for_required_training, require_approval_for_safety_critical_training_records: dto.requireApprovalForSafetyCriticalTrainingRecords ?? dto.require_approval_for_safety_critical_training_records, require_approval_for_safety_critical_certificates: dto.requireApprovalForSafetyCriticalCertificates ?? dto.require_approval_for_safety_critical_certificates, require_approval_for_assessment_overrides: dto.requireApprovalForAssessmentOverrides ?? dto.require_approval_for_assessment_overrides, require_approval_for_sop_ack_waivers: dto.requireApprovalForSopAckWaivers ?? dto.require_approval_for_sop_ack_waivers, require_approval_for_moc_training_waivers: dto.requireApprovalForMocTrainingWaivers ?? dto.require_approval_for_moc_training_waivers, require_approval_for_pssr_training_waivers: dto.requireApprovalForPssrTrainingWaivers ?? dto.require_approval_for_pssr_training_waivers, require_approval_for_ptw_authorizations: dto.requireApprovalForPtwAuthorizations ?? dto.require_approval_for_ptw_authorizations, require_approval_for_ptw_emergency_override: dto.requireApprovalForPtwEmergencyOverride ?? dto.require_approval_for_ptw_emergency_override, require_approval_for_restricted_reports: dto.requireApprovalForRestrictedReports ?? dto.require_approval_for_restricted_reports, require_esign_for_safety_critical_approval: dto.requireEsignForSafetyCriticalApproval ?? dto.require_esign_for_safety_critical_approval, auto_escalate_overdue_approvals: dto.autoEscalateOverdueApprovals ?? dto.auto_escalate_overdue_approvals, default_approval_sla_hours: dto.defaultApprovalSlaHours ?? dto.default_approval_sla_hours, auto_lock_source_after_approval: dto.autoLockSourceAfterApproval ?? dto.auto_lock_source_after_approval, stale_approval_blocks_decision: dto.staleApprovalBlocksDecision ?? dto.stale_approval_blocks_decision, settings_json: dto.settings ?? dto.settings_json, updated_by: user.id, updated_at: new Date().toISOString() }), { onConflict: 'company_id,site_id' }).select('*').single());
    await this.writeHistory(user, null, 'Settings Updated', 'Training approval settings updated', before, after);
    return after;
  }

  lookups(kind?: string) {
    const data = { trainingApprovalStatuses: approvalStatuses, trainingApprovalSourceModules: sourceModules, trainingApprovalSourceRecordTypes: sourceRecordTypes, trainingApprovalStageTypes: stageTypes, trainingApprovalDecisions: decisions, trainingApprovalPriorities: priorities, trainingValidationStatuses: validationStatuses, trainingStaleStatuses: staleStatuses };
    return kind ? data[kind as keyof typeof data] ?? [] : data;
  }

  async sourceSubmit(user: RequestUser, sourceModule: string, sourceRecordType: string, sourceRecordId: string, dto: Row = {}) {
    return this.createPackage(user, { ...dto, sourceModule, sourceRecordType, sourceRecordId, approvalTitle: dto.approvalTitle ?? `${sourceModule} ${sourceRecordType} review`, sourceRecordTitle: dto.sourceRecordTitle ?? sourceRecordId });
  }

  private async decide(user: RequestUser, approvalId: string, decision: string, dto: Row = {}) {
    const before = await this.assertRequest(user, approvalId);
    this.assertReviewer(user, before);
    if (before.stale_status !== 'Current' && decision.startsWith('Approve')) throw new BadRequestException('Stale approvals must be revalidated or resubmitted before approval.');
    if (before.validation_status === 'Failed' && decision.startsWith('Approve')) throw new BadRequestException('Failed validation blocks approval unless an approved waiver exists.');
    if (before.safety_critical && decision.startsWith('Approve') && !(user.permissions ?? []).includes('training.review.approve.safety_critical')) throw new ForbiddenException('Safety-critical approval requires elevated permission.');
    const row = await this.db.single<Row>(this.db.from('training_approval_decisions').insert({ id: randomUUID(), company_id: user.tenantId, site_id: before.site_id, approval_request_id: approvalId, stage_id: before.current_stage_id, decision, decision_reason: dto.reason ?? dto.decisionReason ?? null, conditions_json: dto.conditions ?? (dto.condition ? [dto.condition] : []), decided_by: user.id, esignature_status: before.safety_critical ? 'Pending' : 'Not Required', source_snapshot_hash: before.current_snapshot_hash }).select('*').single());
    const nextStatus = decision === 'Approve' || decision === 'Approve With Conditions' ? 'Approved' : decision === 'Reject' ? 'Rejected' : decision === 'Return For Correction' ? 'Returned' : decision === 'Request More Evidence' ? 'Returned' : before.approval_status;
    const after = await this.updateRequestStatus(user, approvalId, nextStatus, nextStatus === 'Approved' ? { completed_at: new Date().toISOString() } : {});
    await this.db.single(this.db.from('training_approval_stages').update({ stage_status: nextStatus === 'Approved' ? 'Completed' : nextStatus, completed_at: nextStatus === 'Approved' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('approval_request_id', approvalId).eq('id', before.current_stage_id).select('id').single()).catch(() => null);
    await this.writeHistory(user, approvalId, decision, `Training approval decision: ${decision}`, before, after);
    return { decision: row, request: after };
  }

  private async createDefaultStage(user: RequestUser, request: Row, dto: Row) {
    const stageId = randomUUID();
    const stage = await this.db.single<Row>(this.db.from('training_approval_stages').insert({ id: stageId, company_id: user.tenantId, site_id: request.site_id, approval_request_id: request.id, stage_name: dto.stageName ?? 'Reviewer Approval', stage_order: 1, stage_type: dto.stageType ?? 'Single Reviewer', reviewer_role: dto.reviewerRole ?? 'Training Reviewer', reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? null, required_permission: request.safety_critical ? 'training.review.approve.safety_critical' : 'training.review.approve', sla_hours: dto.slaHours ?? 72, due_at: request.due_date, stage_status: 'Pending', quorum_required: 1, esign_required: Boolean(dto.esignRequired ?? dto.esign_required ?? request.safety_critical) }).select('*').single());
    await this.db.single(this.db.from('training_approval_participants').insert({ id: randomUUID(), company_id: user.tenantId, site_id: request.site_id, approval_request_id: request.id, stage_id: stage.id, user_id: stage.reviewer_user_id, role_name: stage.reviewer_role, participant_type: 'Reviewer', participant_status: 'Assigned', assigned_at: new Date().toISOString() }).select('id').single()).catch(() => null);
    return stage;
  }

  private validationChecks(request: Row) {
    return [
      { code: 'source-module', label: 'Source module present', status: request.source_module ? 'Passed' : 'Failed' },
      { code: 'source-type', label: 'Source record type present', status: request.source_record_type ? 'Passed' : 'Failed' },
      { code: 'source-id', label: 'Source record ID present', status: request.source_record_id ? 'Passed' : 'Failed' },
      { code: 'scope', label: 'Company/site scope captured', status: request.company_id ? 'Passed' : 'Failed' },
      { code: 'snapshot', label: 'Immutable source snapshot captured', status: request.source_snapshot_json ? 'Passed' : 'Failed' },
      { code: 'stale', label: 'Approval package is current', status: request.stale_status === 'Current' ? 'Passed' : 'Failed' },
      { code: 'evidence', label: 'Mandatory evidence linked or waiver allowed', status: request.safety_critical ? 'Warning' : 'Passed' },
      { code: 'reviewer-route', label: 'Reviewer route configured', status: request.current_stage_id ? 'Passed' : 'Warning' }
    ];
  }

  private actions(user: RequestUser, request: Row) {
    const perms = new Set(user.permissions ?? []);
    const status = request.approval_status;
    const staleBlocked = request.stale_status !== 'Current';
    return [
      { key: 'validate', label: 'Run Validation', enabled: perms.has('training.review.validate'), disabledReason: perms.has('training.review.validate') ? null : 'training.review.validate permission is required.' },
      { key: 'approve', label: 'Approve', enabled: perms.has('training.review.approve') && !staleBlocked && request.validation_status !== 'Failed' && !['Approved', 'Completed', 'Rejected', 'Cancelled'].includes(status), disabledReason: staleBlocked ? 'Stale approval must be revalidated/resubmitted first.' : request.validation_status === 'Failed' ? 'Failed validation blocks approval.' : perms.has('training.review.approve') ? null : 'training.review.approve permission is required.' },
      { key: 'approve-conditions', label: 'Approve With Conditions', enabled: perms.has('training.review.approve') && !staleBlocked && request.validation_status !== 'Failed', disabledReason: staleBlocked ? 'Stale approval must be revalidated/resubmitted first.' : perms.has('training.review.approve') ? null : 'training.review.approve permission is required.' },
      { key: 'reject', label: 'Reject', enabled: perms.has('training.review.reject'), disabledReason: perms.has('training.review.reject') ? null : 'training.review.reject permission is required.' },
      { key: 'return', label: 'Return', enabled: perms.has('training.review.return'), disabledReason: perms.has('training.review.return') ? null : 'training.review.return permission is required.' },
      { key: 'escalate', label: 'Escalate', enabled: perms.has('training.review.escalate'), disabledReason: perms.has('training.review.escalate') ? null : 'training.review.escalate permission is required.' },
      { key: 'reassign', label: 'Reassign', enabled: perms.has('training.review.reassign'), disabledReason: perms.has('training.review.reassign') ? null : 'training.review.reassign permission is required.' },
      { key: 'cancel', label: 'Cancel', enabled: perms.has('training.review.request.cancel') && !['Approved', 'Completed'].includes(status), disabledReason: ['Approved', 'Completed'].includes(status) ? 'Approved/completed approvals cannot be cancelled.' : perms.has('training.review.request.cancel') ? null : 'training.review.request.cancel permission is required.' }
    ];
  }

  private async requestRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_approval_requests').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    if (query.sourceModule) req = req.eq('source_module', query.sourceModule);
    if (query.sourceRecordType) req = req.eq('source_record_type', query.sourceRecordType);
    if (query.approvalStatus) req = req.eq('approval_status', query.approvalStatus);
    if (query.priority) req = req.eq('priority', query.priority);
    return this.safeMany<Row>(req.order('submitted_at', { ascending: false }));
  }

  private async stageRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_approval_stages').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req); return this.safeMany<Row>(req.order('due_at', { ascending: true })); }
  private async participantRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_approval_participants').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req); return this.safeMany<Row>(req.order('assigned_at', { ascending: false })); }
  private async ruleRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_approval_rules').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req); if (query.sourceModule) req = req.eq('source_module', query.sourceModule); return this.safeMany<Row>(req.order('updated_at', { ascending: false })); }

  private async assertRequest(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_approval_requests').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training approval package was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertRule(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_approval_rules').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training approval rule was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private assertReviewer(user: RequestUser, request: Row) { if ((user.permissions ?? []).includes('training.review.approve')) return; throw new ForbiddenException('training.review.approve permission is required.'); }
  private async updateRequestStatus(user: RequestUser, approvalId: string, status: string, patch: Row = {}) { return this.db.single<Row>(this.db.from('training_approval_requests').update({ approval_status: status, ...patch, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', approvalId).select('*').single()); }
  private filterRows(rows: Row[], query: Row) { const search = String(query.search ?? '').toLowerCase(); return search ? rows.filter((row) => ['approval_code', 'approval_title', 'source_module', 'source_record_type', 'source_record_title', 'approval_status'].some((field) => String(row[field] ?? '').toLowerCase().includes(search))) : rows; }
  private scope(user: RequestUser) { return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) }; }
  private siteScopedBase(user: RequestUser, req: any, column = 'site_id') { const scope = this.scope(user); if (scope.selectedSiteId) return req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId)); if (!scope.corporateView && scope.allowedSiteIds.length) return req.in(column, scope.allowedSiteIds); if (!scope.corporateView) return req.eq(column, '__no_site_access__'); return req; }
  private assertSiteAccess(user: RequestUser, siteId?: string | null) { if (!siteId) throw new BadRequestException('Site is required.'); const scope = this.scope(user); if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.'); return siteId; }
  private async writeHistory(user: RequestUser, approvalId: string | null, eventType: string, title: string, before: Row | null, after: Row | null) { const history = { id: randomUUID(), company_id: user.tenantId, site_id: after?.site_id ?? before?.site_id ?? null, unit_id: after?.unit_id ?? before?.unit_id ?? null, area_id: after?.area_id ?? before?.area_id ?? null, approval_request_id: approvalId, source_module: after?.source_module ?? before?.source_module ?? 'Training Review & Approval', source_record_type: after?.source_record_type ?? before?.source_record_type ?? null, source_record_id: after?.source_record_id ?? before?.source_record_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before, after_value_json: after, actor_user_id: user.id }; await this.db.single(this.db.from('training_approval_history_events').insert(history).select('id').single()).catch(() => null); await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.review.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingApproval', entityId: approvalId ?? after?.id ?? before?.id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null); }
  private countBy(rows: Row[], field: string) { return Object.entries(rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [String(row[field] ?? 'Unknown')]: (acc[String(row[field] ?? 'Unknown')] ?? 0) + 1 }), {})).map(([label, count]) => ({ label, count })); }
  private averageApprovalHours(rows: Row[]) { const durations = rows.filter((row) => row.completed_at && row.submitted_at).map((row) => (new Date(row.completed_at).getTime() - new Date(row.submitted_at).getTime()) / 3600000); if (!durations.length) return 0; return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length); }
  private addHours(date: Date, hours: number) { const due = new Date(date); due.setHours(due.getHours() + hours); return due.toISOString(); }
  private isPast(date?: string | null) { return Boolean(date && new Date(date).getTime() < Date.now()); }
  private hash(value: unknown) { return createHash('sha256').update(JSON.stringify(value ?? {})).digest('hex'); }
  private requireText(value: unknown, message: string) { if (!String(value ?? '').trim()) throw new BadRequestException(message); }
  private paginate(rows: Row[], query: Row = {}) { const page = Math.max(Number(query.page ?? 1), 1); const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 500); return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, lastUpdated: new Date().toISOString() }; }
  private compact<T extends Row>(obj: T) { return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>; }
  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> { return this.db.many<T>(query).catch(() => []); }
}
