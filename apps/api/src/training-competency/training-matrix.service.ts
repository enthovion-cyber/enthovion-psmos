import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

export const trainingCategories = ['Site Induction', 'Contractor Onboarding', 'Process Safety Management', 'Chemical / SDS Awareness', 'Process Chemistry', 'Safe Operating Limits', 'SOP / Procedure', 'PTW', 'LOTO / Isolation', 'Hot Work', 'Confined Space', 'Work at Height', 'Excavation', 'Lifting', 'Electrical Safety', 'Gas Testing', 'Emergency Response', 'Fire Safety', 'Environmental', 'Mechanical Integrity', 'Equipment-Specific', 'HAZOP / Risk Awareness', 'MOC Training', 'PSSR / Startup Readiness', 'Security / General Compliance', 'Other'];
export const requirementSources = ['Company Policy', 'Site Policy', 'Unit Requirement', 'Job Role', 'Competency Profile', 'Worker Type', 'Contractor Requirement', 'PTW Role', 'SOP', 'PSI Chemical Hazard', 'PSI Safe Operating Limit', 'PSI Safeguard', 'PSI Electrical Classification', 'PSI Material Compatibility', 'MOC', 'PSSR', 'HAZOP Recommendation', 'Incident Lesson Learned', 'Audit Finding', 'Manual'];
export const applicabilityScopes = ['Company', 'Site', 'Department', 'Unit', 'Area', 'Equipment', 'Worker', 'Worker type', 'Job role', 'Competency profile', 'Contractor company', 'PTW role', 'SOP', 'MOC', 'PSSR', 'PSI hazard', 'Custom rule'];
export const matrixCellStatuses = ['Required - Complete', 'Required - Missing', 'Required - Overdue', 'Required - Expiring Soon', 'Required - Pending Verification', 'Required - Waived', 'Required - Not Applicable', 'Optional', 'Not Required', 'Blocked', 'Unknown / Not Evaluated'];
export const matrixGapTypes = ['Missing Required Training', 'Overdue Training', 'Expiring Training', 'Missing Evidence', 'Pending Verification', 'Failed Assessment', 'Missing Certificate', 'Expired Certificate', 'SOP Acknowledgement Missing', 'PTW Authorization Blocker', 'MOC Training Blocker', 'PSSR Training Blocker', 'Safety-Critical Training Gap', 'Contractor Onboarding Gap', 'Site Induction Missing', 'Unknown / Needs Review'];
export const matrixGapStatuses = ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Evidence', 'Waiting Verification', 'Waiting Approval', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Closed', 'Reopened', 'Cancelled'];
export const matrixGapSeverities = ['Info', 'Low', 'Medium', 'High', 'Critical', 'Work Blocker', 'Startup Blocker'];
export const evidenceTypes = ['Training attendance record', 'Certificate', 'Assessment score', 'Quiz pass', 'SOP acknowledgement', 'Practical assessment', 'Supervisor sign-off', 'HSE approval', 'External document', 'LMS import', 'Manual verification', 'Other'];
export const matrixRunStatuses = ['Queued', 'Running', 'Completed', 'Completed With Warnings', 'Failed', 'Cancelled'];
export const waiverStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed'];

