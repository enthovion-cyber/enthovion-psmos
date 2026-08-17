import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

const parameterTypes = ['Temperature', 'Pressure', 'Flow', 'Level', 'pH', 'Composition', 'Concentration', 'Inventory', 'Weight', 'Density', 'Viscosity', 'Agitation speed', 'Residence time', 'Reaction time', 'Addition rate', 'Feed ratio', 'Oxygen content', 'Moisture content', 'Utility pressure', 'Utility flow', 'Cooling duty', 'Heating duty', 'Electrical load', 'Vibration', 'Speed / RPM', 'Other'];
const limitScopes = ['Unit-level', 'Equipment-level', 'Process step', 'Startup', 'Normal operation', 'Shutdown', 'Emergency operation', 'Batch operation', 'Cleaning / flushing', 'Storage'];
const operatingModes = ['Startup', 'Normal operation', 'Shutdown', 'Emergency operation', 'Batch operation', 'Cleaning / flushing', 'Storage', 'Maintenance', 'Other'];
const limitCriticalities = ['Low', 'Medium', 'High', 'Critical'];
const deviationDirections = ['High', 'Low', 'High-high', 'Low-low', 'No flow', 'Reverse flow', 'Wrong composition', 'Wrong ratio', 'Fast addition', 'Slow addition', 'Other'];
const consequenceSeverities = ['Minor', 'Moderate', 'Major', 'Severe', 'Catastrophic'];
const solControlTypes = ['Alarm', 'Critical alarm', 'Interlock', 'SIF/SIS', 'PSV/relief device', 'Control loop', 'Procedure/SOP', 'Operator monitoring', 'Analyzer', 'Mechanical protection', 'Inerting system', 'Cooling system', 'Emergency shutdown', 'Fire/gas detection', 'Vent/scrubber', 'PTW/LOTO control', 'Training/competency', 'Other'];
const conflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];

