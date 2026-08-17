import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignaturesService } from '../signatures/signatures.service';
import { WorkflowsService } from '../workflows/workflows.service';

type Query = Record<string, string | undefined>;
type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const approvalStatuses = ['Draft','Submitted','Pending Approval','In Review','Approved','Approved With Conditions','Rejected','Returned for Correction','More Information Requested','Delegated','Escalated','Cancelled','Superseded','Completed','Expired / Overdue'];
const approvalActions = ['Approve','Reject','Return for Correction','Approve with Conditions','Request More Information','Delegate','Escalate','Add Comment','Add Attachment','Require MOC','Require Action','Require Document','Require Readiness Review'];
const approvalStages = ['Owner Review','Engineering Review','HSE / Process Safety Review','Management Approval','Functional Safety Review','Relief Specialist Review','Readiness Approval','Document Waiver Approval'];
const approvalSourceModules = ['Equipment','Technical Data Change','CML / TML','UT Reading','Inspection Plan','Inspection Record','Criticality','PM Plan','PM Record','Calibration Plan','Calibration Record','PSV / Relief Device','PSV Test','SIF / SIS','Interlock','Critical Alarm','Safeguard Test','Bypass / Impairment','Deficiency','Deviation','Work Order','Readiness','Document Waiver','Import','Manual Engineering Review'];
const terminalStatuses = ['Approved','Approved With Conditions','Rejected','Cancelled','Superseded','Completed'];

