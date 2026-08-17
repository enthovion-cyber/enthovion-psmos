import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { EquipmentService } from '../equipment/equipment.service';

type Query = Record<string, string | undefined>;

const workOrderTypes = ['Corrective maintenance','Preventive maintenance follow-up','Inspection finding repair','Deficiency correction','Temporary repair','Permanent repair','PSV repair/retest','SIF/SIS repair/retest','Interlock repair/retest','Critical alarm repair/retest','Calibration correction','CML/TML reinspection action','Corrosion repair','Leak repair','Mechanical repair','Instrument repair','Electrical repair','Civil/structural repair','Document/certificate correction','Engineering review action','Fitness-for-service action','Startup readiness action','MOC implementation action','PSSR punch action','Other'];
const actionTypes = ['Corrective action','Preventive action','Verification action','Engineering review','Inspection action','Repair action','Risk reduction action','Temporary control action','Document action','Approval action','Follow-up action','Notification/escalation action','Management review action'];
const workCategories = ['Mechanical','Instrument','Electrical','Civil/Structural','Inspection','PSV/Relief','SIS/SIF','Interlock/Alarm','Calibration','Documentation','Engineering','Other'];
const workStatuses = ['Draft','Submitted','Waiting Approval','Approved','Planning','Waiting PTW','Waiting LOTO','Waiting Parts','Waiting Shutdown','Scheduled','Ready to Start','In Progress','On Hold','Completed','Pending Verification','Verification Failed','Verified','Closed','Rejected','Cancelled'];
const priorities = ['Low','Medium','High','Urgent','Emergency'];
const riskLevels = ['Low','Medium','High','Critical'];
const partsStatuses = ['Not Required','Required','Requested','Ordered','Partially Available','Available','Issued','Consumed','Not Available'];
const closedStatuses = ['Closed','Rejected','Cancelled'];

@Injectable()
export class MiWorkOrderService {
  constructor(
    private readonly db: SupabaseService,
    private readonly equipment: EquipmentService,
    private readonly actionsService: ActionsService,
    private readonly audit: AuditService
  ) {}

