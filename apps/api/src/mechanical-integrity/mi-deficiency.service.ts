import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { EquipmentService } from '../equipment/equipment.service';

type Query = Record<string, string | undefined>;

const deficiencyTypes = ['Inspection finding','Thickness below alert','Thickness below minimum','Remaining life low','High corrosion rate','Failed PSV test','Failed SIS/SIF proof test','Failed interlock test','Failed critical alarm test','Failed calibration','Failed PM','Equipment damage','Leak','Crack / indication','Corrosion','Erosion','CUI concern','Mechanical damage','Missing certificate','Missing document','Overdue inspection','Overdue PM','Overdue calibration','Overdue proof test','Active expired bypass','Broken/missing seal','Isolation valve wrong position','Missing relief protection','Technical data gap','Startup readiness blocker','Regulatory compliance gap','Other'];
const deviationTypes = ['Temporary operation with restriction','Inspection interval extension','PM interval extension','Calibration interval extension','Proof test interval extension','Temporary repair','Temporary control','Temporary bypass-related deviation','Missing document/certificate temporary acceptance','Equipment operating outside normal envelope','Fitness-for-service temporary acceptance','Startup with approved condition','Other'];
const deficiencyStatuses = ['Draft','Submitted','Under Review','Approved','Action Assigned','In Progress','Waiting on MOC','Waiting on Shutdown','Waiting on Parts','Temporary Control Active','Ready for Verification','Verification Failed','Verified','Closed','Rejected','Cancelled'];
const deviationStatuses = ['Draft','Submitted','Pending Approval','Approved','Active','Expiring Soon','Expired','Extension Requested','Extension Approved','Pending Closure Verification','Closed','Rejected','Cancelled'];
const severityLevels = ['Low','Medium','High','Critical'];
const riskLevels = ['Low','Medium','High','Critical'];
const closedDeficiencyStatuses = ['Closed','Rejected','Cancelled'];
const closedDeviationStatuses = ['Closed','Rejected','Cancelled'];

@Injectable()
export class MiDeficiencyService {
  constructor(
    private readonly db: SupabaseService,
    private readonly equipment: EquipmentService,
    private readonly audit: AuditService
  ) {}

