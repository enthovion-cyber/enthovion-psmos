import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocStartupReadinessService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly actions: ActionsService
  ) {}

  async aggregate(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pssr = await this.ensurePssrIfRequired(tenantId, moc, null);
    const checklist = await this.checklist(moc, pssr);
    const blockers = await this.calculateBlockers(moc, pssr, checklist);
    const latestCheck = await this.latestCheck(tenantId, id);
    const readinessScore = this.score(checklist);
    return {
      summary: {
        startupReadinessStatus: blockers.length ? 'Blocked' : moc.status === 'Ready For Startup' ? 'Ready For Startup' : moc.released_for_startup_at ? 'Released' : readinessScore >= 90 ? 'Ready Pending Approval' : 'In Progress',
        pssrRequired: Boolean(pssr?.pssr_required ?? pssr?.required),
        pssrStatus: pssr?.pssr_status ?? pssr?.status ?? 'Not Required',
        startupBlockersCount: blockers.length,
        openRequiredActionsCount: moc.startupActions.filter((item: any) => !['Completed', 'Closed'].includes(item.status)).length,
        trainingCompletionPercent: this.trainingPercent(moc.training),
        documentReadinessPercent: this.documentPercent(moc),
        engineeringPackageStatus: moc.engineeringPackage?.status ?? 'Not Started',
        lastReadinessCheckDate: latestCheck?.checked_at ?? null,
        readyForStartupDate: moc.status === 'Ready For Startup' ? moc.updated_at : null,
        releasedBy: latestCheck?.released_by ?? moc.released_for_startup_by ?? null
      },
      pssr,
      linkedPssr: this.linkedPssr(pssr),
      blockers,
      checklist,
      requiredActionsBeforeStartup: moc.startupActions,
      trainingReadiness: this.trainingReadiness(moc.training),
      documentReadiness: this.documentReadiness(moc),
      engineeringReadiness: this.engineeringReadiness(moc),
      latestCheck
    };
  }

  pssr(tenantId: string, id: string, scope: Scope) {
    return this.aggregate(tenantId, id, scope).then((result) => result.pssr);
  }

  async triggerPssr(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const reasons = dto.triggerReasons ?? [dto.triggerReason ?? 'PSSR manually triggered'];
    const existing = await this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle());
    const payload = {
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      pssr_required: true,
      required: true,
      trigger_reason: reasons.join(', '),
      trigger_reasons: reasons,
      pssr_status: existing?.pssr_status ?? existing?.status ?? 'Required',
      status: existing?.status ?? 'Required',
      pssr_owner_id: dto.ownerId ?? existing?.pssr_owner_id ?? moc.originator_id ?? actorId,
      updated_at: new Date().toISOString()
    };
    const row = existing
      ? await this.db.single<any>(this.db.from('moc_pssr_requirements').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single())
      : await this.db.single<any>(this.db.from('moc_pssr_requirements').insert({ id: crypto.randomUUID(), ...payload, created_by: actorId }).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_PSSR_TRIGGERED', payload.trigger_reason, existing, row);
    await this.notify(tenantId, moc, actorId, 'moc.pssr.required', 'PSSR required', 'High');
    return row;
  }

  async syncPssr(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pssr = await this.ensurePssrIfRequired(tenantId, moc, actorId);
    if (!pssr) throw new BadRequestException('PSSR is not required for this MOC');
    const patch = {
      linked_pssr_id: dto.linkedPssrId ?? pssr.linked_pssr_id ?? null,
      linked_pssr_number: dto.linkedPssrNumber ?? pssr.linked_pssr_number ?? null,
      pssr_status: dto.pssrStatus ?? dto.status ?? pssr.pssr_status ?? pssr.status,
      status: dto.status ?? dto.pssrStatus ?? pssr.status,
      checklist_completion_percent: dto.checklistCompletionPercent ?? pssr.checklist_completion_percent ?? 0,
      open_punch_items_count: dto.openPunchItemsCount ?? pssr.open_punch_items_count ?? 0,
      critical_punch_items_count: dto.criticalPunchItemsCount ?? pssr.critical_punch_items_count ?? 0,
      completed_at: dto.completedAt ?? (['Completed', 'Ready'].includes(dto.pssrStatus ?? dto.status) ? new Date().toISOString() : pssr.completed_at),
      updated_at: new Date().toISOString()
    };
    const row = await this.db.single<any>(this.db.from('moc_pssr_requirements').update(patch).eq('tenant_id', tenantId).eq('id', pssr.id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_PSSR_SYNCED', 'PSSR status synced', pssr, row);
    if (['Completed', 'Ready'].includes(row.pssr_status ?? row.status)) await this.notify(tenantId, moc, actorId, 'moc.pssr.completed', 'PSSR completed');
    return row;
  }

  startupReadiness(tenantId: string, id: string, scope: Scope) {
    return this.aggregate(tenantId, id, scope);
  }

  async runCheck(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pssr = await this.ensurePssrIfRequired(tenantId, moc, actorId);
    const checklist = await this.checklist(moc, pssr);
    const blockers = await this.calculateBlockers(moc, pssr, checklist);
    const readinessScore = this.score(checklist);
    await this.replacePersistedBlockers(tenantId, moc, blockers);
    const row = await this.db.single<any>(this.db.from('moc_startup_readiness_checks').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, status: blockers.length ? 'Blocked' : 'Ready Pending Approval', readiness_score: readinessScore, blockers_count: blockers.length, checklist, checked_by: actorId, checked_at: new Date().toISOString() }).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_STARTUP_READINESS_CHECKED', `${readinessScore}% ready, ${blockers.length} blocker(s)`, null, row);
    if (blockers.length) await this.notify(tenantId, moc, actorId, 'moc.startup.blocked', 'MOC startup blocked', 'High');
    return { check: row, blockers, checklist };
  }

  async startupBlockers(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pssr = await this.ensurePssrIfRequired(tenantId, moc, null);
    const checklist = await this.checklist(moc, pssr);
    return this.calculateBlockers(moc, pssr, checklist);
  }

  async createStartupBlockerAction(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const action = await this.actions.create(tenantId, actorId, { sourceModule: 'moc', sourceRecordId: id, sourceType: 'Startup Blocker', title: dto.title ?? dto.blockerTitle ?? 'Resolve startup blocker', description: dto.description ?? dto.blockerDescription ?? moc.title, priority: dto.priority ?? 'HIGH', ownerId: dto.ownerId ?? moc.originator_id ?? actorId, dueDate: dto.dueDate, siteId: moc.site_id, evidenceRequired: true, verificationRequired: true } as any);
    await this.history(tenantId, moc, actorId, 'MOC_STARTUP_BLOCKER_ACTION_CREATED', action.title, null, action);
    return action;
  }

  async readyForStartup(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const result = await this.runCheck(tenantId, actorId, id, scope);
    if (result.blockers.length) throw new BadRequestException('MOC cannot be marked Ready For Startup while startup blockers exist');
    const before = await this.getMoc(tenantId, id, scope);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ status: 'Ready For Startup', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, before, actorId, 'MOC_READY_FOR_STARTUP', dto.comment ?? 'MOC marked Ready For Startup', before, updated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_READY_FOR_STARTUP', entityType: 'MOC', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async releaseForStartup(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const result = await this.runCheck(tenantId, actorId, id, scope);
    if (result.blockers.length) throw new BadRequestException('Release for startup requires zero blockers');
    const before = await this.getMoc(tenantId, id, scope);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ status: 'Released For Startup', released_for_startup_by: actorId, released_for_startup_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.db.single(this.db.from('moc_startup_readiness_checks').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: before.company_id, site_id: before.site_id, moc_id: id, status: 'Released', readiness_score: 100, blockers_count: 0, checklist: result.checklist, checked_by: actorId, checked_at: new Date().toISOString(), released_by: actorId, released_at: new Date().toISOString() }).select().single());
    await Promise.all((before.equipment ?? []).map((item: any) => this.db.single(this.db.from('EquipmentTimelineEvent').insert({ id: crypto.randomUUID(), tenantId, equipmentId: item.equipment_id, eventType: 'MOC_RELEASED_FOR_STARTUP', title: `${before.moc_number} released for startup`, actorName: actorId, occurredAt: new Date().toISOString(), sourceType: 'MOC', sourceId: id }).select().single()).catch(() => null)));
    await this.history(tenantId, before, actorId, 'MOC_RELEASED_FOR_STARTUP', dto.comment ?? 'MOC released for startup / operation', before, updated);
    return updated;
  }

  async returnToImplementation(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason && !dto.comment) throw new BadRequestException('Return to implementation requires reason');
    const before = await this.getMoc(tenantId, id, scope);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ status: 'Implementation', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, before, actorId, 'MOC_RETURNED_TO_IMPLEMENTATION', dto.reason ?? dto.comment, before, updated);
    return updated;
  }

  private async checklist(moc: any, pssr: any | null) {
    const rows = [
      this.item('Risk ranking complete', Boolean(moc.risk), 'Risk Ranking'),
      this.item('Impact assessment complete', Boolean(moc.impact), 'Impact Assessment'),
      this.item('Approval workflow complete', ['Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Released For Startup', 'Closed'].includes(moc.status), 'Workflow'),
      this.item('Engineering package complete', ['Approved', 'Ready'].includes(moc.engineeringPackage?.status) || (moc.engineeringPackage?.missing_required_documents_count ?? 1) === 0, 'Engineering'),
      this.item('Required startup actions complete', moc.startupActions.every((action: any) => ['Completed', 'Closed'].includes(action.status) && (!action.evidence_required || ['Uploaded', 'Accepted'].includes(action.evidence_status)) && (!action.verification_required || action.verification_status === 'Verified')), 'Actions'),
      this.item('PSSR complete', !pssr?.pssr_required || ['Completed', 'Ready'].includes(pssr.pssr_status ?? pssr.status), 'PSSR', pssr?.pssr_required ? undefined : 'gray'),
      this.item('Training complete', this.trainingPercent(moc.training) === 100, 'Training', moc.training.length ? undefined : 'gray'),
      this.item('Documents ready', this.documentPercent(moc) >= 90, 'Documents'),
      this.item('Operating limits updated', !moc.impact?.answers?.operatingLimitsChanged || this.hasDoc(moc, /operating|limit|sop/i), 'Operating Limits'),
      this.item('Safety systems verified', !moc.impact?.answers?.sisAffected || this.hasDoc(moc, /sis|dcs|safety|loop/i), 'Safety Systems'),
      this.item('Temporary controls active', moc.change_type !== 'Temporary Change' || Boolean(moc.temporary?.expiry_date && moc.temporary?.risk_controls), 'Temporary Controls', moc.change_type === 'Temporary Change' ? undefined : 'gray'),
      this.item('Emergency review complete if applicable', moc.change_type !== 'Emergency Change' || ['Completed', 'Ready'].includes(moc.emergency?.review_status), 'Emergency Review', moc.change_type === 'Emergency Change' ? undefined : 'gray'),
      this.item('Equipment records updated', !moc.impact?.answers?.equipmentRegistryUpdateRequired || moc.startupActions.every((action: any) => !/equipment registry/i.test(action.title ?? '') || ['Completed', 'Closed'].includes(action.status)), 'Equipment Registry'),
      this.item('Field verification complete', moc.startupActions.every((action: any) => !/field verification/i.test(action.title ?? '') || ['Completed', 'Closed'].includes(action.status)), 'Field Verification')
    ];
    return rows;
  }

  private async calculateBlockers(moc: any, pssr: any | null, checklist: any[]) {
    const blockers = checklist.filter((item) => item.status === 'red').map((item) => ({ id: item.key, blockerType: item.sourceModule, blockerTitle: item.label, blockerDescription: item.detail, sourceModule: item.sourceModule, sourceRecordId: null, severity: item.sourceModule === 'PSSR' || item.sourceModule === 'Safety Systems' ? 'Critical' : 'High', status: 'Open', blocking: true }));
    moc.startupActions.filter((action: any) => !['Completed', 'Closed'].includes(action.status)).forEach((action: any) => blockers.push({ id: action.id, blockerType: 'Required Action', blockerTitle: action.title ?? action.action_title, blockerDescription: action.description, sourceModule: 'Actions', sourceRecordId: action.id, severity: action.priority ?? 'High', status: action.status, blocking: true }));
    if (pssr?.pssr_required && (pssr.critical_punch_items_count ?? 0) > 0) blockers.push({ id: 'pssr-critical-punch', blockerType: 'PSSR', blockerTitle: 'Critical PSSR punch items open', blockerDescription: `${pssr.critical_punch_items_count} critical punch item(s)`, sourceModule: 'PSSR', sourceRecordId: pssr.linked_pssr_id, severity: 'Critical', status: 'Open', blocking: true });
    return blockers;
  }

  private item(label: string, ok: boolean, sourceModule: string, forced?: 'gray') {
    const status = forced ?? (ok ? 'green' : 'red');
    return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, sourceModule, status, detail: status === 'green' ? 'Complete' : status === 'gray' ? 'Not required' : 'Blocking readiness' };
  }

  private score(checklist: any[]) {
    const applicable = checklist.filter((item) => item.status !== 'gray');
    if (!applicable.length) return 100;
    return Math.round((applicable.filter((item) => item.status === 'green').length / applicable.length) * 100);
  }

  private linkedPssr(pssr: any | null) {
    if (!pssr) return null;
    return { linkedPssrId: pssr.linked_pssr_id, pssrNumber: pssr.linked_pssr_number, status: pssr.pssr_status ?? pssr.status, ownerId: pssr.pssr_owner_id, checklistCompletion: pssr.checklist_completion_percent, openPunchItems: pssr.open_punch_items_count, criticalPunchItems: pssr.critical_punch_items_count, completedAt: pssr.completed_at };
  }

  private trainingPercent(training: any[]) {
    if (!training.length) return 100;
    return Math.round((training.filter((item) => item.status === 'Completed').length / training.length) * 100);
  }

  private trainingReadiness(training: any[]) {
    return { trainingRequired: training.length > 0, affectedRoles: Array.from(new Set(training.map((item) => item.role_name).filter(Boolean))), requiredTrainingRecords: training, completionCount: training.filter((item) => item.status === 'Completed').length, pendingUsersRoles: training.filter((item) => item.status !== 'Completed'), trainingEvidence: training.filter((item) => item.evidence_attachment_id), moduleLink: '/training' };
  }

  private documentPercent(moc: any) {
    const required = ['P&ID', 'SOP', 'SDS', 'Engineering'];
    const complete = required.filter((label) => this.hasDoc(moc, new RegExp(label, 'i'))).length;
    return Math.round((complete / required.length) * 100);
  }

  private documentReadiness(moc: any) {
    return { requiredDocuments: ['P&ID', 'SOP', 'SDS/PSI', 'Engineering Package'], documentControlStatus: this.documentPercent(moc) >= 90 ? 'Ready' : 'Incomplete', pidReadiness: this.hasDoc(moc, /p&id|pid/i), sopReadiness: this.hasDoc(moc, /sop/i), sdsPsiReadiness: this.hasDoc(moc, /sds|psi/i), engineeringDocumentReadiness: moc.engineeringPackage?.status ?? 'Not Started', approvedVersionStatus: (moc.documents ?? []).filter((doc: any) => ['Approved', 'Active'].includes(doc.status)).length };
  }

  private engineeringReadiness(moc: any) {
    return { engineeringPackageStatus: moc.engineeringPackage?.status ?? 'Not Started', requiredCalculations: this.hasDoc(moc, /calculation/i), designBasis: this.hasDoc(moc, /design basis/i), sisDcsDocuments: this.hasDoc(moc, /sis|dcs/i), datasheets: this.hasDoc(moc, /datasheet/i), reviewApprovalStatus: moc.engineeringPackage?.status ?? 'Not Started' };
  }

  private hasDoc(moc: any, pattern: RegExp) {
    return (moc.documents ?? []).some((doc: any) => pattern.test(String(doc.document_type ?? doc.title ?? doc.file_name ?? '')));
  }

  private async latestCheck(tenantId: string, mocId: string) {
    const rows = await this.db.many<any>(this.db.from('moc_startup_readiness_checks').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).order('checked_at', { ascending: false }).limit(1));
    return rows[0] ?? null;
  }

  private async replacePersistedBlockers(tenantId: string, moc: any, blockers: any[]) {
    await this.db.many(this.db.from('moc_startup_blockers').update({ status: 'Resolved', blocking: false, resolved_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', moc.id).eq('status', 'Open').select());
    if (!blockers.length) return [];
    return this.db.many(this.db.from('moc_startup_blockers').insert(blockers.map((blocker) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, blocker_type: blocker.blockerType, blocker_title: blocker.blockerTitle, blocker_description: blocker.blockerDescription, source_module: blocker.sourceModule, source_record_id: blocker.sourceRecordId, severity: blocker.severity, status: 'Open', blocking: true }))).select());
  }

  private async ensurePssrIfRequired(tenantId: string, moc: any, actorId: string | null) {
    const reasons = this.pssrReasons(moc);
    const required = reasons.length > 0;
    const existing = moc.pssr ?? await this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (!required && !existing) return null;
    if (existing) return { ...existing, pssr_required: existing.pssr_required ?? existing.required ?? required, trigger_reasons: existing.trigger_reasons?.length ? existing.trigger_reasons : reasons };
    return this.db.single<any>(this.db.from('moc_pssr_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, pssr_required: true, required: true, trigger_reason: reasons.join(', '), trigger_reasons: reasons, pssr_status: 'Required', status: 'Required', pssr_owner_id: moc.originator_id ?? actorId, created_by: actorId }).select().single());
  }

  private pssrReasons(moc: any) {
    const answers = moc.impact?.answers ?? {};
    const reasons: string[] = [];
    if (moc.risk_level === 'Critical') reasons.push('Critical risk');
    if (moc.risk_level === 'High') reasons.push('High risk');
    if (answers.sisAffected) reasons.push('Safety system affected');
    if (answers.chemistryAffected) reasons.push('Process chemistry changed');
    if (answers.equipmentAffected || answers.datasheetUpdateRequired) reasons.push('Equipment design/specification changed');
    if (answers.operatingLimitsChanged) reasons.push('Operating limits changed');
    if (answers.newEquipment) reasons.push('New equipment');
    if (answers.lopaReviewRequired || answers.hazopDeviationReviewRequired) reasons.push('SIS/ESD/PSV or HAZOP/LOPA affected');
    if (answers.pssrRequired) reasons.push('Impact Assessment selected PSSR required');
    return Array.from(new Set(reasons));
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    const [risk, impact, engineeringPackage, documents, actions, temporary, emergency, pssr, training, equipment] = await Promise.all([
      this.db.single<any>(this.db.from('moc_risk_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_engineering_packages').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_engineering_documents').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.single<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_training_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.many<any>(this.db.from('moc_affected_equipment').select('*').eq('tenant_id', tenantId).eq('moc_id', id))
    ]);
    return { ...moc, risk, impact, engineeringPackage, documents, actions, startupActions: actions.filter((action: any) => action.required_before_startup), temporary, emergency, pssr, training, equipment };
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null }).select().single());
  }

  private notify(tenantId: string, moc: any, actorId: string, type: string, title: string, priority: string = 'Normal') {
    return this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type, module: 'moc', title, message: moc.title, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority }).catch(() => null);
  }
}