  async list(user: RequestUser, query: Query) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    let request = this.applyScope(this.db.from('mi_work_orders').select('*', { count: 'exact' }), user, query);
    request = this.applyFilters(request, query, user);
    const { data, error, count } = await request.order(this.sortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] !== 'desc' }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: await this.summary(user, query),
      savedViews: ['All Open','My Work','Critical','Overdue','Safety-Critical','Waiting Approval','Waiting PTW','Waiting LOTO','Waiting Parts','Waiting Shutdown','In Progress','Pending Verification','Startup Blockers','MOC Required','Closed'],
      lastUpdated: new Date().toISOString()
    };
  }

  async summary(user: RequestUser, query: Query) {
    const rows = await this.db.many<any>(this.applyFilters(this.applyScope(this.db.from('mi_work_orders').select('*'), user, query), query, user).limit(1000)).catch(() => []);
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    return {
      totalOpenWorkOrders: rows.filter((row) => !closedStatuses.includes(row.status)).length,
      criticalWorkOrders: rows.filter((row) => row.risk_level === 'Critical' || row.priority === 'Emergency').length,
      safetyCriticalWork: rows.filter((row) => row.safety_critical_work || row.psm_critical_work).length,
      overdueWorkOrders: rows.filter((row) => row.due_date && new Date(row.due_date) < now && !closedStatuses.includes(row.status)).length,
      dueThisWeek: rows.filter((row) => row.due_date && new Date(row.due_date) <= week && !closedStatuses.includes(row.status)).length,
      pendingPlanning: rows.filter((row) => ['Approved','Planning'].includes(row.status)).length,
      waitingApproval: rows.filter((row) => ['Submitted','Waiting Approval'].includes(row.status)).length,
      waitingPtw: rows.filter((row) => row.status === 'Waiting PTW' || (row.ptw_required && !row.linked_ptw_id)).length,
      waitingLoto: rows.filter((row) => row.status === 'Waiting LOTO' || (row.loto_required && !row.linked_loto_id)).length,
      waitingParts: rows.filter((row) => row.status === 'Waiting Parts' || ['Required','Requested','Ordered','Partially Available','Not Available'].includes(row.parts_status)).length,
      waitingShutdown: rows.filter((row) => row.status === 'Waiting Shutdown' || row.required_shutdown).length,
      inProgress: rows.filter((row) => row.status === 'In Progress').length,
      pendingVerification: rows.filter((row) => row.status === 'Pending Verification').length,
      failedVerification: rows.filter((row) => row.status === 'Verification Failed').length,
      closedThisMonth: rows.filter((row) => row.closed_at && new Date(row.closed_at).getMonth() === now.getMonth()).length,
      linkedDeficienciesOpen: rows.filter((row) => row.linked_deficiency_id && !closedStatuses.includes(row.status)).length,
      startupBlockerWork: rows.filter((row) => row.startup_blocker).length,
      mocRequiredWork: rows.filter((row) => row.moc_required).length,
      myAssignedWork: rows.filter((row) => row.assigned_user_id === user.id || row.owner_user_id === user.id).length,
      contractorAssignedWork: rows.filter((row) => !!row.contractor_vendor).length
    };
  }

  async detail(user: RequestUser, id: string) {
    const workOrder = await this.get(user, id);
    const [tasks, parts, executionLogs, verifications, linkedRecords, actionLinks, approvals, history] = await Promise.all([
      this.tasks(user, id),
      this.parts(user, id),
      this.db.many<any>(this.db.from('mi_work_order_execution_logs').select('*').eq('work_order_id', id).order('logged_at', { ascending: false })).catch(() => []),
      this.db.many<any>(this.db.from('mi_work_order_verifications').select('*').eq('work_order_id', id).order('created_at', { ascending: false })).catch(() => []),
      this.linkedRecords(user, id),
      this.actionLinks(user, id),
      this.db.many<any>(this.db.from('mi_work_order_approvals').select('*').eq('work_order_id', id).order('acted_at', { ascending: false })).catch(() => []),
      this.history(user, id)
    ]);
    return { workOrder, tasks, parts, executionLogs, verifications, linkedRecords, actionLinks, approvals, history, readOnly: workOrder.read_only || closedStatuses.includes(workOrder.status), readiness: this.readiness(workOrder, tasks, parts, verifications, linkedRecords) };
  }

  async create(user: RequestUser, body: Record<string, any>) {
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id);
    const payload = await this.payload(user, equipment, body, false);
    this.validate(payload);
    const row = await this.db.single<any>(this.db.from('mi_work_orders').insert(payload).select().single());
    await this.autoLinks(user, row, body).catch(() => null);
    await this.updateEquipmentImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Created', 'Work order created', null, row);
    return this.detail(user, row.id);
  }

  async update(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.get(user, id);
    this.assertEditable(before);
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id ?? before.equipment_id);
    const payload = await this.payload(user, equipment, { ...before, ...body }, true);
    this.validate(payload);
    const row = await this.db.single<any>(this.db.from('mi_work_orders').update(payload).eq('id', id).select().single());
    await this.updateEquipmentImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Updated', 'Work order updated', before, row);
    return this.detail(user, id);
  }

  submit(user: RequestUser, id: string, body: Record<string, any>) {
    return this.transition(user, id, 'Submitted', 'Submitted', 'Work order submitted', body, { submitted_at: new Date().toISOString() });
  }

  async approve(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.get(user, id);
    await this.addApproval(user, before, body, 'Approved');
    return this.transition(user, id, 'Approved', 'Approved', 'Work order approved', body, { approved_at: new Date().toISOString() });
  }

  async reject(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Rejection reason is required.');
    const before = await this.get(user, id);
    await this.addApproval(user, before, body, 'Rejected');
    return this.transition(user, id, 'Rejected', 'Rejected', 'Work order rejected', body, { rejected_reason: body.reason ?? body.comments, read_only: true });
  }

  plan(user: RequestUser, id: string, body: Record<string, any>) {
    if (body.plannedStartAt && body.plannedFinishAt && new Date(String(body.plannedFinishAt)) < new Date(String(body.plannedStartAt))) throw new BadRequestException('Planned finish cannot be before planned start.');
    return this.transition(user, id, 'Planning', 'Planned', 'Work order planning updated', body, this.planningPatch(body));
  }

  assign(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.assignedUserId ?? body.assigned_user_id ?? body.assignedTeamId ?? body.assigned_team_id)) throw new BadRequestException('Assigned user or team is required.');
    return this.transition(user, id, 'Scheduled', 'Assigned', 'Work order assigned', body, { assigned_user_id: body.assignedUserId ?? body.assigned_user_id ?? null, assigned_team_id: body.assignedTeamId ?? body.assigned_team_id ?? null });
  }

  async start(user: RequestUser, id: string, body: Record<string, any>) {
    const row = await this.get(user, id);
    const blockers = this.startBlockers(row);
    if (blockers.length && !body.override) throw new BadRequestException(`Cannot start work: ${blockers.join(' ')}`);
    return this.transition(user, id, 'In Progress', 'Started', 'Work order started', body, { started_at: new Date().toISOString() });
  }

  hold(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Hold reason is required.');
    return this.transition(user, id, 'On Hold', 'On Hold', 'Work order put on hold', body);
  }

  resume(user: RequestUser, id: string, body: Record<string, any>) {
    return this.transition(user, id, 'In Progress', 'Resumed', 'Work order resumed', body);
  }

  async complete(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.get(user, id);
    if (!(body.completionNotes ?? body.completion_notes)) throw new BadRequestException('Completion notes are required.');
    if (before.completion_evidence_required && !(body.evidenceDocumentId ?? body.evidence_document_id) && !body.override) throw new BadRequestException('Completion evidence is required.');
    const log = await this.db.single<any>(this.db.from('mi_work_order_execution_logs').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      work_order_id: id,
      actual_work_performed: body.actualWorkPerformed ?? body.actual_work_performed ?? null,
      parts_used_json: body.partsUsedJson ?? body.parts_used_json ?? null,
      measurements_json: body.measurementsJson ?? body.measurements_json ?? null,
      problems_found: body.problemsFound ?? body.problems_found ?? null,
      additional_findings: body.additionalFindings ?? body.additional_findings ?? null,
      completion_notes: body.completionNotes ?? body.completion_notes,
      result: body.result ?? 'Completed successfully',
      logged_by: user.id
    }).select().single());
    const status = before.verification_required || before.safety_critical_work ? 'Pending Verification' : 'Completed';
    const row = await this.patch(before, status, { completed_at: new Date().toISOString() });
    await this.writeEvent(user, row, 'Completed', 'Work order completed', before, { row, log });
    return this.detail(user, id);
  }

  async verify(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.get(user, id);
    const result = String(body.verificationResult ?? body.verification_result ?? 'Accepted');
    const verification = await this.db.single<any>(this.db.from('mi_work_order_verifications').insert({
      company_id: before.company_id,
      site_id: before.site_id,
      work_order_id: id,
      verification_method: body.verificationMethod ?? body.verification_method,
      verification_result: result,
      verified_by: body.verifiedBy ?? body.verified_by ?? user.id,
      verification_date: body.verificationDate ?? body.verification_date ?? new Date().toISOString().slice(0, 10),
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? null,
      linked_test_record_id: body.linkedTestRecordId ?? body.linked_test_record_id ?? null,
      linked_inspection_record_id: body.linkedInspectionRecordId ?? body.linked_inspection_record_id ?? null,
      equipment_restored: body.equipmentRestored ?? body.equipment_restored ?? false,
      deficiency_corrected: body.deficiencyCorrected ?? body.deficiency_corrected ?? false,
      temporary_controls_removed: body.temporaryControlsRemoved ?? body.temporary_controls_removed ?? false,
      readiness_impact_cleared: body.readinessImpactCleared ?? body.readiness_impact_cleared ?? false,
      startup_blocker_cleared: body.startupBlockerCleared ?? body.startup_blocker_cleared ?? false,
      closure_notes: body.closureNotes ?? body.closure_notes ?? null
    }).select().single());
    const status = result === 'Accepted' ? 'Verified' : result === 'Rejected' || result === 'Rework Required' ? 'Verification Failed' : 'Planning';
    const row = await this.patch(before, status, { verified_at: result === 'Accepted' ? new Date().toISOString() : null });
    await this.writeEvent(user, row, status, 'Work order verification completed', before, { row, verification });
    return this.detail(user, id);
  }

  async close(user: RequestUser, id: string, body: Record<string, any>) {
    const before = await this.get(user, id);
    const detail = await this.detail(user, id);
    const blockers = detail.readiness.blockers;
    if (blockers.length && !body.override) throw new BadRequestException(`Cannot close work order: ${blockers.join(' ')}`);
    const row = await this.patch(before, 'Closed', { closed_at: new Date().toISOString(), read_only: true });
    await this.updateLinkedDeficiency(user, row, detail.verifications).catch(() => null);
    await this.updateEquipmentImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, 'Closed', 'Work order closed', before, row);
    return this.detail(user, id);
  }

  cancel(user: RequestUser, id: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Cancellation reason is required.');
    return this.transition(user, id, 'Cancelled', 'Cancelled', 'Work order cancelled', body, { cancel_reason: body.reason ?? body.comments, read_only: true });
  }

  tasks(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyChildScope(this.db.from('mi_work_order_tasks').select('*').eq('work_order_id', id), user).order('sort_order', { ascending: true })).catch(() => []);
  }

  async addTask(user: RequestUser, id: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    this.assertEditable(workOrder);
    const row = await this.db.single<any>(this.db.from('mi_work_order_tasks').insert({
      company_id: workOrder.company_id,
      site_id: workOrder.site_id,
      work_order_id: id,
      task_number: body.taskNumber ?? body.task_number ?? `TASK-${Date.now()}`,
      task_title: body.taskTitle ?? body.task_title,
      task_description: body.taskDescription ?? body.task_description ?? null,
      required: body.required ?? false,
      status: body.status ?? 'Open',
      assigned_user_id: body.assignedUserId ?? body.assigned_user_id ?? null,
      evidence_required: body.evidenceRequired ?? body.evidence_required ?? false,
      sort_order: body.sortOrder ?? body.sort_order ?? 0
    }).select().single());
    await this.writeEvent(user, workOrder, 'Task Created', 'Work order task created', null, row);
    return row;
  }

  async updateTask(user: RequestUser, id: string, taskId: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    this.assertEditable(workOrder);
    const before = await this.db.single<any>(this.db.from('mi_work_order_tasks').select('*').eq('work_order_id', id).eq('id', taskId).maybeSingle());
    if (!before) throw new NotFoundException('Work order task not found.');
    const row = await this.db.single<any>(this.db.from('mi_work_order_tasks').update({
      task_title: body.taskTitle ?? body.task_title,
      task_description: body.taskDescription ?? body.task_description,
      status: body.status,
      completed_by: body.completedBy ?? body.completed_by ?? null,
      completed_at: body.status === 'Completed' ? new Date().toISOString() : body.completedAt ?? body.completed_at ?? null,
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? null,
      updated_at: new Date().toISOString()
    }).eq('work_order_id', id).eq('id', taskId).select().single());
    await this.writeEvent(user, workOrder, 'Task Updated', 'Work order task updated', before, row);
    return row;
  }

  async deleteTask(user: RequestUser, id: string, taskId: string) {
    const workOrder = await this.get(user, id);
    this.assertEditable(workOrder);
    const before = await this.db.single<any>(this.db.from('mi_work_order_tasks').select('*').eq('work_order_id', id).eq('id', taskId).maybeSingle());
    if (!before) throw new NotFoundException('Work order task not found.');
    await this.db.single<any>(this.db.from('mi_work_order_tasks').delete().eq('work_order_id', id).eq('id', taskId).select('id').single());
    await this.writeEvent(user, workOrder, 'Task Deleted', 'Work order task deleted', before, null);
    return { ok: true };
  }

  parts(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyChildScope(this.db.from('mi_work_order_parts').select('*').eq('work_order_id', id), user).order('created_at', { ascending: false })).catch(() => []);
  }

  async addPart(user: RequestUser, id: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    this.assertEditable(workOrder);
    const row = await this.db.single<any>(this.db.from('mi_work_order_parts').insert({
      company_id: workOrder.company_id,
      site_id: workOrder.site_id,
      work_order_id: id,
      part_name: body.partName ?? body.part_name,
      part_number: body.partNumber ?? body.part_number ?? null,
      quantity_required: body.quantityRequired ?? body.quantity_required ?? 1,
      unit: body.unit ?? null,
      status: body.status ?? 'Required',
      purchase_reference: body.purchaseReference ?? body.purchase_reference ?? null,
      notes: body.notes ?? null
    }).select().single());
    await this.writeEvent(user, workOrder, 'Part Added', 'Work order part added', null, row);
    return row;
  }

  async updatePart(user: RequestUser, id: string, partId: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    this.assertEditable(workOrder);
    const before = await this.db.single<any>(this.db.from('mi_work_order_parts').select('*').eq('work_order_id', id).eq('id', partId).maybeSingle());
    if (!before) throw new NotFoundException('Work order part not found.');
    const row = await this.db.single<any>(this.db.from('mi_work_order_parts').update({
      part_name: body.partName ?? body.part_name,
      part_number: body.partNumber ?? body.part_number,
      quantity_required: body.quantityRequired ?? body.quantity_required,
      quantity_used: body.quantityUsed ?? body.quantity_used,
      unit: body.unit,
      status: body.status,
      purchase_reference: body.purchaseReference ?? body.purchase_reference,
      notes: body.notes,
      updated_at: new Date().toISOString()
    }).eq('work_order_id', id).eq('id', partId).select().single());
    await this.writeEvent(user, workOrder, 'Part Updated', 'Work order part updated', before, row);
    return row;
  }

  linkedRecords(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyChildScope(this.db.from('mi_work_order_linked_records').select('*').eq('work_order_id', id), user).order('created_at', { ascending: false })).catch(() => []);
  }

  async addLinkedRecord(user: RequestUser, id: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    const row = await this.db.single<any>(this.db.from('mi_work_order_linked_records').insert({
      company_id: workOrder.company_id,
      site_id: workOrder.site_id,
      work_order_id: id,
      linked_module: body.linkedModule ?? body.linked_module,
      linked_record_id: body.linkedRecordId ?? body.linked_record_id,
      linked_record_number: body.linkedRecordNumber ?? body.linked_record_number ?? null,
      relationship_type: body.relationshipType ?? body.relationship_type ?? 'Reference',
      required_for_close: body.requiredForClose ?? body.required_for_close ?? false,
      status_snapshot: body.statusSnapshot ?? body.status_snapshot ?? null,
      created_by: user.id
    }).select().single());
    await this.writeEvent(user, workOrder, 'Linked', 'Linked record added', null, row);
    return row;
  }

  async removeLinkedRecord(user: RequestUser, id: string, linkId: string) {
    const workOrder = await this.get(user, id);
    const before = await this.db.single<any>(this.db.from('mi_work_order_linked_records').select('*').eq('work_order_id', id).eq('id', linkId).maybeSingle());
    if (!before) throw new NotFoundException('Linked record not found.');
    await this.db.single<any>(this.db.from('mi_work_order_linked_records').delete().eq('id', linkId).select('id').single());
    await this.writeEvent(user, workOrder, 'Unlinked', 'Linked record removed', before, null);
    return { ok: true };
  }

  actionLinks(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyChildScope(this.db.from('mi_work_order_action_links').select('*').eq('work_order_id', id), user).order('created_at', { ascending: false })).catch(() => []);
  }

  async linkAction(user: RequestUser, id: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    const actionId = body.actionId ?? body.action_id;
    if (!actionId) throw new BadRequestException('Action ID is required.');
    await this.actionsService.get(user.tenantId, actionId, user.siteIds);
    const row = await this.db.single<any>(this.db.from('mi_work_order_action_links').insert({ company_id: workOrder.company_id, site_id: workOrder.site_id, work_order_id: id, action_id: actionId, action_source: body.actionSource ?? 'Universal Action Engine', relationship_type: body.relationshipType ?? 'Corrective Action', created_by: user.id }).select().single());
    await this.db.single<any>(this.db.from('mi_work_orders').update({ linked_action_id: actionId, updated_at: new Date().toISOString(), updated_by: user.id }).eq('id', id).select('id').single()).catch(() => null);
    await this.writeEvent(user, workOrder, 'Action Linked', 'Universal action linked', null, row);
    return row;
  }

  async createAction(user: RequestUser, id: string, body: Record<string, any>) {
    const workOrder = await this.get(user, id);
    const priority = this.actionPriority(body.priority ?? workOrder.priority, workOrder);
    const action = await this.actionsService.create(user.tenantId, user.id, {
      sourceModule: 'mechanical-integrity',
      sourceRecordId: workOrder.id,
      sourceType: body.sourceType ?? 'MI Work Order',
      title: body.title ?? workOrder.title,
      description: body.description ?? workOrder.description ?? workOrder.required_work_scope ?? workOrder.title,
      priority,
      ownerId: body.ownerId ?? body.owner_id ?? workOrder.assigned_user_id ?? workOrder.owner_user_id ?? user.id,
      dueDate: body.dueDate ?? body.due_date ?? workOrder.due_date ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      equipmentId: workOrder.equipment_id,
      siteId: workOrder.site_id,
      evidenceRequired: body.evidenceRequired ?? workOrder.completion_evidence_required ?? false,
      verificationRequired: body.verificationRequired ?? workOrder.verification_required ?? workOrder.safety_critical_work ?? false
    } as any);
    return this.linkAction(user, id, { actionId: action.id, actionSource: 'Universal Action Engine', relationshipType: body.relationshipType ?? 'Corrective Action' });
  }

  actions(user: RequestUser, query: Query) {
    return this.list(user, { ...query, actionView: 'true' });
  }

  myActions(user: RequestUser, query: Query) {
    return this.list(user, { ...query, assignedUserId: user.id });
  }

  overdueActions(user: RequestUser, query: Query) {
    return this.list(user, { ...query, overdue: 'true' });
  }

  history(user: RequestUser, id: string) {
    return this.db.many<any>(this.applyChildScope(this.db.from('mi_work_order_history_events').select('*').eq('work_order_id', id), user).order('created_at', { ascending: false }).limit(200)).catch(() => []);
  }

  lookups() {
    return { workOrderTypes, actionTypes, workCategories, workStatuses, priorities, riskLevels, partsStatuses };
  }

  importTemplate() {
    return Promise.resolve({ fileName: 'mi-work-order-import-template.csv', content: this.csv([], ['work_order_number','equipment_id','title','work_order_type','priority','risk_level','status','due_date','ptw_required','loto_required','parts_status']) });
  }

  async importRows(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const siteId = body.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? user.siteIds?.[0] ?? null;
    const validRows = rows.filter((row: any) => row.equipmentId ?? row.equipment_id).length;
    const job = await this.db.single<any>(this.db.from('mi_work_order_import_jobs').insert({
      company_id: user.tenantId,
      site_id: siteId,
      uploaded_by: user.id,
      file_name: body.fileName ?? 'mi-work-orders-import.csv',
      file_key: body.fileKey ?? body.file_key ?? `manual-import/${Date.now()}.csv`,
      status: rows.length ? 'Completed With Errors' : 'Pending',
      total_rows: rows.length,
      valid_rows: validRows,
      error_rows: rows.length - validRows,
      created_count: 0,
      updated_count: 0,
      skipped_count: rows.length
    }).select().single());
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'MI_WORK_ORDER_IMPORT_CREATED', entityType: 'mi_work_order_import_job', entityId: job.id, after: job as JsonValue }).catch(() => null);
    return { job, rowsAccepted: rows.length, message: 'Work order import job created. Background import workers can process the validated rows without changing the API contract.' };
  }

  async exportRows(user: RequestUser, query: Query) {
    const rows = (await this.list(user, { ...query, limit: '1000' })).rows;
    return { fileName: 'mi-work-orders.csv', content: this.csv(rows, ['work_order_number','title','equipment_id','source_module','work_order_type','priority','risk_level','status','assigned_user_id','owner_user_id','planned_start_at','due_date','ptw_required','loto_required','parts_status','required_shutdown','verification_required','readiness_impact','linked_deficiency_id','linked_action_id','updated_at']) };
  }

  async exportOne(user: RequestUser, id: string) {
    const detail = await this.detail(user, id);
    return { fileName: `${detail.workOrder.work_order_number}.csv`, content: this.csv([detail.workOrder], ['work_order_number','title','description','work_order_type','priority','risk_level','status','due_date','owner_user_id','assigned_user_id','readiness_impact']) };
  }

  private async transition(user: RequestUser, id: string, status: string, eventType: string, title: string, body: Record<string, any>, patch: Record<string, any> = {}) {
    const before = await this.get(user, id);
    this.assertEditable(before);
    const row = await this.patch(before, status, patch);
    await this.updateEquipmentImpact(user, row.equipment_id).catch(() => null);
    await this.writeEvent(user, row, eventType, title, before, { ...row, input: body });
    return this.detail(user, id);
  }

  private async patch(before: any, status: string, patch: Record<string, any>) {
    return this.db.single<any>(this.db.from('mi_work_orders').update({ ...patch, status, updated_at: new Date().toISOString() }).eq('id', before.id).select().single());
  }

  private async payload(user: RequestUser, equipment: any, body: Record<string, any>, update: boolean) {
    const siteId = equipment.siteId ?? equipment.site_id ?? body.siteId ?? body.site_id;
    return {
      company_id: user.tenantId,
      site_id: siteId,
      equipment_id: equipment.id,
      cml_id: body.cmlId ?? body.cml_id ?? null,
      safeguard_type: body.safeguardType ?? body.safeguard_type ?? null,
      safeguard_id: body.safeguardId ?? body.safeguard_id ?? null,
      work_order_number: update ? body.work_order_number : await this.nextNumber(siteId, user.tenantId),
      title: body.title,
      description: body.description ?? null,
      work_order_type: body.workOrderType ?? body.work_order_type,
      work_category: body.workCategory ?? body.work_category ?? null,
      work_reason: body.workReason ?? body.work_reason ?? null,
      required_work_scope: body.requiredWorkScope ?? body.required_work_scope ?? null,
      repair_method: body.repairMethod ?? body.repair_method ?? null,
      expected_outcome: body.expectedOutcome ?? body.expected_outcome ?? null,
      acceptance_criteria: body.acceptanceCriteria ?? body.acceptance_criteria ?? null,
      work_instructions: body.workInstructions ?? body.work_instructions ?? null,
      completion_evidence_required: body.completionEvidenceRequired ?? body.completion_evidence_required ?? false,
      verification_required: body.verificationRequired ?? body.verification_required ?? body.safetyCriticalWork ?? body.safety_critical_work ?? false,
      status: body.status ?? 'Draft',
      priority: body.priority ?? 'Medium',
      risk_level: body.riskLevel ?? body.risk_level ?? 'Medium',
      safety_critical_work: body.safetyCriticalWork ?? body.safety_critical_work ?? false,
      psm_critical_work: body.psmCriticalWork ?? body.psm_critical_work ?? false,
      readiness_impact: body.readinessImpact ?? body.readiness_impact ?? null,
      startup_blocker: body.startupBlocker ?? body.startup_blocker ?? false,
      startup_blocker_reason: body.startupBlockerReason ?? body.startup_blocker_reason ?? null,
      operation_allowed_before_completion: body.operationAllowedBeforeCompletion ?? body.operation_allowed_before_completion ?? true,
      temporary_control_required: body.temporaryControlRequired ?? body.temporary_control_required ?? false,
      temporary_control_description: body.temporaryControlDescription ?? body.temporary_control_description ?? null,
      ffs_required: body.ffsRequired ?? body.ffs_required ?? false,
      engineering_review_required: body.engineeringReviewRequired ?? body.engineering_review_required ?? false,
      moc_required: body.mocRequired ?? body.moc_required ?? false,
      moc_suggested: body.mocSuggested ?? body.moc_suggested ?? false,
      pssr_impact: body.pssrImpact ?? body.pssr_impact ?? false,
      lopa_sil_impact: body.lopaSilImpact ?? body.lopa_sil_impact ?? false,
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      assigned_user_id: body.assignedUserId ?? body.assigned_user_id ?? null,
      assigned_team_id: body.assignedTeamId ?? body.assigned_team_id ?? null,
      contractor_vendor: body.contractorVendor ?? body.contractor_vendor ?? null,
      planned_start_at: body.plannedStartAt ?? body.planned_start_at ?? null,
      planned_finish_at: body.plannedFinishAt ?? body.planned_finish_at ?? null,
      estimated_duration_minutes: body.estimatedDurationMinutes ?? body.estimated_duration_minutes ?? null,
      due_date: body.dueDate ?? body.due_date ?? null,
      required_shutdown: body.requiredShutdown ?? body.required_shutdown ?? false,
      shutdown_window: body.shutdownWindow ?? body.shutdown_window ?? null,
      online_work_allowed: body.onlineWorkAllowed ?? body.online_work_allowed ?? true,
      required_outage_type: body.requiredOutageType ?? body.required_outage_type ?? null,
      job_plan: body.jobPlan ?? body.job_plan ?? null,
      job_steps_json: body.jobStepsJson ?? body.job_steps_json ?? null,
      sequencing_notes: body.sequencingNotes ?? body.sequencing_notes ?? null,
      simops_concern: body.simopsConcern ?? body.simops_concern ?? false,
      required_coordination: body.requiredCoordination ?? body.required_coordination ?? null,
      pre_job_briefing_required: body.preJobBriefingRequired ?? body.pre_job_briefing_required ?? false,
      toolbox_talk_required: body.toolboxTalkRequired ?? body.toolbox_talk_required ?? false,
      ptw_required: body.ptwRequired ?? body.ptw_required ?? false,
      ptw_type: body.ptwType ?? body.ptw_type ?? null,
      linked_ptw_id: body.linkedPtwId ?? body.linked_ptw_id ?? null,
      loto_required: body.lotoRequired ?? body.loto_required ?? false,
      linked_loto_id: body.linkedLotoId ?? body.linked_loto_id ?? null,
      confined_space_required: body.confinedSpaceRequired ?? body.confined_space_required ?? false,
      hot_work_required: body.hotWorkRequired ?? body.hot_work_required ?? false,
      line_break_required: body.lineBreakRequired ?? body.line_break_required ?? false,
      electrical_isolation_required: body.electricalIsolationRequired ?? body.electrical_isolation_required ?? false,
      working_at_height_required: body.workingAtHeightRequired ?? body.working_at_height_required ?? false,
      lifting_required: body.liftingRequired ?? body.lifting_required ?? false,
      gas_test_required: body.gasTestRequired ?? body.gas_test_required ?? false,
      ppe_requirements: body.ppeRequirements ?? body.ppe_requirements ?? null,
      safety_precautions: body.safetyPrecautions ?? body.safety_precautions ?? null,
      jsa_required: body.jsaRequired ?? body.jsa_required ?? false,
      jha_required: body.jhaRequired ?? body.jha_required ?? false,
      risk_assessment_document_id: body.riskAssessmentDocumentId ?? body.risk_assessment_document_id ?? null,
      method_statement_document_id: body.methodStatementDocumentId ?? body.method_statement_document_id ?? null,
      parts_required: body.partsRequired ?? body.parts_required ?? false,
      spare_parts_list: body.sparePartsList ?? body.spare_parts_list ?? null,
      material_list: body.materialList ?? body.material_list ?? null,
      tools_required: body.toolsRequired ?? body.tools_required ?? null,
      special_equipment: body.specialEquipment ?? body.special_equipment ?? null,
      crane_lifting_required: body.craneLiftingRequired ?? body.crane_lifting_required ?? false,
      scaffolding_required: body.scaffoldingRequired ?? body.scaffolding_required ?? false,
      contractor_required: body.contractorRequired ?? body.contractor_required ?? false,
      vendor_required: body.vendorRequired ?? body.vendor_required ?? false,
      parts_status: body.partsStatus ?? body.parts_status ?? 'Not Required',
      estimated_cost: body.estimatedCost ?? body.estimated_cost ?? null,
      cost_center: body.costCenter ?? body.cost_center ?? null,
      purchase_request_reference: body.purchaseRequestReference ?? body.purchase_request_reference ?? null,
      external_cmms_reference: body.externalCmmsReference ?? body.external_cmms_reference ?? null,
      source_module: body.sourceModule ?? body.source_module ?? null,
      source_record_id: body.sourceRecordId ?? body.source_record_id ?? null,
      source_record_number: body.sourceRecordNumber ?? body.source_record_number ?? null,
      source_summary: body.sourceSummary ?? body.source_summary ?? null,
      current_equipment_status: body.currentEquipmentStatus ?? body.current_equipment_status ?? null,
      current_readiness_status: body.currentReadinessStatus ?? body.current_readiness_status ?? null,
      equipment_criticality: body.criticality ?? body.equipmentCriticality ?? body.equipment_criticality ?? null,
      notes: body.notes ?? null,
      linked_deficiency_id: body.linkedDeficiencyId ?? body.linked_deficiency_id ?? null,
      linked_deviation_id: body.linkedDeviationId ?? body.linked_deviation_id ?? null,
      linked_action_id: body.linkedActionId ?? body.linked_action_id ?? null,
      created_by: update ? body.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
  }

  private validate(payload: Record<string, any>) {
    const missing = ['equipment_id','title','work_order_type','priority','risk_level'].filter((field) => !payload[field]);
    if (missing.length) throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
    if (['High','Critical'].includes(payload.risk_level) || ['Urgent','Emergency'].includes(payload.priority)) {
      if (!payload.owner_user_id) throw new BadRequestException('High/Critical work requires an owner.');
      if (!payload.due_date) throw new BadRequestException('High/Critical work requires a due date.');
    }
    if (payload.safety_critical_work && !payload.verification_required) throw new BadRequestException('Safety-critical work requires verification.');
    if (payload.startup_blocker && !payload.startup_blocker_reason) throw new BadRequestException('Startup blocker requires a reason.');
    if (payload.planned_finish_at && payload.planned_start_at && new Date(payload.planned_finish_at) < new Date(payload.planned_start_at)) throw new BadRequestException('Planned finish cannot be before planned start.');
  }

  private readiness(row: any, tasks: any[], parts: any[], verifications: any[], linkedRecords: any[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (row.ptw_required && !row.linked_ptw_id) blockers.push('PTW required but no linked permit is recorded.');
    if (row.loto_required && !row.linked_loto_id) blockers.push('LOTO required but no linked isolation is recorded.');
    if (row.parts_required && !['Available','Issued','Consumed'].includes(row.parts_status)) blockers.push('Required parts are not available.');
    if (row.moc_required && !linkedRecords.some((record) => record.linked_module === 'MOC')) blockers.push('MOC required but no linked MOC is recorded.');
    if (linkedRecords.some((record) => record.required_for_close && /open|pending|in progress|not started|draft/i.test(String(record.status_snapshot ?? 'Open')))) blockers.push('A required linked record is still open.');
    if ((row.verification_required || row.safety_critical_work) && !verifications.some((verification) => verification.verification_result === 'Accepted')) blockers.push('Accepted verification is required before closure.');
    if (tasks.some((task) => task.required && !['Completed','Verified','Closed'].includes(task.status))) blockers.push('Required tasks remain open.');
    if (parts.some((part) => part.status === 'Not Available')) blockers.push('A required part is not available.');
    if (row.due_date && new Date(row.due_date) < new Date() && !closedStatuses.includes(row.status)) warnings.push('Work order is overdue.');
    if (row.startup_blocker) warnings.push('Startup blocker work affects PSSR readiness.');
    return { status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready', blockers, warnings };
  }

  private startBlockers(row: any) {
    const blockers: string[] = [];
    if (row.ptw_required && !row.linked_ptw_id) blockers.push('PTW is required.');
    if (row.loto_required && !row.linked_loto_id) blockers.push('LOTO is required.');
    if (row.parts_required && !['Available','Issued','Consumed'].includes(row.parts_status)) blockers.push('Required parts are not available.');
    return blockers;
  }

  private planningPatch(body: Record<string, any>) {
    return {
      planned_start_at: body.plannedStartAt ?? body.planned_start_at ?? null,
      planned_finish_at: body.plannedFinishAt ?? body.planned_finish_at ?? null,
      estimated_duration_minutes: body.estimatedDurationMinutes ?? body.estimated_duration_minutes ?? null,
      required_shutdown: body.requiredShutdown ?? body.required_shutdown ?? false,
      shutdown_window: body.shutdownWindow ?? body.shutdown_window ?? null,
      online_work_allowed: body.onlineWorkAllowed ?? body.online_work_allowed ?? true,
      job_plan: body.jobPlan ?? body.job_plan ?? null,
      job_steps_json: body.jobStepsJson ?? body.job_steps_json ?? null,
      simops_concern: body.simopsConcern ?? body.simops_concern ?? false,
      pre_job_briefing_required: body.preJobBriefingRequired ?? body.pre_job_briefing_required ?? false,
      toolbox_talk_required: body.toolboxTalkRequired ?? body.toolbox_talk_required ?? false
    };
  }

  private async resolveEquipment(user: RequestUser, equipmentId: string | undefined) {
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.equipment.get(user.tenantId, equipmentId, user.siteIds);
    if (!equipment) throw new NotFoundException('Equipment not found.');
    return equipment;
  }

  private async get(user: RequestUser, id: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_work_orders').select('*').eq('id', id), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Work order not found.');
    return row;
  }

  private assertEditable(row: any) {
    if (row.read_only || closedStatuses.includes(row.status)) throw new BadRequestException('Closed/rejected/cancelled work orders are read-only.');
  }

  private applyScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) scoped = scoped.eq('site_id', siteId);
    else if (user.siteIds?.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyChildScope(request: any, user: RequestUser) {
    let scoped = request.eq('company_id', user.tenantId);
    if (user.siteIds?.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyFilters(request: any, query: Query, user: RequestUser) {
    let scoped = request;
    const view = query.view ?? query.savedView;
    if (query.equipmentId) scoped = scoped.eq('equipment_id', query.equipmentId);
    if (query.status) scoped = scoped.eq('status', query.status);
    if (query.priority) scoped = scoped.eq('priority', query.priority);
    if (query.riskLevel) scoped = scoped.eq('risk_level', query.riskLevel);
    if (query.workOrderType) scoped = scoped.eq('work_order_type', query.workOrderType);
    if (query.workCategory) scoped = scoped.eq('work_category', query.workCategory);
    if (query.sourceModule) scoped = scoped.eq('source_module', query.sourceModule);
    if (query.sourceRecordId) scoped = scoped.eq('source_record_id', query.sourceRecordId);
    if (query.assignedUserId) scoped = scoped.eq('assigned_user_id', query.assignedUserId);
    if (query.owner) scoped = scoped.eq('owner_user_id', query.owner);
    if (view === 'My Work') scoped = scoped.or(`assigned_user_id.eq.${user.id},owner_user_id.eq.${user.id}`);
    if (query.contractorVendor) scoped = scoped.ilike('contractor_vendor', `%${query.contractorVendor}%`);
    if (query.ptwRequired === 'true') scoped = scoped.eq('ptw_required', true);
    if (query.ptwLinked === 'true') scoped = scoped.not('linked_ptw_id', 'is', null);
    if (query.lotoRequired === 'true') scoped = scoped.eq('loto_required', true);
    if (query.lotoLinked === 'true') scoped = scoped.not('linked_loto_id', 'is', null);
    if (query.shutdownRequired === 'true') scoped = scoped.eq('required_shutdown', true);
    if (query.partsRequired === 'true') scoped = scoped.eq('parts_required', true);
    if (query.waitingParts === 'true') scoped = scoped.in('parts_status', ['Required','Requested','Ordered','Partially Available','Not Available']);
    if (query.contractorWork === 'true') scoped = scoped.or('contractor_required.eq.true,contractor_vendor.not.is.null');
    if (query.verificationRequired === 'true') scoped = scoped.eq('verification_required', true);
    if (query.evidenceRequired === 'true') scoped = scoped.eq('completion_evidence_required', true);
    if (query.criticalEquipment === 'true') scoped = scoped.ilike('equipment_criticality', '%critical%');
    if (query.psmCritical === 'true') scoped = scoped.eq('psm_critical_work', true);
    if (query.closed === 'false' || view === 'open' || view === 'All Open') scoped = scoped.not('status', 'in', '("Closed","Rejected","Cancelled")');
    if (query.overdue === 'true' || view === 'overdue' || view === 'Overdue') scoped = scoped.lt('due_date', new Date().toISOString().slice(0, 10)).not('status', 'in', '("Closed","Rejected","Cancelled")');
    if (query.safetyCritical === 'true' || view === 'safety-critical' || view === 'Safety-Critical') scoped = scoped.or('safety_critical_work.eq.true,psm_critical_work.eq.true');
    if (query.pendingVerification === 'true' || view === 'pending-verification' || view === 'Pending Verification') scoped = scoped.eq('status', 'Pending Verification');
    if (view === 'Critical') scoped = scoped.or('risk_level.eq.Critical,priority.eq.Emergency,safety_critical_work.eq.true,psm_critical_work.eq.true');
    if (view === 'Waiting Approval') scoped = scoped.in('status', ['Submitted','Waiting Approval']);
    if (view === 'Waiting PTW') scoped = scoped.eq('status', 'Waiting PTW');
    if (view === 'Waiting LOTO') scoped = scoped.eq('status', 'Waiting LOTO');
    if (view === 'Waiting Parts') scoped = scoped.in('parts_status', ['Required','Requested','Ordered','Partially Available','Not Available']);
    if (view === 'Waiting Shutdown') scoped = scoped.eq('required_shutdown', true);
    if (view === 'In Progress') scoped = scoped.eq('status', 'In Progress');
    if (view === 'Startup Blockers') scoped = scoped.eq('startup_blocker', true);
    if (view === 'MOC Required') scoped = scoped.eq('moc_required', true);
    if (view === 'Closed') scoped = scoped.eq('status', 'Closed');
    if (query.startupBlocker === 'true') scoped = scoped.eq('startup_blocker', true);
    if (query.mocRequired === 'true') scoped = scoped.eq('moc_required', true);
    if (query.createdFrom) scoped = scoped.gte('created_at', query.createdFrom);
    if (query.createdTo) scoped = scoped.lte('created_at', query.createdTo);
    if (query.plannedStartFrom) scoped = scoped.gte('planned_start_at', query.plannedStartFrom);
    if (query.plannedFinishTo) scoped = scoped.lte('planned_finish_at', query.plannedFinishTo);
    if (query.dueFrom) scoped = scoped.gte('due_date', query.dueFrom);
    if (query.dueTo) scoped = scoped.lte('due_date', query.dueTo);
    if (query.search) scoped = scoped.or(`work_order_number.ilike.%${query.search}%,title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    return scoped;
  }

  private async autoLinks(user: RequestUser, row: any, body: Record<string, any>) {
    const links: Array<{ linkedModule: string; linkedRecordId: string | null | undefined; relationshipType: string }> = [
      { linkedModule: 'Deficiency', linkedRecordId: body.linkedDeficiencyId ?? body.linked_deficiency_id, relationshipType: 'Corrective Work' },
      { linkedModule: 'Deviation', linkedRecordId: body.linkedDeviationId ?? body.linked_deviation_id, relationshipType: 'Temporary Acceptance Work' },
      { linkedModule: 'Universal Action', linkedRecordId: body.linkedActionId ?? body.linked_action_id, relationshipType: 'Action Link' },
      { linkedModule: 'Inspection record', linkedRecordId: body.inspectionRecordId ?? body.inspection_record_id, relationshipType: 'Inspection Follow-up' },
      { linkedModule: 'PM record', linkedRecordId: body.pmRecordId ?? body.pm_record_id, relationshipType: 'PM Follow-up' },
      { linkedModule: 'Calibration record', linkedRecordId: body.calibrationRecordId ?? body.calibration_record_id, relationshipType: 'Calibration Follow-up' },
      { linkedModule: 'PSV test', linkedRecordId: body.reliefTestId ?? body.relief_test_id, relationshipType: 'Relief Device Follow-up' },
      { linkedModule: 'SIF/interlock/alarm test', linkedRecordId: body.sifProofTestId ?? body.sif_proof_test_id ?? body.safeguardTestId ?? body.safeguard_test_id, relationshipType: 'Safeguard Test Follow-up' },
      { linkedModule: 'Bypass/impairment', linkedRecordId: body.impairmentId ?? body.impairment_id, relationshipType: 'Impairment Follow-up' },
      { linkedModule: 'MOC', linkedRecordId: body.mocId ?? body.moc_id, relationshipType: 'MOC Requirement' },
      { linkedModule: 'PSSR', linkedRecordId: body.pssrId ?? body.pssr_id, relationshipType: 'Startup Readiness' },
      { linkedModule: 'Incident', linkedRecordId: body.incidentId ?? body.incident_id, relationshipType: 'Incident Follow-up' },
      { linkedModule: 'PTW', linkedRecordId: body.ptwId ?? body.ptw_id ?? body.linkedPtwId ?? body.linked_ptw_id, relationshipType: 'Permit' },
      { linkedModule: 'LOTO', linkedRecordId: body.lotoId ?? body.loto_id ?? body.linkedLotoId ?? body.linked_loto_id, relationshipType: 'Isolation' },
      { linkedModule: 'Document', linkedRecordId: body.documentId ?? body.document_id, relationshipType: 'Document Control' },
      { linkedModule: 'CML/TML', linkedRecordId: body.cmlId ?? body.cml_id, relationshipType: 'Inspection Location' },
      { linkedModule: body.sourceModule ?? body.source_module, linkedRecordId: body.sourceRecordId ?? body.source_record_id, relationshipType: 'Source' }
    ].filter((link) => link.linkedModule && link.linkedRecordId);
    for (const link of links) await this.addLinkedRecord(user, row.id, link).catch(() => null);
  }

  private async addApproval(user: RequestUser, workOrder: any, body: Record<string, any>, action: string) {
    return this.db.single<any>(this.db.from('mi_work_order_approvals').insert({
      company_id: workOrder.company_id,
      site_id: workOrder.site_id,
      work_order_id: workOrder.id,
      approval_stage: body.approvalStage ?? body.approval_stage ?? 'Approval',
      approver_role: body.approverRole ?? body.approver_role ?? null,
      approver_user_id: user.id,
      action,
      comments: body.comments ?? body.reason ?? null,
      e_signature_id: body.eSignatureId ?? body.e_signature_id ?? null
    }).select().single());
  }

  private actionPriority(priority: unknown, workOrder: any) {
    if (workOrder.safety_critical_work || workOrder.psm_critical_work || priority === 'Emergency') return 'SAFETY_CRITICAL';
    if (priority === 'Urgent' || priority === 'High') return 'HIGH';
    if (priority === 'Low') return 'LOW';
    return 'MEDIUM';
  }

  private async updateLinkedDeficiency(user: RequestUser, row: any, verifications: any[]) {
    if (!row.linked_deficiency_id || !verifications.some((verification) => verification.verification_result === 'Accepted' && verification.deficiency_corrected)) return;
    await this.db.single<any>(this.db.from('mi_deficiencies').update({ status: 'Ready for Verification', updated_at: new Date().toISOString(), updated_by: user.id }).eq('id', row.linked_deficiency_id).select('id').single()).catch(() => null);
  }

  private async updateEquipmentImpact(user: RequestUser, equipmentId: string) {
    const rows = await this.db.many<any>(this.db.from('mi_work_orders').select('id,status,risk_level,safety_critical_work,startup_blocker,due_date').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled")')).catch(() => []);
    const critical = rows.filter((row) => row.risk_level === 'Critical' || row.safety_critical_work).length;
    const overdue = rows.filter((row) => row.due_date && new Date(row.due_date) < new Date()).length;
    const startupBlocked = rows.some((row) => row.startup_blocker);
    await this.db.single<any>(this.db.from('Equipment').update({
      openWorkOrderCount: rows.length,
      criticalWorkOrderCount: critical,
      overdueWorkOrderCount: overdue,
      startupBlocked,
      startupBlockReason: startupBlocked ? 'Open MI startup-blocking work order.' : null,
      readinessStatus: startupBlocked || critical ? 'Blocked' : rows.length ? 'Restricted' : 'Ready',
      updatedAt: new Date().toISOString()
    }).eq('tenantId', user.tenantId).eq('id', equipmentId).select('id').single()).catch(() => null);
  }

  private async writeEvent(user: RequestUser, target: any, eventType: string, title: string, before: unknown, after: unknown) {
    await this.db.single<any>(this.db.from('mi_work_order_history_events').insert({
      company_id: target.company_id,
      site_id: target.site_id,
      work_order_id: target.id,
      equipment_id: target.equipment_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: title,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: user.id,
      source_module: target.source_module ?? 'MechanicalIntegrity',
      source_record_id: target.source_record_id ?? null
    }).select().single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `MI_WORK_ORDER_${eventType.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, entityType: 'mi_work_order', entityId: target.id, before: (before ?? null) as JsonValue, after: (after ?? null) as JsonValue }).catch(() => null);
  }

  private async nextNumber(siteId: string, companyId: string) {
    const year = new Date().getFullYear();
    const prefix = `MI-WO-${year}-`;
    const rows = await this.db.many<any>(this.db.from('mi_work_orders').select('work_order_number').eq('company_id', companyId).eq('site_id', siteId).ilike('work_order_number', `${prefix}%`).order('work_order_number', { ascending: false }).limit(1)).catch(() => []);
    const last = Number(String(rows[0]?.work_order_number ?? '').split('-').pop() ?? 0);
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private sortColumn(raw: string) {
    const allowed: Record<string, string> = { workOrderNumber: 'work_order_number', title: 'title', status: 'status', priority: 'priority', riskLevel: 'risk_level', dueDate: 'due_date', updatedAt: 'updated_at', createdAt: 'created_at' };
    return allowed[raw] ?? raw ?? 'updated_at';
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
