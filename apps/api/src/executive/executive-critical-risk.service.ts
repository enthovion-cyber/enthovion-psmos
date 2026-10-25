import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ExecutiveAggregationService } from './executive-aggregation.service';
import { ExecutiveAdapterRegistryService } from './executive-adapter-registry.service';

type Row = Record<string, any>;

/**
 * Executive Phase 5 is deliberately a coordination layer.  It consumes real,
 * permission-filtered source records and links to Actions; it never changes a
 * source record's operational state.
 */
@Injectable()
export class ExecutiveCriticalRiskService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly aggregation: ExecutiveAggregationService,
    private readonly adapters: ExecutiveAdapterRegistryService,
    private readonly actions: ActionsService,
    private readonly notifications: NotificationsService
  ) {}

  async recalculate(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.critical_risk.recalculate');
    const scope = this.aggregation.scope(user, query);
    const startedAt = new Date().toISOString();
    const run = await this.db.single<Row>(this.db.from('executive_risk_aggregation_runs').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: scope.siteId, run_status: 'Running', scope_json: scope, started_at: startedAt, initiated_by: user.id }).select('*').single());
    try {
      const results = await this.adapters.aggregateAll(user, scope);
      const cases: Row[] = [];
      const snapshots: Row[] = [];
      for (const result of results) {
        for (const source of result.criticalItems) cases.push(await this.upsertCase(user, result, source, scope));
        for (const overdue of result.overdueItems) snapshots.push(await this.upsertOverdueSnapshot(user, result, overdue, scope));
      }
      const completed = await this.db.single<Row>(this.db.from('executive_risk_aggregation_runs').update({ run_status: results.some((row) => row.adapterStatus === 'error') ? 'Completed With Warnings' : 'Completed', completed_at: new Date().toISOString(), detected_case_count: cases.length, active_case_count: cases.filter((item) => !['Closed', 'Cancelled', 'Superseded'].includes(item.case_status)).length, critical_case_count: cases.filter((item) => item.executive_priority === 'Critical').length, overdue_action_count: snapshots.length, warning_count: results.reduce((n, row) => n + row.warnings.length, 0), error_count: results.reduce((n, row) => n + row.errors.length, 0) }).eq('id', run.id).eq('company_id', user.tenantId).select('*').single());
      await this.history(user, 'CRITICAL_RISK_RECALCULATED', 'Critical risk and overdue action cockpit recalculated', completed.id, { caseCount: cases.length, overdueActionCount: snapshots.length, scope });
      return { run: completed, cases, overdueActionSnapshots: snapshots, adapters: results.map((row) => ({ module: row.moduleKey, status: row.adapterStatus, warnings: row.warnings, errors: row.errors })) };
    } catch (error) {
      await this.db.single(this.db.from('executive_risk_aggregation_runs').update({ run_status: 'Failed', completed_at: new Date().toISOString(), safe_error_summary: 'A source could not be reconciled; no fabricated risk result was generated.' }).eq('id', run.id).eq('company_id', user.tenantId).select('id').single()).catch(() => null);
      throw error;
    }
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.critical_risk.dashboard.view');
    const scope = this.aggregation.scope(user, query);
    const cases = await this.caseRows(user, { ...query, limit: 250 }, scope);
    const escalations = await this.escalationRows(user, { ...query, limit: 250 }, scope);
    const overdue = await this.overdueRows(user, { ...query, limit: 250 }, scope);
    const open: Row[] = cases.rows.filter((row: Row) => !['Closed', 'Cancelled', 'Superseded'].includes(String(row.case_status)));
    return {
      scope, refreshedAt: new Date().toISOString(),
      summary: {
        openCriticalRisks: open.filter((row: Row) => row.executive_priority === 'Critical').length,
        highPriorityRisks: open.filter((row: Row) => row.executive_priority === 'High').length,
        unacknowledgedRisks: open.filter((row: Row) => row.acknowledgment_status === 'Unacknowledged').length,
        awaitingVerification: open.filter((row: Row) => Number(row.pending_verification_count ?? 0) > 0).length,
        activeEscalations: escalations.rows.filter((row: Row) => !['Closed', 'Cancelled', 'Superseded'].includes(row.escalation_status)).length,
        overdueActions: overdue.rows.length,
        repeatedOverdueActions: overdue.rows.filter((row: Row) => Number(row.extension_count ?? 0) > 0).length
      },
      criticalRisks: open.slice(0, 10).map((row: Row) => this.presentCase(user, row)),
      activeEscalations: escalations.rows.slice(0, 10),
      overdueActions: overdue.rows.slice(0, 10),
      attention: open.filter((row: Row) => row.executive_priority === 'Critical' || row.acknowledgment_status === 'Unacknowledged' || Number(row.pending_verification_count ?? 0) > 0).slice(0, 20).map((row: Row) => this.presentCase(user, row))
    };
  }

  async cases(user: RequestUser, query: Row = {}) { this.require(user, 'executive.critical_risk.register.view'); const scope = this.aggregation.scope(user, query); return this.caseRows(user, query, scope); }
  async caseDetail(user: RequestUser, id: string) {
    this.require(user, 'executive.critical_risk.detail.view');
    const row = await this.case(user, id);
    const [sources, actions, escalations, acknowledgments, decisions, verifications, history] = await Promise.all([
      this.db.many<Row>(this.db.from('executive_risk_case_source_links').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id)),
      this.db.many<Row>(this.db.from('executive_risk_case_action_links').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id)),
      this.db.many<Row>(this.db.from('executive_escalations').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id).order('created_at', { ascending: false })),
      this.db.many<Row>(this.db.from('executive_risk_case_acknowledgments').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id).order('acknowledged_at', { ascending: false })),
      this.db.many<Row>(this.db.from('executive_management_decisions').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id).order('created_at', { ascending: false })),
      this.db.many<Row>(this.db.from('executive_risk_verification_records').select('*').eq('company_id', user.tenantId).eq('risk_case_id', id).order('created_at', { ascending: false })),
      this.historyRows(user, id)
    ]);
    return { case: this.presentCase(user, row), sourceLinks: this.can(user, 'executive.critical_risk.restricted.view') ? sources : sources.map((item) => item.restricted ? { ...item, source_record_id: null, source_snapshot_json: null, source_title: 'Restricted source record' } : item), actionLinks: actions, escalations, acknowledgments, managementDecisions: decisions, verification: verifications, history };
  }

  async acknowledge(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.acknowledge'); const before = await this.case(user, id);
    if (['Closed', 'Cancelled', 'Superseded'].includes(before.case_status)) throw new BadRequestException('A closed or superseded risk cannot be acknowledged.');
    const record = await this.db.single<Row>(this.db.from('executive_risk_case_acknowledgments').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: before.site_id, risk_case_id: id, recipient_user_id: user.id, acknowledgment_type: 'Executive acknowledgement', acknowledgment_note: String(dto.note ?? '').trim() || null, acknowledged_at: new Date().toISOString() }).select('*').single());
    const after = await this.db.single<Row>(this.db.from('executive_risk_cases').update({ acknowledgment_status: 'Acknowledged', case_status: before.case_status === 'Open' ? 'Acknowledged' : before.case_status, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single());
    await this.history(user, 'CRITICAL_RISK_ACKNOWLEDGED', 'Critical risk acknowledged', id, { before, after, note: record.acknowledgement_note }); return after;
  }

  async assignOwner(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.owner.assign'); const before = await this.case(user, id); const ownerId = String(dto.ownerId ?? '').trim(); const reason = String(dto.reason ?? '').trim();
    if (!ownerId || !reason) throw new BadRequestException('Owner and assignment reason are required.');
    const owner = await this.db.single<Row>(this.db.from('User').select('id,tenantId,status').eq('id', ownerId).maybeSingle());
    if (!owner || owner.tenantId !== user.tenantId || owner.status !== 'ACTIVE') throw new BadRequestException('The selected owner is not an active user in this company.');
    const after = await this.db.single<Row>(this.db.from('executive_risk_cases').update({ executive_owner_user_id: ownerId, owner_assigned_at: new Date().toISOString(), owner_assignment_reason: reason, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single());
    await this.db.single(this.db.from('executive_risk_case_ownership_history').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: before.site_id, risk_case_id: id, previous_owner_user_id: before.executive_owner_user_id ?? null, new_owner_user_id: ownerId, assignment_type: 'Executive owner', assignment_reason: reason, assigned_by: user.id, assigned_at: new Date().toISOString() }).select('id').single());
    await this.notify(ownerId, user, after.site_id, 'executive.risk.owner_assigned', 'Critical risk ownership assigned', id, 'High'); await this.history(user, 'CRITICAL_RISK_OWNER_ASSIGNED', 'Executive risk owner assigned', id, { before, after, reason }); return after;
  }

  async createAction(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.action.create'); const risk = await this.case(user, id); const ownerId = String(dto.ownerId ?? risk.executive_owner_user_id ?? '').trim();
    if (!ownerId || !dto.dueDate || !dto.title || !dto.description) throw new BadRequestException('Action title, description, owner, and due date are required.');
    const action = await this.actions.create(user.tenantId, user.id, { title: dto.title, description: dto.description, ownerId, dueDate: dto.dueDate, priority: risk.executive_priority === 'Critical' ? 'SAFETY_CRITICAL' : 'HIGH', sourceModule: 'executive', sourceType: 'ExecutiveRiskCase', sourceRecordId: id, siteId: risk.site_id ?? undefined, evidenceRequired: Boolean(dto.evidenceRequired ?? risk.executive_priority === 'Critical'), verificationRequired: Boolean(dto.verificationRequired ?? true) });
    await this.db.single(this.db.from('executive_risk_case_action_links').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: risk.site_id, risk_case_id: id, universal_action_id: action.id, source_module: 'executive', relationship_type: 'Created follow-up', required_for_case_closure: Boolean(dto.requiredForClosure), linked_by: user.id }).select('id').single());
    await this.history(user, 'CRITICAL_RISK_ACTION_CREATED', 'Universal action created from executive risk case', id, { actionId: action.id }); return action;
  }

  async linkAction(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.action.link'); const risk = await this.case(user, id); const actionId = String(dto.actionId ?? '').trim();
    const action = await this.db.single<Row>(this.db.from('Action').select('id,tenantId,siteId,status').eq('id', actionId).maybeSingle());
    if (!action || action.tenantId !== user.tenantId) throw new NotFoundException('The selected universal action was not found in this company.');
    if (risk.site_id && action.siteId && risk.site_id !== action.siteId) throw new BadRequestException('Action belongs to a different site.');
    const link = await this.db.single<Row>(this.db.from('executive_risk_case_action_links').upsert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: risk.site_id, risk_case_id: id, universal_action_id: action.id, source_module: action.moduleKey ?? null, relationship_type: 'Linked', linked_by: user.id }, { onConflict: 'risk_case_id,universal_action_id' }).select('*').single());
    await this.history(user, 'CRITICAL_RISK_ACTION_LINKED', 'Existing universal action linked to executive risk case', id, { actionId }); return link;
  }

  async requestVerification(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.verification.request'); const risk = await this.case(user, id); const verifierId = String(dto.verifierId ?? '').trim();
    if (!verifierId) throw new BadRequestException('A verifier is required.');
    const verification = await this.db.single<Row>(this.db.from('executive_risk_verification_records').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: risk.site_id, risk_case_id: id, source_module: risk.source_module, source_record_id: risk.source_record_id, verification_type: 'Executive closure verification', verification_status: 'Requested', required: true, verifier_user_id: verifierId, verification_note: dto.criteria ?? null }).select('*').single());
    await this.db.single(this.db.from('executive_risk_cases').update({ pending_verification_count: Number(risk.pending_verification_count ?? 0) + 1, case_status: 'Awaiting Verification', updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('id').single());
    await this.notify(verifierId, user, risk.site_id, 'executive.risk.verification_requested', 'Risk verification requested', id, 'High'); await this.history(user, 'CRITICAL_RISK_VERIFICATION_REQUESTED', 'Risk verification requested', id, { verificationId: verification.id }); return verification;
  }

  async closeCase(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.critical_risk.case.close'); const before = await this.case(user, id);
    if (!before.source_resolved_at) throw new BadRequestException('The executive case cannot close until the underlying source record is resolved.');
    if (Number(before.pending_verification_count ?? 0) > 0) throw new BadRequestException('The executive case cannot close while verification is pending.');
    const after = await this.db.single<Row>(this.db.from('executive_risk_cases').update({ case_status: 'Closed', closed_at: new Date().toISOString(), closed_by: user.id, closure_reason: String(dto.reason ?? '').trim() || null, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single());
    await this.history(user, 'CRITICAL_RISK_CASE_CLOSED', 'Executive critical risk case closed after source resolution', id, { before, after }); return after;
  }

  async overdueActions(user: RequestUser, query: Row = {}) { this.require(user, 'executive.overdue_action.register.view'); return this.overdueRows(user, query, this.aggregation.scope(user, query)); }
  async overdueActionDetail(user: RequestUser, id: string) { this.require(user, 'executive.overdue_action.detail.view'); const row = await this.db.single<Row>(this.db.from('executive_overdue_action_snapshots').select('*').eq('company_id', user.tenantId).eq('id', id).maybeSingle()); if (!row) throw new NotFoundException('Overdue action snapshot was not found.'); return row; }

  async escalations(user: RequestUser, query: Row = {}) { this.require(user, 'executive.escalation.register.view'); return this.escalationRows(user, query, this.aggregation.scope(user, query)); }
  async createEscalation(user: RequestUser, dto: Row) {
    this.require(user, 'executive.escalation.create'); const riskCaseId = dto.riskCaseId ? String(dto.riskCaseId) : null; const risk = riskCaseId ? await this.case(user, riskCaseId) : null;
    const recipientId = String(dto.recipientUserId ?? risk?.executive_owner_user_id ?? '').trim(); if (!recipientId) throw new BadRequestException('An escalation recipient is required.');
    const escalation = await this.db.single<Row>(this.db.from('executive_escalations').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: risk?.site_id ?? dto.siteId ?? null, escalation_code: `EES-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, risk_case_id: riskCaseId, universal_action_id: dto.universalActionId ?? null, source_module: risk?.source_module ?? dto.sourceModule ?? 'Executive', source_record_type: risk?.source_record_type ?? dto.sourceRecordType ?? 'ExecutiveRiskCase', source_record_id: risk?.source_record_id ?? dto.sourceRecordId ?? riskCaseId ?? String(dto.universalActionId ?? ''), trigger_type: dto.triggerType ?? 'Manual', escalation_status: 'Active', escalation_level: Number(dto.level ?? 1), escalation_reason: String(dto.reason ?? '').trim() || 'Leadership attention required', priority: risk?.executive_priority ?? dto.priority ?? 'High', severity: risk?.source_severity ?? null, escalated_to_user_id: recipientId, escalated_to_role: dto.recipientRole ?? null, escalation_owner_user_id: recipientId, response_due_at: dto.dueAt ?? null, created_by: user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('*').single());
    await this.db.single(this.db.from('executive_escalation_events').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: escalation.site_id, escalation_id: escalation.id, event_type: 'Created', event_title: 'Escalation created', event_description: escalation.escalation_reason, actor_user_id: user.id, created_at: new Date().toISOString() }).select('id').single());
    await this.notify(recipientId, user, escalation.site_id, 'executive.escalation.created', 'Executive escalation assigned', escalation.id, 'Safety-Critical'); await this.history(user, 'EXECUTIVE_ESCALATION_CREATED', 'Executive escalation created', escalation.id, escalation); return escalation;
  }
  async escalationDetail(user: RequestUser, id: string) { this.require(user, 'executive.escalation.detail.view'); const escalation = await this.escalation(user, id); const [events, decisions] = await Promise.all([this.db.many<Row>(this.db.from('executive_escalation_events').select('*').eq('company_id', user.tenantId).eq('escalation_id', id).order('created_at')), this.db.many<Row>(this.db.from('executive_management_decisions').select('*').eq('company_id', user.tenantId).eq('escalation_id', id).order('created_at', { ascending: false }))]); return { escalation, events, managementDecisions: decisions }; }
  async acknowledgeEscalation(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.escalation.acknowledge'); const before = await this.escalation(user, id); const after = await this.db.single<Row>(this.db.from('executive_escalations').update({ escalation_status: 'Acknowledged', acknowledged_by: user.id, acknowledged_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); await this.event(user, after, 'Acknowledged', String(dto.note ?? '').trim() || null); await this.history(user, 'EXECUTIVE_ESCALATION_ACKNOWLEDGED', 'Executive escalation acknowledged', id, { before, after }); return after; }
  async decideEscalation(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.escalation.decision.create'); const escalation = await this.escalation(user, id); const decision = String(dto.decision ?? '').trim(); if (!decision) throw new BadRequestException('A management decision is required.'); const row = await this.db.single<Row>(this.db.from('executive_management_decisions').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: escalation.site_id, decision_code: `EMD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, escalation_id: id, risk_case_id: escalation.risk_case_id, decision_type: dto.decisionType ?? 'Management Direction', decision_summary: decision, decision_rationale: String(dto.rationale ?? decision), decision_maker_user_id: user.id, created_by: user.id, created_at: new Date().toISOString() }).select('*').single()); await this.event(user, escalation, 'Decision Recorded', decision); await this.history(user, 'EXECUTIVE_MANAGEMENT_DECISION_RECORDED', 'Management decision recorded for escalation', id, row); return row; }
  async closeEscalation(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.escalation.close'); const before = await this.escalation(user, id); if (before.risk_case_id) { const risk = await this.case(user, before.risk_case_id); if (!['Closed', 'Cancelled', 'Superseded'].includes(risk.case_status)) throw new BadRequestException('Close the executive case only after the underlying source is resolved; then close this escalation.'); } const reason = String(dto.reason ?? '').trim() || null; const after = await this.db.single<Row>(this.db.from('executive_escalations').update({ escalation_status: 'Closed', closed_by: user.id, closed_at: new Date().toISOString(), closure_reason: reason, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); await this.event(user, after, 'Closed', reason); await this.history(user, 'EXECUTIVE_ESCALATION_CLOSED', 'Executive escalation closed', id, { before, after }); return after; }

  async reassignEscalation(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.escalation.reassign');
    const before = await this.escalation(user, id);
    const newRecipientId = String(dto.recipientUserId ?? '').trim();
    if (!newRecipientId) throw new BadRequestException('New recipient user ID is required.');
    const after = await this.db.single<Row>(
      this.db.from('executive_escalations').update({
        escalated_to_user_id: newRecipientId,
        escalation_owner_user_id: newRecipientId,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('company_id', user.tenantId).select('*').single()
    );
    await this.event(user, after, 'Reassigned', `Reassigned to user: ${newRecipientId}`);
    await this.notify(newRecipientId, user, after.site_id, 'executive.escalation.reassigned', 'Escalation reassigned to you', id, 'High');
    await this.history(user, 'EXECUTIVE_ESCALATION_REASSIGNED', 'Executive escalation reassigned', id, { before, after });
    return after;
  }

  async advanceEscalationLevel(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.escalation.level.increase');
    const before = await this.escalation(user, id);
    const nextLevel = Math.min(Number(before.escalation_level ?? 1) + 1, 5);
    const after = await this.db.single<Row>(
      this.db.from('executive_escalations').update({
        escalation_level: nextLevel,
        escalation_status: 'Active',
        escalation_reason: String(dto.reason ?? before.escalation_reason),
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('company_id', user.tenantId).select('*').single()
    );
    await this.event(user, after, 'Level Advanced', `Escalation advanced to Level ${nextLevel}`);
    await this.history(user, 'EXECUTIVE_ESCALATION_LEVEL_INCREASED', 'Escalation level advanced', id, { before, after });
    return after;
  }

  async cancelEscalation(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.escalation.cancel');
    const before = await this.escalation(user, id);
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Cancellation reason is required.');
    const after = await this.db.single<Row>(
      this.db.from('executive_escalations').update({
        escalation_status: 'Cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('company_id', user.tenantId).select('*').single()
    );
    await this.event(user, after, 'Cancelled', reason);
    await this.history(user, 'EXECUTIVE_ESCALATION_CANCELLED', 'Executive escalation cancelled', id, { before, after, reason });
    return after;
  }

  async barriers(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.critical_risk.register.view');
    const scope = this.aggregation.scope(user, query);
    let request: any = this.db.from('executive_risk_cases').select('*', { count: 'exact' })
      .eq('company_id', user.tenantId)
      .or('barrier_impaired.eq.true,case_type.ilike.%barrier%,source_module.eq.mechanical-integrity');
    if (scope.siteId) request = request.eq('site_id', scope.siteId);
    const page = this.page(query);
    const { data, count, error } = await request.range(page.offset, page.offset + page.limit - 1);
    if (error) throw new BadRequestException('Barrier records are unavailable.');
    return { rows: (data ?? []).map((item: Row) => this.presentCase(user, item)), total: count ?? 0, ...page };
  }

  async overdueActionsByOwner(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.overdue_action.owner.view');
    const scope = this.aggregation.scope(user, query);
    const { rows } = await this.overdueRows(user, { ...query, limit: 500 }, scope);
    const map = new Map<string, { ownerId: string; ownerName: string; count: number; criticalCount: number; maxOverdueDays: number }>();
    for (const r of rows) {
      const owner = r.owner_user_id ?? 'unassigned';
      const cur = map.get(owner) ?? { ownerId: owner, ownerName: owner === 'unassigned' ? 'Unassigned' : owner, count: 0, criticalCount: 0, maxOverdueDays: 0 };
      cur.count += 1;
      if (/critical|high/i.test(String(r.action_priority ?? ''))) cur.criticalCount += 1;
      cur.maxOverdueDays = Math.max(cur.maxOverdueDays, Number(r.overdue_days ?? 0));
      map.set(owner, cur);
    }
    return { rows: Array.from(map.values()) };
  }

  async overdueActionsBySite(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.overdue_action.dashboard.view');
    const scope = this.aggregation.scope(user, query);
    const { rows } = await this.overdueRows(user, { ...query, limit: 500 }, scope);
    const map = new Map<string, { siteId: string; count: number; criticalCount: number }>();
    for (const r of rows) {
      const site = r.site_id ?? 'unassigned';
      const cur = map.get(site) ?? { siteId: site, count: 0, criticalCount: 0 };
      cur.count += 1;
      if (/critical|high/i.test(String(r.action_priority ?? ''))) cur.criticalCount += 1;
      map.set(site, cur);
    }
    return { rows: Array.from(map.values()) };
  }

  async overdueActionsByModule(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.overdue_action.dashboard.view');
    const scope = this.aggregation.scope(user, query);
    const { rows } = await this.overdueRows(user, { ...query, limit: 500 }, scope);
    const map = new Map<string, { module: string; count: number; criticalCount: number }>();
    for (const r of rows) {
      const mod = r.source_module ?? 'Action';
      const cur = map.get(mod) ?? { module: mod, count: 0, criticalCount: 0 };
      cur.count += 1;
      if (/critical|high/i.test(String(r.action_priority ?? ''))) cur.criticalCount += 1;
      map.set(mod, cur);
    }
    return { rows: Array.from(map.values()) };
  }

  async approveRule(user: RequestUser, id: string) {
    this.require(user, 'executive.escalation.rule.approve');
    const row = await this.db.single<Row>(
      this.db.from('executive_escalation_rules').update({
        active: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('company_id', user.tenantId).select('*').single()
    );
    await this.history(user, 'EXECUTIVE_ESCALATION_RULE_APPROVED', 'Escalation rule approved', id, row);
    return row;
  }

  async archiveRule(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.escalation.rule.archive');
    const reason = String(dto.reason ?? '').trim() || 'Archived by administrator';
    const row = await this.db.single<Row>(
      this.db.from('executive_escalation_rules').update({
        active: false,
        archived_at: new Date().toISOString(),
        archive_reason: reason,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('company_id', user.tenantId).select('*').single()
    );
    await this.history(user, 'EXECUTIVE_ESCALATION_RULE_ARCHIVED', 'Escalation rule archived', id, row);
    return row;
  }

  lookups(type: string) {
    switch (type) {
      case 'risk-case-statuses':
        return ['Open', 'Acknowledged', 'Action Required', 'Action In Progress', 'Escalated', 'Management Decision Pending', 'Pending Source Resolution', 'Source Resolved', 'Awaiting Verification', 'Closed', 'Reopened', 'Historical', 'Superseded'];
      case 'risk-priority-levels':
        return ['Critical', 'High', 'Medium', 'Low', 'Informational', 'Unknown / Insufficient Data'];
      case 'barrier-statuses':
        return ['Available / Healthy', 'Impaired', 'Out of Service', 'Test Overdue', 'Verification Failed', 'Under Maintenance', 'Unknown', 'Not Reported'];
      case 'escalation-levels':
        return [
          { level: 0, label: 'Owner Follow-Up' },
          { level: 1, label: 'Department Manager' },
          { level: 2, label: 'Site PSM / HSE Manager' },
          { level: 3, label: 'Plant / Site Manager' },
          { level: 4, label: 'Corporate PSM / HSE Leadership' },
          { level: 5, label: 'Executive Leadership' },
        ];
      case 'escalation-statuses':
        return ['Pending', 'Active', 'Delivered', 'Awaiting Acknowledgment', 'Acknowledged', 'Response Required', 'Management Decision Pending', 'Under Management Review', 'Follow-Up Required', 'Source Resolution Pending', 'Verification Pending', 'Closed', 'Cancelled', 'Superseded'];
      case 'escalation-trigger-types':
        return ['New Critical Risk', 'Critical Safety Barrier Impaired', 'Critical Action Overdue', 'High-Priority Action Overdue Beyond Threshold', 'Critical Risk Unacknowledged', 'Action Owner Missing', 'Critical Action Verification Failed', 'CAPA Reopened', 'Critical Regulatory Gap Unresolved', 'Critical PSSR Blocker Unresolved', 'Critical MI Deficiency Unresolved', 'Source Condition Worsened', 'Escalation Acknowledgment Overdue', 'Management Decision Overdue', 'Manual'];
      case 'management-decision-types':
        return ['Request Immediate Investigation', 'Request Corrective Action', 'Request Additional Resources', 'Request Technical Review', 'Request Verification', 'Request Independent Review', 'Request Management Review', 'Refer to MOC', 'Refer to PSSR', 'Refer to Audit / Compliance Assurance', 'Refer to Regulatory Register', 'Request Updated Risk Assessment', 'Other'];
      case 'acknowledgment-types':
        return ['Executive acknowledgement', 'Management review acknowledgment', 'Interim response acknowledgment', 'Delegated acknowledgment'];
      case 'escalation-sla-statuses':
        return ['Within SLA', 'Due Soon', 'SLA Breached', 'Paused by Approved Policy', 'Completed Within SLA', 'Completed Late', 'Not Applicable'];
      default:
        return [];
    }
  }

  async rules(user: RequestUser, query: Row = {}) { this.require(user, 'executive.escalation.rule.view'); const scope = this.aggregation.scope(user, query); let request: any = this.db.from('executive_escalation_rules').select('*').eq('company_id', user.tenantId).is('archived_at', null).order('priority_level'); if (scope.siteId) request = request.or(`site_id.is.null,site_id.eq.${scope.siteId}`); return this.db.many<Row>(request); }
  async saveRule(user: RequestUser, dto: Row, id?: string) { this.require(user, id ? 'executive.escalation.rule.edit' : 'executive.escalation.rule.create'); if (!dto.ruleName || !dto.triggerType) throw new BadRequestException('Rule name and trigger type are required.'); const siteId = dto.siteId ?? user.selectedSiteId; if (!id && !siteId) throw new BadRequestException('A site is required when creating an escalation rule.'); const values = { rule_title: dto.ruleName, trigger_type: dto.triggerType, priority_level: dto.priorityLevel ?? 'High', source_module: dto.sourceModule ?? null, escalation_level: Number(dto.escalationLevel ?? 1), recipient_user_id: dto.recipientUserId ?? null, recipient_role: dto.recipientRole ?? null, active: dto.active !== false, updated_by: user.id, updated_at: new Date().toISOString() }; const row = id ? await this.db.single<Row>(this.db.from('executive_escalation_rules').update(values).eq('id', id).eq('company_id', user.tenantId).select('*').single()) : await this.db.single<Row>(this.db.from('executive_escalation_rules').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: siteId, rule_code: `EER-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, created_by: user.id, created_at: new Date().toISOString(), ...values }).select('*').single()); await this.history(user, id ? 'EXECUTIVE_ESCALATION_RULE_UPDATED' : 'EXECUTIVE_ESCALATION_RULE_CREATED', 'Executive escalation rule saved', row.id, row); return row; }
  async dryRunRule(user: RequestUser, dto: Row) { this.require(user, 'executive.escalation.rule.edit'); const candidates = await this.cases(user, { siteId: dto.siteId, limit: 100 }); return { evaluatedAt: new Date().toISOString(), criteria: dto.triggerConfiguration ?? {}, matchedCases: candidates.rows.filter((item: Row) => !dto.triggerConfiguration?.priority || item.risk_priority === dto.triggerConfiguration.priority).map((item: Row) => this.presentCase(user, item)) }; }
  async leadership(user: RequestUser, query: Row = {}) { this.require(user, 'executive.leadership_attention.view'); const dashboard = await this.dashboard(user, query); return { ...dashboard, generatedAt: new Date().toISOString(), policy: 'Derived from permitted real source records and unresolved Action records.', nextReviewItems: dashboard.attention }; }
  async historyList(user: RequestUser, query: Row = {}) { this.require(user, 'executive.critical_risk.history.view'); let request: any = this.db.from('executive_risk_history_events').select('*', { count: 'exact' }).eq('company_id', user.tenantId).order('created_at', { ascending: false }); if (query.riskCaseId) request = request.eq('risk_case_id', query.riskCaseId); const page = this.page(query); const { data, count, error } = await request.range(page.offset, page.offset + page.limit - 1); if (error) throw new BadRequestException('Executive risk history is unavailable. Apply the Phase 5 migration.'); return { rows: data ?? [], total: count ?? 0, ...page }; }

  private async upsertCase(user: RequestUser, result: Row, source: Row, scope: Row) {
    const key = `${result.moduleKey}:${source.sourceRecordType}:${source.sourceRecordId}`; const now = new Date().toISOString();
    const current = await this.db.single<Row>(this.db.from('executive_risk_cases').select('*').eq('company_id', user.tenantId).eq('canonical_source_key', key).maybeSingle()).catch(() => null);
    const priority = this.priority(source.severity ?? source.criticality); const values = { company_id: user.tenantId, site_id: source.siteId ?? scope.siteId, unit_id: source.unitId ?? scope.unitId, source_module: result.moduleKey, source_record_type: source.sourceRecordType, source_record_id: source.sourceRecordId, canonical_source_key: key, case_title: source.title, case_type: 'Critical Risk', source_status: source.status ?? null, source_severity: source.severity ?? null, source_criticality: source.criticality ?? null, executive_priority: priority, prioritization_score: priority === 'Critical' ? 100 : 75, operational_owner_user_id: source.ownerUserId ?? null, source_resolved_at: this.resolved(source.status) ? now : null, data_freshness_status: result.adapterStatus, case_status: current?.case_status && !['Closed', 'Cancelled', 'Superseded'].includes(current.case_status) ? current.case_status : 'Open', updated_at: now, last_observed_at: now };
    const row = current ? await this.db.single<Row>(this.db.from('executive_risk_cases').update(values).eq('id', current.id).select('*').single()) : await this.db.single<Row>(this.db.from('executive_risk_cases').insert({ id: crypto.randomUUID(), case_code: `ERC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, first_detected_at: now, ...values }).select('*').single());
    await this.db.single(this.db.from('executive_risk_case_source_links').upsert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: row.site_id, risk_case_id: row.id, source_module: result.moduleKey, source_record_type: source.sourceRecordType, source_record_id: source.sourceRecordId, relationship_type: 'Canonical source', restricted: Boolean(source.restricted), source_snapshot_json: source.safePlaceholder ? null : source, linked_by: user.id, linked_at: now }, { onConflict: 'risk_case_id,source_module,source_record_type,source_record_id' }).select('id').single()).catch(() => null);
    return row;
  }
  private async upsertOverdueSnapshot(user: RequestUser, result: Row, source: Row, scope: Row) { const key = `${result.moduleKey}:${source.sourceRecordId}`; return this.db.single<Row>(this.db.from('executive_overdue_action_snapshots').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: source.siteId ?? scope.siteId, unit_id: source.unitId ?? scope.unitId, canonical_action_key: key, universal_action_id: source.sourceRecordId, source_modules_json: [result.moduleKey], action_priority: source.severity ?? null, original_due_at: source.dueDate ?? null, effective_due_at: source.dueDate ?? new Date().toISOString(), overdue_days: Number(source.overdueDays ?? 0), action_status: source.status ?? 'Open', owner_user_id: source.ownerUserId ?? null, calculated_at: new Date().toISOString() }).select('*').single()); }
  private async caseRows(user: RequestUser, query: Row, scope: Row) { let request: any = this.db.from('executive_risk_cases').select('*', { count: 'exact' }).eq('company_id', user.tenantId).order(this.sort(query.sort, ['first_detected_at', 'updated_at', 'prioritization_score']), { ascending: this.direction(query.sort) }); if (scope.siteId) request = request.eq('site_id', scope.siteId); if (scope.unitId) request = request.eq('unit_id', scope.unitId); if (query.status) request = request.eq('case_status', query.status); if (query.priority) request = request.eq('executive_priority', query.priority); if (query.module) request = request.eq('source_module', query.module); if (query.ownerId) request = request.eq('executive_owner_user_id', query.ownerId); if (query.view === 'unacknowledged') request = request.eq('acknowledgment_status', 'Unacknowledged'); if (query.view === 'awaiting-verification') request = request.gt('pending_verification_count', 0); if (query.view === 'critical') request = request.eq('executive_priority', 'Critical'); const page = this.page(query); const { data, count, error } = await request.range(page.offset, page.offset + page.limit - 1); if (error) throw new BadRequestException('Critical risk records are unavailable. Apply the Phase 5 migration.'); return { rows: (data ?? []).map((item: Row) => this.presentCase(user, item)), total: count ?? 0, ...page }; }
  private async overdueRows(user: RequestUser, query: Row, scope: Row) { let request: any = this.db.from('executive_overdue_action_snapshots').select('*', { count: 'exact' }).eq('company_id', user.tenantId).order('calculated_at', { ascending: false }); if (scope.siteId) request = request.eq('site_id', scope.siteId); if (scope.unitId) request = request.eq('unit_id', scope.unitId); if (query.ownerId) request = request.eq('owner_user_id', query.ownerId); const page = this.page(query); const { data, count, error } = await request.range(page.offset, page.offset + page.limit - 1); if (error) throw new BadRequestException('Overdue action records are unavailable. Apply the Phase 5 migration.'); return { rows: (data ?? []).map((row: Row) => ({ ...row, action_title: row.action_code ?? row.universal_action_id, action_owner_user_id: row.owner_user_id, due_at: row.effective_due_at, source_module: Array.isArray(row.source_modules_json) ? row.source_modules_json.join(', ') : 'Action' })), total: count ?? 0, ...page }; }
  private async escalationRows(user: RequestUser, query: Row, scope: Row) { let request: any = this.db.from('executive_escalations').select('*', { count: 'exact' }).eq('company_id', user.tenantId).order('created_at', { ascending: false }); if (scope.siteId) request = request.eq('site_id', scope.siteId); if (query.status) request = request.eq('escalation_status', query.status); if (query.view === 'my-escalations') request = request.eq('escalated_to_user_id', user.id); if (query.view === 'unacknowledged') request = request.is('acknowledged_at', null); const page = this.page(query); const { data, count, error } = await request.range(page.offset, page.offset + page.limit - 1); if (error) throw new BadRequestException('Executive escalation records are unavailable. Apply the Phase 5 migration.'); return { rows: (data ?? []).map((row: Row) => ({ ...row, recipient_user_id: row.escalated_to_user_id, due_at: row.response_due_at })), total: count ?? 0, ...page }; }
  private async case(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('executive_risk_cases').select('*').eq('company_id', user.tenantId).eq('id', id).maybeSingle()); if (!row) throw new NotFoundException('Critical risk case was not found.'); this.aggregation.scope(user, { siteId: row.site_id }); return row; }
  private async escalation(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('executive_escalations').select('*').eq('company_id', user.tenantId).eq('id', id).maybeSingle()); if (!row) throw new NotFoundException('Executive escalation was not found.'); this.aggregation.scope(user, { siteId: row.site_id }); return row; }
  private async event(user: RequestUser, escalation: Row, type: string, detail?: string | null) { await this.db.single(this.db.from('executive_escalation_events').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: escalation.site_id, escalation_id: escalation.id, event_type: type, event_title: type, event_description: detail ?? null, actor_user_id: user.id, created_at: new Date().toISOString() }).select('id').single()); }
  private async notify(userId: string, actor: RequestUser, siteId: string | null, type: string, title: string, relatedRecordId: string, priority: string) { await this.notifications.notifyUser({ tenantId: actor.tenantId, companyId: actor.tenantId, userId, siteId, type, module: 'executive', title, message: title, relatedRecordId, relatedRecordType: 'ExecutiveCriticalRisk', relatedUrl: `/executive/critical-risks/${relatedRecordId}`, priority }).catch(() => null); }
  private async history(user: RequestUser, eventType: string, title: string, entityId: string, after: Row | null) { await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: eventType, entityType: 'ExecutiveCriticalRisk', entityId, after, metadata: { sourceModule: 'Executive KPI Dashboard Phase 5' } }).catch(() => null); await this.db.single(this.db.from('executive_risk_history_events').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: user.selectedSiteId ?? null, event_type: eventType, event_title: title, source_module: 'Executive KPI Dashboard', source_record_id: entityId, actor_user_id: user.id, after_value_json: after, created_at: new Date().toISOString() }).select('id').single()).catch(() => null); }
  private async historyRows(user: RequestUser, id: string) { return this.db.many<Row>(this.db.from('executive_risk_history_events').select('*').eq('company_id', user.tenantId).or(`source_record_id.eq.${id},risk_case_id.eq.${id}`).order('created_at', { ascending: false })); }
  private presentCase(user: RequestUser, row: Row) { return { ...row, risk_title: row.case_title, risk_priority: row.executive_priority, acknowledged_at: row.acknowledgment_status === 'Acknowledged' ? row.updated_at : null, source_due_at: null, source_drilldown_route: null }; }
  private priority(value: unknown) { return /critical|safety-critical/i.test(String(value ?? '')) ? 'Critical' : 'High'; }
  private resolved(status: unknown) { return /closed|resolved|cancelled|superseded/i.test(String(status ?? '')); }
  private page(query: Row) { const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100); return { limit, offset: Math.max(Number(query.offset ?? (Number(query.page ?? 1) - 1) * limit), 0) }; }
  private sort(sort: unknown, allowed: string[]) { const value = String(sort ?? 'updated_at.desc').split('.')[0] ?? 'updated_at'; return allowed.includes(value) ? value : 'updated_at'; }
  private direction(sort: unknown) { return !String(sort ?? '').endsWith('.asc'); }
  private can(user: RequestUser, permission: string) { return Boolean(user.isCompanyAdmin || user.isSuperAdmin || user.permissions.includes(permission)); }
  private require(user: RequestUser, permission: string) { if (!this.can(user, permission)) throw new ForbiddenException(`Missing required permission: ${permission}`); }
}