@Injectable()
export class MiReviewApprovalService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly workflows: WorkflowsService,
    private readonly signatures: SignaturesService,
    private readonly actions: ActionsService
  ) {}

  async dashboard(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const assignedApprovalIds = query.mine === 'true' ? await this.assignedApprovalIds(user) : [];
    let request = this.applyFilters(this.scoped(this.db.from('mi_approval_instances').select('*', { count: 'exact' }), user, query), query, user, assignedApprovalIds);
    const sort = query.sort ?? 'updated_at.desc';
    const [column, dir] = sort.split('.');
    const { data, count, error } = await request.order(column || 'updated_at', { ascending: dir === 'asc' }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return { rows, page, limit, total: count ?? rows.length, summary: await this.summary(user, query), savedViews: this.savedViews(), lastUpdated: new Date().toISOString() };
  }

  async summary(user: RequestUser, query: Query = {}) {
    const assignedApprovalIds = await this.assignedApprovalIds(user);
    const rows = await this.db.many<any>(this.applyFilters(this.scoped(this.db.from('mi_approval_instances').select('*'), user, query), { ...query, page: undefined, limit: undefined }, user, query.mine === 'true' ? assignedApprovalIds : undefined).limit(1000)).catch(() => []);
    const assignedSet = new Set(assignedApprovalIds);
    const now = Date.now();
    const month = new Date().getMonth();
    const pending = rows.filter((row) => ['Submitted','Pending Approval','In Review','More Information Requested','Delegated','Escalated'].includes(row.status));
    return {
      myPendingApprovals: pending.filter((row) => this.isMine(row, user.id, assignedSet)).length,
      totalPendingApprovals: pending.length,
      overdueApprovals: rows.filter((row) => this.isOverdue(row)).length,
      escalatedApprovals: rows.filter((row) => row.status === 'Escalated').length,
      returnedForCorrection: rows.filter((row) => row.status === 'Returned for Correction').length,
      rejectedThisMonth: rows.filter((row) => row.status === 'Rejected' && row.completed_at && new Date(row.completed_at).getMonth() === month).length,
      approvedThisMonth: rows.filter((row) => /Approved|Completed/.test(row.status) && row.completed_at && new Date(row.completed_at).getMonth() === month).length,
      safetyCriticalPending: pending.filter((row) => row.safety_critical).length,
      startupReadinessPending: pending.filter((row) => row.startup_blocker || row.readiness_impact).length,
      bypassImpairmentPending: pending.filter((row) => /bypass|impairment/i.test(row.source_module)).length,
      criticalDeficiencyPending: pending.filter((row) => /deficien/i.test(row.source_module) && /critical/i.test(row.risk_level ?? '')).length,
      workOrdersPendingApproval: pending.filter((row) => /work order/i.test(row.source_module)).length,
      readinessAssessmentsPending: pending.filter((row) => /readiness/i.test(row.source_module)).length,
      documentWaiversPending: pending.filter((row) => /document waiver/i.test(row.source_module)).length,
      eSignatureRequired: pending.filter((row) => row.e_signature_required).length,
      delegatedToMe: pending.filter((row) => row.delegated_to_user_id === user.id).length,
      approvalsNearDue: pending.filter((row) => row.due_at && new Date(row.due_at).getTime() - now < 24 * 60 * 60 * 1000 && new Date(row.due_at).getTime() >= now).length
    };
  }

  inbox(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, mine: 'true' });
  }

  myApprovals(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, requestedBy: user.id });
  }

  pending(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, statusGroup: 'pending' });
  }

  overdue(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, overdue: 'true' });
  }

  escalated(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, status: 'Escalated' });
  }

  completed(user: RequestUser, query: Query = {}) {
    return this.dashboard(user, { ...query, statusGroup: 'completed' });
  }

  async detail(user: RequestUser, approvalId: string) {
    const approval = await this.getInstance(user, approvalId);
    const [stages, validations, snapshots, comments, conditions, history, documents, signatures] = await Promise.all([
      this.stages(user, approvalId),
      this.validations(user, approvalId),
      this.changeSummary(user, approvalId),
      this.comments(user, approvalId),
      this.conditions(user, approvalId),
      this.history(user, approvalId),
      this.requiredDocuments(user, approval),
      this.signatures.forRecord(user.tenantId, 'Mechanical Integrity', approval.source_module, approval.id).catch(() => [])
    ]);
    const source = await this.resolveSource(user, approval.source_module, approval.source_record_id, approval.equipment_id).catch((error) => ({ restricted: true, error: error instanceof Error ? error.message : 'Source unavailable' }));
    return {
      approval,
      source,
      stages,
      validations,
      changeSummary: snapshots,
      comments,
      conditions,
      history,
      documents,
      signatures,
      readOnly: terminalStatuses.includes(approval.status),
      permissionState: this.permissionState(approval, user)
    };
  }

  async submit(user: RequestUser, body: Record<string, any>) {
    const sourceModule = this.required(body.sourceModule ?? body.source_module, 'Source module is required.');
    const sourceRecordId = this.required(body.sourceRecordId ?? body.source_record_id, 'Source record is required.');
    const source = await this.resolveSource(user, sourceModule, sourceRecordId, body.equipmentId ?? body.equipment_id);
    const rule = await this.matchRule(user, source, body);
    if (!rule && body.allowManualApproval !== true) throw new BadRequestException('Approval rule is required unless manual approval is allowed.');
    const eSignatureRequired = Boolean(body.eSignatureRequired ?? body.e_signature_required ?? rule?.e_signature_required ?? this.highRisk(source));
    const dueAt = this.dueAt(rule, body);
    const approval = await this.db.single<any>(this.db.from('mi_approval_instances').insert({
      company_id: user.tenantId,
      site_id: source.site_id,
      approval_number: await this.nextApprovalNumber(user.tenantId, source.site_id),
      source_module: sourceModule,
      source_record_id: sourceRecordId,
      source_record_number: body.sourceRecordNumber ?? body.source_record_number ?? source.record_number ?? null,
      equipment_id: source.equipment_id ?? null,
      approval_type: body.approvalType ?? body.approval_type ?? rule?.rule_name ?? 'Manual Engineering Review',
      current_stage: 'Submitted',
      status: 'Submitted',
      priority: body.priority ?? source.priority ?? this.priorityFor(source),
      risk_level: body.riskLevel ?? body.risk_level ?? source.risk_level ?? null,
      safety_critical: Boolean(body.safetyCritical ?? body.safety_critical ?? source.safety_critical),
      psm_critical: Boolean(body.psmCritical ?? body.psm_critical ?? source.psm_critical),
      readiness_impact: Boolean(body.readinessImpact ?? body.readiness_impact ?? source.readiness_impact),
      startup_blocker: Boolean(body.startupBlocker ?? body.startup_blocker ?? source.startup_blocker),
      e_signature_required: eSignatureRequired,
      submitted_by: user.id,
      due_at: dueAt,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    const stages = await this.createStages(user, approval, rule, body);
    const workflow = await this.startWorkflow(user, approval, stages, source).catch(() => null);
    const approvalWithWorkflow = workflow?.id
      ? await this.db.single<any>(this.db.from('mi_approval_instances').update({ workflow_instance_id: workflow.id, status: 'Pending Approval', current_stage: stages[0]?.stage_name ?? 'Pending Approval', updated_at: new Date().toISOString() }).eq('id', approval.id).select().single())
      : await this.db.single<any>(this.db.from('mi_approval_instances').update({ status: 'Pending Approval', current_stage: stages[0]?.stage_name ?? 'Pending Approval', updated_at: new Date().toISOString() }).eq('id', approval.id).select().single());
    await this.snapshot(user, approvalWithWorkflow, null, source.raw ?? source);
    await this.runValidations(user, approvalWithWorkflow.id);
    await this.updateSourceStatus(user, approvalWithWorkflow, 'Submitted');
    await this.event(user, approvalWithWorkflow, 'APPROVAL_SUBMITTED', 'MI approval submitted', null, approvalWithWorkflow);
    await this.notifyStage(user, approvalWithWorkflow, stages[0], 'mi.approval.assigned', 'MI approval assigned');
    return this.detail(user, approvalWithWorkflow.id);
  }

  async approve(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    return this.decide(user, approvalId, 'Approved', body);
  }

  async reject(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    if (!this.text(body.reason ?? body.comment)) throw new BadRequestException('Reject requires reason.');
    return this.decide(user, approvalId, 'Rejected', body);
  }

  async returnForCorrection(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    if (!this.text(body.correctionComment ?? body.comment ?? body.reason)) throw new BadRequestException('Return requires correction comments.');
    return this.decide(user, approvalId, 'Returned', body);
  }

  async approveWithConditions(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const conditions = Array.isArray(body.conditions) ? body.conditions : [{ conditionText: body.conditionText, ownerUserId: body.ownerUserId, dueDate: body.dueDate }].filter((item) => item.conditionText);
    if (!conditions.length) throw new BadRequestException('Approve with conditions requires at least one condition.');
    for (const condition of conditions) {
      if (!condition.ownerUserId && !condition.owner_user_id) throw new BadRequestException('Condition owner is required.');
      if (!condition.dueDate && !condition.due_date) throw new BadRequestException('Condition due date is required.');
    }
    const result = await this.decide(user, approvalId, 'Approved With Conditions', body);
    for (const condition of conditions) await this.addCondition(user, approvalId, condition);
    return result;
  }

  async requestInfo(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    if (!this.text(body.comment ?? body.reason)) throw new BadRequestException('Request more information requires a comment.');
    const approval = await this.getInstance(user, approvalId);
    await this.addComment(user, approvalId, { commentType: 'Request More Information', commentText: body.comment ?? body.reason, requiredAction: true });
    const row = await this.updateApproval(user, approval, { status: 'More Information Requested', last_action: 'More Information Requested' }, 'APPROVAL_MORE_INFO_REQUESTED', body.comment ?? body.reason);
    return this.detail(user, row.id);
  }

  async delegate(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const target = this.required(body.delegateToUserId ?? body.delegatedToUserId ?? body.delegated_to_user_id, 'Delegate target approver is required.');
    const reason = this.required(body.reason, 'Delegate requires reason.');
    const approval = await this.getInstance(user, approvalId);
    const stage = await this.activeStage(user, approval, true);
    await this.db.single<any>(this.db.from('mi_approval_stages').update({ delegated_to_user_id: target, status: 'Delegated', comments: reason, updated_at: new Date().toISOString() }).eq('id', stage.id).select().single());
    const row = await this.updateApproval(user, approval, { status: 'Delegated', last_action: 'Delegated', updated_by: user.id }, 'APPROVAL_DELEGATED', reason);
    await this.notifyUser(user, target, row, 'mi.approval.delegated', 'MI approval delegated', reason);
    return this.detail(user, row.id);
  }

  async escalate(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const reason = this.required(body.reason, 'Escalate requires reason.');
    const approval = await this.getInstance(user, approvalId);
    const stage = await this.activeStage(user, approval, false);
    await this.db.single<any>(this.db.from('mi_approval_stages').update({ status: 'Escalated', comments: reason, updated_at: new Date().toISOString() }).eq('id', stage.id).select().single());
    if (approval.workflow_instance_id) await this.workflows.escalate(user.tenantId, user.id, approval.workflow_instance_id, this.scope(user)).catch(() => null);
    const row = await this.updateApproval(user, approval, { status: 'Escalated', last_action: 'Escalated', updated_by: user.id }, 'APPROVAL_ESCALATED', reason);
    return this.detail(user, row.id);
  }

  async cancel(user: RequestUser, approvalId: string, body: Record<string, any> = {}) {
    const reason = this.required(body.reason ?? body.cancellationReason, 'Cancellation reason is required.');
    const approval = await this.getInstance(user, approvalId);
    if (terminalStatuses.includes(approval.status)) throw new BadRequestException('Completed approvals are immutable.');
    const row = await this.updateApproval(user, approval, { status: 'Cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason, completed_at: new Date().toISOString(), last_action: 'Cancelled' }, 'APPROVAL_CANCELLED', reason);
    await this.updateSourceStatus(user, row, 'Returned for Correction').catch(() => null);
    return this.detail(user, row.id);
  }

  async runValidations(user: RequestUser, approvalId: string) {
    const approval = typeof approvalId === 'string' ? await this.getInstance(user, approvalId) : approvalId;
    const source = await this.resolveSource(user, approval.source_module, approval.source_record_id, approval.equipment_id).catch((error) => ({ missing: true, message: error instanceof Error ? error.message : 'Source record unavailable' }));
    const docs = await this.requiredDocuments(user, approval);
    const currentSnapshot = await this.latestSnapshot(user, approval.id);
    const sourceChanged = currentSnapshot?.after_snapshot_json && !this.sameSnapshot(currentSnapshot.after_snapshot_json, (source as any).raw ?? source);
    const checks = [
      this.validation(approval, 'source_record_exists', 'Source record exists', (source as any).missing ? 'Failed' : 'Passed', (source as any).message ?? 'Source record is available.', 'Critical', false),
      this.validation(approval, 'source_scope_valid', 'Source record company/site access', (source as any).site_id && this.hasSite(user, (source as any).site_id) ? 'Passed' : 'Failed', 'Source record is inside the current company/site scope.', 'Critical', false),
      this.validation(approval, 'required_documents', 'Required documents attached', docs.missing?.length ? 'Failed' : 'Passed', docs.missing?.length ? `${docs.missing.length} required document(s) missing.` : 'Required documents are complete.', 'Major', true),
      this.validation(approval, 'blockers_clear', 'Critical blockers cleared', await this.hasCriticalBlockers(user, approval) ? 'Failed' : 'Passed', 'Critical readiness/blocker checks must be resolved before approval.', 'Critical', true),
      this.validation(approval, 'e_signature_policy', 'E-signature policy', approval.e_signature_required ? 'Warning' : 'Passed', approval.e_signature_required ? 'E-signature is required before completion.' : 'E-signature is not required for this approval.', 'Warning', false),
      this.validation(approval, 'stale_approval', 'Record changed after submission', sourceChanged ? 'Failed' : 'Passed', sourceChanged ? 'Source record changed after submission. Re-submit or refresh approval package.' : 'Approval package is current.', 'Major', true)
    ];
    await this.db.many(this.db.from('mi_approval_validation_results').delete().eq('approval_instance_id', approval.id).select()).catch(() => []);
    const rows = await this.db.many<any>(this.db.from('mi_approval_validation_results').insert(checks).select());
    const failed = rows.filter((row) => row.validation_status === 'Failed');
    const status = failed.length ? 'Failed' : rows.some((row) => row.validation_status === 'Warning') ? 'Warning' : 'Passed';
    await this.db.single(this.db.from('mi_approval_instances').update({ last_validation_status: status, stale_approval: sourceChanged, updated_at: new Date().toISOString() }).eq('id', approval.id).select('id').single());
    await this.event(user, approval, 'APPROVAL_VALIDATED', 'MI approval validations run', null, rows);
    return rows;
  }

  validations(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('mi_approval_validation_results').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('severity'));
  }

  async overrideValidation(user: RequestUser, approvalId: string, validationId: string, body: Record<string, any>) {
    const reason = this.required(body.reason ?? body.overrideReason, 'Override requires reason.');
    await this.getInstance(user, approvalId);
    const before = await this.db.single<any>(this.db.from('mi_approval_validation_results').select('*').eq('company_id', user.tenantId).eq('id', validationId).eq('approval_instance_id', approvalId).maybeSingle());
    if (!before) throw new NotFoundException('Validation result not found.');
    if (!before.override_allowed) throw new BadRequestException('This validation cannot be overridden.');
    const row = await this.db.single<any>(this.db.from('mi_approval_validation_results').update({ validation_status: 'Overridden', overridden_by: user.id, override_reason: reason, updated_at: new Date().toISOString() }).eq('id', validationId).select().single());
    await this.event(user, await this.getInstance(user, approvalId), 'VALIDATION_OVERRIDDEN', 'MI approval validation overridden', before, row);
    return row;
  }

  changeSummary(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('mi_approval_change_snapshots').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('created_at', { ascending: false }));
  }

  history(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('mi_approval_history_events').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('created_at', { ascending: false }));
  }

  comments(user: RequestUser, approvalId: string) {
    let query = this.db.from('mi_approval_comments').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId);
    if (!user.permissions?.includes('mechanical_integrity.review.view_internal_comments')) query = query.eq('internal_only', false);
    return this.db.many<any>(query.order('created_at', { ascending: false }));
  }

  async addComment(user: RequestUser, approvalId: string, body: Record<string, any>) {
    const approval = await this.getInstance(user, approvalId);
    const row = await this.db.single<any>(this.db.from('mi_approval_comments').insert({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_instance_id: approval.id,
      stage_id: body.stageId ?? body.stage_id ?? null,
      comment_type: body.commentType ?? body.comment_type ?? 'General comment',
      comment_text: this.required(body.commentText ?? body.comment_text ?? body.comment, 'Comment is required.'),
      internal_only: Boolean(body.internalOnly ?? body.internal_only),
      required_action: Boolean(body.requiredAction ?? body.required_action),
      attachment_document_id: body.attachmentDocumentId ?? body.attachment_document_id ?? null,
      created_by: user.id
    }).select().single());
    await this.event(user, approval, 'APPROVAL_COMMENT_ADDED', 'MI approval comment added', null, row);
    return row;
  }

  conditions(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('mi_approval_conditions').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('created_at', { ascending: false }));
  }

  async addCondition(user: RequestUser, approvalId: string, body: Record<string, any>) {
    const approval = await this.getInstance(user, approvalId);
    const row = await this.db.single<any>(this.db.from('mi_approval_conditions').insert({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_instance_id: approval.id,
      stage_id: body.stageId ?? body.stage_id ?? null,
      condition_text: this.required(body.conditionText ?? body.condition_text, 'Condition text is required.'),
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      due_date: body.dueDate ?? body.due_date ?? null,
      created_by: user.id
    }).select().single());
    if (row.owner_user_id && row.due_date) {
      const action = await this.actions.create(user.tenantId, user.id, {
        sourceModule: 'Mechanical Integrity Review',
        sourceRecordId: approval.id,
        title: `Approval condition: ${row.condition_text}`.slice(0, 180),
        description: row.condition_text,
        priority: approval.priority === 'Critical' ? 'SAFETY_CRITICAL' : 'MEDIUM',
        ownerId: row.owner_user_id,
        dueDate: row.due_date,
        siteId: approval.site_id,
        equipmentId: approval.equipment_id ?? undefined,
        evidenceRequired: true,
        verificationRequired: true
      } as any).catch(() => null);
      if (action?.id) await this.db.single(this.db.from('mi_approval_conditions').update({ status: 'Action Created', linked_action_id: action.id }).eq('id', row.id).select('id').single());
    }
    await this.event(user, approval, 'APPROVAL_CONDITION_CREATED', 'MI approval condition created', null, row);
    return row;
  }

  async closeCondition(user: RequestUser, approvalId: string, conditionId: string, body: Record<string, any> = {}) {
    const approval = await this.getInstance(user, approvalId);
    const row = await this.db.single<any>(this.db.from('mi_approval_conditions').update({ status: 'Closed', closed_by: user.id, closed_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).eq('id', conditionId).select().single());
    await this.event(user, approval, 'APPROVAL_CONDITION_CLOSED', body.reason ?? 'MI approval condition closed', null, row);
    return row;
  }

  rules(user: RequestUser, query: Query = {}) {
    let request = this.db.from('mi_approval_rules').select('*').eq('company_id', user.tenantId);
    if (query.sourceModule) request = request.eq('source_module', query.sourceModule);
    if (query.active !== 'false') request = request.eq('active', true);
    if (query.siteId) request = request.eq('site_id', query.siteId);
    return this.db.many<any>(request.order('source_module').order('rule_name'));
  }

  async createRule(user: RequestUser, body: Record<string, any>) {
    const siteId = body.siteId ?? body.site_id ?? null;
    if (siteId) this.assertSite(user, siteId);
    const row = await this.db.single<any>(this.db.from('mi_approval_rules').insert({
      company_id: user.tenantId,
      site_id: siteId,
      rule_name: this.required(body.ruleName ?? body.rule_name, 'Rule name is required.'),
      source_module: this.required(body.sourceModule ?? body.source_module, 'Source module is required.'),
      record_type: body.recordType ?? body.record_type ?? null,
      risk_level: body.riskLevel ?? body.risk_level ?? null,
      safety_critical: body.safetyCritical ?? body.safety_critical ?? null,
      psm_critical: body.psmCritical ?? body.psm_critical ?? null,
      readiness_impact: body.readinessImpact ?? body.readiness_impact ?? null,
      startup_blocker: body.startupBlocker ?? body.startup_blocker ?? null,
      lopa_sil_impact: body.lopaSilImpact ?? body.lopa_sil_impact ?? null,
      moc_required: body.mocRequired ?? body.moc_required ?? null,
      approval_chain_json: body.approvalChainJson ?? body.approval_chain_json ?? body.approvalChain ?? [],
      e_signature_required: Boolean(body.eSignatureRequired ?? body.e_signature_required),
      due_duration_value: body.dueDurationValue ?? body.due_duration_value ?? null,
      due_duration_unit: body.dueDurationUnit ?? body.due_duration_unit ?? null,
      escalation_rule_json: body.escalationRuleJson ?? body.escalation_rule_json ?? null,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'MI_APPROVAL_RULE_CREATED', entityType: 'MiApprovalRule', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateRule(user: RequestUser, ruleId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.db.from('mi_approval_rules').select('*').eq('company_id', user.tenantId).eq('id', ruleId).maybeSingle());
    if (!before) throw new NotFoundException('Approval rule not found.');
    const patch: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() };
    for (const [input, column] of [['ruleName','rule_name'], ['sourceModule','source_module'], ['recordType','record_type'], ['riskLevel','risk_level'], ['dueDurationUnit','due_duration_unit']] as const) if (body[input] !== undefined) patch[column] = body[input];
    for (const column of ['rule_name','source_module','record_type','risk_level','safety_critical','psm_critical','readiness_impact','startup_blocker','lopa_sil_impact','moc_required','approval_chain_json','e_signature_required','due_duration_value','due_duration_unit','escalation_rule_json','active']) if (body[column] !== undefined) patch[column] = body[column];
    const row = await this.db.single<any>(this.db.from('mi_approval_rules').update(patch).eq('company_id', user.tenantId).eq('id', ruleId).select().single());
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'MI_APPROVAL_RULE_UPDATED', entityType: 'MiApprovalRule', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  archiveRule(user: RequestUser, ruleId: string) {
    return this.updateRule(user, ruleId, { active: false });
  }

  async exportRows(user: RequestUser, query: Query = {}) {
    const rows = (await this.dashboard(user, { ...query, limit: '1000' })).rows;
    return { fileName: 'mi-review-approvals.csv', content: this.csv(rows, ['approval_number','source_module','source_record_number','equipment_id','current_stage','status','priority','risk_level','submitted_by','submitted_at','due_at','e_signature_required','last_validation_status','last_action']) };
  }

  async exportOne(user: RequestUser, approvalId: string) {
    const detail = await this.detail(user, approvalId);
    return { fileName: `${detail.approval.approval_number}.csv`, content: this.csv([detail.approval], ['approval_number','source_module','source_record_number','current_stage','status','priority','risk_level','submitted_by','submitted_at','due_at','completed_at','last_action']) };
  }

  lookups() {
    return { approvalStatuses, approvalActions, approvalStages, approvalSourceModules };
  }

  private async decide(user: RequestUser, approvalId: string, decision: 'Approved' | 'Approved With Conditions' | 'Rejected' | 'Returned', body: Record<string, any>) {
    const approval = await this.getInstance(user, approvalId);
    if (terminalStatuses.includes(approval.status)) throw new BadRequestException('Completed approvals are immutable.');
    if (approval.submitted_by === user.id) throw new ForbiddenException('Self-approval is blocked by policy.');
    const stage = await this.activeStage(user, approval, true);
    const validations = await this.runValidations(user, approval.id);
    const blocking = validations.filter((row: any) => row.validation_status === 'Failed' && row.severity !== 'Info');
    if ((decision === 'Approved' || decision === 'Approved With Conditions') && blocking.length && !(body.overrideReason ?? body.override_reason)) throw new BadRequestException(`Approval blocked: ${blocking.map((item: any) => item.validation_title).join(', ')}`);
    let signatureId: string | null = null;
    if ((decision === 'Approved' || decision === 'Approved With Conditions') && approval.e_signature_required) {
      if (!body.signature) throw new BadRequestException('E-signature is required before this approval can complete.');
      const signature = await this.signatures.sign(user.tenantId, user.id, {
        moduleName: 'Mechanical Integrity',
        recordType: approval.source_module,
        recordId: approval.id,
        recordNumber: approval.approval_number,
        actionType: decision,
        signatureRole: stage.stage_name,
        declarationText: body.signature.declarationText ?? `I confirm this ${approval.source_module} approval decision: ${decision}.`,
        authMethod: body.signature.authMethod,
        usernameReentry: body.signature.usernameReentry,
        passwordOrPin: body.signature.passwordOrPin,
        comment: body.comment ?? body.reason ?? null,
        metadata: { siteId: approval.site_id, sourceModule: approval.source_module, sourceRecordId: approval.source_record_id, approvalId: approval.id },
        recordHashBeforeSigning: body.signature.recordHashBeforeSigning
      } as any).catch((error) => { throw error; });
      signatureId = signature.id;
    }
    const stageStatus = decision === 'Approved With Conditions' ? 'Approved' : decision === 'Returned' ? 'Returned' : decision;
    await this.db.single<any>(this.db.from('mi_approval_stages').update({ status: stageStatus, action: decision, comments: body.comment ?? body.reason ?? body.correctionComment ?? null, acted_by: user.id, acted_at: new Date().toISOString(), e_signature_id: signatureId, updated_at: new Date().toISOString() }).eq('id', stage.id).select().single());
    const next = await this.nextStage(user, approval.id, stage.stage_number);
    let status = decision === 'Rejected' ? 'Rejected' : decision === 'Returned' ? 'Returned for Correction' : decision === 'Approved With Conditions' ? 'Approved With Conditions' : 'Approved';
    let currentStage = decision;
    let completedAt: string | null = new Date().toISOString();
    if (decision === 'Approved' && next) {
      await this.db.single(this.db.from('mi_approval_stages').update({ status: 'In Progress', updated_at: new Date().toISOString() }).eq('id', next.id).select('id').single());
      status = 'In Review';
      currentStage = next.stage_name;
      completedAt = null;
      await this.notifyStage(user, approval, next, 'mi.approval.assigned', 'MI approval assigned');
    }
    const updated = await this.updateApproval(user, approval, { status, current_stage: currentStage, completed_at: completedAt, last_action: decision, updated_by: user.id }, `APPROVAL_${decision.toUpperCase().replace(/\s+/g, '_')}`, body.comment ?? body.reason ?? decision);
    await this.syncWorkflowDecision(user, updated, decision, body.comment ?? body.reason).catch(() => null);
    await this.updateSourceStatus(user, updated, status).catch(() => null);
    return this.detail(user, updated.id);
  }

  private async getInstance(user: RequestUser, approvalId: string) {
    const row = await this.db.single<any>(this.scoped(this.db.from('mi_approval_instances').select('*').eq('id', approvalId), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('MI approval not found.');
    return row;
  }

  private stages(user: RequestUser, approvalId: string) {
    return this.db.many<any>(this.db.from('mi_approval_stages').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('stage_number'));
  }

  private async activeStage(user: RequestUser, approval: any, enforceApprover: boolean) {
    const stages = await this.stages(user, approval.id);
    const stage = stages.find((item) => ['In Progress','Delegated','Escalated'].includes(item.status)) ?? stages.find((item) => item.status === 'Pending') ?? stages[0];
    if (!stage) throw new BadRequestException('Approval has no active stage.');
    if (enforceApprover && stage.approver_user_id && stage.approver_user_id !== user.id && stage.delegated_to_user_id !== user.id) throw new ForbiddenException('This approval stage is assigned to another approver.');
    return stage;
  }

  private async nextStage(user: RequestUser, approvalId: string, current: number) {
    return this.db.single<any>(this.db.from('mi_approval_stages').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).gt('stage_number', current).eq('status', 'Pending').order('stage_number').limit(1).maybeSingle());
  }

  private async createStages(user: RequestUser, approval: any, rule: any, body: Record<string, any>) {
    const chain = Array.isArray(body.approvalChain) ? body.approvalChain : Array.isArray(rule?.approval_chain_json) ? rule.approval_chain_json : [];
    const fallback = chain.length ? chain : [{ stageName: 'Owner Review', approverUserId: body.approverUserId ?? body.approver_user_id ?? null, approverRole: body.approverRole ?? 'Equipment Owner', slaHours: 24 }];
    const rows = fallback.map((stage: any, index: number) => ({
      company_id: user.tenantId,
      site_id: approval.site_id,
      approval_instance_id: approval.id,
      stage_number: Number(stage.stageNumber ?? stage.stage_number ?? index + 1),
      stage_name: stage.stageName ?? stage.stage_name ?? stage.name ?? `Stage ${index + 1}`,
      approver_role: stage.approverRole ?? stage.approver_role ?? null,
      approver_user_id: stage.approverUserId ?? stage.approver_user_id ?? null,
      status: index === 0 ? 'In Progress' : 'Pending',
      due_at: stage.dueAt ?? stage.due_at ?? (stage.slaHours ? new Date(Date.now() + Number(stage.slaHours) * 60 * 60 * 1000).toISOString() : approval.due_at)
    }));
    return this.db.many<any>(this.db.from('mi_approval_stages').insert(rows).select());
  }

  private async matchRule(user: RequestUser, source: any, body: Record<string, any>) {
    if (body.ruleId ?? body.rule_id) return this.db.single<any>(this.db.from('mi_approval_rules').select('*').eq('company_id', user.tenantId).eq('id', body.ruleId ?? body.rule_id).maybeSingle());
    let request = this.db.from('mi_approval_rules').select('*').eq('company_id', user.tenantId).eq('active', true).or(`site_id.is.null,site_id.eq.${source.site_id}`).or(`source_module.eq.${source.source_module},source_module.eq.Mechanical Integrity`);
    const rules = await this.db.many<any>(request);
    return rules.find((rule) => this.ruleMatches(rule, source)) ?? rules[0] ?? null;
  }

  private ruleMatches(rule: any, source: any) {
    if (rule.risk_level && source.risk_level && rule.risk_level !== source.risk_level) return false;
    for (const key of ['safety_critical','psm_critical','readiness_impact','startup_blocker']) if (rule[key] !== null && rule[key] !== undefined && Boolean(rule[key]) !== Boolean(source[key])) return false;
    return true;
  }

  private async startWorkflow(user: RequestUser, approval: any, stages: any[], source: any) {
    return this.workflows.startWorkflow(user.tenantId, user.id, {
      module: 'Mechanical Integrity',
      recordId: approval.id,
      recordNumber: approval.approval_number,
      siteId: approval.site_id,
      companyId: approval.company_id,
      contextData: {
        sourceModule: approval.source_module,
        sourceRecordId: approval.source_record_id,
        riskLevel: approval.risk_level,
        safetyCritical: approval.safety_critical,
        psmCritical: approval.psm_critical,
        readinessImpact: approval.readiness_impact,
        startupBlocker: approval.startup_blocker,
        stages: stages.map((stage) => stage.stage_name),
        source
      }
    } as any, this.scope(user));
  }

  private async syncWorkflowDecision(user: RequestUser, approval: any, decision: string, comment?: string) {
    if (!approval.workflow_instance_id) return null;
    if (decision === 'Approved' || decision === 'Approved With Conditions') return this.workflows.approve(user.tenantId, user.id, approval.workflow_instance_id, { comment } as any, this.scope(user));
    if (decision === 'Rejected') return this.workflows.reject(user.tenantId, user.id, approval.workflow_instance_id, { comment } as any, this.scope(user));
    if (decision === 'Returned') return this.workflows.returnForRevision(user.tenantId, user.id, approval.workflow_instance_id, { comment } as any, this.scope(user));
    return null;
  }

  private async resolveSource(user: RequestUser, sourceModule: string, sourceRecordId: string, equipmentHint?: string | null) {
    const table = this.sourceTable(sourceModule);
    if (!table) {
      const siteId = user.selectedSiteId ?? user.siteIds[0];
      return { source_module: sourceModule, source_record_id: sourceRecordId, site_id: siteId, equipment_id: equipmentHint ?? null, record_number: sourceRecordId, raw: { id: sourceRecordId }, permission_limited: true };
    }
    let request = this.db.from(table.table).select('*').eq(table.idField, sourceRecordId);
    request = request.eq(table.companyField, user.tenantId);
    const row = await this.db.single<any>(request.maybeSingle());
    if (!row) throw new NotFoundException(`${sourceModule} record not found.`);
    const siteId = row[table.siteField] ?? row.siteId ?? row.site_id;
    this.assertSite(user, siteId);
    return {
      source_module: sourceModule,
      source_record_id: sourceRecordId,
      site_id: siteId,
      equipment_id: row[table.equipmentField] ?? equipmentHint ?? null,
      record_number: row[table.numberField] ?? row.record_number ?? row.number ?? row.tag ?? row.name ?? sourceRecordId,
      risk_level: row.risk_level ?? row.riskLevel ?? row.priority ?? null,
      priority: row.priority ?? null,
      safety_critical: row.safety_critical ?? row.safetyCritical ?? row.psmCritical ?? false,
      psm_critical: row.psm_critical ?? row.psmCritical ?? false,
      readiness_impact: row.readiness_impact ?? row.readinessImpact ?? /readiness/i.test(sourceModule),
      startup_blocker: row.startup_blocker ?? row.startupBlocked ?? false,
      raw: row
    };
  }

  private sourceTable(module: string) {
    const common = { companyField: 'company_id', siteField: 'site_id', idField: 'id', equipmentField: 'equipment_id', numberField: 'record_number' };
    if (/equipment/i.test(module)) return { table: 'Equipment', companyField: 'tenantId', siteField: 'siteId', idField: 'id', equipmentField: 'id', numberField: 'tag' };
    if (/inspection plan/i.test(module)) return { ...common, table: 'mi_inspection_plans', numberField: 'plan_number' };
    if (/inspection|ut/i.test(module)) return { ...common, table: 'mi_inspection_records', numberField: 'inspection_number' };
    if (/criticality/i.test(module)) return { ...common, table: 'mi_criticality_assessments', numberField: 'assessment_number' };
    if (/pm plan|preventive.*plan/i.test(module)) return { ...common, table: 'mi_pm_plans', numberField: 'pm_plan_number' };
    if (/pm record|preventive.*record/i.test(module)) return { ...common, table: 'mi_pm_records', numberField: 'pm_record_number' };
    if (/calibration.*plan/i.test(module)) return { ...common, table: 'mi_calibration_plans', numberField: 'calibration_plan_number' };
    if (/calibration.*record/i.test(module)) return { ...common, table: 'mi_calibration_records', numberField: 'calibration_record_number' };
    if (/psv|relief/i.test(module) && /test/i.test(module)) return { ...common, table: 'mi_relief_device_tests', numberField: 'test_number' };
    if (/psv|relief/i.test(module)) return { ...common, table: 'mi_relief_devices', numberField: 'relief_device_number' };
    if (/sif|sis/i.test(module)) return { ...common, table: 'mi_sifs', numberField: 'sif_tag' };
    if (/interlock/i.test(module)) return { ...common, table: 'mi_interlocks', numberField: 'interlock_tag' };
    if (/critical alarm|alarm/i.test(module)) return { ...common, table: 'mi_critical_alarms', numberField: 'alarm_tag' };
    if (/safeguard.*test/i.test(module)) return { ...common, table: 'mi_safeguard_tests', numberField: 'test_number' };
    if (/bypass|impair/i.test(module)) return { ...common, table: 'mi_safeguard_impairments', numberField: 'impairment_number' };
    if (/deficien/i.test(module)) return { ...common, table: 'mi_deficiencies' };
    if (/deviation/i.test(module)) return { ...common, table: 'mi_deviations' };
    if (/work order/i.test(module)) return { ...common, table: 'mi_work_orders', numberField: 'work_order_number' };
    if (/readiness/i.test(module)) return { ...common, table: 'mi_readiness_assessments', numberField: 'assessment_number' };
    if (/document waiver/i.test(module)) return { ...common, table: 'mi_document_waivers', numberField: 'id' };
    return null;
  }

  private async requiredDocuments(user: RequestUser, approval: any) {
    const evaluations = await this.db.many<any>(
      this.db.from('mi_document_requirement_evaluations')
        .select('*')
        .eq('company_id', user.tenantId)
        .or(`source_record_id.eq.${approval.source_record_id},equipment_id.eq.${approval.equipment_id ?? '__none__'}`)
        .order('evaluated_at', { ascending: false })
    ).catch(() => []);
    const links = await this.db.many<any>(this.db.from('mi_document_links').select('*').eq('company_id', user.tenantId).eq('linked_record_id', approval.source_record_id).eq('active', true)).catch(() => []);
    return { evaluations, links, missing: evaluations.filter((row) => row.status === 'Missing' && row.readiness_blocker) };
  }

  private async hasCriticalBlockers(user: RequestUser, approval: any) {
    const readiness = await this.db.many<any>(this.db.from('mi_readiness_blockers').select('id').eq('company_id', user.tenantId).eq('equipment_id', approval.equipment_id ?? '').in('blocker_status', ['Open','Action Assigned','Waiting Verification']).in('severity', ['Critical','Startup Blocker']).limit(1)).catch(() => []);
    return readiness.length > 0;
  }

  private validation(approval: any, key: string, title: string, status: string, message: string, severity: string, overrideAllowed: boolean) {
    return { company_id: approval.company_id, site_id: approval.site_id, approval_instance_id: approval.id, validation_key: key, validation_title: title, validation_status: status, severity, message, source_module: approval.source_module, source_record_id: approval.source_record_id, override_allowed: overrideAllowed };
  }

  private async snapshot(user: RequestUser, approval: any, before: unknown, after: unknown) {
    const row = await this.db.single<any>(this.db.from('mi_approval_change_snapshots').insert({ company_id: user.tenantId, site_id: approval.site_id, approval_instance_id: approval.id, source_module: approval.source_module, source_record_id: approval.source_record_id, snapshot_type: 'Submission', before_snapshot_json: before ?? null, after_snapshot_json: after ?? {}, change_summary_json: this.diff(before, after) }).select().single());
    return row;
  }

  private latestSnapshot(user: RequestUser, approvalId: string) {
    return this.db.single<any>(this.db.from('mi_approval_change_snapshots').select('*').eq('company_id', user.tenantId).eq('approval_instance_id', approvalId).order('created_at', { ascending: false }).limit(1).maybeSingle());
  }

  private async updateApproval(user: RequestUser, approval: any, patch: Record<string, unknown>, eventType: string, description: string) {
    const before = approval;
    const row = await this.db.single<any>(this.db.from('mi_approval_instances').update({ ...patch, updated_at: new Date().toISOString(), updated_by: user.id }).eq('company_id', user.tenantId).eq('id', approval.id).select().single());
    await this.event(user, row, eventType, description, before, row);
    return row;
  }

  private async updateSourceStatus(user: RequestUser, approval: any, outcome: string) {
    const table = this.sourceTable(approval.source_module);
    if (!table) return null;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const status = outcome === 'Approved' || outcome === 'Approved With Conditions' || outcome === 'Completed' ? 'Approved' : outcome === 'Rejected' ? 'Rejected' : outcome === 'Returned for Correction' ? 'Returned for Correction' : 'In Review';
    patch.status = status;
    if (status === 'Approved') {
      patch.approved_by = user.id;
      patch.approved_at = new Date().toISOString();
      if (approval.source_module !== 'Equipment') patch.read_only = true;
    }
    await this.db.single(this.db.from(table.table).update(patch).eq(table.companyField, user.tenantId).eq(table.idField, approval.source_record_id).select(table.idField).single()).catch(() => null);
    return null;
  }

  private async event(user: RequestUser, approval: any, eventType: string, title: string, before: unknown, after: unknown) {
    const row = await this.db.single<any>(this.db.from('mi_approval_history_events').insert({ company_id: user.tenantId, site_id: approval.site_id, approval_instance_id: approval.id, source_module: approval.source_module, source_record_id: approval.source_record_id, equipment_id: approval.equipment_id ?? null, event_type: eventType, event_title: title, event_description: typeof after === 'string' ? after : null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: user.id }).select().single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: eventType, entityType: 'MiApproval', entityId: approval.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    return row;
  }

  private async notifyStage(user: RequestUser, approval: any, stage: any, type: string, title: string) {
    const recipient = stage?.delegated_to_user_id ?? stage?.approver_user_id;
    if (!recipient) return null;
    return this.notifyUser(user, recipient, approval, type, title, `${approval.approval_number} is waiting for ${stage.stage_name}.`);
  }

  private notifyUser(user: RequestUser, recipient: string, approval: any, type: string, title: string, message: string) {
    return this.notifications.notifyUser({ tenantId: user.tenantId, userId: recipient, siteId: approval.site_id, type, module: 'mechanical_integrity', title, message, relatedRecordId: approval.id, relatedRecordType: 'MiApproval', relatedUrl: `/mechanical-integrity/review-approval/${approval.id}`, priority: approval.priority === 'Critical' ? 'Safety-Critical' : 'Normal' }).catch(() => null);
  }

  private applyFilters(request: any, query: Query, user: RequestUser, assignedApprovalIds?: string[]) {
    if (query.search) request = request.or(`approval_number.ilike.%${query.search}%,source_record_number.ilike.%${query.search}%,source_module.ilike.%${query.search}%`);
    if (query.sourceModule) request = request.eq('source_module', query.sourceModule);
    if (query.sourceRecordId) request = request.eq('source_record_id', query.sourceRecordId);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    if (query.status) request = request.eq('status', query.status);
    if (query.statusGroup === 'pending') request = request.in('status', ['Submitted','Pending Approval','In Review','More Information Requested','Delegated','Escalated']);
    if (query.statusGroup === 'completed') request = request.in('status', ['Approved','Approved With Conditions','Rejected','Cancelled','Completed']);
    if (query.priority) request = request.eq('priority', query.priority);
    if (query.riskLevel) request = request.eq('risk_level', query.riskLevel);
    if (query.requestedBy) request = request.eq('submitted_by', query.requestedBy);
    if (query.siteId) request = request.eq('site_id', query.siteId);
    if (query.safetyCritical === 'true') request = request.eq('safety_critical', true);
    if (query.readinessImpact === 'true') request = request.eq('readiness_impact', true);
    if (query.startupBlocker === 'true') request = request.eq('startup_blocker', true);
    if (query.eSignatureRequired === 'true') request = request.eq('e_signature_required', true);
    if (query.mine === 'true') {
      request = assignedApprovalIds?.length
        ? request.or(`submitted_by.eq.${user.id},id.in.(${assignedApprovalIds.join(',')})`)
        : request.eq('submitted_by', user.id);
    }
    if (query.submittedFrom) request = request.gte('submitted_at', query.submittedFrom);
    if (query.submittedTo) request = request.lte('submitted_at', query.submittedTo);
    if (query.dueFrom) request = request.gte('due_at', query.dueFrom);
    if (query.dueTo) request = request.lte('due_at', query.dueTo);
    if (query.overdue === 'true') request = request.lt('due_at', new Date().toISOString()).not('status', 'in', '("Approved","Approved With Conditions","Rejected","Cancelled","Completed")');
    return request;
  }

  private scoped(request: any, user: RequestUser, query: Query) {
    request = request.eq('company_id', user.tenantId);
    if (query.siteId) {
      this.assertSite(user, query.siteId);
      return request.eq('site_id', query.siteId);
    }
    if (user.selectedSiteId) return request.eq('site_id', user.selectedSiteId);
    if (!user.corporateView && user.siteIds?.length) return request.in('site_id', user.siteIds);
    return request;
  }

  private scope(user: RequestUser): Scope {
    const scope: Scope = {};
    if (user.siteIds) scope.allowedSiteIds = user.siteIds;
    if (user.selectedSiteId !== undefined) scope.selectedSiteId = user.selectedSiteId;
    if (user.corporateView !== undefined) scope.corporateView = user.corporateView;
    return scope;
  }

  private assertSite(user: RequestUser, siteId?: string | null) {
    if (!siteId || user.corporateView) return;
    if (user.siteIds?.length && !user.siteIds.includes(siteId)) throw new ForbiddenException('You do not have access to this site.');
  }

  private hasSite(user: RequestUser, siteId?: string | null) {
    if (!siteId || user.corporateView) return true;
    return !user.siteIds?.length || user.siteIds.includes(siteId);
  }

  private async nextApprovalNumber(tenantId: string, siteId: string) {
    const year = new Date().getFullYear();
    const rows = await this.db.many<any>(this.db.from('mi_approval_instances').select('id').eq('company_id', tenantId).eq('site_id', siteId).gte('created_at', `${year}-01-01T00:00:00.000Z`)).catch(() => []);
    return `MI-APR-${year}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private dueAt(rule: any, body: Record<string, any>) {
    if (body.dueAt ?? body.due_at) return body.dueAt ?? body.due_at;
    const value = Number(rule?.due_duration_value ?? 2);
    const unit = rule?.due_duration_unit ?? 'days';
    const factor = unit === 'hours' ? 60 * 60 * 1000 : unit === 'weeks' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return new Date(Date.now() + value * factor).toISOString();
  }

  private priorityFor(source: any) {
    if (source.startup_blocker || /critical/i.test(source.risk_level ?? '')) return 'Critical';
    if (source.safety_critical || /high/i.test(source.risk_level ?? '')) return 'High';
    if (/medium/i.test(source.risk_level ?? '')) return 'Medium';
    return 'Normal';
  }

  private highRisk(source: any) {
    return Boolean(source.safety_critical || source.psm_critical || source.startup_blocker || /high|critical/i.test(source.risk_level ?? ''));
  }

  private isOverdue(row: any) {
    return row.due_at && new Date(row.due_at).getTime() < Date.now() && !terminalStatuses.includes(row.status);
  }

  private async assignedApprovalIds(user: RequestUser) {
    const rows = await this.db.many<any>(
      this.db.from('mi_approval_stages')
        .select('approval_instance_id')
        .eq('company_id', user.tenantId)
        .or(`approver_user_id.eq.${user.id},delegated_to_user_id.eq.${user.id}`)
    ).catch(() => []);
    return Array.from(new Set(rows.map((row) => row.approval_instance_id).filter(Boolean)));
  }

  private isMine(row: any, userId: string, assignedApprovalIds = new Set<string>()) {
    return row.submitted_by === userId || row.approver_user_id === userId || row.delegated_to_user_id === userId || assignedApprovalIds.has(row.id);
  }

  private permissionState(approval: any, user: RequestUser) {
    return { canReview: !terminalStatuses.includes(approval.status), isRequester: approval.submitted_by === user.id, disabledReason: terminalStatuses.includes(approval.status) ? 'Completed approvals are read-only.' : approval.submitted_by === user.id ? 'Self-approval is blocked by policy.' : null };
  }

  private savedViews() {
    return ['My Approvals','All Pending','Overdue','Escalated','Safety-Critical','Startup / Readiness','E-Signature Required','Returned','Rejected','Completed','Delegated to Me','High Risk','Critical Risk'];
  }

  private text(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private required(value: unknown, message: string) {
    if (!this.text(value)) throw new BadRequestException(message);
    return String(value);
  }

  private sameSnapshot(a: unknown, b: unknown) {
    return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
  }

  private diff(before: unknown, after: unknown) {
    if (!before || typeof before !== 'object' || !after || typeof after !== 'object') return [];
    const keys = new Set([...Object.keys(before as Record<string, unknown>), ...Object.keys(after as Record<string, unknown>)]);
    return [...keys].filter((key) => JSON.stringify((before as any)[key]) !== JSON.stringify((after as any)[key])).slice(0, 100).map((key) => ({ field: key, before: (before as any)[key] ?? null, after: (after as any)[key] ?? null }));
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
