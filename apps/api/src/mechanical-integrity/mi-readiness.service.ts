import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { EquipmentService } from '../equipment/equipment.service';

type Query = Record<string, string | undefined>;

const decisions = ['Fit for Service','Fit for Service with Restrictions','Not Fit for Service','Startup Blocked','Operate Temporarily Under Deviation','Engineering Review Required','Pending Verification','Out of Service','Decommissioned / Retired'];
const statuses = ['Draft','Check Complete','Submitted','In Review','Approved','Rejected','Override Requested','Closed','Cancelled','Superseded'];
const blockerTypes = ['Deficiency','Deviation','Work Order','Inspection','CML/TML Remaining Life','PM','Calibration','PSV','SIF/SIS','Interlock','Critical Alarm','Bypass/Impairment','Missing Document','MOC','PSSR','Manual'];
const severities = ['Info','Warning','Major','Critical','Startup Blocker'];
const assessmentReasons = ['Initial readiness','Return to service','Startup readiness','After inspection','After repair/work order','After failed test','After deficiency closure','After MOC','After PSSR request','After bypass restoration','Periodic review','Manual review'];
const terminalStatuses = ['Approved','Closed','Cancelled','Rejected','Superseded'];
const closedDeficiencyStatuses = ['Closed','Rejected','Cancelled','Verified'];
const closedWorkStatuses = ['Closed','Rejected','Cancelled','Verified'];

@Injectable()
export class MiReadinessService {
  constructor(
    private readonly db: SupabaseService,
    private readonly equipment: EquipmentService,
    private readonly actions: ActionsService,
    private readonly audit: AuditService
  ) {}

