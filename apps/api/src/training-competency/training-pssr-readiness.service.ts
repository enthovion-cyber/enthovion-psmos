import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const readinessRecordStatuses = ['Draft', 'Readiness Check Pending', 'Training Required', 'No Training Required', 'Assignments Pending', 'In Progress', 'Pending Verification', 'Ready', 'Ready With Waiver', 'Blocked', 'Overdue', 'Superseded', 'Closed', 'Archived'];
const readinessStatuses = ['Not Assessed', 'Not Ready', 'Partially Ready', 'Ready', 'Ready With Waiver', 'Blocked', 'Re-Evaluation Required'];
const impactLevels = ['Low', 'Medium', 'High', 'Critical'];
const readinessSources = ['PSSR Impact Assessment', 'PSSR Risk Ranking', 'PSSR Engineering Package', 'PSSR SOP Update', 'PSSR PSI Update', 'PSSR PSSR Readiness', 'PSSR Approval Condition', 'Training Matrix', 'Required Training Library', 'Manual'];
const assignmentStatuses = ['Assigned', 'Pending', 'In Progress', 'Completed', 'Completed Pending Verification', 'Missing Evidence', 'Overdue', 'Waived', 'Cancelled', 'Superseded', 'Re-Evaluation Required'];
const blockerTypes = ['Missing Required Training', 'Missing SOP Acknowledgement', 'Pending Assessment', 'Missing Certificate', 'Competency Gap', 'Pending Verification', 'Overdue Training', 'PSSR Scope Changed', 'Manual Review Required', 'Safety-Critical Gap'];
const blockerStatuses = ['Open', 'Action Created', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Reopened', 'Superseded'];
const waiverStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed'];

@Injectable()
export class TrainingPssrReadinessService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, register, bySite, byUnit, blockers, overdue, waivers] = await Promise.all([
      this.dashboardSummary(user, query),
      this.register(user, { ...query, limit: query.limit ?? 10 }),
      this.dashboardBySite(user, query),
      this.dashboardByUnit(user, query),
      this.blockers(user, { ...query, limit: 8 }),
      this.assignments(user, { ...query, statusView: 'overdue', limit: 8 }),
      this.waivers(user, { ...query, limit: 8 })
    ]);
    return {
      header: {
        title: 'PSSR Training Readiness',
        subtitle: 'Training readiness, blockers, evidence and waivers before PSSR implementation, startup and closure',
        selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      bySite,
      byUnit,
      byPssrStatus: this.countBy(register.allRows ?? register.rows, 'pssr.status'),
      byStartupType: this.countBy(register.allRows ?? register.rows, 'pssr.startup_type'),
      openApprovalBlockers: blockers.rows.filter((row: Row) => row.pssr_approval_blocker),
      openHandoverBlockers: blockers.rows.filter((row: Row) => row.handover_blocker),
      startupBlockers: blockers.rows.filter((row: Row) => row.startup_blocker),
      pendingAssignments: (register.allRows ?? []).filter((row: Row) => ['Assignments Pending', 'In Progress', 'Blocked', 'Overdue'].includes(row.readiness_status)).slice(0, 8),
      overdueTraining: overdue.rows,
      recentCompletedTraining: (await this.assignments(user, { ...query, statusView: 'completed', limit: 8 })).rows,
      recentWaivers: waivers.rows,
      reevaluationRequired: (register.allRows ?? []).filter((row: Row) => row.readiness_status === 'Re-Evaluation Required').slice(0, 8)
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [readiness, assignments, blockers, waivers, impactChecks] = await Promise.all([
      this.scopedReadiness(user, query),
      this.scopedAssignments(user, query),
      this.scopedBlockers(user, query),
      this.scopedWaivers(user, query),
      this.scopedImpactChecks(user, query)
    ]);
    return {
      totalPssrTrainingReadiness: readiness.length,
      pssrsRequiringTraining: new Set(readiness.filter((row) => row.training_required).map((row) => row.pssr_id)).size,
      pssrsWithNoTrainingRequired: new Set(readiness.filter((row) => !row.training_required).map((row) => row.pssr_id)).size,
      pssrsPendingTrainingImpactCheck: impactChecks.filter((row) => ['Pending', 'Manual Review Required'].includes(row.check_status)).length,
      trainingAssignmentsGenerated: assignments.length,
      workersAssigned: new Set(assignments.map((row) => row.worker_id).filter(Boolean)).size,
      workersCompleted: assignments.filter((row) => ['Completed', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      workersPending: assignments.filter((row) => ['Assigned', 'Pending', 'In Progress', 'Missing Evidence'].includes(row.runtime_status)).length,
      workersOverdue: assignments.filter((row) => row.runtime_overdue).length,
      missingEvidence: assignments.filter((row) => row.evidence_status === 'Missing Evidence').length,
      pendingVerification: assignments.filter((row) => row.verification_status === 'Pending').length,
      pendingSopAcknowledgement: assignments.filter((row) => row.sop_ack_assignment_id && !['Completed', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      pendingAssessment: assignments.filter((row) => row.assessment_assignment_id && !['Completed', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      pendingCertificate: assignments.filter((row) => row.certificate_id && !['Completed', 'Verified', 'Waived'].includes(row.runtime_status)).length,
      pssrApprovalBlockers: blockers.filter((row) => row.pssr_approval_blocker && row.blocker_status === 'Open').length,
      handoverBlockers: blockers.filter((row) => row.handover_blocker && row.blocker_status === 'Open').length,
      pssrStartupBlockers: blockers.filter((row) => row.startup_blocker && row.blocker_status === 'Open').length,
      ptwStartupWorkBlockers: blockers.filter((row) => row.ptw_blocker && row.blocker_status === 'Open').length,
      safetyCriticalTrainingGaps: blockers.filter((row) => row.blocker_type === 'Safety-Critical Gap' && row.blocker_status === 'Open').length,
      waiversActive: waivers.filter((row) => row.approval_status === 'Approved').length,
      pssrsReadyForStartup: readiness.filter((row) => ['Ready', 'Ready With Waiver'].includes(row.readiness_status)).length,
      pssrsNotReady: readiness.filter((row) => ['Not Assessed', 'Not Ready', 'Partially Ready', 'Blocked', 'Re-Evaluation Required'].includes(row.readiness_status)).length,
      recentPssrTrainingUpdates: (await this.history(user, { ...query, limit: 25 })).rows.length
    };
  }

  async dashboardBySite(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedReadiness(user, query);
    const sites = await this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId));
    const byId = new Map(sites.map((site) => [site.id, site]));
    return Object.entries(this.groupBy(rows, 'site_id')).map(([siteId, items]) => ({
      siteId,
      siteName: byId.get(siteId)?.name ?? siteId,
      total: items.length,
      ready: items.filter((row) => ['Ready', 'Ready With Waiver'].includes(row.readiness_status)).length,
      blocked: items.filter((row) => row.readiness_status === 'Blocked').length,
      pending: items.filter((row) => ['Not Assessed', 'Partially Ready', 'In Progress'].includes(row.readiness_status)).length,
      readinessPercent: this.percent(items.filter((row) => ['Ready', 'Ready With Waiver'].includes(row.readiness_status)).length, items.length)
    }));
  }

  async dashboardByUnit(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedReadiness(user, query);
    const units = await this.safeMany<Row>(this.db.from('Unit').select('id,name,code').eq('tenantId', user.tenantId));
    const byId = new Map(units.map((unit) => [unit.id, unit]));
    return Object.entries(this.groupBy(rows, 'unit_id')).map(([unitId, items]) => ({
      unitId: unitId === 'null' ? null : unitId,
      unitName: byId.get(unitId)?.name ?? (unitId === 'null' ? 'No unit scope' : unitId),
      total: items.length,
      ready: items.filter((row) => ['Ready', 'Ready With Waiver'].includes(row.readiness_status)).length,
      blockers: items.filter((row) => row.pssr_approval_blocker || row.handover_blocker || row.startup_blocker).length
    }));
  }

  async register(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyReadinessFilters(await this.hydrateReadiness(user, await this.scopedReadiness(user, query)), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit, summary: await this.dashboardSummary(user, query), filters: this.lookups(), savedViews: ['All PSSR Training', 'Pending', 'Overdue', 'Blockers', 'Ready', 'Waivers', 'Re-Evaluation Required'] };
  }

  async createReadiness(user: RequestUser, dto: Row) {
    const pssr = await this.assertPssr(user, dto.pssrId ?? dto.pssr_id);
    if (['Closed', 'Cancelled', 'Rejected'].includes(String(pssr.status))) throw new BadRequestException('Closed, cancelled, or rejected PSSRs cannot receive new training readiness without controlled reopen policy.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness').insert(this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: pssr.site_id,
      unit_id: pssr.unit_id,
      area_id: pssr.area_id,
      pssr_id: pssr.id,
      readiness_code: dto.readinessCode ?? dto.readiness_code ?? `PSSR-TRN-${Date.now()}`,
      readiness_title: dto.readinessTitle ?? dto.readiness_title ?? `Training for ${pssr.pssr_number}`,
      readiness_source: dto.readinessSource ?? dto.readiness_source ?? 'PSSR Impact Assessment',
      training_required: dto.trainingRequired ?? dto.training_required ?? true,
      training_required_reason: dto.trainingRequiredReason ?? dto.training_required_reason ?? 'PSSR change may affect worker tasks, procedures, PSI, SOPs, equipment, startup or closure readiness.',
      impact_level: dto.impactLevel ?? dto.impact_level ?? this.impactLevelFromPssr(pssr),
      safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical ?? ['High', 'Critical'].includes(String(pssr.risk_level))),
      psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical ?? true),
      ptw_critical: Boolean(dto.ptwCritical ?? dto.ptw_critical),
      startup_critical: Boolean(dto.pssrCritical ?? dto.startup_critical ?? String(pssr.status).includes('PSSR')),
      readiness_record_status: dto.readinessRecordStatus ?? dto.readiness_record_status ?? 'Readiness Check Pending',
      readiness_status: 'Not Assessed',
      pssr_approval_blocker: Boolean(dto.implementationBlocker ?? dto.pssr_approval_blocker ?? true),
      handover_blocker: Boolean(dto.closureBlocker ?? dto.handover_blocker ?? true),
      startup_blocker: Boolean(dto.startupBlocker ?? dto.startup_blocker ?? String(pssr.status).includes('PSSR')),
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? pssr.originator_id ?? pssr.created_by,
      due_date: dto.dueDate ?? dto.due_date ?? pssr.startup_target_date ?? pssr.target_startup_date,
      pssr_snapshot_json: this.pssrSnapshot(pssr),
      created_by: user.id,
      updated_by: user.id
    })).select().single()), 'PSSR training readiness was not returned by the database.');
    await this.upsertLinks(user, row, dto);
    await this.writeHistory(user, 'Created', 'PSSR training readiness created', null, row, { readiness_id: row.id, pssr_id: row.pssr_id, site_id: row.site_id });
    return this.readinessDetail(user, row.id);
  }

  async readinessDetail(user: RequestUser, readinessId: string) {
    const readiness = await this.assertReadiness(user, readinessId);
    const [pssr, impactChecks, links, workers, assignments, readinessCheck, blockers, waivers, history] = await Promise.all([
      this.assertPssr(user, readiness.pssr_id),
      this.safeMany<Row>(this.db.from('training_pssr_readiness_checks').select('*').eq('company_id', user.tenantId).eq('readiness_id', readinessId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_pssr_readiness_training_links').select('*').eq('company_id', user.tenantId).eq('readiness_id', readinessId).is('removed_at', null)),
      this.requiredWorkers(user, readinessId),
      this.readinessAssignments(user, readinessId),
      this.readiness(user, readinessId),
      this.blockers(user, { readinessId, limit: 100 }),
      this.waivers(user, { readinessId, limit: 100 }),
      this.history(user, { readinessId, limit: 100 })
    ]);
    return { readiness: { ...readiness, pssr }, impactChecks, links, requiredWorkers: workers.rows, assignments: assignments.rows, readinessCheck, blockers: blockers.rows, waivers: waivers.rows, history: history.rows };
  }

  async updateReadiness(user: RequestUser, readinessId: string, dto: Row) {
    const before = await this.assertReadiness(user, readinessId);
    const update = this.compact({
      readiness_title: dto.readinessTitle ?? dto.readiness_title,
      readiness_source: dto.readinessSource ?? dto.readiness_source,
      training_required: dto.trainingRequired ?? dto.training_required,
      training_required_reason: dto.trainingRequiredReason ?? dto.training_required_reason,
      impact_level: dto.impactLevel ?? dto.impact_level,
      safety_critical: dto.safetyCritical ?? dto.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical,
      ptw_critical: dto.ptwCritical ?? dto.ptw_critical,
      startup_critical: dto.pssrCritical ?? dto.startup_critical,
      pssr_approval_blocker: dto.implementationBlocker ?? dto.pssr_approval_blocker,
      handover_blocker: dto.closureBlocker ?? dto.handover_blocker,
      startup_blocker: dto.startupBlocker ?? dto.startup_blocker,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      due_date: dto.dueDate ?? dto.due_date,
      readiness_status: 'Re-Evaluation Required',
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness').update(update).eq('company_id', user.tenantId).eq('id', readinessId).select().single()), 'Updated PSSR training readiness was not returned by the database.');
    await this.upsertLinks(user, row, dto);
    await this.writeHistory(user, 'Updated', 'PSSR training readiness updated', before, row, { readiness_id: row.id, pssr_id: row.pssr_id, site_id: row.site_id });
    return this.readinessDetail(user, row.id);
  }

  async archiveReadiness(user: RequestUser, readinessId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Archive reason is required.');
    const before = await this.assertReadiness(user, readinessId);
    const row = await this.updateReadinessStatus(user, before, { readiness_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason }, 'Archived', 'PSSR training readiness archived');
    return row;
  }

  async reactivateReadiness(user: RequestUser, readinessId: string, dto: Row = {}) {
    const before = await this.assertReadiness(user, readinessId);
    return this.updateReadinessStatus(user, before, { readiness_record_status: dto.readinessRecordStatus ?? 'Readiness Check Pending', archived_at: null, archived_by: null, archive_reason: null }, 'Reactivated', 'PSSR training readiness reactivated');
  }

  async activateReadiness(user: RequestUser, readinessId: string, dto: Row = {}) {
    const before = await this.assertReadiness(user, readinessId);
    const status = before.training_required ? 'Training Required' : 'No Training Required';
    return this.updateReadinessStatus(user, before, { readiness_record_status: status, updated_by: user.id, updated_at: new Date().toISOString() }, 'Activated', 'PSSR training readiness activated');
  }

  async impactChecks(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedImpactChecks(user, query);
    return this.paginate(this.sortRows(rows, String(query.sort ?? 'created_at.desc')), query);
  }

  async runImpactCheck(user: RequestUser, readinessId: string, dto: Row = {}) {
    const readiness = await this.assertReadiness(user, readinessId);
    const pssr = await this.assertPssr(user, readiness.pssr_id);
    const answers = dto.answers ?? dto.impactAnswersJson ?? {};
    const trainingRequired = Boolean(dto.trainingRequired ?? readiness.training_required ?? this.trainingRequiredFromPssr(pssr, answers));
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness_checks').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: readiness.site_id,
      pssr_id: pssr.id,
      readiness_id: readiness.id,
      check_status: 'Completed',
      check_result: trainingRequired ? 'Training Required' : 'No Training Required',
      training_required: trainingRequired,
      sop_ack_required: Boolean(dto.sopAckRequired ?? dto.sop_ack_required ?? answers.sopUpdated),
      assessment_required: Boolean(dto.assessmentRequired ?? dto.assessment_required ?? answers.highRiskChange),
      certificate_required: Boolean(dto.certificateRequired ?? dto.certificate_required),
      competency_review_required: Boolean(dto.competencyReviewRequired ?? dto.competency_review_required ?? answers.roleTaskChanged),
      ptw_reauthorization_required: Boolean(dto.ptwReauthorizationRequired ?? dto.ptw_reauthorization_required ?? answers.ptwRoleAffected),
      pssr_training_readiness_required: Boolean(dto.pssrTrainingReadinessRequired ?? dto.pssr_training_readiness_required ?? answers.pssrRequired),
      manual_review_required: Boolean(dto.manualReviewRequired ?? dto.manual_review_required ?? false),
      impact_answers_json: answers,
      impact_reasons_json: dto.reasons ?? dto.impact_reasons_json ?? {},
      pssr_snapshot_json: this.pssrSnapshot(pssr),
      checked_by: user.id,
      checked_at: new Date().toISOString()
    }).select().single()), 'PSSR training impact check was not returned by the database.');
    await this.updateReadinessStatus(user, readiness, { training_required: trainingRequired, readiness_record_status: trainingRequired ? 'Training Required' : 'No Training Required', last_evaluated_at: new Date().toISOString() }, 'Impact Check Completed', 'PSSR training impact check completed');
    await this.writeHistory(user, 'Impact Check Completed', 'PSSR training impact check completed', null, row, { readiness_id: readiness.id, pssr_id: pssr.id, site_id: readiness.site_id });
    return row;
  }

  async previewAffectedWorkers(user: RequestUser, readinessId: string, query: Row = {}) {
    const readiness = await this.assertReadiness(user, readinessId);
    const workers = await this.resolveWorkers(user, readiness, query);
    return { rows: workers, total: workers.length, generatedBy: 'Backend workforce resolver', sources: ['PSSR affected site', 'PSSR unit/area', 'job role', 'contractor company', 'PTW role', 'manual filters'] };
  }

  async requiredWorkers(user: RequestUser, readinessId: string, query: Row = {}) {
    await this.assertReadiness(user, readinessId);
    const rows = await this.safeMany<Row>(this.siteScoped(user, this.db.from('training_pssr_required_workers').select('*').eq('company_id', user.tenantId).eq('readiness_id', readinessId), query));
    return this.paginate(rows, query);
  }

  async addAffectedWorker(user: RequestUser, readinessId: string, dto: Row = {}) {
    const readiness = await this.assertReadiness(user, readinessId);
    const worker = await this.assertWorker(user, dto.workerId ?? dto.worker_id);
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_required_workers').upsert({
      id: dto.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: readiness.site_id,
      unit_id: worker.primary_unit_id ?? readiness.unit_id,
      area_id: worker.primary_area_id ?? readiness.area_id,
      readiness_id: readiness.id,
      pssr_id: readiness.pssr_id,
      worker_id: worker.id,
      worker_type: worker.worker_type,
      employer_type: worker.employer_type,
      contractor_company_name: worker.contractor_company_name,
      job_role: worker.job_title,
      competency_profile_id: worker.competency_profile_id,
      required_reason: dto.requiredReason ?? dto.required_reason ?? 'Manually added to PSSR required worker list',
      required_source: dto.requiredSource ?? dto.required_source ?? 'Manual',
      safety_critical_affected: Boolean(dto.safetyCriticalAffected ?? dto.safety_critical_affected ?? readiness.safety_critical),
      ptw_affected: Boolean(dto.ptwAffected ?? dto.ptw_affected ?? readiness.ptw_critical),
      pssr_startup_affected: Boolean(dto.pssrStartupAffected ?? dto.pssr_startup_affected ?? readiness.startup_critical),
      supervisor_user_id: worker.supervisor_user_id ?? dto.supervisorUserId ?? null,
      included: true,
      added_by: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'readiness_id,worker_id' }).select().single()), 'Affected worker was not returned by the database.');
    await this.writeHistory(user, 'Required Worker Added', 'Affected worker added to PSSR training readiness', null, row, { readiness_id: readiness.id, pssr_id: readiness.pssr_id, worker_id: worker.id, site_id: readiness.site_id });
    return row;
  }

  async removeAffectedWorker(user: RequestUser, readinessId: string, affectedWorkerId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Affected worker removal reason is required.');
    const before = this.must(await this.db.single<Row>(this.db.from('training_pssr_required_workers').select('*').eq('company_id', user.tenantId).eq('readiness_id', readinessId).eq('id', affectedWorkerId).single()), 'Affected worker not found.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_required_workers').update({ included: false, excluded_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', affectedWorkerId).select().single()), 'Affected worker update not returned.');
    await this.writeHistory(user, 'Required Worker Removed', 'Affected worker excluded from PSSR training readiness', before, row, { readiness_id: row.readiness_id, pssr_id: row.pssr_id, worker_id: row.worker_id, site_id: row.site_id });
    return row;
  }

  async generateAssignments(user: RequestUser, readinessId: string, dto: Row = {}) {
    const readiness = await this.assertReadiness(user, readinessId);
    let affected = (await this.requiredWorkers(user, readinessId, { limit: 500 })).allRows ?? [];
    if (!affected.length || dto.refreshAffectedWorkers) {
      const workers = await this.resolveWorkers(user, readiness, dto);
      affected = [];
      for (const worker of workers) affected.push(await this.addAffectedWorker(user, readiness.id, { workerId: worker.id, requiredReason: worker.requiredReason, requiredSource: worker.requiredSource }));
    }
    const links = await this.safeMany<Row>(this.db.from('training_pssr_readiness_training_links').select('*').eq('company_id', user.tenantId).eq('readiness_id', readiness.id).is('removed_at', null));
    const created: Row[] = [];
    for (const worker of affected.filter((row: Row) => row.included !== false)) {
      const link = links[0] ?? {};
      const existing = await this.safeMany<Row>(this.db.from('training_pssr_assignments').select('id').eq('company_id', user.tenantId).eq('readiness_id', readiness.id).eq('worker_id', worker.worker_id).limit(1));
      if (existing.length) continue;
      const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_assignments').insert({
        id: randomUUID(),
        company_id: user.tenantId,
        site_id: readiness.site_id,
        unit_id: worker.unit_id ?? readiness.unit_id,
        area_id: worker.area_id ?? readiness.area_id,
        readiness_id: readiness.id,
        pssr_id: readiness.pssr_id,
        worker_id: worker.worker_id,
        required_worker_id: worker.id,
        training_item_id: link.training_item_id ?? null,
        training_item_version: link.training_item_version ?? null,
        sop_ack_assignment_id: link.sop_ack_readiness_id ?? null,
        assessment_assignment_id: link.assessment_id ?? null,
        certificate_id: link.certificate_category ?? null,
        competency_readiness_id: link.competency_readiness_id ?? null,
        matrix_assignment_id: link.matrix_rule_id ?? null,
        due_date: dto.dueDate ?? dto.due_date ?? readiness.due_date,
        assignment_status: 'Assigned',
        completion_status: 'Pending',
        evidence_status: 'Missing Evidence',
        verification_status: 'Not Required',
        pssr_approval_blocker: readiness.pssr_approval_blocker,
        handover_blocker: readiness.handover_blocker,
        startup_blocker: readiness.startup_blocker,
        ptw_blocker: readiness.ptw_critical,
        assigned_by: user.id,
        recommended_action: readiness.safety_critical ? 'Complete before implementation/startup. Waiver requires elevated approval.' : 'Complete before PSSR closure.'
      }).select().single()), 'PSSR training assignment was not returned by database.');
      created.push(row);
    }
    await this.updateReadinessStatus(user, readiness, { readiness_status: created.length ? 'In Progress' : 'Assignments Pending', updated_at: new Date().toISOString() }, 'Assignments Generated', 'PSSR training assignments generated');
    const readinessResult = await this.runReadiness(user, readiness.id, { triggeredBy: 'Assignment generation' });
    await this.writeEvaluationRun(user, 'Assignment Generation', readiness, { assignments_created: created.length, total_workers: affected.length, result_summary_json: { created: created.length, readiness: readinessResult } });
    return { rows: created, total: created.length, requiredWorkers: affected.length, readiness: readinessResult };
  }

  async assignments(user: RequestUser, query: Row = {}) {
    const rows = this.sortRows(this.applyAssignmentFilters(await this.hydrateAssignments(user, await this.scopedAssignments(user, query)), query), String(query.sort ?? 'updated_at.desc'));
    return this.paginate(rows, query, this.assignmentSummary(rows));
  }

  async readinessAssignments(user: RequestUser, readinessId: string, query: Row = {}) {
    await this.assertReadiness(user, readinessId);
    return this.assignments(user, { ...query, readinessId });
  }

  async assignmentDetail(user: RequestUser, assignmentId: string) {
    const assignment = await this.assertAssignment(user, assignmentId);
    const [readiness, blockers, waivers, history] = await Promise.all([
      this.assertReadiness(user, assignment.readiness_id),
      this.blockers(user, { assignmentId, limit: 50 }),
      this.waivers(user, { assignmentId, limit: 50 }),
      this.history(user, { assignmentId, limit: 50 })
    ]);
    return { assignment, readiness, blockers: blockers.rows, waivers: waivers.rows, history: history.rows };
  }

  async cancelAssignment(user: RequestUser, assignmentId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Cancellation reason is required.');
    const before = await this.assertAssignment(user, assignmentId);
    const row = await this.updateAssignment(user, before, { assignment_status: 'Cancelled', completion_status: 'Cancelled', cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason }, 'Assignment Cancelled', 'PSSR training assignment cancelled');
    await this.runReadiness(user, row.readiness_id, { triggeredBy: 'Assignment cancellation' });
    return row;
  }

  async recalculateAssignment(user: RequestUser, assignmentId: string) {
    const before = await this.assertAssignment(user, assignmentId);
    const row = await this.updateAssignment(user, before, this.runtimeAssignmentStatus(before), 'Assignment Recalculated', 'PSSR training assignment recalculated');
    await this.runReadiness(user, row.readiness_id, { triggeredBy: 'Assignment recalculation' });
    return row;
  }

  async readiness(user: RequestUser, readinessId: string) {
    await this.assertReadiness(user, readinessId);
    const rows = await this.safeMany<Row>(this.db.from('training_pssr_readiness_evaluations').select('*').eq('company_id', user.tenantId).eq('readiness_id', readinessId).order('evaluated_at', { ascending: false }).limit(1));
    return rows[0] ?? { readiness_status: 'Not Assessed', total_workers: 0, result_summary_json: { message: 'Readiness has not been run.' } };
  }

  async runReadiness(user: RequestUser, readinessId: string, dto: Row = {}) {
    const readiness = await this.assertReadiness(user, readinessId);
    const assignments = await this.scopedAssignments(user, { readinessId });
    const open = assignments.filter((row) => !['Completed', 'Verified', 'Waived', 'Cancelled'].includes(row.runtime_status));
    const overdue = assignments.filter((row) => row.runtime_overdue);
    const waived = assignments.filter((row) => row.completion_status === 'Waived' || row.waiver_id);
    const status = !assignments.length ? 'Not Assessed' : overdue.length ? 'Blocked' : open.length ? (open.length === assignments.length ? 'Not Ready' : 'Partially Ready') : waived.length ? 'Ready With Waiver' : 'Ready';
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness_evaluations').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: readiness.site_id,
      unit_id: readiness.unit_id,
      area_id: readiness.area_id,
      pssr_id: readiness.pssr_id,
      readiness_id: readiness.id,
      readiness_status: status,
      total_workers: assignments.length,
      completed_workers: assignments.filter((item) => ['Completed', 'Verified'].includes(item.runtime_status)).length,
      pending_workers: open.length,
      overdue_workers: overdue.length,
      waived_workers: waived.length,
      missing_training_count: assignments.filter((item) => item.training_item_id && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      missing_sop_ack_count: assignments.filter((item) => item.sop_ack_assignment_id && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      missing_assessment_count: assignments.filter((item) => item.assessment_assignment_id && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      missing_certificate_count: assignments.filter((item) => item.certificate_id && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      missing_competency_count: assignments.filter((item) => item.competency_readiness_id && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      pending_verification_count: assignments.filter((item) => item.verification_status === 'Pending').length,
      pssr_approval_blocker_count: assignments.filter((item) => item.pssr_approval_blocker && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      handover_blocker_count: assignments.filter((item) => item.handover_blocker && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      startup_blocker_count: assignments.filter((item) => item.startup_blocker && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      ptw_blocker_count: assignments.filter((item) => item.ptw_blocker && !['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length,
      safety_critical_gap_count: readiness.safety_critical ? open.length : 0,
      evidence_package_status: open.length ? 'Incomplete' : 'Complete',
      stale_due_to_pssr_change: Boolean(dto.staleDueToPssrChange ?? dto.stale_due_to_pssr_change),
      result_summary_json: { triggeredBy: dto.triggeredBy ?? dto.triggered_by ?? 'Manual readiness run', adapter: 'PSSR readiness adapter pending', blockersFeedPssr: true },
      evaluated_by: user.id,
      evaluated_at: new Date().toISOString()
    }).select().single()), 'PSSR training readiness check was not returned by the database.');
    await this.rebuildBlockers(user, readiness, assignments, row);
    await this.updateReadinessStatus(user, readiness, { readiness_status: status, readiness_record_status: status === 'Ready' ? 'Ready' : status === 'Ready With Waiver' ? 'Ready With Waiver' : status === 'Blocked' ? 'Blocked' : readiness.readiness_record_status, last_evaluated_at: new Date().toISOString() }, 'Readiness Evaluated', 'PSSR training readiness evaluated');
    await this.writeHistory(user, 'Readiness Evaluated', 'PSSR training readiness evaluated', null, row, { readiness_id: readiness.id, pssr_id: readiness.pssr_id, site_id: readiness.site_id });
    return row;
  }

  async blockers(user: RequestUser, query: Row = {}) {
    const rows = this.sortRows(await this.hydrateBlockers(user, await this.scopedBlockers(user, query)), String(query.sort ?? 'updated_at.desc'));
    return this.paginate(rows, query);
  }

  approvalBlockers(user: RequestUser, query: Row = {}) { return this.blockers(user, { ...query, approvalBlocker: 'true' }); }
  handoverBlockers(user: RequestUser, query: Row = {}) { return this.blockers(user, { ...query, handoverBlocker: 'true' }); }
  implementationBlockers(user: RequestUser, query: Row = {}) { return this.approvalBlockers(user, query); }
  closureBlockers(user: RequestUser, query: Row = {}) { return this.handoverBlockers(user, query); }
  startupBlockers(user: RequestUser, query: Row = {}) { return this.blockers(user, { ...query, startupBlocker: 'true' }); }

  async blockerDetail(user: RequestUser, blockerId: string) {
    const blocker = await this.assertBlocker(user, blockerId);
    const [assignment, waivers, history] = await Promise.all([
      blocker.assignment_id ? this.assertAssignment(user, blocker.assignment_id) : null,
      this.waivers(user, { blockerId, limit: 25 }),
      this.history(user, { blockerId, limit: 25 })
    ]);
    return { blocker, assignment, waivers: waivers.rows, history: history.rows };
  }

  async createBlockerAction(user: RequestUser, blockerId: string, dto: Row = {}) {
    const before = await this.assertBlocker(user, blockerId);
    return this.updateBlocker(user, before, { blocker_status: 'Action Created', action_id: dto.actionId ?? dto.action_id ?? `uae:${randomUUID()}` }, 'Action Created', 'PSSR training blocker action created through Universal Action Engine adapter');
  }

  async markBlockerResolved(user: RequestUser, blockerId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.closureNote ?? dto.closure_note, 'Resolution reason is required.');
    const before = await this.assertBlocker(user, blockerId);
    return this.updateBlocker(user, before, { blocker_status: 'Resolved', resolved_by: user.id, resolved_at: new Date().toISOString(), closure_note: dto.reason ?? dto.closureNote ?? dto.closure_note }, 'Blocker Resolved', 'PSSR training blocker resolved');
  }

  async verifyBlocker(user: RequestUser, blockerId: string, dto: Row = {}) {
    const before = await this.assertBlocker(user, blockerId);
    return this.updateBlocker(user, before, { blocker_status: 'Verified', verified_by: user.id, verified_at: new Date().toISOString(), closure_note: dto.reason ?? dto.note ?? before.closure_note }, 'Blocker Verified', 'PSSR training blocker verified');
  }

  async reopenBlocker(user: RequestUser, blockerId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.assertBlocker(user, blockerId);
    return this.updateBlocker(user, before, { blocker_status: 'Reopened', resolved_by: null, resolved_at: null, verified_by: null, verified_at: null, closure_note: dto.reason }, 'Blocker Reopened', 'PSSR training blocker reopened');
  }

  async waivers(user: RequestUser, query: Row = {}) {
    const rows = this.sortRows(await this.scopedWaivers(user, query), String(query.sort ?? 'updated_at.desc'));
    return this.paginate(rows, query);
  }

  async requestWaiver(user: RequestUser, blockerId: string, dto: Row = {}) {
    this.requireText(dto.waiverReason ?? dto.waiver_reason ?? dto.reason, 'Waiver reason is required.');
    const blocker = await this.assertBlocker(user, blockerId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_waivers').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: blocker.site_id,
      pssr_id: blocker.pssr_id,
      readiness_id: blocker.readiness_id,
      assignment_id: blocker.assignment_id,
      blocker_id: blocker.id,
      worker_id: blocker.worker_id,
      waiver_type: dto.waiverType ?? dto.waiver_type ?? 'Temporary',
      waiver_reason: dto.waiverReason ?? dto.waiver_reason ?? dto.reason,
      risk_justification: dto.riskJustification ?? dto.risk_justification ?? null,
      compensating_control: dto.compensatingControl ?? dto.compensating_control ?? null,
      expiry_date: dto.expiryDate ?? dto.expiry_date ?? null,
      approval_status: 'Requested',
      esignature_status: blocker.blocker_severity === 'Critical' ? 'Required' : 'Not Required',
      evidence_document_id: dto.evidenceDocumentId ?? dto.evidence_document_id ?? null,
      created_by: user.id
    }).select().single()), 'PSSR training waiver was not returned by the database.');
    await this.updateBlocker(user, blocker, { waiver_id: row.id, blocker_status: 'Waiver Requested' }, 'Waiver Requested', 'PSSR training blocker waiver requested');
    return row;
  }

  async decideWaiver(user: RequestUser, waiverId: string, decision: 'approve' | 'reject' | 'revoke', dto: Row = {}) {
    const before = this.must(await this.db.single<Row>(this.db.from('training_pssr_waivers').select('*').eq('company_id', user.tenantId).eq('id', waiverId).single()), 'PSSR training waiver not found.');
    if (decision !== 'approve') this.requireText(dto.reason, `${decision} reason is required.`);
    const update = decision === 'approve'
      ? { approval_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString() }
      : decision === 'reject'
        ? { approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason }
        : { approval_status: 'Revoked', revoked_by: user.id, revoked_at: new Date().toISOString(), revoke_reason: dto.reason };
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_waivers').update({ ...update, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', waiverId).select().single()), 'Updated PSSR training waiver was not returned by the database.');
    if (row.blocker_id && decision === 'approve') await this.updateBlocker(user, await this.assertBlocker(user, row.blocker_id), { blocker_status: 'Waived', waiver_id: row.id }, 'Waiver Approved', 'PSSR training waiver approved');
    await this.writeHistory(user, `Waiver ${decision}`, `PSSR training waiver ${decision}`, before, row, { readiness_id: row.readiness_id, pssr_id: row.pssr_id, blocker_id: row.blocker_id, worker_id: row.worker_id, site_id: row.site_id });
    if (row.readiness_id) await this.runReadiness(user, row.readiness_id, { triggeredBy: `Waiver ${decision}` });
    return row;
  }

  pending(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'pending' }); }
  overdue(user: RequestUser, query: Row = {}) { return this.assignments(user, { ...query, statusView: 'overdue' }); }
  ready(user: RequestUser, query: Row = {}) { return this.register(user, { ...query, readinessStatus: 'Ready' }); }
  workerReadiness(user: RequestUser, workerId: string, query: Row = {}) { return this.assignments(user, { ...query, workerId }); }
  workerAssignments(user: RequestUser, workerId: string, query: Row = {}) { return this.assignments(user, { ...query, workerId }); }
  workerHistory(user: RequestUser, workerId: string, query: Row = {}) { return this.history(user, { ...query, workerId }); }
  scopedSite(user: RequestUser, siteId: string, query: Row = {}) { this.assertSiteAccess(user, siteId); return this.register(user, { ...query, siteId }); }
  scopedUnit(user: RequestUser, unitId: string, query: Row = {}) { return this.register(user, { ...query, unitId }); }
  scopedArea(user: RequestUser, areaId: string, query: Row = {}) { return this.register(user, { ...query, areaId }); }

  pssrReadinessRecords(user: RequestUser, pssrId: string, query: Row = {}) { return this.register(user, { ...query, pssrId }); }
  async createForPssr(user: RequestUser, pssrId: string, dto: Row = {}) { return this.createReadiness(user, { ...dto, pssrId }); }
  async pssrReadiness(user: RequestUser, pssrId: string) {
    await this.assertPssr(user, pssrId);
    const rows = await this.safeMany<Row>(this.db.from('training_pssr_readiness_evaluations').select('*').eq('company_id', user.tenantId).eq('pssr_id', pssrId).order('evaluated_at', { ascending: false }).limit(20));
    return { rows, latest: rows[0] ?? null };
  }
  async runPssrReadiness(user: RequestUser, pssrId: string, dto: Row = {}) {
    const readiness = await this.scopedReadiness(user, { pssrId });
    const rows = [];
    for (const req of readiness) rows.push(await this.runReadiness(user, req.id, dto));
    return { rows, total: rows.length, pssrId };
  }
  pssrBlockers(user: RequestUser, pssrId: string, query: Row = {}) { return this.blockers(user, { ...query, pssrId }); }
  pssrEvidence(user: RequestUser, pssrId: string, query: Row = {}) { return this.assignments(user, { ...query, pssrId }); }
  async pssrImpactCheck(user: RequestUser, pssrId: string, query: Row = {}) {
    await this.assertPssr(user, pssrId);
    const rows = await this.scopedImpactChecks(user, { ...query, pssrId });
    return { rows, latest: rows[0] ?? null };
  }
  async runPssrImpactCheck(user: RequestUser, pssrId: string, dto: Row = {}) {
    const pssr = await this.assertPssr(user, pssrId);
    const readinessRows = await this.scopedReadiness(user, { pssrId });
    const created = readinessRows[0] ? null : await this.createReadiness(user, { ...dto, pssrId });
    const readiness = (readinessRows[0] ?? created?.readiness) as Row;
    return this.runImpactCheck(user, readiness.id, { ...dto, pssrSnapshot: this.pssrSnapshot(pssr) });
  }

  async importTemplate() {
    return { columns: ['pssr_number_or_id', 'readiness_code', 'readiness_title', 'readiness_source', 'training_required', 'training_required_reason', 'impact_level', 'safety_critical', 'psm_critical', 'ptw_critical', 'startup_critical', 'training_item_id', 'sop_ack_readiness_id', 'assessment_id', 'certificate_category', 'due_date', 'pssr_approval_blocker', 'handover_blocker', 'startup_blocker', 'owner_email', 'active'] };
  }

  async importRows(user: RequestUser, dto: Row = {}) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const created = [];
    for (const row of rows) {
      const pssr = await this.findPssr(user, row.pssr_number_or_id ?? row.pssrId ?? row.pssr_id);
      if (!pssr) continue;
      created.push(await this.createReadiness(user, { ...row, pssrId: pssr.id, readinessStatus: row.active === true || row.active === 'true' ? 'Training Required' : 'Draft' }));
    }
    await this.writeEvaluationRun(user, 'Import', null, { total_readiness: created.length, result_summary_json: { imported: created.length } });
    return { rows: created, total: created.length };
  }

  async exportRows(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedReadiness(user, query);
    await this.writeHistory(user, 'Exported', 'PSSR training readiness exported', null, { total: rows.length }, { site_id: query.siteId ?? null });
    return { rows, total: rows.length, exportedAt: new Date().toISOString() };
  }

  async history(user: RequestUser, query: Row = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let req: any = this.siteScoped(user, this.db.from('training_pssr_history_events').select('*').eq('company_id', user.tenantId), query);
    if (query.readinessId) req = req.eq('readiness_id', query.readinessId);
    if (query.assignmentId) req = req.eq('assignment_id', query.assignmentId);
    if (query.blockerId) req = req.eq('blocker_id', query.blockerId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }).limit(limit));
    return { rows, total: rows.length };
  }

  async settings(user: RequestUser, query: Row = {}) {
    const rows = await this.safeMany<Row>(this.siteScoped(user, this.db.from('training_pssr_settings').select('*').eq('company_id', user.tenantId), query).limit(1));
    return rows[0] ?? {
      company_id: user.tenantId,
      site_id: query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      require_training_impact_check_for_pssr: true,
      auto_create_training_readiness_from_pssr: true,
      auto_generate_assignments: false,
      block_pssr_implementation_on_training_gap: true,
      block_pssr_closure_on_training_gap: true,
      block_pssr_startup_on_pssr_training_gap: true
    };
  }

  async updateSettings(user: RequestUser, dto: Row = {}) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const existing = await this.safeMany<Row>(this.db.from('training_pssr_settings').select('id').eq('company_id', user.tenantId).eq('site_id', siteId).limit(1));
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_settings').upsert({ id: existing[0]?.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, ...this.compact(dto), updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select().single()), 'PSSR training settings were not returned by the database.');
    await this.writeHistory(user, 'Settings Updated', 'PSSR training settings updated', existing[0] ?? null, row, { site_id: siteId });
    return row;
  }

  lookups() {
    return { readinessRecordStatuses, readinessStatuses, impactLevels, readinessSources, assignmentStatuses, blockerTypes, blockerStatuses, waiverStatuses };
  }

  lookup(name: string) {
    return { values: this.lookups()[name as keyof ReturnType<TrainingPssrReadinessService['lookups']>] ?? [] };
  }

  private async scopedReadiness(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_pssr_readiness').select('*').eq('company_id', user.tenantId), query);
    if (query.includeArchived !== 'true') req = req.is('archived_at', null);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    if (query.readinessId) req = req.eq('id', query.readinessId);
    return this.safeMany<Row>(req);
  }

  private async scopedAssignments(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_pssr_assignments').select('*').eq('company_id', user.tenantId), query);
    if (query.readinessId) req = req.eq('readiness_id', query.readinessId);
    if (query.assignmentId) req = req.eq('id', query.assignmentId);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.unitId) req = req.eq('unit_id', query.unitId);
    if (query.areaId) req = req.eq('area_id', query.areaId);
    const rows = await this.safeMany<Row>(req);
    return rows.map((row) => ({ ...row, ...this.runtimeAssignmentStatus(row) }));
  }

  private async scopedBlockers(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_pssr_blockers').select('*').eq('company_id', user.tenantId), query);
    if (query.readinessId) req = req.eq('readiness_id', query.readinessId);
    if (query.assignmentId) req = req.eq('assignment_id', query.assignmentId);
    if (query.blockerId) req = req.eq('id', query.blockerId);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.approvalBlocker === 'true' || query.implementationBlocker === 'true') req = req.eq('pssr_approval_blocker', true);
    if (query.handoverBlocker === 'true' || query.closureBlocker === 'true') req = req.eq('handover_blocker', true);
    if (query.startupBlocker === 'true') req = req.eq('startup_blocker', true);
    return this.safeMany<Row>(req);
  }

  private async scopedWaivers(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_pssr_waivers').select('*').eq('company_id', user.tenantId), query);
    if (query.readinessId) req = req.eq('readiness_id', query.readinessId);
    if (query.assignmentId) req = req.eq('assignment_id', query.assignmentId);
    if (query.blockerId) req = req.eq('blocker_id', query.blockerId);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    return this.safeMany<Row>(req);
  }

  private async scopedImpactChecks(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.siteScoped(user, this.db.from('training_pssr_readiness_checks').select('*').eq('company_id', user.tenantId), query);
    if (query.readinessId) req = req.eq('readiness_id', query.readinessId);
    if (query.pssrId) req = req.eq('pssr_id', query.pssrId);
    return this.safeMany<Row>(req.order('created_at', { ascending: false }));
  }

  private async hydrateReadiness(user: RequestUser, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return [];
    const pssrIds = [...new Set(rows.map((row) => row.pssr_id).filter(Boolean))];
    const pssrs = pssrIds.length ? await this.safeMany<Row>(this.db.from('pssrs').select('*').eq('tenant_id', user.tenantId).in('id', pssrIds)) : [];
    const byId = new Map(pssrs.map((pssr) => [pssr.id, pssr]));
    const assignments = await this.scopedAssignments(user, {});
    return rows.map((row) => {
      const related = assignments.filter((item) => item.readiness_id === row.id);
      return { ...row, pssr: byId.get(row.pssr_id) ?? null, assigned_workers: related.length, completed: related.filter((item) => ['Completed', 'Verified', 'Waived'].includes(item.runtime_status)).length, pending: related.filter((item) => !['Completed', 'Verified', 'Waived', 'Cancelled'].includes(item.runtime_status)).length, overdue: related.filter((item) => item.runtime_overdue).length, missing_evidence: related.filter((item) => item.evidence_status === 'Missing Evidence').length };
    });
  }

  private async hydrateAssignments(user: RequestUser, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return [];
    const workerIds = [...new Set(rows.map((row) => row.worker_id).filter(Boolean))];
    const reqIds = [...new Set(rows.map((row) => row.readiness_id).filter(Boolean))];
    const [workers, readiness] = await Promise.all([
      workerIds.length ? this.safeMany<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).in('id', workerIds)) : [],
      reqIds.length ? this.safeMany<Row>(this.db.from('training_pssr_readiness').select('*').eq('company_id', user.tenantId).in('id', reqIds)) : []
    ]);
    const workerById = new Map(workers.map((worker) => [worker.id, worker]));
    const reqById = new Map(readiness.map((req) => [req.id, req]));
    return rows.map((row) => ({ ...row, worker: workerById.get(row.worker_id) ?? null, readiness: reqById.get(row.readiness_id) ?? null }));
  }

  private async hydrateBlockers(user: RequestUser, rows: Row[]): Promise<Row[]> {
    const assignments = await this.hydrateAssignments(user, rows.filter((row) => row.assignment_id).map((row) => ({ id: row.assignment_id, company_id: row.company_id })));
    return rows.map((row) => ({ ...row, assignment: assignments.find((item) => item.id === row.assignment_id) ?? null }));
  }

  private applyReadinessFilters(rows: Row[], query: Row) {
    return rows.filter((row) => {
      if (query.readinessStatus && row.readiness_status !== query.readinessStatus) return false;
      if (query.readinessStatus && row.readiness_status !== query.readinessStatus) return false;
      if (query.statusView === 'ready' && !['Ready', 'Ready With Waiver'].includes(row.readiness_status)) return false;
      if (query.statusView === 'blockers' && !(row.pssr_approval_blocker || row.handover_blocker || row.startup_blocker)) return false;
      const search = String(query.search ?? '').toLowerCase();
      if (search && ![row.readiness_code, row.readiness_title, row.pssr?.pssr_number, row.pssr?.title].some((value) => String(value ?? '').toLowerCase().includes(search))) return false;
      return true;
    });
  }

  private applyAssignmentFilters(rows: Row[], query: Row) {
    return rows.filter((row) => {
      const view = query.statusView;
      if (view === 'pending' && ['Completed', 'Verified', 'Waived', 'Cancelled'].includes(row.runtime_status)) return false;
      if (view === 'overdue' && !row.runtime_overdue) return false;
      if (view === 'completed' && !['Completed', 'Verified'].includes(row.runtime_status)) return false;
      const search = String(query.search ?? '').toLowerCase();
      if (search && ![row.worker?.display_name, row.worker_id, row.readiness?.readiness_title, row.pssr_id].some((value) => String(value ?? '').toLowerCase().includes(search))) return false;
      return true;
    });
  }

  private runtimeAssignmentStatus(row: Row) {
    const due = row.due_date ? new Date(`${row.due_date}T23:59:59`) : null;
    const overdue = Boolean(due && due.getTime() < Date.now() && !['Completed', 'Verified', 'Waived', 'Cancelled'].includes(row.completion_status));
    return { overdue, runtime_overdue: overdue, runtime_status: overdue ? 'Overdue' : row.completion_status ?? row.assignment_status };
  }

  private assignmentSummary(rows: Row[]) {
    return { total: rows.length, pending: rows.filter((row) => ['Assigned', 'Pending', 'In Progress', 'Missing Evidence'].includes(row.runtime_status)).length, completed: rows.filter((row) => ['Completed', 'Verified'].includes(row.runtime_status)).length, overdue: rows.filter((row) => row.runtime_overdue).length, missingEvidence: rows.filter((row) => row.evidence_status === 'Missing Evidence').length, pendingVerification: rows.filter((row) => row.verification_status === 'Pending').length, blockers: rows.filter((row) => row.pssr_approval_blocker || row.handover_blocker || row.startup_blocker || row.ptw_blocker).length };
  }

  private async rebuildBlockers(user: RequestUser, readiness: Row, assignments: Row[], readinessCheck: Row) {
    const openAssignments = assignments.filter((row) => !['Completed', 'Verified', 'Waived', 'Cancelled'].includes(row.runtime_status));
    for (const assignment of openAssignments) {
      const existing = await this.safeMany<Row>(this.db.from('training_pssr_blockers').select('id').eq('company_id', user.tenantId).eq('assignment_id', assignment.id).eq('blocker_status', 'Open').limit(1));
      if (existing.length) continue;
      await this.db.single<Row>(this.db.from('training_pssr_blockers').insert({
        id: randomUUID(),
        company_id: user.tenantId,
        site_id: assignment.site_id,
        unit_id: assignment.unit_id,
        area_id: assignment.area_id,
        pssr_id: assignment.pssr_id,
        readiness_id: assignment.readiness_id,
        assignment_id: assignment.id,
        worker_id: assignment.worker_id,
        blocker_type: assignment.evidence_status === 'Missing Evidence' ? 'Missing Required Training' : 'Pending Verification',
        blocker_title: assignment.evidence_status === 'Missing Evidence' ? 'PSSR training evidence missing' : 'PSSR training verification pending',
        blocker_status: 'Open',
        blocker_severity: readiness.safety_critical ? 'Critical' : 'High',
        pssr_approval_blocker: assignment.pssr_approval_blocker,
        handover_blocker: assignment.handover_blocker,
        startup_blocker: assignment.startup_blocker,
        ptw_blocker: assignment.ptw_blocker,
        due_date: assignment.due_date,
        evidence_expected: 'Training record, SOP acknowledgement, assessment, certificate or competency evidence',
        evidence_found: assignment.evidence_status,
        owner_user_id: readiness.owner_user_id,
        last_detected_at: new Date().toISOString()
      }).select().single()).catch(() => null);
    }
    if (readinessCheck.readiness_status === 'Ready') await this.safeMany(this.db.from('training_pssr_blockers').update({ blocker_status: 'Resolved', resolved_by: user.id, resolved_at: new Date().toISOString(), closure_note: 'Resolved by readiness calculation' }).eq('company_id', user.tenantId).eq('readiness_id', readiness.id).eq('blocker_status', 'Open').select());
  }

  private async resolveWorkers(user: RequestUser, readiness: Row, query: Row): Promise<Row[]> {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    if (query.workerId) req = req.eq('id', query.workerId);
    else if (readiness.site_id) req = req.eq('primary_site_id', readiness.site_id);
    const workers = await this.safeMany<Row>(req.limit(500));
    return workers.map((worker) => ({ ...worker, requiredReason: `Affected by PSSR ${readiness.pssr_id}`, requiredSource: 'PSSR affected site/unit/role resolver' }));
  }

  private async upsertLinks(user: RequestUser, readiness: Row, dto: Row) {
    const linkPayloads = Array.isArray(dto.links) ? dto.links : [{
      training_item_id: dto.trainingItemId ?? dto.training_item_id ?? null,
      training_item_version: dto.trainingItemVersion ?? dto.training_item_version ?? null,
      matrix_rule_id: dto.matrixRuleId ?? dto.matrix_rule_id ?? null,
      competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id ?? null,
      competency_readiness_id: dto.competencyReadinessId ?? dto.competency_readiness_id ?? null,
      sop_ack_readiness_id: dto.sopAckReadinessId ?? dto.sop_ack_readiness_id ?? null,
      assessment_id: dto.assessmentId ?? dto.assessment_id ?? null,
      certificate_category: dto.certificateCategory ?? dto.certificate_category ?? null,
      link_type: dto.linkType ?? dto.link_type ?? 'Required Training',
      required: dto.required ?? true,
      safety_critical: dto.linkSafetyCritical ?? readiness.safety_critical
    }];
    for (const link of linkPayloads.filter((item: Row) => Object.values(item).some(Boolean))) {
      await this.db.single<Row>(this.db.from('training_pssr_readiness_training_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: readiness.site_id, readiness_id: readiness.id, created_by: user.id, ...this.compact(link) }).select().single()).catch(() => null);
    }
  }

  private async assertReadiness(user: RequestUser, readinessId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness').select('*').eq('company_id', user.tenantId).eq('id', readinessId).single()), 'PSSR training readiness not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAssignment(user: RequestUser, assignmentId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_assignments').select('*').eq('company_id', user.tenantId).eq('id', assignmentId).single()), 'PSSR training assignment not found.');
    this.assertSiteAccess(user, row.site_id);
    return { ...row, ...this.runtimeAssignmentStatus(row) };
  }

  private async assertBlocker(user: RequestUser, blockerId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_blockers').select('*').eq('company_id', user.tenantId).eq('id', blockerId).single()), 'PSSR training blocker not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertWorker(user: RequestUser, workerId: string): Promise<Row> {
    const row = this.must(await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single()), 'Training worker not found.');
    if (row.primary_site_id) this.assertSiteAccess(user, row.primary_site_id);
    return row;
  }

  private async assertPssr(user: RequestUser, pssrId: string): Promise<Row> {
    const pssr = await this.findPssr(user, pssrId);
    if (!pssr) throw new NotFoundException('PSSR record not found or inaccessible.');
    this.assertSiteAccess(user, pssr.site_id);
    return pssr;
  }

  private async findPssr(user: RequestUser, pssrIdOrNumber: string): Promise<Row | null> {
    if (!pssrIdOrNumber) throw new BadRequestException('PSSR record is required.');
    const rows = await this.safeMany<Row>(this.db.from('pssrs').select('*').eq('tenant_id', user.tenantId).or(`id.eq.${pssrIdOrNumber},pssr_number.eq.${pssrIdOrNumber}`).limit(1));
    return rows[0] ?? null;
  }

  private async updateReadinessStatus(user: RequestUser, before: Row, update: Row, eventType: string, title: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_readiness').update({ ...update, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated PSSR training readiness was not returned by the database.');
    await this.writeHistory(user, eventType, title, before, row, { readiness_id: row.id, pssr_id: row.pssr_id, site_id: row.site_id });
    return row;
  }

  private async updateAssignment(user: RequestUser, before: Row, update: Row, eventType: string, title: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_assignments').update({ ...update, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated PSSR training assignment was not returned by the database.');
    await this.writeHistory(user, eventType, title, before, row, { readiness_id: row.readiness_id, pssr_id: row.pssr_id, assignment_id: row.id, worker_id: row.worker_id, site_id: row.site_id });
    return row;
  }

  private async updateBlocker(user: RequestUser, before: Row, update: Row, eventType: string, title: string) {
    const row = this.must(await this.db.single<Row>(this.db.from('training_pssr_blockers').update({ ...update, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated PSSR training blocker was not returned by the database.');
    await this.writeHistory(user, eventType, title, before, row, { readiness_id: row.readiness_id, pssr_id: row.pssr_id, assignment_id: row.assignment_id, blocker_id: row.id, worker_id: row.worker_id, site_id: row.site_id });
    return row;
  }

  private async writeEvaluationRun(user: RequestUser, runScope: string, readiness: Row | null, data: Row = {}) {
    await this.db.single<Row>(this.db.from('training_pssr_evaluation_runs').insert({ id: randomUUID(), company_id: user.tenantId, site_id: readiness?.site_id ?? data.site_id ?? null, run_scope: runScope, scope_record_id: readiness?.id ?? data.scope_record_id ?? null, pssr_id: readiness?.pssr_id ?? data.pssr_id ?? null, readiness_id: readiness?.id ?? null, triggered_by_type: data.triggered_by_type ?? 'Manual', triggered_by_user_id: user.id, status: data.status ?? 'Completed', started_at: data.started_at ?? new Date().toISOString(), completed_at: data.completed_at ?? new Date().toISOString(), ...this.compact(data) }).select().single()).catch(() => null);
  }

  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row = {}) {
    const event = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: scope.site_id ?? after?.site_id ?? before?.site_id ?? null,
      unit_id: scope.unit_id ?? after?.unit_id ?? before?.unit_id ?? null,
      area_id: scope.area_id ?? after?.area_id ?? before?.area_id ?? null,
      pssr_id: scope.pssr_id ?? after?.pssr_id ?? before?.pssr_id ?? null,
      readiness_id: scope.readiness_id ?? after?.readiness_id ?? before?.readiness_id ?? after?.id ?? before?.id ?? null,
      assignment_id: scope.assignment_id ?? after?.assignment_id ?? before?.assignment_id ?? null,
      blocker_id: scope.blocker_id ?? after?.blocker_id ?? before?.blocker_id ?? null,
      worker_id: scope.worker_id ?? after?.worker_id ?? before?.worker_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: title,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: user.id,
      source_record_id: scope.source_record_id ?? after?.id ?? before?.id ?? null
    };
    await this.db.single<Row>(this.db.from('training_pssr_history_events').insert(event).select().single()).catch(() => null);
    await this.audit.write({
      tenantId: user.tenantId,
      actorId: user.id,
      action: eventType,
      entityType: 'TRAINING_PSSR',
      entityId: scope.readiness_id ?? after?.readiness_id ?? before?.readiness_id ?? after?.id ?? before?.id ?? undefined,
      before: before ?? null,
      after: after ?? null,
      metadata: { title, scope }
    }).catch(() => null);
  }

  private pssrSnapshot(pssr: Row) {
    return { id: pssr.id, pssr_number: pssr.pssr_number, title: pssr.title, status: pssr.status, change_type: pssr.change_type, change_category: pssr.change_category, risk_level: pssr.risk_level, risk_score: pssr.risk_score, site_id: pssr.site_id, unit_id: pssr.unit_id, area_id: pssr.area_id, target_implementation_date: pssr.target_implementation_date };
  }

  private trainingRequiredFromPssr(pssr: Row, answers: Row = {}) {
    return Boolean(answers.trainingRequired ?? answers.sopUpdated ?? answers.psiChanged ?? answers.roleTaskChanged ?? answers.ptwRoleAffected ?? ['High', 'Critical'].includes(String(pssr.risk_level)) ?? false);
  }

  private impactLevelFromPssr(pssr: Row) {
    return ['High', 'Critical'].includes(String(pssr.risk_level)) ? pssr.risk_level : 'Medium';
  }

  private siteScoped(user: RequestUser, req: any, query: Row = {}) {
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) {
      this.assertSiteAccess(user, siteId);
      return req.eq('site_id', siteId);
    }
    const allowed = this.allowedSiteIds(user);
    return allowed.length ? req.in('site_id', allowed) : req;
  }

  private assertSiteAccess(user: RequestUser, siteId: string) {
    const allowed = this.allowedSiteIds(user);
    const selected = user.selectedSiteId ?? user.activeSiteId ?? null;
    if (selected && selected !== siteId) throw new ForbiddenException('You do not have access to the selected site.');
    if (allowed.length && !allowed.includes(siteId)) throw new ForbiddenException('You do not have access to this site.');
  }

  private allowedSiteIds(user: RequestUser) {
    const raw = (user as Row).siteIds ?? (user as Row).site_ids ?? (user as Row).allowedSiteIds ?? [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }

  private paginate(rows: Row[], query: Row = {}, summary?: Row) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), allRows: rows, total: rows.length, page, limit, summary, filters: this.lookups(), savedViews: ['All', 'Pending', 'Overdue', 'Ready', 'Blockers', 'Waivers', 'Re-Evaluation Required'] };
  }

  private groupBy(rows: Row[], key: string): Record<string, Row[]> {
    return rows.reduce<Record<string, Row[]>>((acc, row) => {
      const value = key.split('.').reduce<any>((current, part) => current?.[part], row);
      const group = String(value ?? 'null');
      acc[group] = [...(acc[group] ?? []), row];
      return acc;
    }, {});
  }

  private countBy(rows: Row[], key: string) {
    return Object.entries(this.groupBy(rows, key)).map(([value, items]) => ({ value: value === 'null' ? 'Not set' : value, count: items.length }));
  }

  private sortRows(rows: Row[], sort: string): Row[] {
    const [rawField, direction] = sort.split('.');
    const field = rawField || 'updated_at';
    return [...rows].sort((a, b) => direction === 'asc' ? String(a[field] ?? '').localeCompare(String(b[field] ?? '')) : String(b[field] ?? '').localeCompare(String(a[field] ?? '')));
  }

  private compact(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private percent(count: number, total: number) {
    return total ? Math.round((count / total) * 100) : 0;
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private must<T>(value: T | null | undefined, message: string): T {
    if (!value) throw new NotFoundException(message);
    return value;
  }

  private async safeMany<T = Row>(query: PromiseLike<{ data?: T[] | null; error?: { message?: string } | null }> | any): Promise<T[]> {
    const result = await query;
    if (result?.error) throw new BadRequestException(result.error.message ?? 'Database query failed.');
    return result?.data ?? [];
  }
}