  async listDeficiencies(user: RequestUser, query: Query) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    let request = this.applyScope(this.db.from('mi_deficiencies').select('*', { count: 'exact' }), user, query);
    request = this.applyDeficiencyFilters(request, query);
    const { data, error, count } = await request.order(this.sortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] !== 'desc' }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: await this.summary(user, query),
      savedViews: ['All Open','Critical','Overdue','Startup Blockers','Pending Review','Pending Approval','Pending Verification','Active Deviations','Expired Deviations','Temporary Repairs','FFS Required','MOC Required','My Items','Closed'],
      lastUpdated: new Date().toISOString()
    };
  }

  async summary(user: RequestUser, query: Query) {
    await this.refreshDeviationExpiry(user);
    const deficiencies = await this.db.many<any>(this.applyDeficiencyFilters(this.applyScope(this.db.from('mi_deficiencies').select('*'), user, query), query).limit(1000)).catch(() => []);
    const deviations = await this.db.many<any>(this.applyScope(this.db.from('mi_deviations').select('*'), user, query).limit(1000)).catch(() => []);
    const now = new Date();
    return {
      totalOpenDeficiencies: deficiencies.filter((row) => !closedDeficiencyStatuses.includes(row.status)).length,
      criticalDeficiencies: deficiencies.filter((row) => row.severity === 'Critical' || row.risk_level === 'Critical').length,
      highSeverityDeficiencies: deficiencies.filter((row) => row.severity === 'High').length,
      startupBlockers: deficiencies.filter((row) => row.startup_blocker).length,
      overdueDeficiencies: deficiencies.filter((row) => row.due_date && new Date(row.due_date) < now && !closedDeficiencyStatuses.includes(row.status)).length,
      pendingReview: deficiencies.filter((row) => row.status === 'Submitted' || row.status === 'Under Review').length,
      pendingApproval: deficiencies.filter((row) => row.status === 'Approved' || row.status === 'Under Review').length,
      pendingVerification: deficiencies.filter((row) => row.status === 'Ready for Verification').length,
      closedThisMonth: deficiencies.filter((row) => row.closed_at && new Date(row.closed_at).getMonth() === now.getMonth()).length,
      activeDeviations: deviations.filter((row) => ['Approved','Active','Expiring Soon'].includes(row.status)).length,
      expiringDeviations: deviations.filter((row) => row.status === 'Expiring Soon').length,
      expiredDeviations: deviations.filter((row) => row.status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < now && !closedDeviationStatuses.includes(row.status))).length,
      temporaryRepairsActive: deviations.filter((row) => /temporary repair/i.test(row.deviation_type) && !closedDeviationStatuses.includes(row.status)).length,
      ffsRequired: deficiencies.filter((row) => row.ffs_required).length,
      mocRequiredSuggested: deficiencies.filter((row) => row.moc_required || row.moc_suggested).length,
      linkedActionsOpen: deficiencies.filter((row) => row.status === 'Action Assigned' || row.status === 'In Progress').length,
      linkedWorkOrdersOpen: deficiencies.filter((row) => row.status === 'Waiting on Parts' || row.status === 'Waiting on Shutdown').length,
      equipmentNotFitForService: deficiencies.filter((row) => row.fitness_for_service_impact === 'Not Fit for Service').length,
      equipmentFitWithRestrictions: deficiencies.filter((row) => row.fitness_for_service_impact === 'Fit With Restrictions').length
    };
  }

  async deficiencyDetail(user: RequestUser, id: string) {
    const row = await this.getDeficiency(user, id);
    const [controls, approvals, verifications, linkedRecords, history] = await Promise.all([
      this.db.many<any>(this.db.from('mi_deficiency_temporary_controls').select('*').eq('deficiency_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.db.many<any>(this.db.from('mi_deficiency_approvals').select('*').eq('deficiency_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.db.many<any>(this.db.from('mi_deficiency_verifications').select('*').eq('deficiency_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.linkedRecords(user, id),
      this.history(user, id)
    ]);
    return {
      deficiency: row,
      controls,
      approvals,
      verifications,
      linkedRecords,
      history,
      readOnly: row.read_only || closedDeficiencyStatuses.includes(row.status),
      readiness: this.deficiencyReadiness(row, controls, linkedRecords, verifications)
    };
  }

  async createDeficiency(user: RequestUser, body: Record<string, any>) {
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id);
    const payload = await this.deficiencyPayload(user, equipment, body, false);
    this.validateDeficiency(payload);
    const row = await this.db.single<any>(this.db.from('mi_deficiencies').insert(payload).select().single());
    await this.upsertTemporaryControl(user, row, body).catch(() => null);
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Created', 'Deficiency created', null, row);
    return this.deficiencyDetail(user, row.id);
  }

  async updateDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeficiency(user, id);
    this.assertDeficiencyEditable(before);
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id ?? before.equipment_id);
    const payload = await this.deficiencyPayload(user, equipment, { ...before, ...body }, true);
    this.validateDeficiency(payload);
    const row = await this.db.single<any>(this.db.from('mi_deficiencies').update(payload).eq('id', id).select().single());
    await this.upsertTemporaryControl(user, row, body).catch(() => null);
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Updated', 'Deficiency updated', before, row);
    return this.deficiencyDetail(user, id);
  }

  submitDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    return this.deficiencyTransition(user, id, 'Submitted', 'Submitted', 'Deficiency submitted for review', body, { submitted_at: new Date().toISOString() });
  }

  reviewDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    return this.deficiencyTransition(user, id, 'Under Review', 'Review Started', 'Deficiency review started', body, { reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? user.id });
  }

  async approveDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeficiency(user, id);
    await this.addApproval(user, before, null, body, 'Approved');
    return this.deficiencyTransition(user, id, 'Approved', 'Approved', 'Deficiency approved', body, { approver_user_id: user.id, approved_at: new Date().toISOString() });
  }

  async rejectDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Rejection reason is required.');
    const before = await this.getDeficiency(user, id);
    await this.addApproval(user, before, null, body, 'Rejected');
    return this.deficiencyTransition(user, id, 'Rejected', 'Rejected', 'Deficiency rejected', body, { rejected_reason: body.reason ?? body.comments, read_only: true });
  }

  async verifyDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeficiency(user, id);
    const result = String(body.verificationResult ?? body.verification_result ?? 'Verified');
    const verification = await this.db.single<any>(this.db.from('mi_deficiency_verifications').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      deficiency_id: id,
      correction_completed: body.correctionCompleted ?? body.correction_completed ?? false,
      verification_method: body.verificationMethod ?? body.verification_method ?? null,
      verification_date: body.verificationDate ?? body.verification_date ?? new Date().toISOString().slice(0, 10),
      verified_by: body.verifiedBy ?? body.verified_by ?? user.id,
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? null,
      linked_test_record_id: body.linkedTestRecordId ?? body.linked_test_record_id ?? null,
      linked_inspection_record_id: body.linkedInspectionRecordId ?? body.linked_inspection_record_id ?? null,
      action_completed: body.actionCompleted ?? body.action_completed ?? false,
      temporary_controls_removed: body.temporaryControlsRemoved ?? body.temporary_controls_removed ?? false,
      equipment_restored_to_normal: body.equipmentRestoredToNormal ?? body.equipment_restored_to_normal ?? false,
      readiness_impact_cleared: body.readinessImpactCleared ?? body.readiness_impact_cleared ?? false,
      verification_result: result,
      closure_notes: body.closureNotes ?? body.closure_notes ?? null
    }).select().single());
    const status = /fail|reject/i.test(result) ? 'Verification Failed' : 'Verified';
    const row = await this.patchDeficiency(user, before, status, { verified_at: new Date().toISOString() });
    await this.writeEvent(user, row, status, 'Deficiency verification completed', before, { row, verification });
    return this.deficiencyDetail(user, id);
  }

  async closeDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeficiency(user, id);
    const detail = await this.deficiencyDetail(user, id);
    const blockers = detail.readiness.blockers;
    const requiredLinks = await this.linkedRecords(user, id);
    const openRequired = requiredLinks.filter((link) => link.required_for_close && /open|pending|in progress|not started|draft/i.test(String(link.status_snapshot ?? 'Open')));
    if (openRequired.length && !body.override) throw new BadRequestException('Cannot close deficiency: required linked action/work order/MOC/document is still open.');
    if (blockers.length && !body.override) throw new BadRequestException(`Cannot close deficiency: ${blockers.join(' ')}`);
    const row = await this.patchDeficiency(user, before, 'Closed', { closed_at: new Date().toISOString(), read_only: true });
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Closed', 'Deficiency closed', before, row);
    return this.deficiencyDetail(user, id);
  }

  cancelDeficiency(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Cancellation reason is required.');
    return this.deficiencyTransition(user, id, 'Cancelled', 'Cancelled', 'Deficiency cancelled', body, { cancel_reason: body.reason ?? body.comments, read_only: true });
  }

  async listDeviations(user: RequestUser, query: Query) {
    await this.refreshDeviationExpiry(user);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.applyScope(this.db.from('mi_deviations').select('*', { count: 'exact' }), user, query);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    if (query.status) request = request.eq('status', query.status);
    if (query.search) request = request.or(`record_number.ilike.%${query.search}%,title.ilike.%${query.search}%,deviation_type.ilike.%${query.search}%`);
    const { data, error, count } = await request.order('updated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, limit, total: count ?? data?.length ?? 0, summary: await this.summary(user, query), lastUpdated: new Date().toISOString() };
  }

  async deviationDetail(user: RequestUser, id: string) {
    const deviation = await this.getDeviation(user, id);
    const [approvals, linkedRecords, history] = await Promise.all([
      this.db.many<any>(this.db.from('mi_deficiency_approvals').select('*').eq('deviation_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.deviationLinkedRecords(user, id),
      this.deviationHistory(user, id)
    ]);
    return { deviation, approvals, linkedRecords, history, readOnly: deviation.read_only || closedDeviationStatuses.includes(deviation.status), readiness: this.deviationReadiness(deviation, linkedRecords) };
  }

  async createDeviation(user: RequestUser, body: Record<string, any>) {
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id);
    const payload = await this.deviationPayload(user, equipment, body, false);
    this.validateDeviation(payload);
    const row = await this.db.single<any>(this.db.from('mi_deviations').insert(payload).select().single());
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Created', 'Deviation created', null, row, true);
    return this.deviationDetail(user, row.id);
  }

  async updateDeviation(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeviation(user, id);
    if (closedDeviationStatuses.includes(before.status)) throw new BadRequestException('Closed/rejected/cancelled deviations are read-only.');
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id ?? before.equipment_id);
    const payload = await this.deviationPayload(user, equipment, { ...before, ...body }, true);
    this.validateDeviation(payload);
    const row = await this.db.single<any>(this.db.from('mi_deviations').update(payload).eq('id', id).select().single());
    await this.writeEvent(user, row, 'Updated', 'Deviation updated', before, row, true);
    return this.deviationDetail(user, id);
  }

  async approveDeviation(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeviation(user, id);
    await this.addApproval(user, null, before, body, 'Approved');
    const row = await this.patchDeviation(user, before, 'Active', { approved_by: user.id, approved_at: new Date().toISOString() });
    await this.writeEvent(user, row, 'Approved', 'Deviation approved', before, row, true);
    return this.deviationDetail(user, id);
  }

  async submitDeviation(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeviation(user, id);
    if (closedDeviationStatuses.includes(before.status)) throw new BadRequestException('Closed/rejected/cancelled deviations are read-only.');
    const row = await this.patchDeviation(user, before, 'Submitted', { submitted_at: new Date().toISOString(), owner_user_id: body.ownerUserId ?? body.owner_user_id ?? before.owner_user_id });
    await this.writeEvent(user, row, 'Submitted', 'Deviation submitted for approval', before, row, true);
    return this.deviationDetail(user, id);
  }

  async rejectDeviation(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Deviation rejection reason is required.');
    const before = await this.getDeviation(user, id);
    await this.addApproval(user, null, before, body, 'Rejected');
    const row = await this.patchDeviation(user, before, 'Rejected', { rejection_reason: body.reason ?? body.comments, read_only: true });
    await this.writeEvent(user, row, 'Rejected', 'Deviation rejected', before, row, true);
    return this.deviationDetail(user, id);
  }

  async requestDeviationExtension(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Deviation extension reason is required.');
    const before = await this.getDeviation(user, id);
    const row = await this.patchDeviation(user, before, 'Extension Requested', {
      expiry_date: body.expiryDate ?? body.expiry_date ?? before.expiry_date,
      extension_reason: body.reason ?? body.comments,
      extension_requested_at: new Date().toISOString()
    });
    await this.writeEvent(user, row, 'Extension Requested', 'Deviation extension requested', before, row, true);
    return this.deviationDetail(user, id);
  }

  async approveDeviationExtension(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeviation(user, id);
    const now = new Date().toISOString();
    const row = await this.patchDeviation(user, before, 'Extension Approved', {
      expiry_date: body.expiryDate ?? body.expiry_date ?? before.expiry_date,
      approved_by: user.id,
      approved_at: now,
      extension_approved_at: now,
      extension_reason: body.reason ?? body.comments ?? before.extension_reason ?? null
    });
    await this.writeEvent(user, row, 'Extension Approved', 'Deviation extension approved', before, row, true);
    return this.deviationDetail(user, id);
  }

  async closeDeviation(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.getDeviation(user, id);
    const readiness = this.deviationReadiness(before, await this.deviationLinkedRecords(user, id));
    if (readiness.blockers.length && !body.override) throw new BadRequestException(`Cannot close deviation: ${readiness.blockers.join(' ')}`);
    const row = await this.patchDeviation(user, before, 'Closed', { closed_by: user.id, closed_at: new Date().toISOString(), read_only: true });
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Closed', 'Deviation closed', before, row, true);
    return this.deviationDetail(user, id);
  }

  async linkedRecords(user: RequestUser, id: string) {
    await this.getDeficiency(user, id);
    return this.db.many<any>(this.db.from('mi_deficiency_linked_records').select('*').eq('deficiency_id', id).order('created_at', { ascending: false })).catch(() => []);
  }

  async addLinkedRecord(user: RequestUser, id: string, body: Record<string, any>) {
    const deficiency = await this.getDeficiency(user, id);
    if (!(body.linkedModule ?? body.linked_module) || !(body.linkedRecordId ?? body.linked_record_id)) throw new BadRequestException('Linked module and record ID are required.');
    const row = await this.db.single<any>(this.db.from('mi_deficiency_linked_records').insert({
      company_id: deficiency.company_id,
      site_id: deficiency.site_id,
      deficiency_id: id,
      linked_module: body.linkedModule ?? body.linked_module,
      linked_record_id: body.linkedRecordId ?? body.linked_record_id,
      linked_record_number: body.linkedRecordNumber ?? body.linked_record_number ?? null,
      relationship_type: body.relationshipType ?? body.relationship_type ?? 'Reference',
      required_for_close: body.requiredForClose ?? body.required_for_close ?? false,
      status_snapshot: body.statusSnapshot ?? body.status_snapshot ?? null,
      created_by: user.id
    }).select().single());
    await this.writeEvent(user, deficiency, 'Linked', 'Linked record added', null, row);
    return row;
  }

  async removeLinkedRecord(user: RequestUser, id: string, linkId: string) {
    const deficiency = await this.getDeficiency(user, id);
    const before = await this.db.single<any>(this.db.from('mi_deficiency_linked_records').select('*').eq('id', linkId).eq('deficiency_id', id).maybeSingle());
    if (!before) throw new NotFoundException('Linked record not found.');
    await this.db.single<any>(this.db.from('mi_deficiency_linked_records').delete().eq('id', linkId).select('id').single());
    await this.writeEvent(user, deficiency, 'Unlinked', 'Linked record removed', before, null);
    return { ok: true };
  }

  history(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_deficiency_history_events').select('*').eq('deficiency_id', id), user, {}).order('created_at', { ascending: false }).limit(200)).catch(() => []);
  }

  lookups() {
    return { deficiencyTypes, deviationTypes, deficiencyStatuses, deviationStatuses, severityLevels, riskLevels };
  }

  importTemplate() {
    return Promise.resolve({ fileName: 'mi-deficiency-import-template.csv', content: this.csv([], ['record_number','equipment_id','title','deficiency_type','severity','risk_level','status','due_date','startup_blocker','moc_required']) });
  }

  async exportDeficiencies(user: RequestUser, query: Query) {
    const rows = (await this.listDeficiencies(user, { ...query, limit: '1000' })).rows;
    return { fileName: 'mi-deficiencies.csv', content: this.csv(rows, ['record_number','record_kind','title','equipment_id','source_module','severity','risk_level','status','fitness_for_service_impact','startup_blocker','due_date','owner_user_id','moc_required','pssr_impact','updated_at']) };
  }

  async exportDeficiency(user: RequestUser, id: string) {
    const detail = await this.deficiencyDetail(user, id);
    return { fileName: `${detail.deficiency.record_number ?? id}.csv`, content: this.csv([detail.deficiency], ['record_number','record_kind','title','equipment_id','source_module','severity','risk_level','status','fitness_for_service_impact','startup_blocker','operation_allowed','operation_restrictions','ffs_required','moc_required','pssr_impact','lopa_sil_impact','due_date','target_closure_date','owner_user_id','updated_at']) };
  }

  async exportDeviations(user: RequestUser, query: Query) {
    const rows = (await this.listDeviations(user, { ...query, limit: '1000' })).rows;
    return { fileName: 'mi-deviations.csv', content: this.csv(rows, ['record_number','deviation_type','title','equipment_id','status','start_date','expiry_date','owner_user_id','approved_by','updated_at']) };
  }

  async importDeficiencies(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const siteId = body.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? user.siteIds?.[0] ?? null;
    const job = await this.db.single<any>(this.db.from('mi_deficiency_import_jobs').insert({
      company_id: user.tenantId,
      site_id: siteId,
      uploaded_by: user.id,
      file_name: body.fileName ?? 'mi-deficiencies-import.csv',
      file_key: body.fileKey ?? null,
      status: rows.length ? 'Validated' : 'Uploaded',
      total_rows: rows.length,
      valid_rows: rows.filter((row: any) => row.equipmentId ?? row.equipment_id).length,
      error_rows: rows.filter((row: any) => !(row.equipmentId ?? row.equipment_id)).length
    }).select().single());
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'MI_DEFICIENCY_IMPORT_CREATED', entityType: 'mi_deficiency_import_job', entityId: job.id, after: job as JsonValue }).catch(() => null);
    return { job, rowsAccepted: rows.length, message: 'Import job created. Commit/import row processing can be wired to background workers without changing the API contract.' };
  }

  private async deficiencyTransition(user: RequestUser, id: string, status: string, eventType: string, title: string, body: Record<string, any>, patch: Record<string, any> = {}) {
    const before = await this.getDeficiency(user, id);
    this.assertDeficiencyEditable(before);
    const row = await this.patchDeficiency(user, before, status, patch);
    await this.updateEquipmentDeficiencyImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, eventType, title, before, row);
    return this.deficiencyDetail(user, id);
  }

  private async patchDeficiency(user: RequestUser, before: any, status: string, patch: Record<string, any>) {
    return this.db.single<any>(this.db.from('mi_deficiencies').update({ ...patch, status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', before.id).select().single());
  }

  private async patchDeviation(user: RequestUser, before: any, status: string, patch: Record<string, any>) {
    return this.db.single<any>(this.db.from('mi_deviations').update({ ...patch, status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', before.id).select().single());
  }

  private async deficiencyPayload(user: RequestUser, equipment: any, body: Record<string, any>, update: boolean) {
    const severity = body.severity ?? 'Medium';
    const riskLevel = body.riskLevel ?? body.risk_level ?? severity;
    return {
      company_id: user.tenantId,
      site_id: equipment.siteId ?? equipment.site_id ?? user.selectedSiteId ?? user.activeSiteId,
      equipment_id: equipment.id,
      cml_id: body.cmlId ?? body.cml_id ?? null,
      safeguard_type: body.safeguardType ?? body.safeguard_type ?? null,
      safeguard_id: body.safeguardId ?? body.safeguard_id ?? null,
      record_number: body.recordNumber ?? body.record_number ?? (update ? body.record_number : await this.nextNumber('mi_deficiencies', 'MI-DEF', equipment.siteId ?? equipment.site_id ?? user.selectedSiteId ?? user.activeSiteId, user.tenantId)),
      record_kind: 'Deficiency',
      title: body.title,
      description: body.description ?? null,
      deficiency_type: body.deficiencyType ?? body.deficiency_type,
      source_module: body.sourceModule ?? body.source_module ?? null,
      source_record_id: body.sourceRecordId ?? body.source_record_id ?? null,
      source_record_number: body.sourceRecordNumber ?? body.source_record_number ?? null,
      source_summary: body.sourceSummary ?? body.source_summary ?? null,
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? body.documentId ?? body.document_id ?? null,
      location_description: body.locationDescription ?? body.location_description ?? null,
      observed_condition: body.observedCondition ?? body.observed_condition ?? null,
      required_condition: body.requiredCondition ?? body.required_condition ?? null,
      immediate_action_taken: body.immediateActionTaken ?? body.immediate_action_taken ?? null,
      severity,
      risk_level: riskLevel,
      consequence_if_not_corrected: body.consequenceIfNotCorrected ?? body.consequence_if_not_corrected ?? body.consequenceDescription ?? null,
      probability_of_worsening: body.probabilityOfWorsening ?? body.probability_of_worsening ?? null,
      critical_equipment: body.criticalEquipment ?? body.critical_equipment ?? body.criticalFlag ?? equipment.criticality === 'SAFETY_CRITICAL',
      safety_critical_impact: body.safetyCriticalImpact ?? body.safety_critical_impact ?? false,
      psm_critical_impact: body.psmCriticalImpact ?? body.psm_critical_impact ?? body.psmImpact ?? false,
      environmental_impact: body.environmentalImpact ?? body.environmental_impact ?? false,
      production_impact: body.productionImpact ?? body.production_impact ?? false,
      regulatory_impact: body.regulatoryImpact ?? body.regulatory_impact ?? false,
      fitness_for_service_impact: body.fitnessForServiceImpact ?? body.fitness_for_service_impact ?? null,
      startup_blocker: body.startupBlocker ?? body.startup_blocker ?? false,
      operation_allowed: body.operationAllowed ?? body.operation_allowed ?? true,
      operation_restrictions: body.operationRestrictions ?? body.operation_restrictions ?? null,
      ffs_required: body.ffsRequired ?? body.ffs_required ?? ['High','Critical'].includes(String(riskLevel)),
      engineering_review_required: body.engineeringReviewRequired ?? body.engineering_review_required ?? ['High','Critical'].includes(String(riskLevel)),
      moc_required: body.mocRequired ?? body.moc_required ?? false,
      moc_suggested: body.mocSuggested ?? body.moc_suggested ?? false,
      pssr_impact: body.pssrImpact ?? body.pssr_impact ?? false,
      lopa_sil_impact: body.lopaSilImpact ?? body.lopa_sil_impact ?? false,
      due_date: body.dueDate ?? body.due_date ?? null,
      target_closure_date: body.targetClosureDate ?? body.target_closure_date ?? null,
      status: body.status ?? 'Draft',
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? null,
      approver_user_id: body.approverUserId ?? body.approver_user_id ?? null,
      reported_by: body.reportedBy ?? body.reported_by ?? user.id,
      discovery_date: body.discoveryDate ?? body.discovery_date ?? new Date().toISOString().slice(0, 10),
      universal_action_id: body.universalActionId ?? body.universal_action_id ?? null,
      work_order_id: body.workOrderId ?? body.work_order_id ?? null,
      moc_id: body.mocId ?? body.moc_id ?? null,
      inspection_record_id: body.inspectionRecordId ?? body.inspection_record_id ?? null,
      pm_record_id: body.pmRecordId ?? body.pm_record_id ?? null,
      calibration_record_id: body.calibrationRecordId ?? body.calibration_record_id ?? null,
      relief_test_id: body.reliefTestId ?? body.relief_test_id ?? null,
      safeguard_test_id: body.sifProofTestId ?? body.safeguardTestId ?? body.safeguard_test_id ?? null,
      impairment_id: body.impairmentId ?? body.impairment_id ?? null,
      created_by: update ? body.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
  }

  private async deviationPayload(user: RequestUser, equipment: any, body: Record<string, any>, update: boolean) {
    return {
      company_id: user.tenantId,
      site_id: equipment.siteId ?? equipment.site_id ?? user.selectedSiteId ?? user.activeSiteId,
      equipment_id: equipment.id,
      record_number: body.recordNumber ?? body.record_number ?? (update ? body.record_number : await this.nextNumber('mi_deviations', 'MI-DEV', equipment.siteId ?? equipment.site_id ?? user.selectedSiteId ?? user.activeSiteId, user.tenantId)),
      deviation_type: body.deviationType ?? body.deviation_type,
      title: body.title,
      normal_requirement: body.normalRequirement ?? body.normal_requirement ?? null,
      requested_deviation: body.requestedDeviation ?? body.requested_deviation,
      reason: body.reason ?? null,
      risk_assessment_json: body.riskAssessment ?? body.risk_assessment_json ?? {},
      temporary_controls_json: body.temporaryControls ?? body.temporary_controls_json ?? {},
      start_date: body.startDate ?? body.start_date ?? new Date().toISOString().slice(0, 10),
      expiry_date: body.expiryDate ?? body.expiry_date,
      extension_allowed: body.extensionAllowed ?? body.extension_allowed ?? false,
      extension_limit_value: body.extensionLimitValue ?? body.extension_limit_value ?? null,
      extension_limit_unit: body.extensionLimitUnit ?? body.extension_limit_unit ?? null,
      status: body.status ?? 'Draft',
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      approver_user_id: body.approverUserId ?? body.approver_user_id ?? null,
      closure_requirement: body.closureRequirement ?? body.closure_requirement ?? null,
      created_by: update ? body.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
  }

  private validateDeficiency(payload: Record<string, any>) {
    if (!payload.equipment_id) throw new BadRequestException('Equipment is required.');
    if (!payload.title) throw new BadRequestException('Title is required.');
    if (!payload.deficiency_type) throw new BadRequestException('Deficiency type is required.');
    if (!payload.severity) throw new BadRequestException('Severity is required.');
    if (!payload.risk_level) throw new BadRequestException('Risk level is required.');
    if (['High','Critical'].includes(payload.severity) || ['High','Critical'].includes(payload.risk_level)) {
      if (!payload.owner_user_id) throw new BadRequestException('High/Critical deficiencies require an owner.');
      if (!payload.due_date) throw new BadRequestException('High/Critical deficiencies require a due date.');
    }
    if (payload.startup_blocker && !payload.operation_restrictions && !payload.consequence_if_not_corrected) throw new BadRequestException('Startup blocker deficiencies require a reason/restriction or consequence.');
    if (payload.operation_allowed && ['High','Critical'].includes(payload.risk_level) && !payload.operation_restrictions) throw new BadRequestException('High-risk continued operation requires restrictions or temporary controls.');
    if (payload.operation_allowed && ['High','Critical'].includes(payload.risk_level) && !payload.owner_user_id) throw new BadRequestException('High-risk continued operation requires an owner for temporary controls/correction.');
  }

  private validateDeviation(payload: Record<string, any>) {
    if (!payload.equipment_id) throw new BadRequestException('Equipment is required.');
    if (!payload.title) throw new BadRequestException('Deviation title is required.');
    if (!payload.deviation_type) throw new BadRequestException('Deviation type is required.');
    if (!payload.requested_deviation) throw new BadRequestException('Requested deviation is required.');
    if (!payload.expiry_date) throw new BadRequestException('Deviation expiry date is required.');
    if (new Date(payload.expiry_date) < new Date(String(payload.start_date ?? new Date().toISOString().slice(0, 10)))) throw new BadRequestException('Deviation expiry date cannot be before start date.');
  }

  private deficiencyReadiness(row: any, controls: any[], linkedRecords: any[], verifications: any[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (['High','Critical'].includes(row.risk_level) && !row.owner_user_id) blockers.push('High/Critical deficiency requires owner.');
    if (['High','Critical'].includes(row.risk_level) && !row.due_date) blockers.push('High/Critical deficiency requires due date.');
    if (row.startup_blocker) blockers.push('Startup blocker must be cleared before close/startup.');
    if (row.moc_required && !linkedRecords.some((item) => /moc/i.test(item.linked_module) && !/open|pending/i.test(String(item.status_snapshot ?? '')))) blockers.push('Required MOC must be linked/closed or overridden.');
    if (row.operation_allowed && ['High','Critical'].includes(row.risk_level) && !controls.some((control) => control.control_required || control.control_description)) warnings.push('Temporary controls should be recorded for high-risk continued operation.');
    if (row.status === 'Ready for Verification' && !verifications.some((item) => item.verification_result === 'Verified')) blockers.push('Verification is required before closure.');
    return { status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready', blockers, warnings };
  }

  private deviationReadiness(row: any, linkedRecords: any[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (new Date(row.expiry_date) < new Date() && !closedDeviationStatuses.includes(row.status)) blockers.push('Deviation is expired.');
    if (row.status === 'Draft') blockers.push('Deviation must be approved before active operation.');
    if (!row.owner_user_id) warnings.push('Deviation owner is not assigned.');
    if (!linkedRecords.length) warnings.push('No supporting links/documents are recorded.');
    return { status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready', blockers, warnings };
  }

  private async resolveEquipment(user: RequestUser, equipmentId: string) {
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.equipment.get(user.tenantId, equipmentId, user.siteIds);
    if (!equipment) throw new BadRequestException('Equipment was not found or is outside your company/site access.');
    return equipment;
  }

  private async getDeficiency(user: RequestUser, id: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_deficiencies').select('*').eq('id', id), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Deficiency was not found or is outside your company/site access.');
    return row;
  }

  private async getDeviation(user: RequestUser, id: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_deviations').select('*').eq('id', id), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Deviation was not found or is outside your company/site access.');
    return row;
  }

  private assertDeficiencyEditable(row: any) {
    if (row.read_only || closedDeficiencyStatuses.includes(row.status)) throw new BadRequestException('Closed/rejected/cancelled deficiencies are read-only.');
  }

  private applyScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) scoped = scoped.eq('site_id', siteId);
    else if (user.siteIds?.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyDeficiencyFilters(request: any, query: Query) {
    let scoped = request;
    if (query.equipmentId) scoped = scoped.eq('equipment_id', query.equipmentId);
    if (query.status) scoped = scoped.eq('status', query.status);
    if (query.type || query.deficiencyType) scoped = scoped.eq('deficiency_type', query.type ?? query.deficiencyType);
    if (query.sourceModule) scoped = scoped.eq('source_module', query.sourceModule);
    if (query.sourceRecordId) scoped = scoped.eq('source_record_id', query.sourceRecordId);
    if (query.severity) scoped = scoped.eq('severity', query.severity);
    if (query.riskLevel) scoped = scoped.eq('risk_level', query.riskLevel);
    if (query.owner) scoped = scoped.eq('owner_user_id', query.owner);
    if (query.startupBlocker === 'true') scoped = scoped.eq('startup_blocker', true);
    if (query.ffsRequired === 'true') scoped = scoped.eq('ffs_required', true);
    if (query.mocRequired === 'true') scoped = scoped.eq('moc_required', true);
    if (query.search) scoped = scoped.or(`record_number.ilike.%${query.search}%,title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    if (query.view === 'open' || query.closed === 'false') scoped = scoped.not('status', 'in', '("Closed","Rejected","Cancelled")');
    if (query.view === 'critical' || query.critical === 'true') scoped = scoped.or('severity.eq.Critical,risk_level.eq.Critical');
    if (query.view === 'overdue' || query.overdue === 'true') scoped = scoped.lt('due_date', new Date().toISOString().slice(0, 10)).not('status', 'in', '("Closed","Rejected","Cancelled")');
    return scoped;
  }

  private async addApproval(user: RequestUser, deficiency: any | null, deviation: any | null, body: Record<string, any>, action: string) {
    const target = deficiency ?? deviation;
    return this.db.single<any>(this.db.from('mi_deficiency_approvals').insert({
      company_id: target.company_id,
      site_id: target.site_id,
      deficiency_id: deficiency?.id ?? null,
      deviation_id: deviation?.id ?? null,
      approval_stage: body.approvalStage ?? body.approval_stage ?? 'Review',
      approver_role: body.approverRole ?? body.approver_role ?? null,
      approver_user_id: user.id,
      action,
      comments: body.comments ?? body.reason ?? null,
      e_signature_id: body.eSignatureId ?? body.e_signature_id ?? null
    }).select().single()).catch(() => null);
  }

  private async upsertTemporaryControl(user: RequestUser, deficiency: any, body: Record<string, any>) {
    if (!(body.temporaryControlRequired ?? body.control_required ?? body.controlDescription ?? body.control_description)) return null;
    return this.db.single<any>(this.db.from('mi_deficiency_temporary_controls').insert({
      company_id: deficiency.company_id,
      site_id: deficiency.site_id,
      deficiency_id: deficiency.id,
      control_required: body.temporaryControlRequired ?? body.control_required ?? true,
      control_description: body.controlDescription ?? body.control_description ?? null,
      reduced_operating_envelope: body.reducedOperatingEnvelope ?? body.reduced_operating_envelope ?? false,
      additional_monitoring: body.additionalMonitoring ?? body.additional_monitoring ?? false,
      temporary_repair: body.temporaryRepair ?? body.temporary_repair ?? false,
      extra_inspection_required: body.extraInspectionRequired ?? body.extra_inspection_required ?? false,
      manual_check_required: body.manualCheckRequired ?? body.manual_check_required ?? false,
      operator_instruction: body.operatorInstruction ?? body.operator_instruction ?? null,
      expiry_date: body.controlExpiryDate ?? body.expiry_date ?? null,
      owner_user_id: body.controlOwnerUserId ?? body.control_owner_user_id ?? body.ownerUserId ?? body.owner_user_id ?? null
    }).select().single());
  }

  private async updateEquipmentDeficiencyImpact(user: RequestUser, equipmentId: string) {
    const deficiencies = await this.db.many<any>(this.db.from('mi_deficiencies').select('id,severity,risk_level,startup_blocker,status,fitness_for_service_impact').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled")')).catch(() => []);
    const deviations = await this.db.many<any>(this.db.from('mi_deviations').select('id,status').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled")')).catch(() => []);
    const critical = deficiencies.filter((row) => row.severity === 'Critical' || row.risk_level === 'Critical').length;
    const startupBlocked = deficiencies.some((row) => row.startup_blocker);
    const fitnessStatus = startupBlocked ? 'Startup Blocked' : critical ? 'Not Fit for Service' : deficiencies.length || deviations.length ? 'Fit with Restrictions' : 'Fit for Service';
    await this.db.single<any>(this.db.from('Equipment').update({
      openDeficiencyCount: deficiencies.length,
      criticalDeficiencyCount: critical,
      overdueDeficiencyCount: deficiencies.filter((row) => row.status === 'Overdue').length,
      startupBlocked,
      startupBlockReason: startupBlocked ? 'Open MI startup-blocking deficiency.' : null,
      fitnessStatus,
      readinessStatus: startupBlocked || critical ? 'Blocked' : deficiencies.length || deviations.length ? 'Restricted' : 'Ready'
    }).eq('tenantId', user.tenantId).eq('id', equipmentId).select('id').single()).catch(() => null);
  }

  private async refreshDeviationExpiry(user: RequestUser) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.db.many<any>(this.applyScope(this.db.from('mi_deviations').select('*').in('status', ['Active','Expiring Soon','Approved']).lt('expiry_date', today), user, {}).limit(100)).catch(() => []);
    await Promise.all(rows.map(async (before) => {
      const row = await this.db.single<any>(this.db.from('mi_deviations').update({ status: 'Expired', updated_at: new Date().toISOString() }).eq('id', before.id).select().single()).catch(() => null);
      if (row) await this.writeEvent(user, row, 'Expired', 'Deviation expired', before, row, true);
    }));
  }

  private async writeEvent(user: RequestUser, target: any, eventType: string, title: string, before: unknown, after: unknown, deviation = false) {
    await this.db.single<any>(this.db.from('mi_deficiency_history_events').insert({
      company_id: target.company_id,
      site_id: target.site_id,
      deficiency_id: deviation ? null : target.id,
      deviation_id: deviation ? target.id : null,
      equipment_id: target.equipment_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: title,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: user.id,
      source_module: 'MechanicalIntegrity',
      source_record_id: target.id
    }).select().single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `MI_${deviation ? 'DEVIATION' : 'DEFICIENCY'}_${eventType.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, entityType: deviation ? 'mi_deviation' : 'mi_deficiency', entityId: target.id, before: (before ?? null) as JsonValue, after: (after ?? null) as JsonValue }).catch(() => null);
  }

  private async nextNumber(table: string, prefixBase: string, siteId: string, companyId: string) {
    const year = new Date().getFullYear();
    const prefix = `${prefixBase}-${year}-`;
    const rows = await this.db.many<any>(this.db.from(table).select('record_number').eq('company_id', companyId).eq('site_id', siteId).ilike('record_number', `${prefix}%`).order('record_number', { ascending: false }).limit(1)).catch(() => []);
    const last = Number(String(rows[0]?.record_number ?? '').split('-').pop() ?? 0);
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private sortColumn(raw: string) {
    const allowed: Record<string, string> = { recordNumber: 'record_number', title: 'title', status: 'status', severity: 'severity', riskLevel: 'risk_level', dueDate: 'due_date', updatedAt: 'updated_at', createdAt: 'created_at' };
    return allowed[raw] ?? raw ?? 'updated_at';
  }

  private deviationLinkedRecords(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_deficiency_linked_records').select('*').eq('deviation_id', id), user, {}).order('created_at', { ascending: false })).catch(() => []);
  }

  private deviationHistory(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_deficiency_history_events').select('*').eq('deviation_id', id), user, {}).order('created_at', { ascending: false }).limit(200)).catch(() => []);
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
