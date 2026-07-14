import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocTemporaryEmergencyService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly workflows: WorkflowsService,
    private readonly actions: ActionsService
  ) {}

  async temporary(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const control = await this.ensureTemporary(tenantId, moc);
    const extensions = await this.extensions(tenantId, id, scope);
    return { changeType: moc.change_type, applicable: moc.change_type === 'Temporary Change', control: this.decorateTemporary(control, moc), summary: this.temporarySummary(control, extensions), extensions, escalation: this.temporaryEscalation(control) };
  }

  async updateTemporary(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    if (moc.change_type === 'Temporary Change' && !dto.expiryDate && !moc.temporary?.expiry_date) throw new BadRequestException('Temporary change expiry date is required');
    const before = await this.ensureTemporary(tenantId, moc);
    const expiry = dto.expiryDate ?? before.expiry_date;
    const maxDays = Number(dto.maxDurationDays ?? dto.max_duration_days ?? before.max_duration_days ?? 90);
    const duration = expiry ? this.daysBetween(moc.created_at, expiry) : Number(dto.currentDurationDays ?? before.current_duration_days ?? 0);
    if (duration > maxDays && !dto.overrideMaxDuration) throw new BadRequestException('Temporary change expiry exceeds configured maximum duration');
    const patch = {
      status: this.temporaryStatus(expiry, before.removal_completed, before.extension_count),
      expiry_date: expiry ?? null,
      max_duration_days: maxDays,
      current_duration_days: duration,
      reason: dto.reason ?? before.reason ?? null,
      risk_controls: dto.riskControls ?? dto.risk_controls ?? before.risk_controls ?? null,
      reversal_plan: dto.reversalPlan ?? dto.reversal_plan ?? before.reversal_plan ?? null,
      responsible_owner_id: dto.responsibleOwnerId ?? dto.responsible_owner_id ?? dto.removalOwnerId ?? before.responsible_owner_id ?? before.removal_owner_id ?? null,
      review_frequency: dto.reviewFrequency ?? dto.review_frequency ?? before.review_frequency ?? null,
      temporary_operating_limits: dto.temporaryOperatingLimits ?? dto.temporary_operating_limits ?? before.temporary_operating_limits ?? null,
      temporary_procedure_reference: dto.temporaryProcedureReference ?? dto.temporary_procedure_reference ?? before.temporary_procedure_reference ?? null,
      removal_verification_required: dto.removalVerificationRequired ?? dto.removal_verification_required ?? before.removal_verification_required ?? true,
      normalization_risk: duration > 60,
      updated_at: new Date().toISOString()
    };
    const row = await this.db.single<any>(this.db.from('moc_temporary_controls').update(patch).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_CONTROL_UPDATED', 'Temporary controls updated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_TEMPORARY_CONTROL_UPDATED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.temporary(tenantId, id, scope);
  }

  async requestExtension(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const control = await this.ensureTemporary(tenantId, moc);
    if (!dto.requestedExpiryDate && !dto.expiryDate) throw new BadRequestException('Requested expiry date is required');
    if (!dto.justification && !dto.reason) throw new BadRequestException('Extension justification is required');
    const requested = dto.requestedExpiryDate ?? dto.expiryDate;
    const workflow = await this.workflows.startWorkflow(tenantId, actorId, { module: 'MOC', recordId: id, recordNumber: moc.moc_number, siteId: moc.site_id, companyId: moc.company_id, contextData: { workflowType: 'Temporary Extension', riskLevel: moc.risk_level, changeType: moc.change_type } }, scope).catch(() => null);
    const row = await this.db.single<any>(this.db.from('moc_temporary_extensions').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      old_expiry_date: control.expiry_date,
      requested_expiry_date: requested,
      justification: dto.justification ?? dto.reason,
      risk_reassessment: dto.riskReassessment ?? null,
      requested_by: actorId,
      workflow_instance_id: workflow?.id ?? null
    }).select().single());
    await this.db.single(this.db.from('moc_temporary_controls').update({ status: 'Extension Requested', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_EXTENSION_REQUESTED', 'Temporary extension requested', control, row);
    await this.notify(tenantId, moc, actorId, 'moc.temporary.extension_requested', 'Temporary extension requested', 'High');
    return row;
  }

  async approveExtension(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const extension = await this.pendingExtension(tenantId, id, dto.extensionId);
    const approvedExpiry = dto.approvedExpiryDate ?? extension.requested_expiry_date;
    const beforeControl = await this.ensureTemporary(tenantId, moc);
    const updatedExtension = await this.db.single<any>(this.db.from('moc_temporary_extensions').update({ status: 'Approved', approved_expiry_date: approvedExpiry, approved_by: actorId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', extension.id).select().single());
    const control = await this.db.single<any>(this.db.from('moc_temporary_controls').update({ status: 'Extended', expiry_date: approvedExpiry, extension_count: (beforeControl.extension_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_EXTENSION_APPROVED', 'Temporary extension approved', { extension, control: beforeControl }, { extension: updatedExtension, control });
    return updatedExtension;
  }

  async rejectExtension(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Extension rejection requires reason');
    const moc = await this.getMoc(tenantId, id, scope);
    const extension = await this.pendingExtension(tenantId, id, dto.extensionId);
    const row = await this.db.single<any>(this.db.from('moc_temporary_extensions').update({ status: 'Rejected', approved_by: actorId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', extension.id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_EXTENSION_REJECTED', dto.reason, extension, row);
    return row;
  }

  async markRemovalComplete(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureTemporary(tenantId, moc);
    const row = await this.db.single<any>(this.db.from('moc_temporary_controls').update({ status: 'Removed / Reversed', removal_completed: true, removal_completed_by: actorId, removal_completed_at: new Date().toISOString(), removal_evidence_attachment_id: dto.evidenceAttachmentId ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_REMOVAL_COMPLETED', 'Temporary removal/reversal completed', before, row);
    return row;
  }

  async convertTemporaryToPermanent(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ change_type: 'Permanent Process Change', title: dto.title ?? moc.title, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_TEMPORARY_CONVERTED_PERMANENT', dto.reason ?? 'Temporary change converted to permanent MOC', moc, updated);
    return updated;
  }

  async extensions(tenantId: string, id: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    return this.db.many<any>(this.db.from('moc_temporary_extensions').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }));
  }

  async temporaryExpiring(tenantId: string, scope: Scope, days = 30) {
    const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    let query = this.db.from('moc_temporary_controls').select('*, moc:mocs(*)').eq('tenant_id', tenantId).lte('expiry_date', until).neq('status', 'Removed / Reversed');
    query = this.scopeQuery(query, scope);
    return this.db.many<any>(query.order('expiry_date'));
  }

  async temporaryOverdue(tenantId: string, scope: Scope) {
    let query = this.db.from('moc_temporary_controls').select('*, moc:mocs(*)').eq('tenant_id', tenantId).lt('expiry_date', new Date().toISOString().slice(0, 10)).neq('status', 'Removed / Reversed');
    query = this.scopeQuery(query, scope);
    return this.db.many<any>(query.order('expiry_date'));
  }

  async normalizationRisk(tenantId: string, scope: Scope) {
    let query = this.db.from('moc_temporary_controls').select('*, moc:mocs(*)').eq('tenant_id', tenantId).eq('normalization_risk', true);
    query = this.scopeQuery(query, scope);
    return this.db.many<any>(query.order('expiry_date'));
  }

  async emergency(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const control = await this.ensureEmergency(tenantId, moc);
    const reviews = await this.db.many<any>(this.db.from('moc_emergency_reviews').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }));
    return { changeType: moc.change_type, applicable: moc.change_type === 'Emergency Change', control: this.decorateEmergency(control), summary: this.emergencySummary(control), reviews, escalation: this.emergencyEscalation(control) };
  }

  async updateEmergency(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureEmergency(tenantId, moc);
    const implementedAt = dto.implementedAt ?? dto.implementationDateTime ?? before.implemented_at ?? before.implementation_datetime ?? null;
    const reviewDue = dto.reviewDueAt ?? dto.postReviewDueDate ?? before.review_due_at ?? before.post_review_due_date ?? (implementedAt ? new Date(new Date(implementedAt).getTime() + 72 * 3600000).toISOString() : null);
    if (moc.change_type === 'Emergency Change' && !(dto.emergencyJustification ?? before.emergency_justification)) throw new BadRequestException('Emergency justification is required');
    if (moc.change_type === 'Emergency Change' && !(dto.immediateControls ?? dto.immediateRiskControls ?? before.immediate_controls ?? before.immediate_risk_controls)) throw new BadRequestException('Immediate risk controls are required');
    const row = await this.db.single<any>(this.db.from('moc_emergency_controls').update({
      emergency_justification: dto.emergencyJustification ?? before.emergency_justification ?? null,
      bypass_reason: dto.bypassReason ?? before.bypass_reason ?? null,
      immediate_controls: dto.immediateControls ?? dto.immediateRiskControls ?? before.immediate_controls ?? before.immediate_risk_controls ?? null,
      immediate_risk_controls: dto.immediateRiskControls ?? dto.immediateControls ?? before.immediate_risk_controls ?? before.immediate_controls ?? null,
      implemented_by: dto.implementedBy ?? before.implemented_by ?? actorId,
      implemented_at: implementedAt,
      implementation_datetime: implementedAt,
      affected_equipment_area: dto.affectedEquipmentArea ?? before.affected_equipment_area ?? null,
      initial_approval_authority_id: dto.initialApprovalAuthorityId ?? before.initial_approval_authority_id ?? null,
      review_due_at: reviewDue,
      post_review_due_date: reviewDue,
      review_owner_id: dto.reviewOwnerId ?? before.review_owner_id ?? null,
      permanent_moc_required: dto.permanentMocRequired ?? before.permanent_moc_required ?? false,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_EMERGENCY_CONTROL_UPDATED', 'Emergency controls updated', before, row);
    return this.emergency(tenantId, id, scope);
  }

  async completeEmergencyReview(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reviewFindings) throw new BadRequestException('Review findings are required');
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureEmergency(tenantId, moc);
    const review = await this.db.single<any>(this.db.from('moc_emergency_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, review_findings: dto.reviewFindings, additional_actions_required: dto.additionalActionsRequired ?? false, completed_by: actorId, completed_at: new Date().toISOString(), status: 'Completed' }).select().single());
    const control = await this.db.single<any>(this.db.from('moc_emergency_controls').update({ review_status: 'Completed', review_findings: dto.reviewFindings, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_EMERGENCY_REVIEW_COMPLETED', 'Emergency 72-hour review completed', before, { control, review });
    return { control, review };
  }

  async createEmergencyFollowupAction(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const action = await this.actions.create(tenantId, actorId, { sourceModule: 'moc', sourceRecordId: id, sourceType: 'Emergency Follow-up', title: dto.title ?? 'Emergency MOC follow-up action', description: dto.description ?? moc.title, priority: dto.priority ?? 'HIGH', ownerId: dto.ownerId ?? moc.originator_id ?? actorId, dueDate: dto.dueDate, siteId: moc.site_id, evidenceRequired: true, verificationRequired: true } as any);
    await this.history(tenantId, moc, actorId, 'MOC_EMERGENCY_FOLLOWUP_ACTION_CREATED', action.title, null, action);
    return action;
  }

  async convertEmergencyToPermanent(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ change_type: 'Permanent Process Change', title: dto.title ?? moc.title, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_EMERGENCY_CONVERTED_PERMANENT', dto.reason ?? 'Emergency change converted to permanent MOC', moc, updated);
    return updated;
  }

  async emergencyReviewsDue(tenantId: string, scope: Scope) {
    let query = this.db.from('moc_emergency_controls').select('*, moc:mocs(*)').eq('tenant_id', tenantId).neq('review_status', 'Completed').lte('review_due_at', new Date(Date.now() + 24 * 3600000).toISOString());
    query = this.scopeQuery(query, scope);
    return this.db.many<any>(query.order('review_due_at'));
  }

  async emergencyReviewsOverdue(tenantId: string, scope: Scope) {
    let query = this.db.from('moc_emergency_controls').select('*, moc:mocs(*)').eq('tenant_id', tenantId).neq('review_status', 'Completed').lt('review_due_at', new Date().toISOString());
    query = this.scopeQuery(query, scope);
    return this.db.many<any>(query.order('review_due_at'));
  }

  private async pendingExtension(tenantId: string, mocId: string, extensionId?: string) {
    let query = this.db.from('moc_temporary_extensions').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId);
    query = extensionId ? query.eq('id', extensionId) : query.eq('status', 'Pending Re-Approval').order('created_at', { ascending: false }).limit(1);
    const rows = await this.db.many<any>(query);
    if (!rows[0]) throw new NotFoundException('Pending temporary extension not found');
    return rows[0];
  }

  private async ensureTemporary(tenantId: string, moc: any) {
    const existing = moc.temporary ?? await this.db.single<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_temporary_controls').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, status: 'Active', max_duration_days: 90 }).select().single());
  }

  private async ensureEmergency(tenantId: string, moc: any) {
    const existing = moc.emergency ?? await this.db.single<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_emergency_controls').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, review_status: 'Pending' }).select().single());
  }

  private decorateTemporary(control: any, moc: any) {
    const currentDurationDays = control.expiry_date ? this.daysBetween(moc.created_at, control.expiry_date) : control.current_duration_days ?? 0;
    return { ...control, current_duration_days: currentDurationDays, days_remaining: this.daysRemaining(control.expiry_date), normalization_risk: currentDurationDays > 60 };
  }

  private temporarySummary(control: any, extensions: any[]) {
    const daysRemaining = this.daysRemaining(control.expiry_date);
    return { status: this.temporaryStatus(control.expiry_date, control.removal_completed, extensions.filter((item) => item.status === 'Approved').length), expiryDate: control.expiry_date, daysRemaining, maxDurationDays: control.max_duration_days ?? 90, currentDurationDays: control.current_duration_days ?? 0, extensionCount: extensions.length, ownerResponsibleForRemoval: control.responsible_owner_id ?? control.removal_owner_id, reversalPlanStatus: control.reversal_plan ? 'Ready' : 'Missing', overdue: daysRemaining !== null && daysRemaining < 0, normalizationRisk: (control.current_duration_days ?? 0) > 60 };
  }

  private temporaryEscalation(control: any) {
    const days = this.daysRemaining(control.expiry_date);
    return { warning30Day: days !== null && days <= 30, finalWarning7Day: days !== null && days <= 7, overdue: days !== null && days < 0, escalationLevel: days === null ? 'None' : days < 0 ? 'Plant Manager' : days <= 7 ? 'HSE Manager / Plant Manager' : days <= 30 ? 'Department Head' : 'None', lastEscalationDate: null };
  }

  private decorateEmergency(control: any) {
    return { ...control, hours_remaining: control.review_due_at || control.post_review_due_date ? Math.ceil((new Date(control.review_due_at ?? control.post_review_due_date).getTime() - Date.now()) / 3600000) : null };
  }

  private emergencySummary(control: any) {
    const hoursRemaining = control.review_due_at || control.post_review_due_date ? Math.ceil((new Date(control.review_due_at ?? control.post_review_due_date).getTime() - Date.now()) / 3600000) : null;
    return { reviewStatus: control.review_status ?? 'Pending', reviewDueAt: control.review_due_at ?? control.post_review_due_date, hoursRemaining, overdue: hoursRemaining !== null && hoursRemaining < 0, implementedBy: control.implemented_by, implementedAt: control.implemented_at ?? control.implementation_datetime, permanentMocRequired: control.permanent_moc_required };
  }

  private emergencyEscalation(control: any) {
    const due = control.review_due_at ?? control.post_review_due_date;
    const overdue = due ? new Date(due).getTime() < Date.now() && control.review_status !== 'Completed' : false;
    return { overdue, escalatedTo: overdue ? 'HSE Manager / Plant Manager' : null, escalationType: overdue ? '72-hour review overdue' : 'None' };
  }

  private temporaryStatus(expiry?: string, removed = false, extensions = 0) {
    if (removed) return 'Removed / Reversed';
    const days = this.daysRemaining(expiry);
    if (days !== null && days < 0) return 'Overdue Temporary Change';
    if (days !== null && days <= 7) return 'Expiring Soon';
    if (extensions > 0) return 'Extended';
    return 'Active';
  }

  private daysRemaining(date?: string | null) {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  }

  private daysBetween(from?: string | null, to?: string | null) {
    if (!from || !to) return 0;
    return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    const [temporary, emergency] = await Promise.all([
      this.db.single<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle())
    ]);
    return { ...moc, temporary, emergency };
  }

  private scopeQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('site_id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null }).select().single());
  }

  private notify(tenantId: string, moc: any, actorId: string, type: string, title: string, priority: string = 'Normal') {
    return this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type, module: 'moc', title, message: moc.title, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority }).catch(() => null);
  }
}
