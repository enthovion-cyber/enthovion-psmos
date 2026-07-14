import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocWorkflowService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly workflows: WorkflowsService
  ) {}

  async get(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const instance = await this.currentInstance(tenantId, id, scope);
    const blockers = await this.blockers(tenantId, id, scope);
    if (!instance) {
      return {
        status: moc.status === 'Draft' ? 'Pending Submission' : 'Not Started',
        templateName: 'Workflow Engine template not started',
        currentStep: 'Not Started',
        currentApprover: null,
        summary: this.summary(null, blockers),
        steps: [],
        approvers: [],
        comments: [],
        history: moc.history ?? [],
        escalations: [],
        blockers,
        instance: null
      };
    }
    const activeStep = instance.steps?.find((step: any) => step.status === 'Active' || step.status === 'In Progress');
    return {
      status: this.workflowStatus(instance.status),
      templateName: instance.template_name ?? instance.template?.name ?? 'MOC Workflow',
      currentStep: activeStep?.step_name ?? instance.status,
      currentApprover: activeStep?.assigned_to_user_id ?? activeStep?.assigned_role_id ?? activeStep?.assigned_department_id ?? null,
      summary: this.summary(instance, blockers),
      steps: (instance.steps ?? []).map((step: any) => this.mapStep(step)),
      approvers: (instance.steps ?? []).map((step: any, index: number) => ({ ...this.mapStep(step), stepOrder: index + 1, role: step.assigned_role_id, assignedApprover: step.assigned_to_user_id, delegatedApprover: step.delegated_to_user_id ?? null, decision: step.status, comment: step.comments })),
      comments: instance.comments ?? [],
      history: instance.history ?? [],
      escalations: instance.escalations ?? [],
      blockers,
      instance
    };
  }

  async start(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const existing = await this.currentInstance(tenantId, id, scope);
    if (existing && !['Rejected', 'Cancelled', 'Approved', 'Overridden'].includes(existing.status)) throw new BadRequestException('Approval workflow is already active');
    const instance = await this.workflows.startWorkflow(tenantId, actorId, {
      module: 'MOC',
      recordId: moc.id,
      recordNumber: moc.moc_number,
      siteId: moc.site_id,
      companyId: moc.company_id,
      contextData: { riskLevel: moc.risk_level, changeType: moc.change_type, priority: moc.priority, likeForLike: moc.like_for_like }
    }, scope);
    await this.db.single(this.db.from('mocs').update({ workflow_instance_id: instance.id, status: moc.status === 'Draft' ? 'Submitted' : moc.status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_WORKFLOW_STARTED', 'Approval workflow started', existing, instance);
    await this.audit.write({ tenantId, actorId, action: 'MOC_WORKFLOW_STARTED', entityType: 'MOC', entityId: id, before: existing as JsonValue, after: instance as JsonValue });
    await this.notify(tenantId, moc, actorId, 'moc.workflow.approval_requested', 'MOC approval workflow started');
    return this.get(tenantId, id, scope);
  }

  approve(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    return this.decide(tenantId, actorId, id, dto, scope, 'approve');
  }

  reject(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason && !dto.comment) throw new BadRequestException('Rejection requires reason');
    return this.decide(tenantId, actorId, id, dto, scope, 'reject');
  }

  returnForRevision(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason && !dto.comment) throw new BadRequestException('Return for revision requires reason');
    return this.decide(tenantId, actorId, id, dto, scope, 'return');
  }

  async delegate(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.delegateToUserId) throw new BadRequestException('Delegate user is required');
    const moc = await this.getMoc(tenantId, id, scope);
    const instance = await this.requiredInstance(tenantId, id, scope);
    const active = (instance.steps ?? []).find((step: any) => step.status === 'Active');
    if (!active) throw new BadRequestException('No active workflow step to delegate');
    const before = active;
    const updated = await this.db.single<any>(this.db.from('workflow_instance_steps').update({ delegated_to_user_id: dto.delegateToUserId, assigned_to_user_id: dto.delegateToUserId, comments: dto.reason ?? active.comments, updated_at: new Date().toISOString() }).eq('id', active.id).select().single());
    await this.db.single(this.db.from('workflow_history').insert({ id: crypto.randomUUID(), workflow_instance_id: instance.id, event_type: 'WORKFLOW_DELEGATED', description: dto.reason ?? 'Approval delegated', user_id: actorId, before_value: before, after_value: updated }).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_WORKFLOW_DELEGATED', 'Approval delegated', before, updated);
    return this.get(tenantId, id, scope);
  }

  async escalate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const instance = await this.requiredInstance(tenantId, id, scope);
    const result = await this.workflows.escalate(tenantId, actorId, instance.id, scope);
    await this.history(tenantId, moc, actorId, 'MOC_WORKFLOW_ESCALATED', 'Approval workflow escalated', null, result);
    await this.notify(tenantId, moc, actorId, 'moc.workflow.overdue', 'MOC workflow escalated', 'High');
    return this.get(tenantId, id, scope);
  }

  async restart(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const existing = await this.currentInstance(tenantId, id, scope);
    if (existing && !['Approved', 'Rejected', 'Cancelled', 'Overridden'].includes(existing.status)) {
      await this.db.single(this.db.from('workflow_instances').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', existing.id).select().single());
    }
    await this.history(tenantId, moc, actorId, 'MOC_WORKFLOW_RESTARTED', dto.reason ?? 'Workflow restarted due to MOC change', existing, null);
    return this.start(tenantId, actorId, id, scope);
  }

  async historyFor(tenantId: string, id: string, scope: Scope) {
    const instance = await this.currentInstance(tenantId, id, scope);
    return instance?.history ?? [];
  }

  async blockers(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const blockers: any[] = [];
    const impactComplete = Boolean(moc.impact);
    const riskComplete = Boolean(moc.risk);
    const engineeringMissing = moc.engineeringPackage?.missing_required_documents_count ?? 0;
    const approvalActions = (moc.actions ?? []).filter((action: any) => action.required_before_approval && !['Completed', 'Closed'].includes(action.status));
    const docs = moc.documents ?? [];
    const hasDesignBasis = docs.some((doc: any) => /design basis/i.test(String(doc.document_type ?? doc.title ?? '')));
    const temporaryInvalid = moc.change_type === 'Temporary Change' && (!moc.temporary?.expiry_date || (moc.temporary?.current_duration_days ?? 0) > (moc.temporary?.max_duration_days ?? 90));
    const emergencyInvalid = moc.change_type === 'Emergency Change' && (!moc.emergency?.emergency_justification || !moc.emergency?.immediate_controls && !moc.emergency?.immediate_risk_controls);
    const add = (condition: boolean, blockerType: string, blockerTitle: string, severity = 'High', sourceModule = 'MOC', sourceRecordId: string | null = id) => {
      if (condition) blockers.push({ id: `${blockerType}-${sourceRecordId ?? id}`, blockerType, blockerTitle, blockerDescription: blockerTitle, severity, blocking: true, status: 'Open', sourceModule, sourceRecordId });
    };
    add(!impactComplete, 'Impact Assessment', 'Impact Assessment incomplete');
    add(!riskComplete, 'Risk Ranking', 'Risk Ranking incomplete');
    add(engineeringMissing > 0, 'Engineering Package', 'Engineering package missing required documents');
    add(['High', 'Critical'].includes(moc.risk_level) && !hasDesignBasis, 'Design Basis', 'High/Critical MOC missing design basis');
    approvalActions.forEach((action: any) => add(true, 'Closed-Loop Action', action.title ?? action.action_title ?? 'Approval-blocking action incomplete', action.priority ?? 'High', 'Actions', action.id));
    add(temporaryInvalid, 'Temporary Change', 'Temporary expiry invalid');
    add(emergencyInvalid, 'Emergency Change', 'Emergency justification or immediate controls incomplete');
    return blockers;
  }

  private async decide(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope, action: 'approve' | 'reject' | 'return') {
    const moc = await this.getMoc(tenantId, id, scope);
    const instance = await this.requiredInstance(tenantId, id, scope);
    const comment = dto.comment ?? dto.reason;
    const result = action === 'approve'
      ? await this.workflows.approve(tenantId, actorId, instance.id, { stepId: dto.stepId, comment }, scope)
      : action === 'reject'
        ? await this.workflows.reject(tenantId, actorId, instance.id, { stepId: dto.stepId, comment }, scope)
        : await this.workflows.returnForRevision(tenantId, actorId, instance.id, { stepId: dto.stepId, comment }, scope);
    if (result.status === 'Approved') await this.db.single(this.db.from('mocs').update({ status: 'Approved', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    if (result.status === 'Rejected') await this.db.single(this.db.from('mocs').update({ status: 'Rejected', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    if (result.status === 'Draft') await this.db.single(this.db.from('mocs').update({ status: 'Draft', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, moc, actorId, `MOC_WORKFLOW_${action.toUpperCase()}`, comment ?? `Workflow ${action}`, instance, result);
    await this.notify(tenantId, moc, actorId, `moc.workflow.${action === 'return' ? 'returned' : action + 'd'}`, `MOC workflow ${action}`);
    return this.get(tenantId, id, scope);
  }

  private async requiredInstance(tenantId: string, id: string, scope: Scope) {
    const instance = await this.currentInstance(tenantId, id, scope);
    if (!instance) throw new NotFoundException('Approval workflow has not started');
    return instance;
  }

  private async currentInstance(tenantId: string, id: string, scope: Scope) {
    const instances = await this.workflows.forRecord(tenantId, 'MOC', id, scope);
    if (!instances.length) return null;
    return this.workflows.getInstance(tenantId, instances[0].id, scope);
  }

  private summary(instance: any | null, blockers: any[]) {
    const steps = instance?.steps ?? [];
    const active = steps.find((step: any) => step.status === 'Active');
    const lastHistory = instance?.history?.[0];
    return {
      workflowStatus: instance ? this.workflowStatus(instance.status) : 'Not Started',
      workflowTemplateName: instance?.template_name ?? 'Workflow Engine',
      currentStep: active?.step_name ?? 'Not Started',
      currentApprover: active?.assigned_to_user_id ?? active?.assigned_role_id ?? null,
      completedStepsCount: steps.filter((step: any) => ['Approved', 'Skipped', 'Skipped by Rule'].includes(step.status)).length,
      pendingStepsCount: steps.filter((step: any) => ['Pending', 'Active', 'In Progress'].includes(step.status)).length,
      rejectedStepsCount: steps.filter((step: any) => ['Rejected', 'Returned'].includes(step.status)).length,
      slaDueDate: active?.due_at ?? null,
      overdue: active?.due_at ? new Date(active.due_at).getTime() < Date.now() : false,
      lastActionBy: lastHistory?.user_id ?? null,
      lastActionAt: lastHistory?.created_at ?? instance?.updated_at ?? null,
      blockersCount: blockers.length
    };
  }

  private mapStep(step: any) {
    return {
      id: step.id,
      stepName: step.step_name,
      stepType: step.step_type,
      requiredRoleUser: step.assigned_role_id ?? step.assigned_to_user_id ?? step.assigned_department_id,
      status: this.stepStatus(step.status),
      assignedUserGroup: step.assigned_to_user_id ?? step.assigned_role_id ?? step.assigned_department_id,
      dueDate: step.due_at,
      completedBy: step.completed_by,
      completedAt: step.completed_at,
      comment: step.comments,
      rejectionReturnReason: ['Rejected', 'Returned'].includes(step.status) ? step.comments : null
    };
  }

  private workflowStatus(status?: string) {
    if (status === 'Active') return 'In Review';
    if (status === 'Draft') return 'Returned for Revision';
    return status ?? 'Not Started';
  }

  private stepStatus(status?: string) {
    if (status === 'Active') return 'In Progress';
    if (status === 'Skipped') return 'Skipped by Rule';
    return status ?? 'Pending';
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    const [risk, impact, engineeringPackage, documents, actions, temporary, emergency, history] = await Promise.all([
      this.db.single<any>(this.db.from('moc_risk_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_engineering_packages').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_engineering_documents').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.single<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_history_events').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }))
    ]);
    return { ...moc, risk, impact, engineeringPackage, documents, actions, temporary, emergency, history };
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null }).select().single());
  }

  private notify(tenantId: string, moc: any, actorId: string, type: string, title: string, priority: string = 'Normal') {
    return this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type, module: 'moc', title, message: moc.title, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority }).catch(() => null);
  }
}