@Injectable()
export class TrainingMatrixService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, bySite, byUnit, byRole, safetyCriticalGaps, recentRuns, recentChanges] = await Promise.all([
      this.dashboardSummary(user, query),
      this.dashboardBySite(user, query),
      this.dashboardByUnit(user, query),
      this.dashboardByRole(user, query),
      this.gaps(user, { ...query, safetyCritical: 'true', limit: 8 }),
      this.runHistory(user, { limit: 8 }),
      this.history(user, { limit: 8 })
    ]);
    return { header: { title: 'Training Matrix', subtitle: 'Backend-calculated required training, gaps, blockers, and evaluation status', lastUpdated: new Date().toISOString() }, summary, bySite, byUnit, byRole, safetyCriticalGapsPreview: safetyCriticalGaps.rows, recentMatrixEvaluations: recentRuns.rows, recentRuleChanges: recentChanges.rows };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [rules, workers, assignments, gaps, summaries, runs] = await Promise.all([
      this.rulesRows(user, query),
      this.workerRows(user, query),
      this.assignmentsRows(user, query),
      this.gapRows(user, query),
      this.summaryRows(user, query),
      this.runRows(user, query)
    ]);
    const latestRun = runs[0] ?? null;
    return {
      totalMatrixRules: rules.length,
      activeMatrixRules: rules.filter((row) => row.active && !row.archived_at).length,
      workersEvaluated: summaries.filter((row) => row.evaluated_at).length,
      workersNotEvaluated: Math.max(0, workers.length - summaries.filter((row) => row.evaluated_at).length),
      requiredTrainingAssignments: assignments.length,
      completedRequirements: summaries.reduce((sum, row) => sum + Number(row.complete_count ?? 0), 0),
      incompleteRequirements: summaries.reduce((sum, row) => sum + Number(row.incomplete_count ?? 0), 0),
      overdueRequirements: summaries.reduce((sum, row) => sum + Number(row.overdue_count ?? 0), 0),
      expiringSoon: summaries.reduce((sum, row) => sum + Number(row.expiring_soon_count ?? 0), 0),
      safetyCriticalTrainingGaps: gaps.filter((row) => row.safety_critical_work_blocker || row.gap_type === 'Safety-Critical Training Gap').length,
      contractorTrainingGaps: gaps.filter((row) => row.gap_type === 'Contractor Onboarding Gap').length,
      ptwRoleTrainingGaps: gaps.filter((row) => row.ptw_blocker).length,
      sopTrainingGaps: gaps.filter((row) => row.gap_type === 'SOP Acknowledgement Missing').length,
      mocTrainingGaps: gaps.filter((row) => row.moc_blocker).length,
      pssrTrainingBlockers: gaps.filter((row) => row.pssr_blocker).length,
      missingEvidence: gaps.filter((row) => row.gap_type === 'Missing Evidence').length,
      pendingVerification: gaps.filter((row) => row.gap_status === 'Waiting Verification').length,
      waiversActive: gaps.filter((row) => row.gap_status === 'Waived').length,
      matrixEvaluationFailures: runs.filter((row) => row.status === 'Failed').length,
      lastMatrixRun: latestRun?.completed_at ?? latestRun?.started_at ?? latestRun?.created_at ?? null
    };
  }

  async dashboardBySite(user: RequestUser, query: Row = {}) {
    const summaries = await this.summaryRows(user, query);
    const sites = await this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId));
    const siteById = new Map(sites.map((site) => [site.id, site]));
    return this.groupEntries(summaries, 'site_id').map(([siteId, rows]) => this.aggregateGroup(siteId === 'null' ? 'No site assignment' : siteById.get(siteId)?.name ?? siteId, rows));
  }

  async dashboardByUnit(user: RequestUser, query: Row = {}) {
    const assignments = await this.scopedAssignments(user, query);
    const summaries = await this.summaryRows(user, query);
    const summaryByWorker = new Map(summaries.map((row) => [row.worker_id, row]));
    const units = await this.safeMany<Row>(this.db.from('Unit').select('id,name,code').eq('tenantId', user.tenantId));
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    return this.groupEntries(assignments, 'unit_id').map(([unitId, rows]) => this.aggregateGroup(unitId === 'null' ? 'No unit assignment' : unitById.get(unitId)?.name ?? unitId, rows.map((row) => summaryByWorker.get(row.worker_id)).filter(Boolean) as Row[]));
  }

  async dashboardByRole(user: RequestUser, query: Row = {}) {
    const workers = await this.workerRows(user, query);
    const summaries = await this.summaryRows(user, query);
    const summaryByWorker = new Map(summaries.map((row) => [row.worker_id, row]));
    return this.groupEntries(workers, 'job_title').map(([role, rows]) => this.aggregateGroup(role === 'null' ? 'No role assignment' : role, rows.map((row) => summaryByWorker.get(row.id)).filter(Boolean) as Row[], rows.length));
  }

  async matrix(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const workers = this.filterWorkers(await this.workerRows(user, query), query);
    const summaries = await this.summaryRows(user, query);
    const summaryByWorker = new Map(summaries.map((row) => [row.worker_id, row]));
    const rows = workers.map((worker) => ({ worker, summary: summaryByWorker.get(worker.id) ?? this.emptySummary(worker) }));
    const paged = rows.slice((page - 1) * limit, page * limit);
    return { rows: paged, total: rows.length, page, limit, lastUpdated: new Date().toISOString() };
  }

  async roleView(user: RequestUser, query: Row = {}) {
    const matrix = await this.matrix(user, { ...query, limit: 500 });
    return this.groupEntries(matrix.rows.map((row: Row) => ({ ...row.summary, worker: row.worker, job_role: row.worker.job_title ?? 'No role assignment' })), 'job_role').map(([role, rows]) => this.aggregateGroup(role, rows, rows.length));
  }

  async unitView(user: RequestUser, query: Row = {}) {
    return this.dashboardByUnit(user, query);
  }

  async workerMatrix(user: RequestUser, workerId: string) {
    const worker = await this.assertWorker(user, workerId);
    const [assignments, evaluations, gaps, summary, runs] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_matrix_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).order('training_title')),
      this.safeMany<Row>(this.db.from('training_matrix_evaluations').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).order('evaluated_at', { ascending: false })),
      this.gaps(user, { workerId, limit: 200 }),
      this.safeMany<Row>(this.db.from('training_matrix_worker_summaries').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).limit(1)),
      this.runRows(user, { workerId, limit: 20 })
    ]);
    return { worker, summary: summary[0] ?? this.emptySummary(worker), requirements: assignments, evaluations, gaps: gaps.rows, evaluationHistory: runs };
  }

  async rules(user: RequestUser, query: Row = {}) {
    const rows = this.filterRules(await this.rulesRows(user, query), query);
    return this.paginate(rows, query);
  }

  async rule(user: RequestUser, ruleId: string) {
    const rule = await this.assertRule(user, ruleId);
    return { rule, affectedWorkersPreview: await this.previewAffectedWorkers(user, ruleId) };
  }

  async createRule(user: RequestUser, dto: Row) {
    this.validateRule(user, dto, true);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_rules').insert(this.rulePayload(user, dto, true)).select().single()), 'Training matrix rule was not returned by the database.');
    await this.writeHistory(user, 'Created', 'Training matrix rule created', null, row, { matrix_rule_id: row.id, site_id: row.site_id });
    if (row.active) await this.evaluate(user, { ruleId: row.id, runScope: 'Rule', triggeredByType: 'Rule created/updated/activated' });
    return this.rule(user, row.id);
  }

  async updateRule(user: RequestUser, ruleId: string, dto: Row) {
    const before = await this.assertRule(user, ruleId);
    if (before.rule_status === 'Approved' && !dto.reopenReason) throw new BadRequestException('Approved/locked matrix rules require controlled edit/reopen reason.');
    this.validateRule(user, { ...before, ...dto }, false);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_rules').update(this.rulePayload(user, dto, false)).eq('company_id', user.tenantId).eq('id', ruleId).select().single()), 'Updated matrix rule was not returned by the database.');
    await this.writeHistory(user, 'Updated', 'Training matrix rule updated', before, row, { matrix_rule_id: row.id, site_id: row.site_id });
    if (row.active) await this.evaluate(user, { ruleId: row.id, runScope: 'Rule', triggeredByType: 'Rule created/updated/activated' });
    return this.rule(user, ruleId);
  }

  async archiveRule(user: RequestUser, ruleId: string, dto: Row) {
    this.requireText(dto.reason, 'Archive reason is required.');
    const before = await this.assertRule(user, ruleId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_rules').update({ active: false, rule_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select().single()), 'Archived rule was not returned by the database.');
    await this.writeHistory(user, 'Archived', 'Training matrix rule archived', before, row, { matrix_rule_id: row.id, site_id: row.site_id });
    return row;
  }

  async setRuleActive(user: RequestUser, ruleId: string, active: boolean) {
    const before = await this.assertRule(user, ruleId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_rules').update({ active, rule_status: active ? 'Active' : 'Inactive', archived_at: active ? null : before.archived_at, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', ruleId).select().single()), 'Rule status change was not returned by the database.');
    await this.writeHistory(user, active ? 'Activated' : 'Deactivated', active ? 'Training matrix rule activated' : 'Training matrix rule deactivated', before, row, { matrix_rule_id: row.id, site_id: row.site_id });
    if (active) await this.evaluate(user, { ruleId: row.id, runScope: 'Rule', triggeredByType: 'Rule created/updated/activated' });
    return row;
  }

  async previewAffectedWorkers(user: RequestUser, ruleId: string) {
    const rule = await this.assertRule(user, ruleId);
    const workers = (await this.workerRows(user, {})).filter((worker) => this.ruleAppliesToWorker(rule, worker));
    const currentGaps = await this.gapRows(user, { ruleId });
    return { totalAffectedWorkers: workers.length, workers: workers.slice(0, 50), estimatedCurrentGaps: currentGaps.length, affectedSites: [...new Set(workers.map((row) => row.primary_site_id).filter(Boolean))], blockingImpact: this.blockingImpact(rule) };
  }

  async evaluate(user: RequestUser, dto: Row = {}) {
    const runScope = dto.runScope ?? dto.run_scope ?? (dto.workerId ? 'Worker' : dto.siteId ? 'Site' : dto.unitId ? 'Unit' : dto.ruleId ? 'Rule' : 'Company');
    const scopeRecordId = dto.workerId ?? dto.siteId ?? dto.unitId ?? dto.areaId ?? dto.ruleId ?? null;
    if (runScope === 'Company' && !this.scope(user).corporateView) throw new ForbiddenException('Company-wide matrix evaluation requires elevated company permission.');
    if (dto.siteId) this.assertSiteAccess(user, dto.siteId);
    const run = this.must(await this.db.single<Row>(this.db.from('training_matrix_evaluation_runs').insert({ id: randomUUID(), company_id: user.tenantId, site_id: dto.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null, run_scope: runScope, scope_record_id: scopeRecordId, triggered_by_type: dto.triggeredByType ?? dto.triggered_by_type ?? 'Manual run', triggered_by_user_id: user.id, status: 'Running', started_at: new Date().toISOString() }).select().single()), 'Evaluation run was not returned by the database.');
    try {
      const workers = await this.evaluationWorkers(user, dto);
      const rules = await this.evaluationRules(user, dto);
      let assignmentsCreated = 0;
      let gapsCreated = 0;
      for (const worker of workers) {
        const applicable = rules.filter((rule) => this.ruleAppliesToWorker(rule, worker));
        for (const rule of applicable) {
          const assignment = await this.upsertAssignment(user, worker, rule, run.id);
          assignmentsCreated += assignment.created ? 1 : 0;
          const evaluation = await this.createEvaluation(user, worker, rule, assignment.row, run.id);
          const gap = await this.upsertGap(user, worker, rule, assignment.row, evaluation);
          gapsCreated += gap.created ? 1 : 0;
        }
        await this.refreshWorkerSummary(user, worker.id, run.id);
      }
      const status = workers.length && rules.length ? 'Completed' : 'Completed With Warnings';
      const completed = this.must(await this.db.single<Row>(this.db.from('training_matrix_evaluation_runs').update({ status, completed_at: new Date().toISOString(), total_workers: workers.length, evaluated_workers: workers.length, total_rules: rules.length, evaluated_rules: rules.length, assignments_created: assignmentsCreated, gaps_created: gapsCreated, warnings_count: status === 'Completed With Warnings' ? 1 : 0, result_summary_json: { message: rules.length ? 'Evaluation completed from active matrix rules.' : 'No active matrix rules found for this scope.' }, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', run.id).select().single()), 'Completed evaluation run was not returned by the database.');
      await this.writeHistory(user, 'Calculated', 'Training matrix evaluation completed', null, completed, { run_id: run.id, site_id: completed.site_id });
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown matrix evaluation error';
      const failed = await this.db.single<Row>(this.db.from('training_matrix_evaluation_runs').update({ status: 'Failed', completed_at: new Date().toISOString(), errors_count: 1, error_message: message, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', run.id).select().single()).catch(() => run);
      await this.writeHistory(user, 'Failed', 'Training matrix evaluation failed', null, failed, { run_id: run.id, site_id: failed?.site_id });
      throw new BadRequestException(`Training matrix evaluation failed: ${message}`);
    }
  }

  async evaluations(user: RequestUser, query: Row = {}) {
    return this.paginate(await this.evaluationRows(user, query), query);
  }

  async runHistory(user: RequestUser, query: Row = {}) {
    return this.paginate(await this.runRows(user, query), query);
  }

  async runDetail(user: RequestUser, runId: string) {
    const run = await this.db.single<Row>(this.db.from('training_matrix_evaluation_runs').select('*').eq('company_id', user.tenantId).eq('id', runId).single());
    if (!run) throw new NotFoundException('Training matrix evaluation run was not found.');
    if (run.site_id) this.assertSiteAccess(user, run.site_id);
    const evaluations = await this.safeMany<Row>(this.db.from('training_matrix_evaluations').select('*').eq('company_id', user.tenantId).eq('evaluation_run_id', runId).limit(200));
    return { run, evaluations };
  }

  async cancelRun(user: RequestUser, runId: string) {
    const before = (await this.runDetail(user, runId)).run;
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_evaluation_runs').update({ status: 'Cancelled', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', runId).select().single()), 'Cancelled run was not returned.');
    await this.writeHistory(user, 'Cancelled', 'Training matrix evaluation run cancelled', before, row, { run_id: runId, site_id: row.site_id });
    return row;
  }

  async gaps(user: RequestUser, query: Row = {}) {
    return this.paginate(this.filterGaps(await this.gapRows(user, query), query), query);
  }

  async gap(user: RequestUser, gapId: string) {
    const gap = await this.assertGap(user, gapId);
    const [waivers, actions] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_matrix_waivers').select('*').eq('company_id', user.tenantId).eq('gap_id', gapId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('training_matrix_action_links').select('*').eq('company_id', user.tenantId).eq('gap_id', gapId).is('unlinked_at', null))
    ]);
    return { gap, waivers, actions };
  }

  async updateGap(user: RequestUser, gapId: string, dto: Row) {
    const before = await this.assertGap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').update(this.compact({ gap_status: dto.gapStatus ?? dto.gap_status, owner_user_id: dto.ownerUserId ?? dto.owner_user_id, closure_note: dto.closureNote ?? dto.closure_note, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Updated gap was not returned.');
    await this.writeHistory(user, 'Updated', 'Training matrix gap updated', before, row, { gap_id: gapId, worker_id: row.worker_id, matrix_rule_id: row.matrix_rule_id, site_id: row.site_id });
    return row;
  }

  async assignGap(user: RequestUser, gapId: string, dto: Row) {
    this.requireText(dto.ownerUserId ?? dto.owner_user_id, 'Gap owner is required.');
    return this.updateGap(user, gapId, { owner_user_id: dto.ownerUserId ?? dto.owner_user_id, gap_status: 'Assigned' });
  }

  async createGapAction(user: RequestUser, gapId: string, dto: Row) {
    const gap = await this.assertGap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_action_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: gap.site_id, gap_id: gapId, action_id: dto.actionId ?? dto.action_id ?? `pending-action-${randomUUID()}`, action_status: 'Requested', action_owner_id: dto.ownerUserId ?? dto.owner_user_id ?? gap.owner_user_id ?? null, linked_by: user.id }).select().single()), 'Training action link was not returned.');
    await this.updateGap(user, gapId, { gap_status: 'Action Created' });
    await this.writeHistory(user, 'Action Created', 'Training matrix gap action linked', null, row, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return row;
  }

  async markGapResolved(user: RequestUser, gapId: string, dto: Row) {
    this.requireText(dto.note ?? dto.closureNote ?? dto.closure_note, 'Closure note/evidence reason is required.');
    const before = await this.assertGap(user, gapId);
    if ((before.safety_critical_work_blocker || before.ptw_blocker || before.moc_blocker || before.pssr_blocker) && !dto.evidenceDocumentId && before.gap_status !== 'Waived') throw new BadRequestException('Safety-critical or blocker gap closure requires evidence or an approved waiver.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').update({ gap_status: 'Resolved', resolved_at: new Date().toISOString(), resolved_by: user.id, closure_note: dto.note ?? dto.closureNote ?? dto.closure_note, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Resolved gap was not returned.');
    await this.writeHistory(user, 'Resolved', 'Training matrix gap marked resolved', before, row, { gap_id: gapId, worker_id: row.worker_id, site_id: row.site_id });
    await this.refreshWorkerSummary(user, row.worker_id, null);
    return row;
  }

  async verifyGap(user: RequestUser, gapId: string, dto: Row) {
    this.requireText(dto.note ?? dto.closureNote ?? dto.closure_note, 'Verification note is required.');
    const before = await this.assertGap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').update({ gap_status: 'Verified', verified_at: new Date().toISOString(), verified_by: user.id, closure_note: dto.note ?? dto.closureNote ?? dto.closure_note, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Verified gap was not returned.');
    await this.writeHistory(user, 'Verified', 'Training matrix gap verified', before, row, { gap_id: gapId, worker_id: row.worker_id, site_id: row.site_id });
    await this.refreshWorkerSummary(user, row.worker_id, null);
    return row;
  }

  async reopenGap(user: RequestUser, gapId: string, dto: Row) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.assertGap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').update({ gap_status: 'Reopened', resolved_at: null, resolved_by: null, verified_at: null, verified_by: null, closure_note: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Reopened gap was not returned.');
    await this.writeHistory(user, 'Reopened', 'Training matrix gap reopened', before, row, { gap_id: gapId, worker_id: row.worker_id, site_id: row.site_id });
    await this.refreshWorkerSummary(user, row.worker_id, null);
    return row;
  }

  async waivers(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_waivers').select('*').eq('company_id', user.tenantId);
    req = this.siteScopedBase(user, req, 'site_id');
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }));
    return this.paginate(rows, query);
  }

  async requestWaiver(user: RequestUser, gapId: string, dto: Row) {
    const gap = await this.assertGap(user, gapId);
    if (!dto.waiverReason && !dto.waiver_reason) throw new BadRequestException('Waiver reason is required.');
    if ((gap.ptw_blocker || gap.moc_blocker || gap.pssr_blocker || gap.safety_critical_work_blocker) && !dto.riskJustification && !dto.risk_justification) throw new BadRequestException('Blocker waiver requires risk justification.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_waivers').insert({ id: randomUUID(), company_id: user.tenantId, site_id: gap.site_id, worker_id: gap.worker_id, gap_id: gapId, matrix_rule_id: gap.matrix_rule_id, waiver_type: dto.waiverType ?? dto.waiver_type ?? 'Temporary', waiver_reason: dto.waiverReason ?? dto.waiver_reason, risk_justification: dto.riskJustification ?? dto.risk_justification ?? null, compensating_control: dto.compensatingControl ?? dto.compensating_control ?? null, expiry_date: dto.expiryDate ?? dto.expiry_date ?? null, approval_status: 'Requested', created_by: user.id }).select().single()), 'Waiver request was not returned.');
    await this.db.single(this.db.from('training_matrix_gaps').update({ gap_status: 'Waiver Requested', waiver_id: row.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select('id').single()).catch(() => null);
    await this.writeHistory(user, 'Waiver Requested', 'Training matrix waiver requested', null, row, { gap_id: gapId, worker_id: gap.worker_id, site_id: gap.site_id });
    return row;
  }

  async decideWaiver(user: RequestUser, waiverId: string, decision: 'Approved' | 'Rejected' | 'Revoked', dto: Row = {}) {
    const before = await this.db.single<Row>(this.db.from('training_matrix_waivers').select('*').eq('company_id', user.tenantId).eq('id', waiverId).single());
    if (!before) throw new NotFoundException('Training matrix waiver was not found.');
    if (before.site_id) this.assertSiteAccess(user, before.site_id);
    const patch = decision === 'Approved'
      ? { approval_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason ?? dto.rejectionReason ?? dto.rejection_reason ?? null }
        : { approval_status: 'Revoked', revoked_by: user.id, revoked_at: new Date().toISOString(), revoke_reason: dto.reason ?? dto.revokeReason ?? dto.revoke_reason ?? null };
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_waivers').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', waiverId).select().single()), 'Waiver decision was not returned.');
    if (decision === 'Approved') await this.db.single(this.db.from('training_matrix_gaps').update({ gap_status: 'Waived', waiver_id: waiverId, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', row.gap_id).select('id').single()).catch(() => null);
    if (decision !== 'Approved') await this.db.single(this.db.from('training_matrix_gaps').update({ gap_status: decision === 'Rejected' ? 'Open' : 'Reopened', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', row.gap_id).select('id').single()).catch(() => null);
    await this.writeHistory(user, decision, `Training matrix waiver ${decision.toLowerCase()}`, before, row, { gap_id: row.gap_id, worker_id: row.worker_id, site_id: row.site_id });
    await this.refreshWorkerSummary(user, row.worker_id, null);
    return row;
  }

  async importTemplate() {
    return { columns: ['rule_code', 'rule_title', 'training_code', 'training_title', 'training_category', 'requirement_source', 'applicability_scope', 'worker_type_filter', 'employer_type_filter', 'site_code', 'department_code', 'unit_code', 'area_code', 'equipment_tag', 'job_role', 'ptw_role', 'mandatory', 'safety_critical', 'psm_critical', 'recurring', 'recurrence_interval_days', 'expiry_warning_days', 'grace_period_days', 'evidence_required', 'verification_required', 'blocks_ptw_authorization', 'blocks_moc_implementation', 'blocks_pssr_startup', 'waiver_allowed', 'owner_role', 'active'] };
  }

  async importRules(user: RequestUser, dto: Row) {
    const rows: Row[] = Array.isArray(dto.rows) ? dto.rows : [];
    const errors = rows.flatMap((row, index) => {
      try { this.validateRule(user, row, true); return []; } catch (error) { return [{ row: index + 1, message: error instanceof Error ? error.message : 'Invalid row' }]; }
    });
    if (errors.length) return { committed: false, errors, preview: rows.slice(0, 20) };
    const created = [];
    for (const row of rows) created.push((await this.createRule(user, { ...row, active: false })).rule);
    await this.writeHistory(user, 'Imported', 'Training matrix rules imported', null, { count: created.length }, {});
    return { committed: true, created: created.length, rows: created };
  }

  async exportData(user: RequestUser, query: Row = {}) {
    await this.writeHistory(user, 'Exported', 'Training matrix export requested', null, { query }, {});
    return { generatedAt: new Date().toISOString(), matrix: await this.matrix(user, query), rules: await this.rules(user, { ...query, limit: 500 }), gaps: await this.gaps(user, { ...query, limit: 500 }), waivers: await this.waivers(user, { ...query, limit: 500 }) };
  }

  async history(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_history_events').select('*').eq('company_id', user.tenantId);
    req = this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('matrix_rule_id', query.ruleId);
    if (query.gapId) req = req.eq('gap_id', query.gapId);
    if (query.runId) req = req.eq('run_id', query.runId);
    return this.paginate(await this.safeMany<Row>(req.order('created_at', { ascending: false })), query);
  }

  async settings(user: RequestUser) {
    const selectedSiteId = user.selectedSiteId ?? user.activeSiteId ?? null;
    const rows = await this.safeMany<Row>(this.db.from('training_matrix_settings').select('*').eq('company_id', user.tenantId).or(`site_id.is.null${selectedSiteId ? `,site_id.eq.${selectedSiteId}` : ''}`).order('site_id', { ascending: false }).limit(1));
    return rows[0] ?? { company_id: user.tenantId, site_id: selectedSiteId, default_expiry_warning_days: 30, default_grace_period_days: 0, auto_evaluate_on_worker_change: true, auto_evaluate_on_rule_change: true, auto_create_actions_for_critical_gaps: false, auto_notify_workers: true, auto_notify_supervisors: true, block_ptw_on_required_training_gap: true, block_moc_on_required_training_gap: true, block_pssr_on_required_training_gap: true, allow_safety_critical_waivers: false, require_esign_for_blocker_waiver: true, scheduled_matrix_run_enabled: false, scheduled_matrix_run_frequency: null, settings_json: {} };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const selectedSiteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (selectedSiteId) this.assertSiteAccess(user, selectedSiteId);
    const existing = await this.safeMany<Row>((selectedSiteId ? this.db.from('training_matrix_settings').select('*').eq('company_id', user.tenantId).eq('site_id', selectedSiteId) : this.db.from('training_matrix_settings').select('*').eq('company_id', user.tenantId).is('site_id', null)).limit(1));
    const payload = this.compact({ id: existing[0]?.id ?? randomUUID(), company_id: user.tenantId, site_id: selectedSiteId, default_expiry_warning_days: dto.defaultExpiryWarningDays ?? dto.default_expiry_warning_days ?? 30, default_grace_period_days: dto.defaultGracePeriodDays ?? dto.default_grace_period_days ?? 0, auto_evaluate_on_worker_change: dto.autoEvaluateOnWorkerChange ?? dto.auto_evaluate_on_worker_change ?? true, auto_evaluate_on_rule_change: dto.autoEvaluateOnRuleChange ?? dto.auto_evaluate_on_rule_change ?? true, auto_create_actions_for_critical_gaps: dto.autoCreateActionsForCriticalGaps ?? dto.auto_create_actions_for_critical_gaps ?? false, auto_notify_workers: dto.autoNotifyWorkers ?? dto.auto_notify_workers ?? true, auto_notify_supervisors: dto.autoNotifySupervisors ?? dto.auto_notify_supervisors ?? true, block_ptw_on_required_training_gap: dto.blockPtwOnRequiredTrainingGap ?? dto.block_ptw_on_required_training_gap ?? true, block_moc_on_required_training_gap: dto.blockMocOnRequiredTrainingGap ?? dto.block_moc_on_required_training_gap ?? true, block_pssr_on_required_training_gap: dto.blockPssrOnRequiredTrainingGap ?? dto.block_pssr_on_required_training_gap ?? true, allow_safety_critical_waivers: dto.allowSafetyCriticalWaivers ?? dto.allow_safety_critical_waivers ?? false, require_esign_for_blocker_waiver: dto.requireEsignForBlockerWaiver ?? dto.require_esign_for_blocker_waiver ?? true, scheduled_matrix_run_enabled: dto.scheduledMatrixRunEnabled ?? dto.scheduled_matrix_run_enabled ?? false, scheduled_matrix_run_frequency: dto.scheduledMatrixRunFrequency ?? dto.scheduled_matrix_run_frequency, settings_json: dto.settingsJson ?? dto.settings_json ?? {}, updated_by: user.id, updated_at: new Date().toISOString() });
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_settings').upsert(payload, { onConflict: 'id' }).select().single()), 'Training matrix settings were not returned.');
    await this.writeHistory(user, 'Updated', 'Training matrix settings updated', existing[0] ?? null, row, { site_id: row.site_id });
    return row;
  }

  lookup(lookup: string) {
    const lookups: Record<string, string[]> = { 'training-categories': trainingCategories, 'requirement-sources': requirementSources, 'applicability-scopes': applicabilityScopes, 'matrix-cell-statuses': matrixCellStatuses, 'matrix-gap-types': matrixGapTypes, 'matrix-gap-statuses': matrixGapStatuses, 'matrix-gap-severities': matrixGapSeverities, 'evidence-types': evidenceTypes, 'matrix-run-statuses': matrixRunStatuses, 'waiver-statuses': waiverStatuses };
    return { values: lookups[lookup] ?? [] };
  }

  private async evaluationWorkers(user: RequestUser, dto: Row) {
    if (dto.workerId) return [await this.assertWorker(user, dto.workerId)];
    return this.filterWorkers(await this.workerRows(user, dto), dto);
  }

  private async evaluationRules(user: RequestUser, dto: Row) {
    if (dto.ruleId) return [await this.assertRule(user, dto.ruleId)];
    return (await this.rulesRows(user, dto)).filter((row) => row.active && !row.archived_at);
  }

  private async upsertAssignment(user: RequestUser, worker: Row, rule: Row, runId: string) {
    const existing = await this.safeMany<Row>(this.db.from('training_matrix_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', worker.id).eq('matrix_rule_id', rule.id).limit(1));
    const payload = { company_id: user.tenantId, site_id: worker.primary_site_id ?? rule.site_id ?? null, worker_id: worker.id, matrix_rule_id: rule.id, training_reference_id: rule.training_reference_id, training_code: rule.training_code, training_title: rule.training_title, requirement_source: rule.requirement_source, requirement_reason: this.requirementReason(rule, worker), applies_to_scope: rule.applicability_scope, applies_to_record_id: this.appliesToRecord(rule, worker), mandatory: rule.mandatory, safety_critical: rule.safety_critical, psm_critical: rule.psm_critical, due_date: this.calculateDueDate(rule), expiry_date: null, recurrence_interval_days: rule.recurrence_interval_days, assignment_status: 'Required - Missing', created_by_engine_run_id: runId, last_evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (existing[0]) {
      const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_assignments').update(payload).eq('company_id', user.tenantId).eq('id', existing[0].id).select().single()), 'Assignment update failed.');
      return { row, created: false };
    }
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_assignments').insert({ id: randomUUID(), ...payload }).select().single()), 'Assignment insert failed.');
    return { row, created: true };
  }

  private async createEvaluation(user: RequestUser, worker: Row, rule: Row, assignment: Row, runId: string) {
    const missingEvidence = rule.evidence_required;
    return this.must(await this.db.single<Row>(this.db.from('training_matrix_evaluations').insert({ id: randomUUID(), company_id: user.tenantId, site_id: assignment.site_id, worker_id: worker.id, matrix_rule_id: rule.id, matrix_assignment_id: assignment.id, evaluation_run_id: runId, training_reference_id: rule.training_reference_id, evaluation_status: 'Completed', completion_status: missingEvidence ? 'Missing Evidence' : 'Required - Missing', evidence_status: missingEvidence ? 'Missing Evidence' : 'Not Required', verification_status: rule.verification_required ? 'Not Verified' : 'Not Required', due_status: assignment.due_date ? (new Date(assignment.due_date) < new Date() ? 'Overdue' : 'Pending') : 'Not Determined', expiry_status: 'Not Determined', gap_status: 'Open', gap_severity: this.gapSeverity(rule, worker), ptw_blocker: rule.blocks_ptw_authorization, moc_blocker: rule.blocks_moc_implementation, pssr_blocker: rule.blocks_pssr_startup, safety_critical_work_blocker: rule.blocks_safety_critical_work, evidence_summary_json: { message: 'No evidence adapter returned a matching completion record. Future Training Records, Certifications, Assessments, and SOP acknowledgements will plug into this evaluation.' }, reason: this.requirementReason(rule, worker), recommended_action: this.recommendedAction(rule) }).select().single()), 'Evaluation insert failed.');
  }

  private async upsertGap(user: RequestUser, worker: Row, rule: Row, assignment: Row, evaluation: Row) {
    const existing = await this.safeMany<Row>(this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId).eq('worker_id', worker.id).eq('matrix_rule_id', rule.id).not('gap_status', 'in', '("Closed","Cancelled","Verified")').limit(1));
    const payload = { company_id: user.tenantId, site_id: assignment.site_id, worker_id: worker.id, matrix_rule_id: rule.id, matrix_assignment_id: assignment.id, evaluation_id: evaluation.id, training_reference_id: rule.training_reference_id, training_code: rule.training_code, training_title: rule.training_title, gap_title: `${rule.training_title} missing for ${worker.display_name}`, gap_type: this.gapType(rule, worker), gap_severity: this.gapSeverity(rule, worker), gap_status: existing[0]?.gap_status ?? 'Open', due_date: assignment.due_date, expiry_date: assignment.expiry_date, evidence_expected: rule.evidence_required ? evidenceTypes.join(', ') : 'No evidence required by rule', evidence_found: 'No evidence found', requirement_reason: assignment.requirement_reason, ptw_blocker: rule.blocks_ptw_authorization, moc_blocker: rule.blocks_moc_implementation, pssr_blocker: rule.blocks_pssr_startup, safety_critical_work_blocker: rule.blocks_safety_critical_work, owner_user_id: worker.supervisor_user_id ?? worker.line_manager_user_id ?? null, supervisor_user_id: worker.supervisor_user_id ?? null, last_detected_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (existing[0]) {
      const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').update(payload).eq('company_id', user.tenantId).eq('id', existing[0].id).select().single()), 'Gap update failed.');
      return { row, created: false };
    }
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_gaps').insert({ id: randomUUID(), ...payload }).select().single()), 'Gap insert failed.');
    await this.writeHistory(user, 'Created', 'Training matrix gap created', null, row, { gap_id: row.id, worker_id: row.worker_id, matrix_rule_id: row.matrix_rule_id, site_id: row.site_id });
    return { row, created: true };
  }

  private async refreshWorkerSummary(user: RequestUser, workerId: string, runId: string | null) {
    const worker = await this.assertWorker(user, workerId);
    const [assignments, gaps] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_matrix_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId)),
      this.safeMany<Row>(this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).not('gap_status', 'in', '("Closed","Cancelled","Verified")'))
    ]);
    const summary = { id: `${workerId}_matrix_summary`, company_id: user.tenantId, site_id: worker.primary_site_id ?? null, worker_id: workerId, total_required: assignments.length, complete_count: assignments.filter((row) => row.assignment_status === 'Required - Complete').length, incomplete_count: gaps.length, overdue_count: gaps.filter((row) => row.gap_type === 'Overdue Training').length, expiring_soon_count: gaps.filter((row) => row.gap_type === 'Expiring Training').length, missing_evidence_count: gaps.filter((row) => row.gap_type === 'Missing Evidence').length, pending_verification_count: gaps.filter((row) => row.gap_status === 'Waiting Verification').length, waived_count: gaps.filter((row) => row.gap_status === 'Waived').length, safety_critical_gap_count: gaps.filter((row) => row.safety_critical_work_blocker || row.gap_type === 'Safety-Critical Training Gap').length, ptw_blocker_count: gaps.filter((row) => row.ptw_blocker).length, moc_blocker_count: gaps.filter((row) => row.moc_blocker).length, pssr_blocker_count: gaps.filter((row) => row.pssr_blocker).length, overall_matrix_status: gaps.length ? (gaps.some((row) => ['Critical', 'Work Blocker', 'Startup Blocker'].includes(row.gap_severity)) ? 'Blocked' : 'Incomplete') : (assignments.length ? 'Complete' : 'Unknown / Not Evaluated'), training_status: gaps.length ? 'Incomplete' : (assignments.length ? 'Complete' : 'Not Assessed'), certification_status: worker.certification_status ?? 'Not Assessed', competency_status: worker.competency_status ?? 'Not Assessed', ptw_authorization_status: gaps.some((row) => row.ptw_blocker) ? 'Not Authorized' : worker.ptw_authorization_status ?? 'Not Assessed', last_evaluation_run_id: runId, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const row = this.must(await this.db.single<Row>(this.db.from('training_matrix_worker_summaries').upsert(summary, { onConflict: 'company_id,worker_id' }).select().single()), 'Worker matrix summary update failed.');
    await this.db.single(this.db.from('training_workers').update({ training_status: row.training_status, ptw_authorization_status: row.ptw_authorization_status, updated_at: new Date().toISOString(), updated_by: user.id }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    return row;
  }

  private validateRule(user: RequestUser, dto: Row, create: boolean) {
    this.requireText(dto.ruleCode ?? dto.rule_code, 'Rule code is required.');
    this.requireText(dto.ruleTitle ?? dto.rule_title, 'Rule title is required.');
    if (!(dto.trainingTitle ?? dto.training_title) && !(dto.trainingCode ?? dto.training_code)) throw new BadRequestException('Training title or training code is required.');
    this.requireText(dto.trainingCategory ?? dto.training_category, 'Training category is required.');
    this.requireText(dto.requirementSource ?? dto.requirement_source, 'Requirement source is required.');
    this.requireText(dto.applicabilityScope ?? dto.applicability_scope, 'Applicability scope is required.');
    if (!trainingCategories.includes(dto.trainingCategory ?? dto.training_category)) throw new BadRequestException('Invalid training category.');
    if (!requirementSources.includes(dto.requirementSource ?? dto.requirement_source)) throw new BadRequestException('Invalid requirement source.');
    if (!applicabilityScopes.includes(dto.applicabilityScope ?? dto.applicability_scope)) throw new BadRequestException('Invalid applicability scope.');
    if ((dto.recurring ?? dto.recurring === true) && !Number(dto.recurrenceIntervalDays ?? dto.recurrence_interval_days)) throw new BadRequestException('Recurring rule requires recurrence interval.');
    if (Number(dto.expiryWarningDays ?? dto.expiry_warning_days ?? 0) < 0) throw new BadRequestException('Expiry warning days must be non-negative.');
    if (Number(dto.gracePeriodDays ?? dto.grace_period_days ?? 0) < 0) throw new BadRequestException('Grace period days must be non-negative.');
    const hasBlocker = Boolean(dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization ?? dto.blocksMocImplementation ?? dto.blocks_moc_implementation ?? dto.blocksPssrStartup ?? dto.blocks_pssr_startup ?? dto.blocksSafetyCriticalWork ?? dto.blocks_safety_critical_work);
    const isCritical = Boolean(dto.safetyCritical ?? dto.safety_critical ?? dto.psmCritical ?? dto.psm_critical);
    if (hasBlocker && !isCritical) throw new BadRequestException('PTW/MOC/PSSR/safety-critical blocker rules must be safety-critical or PSM-critical.');
    if (hasBlocker && !String(dto.notes ?? '').trim()) throw new BadRequestException('Safety-critical blocker rules require justification/notes.');
    if (dto.siteId ?? dto.site_id) this.assertSiteAccess(user, dto.siteId ?? dto.site_id);
    if (create && dto.active && !this.hasApplicability(dto)) throw new BadRequestException('Active rule must have at least one applicability condition.');
  }

  private hasApplicability(dto: Row) {
    return Boolean(dto.siteId ?? dto.site_id ?? dto.unitId ?? dto.unit_id ?? dto.areaId ?? dto.area_id ?? dto.workerTypeFilter ?? dto.worker_type_filter ?? dto.employerTypeFilter ?? dto.employer_type_filter ?? dto.jobRoleFilter ?? dto.job_role_filter ?? dto.ptwRoleFilter ?? dto.ptw_role_filter ?? dto.contractorCompanyFilter ?? dto.contractor_company_filter ?? dto.departmentId ?? dto.department_id);
  }

  private rulePayload(user: RequestUser, dto: Row, create: boolean) {
    return this.compact({ id: create ? randomUUID() : undefined, company_id: create ? user.tenantId : undefined, site_id: dto.siteId ?? dto.site_id, rule_code: dto.ruleCode ?? dto.rule_code, rule_title: dto.ruleTitle ?? dto.rule_title, training_reference_id: dto.trainingReferenceId ?? dto.training_reference_id, training_code: dto.trainingCode ?? dto.training_code, training_title: dto.trainingTitle ?? dto.training_title ?? dto.trainingCode ?? dto.training_code, training_category: dto.trainingCategory ?? dto.training_category, requirement_source: dto.requirementSource ?? dto.requirement_source, applicability_scope: dto.applicabilityScope ?? dto.applicability_scope, applicability_condition_json: dto.applicabilityConditionJson ?? dto.applicability_condition_json ?? {}, worker_type_filter: dto.workerTypeFilter ?? dto.worker_type_filter, employer_type_filter: dto.employerTypeFilter ?? dto.employer_type_filter, contractor_company_filter: dto.contractorCompanyFilter ?? dto.contractor_company_filter, department_id: dto.departmentId ?? dto.department_id, unit_id: dto.unitId ?? dto.unit_id, area_id: dto.areaId ?? dto.area_id, equipment_id: dto.equipmentId ?? dto.equipment_id, job_role_filter: dto.jobRoleFilter ?? dto.job_role_filter, competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id, ptw_role_filter: dto.ptwRoleFilter ?? dto.ptw_role_filter, sop_id: dto.sopId ?? dto.sop_id, psi_module: dto.psiModule ?? dto.psi_module, psi_record_id: dto.psiRecordId ?? dto.psi_record_id, moc_trigger_type: dto.mocTriggerType ?? dto.moc_trigger_type, pssr_trigger_type: dto.pssrTriggerType ?? dto.pssr_trigger_type, mandatory: dto.mandatory ?? true, safety_critical: dto.safetyCritical ?? dto.safety_critical ?? false, psm_critical: dto.psmCritical ?? dto.psm_critical ?? false, one_time: dto.oneTime ?? dto.one_time ?? false, recurring: dto.recurring ?? false, recurrence_interval_days: dto.recurrenceIntervalDays ?? dto.recurrence_interval_days, initial_due_rule_json: dto.initialDueRuleJson ?? dto.initial_due_rule_json, expiry_warning_days: dto.expiryWarningDays ?? dto.expiry_warning_days, grace_period_days: dto.gracePeriodDays ?? dto.grace_period_days, evidence_required: dto.evidenceRequired ?? dto.evidence_required ?? true, verification_required: dto.verificationRequired ?? dto.verification_required ?? false, approval_required: dto.approvalRequired ?? dto.approval_required ?? false, blocks_ptw_authorization: dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization ?? false, blocks_moc_implementation: dto.blocksMocImplementation ?? dto.blocks_moc_implementation ?? false, blocks_pssr_startup: dto.blocksPssrStartup ?? dto.blocks_pssr_startup ?? false, blocks_safety_critical_work: dto.blocksSafetyCriticalWork ?? dto.blocks_safety_critical_work ?? false, waiver_allowed: dto.waiverAllowed ?? dto.waiver_allowed ?? true, owner_role: dto.ownerRole ?? dto.owner_role, priority: dto.priority ?? 0, rule_status: dto.ruleStatus ?? dto.rule_status ?? (dto.active ? 'Active' : 'Draft'), active: dto.active ?? false, notes: dto.notes, created_by: create ? user.id : undefined, updated_by: user.id, updated_at: create ? undefined : new Date().toISOString() });
  }

  private ruleAppliesToWorker(rule: Row, worker: Row) {
    if (rule.site_id && worker.primary_site_id !== rule.site_id) return false;
    if (rule.worker_type_filter && worker.worker_type !== rule.worker_type_filter) return false;
    if (rule.employer_type_filter && worker.employer_type !== rule.employer_type_filter) return false;
    if (rule.contractor_company_filter && worker.contractor_company_name !== rule.contractor_company_filter) return false;
    if (rule.department_id && worker.department_id !== rule.department_id) return false;
    if (rule.job_role_filter && worker.job_title !== rule.job_role_filter && worker.current_role_assignment?.job_role !== rule.job_role_filter) return false;
    if (rule.ptw_role_filter && !worker.roleAssignments?.some((role: Row) => Array.isArray(role.ptw_role_candidates_json) && role.ptw_role_candidates_json.includes(rule.ptw_role_filter))) return false;
    if (rule.unit_id && !worker.assignments?.some((assignment: Row) => assignment.unit_id === rule.unit_id)) return false;
    if (rule.area_id && !worker.assignments?.some((assignment: Row) => assignment.area_id === rule.area_id)) return false;
    return true;
  }

  private requirementReason(rule: Row, worker: Row) {
    return `${rule.requirement_source} requires ${rule.training_title} for ${rule.applicability_scope}${rule.job_role_filter ? ` / ${rule.job_role_filter}` : ''}${rule.worker_type_filter ? ` / ${rule.worker_type_filter}` : ''}${worker.safety_critical_role ? ' safety-critical worker' : ''}.`;
  }

  private appliesToRecord(rule: Row, worker: Row) {
    return rule.area_id ?? rule.unit_id ?? rule.site_id ?? rule.equipment_id ?? rule.sop_id ?? worker.id ?? null;
  }

  private calculateDueDate(rule: Row) {
    const due = rule.initial_due_rule_json?.daysFromAssignment ?? rule.grace_period_days ?? 0;
    const date = new Date();
    date.setDate(date.getDate() + Number(due));
    return date.toISOString().slice(0, 10);
  }

  private gapType(rule: Row, worker: Row) {
    if (rule.blocks_pssr_startup) return 'PSSR Training Blocker';
    if (rule.blocks_moc_implementation) return 'MOC Training Blocker';
    if (rule.blocks_ptw_authorization) return 'PTW Authorization Blocker';
    if (rule.safety_critical || worker.safety_critical_role) return 'Safety-Critical Training Gap';
    if (rule.worker_type_filter === 'Contractor' || worker.worker_type === 'Contractor') return 'Contractor Onboarding Gap';
    return rule.evidence_required ? 'Missing Evidence' : 'Missing Required Training';
  }

  private gapSeverity(rule: Row, worker: Row) {
    if (rule.blocks_pssr_startup) return 'Startup Blocker';
    if (rule.blocks_ptw_authorization || rule.blocks_moc_implementation || rule.blocks_safety_critical_work) return 'Work Blocker';
    if (rule.safety_critical || rule.psm_critical || worker.safety_critical_role) return 'Critical';
    if (rule.mandatory) return 'High';
    return 'Medium';
  }

  private recommendedAction(rule: Row) {
    if (rule.blocks_ptw_authorization) return 'Complete/verify training before PTW authorization.';
    if (rule.blocks_moc_implementation) return 'Complete/verify training before MOC implementation.';
    if (rule.blocks_pssr_startup) return 'Complete/verify training before startup/PSSR release.';
    return 'Request evidence or schedule required training.';
  }

  private blockingImpact(rule: Row) {
    return { ptw: Boolean(rule.blocks_ptw_authorization), moc: Boolean(rule.blocks_moc_implementation), pssr: Boolean(rule.blocks_pssr_startup), safetyCriticalWork: Boolean(rule.blocks_safety_critical_work) };
  }

  private async workerRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    if (query.siteId) req = req.eq('primary_site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'primary_site_id');
    const workers = await this.safeMany<Row>(req);
    return this.hydrateWorkers(user, workers);
  }

  private async hydrateWorkers(user: RequestUser, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return [];
    const workerIds = rows.map((row) => row.id);
    const [assignments, roles] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).in('worker_id', workerIds).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('training_worker_role_assignments').select('*').eq('company_id', user.tenantId).in('worker_id', workerIds).is('removed_at', null))
    ]);
    const assignmentsByWorker = this.groupBy(assignments, 'worker_id');
    const rolesByWorker = this.groupBy(roles, 'worker_id');
    return rows.map((row) => ({ ...row, assignments: assignmentsByWorker[row.id] ?? [], roleAssignments: rolesByWorker[row.id] ?? [], current_role_assignment: (rolesByWorker[row.id] ?? [])[0] ?? null } as Row));
  }

  private async scopedAssignments(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).is('removed_at', null);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id');
    if (query.unitId) req = req.eq('unit_id', query.unitId);
    if (query.areaId) req = req.eq('area_id', query.areaId);
    return this.safeMany<Row>(req);
  }

  private async rulesRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_rules').select('*').eq('company_id', user.tenantId);
    if (query.includeArchived !== 'true') req = req.is('archived_at', null);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id');
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private async assignmentsRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_assignments').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    return this.safeMany<Row>(req);
  }

  private async evaluationRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_evaluations').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    return this.safeMany<Row>(req.order('evaluated_at', { ascending: false }));
  }

  private async gapRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.ruleId) req = req.eq('matrix_rule_id', query.ruleId);
    return this.safeMany<Row>(req.order('last_detected_at', { ascending: false }));
  }

  private async summaryRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_worker_summaries').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    return this.safeMany<Row>(req);
  }

  private async runRows(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_matrix_evaluation_runs').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    return this.safeMany<Row>(req.order('created_at', { ascending: false }));
  }

  private filterWorkers(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.display_name, row.work_email, row.employee_id, row.contractor_id, row.job_title, row.contractor_company_name].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.workerType) result = result.filter((row) => row.worker_type === query.workerType);
    if (query.employerType) result = result.filter((row) => row.employer_type === query.employerType);
    if (query.jobRole) result = result.filter((row) => row.job_title === query.jobRole || row.current_role_assignment?.job_role === query.jobRole);
    if (query.unitId) result = result.filter((row) => row.assignments?.some((assignment: Row) => assignment.unit_id === query.unitId));
    if (query.areaId) result = result.filter((row) => row.assignments?.some((assignment: Row) => assignment.area_id === query.areaId));
    return result;
  }

  private filterRules(rows: Row[], query: Row) {
    let result = rows;
    if (query.trainingCategory) result = result.filter((row) => row.training_category === query.trainingCategory);
    if (query.requirementSource) result = result.filter((row) => row.requirement_source === query.requirementSource);
    if (query.active) result = result.filter((row) => String(row.active) === String(query.active));
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.rule_title, row.rule_code, row.training_title, row.training_code].some((value) => String(value ?? '').toLowerCase().includes(search)));
    return result;
  }

  private filterGaps(rows: Row[], query: Row) {
    let result = rows;
    if (query.gapStatus) result = result.filter((row) => row.gap_status === query.gapStatus);
    if (query.gapSeverity) result = result.filter((row) => row.gap_severity === query.gapSeverity);
    if (query.gapType) result = result.filter((row) => row.gap_type === query.gapType);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical_work_blocker || row.gap_type === 'Safety-Critical Training Gap');
    if (query.ptwBlocker === 'true') result = result.filter((row) => row.ptw_blocker);
    if (query.mocBlocker === 'true') result = result.filter((row) => row.moc_blocker);
    if (query.pssrBlocker === 'true') result = result.filter((row) => row.pssr_blocker);
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.gap_title, row.training_title, row.training_code].some((value) => String(value ?? '').toLowerCase().includes(search)));
    return result;
  }

  private async assertWorker(user: RequestUser, workerId: string): Promise<Row> {
    const worker = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single());
    if (!worker) throw new NotFoundException('Worker profile was not found.');
    if (worker.primary_site_id) this.assertSiteAccess(user, worker.primary_site_id);
    return this.must((await this.hydrateWorkers(user, [worker]))[0], 'Worker profile was not returned after hydration.');
  }

  private async assertRule(user: RequestUser, ruleId: string) {
    const rule = await this.db.single<Row>(this.db.from('training_matrix_rules').select('*').eq('company_id', user.tenantId).eq('id', ruleId).single());
    if (!rule) throw new NotFoundException('Training matrix rule was not found.');
    if (rule.site_id) this.assertSiteAccess(user, rule.site_id);
    return rule;
  }

  private async assertGap(user: RequestUser, gapId: string) {
    const gap = await this.db.single<Row>(this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId).eq('id', gapId).single());
    if (!gap) throw new NotFoundException('Training matrix gap was not found.');
    if (gap.site_id) this.assertSiteAccess(user, gap.site_id);
    return gap;
  }

  private emptySummary(worker: Row) {
    return { worker_id: worker.id, site_id: worker.primary_site_id ?? null, total_required: 0, complete_count: 0, incomplete_count: 0, overdue_count: 0, expiring_soon_count: 0, missing_evidence_count: 0, pending_verification_count: 0, waived_count: 0, safety_critical_gap_count: 0, ptw_blocker_count: 0, moc_blocker_count: 0, pssr_blocker_count: 0, overall_matrix_status: 'Unknown / Not Evaluated', training_status: 'Not Assessed' };
  }

  private aggregateGroup(label: string, rows: Row[], workerCount?: number) {
    const total = rows.reduce((sum, row) => sum + Number(row.total_required ?? 0), 0);
    const complete = rows.reduce((sum, row) => sum + Number(row.complete_count ?? 0), 0);
    return { label, workers: workerCount ?? rows.length, requiredTraining: total, completeRequirements: complete, incompleteRequirements: rows.reduce((sum, row) => sum + Number(row.incomplete_count ?? 0), 0), overdueRequirements: rows.reduce((sum, row) => sum + Number(row.overdue_count ?? 0), 0), safetyCriticalGaps: rows.reduce((sum, row) => sum + Number(row.safety_critical_gap_count ?? 0), 0), ptwGaps: rows.reduce((sum, row) => sum + Number(row.ptw_blocker_count ?? 0), 0), mocGaps: rows.reduce((sum, row) => sum + Number(row.moc_blocker_count ?? 0), 0), pssrBlockers: rows.reduce((sum, row) => sum + Number(row.pssr_blocker_count ?? 0), 0), completionPercent: total ? Math.round((complete / total) * 100) : 0 };
  }

  private paginate(rows: Row[], query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 500);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, lastUpdated: new Date().toISOString() };
  }

  private scope(user: RequestUser): Scope {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) };
  }

  private siteScopedBase(user: RequestUser, req: any, column = 'site_id') {
    const scope = this.scope(user);
    if (scope.selectedSiteId) return req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId));
    if (!scope.corporateView && scope.allowedSiteIds.length) return req.in(column, scope.allowedSiteIds);
    if (!scope.corporateView) return req.eq(column, '__no_site_access__');
    return req;
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }

  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row) {
    const history = { id: randomUUID(), company_id: user.tenantId, site_id: scope.site_id ?? after?.site_id ?? null, unit_id: scope.unit_id ?? null, area_id: scope.area_id ?? null, worker_id: scope.worker_id ?? after?.worker_id ?? null, matrix_rule_id: scope.matrix_rule_id ?? after?.matrix_rule_id ?? after?.id ?? null, gap_id: scope.gap_id ?? after?.gap_id ?? null, run_id: scope.run_id ?? after?.run_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: user.id, source_module: 'Training Matrix', source_record_id: after?.id ?? scope.source_record_id ?? null };
    await this.db.single(this.db.from('training_matrix_history_events').insert(history).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.matrix.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingMatrix', entityId: history.source_record_id ?? history.matrix_rule_id ?? history.gap_id ?? history.run_id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null);
  }

  private groupEntries(rows: Row[], field: string) {
    return Object.entries(this.groupBy(rows, field));
  }

  private groupBy(rows: Row[], field: string) {
    return rows.reduce<Record<string, Row[]>>((acc, row) => {
      const key = String(row[field] ?? 'null');
      acc[key] = [...(acc[key] ?? []), row];
      return acc;
    }, {});
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private compact<T extends Row>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
  }

  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> {
    return this.db.many<T>(query).catch(() => []);
  }

  private must<T>(row: T | null | undefined, message: string): T {
    if (!row) throw new Error(message);
    return row;
  }
}