  async list(user: RequestUser, query: Query) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    let request = this.applyScope(this.db.from('mi_readiness_assessments').select('*', { count: 'exact' }), user, query);
    request = this.applyFilters(request, query);
    const { data, error, count } = await request.order(this.sortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] !== 'desc' }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = await this.decorateRows(user, data ?? []);
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: await this.summary(user, query),
      savedViews: ['All Assessments','Fit for Service','Fit With Restrictions','Not Fit','Startup Blocked','Pending Approval','Engineering Review Required','Active Restrictions','Low Remaining Life','Failed Safeguards','Active Impairments','Work Pending Verification','PSSR Blockers'],
      lastUpdated: new Date().toISOString()
    };
  }

  async summary(user: RequestUser, query: Query = {}) {
    const rows = await this.db.many<any>(this.applyFilters(this.applyScope(this.db.from('mi_readiness_assessments').select('*'), user, query), query).limit(1000)).catch(() => []);
    const blockers = await this.db.many<any>(this.applyScope(this.db.from('mi_readiness_blockers').select('*'), user, query).neq('blocker_status', 'Cleared').limit(3000)).catch(() => []);
    const sourceCount = (source: string) => new Set(blockers.filter((row) => row.source_module === source).map((row) => row.equipment_id)).size;
    return {
      totalEquipmentAssessed: new Set(rows.map((row) => row.equipment_id)).size,
      fitForService: rows.filter((row) => this.effectiveDecision(row) === 'Fit for Service').length,
      fitWithRestrictions: rows.filter((row) => /Restrictions/.test(this.effectiveDecision(row))).length,
      notFitForService: rows.filter((row) => this.effectiveDecision(row) === 'Not Fit for Service').length,
      startupBlocked: rows.filter((row) => row.startup_blocked || this.effectiveDecision(row) === 'Startup Blocked').length,
      pendingReadinessReview: rows.filter((row) => ['Draft','Check Complete','Submitted','In Review'].includes(row.status)).length,
      pendingApproval: rows.filter((row) => ['Submitted','In Review','Override Requested'].includes(row.status)).length,
      engineeringReviewRequired: rows.filter((row) => this.effectiveDecision(row) === 'Engineering Review Required' || row.ffs_required).length,
      equipmentWithCriticalDeficiencies: sourceCount('Deficiency'),
      equipmentWithActiveImpairments: sourceCount('Bypass/Impairment'),
      equipmentWithFailedPsvTest: sourceCount('PSV'),
      equipmentWithFailedSafeguardTest: sourceCount('SIF/SIS') + sourceCount('Interlock') + sourceCount('Critical Alarm'),
      equipmentWithOverdueInspection: sourceCount('Inspection'),
      equipmentWithOverduePm: sourceCount('PM'),
      equipmentWithOverdueCalibration: sourceCount('Calibration'),
      equipmentWithLowRemainingLife: sourceCount('CML/TML Remaining Life'),
      equipmentWithMissingCertificate: sourceCount('Missing Document'),
      equipmentWaitingWorkVerification: sourceCount('Work Order'),
      pssrStartupBlockers: new Set(blockers.filter((row) => row.startup_blocker || row.source_module === 'PSSR').map((row) => row.equipment_id)).size,
      temporaryOperationUnderDeviation: rows.filter((row) => this.effectiveDecision(row) === 'Operate Temporarily Under Deviation').length
    };
  }

  async detail(user: RequestUser, assessmentId: string) {
    const assessment = await this.getAssessment(user, assessmentId);
    const [blockers, restrictions, approvals, linkedRecords, history] = await Promise.all([
      this.blockers(user, assessmentId),
      this.restrictions(user, assessmentId),
      this.db.many<any>(this.db.from('mi_readiness_approvals').select('*').eq('assessment_id', assessmentId).order('acted_at', { ascending: false })).catch(() => []),
      this.linkedRecords(user, assessmentId),
      this.history(user, assessmentId)
    ]);
    return {
      assessment: (await this.decorateRows(user, [assessment]))[0] ?? assessment,
      blockers,
      restrictions,
      approvals,
      linkedRecords,
      history,
      readOnly: assessment.read_only || terminalStatuses.includes(assessment.status),
      readiness: this.assessmentReadiness(assessment, blockers, restrictions)
    };
  }

  async create(user: RequestUser, body: Record<string, any>, forcedEquipmentId?: string) {
    const equipment = await this.resolveEquipment(user, forcedEquipmentId ?? body.equipmentId ?? body.equipment_id);
    const payload = await this.payload(user, equipment, body, false);
    this.validateDraft(payload);
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').insert(payload).select().single());
    await this.addLinkedRecords(user, row, body.linkedRecords ?? []).catch(() => null);
    await this.addInitialRestrictions(user, row, body.restrictions ?? body.initialRestrictions ?? []).catch(() => null);
    await this.writeEvent(user, row, 'Created', 'Readiness assessment created', null, row);
    const shouldRun = body.runCheck !== false;
    return shouldRun ? this.runCheck(user, row.id, { reason: 'Initial backend readiness check' }) : this.detail(user, row.id);
  }

  async update(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const before = await this.getAssessment(user, assessmentId);
    this.assertEditable(before);
    const equipment = await this.resolveEquipment(user, body.equipmentId ?? body.equipment_id ?? before.equipment_id);
    const payload = await this.payload(user, equipment, { ...before, ...body }, true);
    this.validateDraft(payload);
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').update(payload).eq('id', assessmentId).select().single());
    await this.writeEvent(user, row, 'Updated', 'Readiness assessment updated', before, row);
    return this.detail(user, assessmentId);
  }

  async runCheck(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getAssessment(user, assessmentId);
    this.assertEditable(before);
    const blockers = await this.generateBlockers(user, before);
    await this.db.many(this.db.from('mi_readiness_blockers').delete().eq('assessment_id', assessmentId).select('id')).catch(() => []);
    for (const blocker of blockers) await this.db.single(this.db.from('mi_readiness_blockers').insert(blocker).select('id').single()).catch(() => null);
    const recommended = this.recommendDecision(blockers, await this.restrictions(user, assessmentId).catch(() => []), before);
    const patch = {
      recommended_decision: recommended,
      operation_allowed: recommended === 'Fit for Service' || /Restrictions|Deviation/.test(recommended),
      startup_blocked: recommended === 'Startup Blocked' || blockers.some((item) => item.startup_blocker),
      pssr_impact: blockers.some((item) => item.startup_blocker || item.source_module === 'PSSR'),
      moc_required: blockers.some((item) => item.source_module === 'MOC' || /MOC/i.test(item.recommended_action ?? '')),
      lopa_sil_impact: blockers.some((item) => /SIF|SIS|Interlock|Critical Alarm|LOPA|SIL/i.test(`${item.source_module} ${item.blocker_title}`)),
      status: before.status === 'Draft' ? 'Check Complete' : before.status,
      decision_source: 'Backend readiness engine',
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').update(patch).eq('id', assessmentId).select().single());
    await this.writeEvent(user, row, 'Readiness Check Run', 'Backend readiness check generated blockers and recommended decision', before, { row, blockers, reason: body.reason ?? null });
    return this.detail(user, assessmentId);
  }

  async submit(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getAssessment(user, assessmentId);
    this.assertEditable(before);
    const blockers = await this.blockers(user, assessmentId);
    if (!blockers.length && before.status === 'Draft') throw new BadRequestException('Run backend readiness check before submit.');
    const proposed = body.proposedDecision ?? body.proposed_decision ?? before.proposed_decision;
    if (!proposed) throw new BadRequestException('Proposed decision is required before submit.');
    if (/Restrictions/.test(String(proposed))) await this.assertRestrictionReady(user, assessmentId);
    if (String(proposed) === 'Not Fit for Service' && !(body.reason ?? before.engineering_justification)) throw new BadRequestException('Not Fit decision requires engineering justification or reason.');
    const row = await this.patch(before, 'Submitted', { proposed_decision: proposed, reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? before.reviewer_user_id ?? null });
    await this.addApproval(user, row, 'Assessor submit', 'Assessor', 'Submitted', body.comments ?? body.reason ?? null);
    await this.writeEvent(user, row, 'Submitted', 'Readiness assessment submitted for approval', before, row);
    return this.detail(user, assessmentId);
  }

  review(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    return this.transition(user, assessmentId, 'In Review', 'Review Started', 'Readiness assessment review started', body);
  }

  async approve(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getAssessment(user, assessmentId);
    const blockers = await this.blockers(user, assessmentId);
    const restrictions = await this.restrictions(user, assessmentId);
    const decision = body.approvedDecision ?? body.approved_decision ?? before.proposed_decision ?? before.recommended_decision;
    if (!decisions.includes(decision)) throw new BadRequestException('Approved decision is invalid.');
    if (decision === 'Fit for Service' && blockers.some((item) => ['Critical','Startup Blocker'].includes(item.severity) && !['Cleared','Waived With Approval'].includes(item.blocker_status))) throw new BadRequestException('Cannot approve Fit for Service with open unwaived critical/startup blocker.');
    if (/Restrictions|Deviation/.test(decision) && !restrictions.length) throw new BadRequestException('Fit with restrictions or temporary deviation requires active restrictions.');
    if (!(body.comments ?? body.reason) && ['Not Fit for Service','Startup Blocked'].includes(decision)) throw new BadRequestException('Not Fit or Startup Blocked approval requires acknowledgement comments.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').update({
      status: 'Approved',
      approved_decision: decision,
      approved_by: user.id,
      approved_at: now,
      operation_allowed: decision === 'Fit for Service' || /Restrictions|Deviation/.test(decision),
      startup_blocked: decision === 'Startup Blocked' || blockers.some((item) => item.startup_blocker && !['Cleared','Waived With Approval'].includes(item.blocker_status)),
      restriction_active: restrictions.some((item) => item.status === 'Active'),
      read_only: true,
      updated_by: user.id,
      updated_at: now
    }).eq('id', assessmentId).select().single());
    await this.addApproval(user, row, 'Final approval', body.approverRole ?? 'Approver', 'Approved', body.comments ?? null);
    await this.updateEquipmentReadiness(user, row, blockers, restrictions).catch(() => null);
    await this.writeEvent(user, row, 'Approved', 'Readiness assessment approved and equipment readiness updated', before, row);
    return this.detail(user, assessmentId);
  }

  async reject(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    if (!(body.reason ?? body.comments)) throw new BadRequestException('Rejection reason is required.');
    const before = await this.getAssessment(user, assessmentId);
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').update({ status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: body.reason ?? body.comments, read_only: true, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', assessmentId).select().single());
    await this.addApproval(user, row, 'Final approval', body.approverRole ?? 'Approver', 'Rejected', body.reason ?? body.comments);
    await this.writeEvent(user, row, 'Rejected', 'Readiness assessment rejected', before, row);
    return this.detail(user, assessmentId);
  }

  async override(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    if (!(body.reason ?? body.overrideReason)) throw new BadRequestException('Override reason is required.');
    const before = await this.getAssessment(user, assessmentId);
    const decision = body.proposedDecision ?? body.proposed_decision ?? before.proposed_decision ?? 'Fit for Service with Restrictions';
    if (!decisions.includes(decision)) throw new BadRequestException('Override decision is invalid.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_assessments').update({ status: 'Override Requested', proposed_decision: decision, override_reason: body.reason ?? body.overrideReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', assessmentId).select().single());
    await this.addApproval(user, row, 'Override request', body.approverRole ?? 'Management', 'Override Requested', body.reason ?? body.overrideReason);
    await this.writeEvent(user, row, 'Override Requested', 'Readiness decision override requested', before, row);
    return this.detail(user, assessmentId);
  }

  async close(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getAssessment(user, assessmentId);
    if (before.status !== 'Approved' && !body.override) throw new BadRequestException('Only approved readiness assessments can be closed unless override is supplied.');
    const row = await this.patch(before, 'Closed', { read_only: true });
    await this.writeEvent(user, row, 'Closed', 'Readiness assessment closed', before, row);
    return this.detail(user, assessmentId);
  }

  blockers(user: RequestUser, assessmentId: string) {
    return this.db.many<any>(this.db.from('mi_readiness_blockers').select('*').eq('assessment_id', assessmentId).order('severity', { ascending: false }).order('created_at', { ascending: false }));
  }

  async waiveBlocker(user: RequestUser, assessmentId: string, blockerId: string, body: Record<string, any>) {
    if (!(body.reason ?? body.waiverReason)) throw new BadRequestException('Waiver reason is required.');
    await this.getAssessment(user, assessmentId);
    const before = await this.db.single<any>(this.db.from('mi_readiness_blockers').select('*').eq('assessment_id', assessmentId).eq('id', blockerId).maybeSingle());
    if (!before) throw new NotFoundException('Readiness blocker not found.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_blockers').update({ blocker_status: 'Waived With Approval', waiver_reason: body.reason ?? body.waiverReason, waived_by: user.id, waived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', blockerId).select().single());
    await this.writeEvent(user, { ...row, assessment_id: assessmentId }, 'Blocker Waived', 'Readiness blocker waived with approval', before, row);
    return row;
  }

  async clearBlocker(user: RequestUser, assessmentId: string, blockerId: string, body: Record<string, any> = {}) {
    await this.getAssessment(user, assessmentId);
    const before = await this.db.single<any>(this.db.from('mi_readiness_blockers').select('*').eq('assessment_id', assessmentId).eq('id', blockerId).maybeSingle());
    if (!before) throw new NotFoundException('Readiness blocker not found.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_blockers').update({ blocker_status: 'Cleared', cleared_by: user.id, cleared_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', blockerId).select().single());
    await this.writeEvent(user, { ...row, assessment_id: assessmentId }, 'Blocker Cleared', 'Readiness blocker cleared', before, { row, reason: body.reason ?? null });
    return row;
  }

  async createActionFromBlocker(user: RequestUser, assessmentId: string, blockerId: string, body: Record<string, any>) {
    const assessment = await this.getAssessment(user, assessmentId);
    const before = await this.db.single<any>(this.db.from('mi_readiness_blockers').select('*').eq('assessment_id', assessmentId).eq('id', blockerId).maybeSingle());
    if (!before) throw new NotFoundException('Readiness blocker not found.');
    const priority = before.severity === 'Startup Blocker' || before.severity === 'Critical' ? 'SAFETY_CRITICAL' : before.severity === 'Major' ? 'HIGH' : 'MEDIUM';
    const action = await this.actions.create(user.tenantId, user.id, {
      sourceModule: 'mechanical-integrity',
      sourceRecordId: before.id,
      sourceType: 'MI Readiness Blocker',
      title: body.actionTitle ?? body.title ?? before.recommended_action ?? before.blocker_title,
      description: body.description ?? before.blocker_description ?? before.recommended_action ?? before.blocker_title,
      priority: body.priority ?? priority,
      ownerId: body.ownerUserId ?? body.owner_user_id ?? before.owner_user_id ?? user.id,
      dueDate: body.dueDate ?? body.due_date ?? before.due_date ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      equipmentId: assessment.equipment_id,
      siteId: assessment.site_id,
      evidenceRequired: body.evidenceRequired ?? ['Critical','Startup Blocker'].includes(before.severity),
      verificationRequired: body.verificationRequired ?? true
    } as any);
    const row = await this.db.single<any>(this.db.from('mi_readiness_blockers').update({ blocker_status: 'Action Assigned', recommended_action: body.actionTitle ?? body.title ?? body.recommendedAction ?? 'Action assigned', owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null, due_date: body.dueDate ?? body.due_date ?? null, updated_at: new Date().toISOString() }).eq('assessment_id', assessmentId).eq('id', blockerId).select().single());
    await this.db.single<any>(this.db.from('mi_readiness_action_links').insert({ company_id: assessment.company_id, site_id: assessment.site_id, assessment_id: assessmentId, blocker_id: blockerId, action_id: action.id, relationship_type: body.relationshipType ?? 'Readiness Corrective Action', created_by: user.id }).select('id').single()).catch(() => null);
    await this.writeEvent(user, assessment, 'Action Assigned', 'Readiness blocker converted to a Universal Action Engine action', before, { row, action, actionInput: body });
    return { ...row, action };
  }

  restrictions(user: RequestUser, assessmentId: string) {
    return this.db.many<any>(this.db.from('mi_readiness_restrictions').select('*').eq('assessment_id', assessmentId).order('expiry_date', { ascending: true }));
  }

  async addRestriction(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const assessment = await this.getAssessment(user, assessmentId);
    this.assertEditable(assessment);
    if (!(body.restrictionDescription ?? body.restriction_description)) throw new BadRequestException('Restriction description is required.');
    if (!(body.expiryDate ?? body.expiry_date)) throw new BadRequestException('Restriction expiry date is required.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_restrictions').insert({
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      assessment_id: assessmentId,
      equipment_id: assessment.equipment_id,
      restriction_type: body.restrictionType ?? body.restriction_type ?? 'Operating Restriction',
      restriction_description: body.restrictionDescription ?? body.restriction_description,
      reduced_pressure: body.reducedPressure ?? body.reduced_pressure ?? null,
      reduced_temperature: body.reducedTemperature ?? body.reduced_temperature ?? null,
      reduced_rate: body.reducedRate ?? body.reduced_rate ?? null,
      additional_monitoring: body.additionalMonitoring ?? body.additional_monitoring ?? null,
      temporary_controls: body.temporaryControls ?? body.temporary_controls ?? null,
      expiry_date: body.expiryDate ?? body.expiry_date,
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      status: body.status ?? 'Active'
    }).select().single());
    await this.db.single(this.db.from('mi_readiness_assessments').update({ restriction_active: true, restriction_expiry_date: row.expiry_date, updated_at: new Date().toISOString() }).eq('id', assessmentId).select('id').single()).catch(() => null);
    await this.writeEvent(user, assessment, 'Restriction Added', 'Readiness restriction added', null, row);
    return row;
  }

  async updateRestriction(user: RequestUser, assessmentId: string, restrictionId: string, body: Record<string, any>) {
    const assessment = await this.getAssessment(user, assessmentId);
    this.assertEditable(assessment);
    const before = await this.db.single<any>(this.db.from('mi_readiness_restrictions').select('*').eq('assessment_id', assessmentId).eq('id', restrictionId).maybeSingle());
    if (!before) throw new NotFoundException('Readiness restriction not found.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_restrictions').update({
      restriction_type: body.restrictionType ?? body.restriction_type ?? before.restriction_type,
      restriction_description: body.restrictionDescription ?? body.restriction_description ?? before.restriction_description,
      reduced_pressure: body.reducedPressure ?? body.reduced_pressure ?? before.reduced_pressure,
      reduced_temperature: body.reducedTemperature ?? body.reduced_temperature ?? before.reduced_temperature,
      reduced_rate: body.reducedRate ?? body.reduced_rate ?? before.reduced_rate,
      additional_monitoring: body.additionalMonitoring ?? body.additional_monitoring ?? before.additional_monitoring,
      temporary_controls: body.temporaryControls ?? body.temporary_controls ?? before.temporary_controls,
      expiry_date: body.expiryDate ?? body.expiry_date ?? before.expiry_date,
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? before.owner_user_id,
      status: body.status ?? before.status,
      updated_at: new Date().toISOString()
    }).eq('id', restrictionId).select().single());
    await this.writeEvent(user, assessment, 'Restriction Updated', 'Readiness restriction updated', before, row);
    return row;
  }

  linkedRecords(user: RequestUser, assessmentId: string) {
    return this.db.many<any>(this.db.from('mi_readiness_linked_records').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }));
  }

  async addLinkedRecord(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const assessment = await this.getAssessment(user, assessmentId);
    if (!(body.linkedModule ?? body.linked_module) || !(body.linkedRecordId ?? body.linked_record_id)) throw new BadRequestException('Linked module and record ID are required.');
    const row = await this.db.single<any>(this.db.from('mi_readiness_linked_records').insert({
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      assessment_id: assessmentId,
      linked_module: body.linkedModule ?? body.linked_module,
      linked_record_id: body.linkedRecordId ?? body.linked_record_id,
      linked_record_number: body.linkedRecordNumber ?? body.linked_record_number ?? null,
      relationship_type: body.relationshipType ?? body.relationship_type ?? 'Evidence',
      created_by: user.id
    }).select().single());
    await this.writeEvent(user, assessment, 'Linked Record Added', 'Readiness linked record added', null, row);
    return row;
  }

  async removeLinkedRecord(user: RequestUser, assessmentId: string, linkId: string) {
    const assessment = await this.getAssessment(user, assessmentId);
    const row = await this.db.single<any>(this.db.from('mi_readiness_linked_records').delete().eq('assessment_id', assessmentId).eq('id', linkId).select().single());
    await this.writeEvent(user, assessment, 'Linked Record Removed', 'Readiness linked record removed', row, null);
    return row;
  }

  history(_user: RequestUser, assessmentId: string) {
    return this.db.many<any>(this.db.from('mi_readiness_history_events').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }));
  }

  async equipmentReadiness(user: RequestUser, equipmentId: string) {
    await this.resolveEquipment(user, equipmentId);
    const latest = await this.db.single<any>(this.applyScope(this.db.from('mi_readiness_assessments').select('*').eq('equipment_id', equipmentId), user, {}).order('created_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    const assessments = await this.db.many<any>(this.applyScope(this.db.from('mi_readiness_assessments').select('*').eq('equipment_id', equipmentId), user, {}).order('created_at', { ascending: false }).limit(25)).catch(() => []);
    const activeBlockers = latest?.id ? await this.blockers(user, latest.id).catch(() => []) : await this.generateBlockers(user, { company_id: user.tenantId, site_id: user.selectedSiteId ?? user.siteIds[0], equipment_id: equipmentId, id: null });
    const restrictions = latest?.id ? await this.restrictions(user, latest.id).catch(() => []) : [];
    return {
      current: latest,
      summary: {
        currentReadiness: latest?.approved_decision ?? latest?.recommended_decision ?? this.recommendDecision(activeBlockers, restrictions, latest ?? {}),
        recommendedDecision: latest?.recommended_decision ?? this.recommendDecision(activeBlockers, restrictions, latest ?? {}),
        approvedDecision: latest?.approved_decision ?? null,
        blockerCount: activeBlockers.length,
        criticalBlockers: activeBlockers.filter((item) => ['Critical','Startup Blocker'].includes(item.severity)).length,
        activeRestrictions: restrictions.filter((item) => item.status === 'Active').length,
        startupBlocked: activeBlockers.some((item) => item.startup_blocker)
      },
      blockers: activeBlockers,
      restrictions,
      assessments,
      history: latest?.id ? await this.history(user, latest.id).catch(() => []) : []
    };
  }

  async runEquipmentCheck(user: RequestUser, equipmentId: string) {
    const detail = await this.equipmentReadiness(user, equipmentId);
    return { ...detail, checkedAt: new Date().toISOString() };
  }

  equipmentBlockers(user: RequestUser, equipmentId: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_readiness_blockers').select('*').eq('equipment_id', equipmentId), user, {}).order('created_at', { ascending: false }));
  }

  equipmentHistory(user: RequestUser, equipmentId: string) {
    return this.db.many<any>(this.applyScope(this.db.from('mi_readiness_history_events').select('*').eq('equipment_id', equipmentId), user, {}).order('created_at', { ascending: false }).limit(100));
  }

  importTemplate() {
    return Promise.resolve({ fileName: 'mi-readiness-import-template.csv', content: this.csv([], ['assessment_number','equipment_id','assessment_reason','assessment_date','proposed_decision','engineering_justification','restriction_expiry_date','assessor_user_id','reviewer_user_id']) });
  }

  importRows(user: RequestUser, body: Record<string, any>) {
    return this.db.single<any>(this.db.from('mi_readiness_import_jobs').insert({ company_id: user.tenantId, site_id: body.siteId ?? user.selectedSiteId ?? null, uploaded_by: user.id, file_name: body.fileName ?? 'readiness-import.csv', file_key: body.fileKey ?? null, status: 'Uploaded', total_rows: Array.isArray(body.rows) ? body.rows.length : 0 }).select().single());
  }

  async exportRows(user: RequestUser, query: Query) {
    const rows = await this.list(user, { ...query, limit: '1000' }).then((data) => data.rows);
    return { fileName: 'mi-readiness-assessments.csv', content: this.csv(rows, ['assessment_number','equipment_tag','assessment_reason','status','recommended_decision','proposed_decision','approved_decision','startup_blocked','pssr_impact','moc_required','restriction_active','restriction_expiry_date','next_review_due','updated_at']) };
  }

  async exportOne(user: RequestUser, assessmentId: string) {
    const detail = await this.detail(user, assessmentId);
    return { fileName: `${detail.assessment.assessment_number}.csv`, content: this.csv([detail.assessment], ['assessment_number','equipment_tag','assessment_reason','status','recommended_decision','proposed_decision','approved_decision','engineering_justification','technical_basis','risk_acceptance_statement','startup_blocked','restriction_active']) };
  }

  lookups() {
    return { decisions, statuses, blockerTypes, severities, assessmentReasons };
  }

  private async generateBlockers(user: RequestUser, assessment: any) {
    const equipment = await this.resolveEquipment(user, assessment.equipment_id);
    const rows: any[] = [];
    const add = (input: Partial<any>) => rows.push({
      company_id: assessment.company_id ?? user.tenantId,
      site_id: assessment.site_id ?? equipment.siteId ?? user.selectedSiteId ?? user.siteIds[0],
      assessment_id: assessment.id,
      equipment_id: assessment.equipment_id,
      source_module: input.source_module ?? 'Manual',
      source_record_id: input.source_record_id ?? null,
      source_record_number: input.source_record_number ?? null,
      blocker_type: input.blocker_type ?? input.source_module ?? 'Manual',
      blocker_title: input.blocker_title ?? 'Readiness blocker',
      blocker_description: input.blocker_description ?? null,
      severity: input.severity ?? 'Warning',
      blocker_status: input.blocker_status ?? 'Open',
      readiness_impact: input.readiness_impact ?? null,
      startup_blocker: !!input.startup_blocker,
      recommended_action: input.recommended_action ?? null,
      owner_user_id: input.owner_user_id ?? null,
      due_date: input.due_date ?? null
    });
    const siteId = assessment.site_id ?? equipment.siteId ?? user.selectedSiteId ?? user.siteIds[0];
    if (!equipment.criticality) add({ source_module: 'Equipment', blocker_type: 'Criticality', blocker_title: 'Criticality not evaluated', blocker_description: 'Equipment criticality/risk ranking is missing.', severity: 'Major', recommended_action: 'Complete criticality assessment.' });
    if (equipment.status === 'OUT_OF_SERVICE' || /out of service|decommissioned/i.test(String(equipment.status ?? ''))) add({ source_module: 'Equipment', blocker_type: 'Equipment Status', blocker_title: 'Equipment is out of service', severity: 'Critical', startup_blocker: true, readiness_impact: 'Startup Blocked', recommended_action: 'Resolve equipment status before startup.' });
    await this.deficiencyBlockers(user, assessment.equipment_id, add);
    await this.deviationBlockers(user, assessment.equipment_id, add);
    await this.workOrderBlockers(user, assessment.equipment_id, add);
    await this.impairmentBlockers(user, assessment.equipment_id, add);
    await this.inspectionBlockers(user, assessment.equipment_id, add);
    await this.pmBlockers(user, assessment.equipment_id, add);
    await this.calibrationBlockers(user, assessment.equipment_id, add);
    await this.remainingLifeBlockers(user, assessment.equipment_id, add);
    await this.reliefBlockers(user, assessment.equipment_id, add);
    await this.safeguardBlockers(user, assessment.equipment_id, add);
    const docs = await this.db.many<any>(this.db.from('EquipmentDocument').select('id').eq('tenantId', user.tenantId).eq('equipmentId', assessment.equipment_id).limit(1)).catch(() => []);
    if (!docs.length && (equipment.safetyCritical || equipment.psmCritical)) add({ source_module: 'Missing Document', blocker_type: 'Missing Certificate', blocker_title: 'Required safety-critical documents missing', severity: 'Major', recommended_action: 'Link required inspection reports, certificates, test reports, or FFS evidence.' });
    return rows;
  }

  private async deficiencyBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_deficiencies').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled","Verified")').limit(500)).catch(() => []);
    for (const row of rows) {
      const critical = row.severity === 'Critical' || row.risk_level === 'Critical' || row.startup_blocker;
      add({ source_module: 'Deficiency', source_record_id: row.id, source_record_number: row.record_number, blocker_type: row.deficiency_type ?? 'Deficiency', blocker_title: row.title ?? 'Open deficiency', blocker_description: row.description ?? row.consequence_if_not_corrected, severity: row.startup_blocker ? 'Startup Blocker' : critical ? 'Critical' : 'Major', startup_blocker: !!row.startup_blocker, readiness_impact: row.fitness_for_service_impact, recommended_action: row.ffs_required ? 'Complete FFS assessment or close deficiency.' : 'Resolve or verify deficiency.', owner_user_id: row.owner_user_id, due_date: row.due_date });
    }
  }

  private async deviationBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_deviations').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled")').limit(500)).catch(() => []);
    const now = new Date();
    for (const row of rows) {
      const expired = row.status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < now);
      add({ source_module: 'Deviation', source_record_id: row.id, source_record_number: row.record_number, blocker_type: row.deviation_type ?? 'Deviation', blocker_title: row.title ?? (expired ? 'Expired deviation' : 'Active deviation'), blocker_description: row.reason, severity: expired ? 'Startup Blocker' : 'Warning', startup_blocker: expired, readiness_impact: expired ? 'Startup Blocked' : 'Fit for Service with Restrictions', recommended_action: expired ? 'Close, extend, or supersede expired deviation.' : 'Confirm temporary controls and restriction owner.', owner_user_id: row.owner_user_id, due_date: row.expiry_date });
    }
  }

  private async workOrderBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_work_orders').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Rejected","Cancelled","Verified")').limit(500)).catch(() => []);
    for (const row of rows) {
      const critical = row.risk_level === 'Critical' || row.priority === 'Emergency' || row.startup_blocker;
      const waiting = ['Waiting PTW','Waiting LOTO','Waiting Parts','Waiting Shutdown','Pending Verification','Verification Failed'].includes(row.status);
      add({ source_module: 'Work Order', source_record_id: row.id, source_record_number: row.work_order_number, blocker_type: row.work_order_type ?? 'Work Order', blocker_title: row.title ?? 'Open work order', blocker_description: row.description, severity: row.startup_blocker ? 'Startup Blocker' : critical ? 'Critical' : waiting ? 'Major' : 'Warning', startup_blocker: !!row.startup_blocker, readiness_impact: row.readiness_impact, recommended_action: row.status === 'Pending Verification' ? 'Complete technical verification.' : 'Complete or formally accept open work.', owner_user_id: row.owner_user_id ?? row.assigned_user_id, due_date: row.due_date });
    }
  }

  private async impairmentBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_safeguard_impairments').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).not('status', 'in', '("Closed","Cancelled","Restored")').limit(500)).catch(() => []);
    const now = new Date();
    for (const row of rows) {
      const expired = row.status === 'Expired' || (row.expiry_at && new Date(row.expiry_at) < now);
      add({ source_module: 'Bypass/Impairment', source_record_id: row.id, source_record_number: row.record_number, blocker_type: row.impairment_type ?? 'Impairment', blocker_title: row.reason ?? 'Active safeguard impairment', blocker_description: row.temporary_mitigation_summary, severity: expired || row.startup_blocked ? 'Startup Blocker' : row.risk_level === 'Critical' ? 'Critical' : 'Major', startup_blocker: !!row.startup_blocked || expired, readiness_impact: row.readiness_impact, recommended_action: expired ? 'Restore or extend impairment with approval.' : 'Verify mitigation and restoration plan.', owner_user_id: row.owner_user_id, due_date: row.expiry_at?.slice?.(0, 10) ?? null });
    }
  }

  private async inspectionBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_inspection_records').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).limit(100)).catch(() => []);
    const failed = rows.filter((row) => /fail|reject|critical/i.test(`${row.status} ${row.result} ${row.finding_status}`));
    for (const row of failed) add({ source_module: 'Inspection', source_record_id: row.id, source_record_number: row.inspection_number, blocker_type: 'Failed Inspection', blocker_title: 'Inspection result requires readiness review', severity: 'Major', recommended_action: 'Resolve inspection findings or create deficiency.', due_date: row.inspection_date });
  }

  private async pmBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_pm_records').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).limit(100)).catch(() => []);
    for (const row of rows.filter((item) => /fail|overdue|incomplete/i.test(`${item.status} ${item.result}`))) add({ source_module: 'PM', source_record_id: row.id, source_record_number: row.record_number, blocker_type: 'PM Follow-up', blocker_title: 'PM record failed or incomplete', severity: 'Warning', recommended_action: 'Complete PM follow-up or create work order.', due_date: row.due_date });
  }

  private async calibrationBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_calibration_records').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).limit(100)).catch(() => []);
    for (const row of rows.filter((item) => /fail|out of tolerance|overdue/i.test(`${item.status} ${item.final_result} ${item.as_left_result}`))) add({ source_module: 'Calibration', source_record_id: row.id, source_record_number: row.record_number, blocker_type: 'Calibration Failure', blocker_title: 'Calibration failed or certificate missing', severity: 'Major', recommended_action: 'Complete calibration correction and certificate.', due_date: row.calibration_date });
  }

  private async remainingLifeBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_remaining_life_evaluations').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).order('created_at', { ascending: false }).limit(5)).catch(() => []);
    for (const row of rows.filter((item) => /below|critical|error|insufficient/i.test(`${item.alert_state} ${item.evaluation_status} ${item.calculation_error}`))) add({ source_module: 'CML/TML Remaining Life', source_record_id: row.id, blocker_type: 'Remaining Life', blocker_title: 'Remaining life or CML calculation requires review', blocker_description: row.calculation_error, severity: /critical|below retirement|below minimum/i.test(`${row.alert_state} ${row.evaluation_status}`) ? 'Critical' : 'Major', recommended_action: 'Perform FFS or update CML readings/calculation.', due_date: row.half_life_due_date });
  }

  private async reliefBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_relief_device_tests').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).limit(100)).catch(() => []);
    for (const row of rows.filter((item) => /fail|overdue|missing/i.test(`${item.status} ${item.final_result} ${item.certificate_status}`))) add({ source_module: 'PSV', source_record_id: row.id, source_record_number: row.test_number, blocker_type: 'PSV Test', blocker_title: 'PSV/relief test failed or certificate missing', severity: 'Startup Blocker', startup_blocker: true, recommended_action: 'Repair/retest PSV and attach certificate.', due_date: row.test_date });
  }

  private async safeguardBlockers(user: RequestUser, equipmentId: string, add: (input: any) => void) {
    const rows = await this.db.many<any>(this.db.from('mi_safeguard_tests').select('*').eq('company_id', user.tenantId).eq('equipment_id', equipmentId).limit(100)).catch(() => []);
    for (const row of rows.filter((item) => /fail|overdue|degraded/i.test(`${item.status} ${item.final_result} ${item.evaluation_status}`))) add({ source_module: /alarm/i.test(row.safeguard_type) ? 'Critical Alarm' : /interlock/i.test(row.safeguard_type) ? 'Interlock' : 'SIF/SIS', source_record_id: row.id, source_record_number: row.test_number, blocker_type: row.safeguard_type ?? 'Safeguard Test', blocker_title: 'Safety-critical safeguard test failed or overdue', severity: 'Startup Blocker', startup_blocker: true, recommended_action: 'Repair/retest safeguard before startup.', due_date: row.test_date });
  }

  private recommendDecision(blockers: any[], restrictions: any[], assessment: any) {
    const open = blockers.filter((row) => !['Cleared','Waived With Approval'].includes(row.blocker_status ?? 'Open'));
    if (assessment?.current_equipment_status && /decommissioned|retired/i.test(assessment.current_equipment_status)) return 'Decommissioned / Retired';
    if (open.some((row) => row.startup_blocker || row.severity === 'Startup Blocker')) return 'Startup Blocked';
    if (open.some((row) => row.severity === 'Critical')) return 'Not Fit for Service';
    if (assessment?.ffs_required || open.some((row) => /FFS|Engineering|Remaining Life|Calculation/i.test(`${row.blocker_title} ${row.recommended_action}`))) return 'Engineering Review Required';
    if (restrictions.some((row) => row.status === 'Active') || open.some((row) => ['Major','Warning'].includes(row.severity))) return 'Fit for Service with Restrictions';
    return 'Fit for Service';
  }

  private async resolveEquipment(user: RequestUser, equipmentId?: string) {
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const row = await this.equipment.get(user.tenantId, equipmentId, user.siteIds);
    if (!row) throw new NotFoundException('Equipment not found.');
    if (user.siteIds.length && row.siteId && !user.corporateView && !user.siteIds.includes(row.siteId)) throw new BadRequestException('Equipment does not belong to an authorized site.');
    return row;
  }

  private async payload(user: RequestUser, equipment: any, body: Record<string, any>, update: boolean) {
    const now = new Date().toISOString();
    const companyId = user.tenantId;
    const siteId = equipment.siteId ?? body.siteId ?? user.selectedSiteId ?? user.siteIds[0];
    return {
      company_id: companyId,
      site_id: siteId,
      equipment_id: equipment.id,
      assessment_number: body.assessmentNumber ?? body.assessment_number ?? (update ? body.assessment_number : await this.nextNumber(companyId, siteId)),
      assessment_reason: body.assessmentReason ?? body.assessment_reason ?? 'Manual review',
      assessment_date: body.assessmentDate ?? body.assessment_date ?? new Date().toISOString().slice(0, 10),
      status: body.status ?? 'Draft',
      current_equipment_status: equipment.status ?? body.currentEquipmentStatus ?? body.current_equipment_status ?? null,
      previous_readiness_decision: body.previousReadinessDecision ?? body.previous_readiness_decision ?? body.approved_decision ?? null,
      recommended_decision: body.recommendedDecision ?? body.recommended_decision ?? 'Pending Verification',
      proposed_decision: body.proposedDecision ?? body.proposed_decision ?? null,
      decision_source: body.decisionSource ?? body.decision_source ?? 'Backend readiness engine',
      engineering_justification: body.engineeringJustification ?? body.engineering_justification ?? null,
      ffs_required: body.ffsRequired ?? body.ffs_required ?? false,
      ffs_assessment_reference: body.ffsAssessmentReference ?? body.ffs_assessment_reference ?? null,
      technical_basis: body.technicalBasis ?? body.technical_basis ?? null,
      risk_acceptance_statement: body.riskAcceptanceStatement ?? body.risk_acceptance_statement ?? null,
      operation_allowed: body.operationAllowed ?? body.operation_allowed ?? false,
      startup_blocked: body.startupBlocked ?? body.startup_blocked ?? false,
      pssr_impact: body.pssrImpact ?? body.pssr_impact ?? false,
      moc_required: body.mocRequired ?? body.moc_required ?? false,
      lopa_sil_impact: body.lopaSilImpact ?? body.lopa_sil_impact ?? false,
      restriction_active: body.restrictionActive ?? body.restriction_active ?? false,
      restriction_expiry_date: body.restrictionExpiryDate ?? body.restriction_expiry_date ?? null,
      next_review_due: body.nextReviewDue ?? body.next_review_due ?? null,
      assessor_user_id: body.assessorUserId ?? body.assessor_user_id ?? user.id,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? null,
      updated_by: user.id,
      updated_at: now,
      ...(update ? {} : { created_by: user.id, created_at: now })
    };
  }

  private validateDraft(payload: any) {
    if (!payload.equipment_id) throw new BadRequestException('Equipment is required.');
    if (!payload.assessment_reason) throw new BadRequestException('Assessment reason is required.');
    if (!payload.assessor_user_id) throw new BadRequestException('Assessor is required.');
    if (!assessmentReasons.includes(payload.assessment_reason)) throw new BadRequestException('Assessment reason is invalid.');
  }

  private assessmentReadiness(assessment: any, blockers: any[], restrictions: any[]) {
    const open = blockers.filter((row) => !['Cleared','Waived With Approval'].includes(row.blocker_status));
    const missing: string[] = [];
    if (!assessment.proposed_decision) missing.push('Proposed final decision is required.');
    if (/Restrictions/.test(String(assessment.proposed_decision ?? assessment.recommended_decision)) && !restrictions.length) missing.push('Restriction record with expiry is required.');
    if (assessment.status === 'Draft') missing.push('Run readiness check and submit for approval.');
    return { missing, blockers: open, canApprove: !missing.length, criticalBlockers: open.filter((item) => ['Critical','Startup Blocker'].includes(item.severity)).length };
  }

  private async assertRestrictionReady(user: RequestUser, assessmentId: string) {
    const restrictions = await this.restrictions(user, assessmentId);
    if (!restrictions.some((item) => item.status === 'Active' && item.expiry_date)) throw new BadRequestException('Fit With Restrictions requires an active restriction with expiry/review date.');
  }

  private assertEditable(row: any) {
    if (row.read_only || terminalStatuses.includes(row.status)) throw new BadRequestException('Closed/approved readiness assessment is read-only.');
  }

  private patch(before: any, status: string, extra: Record<string, any> = {}) {
    return this.db.single<any>(this.db.from('mi_readiness_assessments').update({ ...extra, status, updated_at: new Date().toISOString() }).eq('id', before.id).select().single());
  }

  private async transition(user: RequestUser, assessmentId: string, status: string, eventType: string, eventTitle: string, body: Record<string, any>) {
    const before = await this.getAssessment(user, assessmentId);
    this.assertEditable(before);
    const row = await this.patch(before, status, { updated_by: user.id });
    await this.addApproval(user, row, eventTitle, body.approverRole ?? 'Reviewer', eventType, body.comments ?? body.reason ?? null).catch(() => null);
    await this.writeEvent(user, row, eventType, eventTitle, before, row);
    return this.detail(user, assessmentId);
  }

  private async getAssessment(user: RequestUser, assessmentId: string) {
    let request = this.db.from('mi_readiness_assessments').select('*').eq('company_id', user.tenantId).eq('id', assessmentId);
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    const row = await this.db.single<any>(request.maybeSingle());
    if (!row) throw new NotFoundException('Readiness assessment not found.');
    return row;
  }

  private async decorateRows(user: RequestUser, rows: any[]) {
    const equipmentIds = [...new Set(rows.map((row) => row.equipment_id).filter(Boolean))];
    const equipmentRows = equipmentIds.length ? await this.db.many<any>(this.db.from('Equipment').select('id,tag,name,type,status,siteId,unitId,areaId,criticality,safetyCritical,psmCritical,fitnessStatus,startupBlocked,readinessStatus').eq('tenantId', user.tenantId).in('id', equipmentIds)).catch(() => []) : [];
    const equipmentMap = new Map(equipmentRows.map((row) => [row.id, row]));
    const counts = await this.blockerCounts(rows.map((row) => row.id));
    return rows.map((row) => {
      const equipment = equipmentMap.get(row.equipment_id) ?? {};
      const count = counts.get(row.id) ?? { total: 0, critical: 0 };
      return { ...row, equipment, equipment_tag: equipment.tag ?? row.equipment_id, equipment_name: equipment.name ?? null, equipment_type: equipment.type ?? null, blocker_count: count.total, critical_blockers: count.critical, active_restrictions: row.restriction_active ? 1 : 0 };
    });
  }

  private async blockerCounts(ids: string[]) {
    const map = new Map<string, { total: number; critical: number }>();
    if (!ids.length) return map;
    const rows = await this.db.many<any>(this.db.from('mi_readiness_blockers').select('assessment_id,severity,blocker_status').in('assessment_id', ids)).catch(() => []);
    for (const row of rows) {
      if (['Cleared','Waived With Approval'].includes(row.blocker_status)) continue;
      const current = map.get(row.assessment_id) ?? { total: 0, critical: 0 };
      current.total += 1;
      if (['Critical','Startup Blocker'].includes(row.severity)) current.critical += 1;
      map.set(row.assessment_id, current);
    }
    return map;
  }

  private async addApproval(user: RequestUser, assessment: any, stage: string, role: string, action: string, comments?: string | null) {
    return this.db.single<any>(this.db.from('mi_readiness_approvals').insert({ company_id: assessment.company_id, site_id: assessment.site_id, assessment_id: assessment.id, approval_stage: stage, approver_role: role, approver_user_id: user.id, action, comments: comments ?? null }).select().single());
  }

  private async addLinkedRecords(user: RequestUser, assessment: any, records: any[]) {
    if (!Array.isArray(records)) return;
    for (const record of records) await this.addLinkedRecord(user, assessment.id, record).catch(() => null);
  }

  private async addInitialRestrictions(user: RequestUser, assessment: any, restrictions: any[]) {
    if (!Array.isArray(restrictions)) return;
    for (const restriction of restrictions) {
      if (!(restriction.restrictionDescription ?? restriction.restriction_description) || !(restriction.expiryDate ?? restriction.expiry_date)) continue;
      await this.addRestriction(user, assessment.id, restriction).catch(() => null);
    }
  }

  private async updateEquipmentReadiness(user: RequestUser, assessment: any, blockers: any[], restrictions: any[]) {
    const decision = assessment.approved_decision ?? assessment.recommended_decision;
    await this.db.single<any>(this.db.from('Equipment').update({
      fitnessStatus: decision,
      readinessStatus: assessment.startup_blocked ? 'Blocked' : /Restrictions|Deviation/.test(decision) ? 'Restricted' : decision === 'Fit for Service' ? 'Ready' : 'Blocked',
      startupBlocked: assessment.startup_blocked,
      startupBlockReason: assessment.startup_blocked ? blockers.find((row) => row.startup_blocker)?.blocker_title ?? 'MI readiness assessment startup blocker.' : null,
      restrictionsSummary: restrictions.filter((row) => row.status === 'Active').map((row) => row.restriction_description).join('; ') || null,
      lastReadinessCheck: new Date().toISOString(),
      readinessCheckedBy: user.id,
      updatedAt: new Date().toISOString()
    }).eq('tenantId', user.tenantId).eq('id', assessment.equipment_id).select('id').single()).catch(() => null);
  }

  private async writeEvent(user: RequestUser, assessment: any, eventType: string, eventTitle: string, before: unknown, after: unknown) {
    const assessmentId = assessment.assessment_id ?? assessment.id ?? null;
    const equipmentId = assessment.equipment_id;
    await this.db.single(this.db.from('mi_readiness_history_events').insert({ company_id: assessment.company_id ?? user.tenantId, site_id: assessment.site_id ?? user.selectedSiteId ?? user.siteIds[0], assessment_id: assessmentId, equipment_id: equipmentId, event_type: eventType, event_title: eventTitle, event_description: eventTitle, before_value_json: before as JsonValue, after_value_json: after as JsonValue, actor_user_id: user.id, source_module: 'Mechanical Integrity Readiness', source_record_id: assessmentId }).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `MI_READINESS_${eventType.toUpperCase().replace(/\s+/g, '_')}`, entityType: 'MechanicalIntegrityReadiness', entityId: String(assessmentId ?? equipmentId), before: before as JsonValue, after: after as JsonValue }).catch(() => null);
  }

  private applyScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    if (query.siteId) scoped = scoped.eq('site_id', query.siteId);
    else if (user.selectedSiteId) scoped = scoped.eq('site_id', user.selectedSiteId);
    else if (!user.corporateView && user.siteIds.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyFilters(request: any, query: Query) {
    let scoped = request;
    if (query.equipmentId) scoped = scoped.eq('equipment_id', query.equipmentId);
    if (query.status) scoped = scoped.eq('status', query.status);
    if (query.decision) scoped = scoped.or(`recommended_decision.eq.${query.decision},approved_decision.eq.${query.decision},proposed_decision.eq.${query.decision}`);
    if (query.startupBlocked === 'true') scoped = scoped.eq('startup_blocked', true);
    if (query.pssrImpact === 'true') scoped = scoped.eq('pssr_impact', true);
    if (query.mocRequired === 'true') scoped = scoped.eq('moc_required', true);
    if (query.pendingApproval === 'true') scoped = scoped.in('status', ['Submitted','In Review','Override Requested']);
    if (query.search) scoped = scoped.or(`assessment_number.ilike.%${query.search}%,assessment_reason.ilike.%${query.search}%,recommended_decision.ilike.%${query.search}%`);
    return scoped;
  }

  private sortColumn(input?: string) {
    const allowed: Record<string, string> = { assessmentNumber: 'assessment_number', status: 'status', recommendedDecision: 'recommended_decision', assessmentDate: 'assessment_date', updatedAt: 'updated_at', createdAt: 'created_at' };
    return allowed[input ?? ''] ?? input ?? 'updated_at';
  }

  private effectiveDecision(row: any) {
    return row.approved_decision ?? row.proposed_decision ?? row.recommended_decision;
  }

  private async nextNumber(companyId: string, siteId: string) {
    const prefix = `MI-FFS-${new Date().getFullYear()}-`;
    const rows = await this.db.many<any>(this.db.from('mi_readiness_assessments').select('assessment_number').eq('company_id', companyId).eq('site_id', siteId).ilike('assessment_number', `${prefix}%`)).catch(() => []);
    return `${prefix}${String(rows.length + 1).padStart(6, '0')}`;
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
