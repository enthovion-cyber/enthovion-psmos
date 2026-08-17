import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type QueryMap = Record<string, string | undefined>;
type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

type SourceMapping = {
  table: string;
  titleKeys: string[];
  numberKeys: string[];
  moduleLabel: string;
};

const pendingStatuses = ['Submitted', 'Under Review', 'Ready to Submit', 'Validation Failed', 'Returned', 'Reopened'];
const terminalStatuses = ['Approved', 'Approved Current', 'Rejected', 'Superseded', 'Archived', 'Completed'];
const reviewableModules = [
  'unit-profile',
  'chemical',
  'process-chemistry',
  'safe-limit',
  'equipment-design',
  'relief-system',
  'drawing',
  'electrical-classification',
  'material-compatibility',
  'safeguard',
  'completeness-requirement',
  'completeness-waiver',
  'integration-link',
  'moc-impact',
  'pssr-blocker',
  'hazop-basis',
  'mi-readiness-impact'
];

const sourceMappings: Record<string, SourceMapping> = {
  'unit-profile': { table: 'psi_units', moduleLabel: 'PSI Unit Profile', titleKeys: ['unit_name', 'name', 'title'], numberKeys: ['unit_number', 'record_number'] },
  unit: { table: 'psi_units', moduleLabel: 'PSI Unit Profile', titleKeys: ['unit_name', 'name', 'title'], numberKeys: ['unit_number', 'record_number'] },
  chemical: { table: 'psi_chemicals', moduleLabel: 'Chemicals & SDS', titleKeys: ['chemical_name', 'name', 'title'], numberKeys: ['chemical_number', 'cas_number', 'record_number'] },
  'process-chemistry': { table: 'psi_process_chemistry', moduleLabel: 'Process Chemistry', titleKeys: ['chemistry_title', 'reaction_title', 'title', 'name'], numberKeys: ['chemistry_number', 'record_number'] },
  'safe-limit': { table: 'psi_safe_operating_limits', moduleLabel: 'Safe Operating Limits', titleKeys: ['limit_title', 'parameter_name', 'title'], numberKeys: ['limit_number', 'record_number'] },
  'equipment-design': { table: 'psi_equipment_design_basis', moduleLabel: 'Equipment Design Basis', titleKeys: ['design_basis_title', 'equipment_name', 'title'], numberKeys: ['design_basis_number', 'record_number'] },
  'relief-system': { table: 'psi_relief_systems', moduleLabel: 'Relief Systems', titleKeys: ['relief_basis_title', 'relief_system_title', 'title'], numberKeys: ['relief_basis_number', 'record_number'] },
  drawing: { table: 'psi_drawings', moduleLabel: 'Drawings / P&IDs', titleKeys: ['drawing_title', 'title', 'document_title'], numberKeys: ['drawing_number', 'document_number', 'record_number'] },
  'electrical-classification': { table: 'psi_electrical_classifications', moduleLabel: 'Electrical Classification', titleKeys: ['classification_title', 'area_name', 'title'], numberKeys: ['classification_number', 'record_number'] },
  'material-compatibility': { table: 'psi_material_compatibility', moduleLabel: 'Material Compatibility', titleKeys: ['compatibility_title', 'material_name', 'title'], numberKeys: ['compatibility_number', 'record_number'] },
  safeguard: { table: 'psi_safeguards', moduleLabel: 'Safeguards / Controls', titleKeys: ['safeguard_title', 'safeguard_name', 'title'], numberKeys: ['safeguard_number', 'record_number'] },
  'completeness-requirement': { table: 'psi_completeness_requirements', moduleLabel: 'PSI Completeness Requirements', titleKeys: ['requirement_title', 'requirement_name', 'title'], numberKeys: ['requirement_number', 'record_number'] },
  'completeness-waiver': { table: 'psi_completeness_evaluations', moduleLabel: 'PSI Completeness Waivers', titleKeys: ['waiver_title', 'requirement_title', 'title'], numberKeys: ['waiver_number', 'record_number'] },
  'integration-link': { table: 'psi_integration_links', moduleLabel: 'PSI Integration Links', titleKeys: ['integration_title', 'psi_record_title', 'source_record_title'], numberKeys: ['record_number'] },
  'moc-impact': { table: 'psi_moc_impact_items', moduleLabel: 'MOC PSI Impact Items', titleKeys: ['checklist_item', 'psi_module', 'blocker_reason'], numberKeys: ['moc_id'] },
  'pssr-blocker': { table: 'psi_pssr_blockers', moduleLabel: 'PSSR PSI Blockers', titleKeys: ['blocker_title', 'blocker_description'], numberKeys: ['pssr_id'] },
  'hazop-basis': { table: 'psi_hazop_basis_links', moduleLabel: 'HAZOP PSI Basis Links', titleKeys: ['basis_type', 'psi_record_title'], numberKeys: ['hazop_id'] },
  'mi-readiness-impact': { table: 'psi_mi_readiness_impacts', moduleLabel: 'MI PSI Readiness Impacts', titleKeys: ['impact_title', 'impact_description'], numberKeys: ['mi_record_id'] }
};

const defaultStages = [
  { stageName: 'Owner / Author Review', requiredRole: 'Record Owner' },
  { stageName: 'HSE / Process Safety Review', requiredRole: 'HSE / Process Safety' },
  { stageName: 'Final Approver / Company Admin', requiredRole: 'Final Approver' }
];

