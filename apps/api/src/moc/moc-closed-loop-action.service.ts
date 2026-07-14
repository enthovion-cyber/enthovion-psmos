import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MocClosureChecklistService } from './moc-closure-checklist.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocClosedLoopActionService {
  constructor(
    private readonly db: SupabaseService,
    private readonly actions: ActionsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly checklist: MocClosureChecklistService
  ) {}

  async list(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const [actions, startupBlockers, closureBlockers, closureChecklist, links] = await Promise.all([
      this.actionsFor(tenantId, id),
      this.startupBlockers(tenantId, id, scope),
      this.closureBlockers(tenantId, id, scope),
      this.closureChecklist(tenantId, id, scope),
      this.actionLinks(tenantId, id, scope)
    ]);
    return { actions, summary: this.summary(actions, startupBlockers, closureBlockers), startupBlockers, closureBlockers, closureChecklist, links, groups: this.groups(actions), readOnly: ['Closed', 'Cancelled'].includes(moc.status) };
  }

  summaryOnly(tenantId: string, id: string, scope: Scope) {
    return this.list(tenantId, id, scope).then((result) => result.summary);
  }

  async generate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const generated = this.generatedFromMoc(moc);
    const existing = await this.actionsFor(tenantId, id);
    const rows = [];
    for (const item of generated) {
      const current = existing.find((row) => row.source_type === item.sourceType && row.action_type === item.actionType);
      if (current) {
        rows.push(await this.db.single<any>(this.db.from('moc_required_actions').update({ required: true, no_longer_required: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', current.id).select().single()));
        continue;
      }
      rows.push(await this.db.single<any>(this.db.from('moc_required_actions').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: id,
        action_type: item.actionType,
        source_type: item.sourceType,
        source_record_id: id,
        source_question_key: item.sourceQuestionKey,
        action_title: item.title,
        title: item.title,
        description: item.description,
        linked_module: item.linkedModule,
        priority: item.priority,
        due_date: item.dueDate,
        required: true,
        system_generated: true,
        status: 'Preview',
        required_before_approval: item.requiredBeforeApproval,
        required_before_startup: item.requiredBeforeStartup,
        required_before_closure: item.requiredBeforeClosure,
        evidence_required: item.evidenceRequired,
        verification_required: item.verificationRequired,
        evidence_status: 'Not Uploaded',
        verification_status: 'Not Verified',
        created_by: actorId
      }).select().single()));
    }
    await this.history(tenantId, moc, actorId, 'MOC_ACTIONS_GENERATED', 'Closed-loop actions generated', existing, rows);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ACTIONS_GENERATED', entityType: 'MOC', entityId: id, after: rows as JsonValue });
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.action.generated', module: 'moc', title: `${moc.moc_number} actions generated`, message: `${rows.length} required actions synced.`, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'Normal' }).catch(() => null);
    return this.list(tenantId, id, scope);
  }

  sync(tenantId: string, actorId: string, id: string, scope: Scope, _source?: string) {
    return this.generate(tenantId, actorId, id, scope);
  }

  async createCustom(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    if (['Closed', 'Cancelled'].includes(moc.status)) throw new BadRequestException('Closed or cancelled MOCs are read-only');
    const row = await this.db.single<any>(this.db.from('moc_required_actions').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      action_type: dto.actionType ?? 'Manual',
      source_type: 'Manual',
      source_record_id: id,
      source_question_key: null,
      action_title: dto.title,
      title: dto.title,
      description: dto.description ?? null,
      linked_module: dto.linkedModule ?? 'Manual',
      priority: dto.priority ?? 'MEDIUM',
      due_date: dto.dueDate || null,
      required: dto.required ?? true,
      system_generated: false,
      status: 'Preview',
      required_before_approval: dto.requiredBeforeApproval ?? false,
      required_before_startup: dto.requiredBeforeStartup ?? false,
      required_before_closure: dto.requiredBeforeClosure ?? true,
      evidence_required: dto.evidenceRequired ?? true,
      verification_required: dto.verificationRequired ?? true,
      owner_id: dto.ownerId ?? null,
      created_by: actorId
    }).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_CUSTOM_ACTION_CREATED', `${row.title} created`, null, row);
    return row;
  }

  async update(tenantId: string, actorId: string, id: string, requiredActionId: string, dto: Record<string, any>, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    const before = await this.requiredAction(tenantId, id, requiredActionId);
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const [from, to] of [['title', 'title'], ['description', 'description'], ['priority', 'priority'], ['status', 'status'], ['ownerId', 'owner_id'], ['dueDate', 'due_date'], ['evidenceRequired', 'evidence_required'], ['verificationRequired', 'verification_required'], ['evidenceStatus', 'evidence_status'], ['verificationStatus', 'verification_status'], ['requiredBeforeApproval', 'required_before_approval'], ['requiredBeforeStartup', 'required_before_startup'], ['requiredBeforeClosure', 'required_before_closure']] as const) {
      if (dto[from] !== undefined) patch[to] = dto[from];
    }
    const row = await this.db.single<any>(this.db.from('moc_required_actions').update(patch).eq('tenant_id', tenantId).eq('id', requiredActionId).select().single());
    await this.history(tenantId, { id, company_id: row.company_id, site_id: row.site_id }, actorId, 'MOC_ACTION_UPDATED', `${row.title} updated`, before, row);
    return row;
  }

  async markNoLongerRequired(tenantId: string, actorId: string, id: string, requiredActionId: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Reason is required');
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.requiredAction(tenantId, id, requiredActionId);
    if (['Completed', 'Closed', 'CLOSED'].includes(before.status)) throw new BadRequestException('Completed actions remain in history and cannot be marked no longer required');
    const row = await this.db.single<any>(this.db.from('moc_required_actions').update({ required: false, no_longer_required: true, no_longer_required_reason: dto.reason, status: 'No Longer Required', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', requiredActionId).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_ACTION_NO_LONGER_REQUIRED', dto.reason, before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ACTION_NO_LONGER_REQUIRED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async createUniversalActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const required = await this.actionsFor(tenantId, id);
    const created = [];
    for (const row of required.filter((item) => item.required !== false && !item.action_id && !item.no_longer_required)) {
      const action = await this.actions.create(tenantId, actorId, {
        title: row.title,
        description: row.description ?? row.title,
        sourceModule: 'MOC',
        sourceType: row.source_type ?? 'MOC',
        sourceRecordId: id,
        priority: row.priority ?? 'MEDIUM',
        ownerId: row.owner_id ?? moc.originator_id ?? actorId,
        siteId: moc.site_id,
        departmentId: moc.department_id,
        dueDate: row.due_date ?? this.dueDate(14),
        evidenceRequired: row.evidence_required,
        verificationRequired: row.verification_required
      } as any);
      await this.db.single(this.db.from('moc_required_actions').update({ action_id: action.id, status: 'Created', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
      await this.db.single(this.db.from('moc_action_links').upsert({ id: `${id}_${action.id}_${row.source_type ?? 'moc'}`.replace(/[^a-zA-Z0-9_-]/g, '_'), tenant_id: tenantId, moc_id: id, action_id: action.id, company_id: moc.company_id, site_id: moc.site_id, linked_module: row.linked_module, linked_record_id: row.id, source_type: row.source_type ?? 'MOC' }, { onConflict: 'moc_id,action_id,source_type' }).select().single());
      created.push(action);
    }
    return created;
  }

  async startupBlockers(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    return this.blockers(moc, 'startup');
  }

  async closureBlockers(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    return this.blockers(moc, 'closure');
  }

  async closureChecklist(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const rows = await this.checklist.recalculate(tenantId, moc);
    return rows;
  }

  async recalculateClosureChecklist(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const rows = await this.checklist.recalculate(tenantId, moc, actorId);
    await this.history(tenantId, moc, actorId, 'MOC_CLOSURE_CHECKLIST_RECALCULATED', 'Closure checklist recalculated', null, rows);
    return rows;
  }

  async actionLinks(tenantId: string, id: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    return this.db.many<any>(this.db.from('moc_action_links').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }));
  }

  private generatedFromMoc(moc: any) {
    const impact = moc.impact?.answers ?? {};
    const engineering = moc.engineeringPackage;
    const items: any[] = [];
    const add = (condition: boolean, sourceType: string, actionType: string, title: string, priority = 'MEDIUM', opts: Record<string, any> = {}) => {
      if (!condition) return;
      items.push({ sourceType, actionType, title, description: opts.description ?? title, linkedModule: opts.linkedModule ?? actionType, priority, sourceQuestionKey: opts.sourceQuestionKey ?? actionType, requiredBeforeApproval: opts.requiredBeforeApproval ?? false, requiredBeforeStartup: opts.requiredBeforeStartup ?? false, requiredBeforeClosure: opts.requiredBeforeClosure ?? true, evidenceRequired: opts.evidenceRequired ?? true, verificationRequired: opts.verificationRequired ?? true, dueDate: opts.dueDate ?? this.dueDate(opts.days ?? 14) });
    };
    add(Boolean(impact.pidUpdateRequired), 'Impact Assessment', 'Document Control', 'Revise and approve P&ID drawing', 'HIGH', { sourceQuestionKey: 'pidUpdateRequired', linkedModule: 'Documents' });
    add(Boolean(impact.sopUpdateRequired || impact.proceduresAffected), 'Impact Assessment', 'SOP Management', 'Update affected SOP / procedure', 'HIGH', { sourceQuestionKey: 'sopUpdateRequired' });
    add(Boolean(impact.sdsUpdateRequired || impact.chemistryAffected), 'Impact Assessment', 'Chemical Register', 'Update SDS / chemical data', 'MEDIUM', { sourceQuestionKey: 'sdsUpdateRequired' });
    add(Boolean(impact.trainingRequired), 'Impact Assessment', 'Training', 'Complete role-based training before startup', 'HIGH', { sourceQuestionKey: 'trainingRequired', requiredBeforeStartup: true });
    add(Boolean(impact.equipmentRegistryUpdateRequired || impact.equipmentAffected), 'Impact Assessment', 'Equipment Registry', 'Update Equipment Registry master data', 'MEDIUM', { sourceQuestionKey: 'equipmentRegistryUpdateRequired' });
    add(Boolean(impact.hazopDeviationReviewRequired || moc.risk_level === 'Critical'), 'Risk Ranking', 'HAZOP', 'Complete HAZOP deviation review', 'HIGH', { requiredBeforeStartup: true });
    add(Boolean(impact.lopaReviewRequired || impact.sisAffected || moc.risk_level === 'Critical'), 'Risk Ranking', 'LOPA', 'Complete LOPA / SIS revalidation', 'SAFETY_CRITICAL', { requiredBeforeStartup: true, days: 7 });
    add(Boolean(engineering?.missing_required_documents_count > 0), 'Engineering Package', 'Engineering', 'Resolve missing required engineering documents', 'HIGH', { requiredBeforeApproval: true, requiredBeforeStartup: true });
    add(Boolean(moc.change_type === 'Temporary Change'), 'Temporary Control', 'Temporary Control', 'Verify temporary reversal / removal plan', 'MEDIUM');
    add(Boolean(moc.change_type === 'Emergency Change'), 'Emergency Control', 'Emergency Control', 'Complete emergency 72-hour review', 'HIGH');
    add(Boolean(moc.pssr?.required || ['High', 'Critical'].includes(moc.risk_level)), 'PSSR', 'PSSR', 'Complete PSSR startup readiness review', 'SAFETY_CRITICAL', { requiredBeforeStartup: true, days: 7 });
    return items;
  }

  private blockers(moc: any, mode: 'startup' | 'closure') {
    const actions = moc.actions ?? [];
    const blocking = actions.filter((row: any) => {
      if (row.required === false || row.no_longer_required) return false;
      const stage = mode === 'startup' ? row.required_before_startup : row.required_before_closure;
      if (!stage) return false;
      const actionDone = ['Completed', 'Closed', 'CLOSED'].includes(row.status);
      const evidenceOk = !row.evidence_required || ['Uploaded', 'Accepted', 'Approved'].includes(row.evidence_status);
      const verificationOk = !row.verification_required || row.verification_status === 'Verified';
      return !(actionDone && evidenceOk && verificationOk);
    });
    const extra = [];
    if (mode === 'startup' && moc.pssr?.required && !['Completed', 'Ready'].includes(moc.pssr.status)) extra.push({ id: `${moc.id}_pssr`, title: 'PSSR required before startup', reason: 'PSSR is required but incomplete', source_type: 'PSSR', priority: 'SAFETY_CRITICAL' });
    if (mode === 'closure' && moc.change_type === 'Emergency Change' && moc.emergency?.review_status !== 'Completed') extra.push({ id: `${moc.id}_emergency`, title: 'Emergency review required', reason: 'Emergency 72-hour review is incomplete', source_type: 'Emergency Control', priority: 'HIGH' });
    return [...blocking, ...extra];
  }

  private summary(actions: any[], startupBlockers: any[], closureBlockers: any[]) {
    const required = actions.filter((row) => row.required !== false && !row.no_longer_required);
    const completed = required.filter((row) => ['Completed', 'Closed', 'CLOSED'].includes(row.status));
    const overdue = required.filter((row) => row.due_date && new Date(row.due_date) < new Date() && !['Completed', 'Closed', 'CLOSED'].includes(row.status));
    const missingEvidence = required.filter((row) => row.evidence_required && !['Uploaded', 'Accepted', 'Approved'].includes(row.evidence_status));
    const pendingVerification = required.filter((row) => row.verification_required && row.verification_status !== 'Verified');
    const completionPercentage = required.length ? Math.round((completed.length / required.length) * 100) : 100;
    return { totalRequiredActions: required.length, completedActions: completed.length, openActions: required.length - completed.length, overdueActions: overdue.length, startupBlockingActions: startupBlockers.length, closureBlockingActions: closureBlockers.length, actionsMissingEvidence: missingEvidence.length, actionsPendingVerification: pendingVerification.length, completionPercentage, readinessStatus: startupBlockers.length || closureBlockers.length ? 'Red' : required.length === completed.length ? 'Green' : 'Amber' };
  }

  private groups(actions: any[]) {
    const groupNames = ['Documents / PSI', 'Engineering', 'HAZOP / LOPA / PSSR', 'Training', 'Equipment Registry', 'Operations / Procedures', 'Environmental / Compliance', 'Quality / Production', 'Temporary / Emergency', 'Manual'];
    return groupNames.map((name) => {
      const rows = actions.filter((row) => this.groupFor(row) === name);
      return { group: name, total: rows.length, complete: rows.filter((row) => ['Completed', 'Closed', 'CLOSED'].includes(row.status)).length, open: rows.filter((row) => !['Completed', 'Closed', 'CLOSED'].includes(row.status)).length, overdue: rows.filter((row) => row.due_date && new Date(row.due_date) < new Date() && !['Completed', 'Closed', 'CLOSED'].includes(row.status)).length, blockers: rows.filter((row) => row.required_before_startup || row.required_before_closure).length };
    });
  }

  private groupFor(row: any) {
    const text = `${row.action_type ?? ''} ${row.linked_module ?? ''} ${row.source_type ?? ''}`.toLowerCase();
    if (text.includes('document') || text.includes('sop') || text.includes('sds') || text.includes('psi')) return 'Documents / PSI';
    if (text.includes('engineering')) return 'Engineering';
    if (text.includes('hazop') || text.includes('lopa') || text.includes('pssr')) return 'HAZOP / LOPA / PSSR';
    if (text.includes('training')) return 'Training';
    if (text.includes('equipment')) return 'Equipment Registry';
    if (text.includes('procedure') || text.includes('operation')) return 'Operations / Procedures';
    if (text.includes('environment')) return 'Environmental / Compliance';
    if (text.includes('quality') || text.includes('production')) return 'Quality / Production';
    if (text.includes('temporary') || text.includes('emergency')) return 'Temporary / Emergency';
    return 'Manual';
  }

  private actionsFor(tenantId: string, mocId: string) {
    return this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).order('created_at'));
  }

  private async requiredAction(tenantId: string, mocId: string, id: string) {
    const row = await this.db.single<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).eq('id', id).maybeSingle());
    if (!row) throw new NotFoundException('MOC required action not found');
    return row;
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*, impact:moc_impact_assessments(*), risk:moc_risk_assessments(*), engineeringPackage:moc_engineering_packages(*), pssr:moc_pssr_requirements(*), temporary:moc_temporary_controls(*), emergency:moc_emergency_controls(*)').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (moc.site_id && !scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new BadRequestException('MOC is outside your site access scope');
    const actions = await this.actionsFor(tenantId, id);
    return { ...moc, actions };
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null, related_record_type: 'MOC Action', related_record_id: moc.id, related_url: `/moc/${moc.id}` }).select().single()).catch(() => null);
  }

  private dueDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
