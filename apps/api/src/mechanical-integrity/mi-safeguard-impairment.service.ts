import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Query = Record<string, string | undefined>;

const activeStatuses = ['Approved', 'Active', 'Expiring Soon', 'Expired', 'Extension Requested', 'Extension Approved', 'Pending Restoration'];
const terminalStatuses = ['Restored', 'Restoration Verified', 'Closed', 'Rejected', 'Cancelled'];
const impairmentTypes = ['Bypass', 'Impairment', 'Override', 'Inhibit', 'Defeat', 'Isolation', 'Out of service', 'Removed from service', 'Suppressed', 'Shelved', 'Disabled', 'Degraded', 'Unavailable'];
const statuses = ['Draft', 'Pending Approval', 'Approved', 'Active', 'Expiring Soon', 'Expired', 'Extension Requested', 'Extension Approved', 'Extension Rejected', 'Pending Restoration', 'Restored', 'Restoration Verified', 'Closed', 'Rejected', 'Cancelled'];
const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
const safeguardTypes = ['SIS / SIF', 'Interlock', 'Critical Alarm', 'PSV / Relief Device', 'Rupture Disk', 'Fire & Gas System', 'ESD', 'BMS', 'Critical Instrument', 'Control Valve', 'Final Element', 'Fire Protection', 'Manual Emergency Device', 'Other Safeguard'];