@Injectable()
export class PsiReviewApprovalService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: QueryMap = {}) {
    const register = await this.register(user, query);
    const rows = register.rows;
    const summary = await this.summary(user, query);
    return {
      ...register,
      summary,
      charts: {
        pendingByModule: this.countBy(rows.filter((row) => pendingStatuses.includes(row.approval_status)), 'psi_module'),
        pendingByReviewer: this.countBy(rows.filter((row) => pendingStatuses.includes(row.approval_status)), 'current_stage_name'),
        overdueByUnit: this.countBy(rows.filter((row) => this.isOverdue(row)), 'unit_id'),
        validationStatuses: this.countBy(rows, 'validation_status'),
        criticalByStatus: this.countBy(rows.filter((row) => row.safety_critical || row.psm_critical || row.criticality === 'Critical'), 'approval_status'),
        workflowStages: this.countBy(rows, 'current_stage_name')
      },
      recentApprovals: rows.filter((row) => /Approved/.test(row.approval_status)).slice(0, 8),
      recentReturns: rows.filter((row) => ['Returned', 'Rejected'].includes(row.approval_status)).slice(0, 8),
      upcomingDeadlines: rows.filter((row) => row.due_date && !terminalStatuses.includes(row.approval_status)).slice(0, 8),
      lastUpdated: new Date().toISOString()
    };
  }

  async summary(user: RequestUser, query: QueryMap = {}) {
    const rows = await this.allScopedRequests(user, query);
    const assignedIds = await this.assignedApprovalIds(user);
    const assignedSet = new Set(assignedIds);
    const now = new Date();
    const month = now.getMonth();
    const pending = rows.filter((row) => pendingStatuses.includes(row.approval_status));
    return {
      totalPendingPsiReviews: pending.length,
      myPendingReviews: pending.filter((row) => assignedSet.has(row.id)).length,
      mySubmittedRecords: rows.filter((row) => row.submitted_by === user.id).length,
      overdueReviews: rows.filter((row) => this.isOverdue(row)).length,
      returnedReviews: rows.filter((row) => row.approval_status === 'Returned').length,
      rejectedReviews: rows.filter((row) => row.approval_status === 'Rejected').length,
      approvedThisMonth: rows.filter((row) => /Approved/.test(row.approval_status) && row.final_decision_at && new Date(row.final_decision_at).getMonth() === month).length,
      criticalPsiPendingApproval: pending.filter((row) => row.safety_critical || row.psm_critical || row.criticality === 'Critical').length,
      pssrBlockerApprovalsPending: pending.filter((row) => row.pssr_blocker).length,
      mocRequiredPsiPendingApproval: pending.filter((row) => row.moc_required).length,
      validationFailures: rows.filter((row) => row.validation_status === 'Failed').length,
      eSignaturesPending: pending.filter((row) => row.global_esignature_id || row.e_signature_required).length,
      escalatedReviews: rows.filter((row) => row.approval_status === 'Escalated').length,
      waiverApprovalsPending: pending.filter((row) => /waiver/i.test(row.approval_type ?? '')).length,
      reviewSlaBreaches: rows.filter((row) => this.isOverdue(row)).length,
      recordsApprovedButNowStale: rows.filter((row) => row.stale_approval).length
    };
  }

  inbox(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, assignedToMe: 'true' });
  }

  mySubmissions(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, submittedByMe: 'true', userId: user.id });
  }

  pending(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, statusGroup: 'pending' });
  }

  overdue(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, overdue: 'true' });
  }

  returned(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, status: 'Returned' });
  }

  rejected(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, status: 'Rejected' });
  }

  approved(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, statusGroup: 'approved' });
  }

  completed(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, statusGroup: 'completed' });
  }

  escalated(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, status: 'Escalated' });
  }

  validationFailures(user: RequestUser, query: QueryMap = {}) {
    return this.register(user, { ...query, validationStatus: 'Failed' });
  }

  async register(user: RequestUser, query: QueryMap = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const assignedIds = query.assignedToMe === 'true' ? await this.assignedApprovalIds(user) : undefined;
    let request = this.applyFilters(this.scoped(this.db.from('psi_approval_requests').select('*', { count: 'exact' }), user, query), query, assignedIds);
    const sort = query.sort ?? 'updated_at.desc';
    const [column, dir] = sort.split('.');
    const { data, count, error } = await request.order(column || 'updated_at', { ascending: dir === 'asc' }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = await this.withStageNames(data ?? []);
    return { rows, page, limit, total: count ?? rows.length, savedViews: this.savedViews(), filters: query };
  }

  async sourceReviewStatus(user: RequestUser, module: string, recordId: string) {
    const source = await this.resolveSource(user, module, recordId);
    const rows = await this.db.many<any>(
      this.db.from('psi_approval_requests')
        .select('*')
        .eq('company_id', user.tenantId)
        .eq('psi_module', this.normalizeModule(module))
        .eq('psi_record_id', recordId)
        .order('created_at', { ascending: false })
    );
    return { source, approvals: await this.withStageNames(rows), latest: rows[0] ?? null };
  }

  async detail(user: RequestUser, approvalId: string) {
    const approval = await this.getApproval(user, approvalId);
    const [stages, participants, validationResults, snapshots, comments, history, escalations, signatures] = await Promise.all([
      this.stages(user, approvalId),
      this.participants(user, approvalId),
      this.validationResults(user, approvalId),
      this.snapshots(user, approvalId),
      this.comments(user, approvalId),
      this.history(user, approvalId),
      this.escalations(user, approvalId),
      this.esignatureLinks(user, approvalId)
    ]);
    const source = await this.resolveSource(user, approval.psi_module, approval.psi_record_id).catch((error) => ({
      restricted: true,
      error: error instanceof Error ? error.message : 'Source record unavailable'
    }));
    const packagePayload = this.packagePayload(approval, source, stages, participants, validationResults, snapshots, comments, signatures);
    return {
      approval,
      source,
      package: packagePayload,
      stages,
      participants,
      validationResults,
      snapshots,
      latestSnapshot: snapshots[0] ?? null,
      diff: snapshots[0]?.diff_json ?? null,
      comments,
      history,
      escalations,
      signatures,
      readOnly: terminalStatuses.includes(approval.approval_status),
      permissionState: this.permissionState(approval, user)
    };
  }

  async submitReview(user: RequestUser, module: string, recordId: string, body: Record<string, any> = {}) {
    const source = await this.resolveSource(user, module, recordId);
    const existing = await this.db.many<any>(
      this.db.from('psi_approval_requests')
        .select('id, approval_status')
        .eq('company_id', user.tenantId)
        .eq('psi_module', source.psi_module)
        .eq('psi_record_id', source.id)
        .in('approval_status', ['Submitted', 'Under Review', 'Validation Failed', 'Returned', 'Reopened'])
        .limit(1)
    );
    if (existing[0] && body.allowDuplicate !== true) throw new BadRequestException('A non-terminal PSI approval request already exists for this record.');
    const rule = await this.matchRule(user, source, body);
    const settings = await this.settingsFor(user, source.site_id);
    const dueDate = this.dueDate(rule, settings, body);
    const approval = await this.db.single<any>(this.db.from('psi_approval_requests').insert({
      company_id: user.tenantId,
      site_id: source.site_id,
      unit_id: source.unit_id,
      area_id: source.area_id,
      equipment_id: source.equipment_id,
      psi_module: source.psi_module,
      psi_record_id: source.id,
      psi_record_title: source.title,
      approval_type: body.approvalType ?? body.approval_type ?? rule?.rule_name ?? 'PSI Technical Review',
      approval_status: 'Submitted',
      criticality: body.criticality ?? source.criticality,
      safety_critical: Boolean(body.safetyCritical ?? body.safety_critical ?? source.safety_critical),
      psm_critical: Boolean(body.psmCritical ?? body.psm_critical ?? source.psm_critical),
      moc_required: Boolean(body.mocRequired ?? body.moc_required ?? source.moc_required),
      pssr_blocker: Boolean(body.pssrBlocker ?? body.pssr_blocker ?? source.pssr_blocker),
      completeness_status: source.completeness_status,
      conflict_status: source.conflict_status,
      validation_status: 'Not Run',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
      submitter_note: body.submitterNote ?? body.submitter_note ?? body.reason ?? null,
      due_date: dueDate,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    const stages = await this.createStages(user, approval, rule, body);
    const firstStage = stages[0];
    const row = firstStage
      ? await this.db.single<any>(this.db.from('psi_approval_requests').update({ current_stage_id: firstStage.id, approval_status: 'Under Review', updated_at: new Date().toISOString() }).eq('id', approval.id).select().single())
      : approval;
    await this.createSnapshot(user, row, null, source.raw, 'Submission');
    await this.validate(user, row.id);
    await this.event(user, row, 'PSI_APPROVAL_SUBMITTED', 'PSI record submitted for review', body.reason ?? body.submitterNote, null, row);
    await this.writePsiHistory(user, source, 'PSI_REVIEW_SUBMITTED', 'PSI review submitted', body.submitterNote ?? body.reason ?? null, row).catch(() => null);
    return this.detail(user, row.id);
  }

  async withdraw(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const reason = this.required(body.reason, 'Withdraw requires reason.');
    const approval = await this.getApproval(user, approvalId);
    if (terminalStatuses.includes(approval.approval_status)) throw new BadRequestException('Completed PSI approvals are immutable.');
    const row = await this.updateApproval(user, approval, { approval_status: 'Draft', final_decision: 'Withdrawn', final_decision_by: user.id, final_decision_at: new Date().toISOString(), closed_at: new Date().toISOString() }, 'PSI_APPROVAL_WITHDRAWN', reason);
    return this.detail(user, row.id);
  }

  resubmit(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    return this.transitionForReview(user, approvalId, 'Under Review', 'PSI_APPROVAL_RESUBMITTED', body.reason ?? body.submitterNote ?? 'Resubmitted after changes');
  }

  async validate(user: RequestUser, approvalId: string) {
    const approval = await this.getApproval(user, approvalId);
    const source = await this.resolveSource(user, approval.psi_module, approval.psi_record_id).catch((error) => ({ missing: true, message: error instanceof Error ? error.message : 'Source record unavailable', raw: null }));
    const latest = await this.latestSnapshot(user, approval.id);
    const sourceChanged = Boolean(latest?.after_json && !this.sameJson(latest.after_json, (source as any).raw));
    const docSnapshot = latest?.document_snapshot_json as any;
    const completenessOk = !['Failed', 'Critical Gap', 'Incomplete'].includes(String(approval.completeness_status ?? 'Passed'));
    const conflictOk = !['Failed', 'Critical Conflict', 'Conflict'].includes(String(approval.conflict_status ?? 'Passed'));
    const checks = [
      this.validationRow(approval, 'source_record_exists', 'Source PSI record exists', (source as any).missing ? 'Failed' : 'Passed', (source as any).message ?? 'Source record resolved from PSI module table.', 'Critical', true),
      this.validationRow(approval, 'source_scope_valid', 'Company/site/unit scope valid', (source as any).site_id && this.hasSite(user, (source as any).site_id) ? 'Passed' : 'Failed', 'Record is inside allowed company/site/unit scope.', 'Critical', true),
      this.validationRow(approval, 'completeness_check', 'PSI completeness acceptable', completenessOk ? 'Passed' : 'Failed', completenessOk ? 'Completeness status is acceptable.' : `Completeness status is ${approval.completeness_status}.`, 'Critical', !completenessOk),
      this.validationRow(approval, 'conflict_check', 'PSI conflicts acceptable', conflictOk ? 'Passed' : 'Failed', conflictOk ? 'No blocking PSI conflicts detected.' : `Conflict status is ${approval.conflict_status}.`, 'Major', !conflictOk),
      this.validationRow(approval, 'moc_required_link', 'MOC link checked', approval.moc_required ? 'Warning' : 'Passed', approval.moc_required ? 'This approval requires MOC linkage/status validation before final approval.' : 'MOC is not required by this package.', 'Major', false, 'MOC'),
      this.validationRow(approval, 'pssr_blocker_clearance', 'PSSR blocker checked', approval.pssr_blocker ? 'Warning' : 'Passed', approval.pssr_blocker ? 'PSSR blocker exists and must be cleared or waived by policy.' : 'No PSSR blocker marked on package.', 'Major', Boolean(approval.pssr_blocker)),
      this.validationRow(approval, 'documents_current', 'Required document evidence current', Array.isArray(docSnapshot?.missing) && docSnapshot.missing.length ? 'Failed' : 'Passed', Array.isArray(docSnapshot?.missing) && docSnapshot.missing.length ? `${docSnapshot.missing.length} document evidence item(s) missing.` : 'Document evidence snapshot is acceptable or not required.', 'Major', Array.isArray(docSnapshot?.missing) && docSnapshot.missing.length > 0, 'Document Control'),
      this.validationRow(approval, 'stale_package', 'Approval package current', sourceChanged ? 'Failed' : 'Passed', sourceChanged ? 'Source record changed after submission. Revalidation or resubmission is required.' : 'Approval package is current.', 'Critical', sourceChanged)
    ];
    await this.db.many(this.db.from('psi_approval_validation_results').delete().eq('approval_request_id', approval.id).select()).catch(() => []);
    const rows = await this.db.many<any>(this.db.from('psi_approval_validation_results').insert(checks).select());
    const failed = rows.filter((row) => row.validation_status === 'Failed');
    const warnings = rows.filter((row) => row.validation_status === 'Warning');
    const validationStatus = failed.length ? 'Failed' : warnings.length ? 'Warning' : 'Passed';
    await this.db.single(this.db.from('psi_approval_requests').update({ validation_status: validationStatus, stale_approval: sourceChanged, stale_reason: sourceChanged ? 'Source record changed after submission.' : null, updated_at: new Date().toISOString() }).eq('id', approval.id).select('id').single());
    await this.event(user, approval, 'PSI_APPROVAL_VALIDATED', 'PSI approval validations run', null, null, rows);
    return rows;
  }

  validationResults(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_validation_results').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('severity'));
  }

  approve(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    return this.decide(user, approvalId, 'Approved', body);
  }

  reject(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    if (!this.text(body.reason ?? body.comment)) throw new BadRequestException('Reject requires reason.');
    return this.decide(user, approvalId, 'Rejected', body);
  }

  returnForChanges(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    if (!this.text(body.reason ?? body.comment)) throw new BadRequestException('Return for changes requires reason.');
    return this.decide(user, approvalId, 'Returned', body);
  }

  async delegate(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const target = this.required(body.delegateToUserId ?? body.delegatedToUserId ?? body.delegated_to_user_id, 'Delegate target is required.');
    const reason = this.required(body.reason, 'Delegate requires reason.');
    const approval = await this.getApproval(user, approvalId);
    const stage = await this.activeStage(user, approval);
    await this.db.single(this.db.from('psi_approval_stages').update({ assigned_user_id: target, stage_status: 'Delegated', decision_comment: reason, updated_at: new Date().toISOString() }).eq('id', stage.id).select('id').single());
    await this.db.single(this.db.from('psi_approval_participants').insert({ company_id: user.tenantId, site_id: approval.site_id, approval_request_id: approval.id, stage_id: stage.id, user_id: target, role_name: stage.required_role, participant_type: 'Delegate', can_approve: true, can_comment: true, can_delegate: false, added_by: user.id }).select('id').single());
    const row = await this.updateApproval(user, approval, { approval_status: 'Delegated' }, 'PSI_APPROVAL_DELEGATED', reason);
    return this.detail(user, row.id);
  }

  async escalate(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const reason = this.required(body.reason, 'Escalate requires reason.');
    const approval = await this.getApproval(user, approvalId);
    const stage = await this.activeStage(user, approval).catch(() => null);
    await this.db.single(this.db.from('psi_approval_escalations').insert({ company_id: user.tenantId, site_id: approval.site_id, approval_request_id: approval.id, stage_id: stage?.id ?? null, escalation_reason: reason, escalated_to_user_id: body.escalatedToUserId ?? body.escalated_to_user_id ?? null, escalated_to_role: body.escalatedToRole ?? body.escalated_to_role ?? 'Admin', escalated_by: user.id }).select('id').single());
    const row = await this.updateApproval(user, approval, { approval_status: 'Escalated' }, 'PSI_APPROVAL_ESCALATED', reason);
    return this.detail(user, row.id);
  }

  async override(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const reason = this.required(body.reason, 'Override requires reason.');
    const approval = await this.getApproval(user, approvalId);
    await this.addComment(user, approval.id, { commentType: 'Override', commentText: reason, internalOnly: true });
    const row = await this.updateApproval(user, approval, { validation_status: 'Override Accepted' }, 'PSI_APPROVAL_OVERRIDE_ACCEPTED', reason);
    return this.detail(user, row.id);
  }

  async addComment(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const approval = await this.getApproval(user, approvalId);
    const commentText = this.required(body.commentText ?? body.comment_text ?? body.comment, 'Comment text is required.');
    const row = await this.db.single<any>(this.db.from('psi_approval_comments').insert({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_request_id: approval.id,
      stage_id: body.stageId ?? body.stage_id ?? approval.current_stage_id ?? null,
      comment_type: body.commentType ?? body.comment_type ?? 'Comment',
      comment_text: commentText,
      internal_only: Boolean(body.internalOnly ?? body.internal_only),
      created_by: user.id
    }).select().single());
    await this.event(user, approval, 'PSI_APPROVAL_COMMENTED', 'PSI approval comment added', commentText, null, row);
    return row;
  }

  async updateComment(user: RequestUser, approvalId: string, commentId: string, body: Record<string, any> = {}) {
    await this.getApproval(user, approvalId);
    const row = await this.db.single<any>(this.db.from('psi_approval_comments').update({ comment_text: body.commentText ?? body.comment_text, comment_type: body.commentType ?? body.comment_type, internal_only: body.internalOnly ?? body.internal_only, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('approval_request_id', approvalId).eq('id', commentId).select().single());
    return row;
  }

  async deleteComment(user: RequestUser, approvalId: string, commentId: string) {
    await this.getApproval(user, approvalId);
    return this.db.single<any>(this.db.from('psi_approval_comments').update({ deleted_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('approval_request_id', approvalId).eq('id', commentId).select().single());
  }

  comments(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_comments').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).is('deleted_at', null).order('created_at', { ascending: false }));
  }

  stages(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_stages').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('stage_order'));
  }

  participants(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_participants').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).is('removed_at', null).order('added_at'));
  }

  snapshots(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_snapshots').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('created_at', { ascending: false }));
  }

  async diff(user: RequestUser, approvalId: string) {
    const latest = await this.latestSnapshot(user, approvalId);
    return latest?.diff_json ?? { changedFields: [], message: 'No diff available for this PSI approval snapshot.' };
  }

  history(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_history_events').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('created_at', { ascending: false }));
  }

  sourceApprovalHistory(user: RequestUser, module: string, recordId: string) {
    return this.db.many<any>(this.db.from('psi_approval_history_events').select('*').eq('company_id', user.tenantId).eq('psi_module', this.normalizeModule(module)).eq('psi_record_id', recordId).order('created_at', { ascending: false }));
  }

  escalations(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_escalations').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('escalated_at', { ascending: false }));
  }

  esignatureLinks(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('psi_approval_esignature_links').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('signed_at', { ascending: false })).catch(() => []);
  }

  rules(user: RequestUser, query: QueryMap = {}) {
    let request = this.db.from('psi_approval_rules').select('*').or(`company_id.eq.${user.tenantId},company_id.is.null`);
    if (query.module) request = request.eq('psi_module', query.module);
    if (query.active) request = request.eq('active', query.active === 'true');
    return this.db.many<any>(request.order('created_at', { ascending: false }));
  }

  async createRule(user: RequestUser, body: Record<string, any>) {
    const ruleName = this.required(body.ruleName ?? body.rule_name, 'Rule name is required.');
    const psiModule = this.required(body.psiModule ?? body.psi_module, 'PSI module is required.');
    const row = await this.db.single<any>(this.db.from('psi_approval_rules').insert({
      company_id: user.tenantId,
      site_id: body.siteId ?? body.site_id ?? null,
      rule_name: ruleName,
      psi_module: this.normalizeModule(psiModule),
      record_type: body.recordType ?? body.record_type ?? null,
      applicability_scope: body.applicabilityScope ?? body.applicability_scope ?? 'Company',
      applicability_filter_json: this.json(body.applicabilityFilter ?? body.applicability_filter_json),
      criticality_filter: body.criticalityFilter ?? body.criticality_filter ?? null,
      safety_critical_filter: body.safetyCriticalFilter ?? body.safety_critical_filter ?? null,
      psm_critical_filter: body.psmCriticalFilter ?? body.psm_critical_filter ?? null,
      moc_required_filter: body.mocRequiredFilter ?? body.moc_required_filter ?? null,
      pssr_blocker_filter: body.pssrBlockerFilter ?? body.pssr_blocker_filter ?? null,
      conflict_severity_filter: body.conflictSeverityFilter ?? body.conflict_severity_filter ?? null,
      completeness_threshold: body.completenessThreshold ?? body.completeness_threshold ?? null,
      required_stages_json: this.json(body.requiredStages ?? body.required_stages_json ?? defaultStages),
      required_esignature: Boolean(body.requiredEsignature ?? body.required_esignature),
      allow_delegate: Boolean(body.allowDelegate ?? body.allow_delegate),
      allow_override: Boolean(body.allowOverride ?? body.allow_override),
      allow_waiver: Boolean(body.allowWaiver ?? body.allow_waiver),
      sla_hours: body.slaHours ?? body.sla_hours ?? null,
      escalation_rule_json: this.json(body.escalationRule ?? body.escalation_rule_json),
      active: body.active !== false,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.event(user, row, 'PSI_APPROVAL_RULE_CREATED', 'PSI approval rule created', null, null, row);
    return row;
  }

  async updateRule(user: RequestUser, ruleId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.db.from('psi_approval_rules').select('*').eq('id', ruleId).or(`company_id.eq.${user.tenantId},company_id.is.null`).single());
    if (!before) throw new NotFoundException('PSI approval rule not found.');
    const patch: Record<string, any> = { updated_by: user.id, updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(body)) {
      const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (['rule_name', 'psi_module', 'record_type', 'applicability_scope', 'criticality_filter', 'conflict_severity_filter', 'completeness_threshold', 'required_esignature', 'allow_delegate', 'allow_override', 'allow_waiver', 'sla_hours', 'active'].includes(snake)) patch[snake] = value;
      if (['required_stages', 'required_stages_json'].includes(snake)) patch.required_stages_json = this.json(value);
      if (['applicability_filter', 'applicability_filter_json'].includes(snake)) patch.applicability_filter_json = this.json(value);
      if (['escalation_rule', 'escalation_rule_json'].includes(snake)) patch.escalation_rule_json = this.json(value);
    }
    const row = await this.db.single<any>(this.db.from('psi_approval_rules').update(patch).eq('id', ruleId).select().single());
    await this.event(user, row, 'PSI_APPROVAL_RULE_UPDATED', 'PSI approval rule updated', body.reason ?? null, before, row);
    return row;
  }

  async archiveRule(user: RequestUser, ruleId: string, body: Record<string, any> = {}) {
    const row = await this.db.single<any>(this.db.from('psi_approval_rules').update({ active: false, archived_at: new Date().toISOString(), archived_by: user.id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', ruleId).or(`company_id.eq.${user.tenantId},company_id.is.null`).select().single());
    await this.event(user, row, 'PSI_APPROVAL_RULE_ARCHIVED', 'PSI approval rule archived', body.reason ?? null, null, row);
    return row;
  }

  async applyTemplate(user: RequestUser, body: Record<string, any> = {}) {
    const module = this.normalizeModule(body.psiModule ?? body.psi_module ?? 'all');
    return this.createRule(user, {
      ruleName: body.ruleName ?? `Default ${module} PSI approval`,
      psiModule: module,
      applicabilityScope: body.applicabilityScope ?? 'Company',
      requiredStages: body.requiredStages ?? defaultStages,
      requiredEsignature: body.requiredEsignature ?? false,
      allowDelegate: true,
      allowOverride: true,
      allowWaiver: true,
      slaHours: body.slaHours ?? 168,
      active: true
    });
  }

  async settings(user: RequestUser, query: QueryMap = {}) {
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? null;
    return this.settingsFor(user, siteId);
  }

  async updateSettings(user: RequestUser, body: Record<string, any> = {}) {
    const siteId = body.siteId ?? body.site_id ?? user.selectedSiteId ?? null;
    const before = await this.settingsFor(user, siteId);
    const payload = {
      company_id: user.tenantId,
      site_id: siteId,
      block_critical_gaps: body.blockCriticalGaps ?? body.block_critical_gaps ?? before.block_critical_gaps,
      block_critical_conflicts: body.blockCriticalConflicts ?? body.block_critical_conflicts ?? before.block_critical_conflicts,
      require_moc_for_impacted_changes: body.requireMocForImpactedChanges ?? body.require_moc_for_impacted_changes ?? before.require_moc_for_impacted_changes,
      require_pssr_clearance: body.requirePssrClearance ?? body.require_pssr_clearance ?? before.require_pssr_clearance,
      require_esignature_for_critical: body.requireEsignatureForCritical ?? body.require_esignature_for_critical ?? before.require_esignature_for_critical,
      stale_after_source_change: body.staleAfterSourceChange ?? body.stale_after_source_change ?? before.stale_after_source_change,
      default_sla_hours: body.defaultSlaHours ?? body.default_sla_hours ?? before.default_sla_hours,
      settings_json: this.json(body.settings ?? body.settings_json ?? before.settings_json),
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const row = before?.id
      ? await this.db.single<any>(this.db.from('psi_approval_settings').update(payload).eq('id', before.id).select().single())
      : await this.db.single<any>(this.db.from('psi_approval_settings').insert(payload).select().single());
    await this.event(user, row, 'PSI_APPROVAL_SETTINGS_UPDATED', 'PSI approval settings updated', body.reason ?? null, before, row);
    return row;
  }

  async exportRows(user: RequestUser, query: QueryMap = {}) {
    const rows = await this.allScopedRequests(user, query);
    const header = ['id', 'psi_module', 'psi_record_title', 'approval_status', 'validation_status', 'criticality', 'moc_required', 'pssr_blocker', 'submitted_by', 'due_date', 'final_decision'];
    return {
      fileName: `psi-review-approval-${new Date().toISOString().slice(0, 10)}.csv`,
      content: [header.join(','), ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n')
    };
  }

  lookups() {
    return {
      approvalStatuses: ['Draft', 'Ready to Submit', 'Submitted', 'Validation Failed', 'Under Review', 'Returned', 'Rejected', 'Approved', 'Approved Current', 'Superseded', 'Reopened', 'Archived', 'Escalated', 'Delegated', 'Completed'],
      approvalStages: defaultStages.map((stage) => stage.stageName),
      approvalTypes: ['Technical Review', 'New Record Approval', 'Edit Approval', 'Reapproval', 'MOC-driven Update', 'Document Revision Update', 'Waiver Approval', 'Reopen Approval'],
      reviewableModules,
      decisionTypes: ['Approve', 'Reject', 'Return for Changes', 'Delegate', 'Escalate', 'Withdraw', 'Override', 'Comment', 'Request Evidence'],
      validationStatuses: ['Not Run', 'Passed', 'Warning', 'Failed', 'Override Accepted']
    };
  }

  private async decide(user: RequestUser, approvalId: string, decision: 'Approved' | 'Rejected' | 'Returned', body: Record<string, any>) {
    const approval = await this.getApproval(user, approvalId);
    if (terminalStatuses.includes(approval.approval_status)) throw new BadRequestException('Completed PSI approvals are immutable.');
    const stage = await this.activeStage(user, approval).catch(() => null);
    if (decision === 'Approved') {
      const validations = await this.validationResults(user, approval.id);
      const blockingFailures = validations.filter((row) => row.blocking && row.validation_status === 'Failed');
      if (blockingFailures.length && body.override !== true) throw new BadRequestException(`Approval blocked by ${blockingFailures.length} validation failure(s).`);
    }
    const now = new Date().toISOString();
    if (stage) {
      await this.db.single(this.db.from('psi_approval_stages').update({ stage_status: decision, completed_at: now, completed_by: user.id, decision, decision_comment: body.comment ?? body.reason ?? null, updated_at: now }).eq('id', stage.id).select('id').single());
    }
    const status = decision === 'Approved' ? 'Approved Current' : decision;
    const row = await this.updateApproval(user, approval, {
      approval_status: status,
      final_decision: decision,
      final_decision_by: user.id,
      final_decision_at: now,
      closed_at: now,
      locked_at: decision === 'Approved' ? now : null,
      locked_by: decision === 'Approved' ? user.id : null
    }, `PSI_APPROVAL_${decision.toUpperCase()}`, body.reason ?? body.comment ?? null);
    if (decision === 'Approved') {
      const source = await this.resolveSource(user, approval.psi_module, approval.psi_record_id).catch(() => null);
      if (source) await this.createSnapshot(user, row, approval, source.raw, 'Final Approval');
    }
    return this.detail(user, row.id);
  }

  private async transitionForReview(user: RequestUser, approvalId: string, approvalStatus: string, eventType: string, reason: string) {
    const approval = await this.getApproval(user, approvalId);
    const row = await this.updateApproval(user, approval, { approval_status: approvalStatus, submitted_at: new Date().toISOString(), submitted_by: user.id }, eventType, reason);
    await this.validate(user, row.id);
    return this.detail(user, row.id);
  }

  private async updateApproval(user: RequestUser, approval: any, patch: Record<string, any>, eventType: string, reason: string | null) {
    const row = await this.db.single<any>(this.db.from('psi_approval_requests').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', approval.id).select().single());
    await this.event(user, row, eventType, eventType.replace(/_/g, ' '), reason, approval, row);
    return row;
  }

  private async createStages(user: RequestUser, approval: any, rule: any, body: Record<string, any>) {
    const rawStages = body.stages ?? body.requiredStages ?? rule?.required_stages_json ?? defaultStages;
    const stages = Array.isArray(rawStages) ? rawStages : defaultStages;
    const rows = stages.map((stage: any, index: number) => ({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_request_id: approval.id,
      stage_order: Number(stage.stageOrder ?? stage.stage_order ?? index + 1),
      stage_name: stage.stageName ?? stage.stage_name ?? stage.name ?? defaultStages[index]?.stageName ?? `Stage ${index + 1}`,
      required_role: stage.requiredRole ?? stage.required_role ?? stage.role ?? 'Reviewer',
      assigned_user_id: stage.assignedUserId ?? stage.assigned_user_id ?? null,
      stage_status: index === 0 ? 'Active' : 'Pending',
      started_at: index === 0 ? new Date().toISOString() : null,
      due_date: stage.dueDate ?? stage.due_date ?? approval.due_date ?? null,
      esign_required: Boolean(stage.esignRequired ?? stage.esign_required ?? rule?.required_esignature)
    }));
    const inserted = await this.db.many<any>(this.db.from('psi_approval_stages').insert(rows).select());
    const participants = inserted.flatMap((stage) => stage.assigned_user_id ? [{
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_request_id: approval.id,
      stage_id: stage.id,
      user_id: stage.assigned_user_id,
      role_name: stage.required_role,
      participant_type: 'Reviewer',
      can_approve: true,
      can_comment: true,
      can_delegate: true,
      added_by: user.id
    }] : []);
    if (participants.length) await this.db.many(this.db.from('psi_approval_participants').insert(participants).select()).catch(() => []);
    return inserted;
  }

  private async createSnapshot(user: RequestUser, approval: any, before: any, after: any, snapshotType: string) {
    const diff = this.diffJson(before, after);
    return this.db.single<any>(this.db.from('psi_approval_snapshots').insert({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_request_id: approval.id,
      psi_module: approval.psi_module,
      psi_record_id: approval.psi_record_id,
      snapshot_type: snapshotType,
      snapshot_status: snapshotType === 'Final Approval' ? 'Approved Immutable' : 'Current',
      before_json: this.json(before),
      after_json: this.json(after),
      diff_json: this.json(diff),
      completeness_snapshot_json: this.json({ status: approval.completeness_status }),
      conflict_snapshot_json: this.json({ status: approval.conflict_status }),
      document_snapshot_json: this.json({ status: 'Captured in source/document-control adapter when available' }),
      linked_record_snapshot_json: this.json({ mocRequired: approval.moc_required, pssrBlocker: approval.pssr_blocker }),
      created_by: user.id
    }).select().single());
  }

  private validationRow(approval: any, validationKey: string, validationTitle: string, validationStatus: string, message: string, severity: string, blocking: boolean, sourceModule?: string) {
    return {
      company_id: approval.company_id,
      site_id: approval.site_id,
      approval_request_id: approval.id,
      psi_module: approval.psi_module,
      psi_record_id: approval.psi_record_id,
      validation_key: validationKey,
      validation_title: validationTitle,
      validation_status: validationStatus,
      severity,
      blocking,
      message,
      source_module: sourceModule ?? null
    };
  }

  private async resolveSource(user: RequestUser, module: string, recordId: string) {
    const normalized = this.normalizeModule(module);
    const mapping = sourceMappings[normalized];
    if (!mapping) throw new BadRequestException(`Unsupported PSI reviewable module: ${module}`);
    const row = await this.db.single<any>(this.db.from(mapping.table).select('*').eq('company_id', user.tenantId).eq('id', recordId).single(), 'Source PSI record not found.');
    if (!row) throw new NotFoundException('Source PSI record not found.');
    if (row.site_id && !this.hasSite(user, row.site_id)) throw new ForbiddenException('Source PSI record is outside your selected company/site scope.');
    return {
      id: row.id,
      psi_module: normalized,
      psi_module_label: mapping.moduleLabel,
      title: this.firstText(row, mapping.titleKeys) ?? `${mapping.moduleLabel} ${row.id}`,
      record_number: this.firstText(row, mapping.numberKeys),
      site_id: row.site_id ?? user.selectedSiteId ?? null,
      unit_id: row.unit_id ?? null,
      area_id: row.area_id ?? null,
      equipment_id: row.equipment_id ?? null,
      criticality: row.criticality ?? row.risk_level ?? row.safety_criticality ?? null,
      safety_critical: Boolean(row.safety_critical ?? row.critical ?? row.psm_critical),
      psm_critical: Boolean(row.psm_critical ?? row.pse_critical),
      moc_required: Boolean(row.moc_required ?? row.moc_update_required),
      pssr_blocker: Boolean(row.pssr_blocker ?? row.startup_blocker),
      completeness_status: row.completeness_status ?? row.completeness_result ?? null,
      conflict_status: row.conflict_status ?? row.conflict_result ?? null,
      raw: row
    };
  }

  private normalizeModule(module: string) {
    return String(module).trim().toLowerCase().replace(/_/g, '-');
  }

  private async matchRule(user: RequestUser, source: any, body: Record<string, any>) {
    const siteId = body.siteId ?? body.site_id ?? source.site_id ?? null;
    const module = source.psi_module ?? this.normalizeModule(body.psiModule ?? body.psi_module ?? 'all');
    const moduleRules = await this.db.many<any>(
      this.db.from('psi_approval_rules')
        .select('*')
        .or(`company_id.eq.${user.tenantId},company_id.is.null`)
        .in('psi_module', [module, 'all'])
        .eq('active', true)
        .order('is_default_template', { ascending: false })
        .order('created_at', { ascending: false })
    ).catch(() => []);
    return moduleRules.find((rule) => !rule.site_id || rule.site_id === siteId) ?? moduleRules[0] ?? null;
  }

  private dueDate(rule: any, settings: any, body: Record<string, any>) {
    const explicit = body.dueDate ?? body.due_date;
    if (explicit) return explicit;
    const hours = Number(rule?.sla_hours ?? settings?.default_sla_hours ?? 168);
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  private async settingsFor(user: RequestUser, siteId?: string | null) {
    if (siteId) {
      const siteRows = await this.db.many<any>(
        this.db.from('psi_approval_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId).limit(1)
      ).catch(() => []);
      if (siteRows[0]) return siteRows[0];
    }
    const companyRows = await this.db.many<any>(this.db.from('psi_approval_settings').select('*').eq('company_id', user.tenantId).is('site_id', null).limit(1)).catch(() => []);
    return companyRows[0] ?? {
      block_critical_gaps: true,
      block_critical_conflicts: true,
      require_moc_for_impacted_changes: true,
      require_pssr_clearance: true,
      require_esignature_for_critical: true,
      stale_after_source_change: true,
      default_sla_hours: 168
    };
  }

  private scoped(request: any, user: RequestUser, query: QueryMap = {}) {
    let scoped = request.eq('company_id', user.tenantId);
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? undefined;
    if (siteId && this.hasSite(user, siteId)) scoped = scoped.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds?.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyFilters(request: any, query: QueryMap = {}, assignedIds?: string[]) {
    let filtered = request;
    if (assignedIds && assignedIds.length) filtered = filtered.in('id', assignedIds);
    if (assignedIds && !assignedIds.length) filtered = filtered.eq('id', '__none__');
    if (query.submittedByMe === 'true' && query.userId) filtered = filtered.eq('submitted_by', query.userId);
    if (query.status) filtered = filtered.eq('approval_status', query.status);
    if (query.validationStatus) filtered = filtered.eq('validation_status', query.validationStatus);
    if (query.module) filtered = filtered.eq('psi_module', this.normalizeModule(query.module));
    if (query.unitId ?? query.unit_id) filtered = filtered.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.equipmentId ?? query.equipment_id) filtered = filtered.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.criticality) filtered = filtered.eq('criticality', query.criticality);
    if (query.mocRequired === 'true') filtered = filtered.eq('moc_required', true);
    if (query.pssrBlocker === 'true') filtered = filtered.eq('pssr_blocker', true);
    if (query.overdue === 'true') filtered = filtered.lt('due_date', new Date().toISOString()).not('approval_status', 'in', `(${terminalStatuses.map((s) => `"${s}"`).join(',')})`);
    if (query.statusGroup === 'pending') filtered = filtered.in('approval_status', pendingStatuses);
    if (query.statusGroup === 'approved') filtered = filtered.in('approval_status', ['Approved', 'Approved Current']);
    if (query.statusGroup === 'completed') filtered = filtered.in('approval_status', terminalStatuses);
    if (query.search) filtered = filtered.or(`psi_record_title.ilike.%${query.search}%,psi_module.ilike.%${query.search}%,approval_type.ilike.%${query.search}%`);
    return filtered;
  }

  private async allScopedRequests(user: RequestUser, query: QueryMap = {}) {
    return this.db.many<any>(this.applyFilters(this.scoped(this.db.from('psi_approval_requests').select('*'), user, query), query).limit(2000)).catch(() => []);
  }

  private async assignedApprovalIds(user: RequestUser) {
    const rows = await this.db.many<any>(this.db.from('psi_approval_participants').select('approval_request_id').eq('company_id', user.tenantId).eq('user_id', user.id).is('removed_at', null)).catch(() => []);
    const stageRows = await this.db.many<any>(this.db.from('psi_approval_stages').select('approval_request_id').eq('company_id', user.tenantId).eq('assigned_user_id', user.id)).catch(() => []);
    return Array.from(new Set([...rows, ...stageRows].map((row) => row.approval_request_id).filter(Boolean)));
  }

  private async getApproval(user: RequestUser, approvalId: string) {
    const row = await this.db.single<any>(this.scoped(this.db.from('psi_approval_requests').select('*'), user).eq('id', approvalId).single(), 'PSI approval not found.');
    if (!row) throw new NotFoundException('PSI approval not found.');
    return row;
  }

  private async activeStage(user: RequestUser, approval: any) {
    const stage = approval.current_stage_id
      ? await this.db.single<any>(this.db.from('psi_approval_stages').select('*').eq('company_id', user.tenantId).eq('id', approval.current_stage_id).single()).catch(() => null)
      : null;
    if (stage) return stage;
    const rows = await this.stages(user, approval.id);
    const fallback = rows.find((row) => !row.completed_at) ?? rows[0];
    if (!fallback) throw new BadRequestException('No active approval stage is configured.');
    return fallback;
  }

  private async latestSnapshot(user: RequestUser, approvalId: string) {
    const rows = await this.db.many<any>(this.db.from('psi_approval_snapshots').select('*').eq('company_id', user.tenantId).eq('approval_request_id', approvalId).order('created_at', { ascending: false }).limit(1)).catch(() => []);
    return rows[0] ?? null;
  }

  private async withStageNames(rows: any[]) {
    const ids = rows.map((row) => row.current_stage_id).filter(Boolean);
    if (!ids.length) return rows;
    const stages = await this.db.many<any>(this.db.from('psi_approval_stages').select('id, stage_name, required_role, assigned_user_id').in('id', ids)).catch(() => []);
    const byId = new Map(stages.map((stage) => [stage.id, stage]));
    return rows.map((row) => {
      const stage = byId.get(row.current_stage_id);
      return { ...row, current_stage_name: stage?.stage_name ?? null, current_stage_required_role: stage?.required_role ?? null, current_stage_assigned_user_id: stage?.assigned_user_id ?? null };
    });
  }

  private packagePayload(approval: any, source: any, stages: any[], participants: any[], validationResults: any[], snapshots: any[], comments: any[], signatures: any[]) {
    return {
      recordSummary: {
        title: approval.psi_record_title,
        module: approval.psi_module,
        recordId: approval.psi_record_id,
        companyId: approval.company_id,
        siteId: approval.site_id,
        unitId: approval.unit_id,
        equipmentId: approval.equipment_id,
        criticality: approval.criticality
      },
      submittedBy: approval.submitted_by,
      submittedAt: approval.submitted_at,
      reasonForReview: approval.submitter_note,
      mocRequired: approval.moc_required,
      pssrImpact: approval.pssr_blocker,
      hazopMiImpact: { hazop: /hazop/i.test(String(source?.psi_module_label ?? '')), mi: Boolean(approval.equipment_id) },
      completenessStatus: approval.completeness_status,
      conflictStatus: approval.conflict_status,
      validationResults,
      requiredReviewers: participants,
      approvalStages: stages,
      comments,
      decisionHistory: validationResults.concat(comments).slice(0, 20),
      eSignatureStatus: signatures.length ? 'Captured' : approval.global_esignature_id ? 'Pending' : 'Not Required',
      snapshots,
      auditMetadata: { sourceSystem: 'PSI Review Approval Adapter', generatedAt: new Date().toISOString() }
    };
  }

  private permissionState(approval: any, user: RequestUser) {
    const terminal = terminalStatuses.includes(approval.approval_status);
    return {
      canReview: !terminal,
      canApprove: !terminal,
      canReject: !terminal,
      canReturn: !terminal,
      canComment: true,
      disabledReasons: terminal ? ['Completed PSI approvals are immutable.'] : []
    };
  }

  private savedViews() {
    return [
      { id: 'inbox', name: 'My Inbox', href: '/process-safety-information/review-approval/inbox' },
      { id: 'pending', name: 'Pending', href: '/process-safety-information/review-approval/pending' },
      { id: 'overdue', name: 'Overdue', href: '/process-safety-information/review-approval/overdue' },
      { id: 'validation-failures', name: 'Validation Failures', href: '/process-safety-information/review-approval/validation-failures' }
    ];
  }

  private async event(user: RequestUser, approval: any, eventType: string, title: string, reason?: string | null, before?: any, after?: any) {
    const audit = await this.audit.write({
      tenantId: user.tenantId,
      actorId: user.id,
      action: eventType,
      entityType: 'PSI_APPROVAL',
      entityId: approval.id,
      before: this.json(before),
      after: this.json(after),
      metadata: this.json({ psiModule: approval.psi_module ?? null, psiRecordId: approval.psi_record_id ?? null, reason: reason ?? null })
    }).catch(() => null);
    return this.db.single<any>(this.db.from('psi_approval_history_events').insert({
      company_id: user.tenantId,
      site_id: approval.site_id ?? null,
      unit_id: approval.unit_id ?? null,
      area_id: approval.area_id ?? null,
      equipment_id: approval.equipment_id ?? null,
      approval_request_id: approval.id ?? null,
      psi_module: approval.psi_module ?? null,
      psi_record_id: approval.psi_record_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: reason ?? title,
      actor_user_id: user.id,
      reason: reason ?? null,
      before_value_json: this.json(before),
      after_value_json: this.json(after),
      metadata_json: this.json({ auditId: (audit as any)?.id ?? null }),
      audit_log_id: (audit as any)?.id ?? null
    }).select().single()).catch(() => null);
  }

  private async writePsiHistory(user: RequestUser, source: any, eventType: string, title: string, reason: string | null, payload: any) {
    return this.db.single<any>(this.db.from('psi_history_events').insert({
      company_id: user.tenantId,
      site_id: source.site_id,
      unit_id: source.unit_id,
      event_type: eventType,
      event_title: title,
      event_description: reason ?? title,
      actor_user_id: user.id,
      related_module: source.psi_module,
      related_record_id: source.id,
      after_value_json: this.json(payload)
    }).select().single());
  }

  private firstText(row: Record<string, any>, keys: string[]) {
    for (const key of keys) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== '') return String(value);
    }
    return null;
  }

  private hasSite(user: RequestUser, siteId: string) {
    return Boolean(user.corporateView || !user.siteIds?.length || user.siteIds.includes(siteId) || user.selectedSiteId === siteId);
  }

  private isOverdue(row: any) {
    return Boolean(row.due_date && new Date(row.due_date).getTime() < Date.now() && !terminalStatuses.includes(row.approval_status));
  }

  private countBy(rows: any[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const label = String(row[key] ?? 'Not set');
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});
  }

  private sameJson(a: unknown, b: unknown) {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }

  private diffJson(before: any, after: any) {
    const beforeObj = before && typeof before === 'object' ? before : {};
    const afterObj = after && typeof after === 'object' ? after : {};
    const keys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
    const changedFields = keys.filter((key) => JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key])).map((key) => ({ field: key, before: beforeObj[key] ?? null, after: afterObj[key] ?? null }));
    return { changedFields, changedCount: changedFields.length };
  }

  private required(value: unknown, message: string) {
    if (value === null || value === undefined || value === '') throw new BadRequestException(message);
    return String(value);
  }

  private text(value: unknown) {
    return value === null || value === undefined || value === '' ? '' : String(value);
  }

  private json(value: unknown): JsonValue | null {
    if (value === undefined) return null;
    return value as JsonValue;
  }
}
