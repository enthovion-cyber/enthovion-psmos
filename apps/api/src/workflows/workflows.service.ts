import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { ApproveStepDto, RejectStepDto, ReturnStepDto } from './dto/approve-step.dto';
import { OverrideWorkflowDto } from './dto/override-workflow.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { WorkflowStepDto } from './dto/workflow-step.dto';
import { ApprovalChainEngine, RuntimeStep } from './engines/approval-chain.engine';
import { ConditionRuleEngine } from './engines/condition-rule.engine';
import { EscalationEngine } from './engines/escalation.engine';
import { WorkflowRepository } from './repositories/workflow.repository';

type RequestScope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly repo: WorkflowRepository,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly conditions: ConditionRuleEngine,
    private readonly approvalChain: ApprovalChainEngine,
    private readonly escalationEngine: EscalationEngine
  ) {}

  async listTemplates(tenantId: string, scope: RequestScope, module?: string) {
    let query = this.repo.templates().select('*').eq('tenant_id', tenantId);
    if (module) query = query.eq('module', module);
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    const templates = await this.repo.db.many<any>(query.order('module').order('name'));
    const steps = templates.length
      ? await this.repo.db.many<any>(this.repo.templateSteps().select('*').in('template_id', templates.map((template) => template.id)).order('sequence'))
      : [];
    return templates.map((template) => ({ ...template, steps: steps.filter((step) => step.template_id === template.id) }));
  }

  async getTemplate(tenantId: string, id: string, scope: RequestScope) {
    const template = await this.repo.db.single<any>(this.repo.templates().select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!template) throw new NotFoundException('Workflow template not found');
    this.assertSiteAccess(template.site_id, scope);
    const steps = await this.repo.db.many<any>(this.repo.templateSteps().select('*').eq('template_id', id).order('sequence'));
    return { ...template, steps };
  }

  async createTemplate(tenantId: string, actorId: string, dto: CreateWorkflowTemplateDto, scope: RequestScope) {
    const siteId = this.resolveSite(dto.siteId, scope);
    const now = new Date().toISOString();
    const template = await this.repo.db.single<any>(this.repo.templates().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: siteId,
      module: dto.module,
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? 'DRAFT',
      is_default: dto.isDefault ?? false,
      created_by: actorId,
      updated_at: now
    }).select().single());
    await this.replaceTemplateSteps(template.id, dto.steps);
    if (template.is_default) await this.clearOtherDefaults(tenantId, template.id, template.module, template.site_id);
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_TEMPLATE_CREATED', 'WorkflowTemplate', template.id, null, template);
    return this.getTemplate(tenantId, template.id, scope);
  }

  async updateTemplate(tenantId: string, actorId: string, id: string, dto: UpdateWorkflowTemplateDto, scope: RequestScope) {
    const before = await this.getTemplate(tenantId, id, scope);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.module !== undefined) patch.module = dto.module;
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.companyId !== undefined) patch.company_id = dto.companyId || null;
    if (dto.siteId !== undefined) patch.site_id = this.resolveSite(dto.siteId, scope);
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.isDefault !== undefined) patch.is_default = dto.isDefault;
    const template = await this.repo.db.single<any>(this.repo.templates().update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    if (dto.steps) await this.replaceTemplateSteps(id, dto.steps);
    if (template.is_default) await this.clearOtherDefaults(tenantId, template.id, template.module, template.site_id);
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_TEMPLATE_UPDATED', 'WorkflowTemplate', id, before as JsonValue, template as JsonValue);
    return this.getTemplate(tenantId, id, scope);
  }

  async deleteTemplate(tenantId: string, actorId: string, id: string, scope: RequestScope) {
    const before = await this.getTemplate(tenantId, id, scope);
    const instances = await this.repo.db.many<any>(this.repo.instances().select('id').eq('tenant_id', tenantId).eq('template_id', id).limit(1));
    if (instances.length) throw new BadRequestException('Templates with workflow instances cannot be deleted. Deactivate instead.');
    await this.repo.db.single(this.repo.templates().delete().eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_TEMPLATE_DELETED', 'WorkflowTemplate', id, before as JsonValue, null);
    return { deleted: true };
  }

  async cloneTemplate(tenantId: string, actorId: string, id: string, scope: RequestScope) {
    const source = await this.getTemplate(tenantId, id, scope);
    return this.createTemplate(tenantId, actorId, {
      module: source.module,
      name: `${source.name} Copy`,
      description: source.description,
      companyId: source.company_id,
      siteId: source.site_id,
      status: 'DRAFT',
      isDefault: false,
      steps: source.steps.map(this.fromDbStep)
    }, scope);
  }

  async activateTemplate(tenantId: string, actorId: string, id: string, scope: RequestScope, active: boolean) {
    return this.updateTemplate(tenantId, actorId, id, { status: active ? 'ACTIVE' : 'INACTIVE' }, scope);
  }

  async setDefaultTemplate(tenantId: string, actorId: string, id: string, scope: RequestScope) {
    return this.updateTemplate(tenantId, actorId, id, { isDefault: true, status: 'ACTIVE' }, scope);
  }

  async startWorkflow(tenantId: string, actorId: string, dto: StartWorkflowDto, scope: RequestScope) {
    this.assertSiteAccess(dto.siteId, scope);
    const template = dto.workflowTemplateId
      ? await this.getTemplate(tenantId, dto.workflowTemplateId, scope)
      : await this.findDefaultTemplate(tenantId, dto.module, dto.siteId);
    if (!template) throw new NotFoundException('No active workflow template found for this module/site');
    const context = dto.contextData ?? {};
    const eligibleSteps = template.steps.filter((step: any) => this.conditions.matches(step.condition_rule, context));
    if (!eligibleSteps.length) throw new BadRequestException('Workflow template has no eligible steps for this record');
    const now = new Date().toISOString();
    const instance = await this.repo.db.single<any>(this.repo.instances().insert({
      id: crypto.randomUUID(),
      template_id: template.id,
      tenant_id: tenantId,
      company_id: dto.companyId ?? template.company_id ?? null,
      site_id: dto.siteId,
      module: dto.module,
      record_id: dto.recordId,
      record_number: dto.recordNumber,
      context_data: context,
      status: 'Active',
      started_by: actorId,
      started_at: now,
      updated_at: now
    }).select().single());
    const runtimeRows = eligibleSteps.map((step: any) => this.runtimeStepRow(instance.id, step, false));
    const firstSequence = Math.min(...runtimeRows.map((step: { sequence: number }) => step.sequence));
    const steps = await this.repo.db.many<any>(this.repo.instanceSteps().insert(runtimeRows.map((step: { sequence: number; [key: string]: unknown }) => ({
      ...step,
      status: step.sequence === firstSequence ? 'Active' : 'Pending'
    }))).select());
    await this.writeHistory(instance.id, 'WORKFLOW_STARTED', `${instance.record_number} workflow started`, actorId, null, { instance, steps });
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_STARTED', 'WorkflowInstance', instance.id, null, instance);
    this.events.emit('workflow.started', { tenantId, workflowId: instance.id, module: dto.module, recordId: dto.recordId });
    this.events.emit('workflow.approval.requested', { tenantId, workflowId: instance.id, stepIds: steps.filter((step: any) => step.status === 'Active').map((step: any) => step.id) });
    return this.getInstance(tenantId, instance.id, scope);
  }

  async getInstance(tenantId: string, id: string, scope: RequestScope) {
    const instance = await this.repo.db.single<any>(this.repo.instances().select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!instance) throw new NotFoundException('Workflow instance not found');
    this.assertSiteAccess(instance.site_id, scope);
    const [steps, approvals, comments, history, escalations] = await Promise.all([
      this.repo.db.many<any>(this.repo.instanceSteps().select('*').eq('workflow_instance_id', id).order('sequence')),
      this.repo.db.many<any>(this.repo.approvals().select('*').eq('workflow_instance_id', id).order('created_at', { ascending: false })),
      this.repo.db.many<any>(this.repo.comments().select('*').eq('workflow_instance_id', id).order('created_at', { ascending: false })),
      this.repo.db.many<any>(this.repo.history().select('*').eq('workflow_instance_id', id).order('created_at', { ascending: false })),
      this.repo.db.many<any>(this.repo.escalations().select('*').eq('workflow_instance_id', id).order('escalated_at', { ascending: false }))
    ]);
    return { ...instance, steps, approvals, comments, history, escalations };
  }

  async getHistory(tenantId: string, id: string, scope: RequestScope) {
    await this.getInstance(tenantId, id, scope);
    return this.repo.db.many<any>(this.repo.history().select('*').eq('workflow_instance_id', id).order('created_at', { ascending: false }));
  }

  async forRecord(tenantId: string, module: string, recordId: string, scope: RequestScope) {
    let query = this.repo.instances().select('*').eq('tenant_id', tenantId).eq('module', module).eq('record_id', recordId);
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    return this.repo.db.many<any>(query.order('started_at', { ascending: false }));
  }

  async approve(tenantId: string, actorId: string, id: string, dto: ApproveStepDto, scope: RequestScope) {
    return this.decide(tenantId, actorId, id, dto.stepId, 'Approved', dto.comment, scope);
  }

  async reject(tenantId: string, actorId: string, id: string, dto: RejectStepDto, scope: RequestScope) {
    return this.decide(tenantId, actorId, id, dto.stepId, 'Rejected', dto.comment, scope);
  }

  async returnForRevision(tenantId: string, actorId: string, id: string, dto: ReturnStepDto, scope: RequestScope) {
    return this.decide(tenantId, actorId, id, dto.stepId, 'Returned', dto.comment, scope);
  }

  async override(tenantId: string, actorId: string, id: string, dto: OverrideWorkflowDto, scope: RequestScope) {
    const instance = await this.getInstance(tenantId, id, scope);
    if (['Approved', 'Rejected', 'Cancelled', 'Overridden'].includes(instance.status)) throw new BadRequestException('Workflow is already closed');
    const before = instance as JsonValue;
    await this.repo.db.many(this.repo.instanceSteps().update({ status: 'Overridden', completed_by: actorId, completed_at: new Date().toISOString(), comments: dto.reason }).eq('workflow_instance_id', id).in('status', ['Pending', 'Active']).select());
    const updated = await this.repo.db.single<any>(this.repo.instances().update({ status: 'Overridden', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(id, 'WORKFLOW_OVERRIDDEN', dto.reason, actorId, before, updated);
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_OVERRIDDEN', 'WorkflowInstance', id, before, updated as JsonValue);
    this.events.emit('workflow.overridden', { tenantId, workflowId: id });
    return this.getInstance(tenantId, id, scope);
  }

  async overdue(tenantId: string, scope: RequestScope) {
    let query = this.repo.instanceSteps().select('*, workflow_instances!inner(*)').eq('workflow_instances.tenant_id', tenantId).eq('status', 'Active').lt('due_at', new Date().toISOString());
    if (scope.selectedSiteId) query = query.eq('workflow_instances.site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('workflow_instances.site_id', scope.allowedSiteIds);
    return this.repo.db.many<any>(query.order('due_at'));
  }

  async escalate(tenantId: string, actorId: string, id: string, scope: RequestScope) {
    const instance = await this.getInstance(tenantId, id, scope);
    const activeOverdue = instance.steps.filter((step: any) => step.status === 'Active' && step.due_at && new Date(step.due_at).getTime() < Date.now());
    if (!activeOverdue.length) throw new BadRequestException('No overdue active steps to escalate');
    const existing = await this.repo.db.many<any>(this.repo.escalations().select('*').eq('workflow_instance_id', id));
    const rows = activeOverdue.map((step: any) => ({
      id: crypto.randomUUID(),
      workflow_instance_id: id,
      workflow_step_id: step.id,
      escalated_to: step.assigned_to_user_id ?? null,
      escalation_level: this.escalationEngine.nextLevel(existing.filter((item) => item.workflow_step_id === step.id).map((item) => item.escalation_level)),
      reason: this.escalationEngine.reasonFor(step.step_name, step.due_at)
    }));
    const escalations = await this.repo.db.many<any>(this.repo.escalations().insert(rows).select());
    await this.writeHistory(id, 'WORKFLOW_ESCALATED', `${escalations.length} overdue step(s) escalated`, actorId, null, escalations);
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_ESCALATED', 'WorkflowInstance', id, null, escalations as JsonValue);
    this.events.emit('workflow.escalated', { tenantId, workflowId: id, escalations });
    return escalations;
  }

  private async decide(tenantId: string, actorId: string, id: string, stepId: string | undefined, decision: 'Approved' | 'Rejected' | 'Returned', comment: string | undefined, scope: RequestScope) {
    if ((decision === 'Rejected' || decision === 'Returned') && !comment?.trim()) throw new BadRequestException(`${decision} requires a comment`);
    const instance = await this.getInstance(tenantId, id, scope);
    if (instance.status !== 'Active') throw new BadRequestException('Only active workflows can be actioned');
    const activeSteps = instance.steps.filter((step: any) => step.status === 'Active') as RuntimeStep[];
    const target = stepId ? activeSteps.find((step: any) => step.id === stepId) : activeSteps[0];
    if (!target) throw new NotFoundException('Active workflow step not found');
    await this.assertApprover(actorId, target as any);
    const duplicate = await this.repo.db.many<any>(this.repo.approvals().select('id').eq('workflow_step_id', target.id).eq('approver_id', actorId).limit(1));
    if (duplicate.length) throw new BadRequestException('This step has already been actioned by this approver');
    const before = instance as JsonValue;
    await this.repo.db.single(this.repo.approvals().insert({
      id: crypto.randomUUID(),
      workflow_instance_id: id,
      workflow_step_id: target.id,
      approver_id: actorId,
      decision,
      comment: comment ?? null
    }).select().single());
    if (comment) await this.repo.db.single(this.repo.comments().insert({ id: crypto.randomUUID(), workflow_instance_id: id, workflow_step_id: target.id, author_id: actorId, body: comment }).select().single());
    if (decision === 'Rejected' || decision === 'Returned') {
      const status = decision === 'Rejected' ? 'Rejected' : 'Draft';
      await this.repo.db.single(this.repo.instanceSteps().update({ status: decision, comments: comment, completed_by: actorId, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', target.id).select().single());
      await this.repo.db.single(this.repo.instances().update({ status, completed_at: decision === 'Rejected' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
      await this.writeHistory(id, `WORKFLOW_${decision.toUpperCase()}`, comment!, actorId, before, { decision, stepId: target.id });
      await this.historyAudit(tenantId, actorId, `WORKFLOW_${decision.toUpperCase()}`, 'WorkflowInstance', id, before, { decision, comment } as JsonValue);
      this.events.emit(decision === 'Rejected' ? 'workflow.rejected' : 'workflow.returned', { tenantId, workflowId: id });
      return this.getInstance(tenantId, id, scope);
    }
    const completed = await this.repo.db.single<any>(this.repo.instanceSteps().update({ status: 'Approved', comments: comment ?? null, completed_by: actorId, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', target.id).select().single());
    if (completed.parallel_group && completed.approval_mode === 'Any') {
      await this.repo.db.many(this.repo.instanceSteps()
        .update({ status: 'Skipped', comments: 'Skipped because parallel Any approval mode was satisfied.', updated_at: new Date().toISOString() })
        .eq('workflow_instance_id', id)
        .eq('parallel_group', completed.parallel_group)
        .eq('sequence', completed.sequence)
        .neq('id', completed.id)
        .in('status', ['Pending', 'Active'])
        .select());
    }
    const freshSteps = (await this.repo.db.many<any>(this.repo.instanceSteps().select('*').eq('workflow_instance_id', id).order('sequence'))) as RuntimeStep[];
    if (this.approvalChain.isSequenceComplete(freshSteps, completed.sequence)) {
      const nextSequence = this.approvalChain.nextSequence(freshSteps, completed.sequence);
      if (nextSequence) {
        await this.repo.db.many(this.repo.instanceSteps().update({ status: 'Active', updated_at: new Date().toISOString() }).eq('workflow_instance_id', id).eq('sequence', nextSequence).eq('status', 'Pending').select());
        this.events.emit('workflow.approval.requested', { tenantId, workflowId: id, sequence: nextSequence });
      } else if (this.approvalChain.isWorkflowComplete(freshSteps)) {
        await this.repo.db.single(this.repo.instances().update({ status: 'Approved', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
        this.events.emit('workflow.approved', { tenantId, workflowId: id });
      }
    }
    await this.writeHistory(id, 'STEP_APPROVED', `${completed.step_name} approved`, actorId, before, completed);
    await this.historyAudit(tenantId, actorId, 'WORKFLOW_STEP_APPROVED', 'WorkflowInstance', id, before, completed as JsonValue);
    return this.getInstance(tenantId, id, scope);
  }

  private async replaceTemplateSteps(templateId: string, steps: WorkflowStepDto[]) {
    await this.repo.db.many(this.repo.templateSteps().delete().eq('template_id', templateId).select());
    return this.repo.db.many(this.repo.templateSteps().insert(steps.map((step) => ({
      id: crypto.randomUUID(),
      template_id: templateId,
      step_name: step.stepName,
      step_type: step.stepType ?? 'Approval',
      sequence: step.sequence,
      assigned_role_id: step.assignedRoleId ?? null,
      assigned_user_id: step.assignedUserId ?? null,
      assigned_department_id: step.assignedDepartmentId ?? null,
      approval_mode: step.approvalMode ?? 'Single',
      parallel_group: step.parallelGroup ?? null,
      condition_rule: step.conditionRule ?? null,
      sla_hours: step.slaHours ?? null,
      is_required: step.isRequired ?? true,
      can_reject: step.canReject ?? true,
      can_override: step.canOverride ?? false,
      updated_at: new Date().toISOString()
    }))).select());
  }

  private runtimeStepRow(instanceId: string, step: any, active: boolean) {
    const dueAt = step.sla_hours ? new Date(Date.now() + Number(step.sla_hours) * 60 * 60 * 1000).toISOString() : null;
    return {
      id: crypto.randomUUID(),
      workflow_instance_id: instanceId,
      template_step_id: step.id,
      step_name: step.step_name,
      step_type: step.step_type,
      sequence: step.sequence,
      assigned_to_user_id: step.assigned_user_id,
      assigned_to_role_id: step.assigned_role_id,
      assigned_to_department_id: step.assigned_department_id,
      approval_mode: step.approval_mode,
      parallel_group: step.parallel_group,
      is_required: step.is_required,
      can_reject: step.can_reject,
      can_override: step.can_override,
      status: active ? 'Active' : 'Pending',
      due_at: dueAt,
      updated_at: new Date().toISOString()
    };
  }

  private async findDefaultTemplate(tenantId: string, module: string, siteId: string) {
    const siteTemplate = await this.repo.db.single<any>(this.repo.templates().select('*').eq('tenant_id', tenantId).eq('module', module).eq('site_id', siteId).eq('is_default', true).eq('status', 'ACTIVE').maybeSingle());
    const template = siteTemplate ?? await this.repo.db.single<any>(this.repo.templates().select('*').eq('tenant_id', tenantId).eq('module', module).is('site_id', null).eq('is_default', true).eq('status', 'ACTIVE').maybeSingle());
    if (!template) return null;
    const steps = await this.repo.db.many<any>(this.repo.templateSteps().select('*').eq('template_id', template.id).order('sequence'));
    return { ...template, steps };
  }

  private async clearOtherDefaults(tenantId: string, templateId: string, module: string, siteId: string | null) {
    let query = this.repo.templates().update({ is_default: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('module', module).neq('id', templateId);
    query = siteId ? query.eq('site_id', siteId) : query.is('site_id', null);
    await this.repo.db.many(query.select());
  }

  private fromDbStep(step: any): WorkflowStepDto {
    return {
      stepName: step.step_name,
      stepType: step.step_type,
      sequence: step.sequence,
      assignedRoleId: step.assigned_role_id ?? undefined,
      assignedUserId: step.assigned_user_id ?? undefined,
      assignedDepartmentId: step.assigned_department_id ?? undefined,
      approvalMode: step.approval_mode,
      parallelGroup: step.parallel_group ?? undefined,
      conditionRule: step.condition_rule ?? undefined,
      slaHours: step.sla_hours ?? undefined,
      isRequired: step.is_required,
      canReject: step.can_reject,
      canOverride: step.can_override
    };
  }

  private async assertApprover(actorId: string, step: any) {
    if (step.assigned_to_user_id && step.assigned_to_user_id !== actorId) throw new ForbiddenException('This workflow step is assigned to another user');
    if (!step.assigned_to_role_id && !step.assigned_to_user_id && !step.assigned_to_department_id) return;
    if (!step.assigned_to_role_id) return;
    const roles = await this.repo.db.many<any>(this.repo.userRoles().select('roleId').eq('userId', actorId));
    const hasRole = roles.some((role) => role.roleId === step.assigned_to_role_id);
    if (!hasRole && !step.assigned_to_user_id) throw new ForbiddenException('Approver does not have the assigned workflow role');
  }

  private resolveSite(siteId: string | undefined, scope: RequestScope) {
    const resolved = siteId ?? scope.selectedSiteId ?? undefined;
    if (resolved) this.assertSiteAccess(resolved, scope);
    return resolved ?? null;
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: RequestScope) {
    if (!siteId || scope.corporateView) return;
    if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to this site');
  }

  private writeHistory(workflowInstanceId: string, eventType: string, description: string, userId?: string, beforeValue?: JsonValue | null, afterValue?: JsonValue | null) {
    return this.repo.db.single(this.repo.history().insert({
      id: crypto.randomUUID(),
      workflow_instance_id: workflowInstanceId,
      event_type: eventType,
      description,
      user_id: userId ?? null,
      before_value: beforeValue ?? null,
      after_value: afterValue ?? null
    }).select().single());
  }

  private historyAudit(tenantId: string, actorId: string, action: string, entityType: string, entityId: string, before: JsonValue | null, after: JsonValue | null) {
    const input: Parameters<AuditService['write']>[0] = { tenantId, actorId, action, entityType, entityId };
    if (before !== null) input.before = before;
    if (after !== null) input.after = after;
    return this.audit.write(input);
  }
}