@Injectable()
export class MiSafeguardImpairmentService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService
  ) {}

  async list(user: RequestUser, query: Query) {
    await this.refreshExpiryStates(user);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    let request = this.applyScope(this.db.from('mi_safeguard_impairments').select('*', { count: 'exact' }), user, query);
    request = this.applyFilters(request, query);
    const { data, error, count } = await request.order(this.sortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] !== 'desc' }).range(from, to);
    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((row: any) => this.decorate(row));
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: await this.summary(user, query),
      savedViews: ['All Records', 'Active Bypasses', 'Expired Bypasses', 'Pending Approval', 'Critical Safeguards', 'LOPA / SIL IPLs Impaired', 'PSV / Relief Device Impairments', 'SIF / SIS Impairments', 'Startup Blocked', 'Missing Mitigation', 'Restoration Pending'],
      lastUpdated: new Date().toISOString()
    };
  }

  async summary(user: RequestUser, query: Query) {
    await this.refreshExpiryStates(user);
    const rows = await this.db.many<any>(this.applyFilters(this.applyScope(this.db.from('mi_safeguard_impairments').select('*'), user, query), query).limit(1000)).catch(() => []);
    const active = rows.filter((row) => ['Active', 'Expiring Soon', 'Expired', 'Extension Requested', 'Extension Approved', 'Pending Restoration'].includes(row.status));
    return {
      totalRecords: rows.length,
      activeBypasses: active.filter((row) => /bypass/i.test(row.impairment_type)).length,
      activeImpairments: active.filter((row) => /impairment|degraded|unavailable|out of service/i.test(row.impairment_type)).length,
      activeOverrides: active.filter((row) => /override/i.test(row.impairment_type)).length,
      activeInhibits: active.filter((row) => /inhibit|shelved|suppressed/i.test(row.impairment_type)).length,
      expiredBypasses: rows.filter((row) => row.status === 'Expired' || this.isExpired(row)).length,
      pendingApproval: rows.filter((row) => row.status === 'Pending Approval').length,
      pendingRestorationVerification: rows.filter((row) => ['Pending Restoration', 'Restored'].includes(row.status)).length,
      criticalSafeguardsImpaired: active.filter((row) => row.safety_critical || row.risk_level === 'Critical').length,
      lopaSilIplsImpaired: active.filter((row) => row.lopa_sil_ipl || /lopa|sil/i.test(String(row.safeguard_type))).length,
      psvReliefDevicesImpaired: active.filter((row) => /relief|psv|prv|rupture/i.test(String(row.safeguard_type))).length,
      sifsImpaired: active.filter((row) => /sif|sis/i.test(String(row.safeguard_type))).length,
      interlocksImpaired: active.filter((row) => /interlock/i.test(String(row.safeguard_type))).length,
      criticalAlarmsImpaired: active.filter((row) => /alarm/i.test(String(row.safeguard_type))).length,
      startupBlocked: active.filter((row) => row.startup_blocked).length,
      mocRequiredSuggested: active.filter((row) => row.moc_required || row.moc_suggested).length,
      ptwLotoLinked: active.filter((row) => row.ptw_linked || row.loto_linked).length,
      restoredThisMonth: rows.filter((row) => row.restored_at && new Date(row.restored_at).getMonth() === new Date().getMonth()).length
    };
  }

  active(user: RequestUser, query: Query) {
    return this.list(user, { ...query, statusGroup: 'active' });
  }

  expired(user: RequestUser, query: Query) {
    return this.list(user, { ...query, status: 'Expired' });
  }

  pendingApproval(user: RequestUser, query: Query) {
    return this.list(user, { ...query, status: 'Pending Approval' });
  }

  async detail(user: RequestUser, id: string) {
    const row = await this.getScoped(user, id);
    const [approvals, extensions, restorations, linkedRecords, notifications, history] = await Promise.all([
      this.db.many<any>(this.db.from('mi_safeguard_impairment_approvals').select('*').eq('impairment_id', id).order('created_at', { ascending: true })).catch(() => []),
      this.db.many<any>(this.db.from('mi_safeguard_impairment_extensions').select('*').eq('impairment_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.db.many<any>(this.db.from('mi_safeguard_impairment_restorations').select('*').eq('impairment_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.linkedRecords(user, id),
      this.db.many<any>(this.db.from('mi_safeguard_impairment_notifications').select('*').eq('impairment_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.history(user, id)
    ]);
    return {
      impairment: this.decorate(row),
      approvals,
      extensions,
      restorations,
      linkedRecords,
      notifications,
      history,
      readOnly: terminalStatuses.includes(row.status),
      readOnlyReason: terminalStatuses.includes(row.status) ? 'Closed/restored/rejected/cancelled impairment records are read-only except through controlled workflow.' : null,
      readiness: this.readiness(row, approvals, linkedRecords)
    };
  }

  async create(user: RequestUser, body: Record<string, any>) {
    const ref = await this.resolveSafeguard(user, body.safeguardType ?? body.safeguard_type, body.safeguardId ?? body.safeguard_id);
    await this.assertNoDuplicateActive(user, ref, null);
    const payload = await this.payload(user, ref, body, false);
    this.validatePayload(payload);
    const row = await this.db.single<any>(this.db.from('mi_safeguard_impairments').insert(payload).select().single());
    await this.writeEvent(user, row, 'Created', 'Safeguard bypass / impairment created', null, row, body.reason ?? null);
    await this.updateSafeguardActiveState(row).catch(() => null);
    return this.detail(user, row.id);
  }

  async update(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    this.assertEditable(before);
    const ref = await this.resolveSafeguard(user, body.safeguardType ?? body.safeguard_type ?? before.safeguard_type, body.safeguardId ?? body.safeguard_id ?? before.safeguard_id);
    await this.assertNoDuplicateActive(user, ref, id);
    const payload = await this.payload(user, ref, { ...before, ...body }, true);
    this.validatePayload(payload);
    const row = await this.db.single<any>(this.db.from('mi_safeguard_impairments').update(payload).eq('id', id).select().single());
    await this.writeEvent(user, row, 'Updated', 'Safeguard bypass / impairment updated', before, row, body.changeReason ?? body.reason ?? null);
    await this.updateSafeguardActiveState(row).catch(() => null);
    return this.detail(user, id);
  }

  submit(user: RequestUser, id: string, body: Record<string, any>) {
    return this.transition(user, id, 'Pending Approval', 'Submitted', 'Safeguard bypass / impairment submitted for approval', body);
  }

  async approve(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    const approval = await this.db.single<any>(this.db.from('mi_safeguard_impairment_approvals').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      impairment_id: id,
      approval_role: body.approvalRole ?? body.approval_role ?? 'Approver',
      approver_user_id: user.id,
      decision: 'Approved',
      decision_reason: body.comment ?? body.reason ?? null,
      decided_at: new Date().toISOString(),
      created_by: user.id
    }).select().single()).catch(() => null);
    const after = await this.patchStatus(user, before, 'Approved', { approved_by: user.id, approved_at: new Date().toISOString() });
    await this.writeEvent(user, after, 'Approved', 'Safeguard bypass / impairment approved', before, { after, approval }, body.comment ?? null);
    return this.detail(user, id);
  }

  reject(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comment)) throw new BadRequestException('Rejection reason is required.');
    return this.transition(user, id, 'Rejected', 'Rejected', 'Safeguard bypass / impairment rejected', body, { rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: body.reason ?? body.comment });
  }

  activate(user: RequestUser, id: string, body: Record<string, any>) {
    return this.transition(user, id, 'Active', 'Activated', 'Safeguard bypass / impairment activated', body, { activated_by: user.id, activated_at: new Date().toISOString() });
  }

  async requestExtension(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    if (!(body.reason ?? body.extensionReason ?? body.extension_reason)) throw new BadRequestException('Extension reason is required.');
    const newExpiry = body.newExpiryAt ?? body.new_expiry_at ?? this.calculateExpiry(before.start_at, Number(body.extensionValue ?? body.extension_value ?? before.max_duration_value), body.extensionUnit ?? body.extension_unit ?? before.max_duration_unit);
    const extension = await this.db.single<any>(this.db.from('mi_safeguard_impairment_extensions').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      impairment_id: id,
      requested_by: user.id,
      requested_at: new Date().toISOString(),
      requested_until_at: newExpiry,
      extension_reason: body.reason ?? body.extensionReason ?? body.extension_reason,
      risk_reassessment_json: body.riskReassessment ?? body.risk_reassessment_json ?? null,
      additional_mitigation_json: body.additionalMitigation ?? body.additional_mitigation_json ?? null,
      status: 'Pending Approval'
    }).select().single());
    const after = await this.patchStatus(user, before, 'Extension Requested', {});
    await this.writeEvent(user, after, 'Extension Requested', 'Safeguard impairment extension requested', before, { after, extension }, body.reason ?? null);
    return this.detail(user, id);
  }

  async approveExtension(user: RequestUser, id: string, extensionId: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    const ext = await this.db.single<any>(this.db.from('mi_safeguard_impairment_extensions').update({ status: 'Approved', decision_by: user.id, decision_at: new Date().toISOString(), decision_reason: body.comment ?? null }).eq('id', extensionId).eq('impairment_id', id).select().single());
    const after = await this.patchStatus(user, before, 'Extension Approved', { expiry_at: ext.requested_until_at, extension_count: Number(before.extension_count ?? 0) + 1 });
    await this.writeEvent(user, after, 'Extension Approved', 'Safeguard impairment extension approved', before, { after, ext }, body.comment ?? null);
    return this.detail(user, id);
  }

  async rejectExtension(user: RequestUser, id: string, extensionId: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comment)) throw new BadRequestException('Extension rejection reason is required.');
    const before = await this.getScoped(user, id);
    const ext = await this.db.single<any>(this.db.from('mi_safeguard_impairment_extensions').update({ status: 'Rejected', decision_by: user.id, decision_at: new Date().toISOString(), decision_reason: body.reason ?? body.comment }).eq('id', extensionId).eq('impairment_id', id).select().single());
    const after = await this.patchStatus(user, before, 'Extension Rejected', {});
    await this.writeEvent(user, after, 'Extension Rejected', 'Safeguard impairment extension rejected', before, { after, ext }, body.reason ?? body.comment);
    return this.detail(user, id);
  }

  async restore(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    const restoration = await this.db.single<any>(this.db.from('mi_safeguard_impairment_restorations').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      impairment_id: id,
      restored_by: body.restoredBy ?? body.restored_by ?? user.id,
      restored_at: body.restoredAt ?? body.restored_at ?? new Date().toISOString(),
      restoration_method: body.restorationMethod ?? body.restoration_method ?? null,
      returned_to_normal: body.returnedToNormal ?? body.returned_to_normal ?? false,
      functional_test_required: body.functionalTestRequired ?? body.functional_test_required ?? false,
      functional_test_completed: body.functionalTestCompleted ?? body.functional_test_completed ?? false,
      functional_test_record_id: body.functionalTestRecordId ?? body.functional_test_record_id ?? null,
      control_room_notified: body.controlRoomNotified ?? body.control_room_notified ?? false,
      mitigation_removed: body.mitigationRemoved ?? body.mitigation_removed ?? false,
      seal_lock_restored: body.sealLockRestored ?? body.seal_lock_restored ?? false,
      restoration_evidence_id: body.restorationEvidenceId ?? body.restoration_evidence_id ?? null,
      restoration_notes: body.notes ?? body.restoration_notes ?? null,
      verification_status: 'Pending Verification',
      created_by: user.id
    }).select().single());
    const after = await this.patchStatus(user, before, 'Pending Restoration', { restored_by: restoration.restored_by, restored_at: restoration.restored_at, restoration_status: 'Pending Verification' });
    await this.writeEvent(user, after, 'Restored', 'Safeguard restored pending verification', before, { after, restoration }, body.notes ?? null);
    return this.detail(user, id);
  }

  async verifyRestoration(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    const status = String(body.result ?? body.verificationResult ?? 'Verified');
    const latest = await this.db.single<any>(this.db.from('mi_safeguard_impairment_restorations').select('id').eq('impairment_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    const restoration = latest?.id ? await this.db.single<any>(this.db.from('mi_safeguard_impairment_restorations').update({
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_result: status,
      verification_status: /reject|fail/i.test(status) ? 'Rejected' : 'Verified',
      verification_comment: body.comment ?? body.reason ?? null
    }).eq('id', latest.id).select().single()).catch(() => null) : null;
    const next = /reject|fail/i.test(status) ? 'Pending Restoration' : 'Restoration Verified';
    const after = await this.patchStatus(user, before, next, { restoration_status: next, verified_by: user.id, verified_at: new Date().toISOString() });
    await this.writeEvent(user, after, next, 'Safeguard restoration verification completed', before, { after, restoration }, body.comment ?? null);
    await this.updateSafeguardActiveState(after).catch(() => null);
    return this.detail(user, id);
  }

  async close(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getScoped(user, id);
    if (before.status !== 'Restoration Verified') throw new BadRequestException('Restoration must be verified before closing the bypass / impairment.');
    const after = await this.patchStatus(user, before, 'Closed', { closed_by: user.id, closed_at: new Date().toISOString(), closure_reason: body.reason ?? body.comment ?? null, read_only: true });
    await this.writeEvent(user, after, 'Closed', 'Safeguard bypass / impairment closed', before, after, body.reason ?? null);
    await this.updateSafeguardActiveState(after).catch(() => null);
    return this.detail(user, id);
  }

  cancel(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comment)) throw new BadRequestException('Cancellation reason is required.');
    return this.transition(user, id, 'Cancelled', 'Cancelled', 'Safeguard bypass / impairment cancelled', body, { cancel_reason: body.reason ?? body.comment, read_only: true });
  }

  async linkedRecords(user: RequestUser, id: string) {
    await this.getScoped(user, id);
    return this.db.many<any>(this.db.from('mi_safeguard_impairment_linked_records').select('*').eq('impairment_id', id).order('created_at', { ascending: false })).catch(() => []);
  }

  async addLinkedRecord(user: RequestUser, id: string, body: Record<string, any>) {
    const impairment = await this.getScoped(user, id);
    if (!(body.linkedModule ?? body.linked_module) || !(body.linkedRecordId ?? body.linked_record_id)) throw new BadRequestException('Linked module and record id are required.');
    const row = await this.db.single<any>(this.db.from('mi_safeguard_impairment_linked_records').insert({
      company_id: impairment.company_id,
      site_id: impairment.site_id,
      impairment_id: id,
      linked_module: body.linkedModule ?? body.linked_module,
      linked_record_type: body.linkedRecordType ?? body.linked_record_type ?? null,
      linked_record_id: body.linkedRecordId ?? body.linked_record_id,
      linked_record_number: body.linkedRecordNumber ?? body.linked_record_number ?? null,
      link_role: body.linkRole ?? body.link_role ?? 'Reference',
      required_for_close: body.requiredForClose ?? body.required_for_close ?? false,
      snapshot_json: body.snapshot ?? body.snapshot_json ?? null,
      linked_by: user.id
    }).select().single());
    await this.writeEvent(user, impairment, 'Linked', 'Record linked to safeguard bypass / impairment', null, row, body.reason ?? null);
    return row;
  }

  async removeLinkedRecord(user: RequestUser, id: string, linkId: string, body: Record<string, any>) {
    const impairment = await this.getScoped(user, id);
    const before = await this.db.single<any>(this.db.from('mi_safeguard_impairment_linked_records').select('*').eq('id', linkId).eq('impairment_id', id).maybeSingle());
    if (!before) throw new NotFoundException('Linked record not found.');
    await this.db.single<any>(this.db.from('mi_safeguard_impairment_linked_records').delete().eq('id', linkId).select('id').single());
    await this.writeEvent(user, impairment, 'Unlinked', 'Record unlinked from safeguard bypass / impairment', before, null, body.reason ?? null);
    return { ok: true };
  }

  history(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_safeguard_impairment_history_events').select('*').eq('impairment_id', id), user, {}).order('created_at', { ascending: false }).limit(200)).catch(() => []);
  }

  lookups() {
    return { impairmentTypes, statuses, riskLevels, safeguardTypes };
  }

  importTemplate() {
    return Promise.resolve({ fileName: 'safeguard-bypass-impairment-import-template.csv', content: this.csv([], ['record_number','safeguard_type','safeguard_id','safeguard_tag','impairment_type','reason','risk_level','start_at','max_duration_value','max_duration_unit','temporary_mitigation_summary','expiry_at','status']) });
  }

  async exportRows(user: RequestUser, query: Query) {
    const rows = (await this.list(user, { ...query, limit: '1000' })).rows;
    return { fileName: 'safeguard-bypass-impairments.csv', content: this.csv(rows, ['record_number','safeguard_tag','safeguard_type','equipment_tag','impairment_type','reason','risk_level','status','start_at','max_duration_value','max_duration_unit','expiry_at','time_remaining_label','temporary_mitigation_summary','authorized_by','approved_by','restoration_status','moc_linked','ptw_linked','loto_linked','startup_blocked','updated_at']) };
  }

  private async transition(user: RequestUser, id: string, status: string, eventType: string, title: string, body: Record<string, any>, patch: Record<string, any> = {}) {
    const before = await this.getScoped(user, id);
    const after = await this.patchStatus(user, before, status, patch);
    await this.writeEvent(user, after, eventType, title, before, after, body.reason ?? body.comment ?? null);
    await this.updateSafeguardActiveState(after).catch(() => null);
    return this.detail(user, id);
  }

  private async patchStatus(user: RequestUser, before: any, status: string, patch: Record<string, any>) {
    const after = await this.db.single<any>(this.db.from('mi_safeguard_impairments').update({ ...patch, status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', before.id).select().single());
    return after;
  }

  private async payload(user: RequestUser, ref: any, body: Record<string, any>, update: boolean) {
    const startAt = body.startAt ?? body.start_at ?? new Date().toISOString();
    const maxDurationValue = Number(body.maxDurationValue ?? body.max_duration_value ?? 8);
    const maxDurationUnit = body.maxDurationUnit ?? body.max_duration_unit ?? 'Hours';
    const expiryAt = body.expiryAt ?? body.expiry_at ?? this.calculateExpiry(startAt, maxDurationValue, maxDurationUnit);
    const recordNumber = body.recordNumber ?? body.record_number ?? (update ? body.record_number : await this.nextRecordNumber(ref.company_id, ref.site_id));
    const riskLevel = body.riskLevel ?? body.risk_level ?? 'Medium';
    const psmCritical = body.psmCritical ?? body.psm_critical ?? ref.psm_critical ?? false;
    const safetyCritical = body.safetyCritical ?? body.safety_critical ?? ref.safety_critical ?? false;
    const lopaSilIpl = body.lopaSilIpl ?? body.lopa_sil_ipl ?? /sif|sis/i.test(String(ref.safeguard_type));
    const mocRequired = body.mocRequired ?? body.moc_required ?? (riskLevel === 'Critical' || body.extensionAllowed === true);
    const startupBlocked = body.startupBlocked ?? body.startup_blocked ?? (['High', 'Critical'].includes(String(riskLevel)) || safetyCritical);
    return {
      company_id: ref.company_id,
      site_id: ref.site_id,
      unit_id: body.unitId ?? body.unit_id ?? ref.unit_id ?? null,
      area_id: body.areaId ?? body.area_id ?? ref.area_id ?? null,
      equipment_id: body.equipmentId ?? body.equipment_id ?? ref.protected_equipment_id ?? ref.equipment_id ?? ref.equipment_system_id ?? null,
      record_number: recordNumber,
      safeguard_type: ref.safeguard_type,
      safeguard_id: ref.safeguard_id,
      safeguard_tag: body.safeguardTag ?? body.safeguard_tag ?? ref.safeguard_tag,
      safeguard_description: body.safeguardDescription ?? body.safeguard_description ?? ref.description ?? null,
      equipment_tag: body.equipmentTag ?? body.equipment_tag ?? null,
      equipment_criticality: body.equipmentCriticality ?? body.equipment_criticality ?? null,
      safety_critical: safetyCritical,
      psm_critical: psmCritical,
      lopa_sil_ipl: lopaSilIpl,
      current_safeguard_status: body.currentSafeguardStatus ?? body.current_safeguard_status ?? ref.status ?? null,
      last_test_at: body.lastTestAt ?? body.last_test_at ?? ref.last_test_date ?? null,
      next_test_due_at: body.nextTestDueAt ?? body.next_test_due_at ?? ref.next_test_due_date ?? null,
      impairment_type: body.impairmentType ?? body.impairment_type ?? 'Bypass',
      reason: body.reason ?? null,
      work_description: body.workDescription ?? body.work_description ?? null,
      operational_need: body.operationalNeed ?? body.operational_need ?? null,
      testing_maintenance_related: body.testingMaintenanceRelated ?? body.testing_maintenance_related ?? false,
      planned_emergency: body.plannedEmergency ?? body.planned_emergency ?? 'Planned',
      requested_start_at: body.requestedStartAt ?? body.requested_start_at ?? startAt,
      expected_restoration_at: body.expectedRestorationAt ?? body.expected_restoration_at ?? expiryAt,
      affected_function: body.affectedFunction ?? body.affected_function ?? null,
      affected_scenario: body.affectedScenario ?? body.affected_scenario ?? null,
      affected_equipment: body.affectedEquipment ?? body.affected_equipment ?? null,
      consequence_if_needed: body.consequenceIfNeeded ?? body.consequence_if_needed ?? null,
      notes: body.notes ?? null,
      risk_level: riskLevel,
      risk_assessment_summary: body.riskAssessmentSummary ?? body.risk_assessment_summary ?? null,
      risk_snapshot_json: body.riskSnapshot ?? body.risk_snapshot_json ?? null,
      mitigation_required: body.mitigationRequired ?? body.mitigation_required ?? ['High', 'Critical'].includes(String(riskLevel)),
      mitigation_measures_json: body.mitigationMeasures ?? body.mitigation_measures_json ?? null,
      temporary_mitigation_summary: body.temporaryMitigationSummary ?? body.temporary_mitigation_summary ?? null,
      operator_monitoring_required: body.operatorMonitoringRequired ?? body.operator_monitoring_required ?? false,
      temporary_alarm_or_protection: body.temporaryAlarmOrProtection ?? body.temporary_alarm_or_protection ?? false,
      extra_rounds_required: body.extraRoundsRequired ?? body.extra_rounds_required ?? false,
      reduced_operating_envelope: body.reducedOperatingEnvelope ?? body.reduced_operating_envelope ?? false,
      reduced_inventory_pressure_temperature: body.reducedInventoryPressureTemperature ?? body.reduced_inventory_pressure_temperature ?? false,
      standby_equipment_required: body.standbyEquipmentRequired ?? body.standby_equipment_required ?? false,
      fire_gas_watch_required: body.fireGasWatchRequired ?? body.fire_gas_watch_required ?? false,
      manual_control_required: body.manualControlRequired ?? body.manual_control_required ?? false,
      emergency_readiness_required: body.emergencyReadinessRequired ?? body.emergency_readiness_required ?? false,
      control_room_communication_required: body.controlRoomCommunicationRequired ?? body.control_room_communication_required ?? false,
      shift_handover_required: body.shiftHandoverRequired ?? body.shift_handover_required ?? false,
      management_notification_required: body.managementNotificationRequired ?? body.management_notification_required ?? false,
      start_at: startAt,
      max_duration_value: maxDurationValue,
      max_duration_unit: maxDurationUnit,
      expiry_at: expiryAt,
      reminder_at: body.reminderAt ?? body.reminder_at ?? null,
      extension_allowed: body.extensionAllowed ?? body.extension_allowed ?? false,
      extension_limit_value: body.extensionLimitValue ?? body.extension_limit_value ?? null,
      extension_limit_unit: body.extensionLimitUnit ?? body.extension_limit_unit ?? null,
      extension_reason_required: body.extensionReasonRequired ?? body.extension_reason_required ?? true,
      escalation_level: body.escalationLevel ?? body.escalation_level ?? 'Normal',
      auto_create_action_if_expired: body.autoCreateActionIfExpired ?? body.auto_create_action_if_expired ?? true,
      status: body.status ?? 'Draft',
      restoration_status: body.restorationStatus ?? body.restoration_status ?? 'Not Started',
      requester_user_id: body.requesterUserId ?? body.requester_user_id ?? user.id,
      authorized_by: body.authorizedBy ?? body.authorized_by ?? null,
      approved_by: body.approvedBy ?? body.approved_by ?? null,
      activated_by: body.activatedBy ?? body.activated_by ?? null,
      restoration_verified_by: body.restorationVerifiedBy ?? body.restoration_verified_by ?? null,
      startup_blocked: startupBlocked,
      pssr_blocker: body.pssrBlocker ?? body.pssr_blocker ?? startupBlocked,
      moc_required: mocRequired,
      moc_suggested: body.mocSuggested ?? body.moc_suggested ?? ['High', 'Critical'].includes(String(riskLevel)),
      ptw_required: body.ptwRequired ?? body.ptw_required ?? false,
      ptw_linked: body.ptwLinked ?? body.ptw_linked ?? false,
      loto_required: body.lotoRequired ?? body.loto_required ?? false,
      loto_linked: body.lotoLinked ?? body.loto_linked ?? false,
      pssr_required: body.pssrRequired ?? body.pssr_required ?? startupBlocked,
      lopa_warning_required: body.lopaWarningRequired ?? body.lopa_warning_required ?? lopaSilIpl,
      missing_mitigation: body.missingMitigation ?? body.missing_mitigation ?? false,
      created_by: update ? body.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
  }

  private validatePayload(payload: Record<string, any>) {
    if (!payload.safeguard_id || !payload.safeguard_type) throw new BadRequestException('Safeguard selection is required.');
    if (!payload.reason) throw new BadRequestException('Bypass / impairment reason is required.');
    if (!payload.start_at) throw new BadRequestException('Start date/time is required.');
    if (!payload.expiry_at) throw new BadRequestException('Expiry date/time is required.');
    if (['High', 'Critical'].includes(payload.risk_level) && payload.mitigation_required && !payload.temporary_mitigation_summary && !payload.mitigation_measures_json) {
      throw new BadRequestException('High/Critical bypasses require temporary mitigation details before submission or activation.');
    }
  }

  private assertEditable(row: any) {
    if (row.read_only || terminalStatuses.includes(row.status)) throw new BadRequestException('This bypass / impairment record is read-only because it is closed, restored, rejected, or cancelled.');
  }

  private async getScoped(user: RequestUser, id: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_safeguard_impairments').select('*').eq('id', id), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Safeguard bypass / impairment record was not found or is outside your company/site access.');
    return row;
  }

  private applyScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) scoped = scoped.eq('site_id', siteId);
    else if (user.siteIds?.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyFilters(request: any, query: Query) {
    let scoped = request;
    if (query.equipmentId) scoped = scoped.eq('equipment_id', query.equipmentId);
    if (query.safeguardId) scoped = scoped.eq('safeguard_id', query.safeguardId);
    if (query.safeguardType) scoped = scoped.ilike('safeguard_type', `%${query.safeguardType}%`);
    if (query.impairmentType) scoped = scoped.eq('impairment_type', query.impairmentType);
    if (query.riskLevel) scoped = scoped.eq('risk_level', query.riskLevel);
    if (query.status) scoped = scoped.eq('status', query.status);
    if (query.statusGroup === 'active') scoped = scoped.in('status', activeStatuses);
    if (query.search) scoped = scoped.or(`record_number.ilike.%${query.search}%,safeguard_tag.ilike.%${query.search}%,equipment_tag.ilike.%${query.search}%,reason.ilike.%${query.search}%`);
    if (query.startFrom) scoped = scoped.gte('start_at', query.startFrom);
    if (query.startTo) scoped = scoped.lte('start_at', query.startTo);
    if (query.expiryFrom) scoped = scoped.gte('expiry_at', query.expiryFrom);
    if (query.expiryTo) scoped = scoped.lte('expiry_at', query.expiryTo);
    if (query.startupBlocked === 'true') scoped = scoped.eq('startup_blocked', true);
    if (query.missingMitigation === 'true') scoped = scoped.eq('missing_mitigation', true);
    if (query.mocRequired === 'true') scoped = scoped.eq('moc_required', true);
    return scoped;
  }

  private async resolveSafeguard(user: RequestUser, rawType: string, id: string) {
    if (!rawType || !id) throw new BadRequestException('Safeguard type and safeguard record are required.');
    const type = String(rawType);
    if (/sif|sis/i.test(type)) {
      const row = await this.scopedSafeguard(user, 'mi_sifs', id);
      const protection = await this.db.single<any>(this.db.from('mi_sif_protection_scope').select('*').eq('sif_id', id).maybeSingle()).catch(() => null);
      return { ...row, safeguard_type: 'SIS / SIF', safeguard_id: id, safeguard_tag: row.sif_tag, description: row.sif_description, protected_equipment_id: protection?.protected_equipment_id ?? null };
    }
    if (/interlock/i.test(type)) {
      const row = await this.scopedSafeguard(user, 'mi_interlocks', id);
      return { ...row, safeguard_type: 'Interlock', safeguard_id: id, safeguard_tag: row.interlock_tag, description: row.interlock_description, protected_equipment_id: row.protected_equipment_id ?? null };
    }
    if (/alarm/i.test(type)) {
      const row = await this.scopedSafeguard(user, 'mi_critical_alarms', id);
      return { ...row, safeguard_type: 'Critical Alarm', safeguard_id: id, safeguard_tag: row.alarm_tag, description: row.alarm_description, protected_equipment_id: row.protected_equipment_id ?? null };
    }
    if (/relief|psv|prv|rupture/i.test(type)) {
      const row = await this.scopedSafeguard(user, 'mi_relief_devices', id);
      return { ...row, safeguard_type: row.device_type?.includes('Rupture') ? 'Rupture Disk' : 'PSV / Relief Device', safeguard_id: id, safeguard_tag: row.device_tag, description: row.device_name ?? row.description, protected_equipment_id: row.equipment_system_id ?? null };
    }
    return { company_id: user.tenantId, site_id: user.selectedSiteId ?? user.activeSiteId, safeguard_type: 'Other Safeguard', safeguard_id: id, safeguard_tag: id, description: null, safety_critical: false, psm_critical: false };
  }

  private async scopedSafeguard(user: RequestUser, table: string, id: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from(table).select('*').eq('id', id), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Selected safeguard was not found or is outside your company/site access.');
    return row;
  }

  private async assertNoDuplicateActive(user: RequestUser, ref: any, excludeId: string | null) {
    let request = this.applyScope(this.db.from('mi_safeguard_impairments').select('id,record_number,status').eq('safeguard_id', ref.safeguard_id).in('status', activeStatuses), user, {});
    if (excludeId) request = request.neq('id', excludeId);
    const rows = await this.db.many<any>(request.limit(5)).catch(() => []);
    if (rows.length) throw new BadRequestException(`An active bypass / impairment already exists for this safeguard (${rows[0].record_number}). Close or restore it before creating another one.`);
  }

  private async nextRecordNumber(companyId: string, siteId: string) {
    const year = new Date().getFullYear();
    const prefix = `MI-BYP-${year}-`;
    const rows = await this.db.many<any>(this.db.from('mi_safeguard_impairments').select('record_number').eq('company_id', companyId).eq('site_id', siteId).ilike('record_number', `${prefix}%`).order('record_number', { ascending: false }).limit(1)).catch(() => []);
    const last = Number(String(rows[0]?.record_number ?? '').split('-').pop() ?? 0);
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private async writeEvent(user: RequestUser, impairment: any, eventType: string, title: string, before: unknown, after: unknown, reason: string | null) {
    const event = await this.db.single<any>(this.db.from('mi_safeguard_impairment_history_events').insert({
      company_id: impairment.company_id,
      site_id: impairment.site_id,
      impairment_id: impairment.id,
      equipment_id: impairment.equipment_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: reason ?? title,
      before_values_json: before ?? null,
      after_values_json: after ?? null,
      actor_user_id: user.id,
      reason,
      source_module: 'MechanicalIntegrity',
      source_record_id: impairment.id
    }).select().single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `MI_IMPAIRMENT_${eventType.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, entityType: 'mi_safeguard_impairment', entityId: impairment.id, before: (before ?? null) as JsonValue, after: (after ?? null) as JsonValue }).catch(() => null);
    return event;
  }

  private async updateSafeguardActiveState(row: any) {
    const active = activeStatuses.includes(row.status) && !['Restoration Verified', 'Closed'].includes(row.status);
    if (/sif|sis/i.test(row.safeguard_type)) await this.db.single<any>(this.db.from('mi_sifs').update({ active_bypass_count: active ? 1 : 0, startup_blocked: active && row.startup_blocked, updated_at: new Date().toISOString() }).eq('id', row.safeguard_id).select('id').single()).catch(() => null);
    if (/interlock/i.test(row.safeguard_type)) await this.db.single<any>(this.db.from('mi_interlocks').update({ bypass_status: active ? row.status : null, startup_blocked: active && row.startup_blocked, updated_at: new Date().toISOString() }).eq('id', row.safeguard_id).select('id').single()).catch(() => null);
    if (/alarm/i.test(row.safeguard_type)) await this.db.single<any>(this.db.from('mi_critical_alarms').update({ shelved_suppressed_status: active ? row.status : null, startup_blocked: active && row.startup_blocked, updated_at: new Date().toISOString() }).eq('id', row.safeguard_id).select('id').single()).catch(() => null);
    if (/relief|psv|prv|rupture/i.test(row.safeguard_type)) await this.db.single<any>(this.db.from('mi_relief_devices').update({ active_impairment: active, startup_blocked: active && row.startup_blocked, updated_at: new Date().toISOString() }).eq('id', row.safeguard_id).select('id').single()).catch(() => null);
  }

  private async refreshExpiryStates(user: RequestUser) {
    const now = new Date().toISOString();
    const expired = await this.db.many<any>(this.applyScope(this.db.from('mi_safeguard_impairments').select('id').in('status', ['Active', 'Expiring Soon']).lt('expiry_at', now), user, {}).limit(100)).catch(() => []);
    await Promise.all(expired.map((row) => this.db.single<any>(this.db.from('mi_safeguard_impairments').update({ status: 'Expired', updated_at: now }).eq('id', row.id).select('id').single()).catch(() => null)));
  }

  private readiness(row: any, approvals: any[], linkedRecords: any[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (['High', 'Critical'].includes(row.risk_level) && !row.temporary_mitigation_summary && !row.mitigation_measures_json) blockers.push('High/Critical impairment requires temporary mitigation.');
    if (row.status === 'Draft') blockers.push('Record must be submitted for approval.');
    if (row.status === 'Pending Approval' && !approvals.some((item) => item.decision === 'Approved')) blockers.push('Required approval is pending.');
    if (row.startup_blocked) warnings.push('Startup is blocked while this impairment remains active.');
    if (row.lopa_warning_required) warnings.push('LOPA/SIL IPL warning required.');
    if (row.moc_required && !linkedRecords.some((item) => /moc/i.test(item.linked_module))) warnings.push('MOC is required or suggested and is not linked.');
    if (row.ptw_required && !linkedRecords.some((item) => /ptw/i.test(item.linked_module))) warnings.push('PTW is required and is not linked.');
    if (row.loto_required && !linkedRecords.some((item) => /loto/i.test(item.linked_module))) warnings.push('LOTO is required and is not linked.');
    return { status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready', blockers, warnings };
  }

  private decorate(row: any) {
    const expiry = row.expiry_at ? new Date(row.expiry_at).getTime() : null;
    const diff = expiry ? expiry - Date.now() : null;
    const overdue = typeof diff === 'number' && diff < 0;
    const soon = typeof diff === 'number' && diff >= 0 && diff <= 24 * 60 * 60 * 1000;
    return {
      ...row,
      status: row.status === 'Active' && overdue ? 'Expired' : row.status === 'Active' && soon ? 'Expiring Soon' : row.status,
      timeRemainingMs: diff,
      timeRemainingLabel: diff === null ? 'No expiry configured' : overdue ? `${Math.ceil(Math.abs(diff) / 3600000)}h overdue` : `${Math.ceil(diff / 3600000)}h remaining`,
      expiryStatus: diff === null ? 'Unknown' : overdue ? 'Expired' : soon ? 'Expiring Soon' : 'Within Duration'
    };
  }

  private calculateExpiry(startAt: string, value: number, unit: string) {
    const start = new Date(startAt);
    const multiplier = /day/i.test(unit) ? 24 * 60 * 60 * 1000 : /week/i.test(unit) ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    return new Date(start.getTime() + Math.max(1, Number(value || 1)) * multiplier).toISOString();
  }

  private isExpired(row: any) {
    return row.expiry_at && new Date(row.expiry_at).getTime() < Date.now();
  }

  private sortColumn(raw: string) {
    const allowed: Record<string, string> = { recordNumber: 'record_number', safeguardTag: 'safeguard_tag', status: 'status', riskLevel: 'risk_level', startAt: 'start_at', expiryAt: 'expiry_at', updatedAt: 'updated_at', createdAt: 'created_at' };
    return allowed[raw] ?? raw ?? 'updated_at';
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