@Injectable()
export class PsiSafeOperatingLimitService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalSafeOperatingLimits: rows.length,
      criticalLimits: count((r) => r.criticality === 'Critical'),
      safetyCriticalLimits: count((r) => r.safety_critical),
      unitLevelLimits: count((r) => r.limit_scope === 'Unit-level'),
      equipmentLevelLimits: count((r) => Boolean(r.equipment_id) || r.limit_scope === 'Equipment-level'),
      missingCriticalLimits: count((r) => r.completeness_status === 'Critical Gaps'),
      limitsWithMissingConsequences: count((r) => r.missingConsequence),
      limitsWithMissingOperatorResponse: count((r) => r.missingOperatorResponse),
      limitsWithMissingSafeguards: count((r) => r.missingSafeguard),
      limitsWithConflicts: count((r) => ['Warning', 'Major Conflict', 'Critical Conflict'].includes(r.conflict_status)),
      limitsPendingApproval: count((r) => ['Submitted', 'Pending Approval', 'In Review'].includes(r.review_status)),
      limitsReviewOverdue: count((r) => this.isReviewOverdue(r)),
      limitsRequiringMoc: count((r) => r.moc_update_required),
      limitsLinkedToHazop: count((r) => r.linkedHazopCount > 0),
      limitsLinkedToSisInterlockAlarm: count((r) => r.linkedControlCount > 0),
      limitsLinkedToMiEquipment: count((r) => Boolean(r.equipment_id)),
      pssrBlockers: count((r) => r.pssr_blocker),
      lastUpdated: new Date().toISOString()
    };
  }

  async registry(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const rows = await this.registryRows(tenantId, scope, query, true, page, limit);
    const all = await this.registryRows(tenantId, scope, query, false);
    return {
      rows,
      page,
      limit,
      total: all.length,
      summary: await this.summary(tenantId, scope, query),
      savedViews: ['All Limits', 'Critical Limits', 'Safety-Critical Limits', 'Missing Limits', 'Conflicts', 'Review Overdue', 'Pending Approval', 'MOC Required', 'PSSR Blockers', 'Missing Operator Response', 'Missing Safeguards', 'My Unit Limits'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitLimits(tenantId: string, scope: Scope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async equipmentLimits(tenantId: string, scope: Scope, equipmentId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, equipmentId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? ''));
    this.validateIdentity(dto, false);
    const payload = this.identityPayload(tenantId, actorId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const limit = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limits').insert(payload).select().single()), 'Unable to create safe operating limit.');
    await this.upsertValues(tenantId, actorId, scope, limit.id, dto, false);
    await this.seedChildCollections(tenantId, actorId, scope, limit, dto);
    await this.runConflictCheck(tenantId, actorId, scope, limit.id);
    await this.runCompleteness(tenantId, actorId, scope, limit.id);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.created', limit, null, limit, 'Safe operating limit created', `${limit.limit_title} created.`);
    return this.detail(tenantId, scope, limit.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, limitId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.safe_limit.approve')) throw new ForbiddenException('Approved safe operating limits are read-only unless controlled edit/MOC workflow is available.');
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? before.unit_id));
    this.validateIdentity({ ...before, ...dto }, true);
    const safetyKeys = ['normal_min', 'normal_max', 'normal_target', 'low_alarm', 'high_alarm', 'low_trip', 'high_trip', 'sif_interlock_setpoint', 'min_design_limit', 'max_design_limit', 'min_safe_limit', 'max_safe_limit', 'criticality', 'safety_critical', 'psm_critical'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const patch: Row = this.identityPayload(tenantId, actorId, unit, dto, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete patch.created_by;
    delete patch.created_at;
    const limit = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limits').update(patch).eq('company_id', tenantId).eq('id', limitId).select().single()), 'Unable to update safe operating limit.');
    if (this.hasValueFields(dto)) await this.upsertValues(tenantId, actorId, scope, limitId, dto, true);
    await this.runConflictCheck(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.updated', limit, before, limit, 'Safe operating limit updated', safetyChanged ? 'Safety-sensitive SOL change may require MOC.' : 'Safe operating limit updated.');
    return this.detail(tenantId, scope, limitId);
  }

  async detail(tenantId: string, scope: Scope, limitId: string) {
    const limit = await this.record(tenantId, scope, limitId, true);
    const [unit, values, consequences, operatorResponses, controls, documents, conflicts, completeness, history] = await Promise.all([
      this.unitRecord(tenantId, scope, limit.unit_id),
      this.values(tenantId, scope, limitId),
      this.consequences(tenantId, scope, limitId),
      this.operatorResponses(tenantId, scope, limitId),
      this.controls(tenantId, scope, limitId),
      this.documents(tenantId, scope, limitId),
      this.conflicts(tenantId, scope, limitId),
      this.completeness(tenantId, scope, limitId),
      this.history(tenantId, scope, limitId)
    ]);
    return {
      limit,
      unit,
      values,
      consequences,
      operatorResponses,
      controls,
      documents,
      conflicts,
      completeness,
      history,
      overview: this.overview(limit, values, consequences, operatorResponses, controls, conflicts, completeness),
      tabs: this.tabs(limitId),
      actions: this.actions(limit, conflicts, completeness)
    };
  }

  async clone(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row) {
    const detail = await this.detail(tenantId, scope, limitId);
    const source = detail.limit;
    return this.create(tenantId, actorId, scope, {
      ...source,
      ...detail.values,
      limit_title: dto.limit_title ?? `${source.limit_title} (Clone)`,
      parameter_tag: dto.parameter_tag ?? null,
      status: 'Draft',
      review_status: 'Not Reviewed',
      archived_at: null,
      archived_by: null
    });
  }

  async archive(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row) {
    const before = await this.record(tenantId, scope, limitId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limits').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select().single()), 'Unable to archive safe operating limit.');
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.archived', row, before, row, 'Safe operating limit archived', dto.reason);
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row) {
    const before = await this.record(tenantId, scope, limitId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limits').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Draft', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select().single()), 'Unable to reactivate safe operating limit.');
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.reactivated', row, before, row, 'Safe operating limit reactivated', dto.reason ?? 'Safe operating limit reactivated.');
    return row;
  }

  async values(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeSingle<Row>(this.db.from('psi_safe_operating_limit_values').select('*').eq('company_id', tenantId).eq('limit_id', limitId).maybeSingle());
  }

  async upsertValues(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row, writeEvent = true) {
    const limit = await this.record(tenantId, scope, limitId);
    const before = await this.values(tenantId, scope, limitId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limit_values').upsert(this.valuesPayload(tenantId, limit, dto), { onConflict: 'company_id,limit_id' }).select().single()), 'Unable to save limit values.');
    await this.runConflictCheck(tenantId, actorId, scope, limitId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safe_limit.values.updated', limit, before, row, 'Limit values updated', 'Normal, alarm, trip, design, or safe boundaries updated.');
    return row;
  }

  async consequences(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_deviation_consequences').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('created_at'));
  }

  async saveConsequence(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row, consequenceId?: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const before = consequenceId ? await this.safeSingle<Row>(this.db.from('psi_limit_deviation_consequences').select('*').eq('company_id', tenantId).eq('limit_id', limitId).eq('id', consequenceId).single()) : null;
    const payload = this.consequencePayload(tenantId, actorId, limit, dto);
    const row = consequenceId
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_deviation_consequences').update(payload).eq('company_id', tenantId).eq('id', consequenceId).select().single()), 'Unable to update consequence.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_deviation_consequences').insert(payload).select().single()), 'Unable to create consequence.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, consequenceId ? 'psi.safe_limit.consequence.updated' : 'psi.safe_limit.consequence.created', limit, before, row, consequenceId ? 'Deviation consequence updated' : 'Deviation consequence created', `${row.deviation_direction}: ${row.severity}.`);
    return this.consequences(tenantId, scope, limitId);
  }

  async removeConsequence(tenantId: string, actorId: string, scope: Scope, limitId: string, consequenceId: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const row = await this.safeSingle<Row>(this.db.from('psi_limit_deviation_consequences').delete().eq('company_id', tenantId).eq('limit_id', limitId).eq('id', consequenceId).select().single());
    if (!row) throw new NotFoundException('Deviation consequence not found.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.consequence.removed', limit, row, null, 'Deviation consequence removed', row.deviation_direction);
    return this.consequences(tenantId, scope, limitId);
  }

  async operatorResponses(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_operator_responses').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('created_at'));
  }

  async saveOperatorResponse(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row, responseId?: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const before = responseId ? await this.safeSingle<Row>(this.db.from('psi_limit_operator_responses').select('*').eq('company_id', tenantId).eq('limit_id', limitId).eq('id', responseId).single()) : null;
    const payload = this.operatorResponsePayload(tenantId, actorId, limit, dto);
    const row = responseId
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_operator_responses').update(payload).eq('company_id', tenantId).eq('id', responseId).select().single()), 'Unable to update operator response.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_operator_responses').insert(payload).select().single()), 'Unable to create operator response.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, responseId ? 'psi.safe_limit.operator_response.updated' : 'psi.safe_limit.operator_response.created', limit, before, row, responseId ? 'Operator response updated' : 'Operator response created', row.required_operator_action);
    return this.operatorResponses(tenantId, scope, limitId);
  }

  async removeOperatorResponse(tenantId: string, actorId: string, scope: Scope, limitId: string, responseId: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const row = await this.safeSingle<Row>(this.db.from('psi_limit_operator_responses').delete().eq('company_id', tenantId).eq('limit_id', limitId).eq('id', responseId).select().single());
    if (!row) throw new NotFoundException('Operator response not found.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.operator_response.removed', limit, row, null, 'Operator response removed', row.required_operator_action);
    return this.operatorResponses(tenantId, scope, limitId);
  }

  async controls(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_controls_safeguards').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('created_at'));
  }

  async saveControl(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row, controlId?: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const before = controlId ? await this.safeSingle<Row>(this.db.from('psi_limit_controls_safeguards').select('*').eq('company_id', tenantId).eq('limit_id', limitId).eq('id', controlId).single()) : null;
    const payload = this.controlPayload(tenantId, actorId, limit, dto);
    const row = controlId
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_controls_safeguards').update(payload).eq('company_id', tenantId).eq('id', controlId).select().single()), 'Unable to update control/safeguard.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_controls_safeguards').insert(payload).select().single()), 'Unable to link control/safeguard.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, controlId ? 'psi.safe_limit.control.updated' : 'psi.safe_limit.control.created', limit, before, row, controlId ? 'Control/safeguard updated' : 'Control/safeguard linked', row.control_description);
    return this.controls(tenantId, scope, limitId);
  }

  async removeControl(tenantId: string, actorId: string, scope: Scope, limitId: string, controlId: string) {
    const limit = await this.record(tenantId, scope, limitId);
    const row = await this.safeSingle<Row>(this.db.from('psi_limit_controls_safeguards').delete().eq('company_id', tenantId).eq('limit_id', limitId).eq('id', controlId).select().single());
    if (!row) throw new NotFoundException('Control/safeguard not found.');
    await this.markSafetyChanged(tenantId, actorId, scope, limitId);
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.control.removed', limit, row, null, 'Control/safeguard removed', row.control_description);
    return this.controls(tenantId, scope, limitId);
  }

  async documents(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_document_links').select('*').eq('company_id', tenantId).eq('limit_id', limitId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row) {
    const limit = await this.record(tenantId, scope, limitId);
    if (!(dto.document_id ?? dto.documentId)) throw new BadRequestException('Document Control document is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_document_links').insert({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limitId, document_id: dto.document_id ?? dto.documentId, document_type: dto.document_type ?? dto.documentType ?? 'Safe operating limit register', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference', required: Boolean(dto.required), readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), linked_by: actorId }).select().single()), 'Unable to link document.');
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.document.linked', limit, null, row, 'Document linked', row.document_type);
    return this.documents(tenantId, scope, limitId);
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, limitId: string, documentLinkId: string, dto: Row) {
    const limit = await this.record(tenantId, scope, limitId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('limit_id', limitId).eq('id', documentLinkId).select().single()), 'Unable to unlink document.');
    await this.runCompleteness(tenantId, actorId, scope, limitId);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.document.unlinked', limit, row, null, 'Document unlinked', dto.reason ?? row.document_type);
    return this.documents(tenantId, scope, limitId);
  }

  async conflicts(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_conflict_results').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('severity').order('created_at'));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, limitId: string) {
    const limit = await this.record(tenantId, scope, limitId, true);
    const values = await this.values(tenantId, scope, limitId);
    await this.db.many(this.db.from('psi_limit_conflict_results').delete().eq('company_id', tenantId).eq('limit_id', limitId).select('id')).catch(() => null);
    const results: Row[] = [];
    const push = (type: string, condition: boolean, status: string, severity: string, message: string, current: Row = {}) => { if (condition) results.push({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limitId, conflict_type: type, conflict_status: status, severity, message, current_value_json: current, override_required: ['Major Conflict', 'Critical Conflict'].includes(status) }); };
    if (!values) {
      push('Missing values', true, 'Warning', 'High', 'Limit values are missing.', {});
    } else {
      push('High alarm above max safe', this.num(values.high_alarm) !== null && this.num(values.max_safe_limit) !== null && this.num(values.high_alarm)! > this.num(values.max_safe_limit)!, 'Major Conflict', 'High', 'High alarm cannot exceed maximum safe limit without approved override.', { high_alarm: values.high_alarm, max_safe_limit: values.max_safe_limit });
      push('High trip above max design', this.num(values.high_trip) !== null && this.num(values.max_design_limit) !== null && this.num(values.high_trip)! > this.num(values.max_design_limit)!, 'Critical Conflict', 'Critical', 'High trip cannot exceed maximum design limit without approved override.', { high_trip: values.high_trip, max_design_limit: values.max_design_limit });
      push('Low alarm below min safe', this.num(values.low_alarm) !== null && this.num(values.min_safe_limit) !== null && this.num(values.low_alarm)! < this.num(values.min_safe_limit)!, 'Major Conflict', 'High', 'Low alarm cannot be below minimum safe limit without approved override.', { low_alarm: values.low_alarm, min_safe_limit: values.min_safe_limit });
      push('Normal max above high alarm', this.num(values.normal_max) !== null && this.num(values.high_alarm) !== null && this.num(values.normal_max)! > this.num(values.high_alarm)!, 'Warning', 'Medium', 'Normal maximum is above high alarm.', { normal_max: values.normal_max, high_alarm: values.high_alarm });
      push('Normal min below low alarm', this.num(values.normal_min) !== null && this.num(values.low_alarm) !== null && this.num(values.normal_min)! < this.num(values.low_alarm)!, 'Warning', 'Medium', 'Normal minimum is below low alarm.', { normal_min: values.normal_min, low_alarm: values.low_alarm });
      push('Trip outside design boundary', this.num(values.sif_interlock_setpoint) !== null && ((this.num(values.min_design_limit) !== null && this.num(values.sif_interlock_setpoint)! < this.num(values.min_design_limit)!) || (this.num(values.max_design_limit) !== null && this.num(values.sif_interlock_setpoint)! > this.num(values.max_design_limit)!)), 'Critical Conflict', 'Critical', 'SIF/interlock setpoint is outside design boundary.', { sif_interlock_setpoint: values.sif_interlock_setpoint, min_design_limit: values.min_design_limit, max_design_limit: values.max_design_limit });
    }
    if (!results.length) results.push({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limitId, conflict_type: 'Range validation', conflict_status: 'No Conflict', severity: 'Low', message: 'No range conflicts detected.', override_required: false });
    await Promise.all(results.map((row) => this.db.single(this.db.from('psi_limit_conflict_results').insert(row).select('id').single()).catch(() => null)));
    const worst = this.worstConflict(results);
    await this.db.single(this.db.from('psi_safe_operating_limits').update({ conflict_status: worst, pssr_blocker: worst === 'Critical Conflict' ? true : limit.pssr_blocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.conflict_check.run', limit, null, { conflict_status: worst, results }, 'Safe operating limit conflict check run', worst);
    return this.conflicts(tenantId, scope, limitId);
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, limitId: string, conflictId: string, dto: Row) {
    const limit = await this.record(tenantId, scope, limitId);
    if (!dto.reason) throw new BadRequestException('Conflict override requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_limit_conflict_results').update({ conflict_status: 'Override Approved', override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('limit_id', limitId).eq('id', conflictId).select().single()), 'Unable to override conflict.');
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.conflict.override', limit, null, row, 'Conflict override approved', dto.reason);
    return this.runConflictCheck(tenantId, actorId, scope, limitId);
  }

  async completeness(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_completeness_evaluations').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('severity').order('check_title'));
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, limitId: string) {
    const limit = await this.record(tenantId, scope, limitId, true);
    const [values, consequences, operatorResponses, controls, documents, conflicts] = await Promise.all([
      this.values(tenantId, scope, limitId),
      this.consequences(tenantId, scope, limitId),
      this.operatorResponses(tenantId, scope, limitId),
      this.controls(tenantId, scope, limitId),
      this.documents(tenantId, scope, limitId),
      this.conflicts(tenantId, scope, limitId)
    ]);
    const critical = limit.criticality === 'Critical' || limit.safety_critical || limit.psm_critical;
    const severe = consequences.some((row) => ['Severe', 'Catastrophic'].includes(row.severity));
    const highConflict = conflicts.some((row) => ['Major Conflict', 'Critical Conflict'].includes(row.conflict_status) && !row.override_approved);
    const checks = [
      this.check('unit', 'Unit selected', Boolean(limit.unit_id), 'Critical'),
      this.check('parameter_name', 'Parameter name exists', Boolean(limit.parameter_name), 'Critical'),
      this.check('unit_of_measure', 'Unit of measure exists', Boolean(limit.unit_of_measure), 'Critical'),
      this.check('normal_range', 'Normal range or target defined', Boolean(values && (values.normal_min !== null || values.normal_max !== null || values.normal_target !== null)), 'High'),
      this.check('safe_design_boundary', 'Safe/design boundary defined for critical limit', !critical || Boolean(values && (values.min_safe_limit !== null || values.max_safe_limit !== null || values.min_design_limit !== null || values.max_design_limit !== null)), 'Critical'),
      this.check('consequence', 'Consequence of deviation documented', !critical || consequences.length > 0, 'Critical'),
      this.check('operator_response', 'Operator response documented', !critical || operatorResponses.length > 0, 'Critical'),
      this.check('safeguard', 'Safeguard/control linked for severe or catastrophic consequence', !severe || controls.length > 0, 'Critical'),
      this.check('document', 'Source/basis document linked where required', documents.some((d) => d.required) || !critical, 'Medium'),
      this.check('owner', 'Owner assigned', Boolean(limit.owner_user_id), 'Medium'),
      this.check('review_date', 'Review date exists', Boolean(limit.last_review_date || limit.next_review_due), 'Medium'),
      this.check('review_not_overdue', 'Review not overdue', !this.isReviewOverdue(limit), 'High'),
      this.check('conflicts', 'Limit values do not conflict', !highConflict, highConflict ? 'Critical' : 'High'),
      this.check('process_chemistry', 'Related process chemistry exists where configured', !critical || Boolean(limit.related_process_chemistry_id), 'Medium')
    ];
    await this.db.many(this.db.from('psi_limit_completeness_evaluations').delete().eq('company_id', tenantId).eq('limit_id', limitId).select('id')).catch(() => null);
    let complete = 0;
    let criticalGaps = 0;
    for (const item of checks) {
      if (item.complete) complete += 1;
      if (!item.complete && item.severity === 'Critical') criticalGaps += 1;
      await this.db.single(this.db.from('psi_limit_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limitId, unit_id: limit.unit_id, check_key: item.key, check_title: item.title, status: item.complete ? 'Complete' : 'Missing', severity: item.severity, message: item.complete ? 'Complete' : item.message, missing_reason: item.complete ? null : item.message, pssr_blocker: !item.complete && item.severity === 'Critical', action_required: !item.complete, owner_user_id: limit.owner_user_id ?? null, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,limit_id,check_key' }).select('id').single()).catch(() => null);
    }
    const score = Math.round((complete / checks.length) * 100);
    const status = criticalGaps ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 70 ? 'Mostly Complete' : 'Incomplete';
    const pssr = criticalGaps > 0 || conflicts.some((c) => c.conflict_status === 'Critical Conflict');
    await this.db.single(this.db.from('psi_safe_operating_limits').update({ completeness_score: score, completeness_status: status, pssr_blocker: pssr, moc_update_required: limit.moc_update_required || critical, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select('id').single()).catch(() => null);
    await this.upsertUnitCompleteness(tenantId, limit, status, criticalGaps, pssr);
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.completeness.run', limit, null, { score, status, criticalGaps }, 'Safe operating limit completeness checked', `${status} (${score}%).`);
    return this.completeness(tenantId, scope, limitId);
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, limitId: string, dto: Row) {
    const before = await this.record(tenantId, scope, limitId);
    const conflicts = await this.conflicts(tenantId, scope, limitId);
    if (conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved)) throw new BadRequestException('Critical conflicts block review submission unless an override is approved.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safe_operating_limits').update({ review_status: 'Submitted', status: 'Under Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select().single()), 'Unable to submit review.');
    await this.writeHistory(tenantId, actorId, 'psi.safe_limit.review.submitted', row, before, row, 'Safe operating limit submitted for review', dto.reason ?? 'Review requested.');
    return row;
  }

  async history(tenantId: string, scope: Scope, limitId: string) {
    await this.record(tenantId, scope, limitId, true);
    return this.safeMany<Row>(this.db.from('psi_limit_history_events').select('*').eq('company_id', tenantId).eq('limit_id', limitId).order('created_at', { ascending: false }).limit(100));
  }

  importTemplate() {
    return { supportedFormats: ['.xlsx', '.csv'], columns: ['unit_code', 'equipment_tag', 'limit_title', 'parameter_name', 'parameter_tag', 'parameter_type', 'unit_of_measure', 'normal_min', 'normal_max', 'normal_target', 'low_alarm', 'high_alarm', 'low_low_alarm', 'high_high_alarm', 'low_trip', 'high_trip', 'max_design_limit', 'min_design_limit', 'max_safe_limit', 'min_safe_limit', 'consequence_high', 'consequence_low', 'operator_response_high', 'operator_response_low', 'safeguard', 'criticality', 'safety_critical', 'owner_email', 'source_document_reference'] };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: [!row.unit_code && !row.unitId ? 'unit_code is required.' : null, !row.limit_title && !row.limitTitle ? 'limit_title is required.' : null, !row.parameter_name && !row.parameterName ? 'parameter_name is required.' : null, !row.unit_of_measure && !row.unitOfMeasure ? 'unit_of_measure is required.' : null, !row.criticality ? 'criticality is required.' : null].filter(Boolean), warnings: [!row.normal_min && !row.normal_max && !row.normal_target ? 'Normal range or target is missing.' : null, !row.consequence_high && !row.consequence_low ? 'Deviation consequences are missing.' : null, !row.safeguard ? 'Safeguard/control is missing.' : null].filter(Boolean) }));
    return this.db.single<Row>(this.db.from('psi_limit_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'safe-operating-limits-import.csv', file_key: dto.fileKey ?? null, status: preview.some((r: Row) => r.errors.length) ? 'Errors' : 'Preview Ready', total_rows: preview.length, valid_rows: preview.filter((r: Row) => !r.errors.length).length, error_rows: preview.filter((r: Row) => r.errors.length).length, preview_json: preview }).select().single());
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows[0]) await this.writeHistory(tenantId, actorId, 'psi.safe_limit.exported', rows[0], null, { count: rows.length, query }, 'Safe operating limits exported', `${rows.length} rows exported.`);
    return { rows, format: query.format ?? 'json', generatedAt: new Date().toISOString() };
  }

  lookups(kind: string) {
    const map: Record<string, string[]> = { 'parameter-types': parameterTypes, 'limit-scopes': limitScopes, 'operating-modes': operatingModes, 'limit-criticalities': limitCriticalities, 'deviation-directions': deviationDirections, 'consequence-severities': consequenceSeverities, 'sol-control-types': solControlTypes, 'conflict-statuses': conflictStatuses };
    return map[kind] ?? [];
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row, paginated: boolean, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_safe_operating_limits').select('*, psi_safe_operating_limit_values(*), psi_limit_deviation_consequences(id,severity,related_hazop_deviation_id), psi_limit_operator_responses(id), psi_limit_controls_safeguards(id,control_type), psi_limit_document_links(id,removed_at)').eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.unitId || query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.equipmentId || query.equipment_id) request = request.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.search) request = request.or(`limit_title.ilike.%${query.search}%,parameter_name.ilike.%${query.search}%,parameter_tag.ilike.%${query.search}%`);
    if (query.parameterType) request = request.eq('parameter_type', query.parameterType);
    if (query.limitScope) request = request.eq('limit_scope', query.limitScope);
    if (query.criticality) request = request.eq('criticality', query.criticality);
    if (query.status) request = request.eq('status', query.status);
    if (query.reviewStatus) request = request.eq('review_status', query.reviewStatus);
    if (query.completenessStatus) request = request.eq('completeness_status', query.completenessStatus);
    if (query.conflictStatus) request = request.eq('conflict_status', query.conflictStatus);
    if (query.safetyCritical === 'true') request = request.eq('safety_critical', true);
    if (query.psmCritical === 'true') request = request.eq('psm_critical', true);
    if (query.mocRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true') request = request.eq('pssr_blocker', true);
    if (query.critical === 'true') request = request.eq('criticality', 'Critical');
    if (query.missing === 'true') request = request.in('completeness_status', ['Incomplete', 'Critical Gaps', 'Not Reviewed']);
    if (query.reviewOverdue === 'true') request = request.lt('next_review_due', new Date().toISOString().slice(0, 10));
    if (query.conflicts === 'true') request = request.in('conflict_status', ['Warning', 'Major Conflict', 'Critical Conflict']);
    const [column, direction] = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(column ?? 'updated_at'), { ascending: direction !== 'desc' });
    if (paginated) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return rows.map((row) => this.normalizeRegistryRow(row)).filter((row) => {
      if (query.missingConsequence === 'true' && !row.missingConsequence) return false;
      if (query.missingOperatorResponse === 'true' && !row.missingOperatorResponse) return false;
      if (query.missingSafeguard === 'true' && !row.missingSafeguard) return false;
      return true;
    });
  }

  private normalizeRegistryRow(row: Row) {
    const values = Array.isArray(row.psi_safe_operating_limit_values) ? row.psi_safe_operating_limit_values[0] : row.psi_safe_operating_limit_values;
    const consequences = Array.isArray(row.psi_limit_deviation_consequences) ? row.psi_limit_deviation_consequences : [];
    const operatorResponses = Array.isArray(row.psi_limit_operator_responses) ? row.psi_limit_operator_responses : [];
    const controls = Array.isArray(row.psi_limit_controls_safeguards) ? row.psi_limit_controls_safeguards : [];
    const documents = Array.isArray(row.psi_limit_document_links) ? row.psi_limit_document_links.filter((d: Row) => !d.removed_at) : [];
    const severe = consequences.some((c: Row) => ['Severe', 'Catastrophic'].includes(c.severity));
    const critical = row.criticality === 'Critical' || row.safety_critical || row.psm_critical;
    return {
      ...row,
      values,
      consequences,
      operatorResponses,
      controls,
      documents,
      missingConsequence: critical && consequences.length === 0,
      missingOperatorResponse: critical && operatorResponses.length === 0,
      missingSafeguard: severe && controls.length === 0,
      linkedHazopCount: consequences.filter((c: Row) => c.related_hazop_deviation_id).length,
      linkedControlCount: controls.filter((c: Row) => /alarm|interlock|sif|sis/i.test(c.control_type)).length,
      activeDocumentCount: documents.length
    };
  }

  private validateIdentity(dto: Row, partial: boolean) {
    if (!partial || dto.limit_title !== undefined || dto.limitTitle !== undefined) this.requireText(dto.limit_title ?? dto.limitTitle, 'Limit title is required.');
    if (!partial || dto.parameter_name !== undefined || dto.parameterName !== undefined) this.requireText(dto.parameter_name ?? dto.parameterName, 'Parameter name is required.');
    if (!partial || dto.parameter_type !== undefined || dto.parameterType !== undefined) this.requireText(dto.parameter_type ?? dto.parameterType, 'Parameter type is required.');
    if (!partial || dto.unit_of_measure !== undefined || dto.unitOfMeasure !== undefined) this.requireText(dto.unit_of_measure ?? dto.unitOfMeasure, 'Unit of measure is required.');
    if (!partial || dto.criticality !== undefined) this.requireText(dto.criticality, 'Criticality is required.');
  }

  private identityPayload(tenantId: string, actorId: string, unit: Row, dto: Row, extras: Row) {
    return this.clean({ company_id: tenantId, site_id: unit.site_id, unit_id: unit.id, area_id: dto.area_id ?? dto.areaId ?? unit.area_id ?? null, equipment_id: dto.equipment_id ?? dto.equipmentId ?? null, limit_title: dto.limit_title ?? dto.limitTitle, system_service: dto.system_service ?? dto.systemService ?? null, parameter_name: dto.parameter_name ?? dto.parameterName, parameter_tag: dto.parameter_tag ?? dto.parameterTag ?? null, parameter_type: dto.parameter_type ?? dto.parameterType ?? 'Other', limit_scope: dto.limit_scope ?? dto.limitScope ?? 'Unit-level', criticality: dto.criticality ?? 'Medium', safety_critical: Boolean(dto.safety_critical ?? dto.safetyCritical), psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical), operating_mode: dto.operating_mode ?? dto.operatingMode ?? null, status: dto.status ?? 'Draft', parameter_description: dto.parameter_description ?? dto.parameterDescription ?? null, measurement_location: dto.measurement_location ?? dto.measurementLocation ?? null, instrument_tag: dto.instrument_tag ?? dto.instrumentTag ?? null, dcs_plc_tag: dto.dcs_plc_tag ?? dto.dcsPlcTag ?? null, analyzer_tag: dto.analyzer_tag ?? dto.analyzerTag ?? null, data_source: dto.data_source ?? dto.dataSource ?? null, unit_of_measure: dto.unit_of_measure ?? dto.unitOfMeasure, monitoring_frequency: dto.monitoring_frequency ?? dto.monitoringFrequency ?? null, controlled_variable: Boolean(dto.controlled_variable ?? dto.controlledVariable), manipulated_variable: dto.manipulated_variable ?? dto.manipulatedVariable ?? null, related_process_chemistry_id: dto.related_process_chemistry_id ?? dto.relatedProcessChemistryId ?? null, related_chemical_id: dto.related_chemical_id ?? dto.relatedChemicalId ?? null, related_equipment_design_basis_id: dto.related_equipment_design_basis_id ?? dto.relatedEquipmentDesignBasisId ?? null, related_relief_system_id: dto.related_relief_system_id ?? dto.relatedReliefSystemId ?? null, related_procedure_document_id: dto.related_procedure_document_id ?? dto.relatedProcedureDocumentId ?? null, related_drawing_document_id: dto.related_drawing_document_id ?? dto.relatedDrawingDocumentId ?? null, owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed', created_by: actorId, updated_by: actorId, ...extras });
  }

  private valuesPayload(tenantId: string, limit: Row, dto: Row) {
    const fields = ['normal_min','normal_max','normal_target','normal_range_basis','low_alert','high_alert','low_alarm','high_alarm','low_low_alarm','high_high_alarm','low_trip','high_trip','low_low_trip','high_high_trip','sif_interlock_setpoint','safe_state','trip_reset_requirement','min_design_limit','max_design_limit','min_safe_limit','max_safe_limit','mawp_mop_reference','design_temperature_reference','relief_set_pressure_reference','mechanical_limit_reference','environmental_compliance_limit_reference','basis_reference','source_document_id','engineering_calculation_reference','confidence_level','data_quality_status'];
    const row: Row = { id: dto.values_id ?? dto.valuesId ?? randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limit.id, unit_of_measure: dto.unit_of_measure ?? dto.unitOfMeasure ?? limit.unit_of_measure, updated_at: new Date().toISOString() };
    fields.forEach((field) => row[field] = dto[field] ?? dto[this.camel(field)] ?? null);
    return this.clean(row);
  }

  private consequencePayload(tenantId: string, actorId: string, limit: Row, dto: Row) {
    const fields = ['process_consequence','safety_consequence','environmental_consequence','quality_consequence','equipment_integrity_consequence','overpressure_consequence','reaction_hazard_consequence','toxic_release_consequence','fire_explosion_consequence','time_to_consequence','detectability','related_unwanted_reaction_scenario_id','related_hazop_deviation_id','notes'];
    const row: Row = { id: dto.id ?? randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limit.id, deviation_direction: dto.deviation_direction ?? dto.deviationDirection ?? 'High', deviation_description: dto.deviation_description ?? dto.deviationDescription ?? `${dto.deviation_direction ?? 'Deviation'} from safe operating limit`, severity: dto.severity ?? 'Moderate', created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() };
    fields.forEach((field) => row[field] = dto[field] ?? dto[this.camel(field)] ?? null);
    return this.clean(row);
  }

  private operatorResponsePayload(tenantId: string, actorId: string, limit: Row, dto: Row) {
    const fields = ['deviation_consequence_id','response_time_requirement','initial_action','follow_up_action','escalation_requirement','shutdown_requirement','emergency_response_requirement','required_notification','related_sop_document_id','related_emergency_procedure_id','required_ppe','training_requirement_foundation','notes'];
    const row: Row = { id: dto.id ?? randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limit.id, required_operator_action: dto.required_operator_action ?? dto.requiredOperatorAction, created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() };
    fields.forEach((field) => row[field] = dto[field] ?? dto[this.camel(field)] ?? null);
    return this.clean(row);
  }

  private controlPayload(tenantId: string, actorId: string, limit: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: limit.site_id, limit_id: limit.id, control_type: dto.control_type ?? dto.controlType ?? 'Alarm', linked_module: dto.linked_module ?? dto.linkedModule ?? null, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId ?? null, control_description: dto.control_description ?? dto.controlDescription, setpoint: dto.setpoint ?? null, safe_state: dto.safe_state ?? dto.safeState ?? null, required_response: dto.required_response ?? dto.requiredResponse ?? null, reliability_criticality: dto.reliability_criticality ?? dto.reliabilityCriticality ?? null, test_proof_inspection_requirement: dto.test_proof_inspection_requirement ?? dto.testProofInspectionRequirement ?? null, owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, notes: dto.notes ?? null, created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() });
  }

  private async seedChildCollections(tenantId: string, actorId: string, scope: Scope, limit: Row, dto: Row) {
    const consequenceRows = Array.isArray(dto.consequences) ? dto.consequences : [];
    const responseRows = Array.isArray(dto.operatorResponses) ? dto.operatorResponses : [];
    const controlRows = Array.isArray(dto.controls) ? dto.controls : [];
    const documentRows = Array.isArray(dto.documents) ? dto.documents : [];
    for (const row of consequenceRows) await this.saveConsequence(tenantId, actorId, scope, limit.id, row);
    for (const row of responseRows) await this.saveOperatorResponse(tenantId, actorId, scope, limit.id, row);
    for (const row of controlRows) await this.saveControl(tenantId, actorId, scope, limit.id, row);
    for (const row of documentRows) await this.linkDocument(tenantId, actorId, scope, limit.id, row);
  }

  private async markSafetyChanged(tenantId: string, actorId: string, scope: Scope, limitId: string) {
    void scope;
    await this.db.single(this.db.from('psi_safe_operating_limits').update({ moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', limitId).select('id').single()).catch(() => null);
  }

  private check(key: string, title: string, complete: boolean, severity: string) {
    return { key, title, complete, severity, message: `${title} is missing or incomplete.` };
  }

  private async upsertUnitCompleteness(tenantId: string, limit: Row, status: string, critical: number, pssr: boolean) {
    await this.db.single(this.db.from('psi_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, unit_id: limit.unit_id, category: 'Safe operating limits', requirement_name: `Safe operating limit - ${limit.parameter_name}`, status: status === 'Complete' ? 'Complete' : 'Missing', severity: critical ? 'Critical' : 'High', missing_reason: status === 'Complete' ? null : `Safe operating limit completeness is ${status}.`, linked_module: 'PSI Safe Operating Limits', linked_record_id: limit.id, readiness_impact: pssr ? 'PSSR blocker' : 'PSI completeness', pssr_blocker: pssr, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,unit_id,category,requirement_name' }).select('id').single()).catch(() => null);
  }

  private overview(limit: Row, values: Row | null, consequences: Row[], operatorResponses: Row[], controls: Row[], conflicts: Row[], completeness: Row[]) {
    return { cards: [
      { label: 'Parameter / tag', value: `${limit.parameter_name}${limit.parameter_tag ? ` / ${limit.parameter_tag}` : ''}`, tone: 'neutral' },
      { label: 'Unit / equipment', value: `${limit.unit_id}${limit.equipment_id ? ` / ${limit.equipment_id}` : ''}`, tone: 'neutral' },
      { label: 'Criticality', value: limit.criticality, tone: limit.criticality === 'Critical' ? 'danger' : limit.criticality === 'High' ? 'warn' : 'neutral' },
      { label: 'Normal range', value: this.range(values?.normal_min, values?.normal_max, values?.normal_target, limit.unit_of_measure), tone: values ? 'neutral' : 'warn' },
      { label: 'Alarm range', value: this.range(values?.low_alarm, values?.high_alarm, null, limit.unit_of_measure), tone: 'neutral' },
      { label: 'Trip/SIF setpoint', value: values?.sif_interlock_setpoint ?? values?.high_trip ?? values?.low_trip ?? 'Not defined', tone: 'warn' },
      { label: 'Safe/design limit', value: this.range(values?.min_safe_limit ?? values?.min_design_limit, values?.max_safe_limit ?? values?.max_design_limit, null, limit.unit_of_measure), tone: values ? 'neutral' : 'warn' },
      { label: 'Consequence severity', value: consequences[0]?.severity ?? 'Missing', tone: consequences.length ? 'neutral' : 'warn' },
      { label: 'Operator response', value: operatorResponses.length ? 'Documented' : 'Missing', tone: operatorResponses.length ? 'good' : 'warn' },
      { label: 'Safeguards', value: controls.length, tone: controls.length ? 'good' : 'warn' },
      { label: 'Conflict status', value: limit.conflict_status, tone: limit.conflict_status === 'Critical Conflict' ? 'danger' : limit.conflict_status === 'No Conflict' ? 'good' : 'warn' },
      { label: 'Review status', value: limit.review_status, tone: 'neutral' },
      { label: 'MOC required', value: limit.moc_update_required ? 'Yes' : 'No', tone: limit.moc_update_required ? 'warn' : 'neutral' },
      { label: 'PSSR blocker', value: limit.pssr_blocker ? 'Yes' : 'No', tone: limit.pssr_blocker ? 'danger' : 'good' },
      { label: 'PSI completeness impact', value: `${limit.completeness_status}${limit.completeness_score !== null ? ` (${limit.completeness_score}%)` : ''}`, tone: limit.completeness_status === 'Complete' ? 'good' : 'warn' }
    ], values, consequences, conflicts, completeness };
  }

  private actions(limit: Row, conflicts: Row[], completeness: Row[]) {
    const locked = limit.review_status === 'Approved';
    const criticalConflict = conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved);
    const missingCritical = completeness.some((c) => c.status !== 'Complete' && c.severity === 'Critical');
    return [
      { key: 'edit', label: 'Edit', enabled: !locked, disabledReason: locked ? 'Approved safe operating limit requires controlled edit/MOC.' : null },
      { key: 'run-completeness', label: 'Run Completeness Check', enabled: true },
      { key: 'run-conflict-check', label: 'Run Conflict Check', enabled: true },
      { key: 'submit-review', label: 'Submit for Review', enabled: !locked && !criticalConflict, disabledReason: criticalConflict ? 'Critical conflicts must be resolved or overridden first.' : missingCritical ? 'Critical completeness gaps should be resolved before review.' : null }
    ];
  }

  private tabs(id: string) {
    const base = `/process-safety-information/safe-operating-limits/${id}`;
    return ['Overview', 'Limit Values', 'Consequences of Deviation', 'Operator Response', 'Controls / Safeguards', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: base, enabled: true }));
  }

  private async record(tenantId: string, scope: Scope, limitId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_safe_operating_limits').select('*').eq('company_id', tenantId).eq('id', limitId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('Safe operating limit not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, limit: Row, before: any, after: any, title: string, description?: string | null) {
    const auditInput: { tenantId: string; actorId: string; action: string; entityType: string; entityId?: string; before: JsonValue; after: JsonValue } = { tenantId, actorId, action, entityType: 'PSI_SAFE_OPERATING_LIMIT', before: before as JsonValue, after: after as JsonValue };
    if (limit.id) auditInput.entityId = limit.id;
    await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('psi_limit_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, unit_id: limit.unit_id, equipment_id: limit.equipment_id ?? null, limit_id: limit.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: limit.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: limit.site_id, unit_id: limit.unit_id, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Safe Operating Limits', source_record_id: limit.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }

  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now(); }
  private hasValueFields(dto: Row) { return ['normal_min', 'normal_max', 'normal_target', 'low_alarm', 'high_alarm', 'low_trip', 'high_trip', 'min_design_limit', 'max_design_limit', 'min_safe_limit', 'max_safe_limit'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private worstConflict(results: Row[]) { if (results.some((r) => r.conflict_status === 'Critical Conflict')) return 'Critical Conflict'; if (results.some((r) => r.conflict_status === 'Major Conflict')) return 'Major Conflict'; if (results.some((r) => r.conflict_status === 'Warning')) return 'Warning'; if (results.some((r) => r.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'limit_title', 'parameter_name', 'parameter_tag', 'parameter_type', 'criticality', 'review_status', 'conflict_status', 'completeness_status']).has(column) ? column : 'updated_at'; }
  private range(min: unknown, max: unknown, target: unknown, unit: string) { if (target !== undefined && target !== null) return `Target ${target} ${unit}`; if (min !== undefined && min !== null && max !== undefined && max !== null) return `${min} - ${max} ${unit}`; if (min !== undefined && min !== null) return `>= ${min} ${unit}`; if (max !== undefined && max !== null) return `<= ${max} ${unit}`; return 'Not defined'; }
  private num(value: unknown) { if (value === null || value === undefined || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
  private requireText(value: unknown, message: string) { if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message); return value.trim(); }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }
}
