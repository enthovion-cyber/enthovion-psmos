import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const sessionTypes = ['Classroom', 'Field practical', 'Toolbox talk', 'E-learning completion import', 'Supervisor briefing', 'External training', 'Emergency drill', 'Permit role training', 'SOP training', 'Refresher', 'Make-up session', 'One-to-one training', 'Other'];
const sessionStatuses = ['Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Archived'];
const attendanceMethods = ['Manual attendance', 'QR/self check-in foundation', 'Supervisor confirmation', 'Imported attendance', 'LMS import', 'E-learning completion import', 'External provider record'];
const rosterStatuses = ['Added', 'Invited', 'Confirmed', 'Declined', 'Attended', 'Absent', 'Removed', 'Cancelled'];
const attendanceStatuses = ['Present', 'Absent', 'Late', 'Excused', 'No-Show', 'Left Early', 'Partial Attendance', 'Incomplete', 'Pending', 'Not Required'];
const completionStatuses = ['Not Started', 'Attended', 'Completed', 'Completed Pending Verification', 'Completed Pending Approval', 'Incomplete', 'Failed', 'No-Show', 'Excused', 'Expired', 'Superseded', 'Waived', 'Manually Verified', 'Reopened', 'Cancelled'];
const evidenceStatuses = ['Not Required', 'Missing', 'Provided', 'Pending Verification', 'Verified', 'Rejected', 'Expired', 'Superseded'];
const verificationStatuses = ['Not Required', 'Pending', 'Verified', 'Rejected', 'Needs Correction', 'Overridden'];
const approvalStatuses = ['Not Required', 'Draft', 'Pending Approval', 'Approved', 'Returned', 'Rejected'];
const linkTypes = ['Training Matrix gap', 'Competency Profile gap', 'Required Training item', 'PTW role authorization', 'MOC training requirement', 'PSSR training readiness', 'SOP', 'PSI record', 'HAZOP recommendation', 'Incident lesson learned', 'Audit finding', 'Equipment', 'Document Control evidence'];

@Injectable()
export class TrainingRecordsAttendanceService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, sessions, records, bySite, byUnit, pendingVerification, missingEvidence, failedIncomplete, settings] = await Promise.all([
      this.dashboardSummary(user, query),
      this.sessions(user, { ...query, limit: query.limit ?? 10 }),
      this.records(user, { ...query, limit: query.limit ?? 10 }),
      this.dashboardBySite(user, query),
      this.dashboardByUnit(user, query),
      this.pendingVerificationPreview(user, { ...query, limit: 8 }),
      this.missingEvidencePreview(user, { ...query, limit: 8 }),
      this.records(user, { ...query, completionStatus: 'Incomplete', limit: 8 }),
      this.settings(user, query)
    ]);
    return {
      header: {
        title: 'Training Records + Attendance',
        subtitle: 'Real attendance, completion evidence, verification, approval, and Training Matrix closure trail.',
        selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      attendanceBySite: bySite,
      attendanceByUnit: byUnit,
      completionByCategory: this.countBy(records.allRows ?? records.rows, 'training_category'),
      pendingVerificationPreview: pendingVerification,
      missingEvidencePreview: missingEvidence,
      failedIncompletePreview: failedIncomplete.rows,
      sessionsRequiringAttendance: (sessions.allRows ?? sessions.rows).filter((row: Row) => ['Scheduled', 'In Progress'].includes(row.session_status)).slice(0, 8),
      recentCompletedSessions: (sessions.allRows ?? sessions.rows).filter((row: Row) => row.session_status === 'Completed').slice(0, 8),
      recentManualCorrections: await this.manualCorrections(user, { ...query, limit: 8 }),
      recordsAffectingBlockers: (records.allRows ?? records.rows).filter((row: Row) => row.ptw_blocker_id || row.moc_training_requirement_id || row.pssr_training_blocker_id).slice(0, 8),
      matrixGapsResolvedByRecord: (records.allRows ?? records.rows).filter((row: Row) => row.matrix_gap_id && ['Verified', 'Approved'].includes(row.verification_status)).slice(0, 8),
      sessions,
      records,
      settings
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [sessions, attendance, records, evidence] = await Promise.all([
      this.scopedSessions(user, query),
      this.scopedAttendance(user, query),
      this.scopedRecords(user, query),
      this.scopedEvidence(user, query)
    ]);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      totalTrainingSessions: sessions.length,
      sessionsScheduled: sessions.filter((row) => row.session_status === 'Scheduled').length,
      sessionsCompleted: sessions.filter((row) => row.session_status === 'Completed').length,
      sessionsCancelled: sessions.filter((row) => row.session_status === 'Cancelled').length,
      trainingRecordsCreated: records.length,
      attendanceRecords: attendance.length,
      presentAttendance: attendance.filter((row) => row.attendance_status === 'Present').length,
      absentNoShow: attendance.filter((row) => ['Absent', 'No-Show'].includes(row.attendance_status)).length,
      lateAttendance: attendance.filter((row) => row.attendance_status === 'Late').length,
      incompleteAttendance: attendance.filter((row) => ['Incomplete', 'Partial Attendance', 'Left Early'].includes(row.attendance_status)).length,
      verifiedCompletions: records.filter((row) => row.verification_status === 'Verified').length,
      pendingVerification: records.filter((row) => row.verification_status === 'Pending').length,
      pendingApproval: records.filter((row) => row.approval_status === 'Pending Approval').length,
      failedIncompleteRecords: records.filter((row) => ['Failed', 'Incomplete', 'No-Show'].includes(row.completion_status)).length,
      missingEvidence: records.filter((row) => row.evidence_status === 'Missing').length,
      manualCorrections: attendance.filter((row) => row.corrected_at).length,
      matrixGapsResolved: records.filter((row) => row.matrix_gap_id && row.verification_status === 'Verified').length,
      competencyGapsResolved: records.filter((row) => row.competency_gap_id && row.verification_status === 'Verified').length,
      ptwBlockersCleared: records.filter((row) => row.ptw_blocker_id && row.verification_status === 'Verified').length,
      mocPssrBlockersCleared: records.filter((row) => (row.moc_training_requirement_id || row.pssr_training_blocker_id) && row.verification_status === 'Verified').length,
      recordsCreatedThisMonth: records.filter((row) => row.created_at && new Date(row.created_at) >= monthStart).length,
      evidenceDocumentsLinked: evidence.length
    };
  }

  async dashboardBySite(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedAttendance(user, query);
    return this.countBy(rows, 'site_id');
  }

  async dashboardByUnit(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedRecords(user, query);
    return this.countBy(rows, 'unit_id');
  }

  async pendingVerificationPreview(user: RequestUser, query: Row = {}) {
    return (await this.scopedRecords(user, { ...query, verificationStatus: 'Pending' })).slice(0, Number(query.limit ?? 25));
  }

  async missingEvidencePreview(user: RequestUser, query: Row = {}) {
    return (await this.scopedRecords(user, { ...query, evidenceStatus: 'Missing' })).slice(0, Number(query.limit ?? 25));
  }

  async sessionsSummary(user: RequestUser, query: Row = {}) {
    const sessions = await this.scopedSessions(user, query);
    const attendance = await this.scopedAttendance(user, query);
    const records = await this.scopedRecords(user, query);
    return {
      totalSessions: sessions.length,
      scheduled: sessions.filter((row) => row.session_status === 'Scheduled').length,
      inProgress: sessions.filter((row) => row.session_status === 'In Progress').length,
      completed: sessions.filter((row) => row.session_status === 'Completed').length,
      cancelled: sessions.filter((row) => row.session_status === 'Cancelled').length,
      attendanceMissing: sessions.filter((session) => !attendance.some((row) => row.session_id === session.id)).length,
      evidenceMissing: records.filter((row) => row.evidence_status === 'Missing').length,
      pendingVerification: records.filter((row) => row.verification_status === 'Pending').length,
      pendingApproval: records.filter((row) => row.approval_status === 'Pending Approval').length,
      sessionsWithAbsentees: new Set(attendance.filter((row) => ['Absent', 'No-Show'].includes(row.attendance_status)).map((row) => row.session_id)).size,
      sessionsWithFailedWorkers: new Set(records.filter((row) => ['Failed', 'Incomplete', 'No-Show'].includes(row.completion_status)).map((row) => row.session_id)).size,
      sessionsLinkedToMocPssrPtw: sessions.filter((row) => (row.linked_records_json ?? []).some?.((link: Row) => ['MOC', 'PSSR', 'PTW'].includes(link.sourceModule ?? link.linked_module))).length
    };
  }

  async sessions(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = this.applySessionFilters(await this.scopedSessions(user, query), query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    const ids = sorted.map((row) => row.id);
    const [roster, attendance, records] = await Promise.all([
      ids.length ? this.safeMany<Row>(this.db.from('training_session_roster').select('*').eq('company_id', user.tenantId).in('session_id', ids).is('removed_at', null)) : [],
      ids.length ? this.safeMany<Row>(this.db.from('training_attendance_records').select('*').eq('company_id', user.tenantId).in('session_id', ids)) : [],
      ids.length ? this.safeMany<Row>(this.db.from('training_completion_records').select('*').eq('company_id', user.tenantId).in('session_id', ids)) : []
    ]);
    const hydrated = sorted.map((row) => this.hydrateSession(row, roster, attendance, records));
    return {
      rows: hydrated.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: hydrated.length,
      allRows: hydrated,
      summary: await this.sessionsSummary(user, query),
      savedViews: ['All Sessions', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Attendance Missing', 'Evidence Missing', 'Pending Verification', 'Pending Approval', 'Linked to MOC/PSSR/PTW'],
      lastUpdated: new Date().toISOString()
    };
  }

  async createSession(user: RequestUser, dto: Row) {
    this.requireText(dto.sessionTitle ?? dto.session_title ?? dto.title, 'Session title is required.');
    const siteId = this.assertSiteAccess(user, dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId);
    const trainingItem = dto.trainingItemId ?? dto.training_item_id ? await this.optionalTrainingItem(user, dto.trainingItemId ?? dto.training_item_id) : null;
    const payload = this.sessionPayload(user, dto, randomUUID(), siteId, trainingItem, true);
    this.validateSessionSchedule(payload);
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_sessions').insert(payload).select().single()), 'Training session was not returned by the database.');
    await this.addInitialRosterAndLinks(user, inserted, dto);
    await this.refreshSessionReadiness(user, inserted.id);
    await this.writeEvent(user, { session_id: inserted.id, site_id: inserted.site_id }, 'Created', 'Training session created', null, inserted);
    return this.sessionDetail(user, inserted.id);
  }

  async sessionDetail(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    const [roster, attendance, records, evidence, links, history, settings] = await Promise.all([
      this.roster(user, sessionId),
      this.attendance(user, sessionId),
      this.records(user, { sessionId, limit: 200 }),
      this.sessionEvidence(user, sessionId),
      this.sessionLinks(user, sessionId),
      this.history(user, { sessionId, limit: 40 }),
      this.settings(user, { siteId: session.site_id })
    ]);
    return {
      session,
      header: {
        title: session.session_title,
        code: session.session_code,
        status: session.session_status,
        approvalStatus: session.approval_status,
        trainingItemVersion: session.training_item_version,
        safetyCritical: session.safety_critical,
        readinessStatus: session.readiness_status
      },
      summary: this.sessionSummaryFromChildren(session, roster, attendance, records.rows),
      roster,
      attendance,
      completionRecords: records.rows,
      evidence,
      links,
      readiness: this.sessionReadiness(session, roster, attendance, records.rows, evidence),
      tabs: this.sessionTabs(sessionId),
      history: history.rows,
      settings
    };
  }

  async updateSession(user: RequestUser, sessionId: string, dto: Row) {
    const before = await this.assertSession(user, sessionId);
    this.assertSessionEditable(before, dto.reason ?? dto.changeReason);
    const trainingItem = dto.trainingItemId ?? dto.training_item_id ? await this.optionalTrainingItem(user, dto.trainingItemId ?? dto.training_item_id) : null;
    const patch = this.sessionPayload(user, dto, sessionId, before.site_id, trainingItem, false);
    this.validateSessionSchedule({ ...before, ...patch });
    const updated = this.must(await this.db.single<Row>(this.db.from('training_sessions').update(patch).eq('company_id', user.tenantId).eq('id', sessionId).select().single()), 'Updated training session was not returned by the database.');
    await this.refreshSessionReadiness(user, sessionId);
    await this.writeEvent(user, updated, 'Updated', 'Training session updated', before, updated);
    return this.sessionDetail(user, sessionId);
  }

  async cancelSession(user: RequestUser, sessionId: string, dto: Row) {
    this.requireText(dto.reason ?? dto.cancellationReason, 'Cancellation reason is required.');
    return this.setSessionStatus(user, sessionId, 'Cancelled', { cancellation_reason: dto.reason ?? dto.cancellationReason }, 'Cancelled', 'Training session cancelled');
  }

  async archiveSession(user: RequestUser, sessionId: string, dto: Row) {
    this.requireText(dto.reason, 'Archive reason is required.');
    const before = await this.assertSession(user, sessionId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_sessions').update({ session_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', sessionId).select().single()), 'Archived training session was not returned by the database.');
    await this.writeEvent(user, updated, 'Archived', 'Training session archived', before, updated);
    return this.sessionDetail(user, sessionId);
  }

  async completeSession(user: RequestUser, sessionId: string, dto: Row = {}) {
    await this.generateCompletionsFromAttendance(user, sessionId);
    return this.setSessionStatus(user, sessionId, 'Completed', {}, 'Completed', dto.reason ?? 'Training session completed');
  }

  async roster(user: RequestUser, sessionId: string) {
    await this.assertSession(user, sessionId);
    const rows = await this.safeMany<Row>(this.db.from('training_session_roster').select('*').eq('company_id', user.tenantId).eq('session_id', sessionId).is('removed_at', null).order('created_at', { ascending: false }));
    return this.hydrateRoster(user, rows);
  }

  async addRoster(user: RequestUser, sessionId: string, dto: Row) {
    const session = await this.assertSession(user, sessionId);
    this.assertSessionEditable(session, dto.reason ?? dto.changeReason, true);
    const workerId = dto.workerId ?? dto.worker_id;
    this.requireText(workerId, 'Worker is required.');
    const worker = await this.assertWorker(user, workerId);
    if (worker.primary_site_id && worker.primary_site_id !== session.site_id && !this.scope(user).corporateView) throw new ForbiddenException('Cross-site worker attendance is blocked for your scope.');
    const duplicate = await this.safeMany<Row>(this.db.from('training_session_roster').select('id').eq('company_id', user.tenantId).eq('session_id', sessionId).eq('worker_id', workerId).is('removed_at', null).limit(1));
    if (duplicate.length) throw new BadRequestException('Worker is already on this training roster.');
    const payload = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: session.site_id,
      session_id: sessionId,
      worker_id: workerId,
      unit_id: dto.unitId ?? dto.unit_id ?? worker.primary_unit_id,
      area_id: dto.areaId ?? dto.area_id ?? worker.primary_area_id,
      job_role: dto.jobRole ?? dto.job_role ?? worker.job_title,
      worker_type: worker.worker_type,
      employer_type: worker.employer_type,
      contractor_company_name: worker.contractor_company_name,
      required_because: dto.requiredBecause ?? dto.required_because,
      matrix_assignment_id: dto.matrixAssignmentId ?? dto.matrix_assignment_id,
      matrix_gap_id: dto.matrixGapId ?? dto.matrix_gap_id,
      competency_requirement_id: dto.competencyRequirementId ?? dto.competency_requirement_id,
      competency_gap_id: dto.competencyGapId ?? dto.competency_gap_id,
      linked_moc_id: dto.linkedMocId ?? dto.linked_moc_id,
      linked_pssr_id: dto.linkedPssrId ?? dto.linked_pssr_id,
      linked_ptw_id: dto.linkedPtwId ?? dto.linked_ptw_id,
      roster_status: dto.rosterStatus ?? dto.roster_status ?? 'Added',
      notes: dto.notes,
      added_by: user.id
    });
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_session_roster').insert(payload).select().single()), 'Roster entry was not returned by the database.');
    await this.writeEvent(user, inserted, 'Roster Added', 'Worker added to training roster', null, inserted);
    await this.refreshSessionReadiness(user, sessionId);
    return inserted;
  }

  async addRosterFromMatrixGaps(user: RequestUser, sessionId: string, dto: Row = {}) {
    await this.assertSession(user, sessionId);
    const gaps = await this.safeMany<Row>(this.siteScopedBase(user, this.db.from('training_matrix_gaps').select('*').eq('company_id', user.tenantId).neq('gap_status', 'Closed'), 'site_id', true).limit(Number(dto.limit ?? 100)));
    const added: Row[] = [];
    for (const gap of gaps.filter((row) => row.worker_id)) {
      try {
        added.push(await this.addRoster(user, sessionId, { workerId: gap.worker_id, matrixGapId: gap.id, matrixAssignmentId: gap.matrix_assignment_id, requiredBecause: `Matrix gap: ${gap.gap_type ?? gap.gap_title ?? 'Required training gap'}` }));
      } catch {
        // Duplicate or out-of-scope rows are skipped; preview remains audit-safe through individual successes.
      }
    }
    return { added, skipped: gaps.length - added.length };
  }

  async addRosterFromRequiredTraining(user: RequestUser, sessionId: string, dto: Row = {}) {
    const session = await this.assertSession(user, sessionId);
    const workers = await this.scopedWorkers(user, { siteId: session.site_id, workerType: dto.workerType, employerType: dto.employerType });
    const added: Row[] = [];
    for (const worker of workers.slice(0, Number(dto.limit ?? 100))) {
      try {
        added.push(await this.addRoster(user, sessionId, { workerId: worker.id, requiredBecause: 'Assigned to required training item' }));
      } catch {}
    }
    return { added, skipped: Math.max(workers.length - added.length, 0) };
  }

  async addRosterFromRole(user: RequestUser, sessionId: string, dto: Row = {}) {
    const role = String(dto.jobRole ?? dto.job_role ?? '').trim();
    this.requireText(role, 'Job role is required.');
    const workers = (await this.scopedWorkers(user, { siteId: (await this.assertSession(user, sessionId)).site_id })).filter((worker) => worker.job_title === role);
    const added: Row[] = [];
    for (const worker of workers.slice(0, Number(dto.limit ?? 100))) {
      try {
        added.push(await this.addRoster(user, sessionId, { workerId: worker.id, requiredBecause: `Job role: ${role}` }));
      } catch {}
    }
    return { added, skipped: Math.max(workers.length - added.length, 0) };
  }

  async removeRoster(user: RequestUser, sessionId: string, rosterId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Remove reason is required.');
    const session = await this.assertSession(user, sessionId);
    this.assertSessionEditable(session, dto.reason, true);
    const before = await this.assertRoster(user, sessionId, rosterId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_session_roster').update({ roster_status: 'Removed', removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', rosterId).select().single()), 'Removed roster entry was not returned by the database.');
    await this.writeEvent(user, updated, 'Roster Removed', 'Worker removed from training roster', before, updated);
    await this.refreshSessionReadiness(user, sessionId);
    return updated;
  }

  async attendance(user: RequestUser, sessionId: string) {
    await this.assertSession(user, sessionId);
    const rows = await this.safeMany<Row>(this.db.from('training_attendance_records').select('*').eq('company_id', user.tenantId).eq('session_id', sessionId).order('created_at', { ascending: false }));
    return this.hydrateAttendance(user, rows);
  }

  async saveAttendance(user: RequestUser, sessionId: string, dto: Row) {
    const entries = Array.isArray(dto.entries) ? dto.entries : [dto];
    const saved: Row[] = [];
    for (const entry of entries) saved.push(await this.upsertAttendance(user, sessionId, entry, false));
    await this.refreshSessionReadiness(user, sessionId);
    return { rows: saved, total: saved.length };
  }

  async updateAttendance(user: RequestUser, sessionId: string, attendanceId: string, dto: Row) {
    await this.assertAttendance(user, sessionId, attendanceId);
    return this.upsertAttendance(user, sessionId, { ...dto, id: attendanceId }, false);
  }

  async markAllPresent(user: RequestUser, sessionId: string, dto: Row = {}) {
    if (!dto.confirmed) throw new BadRequestException('Mark all present requires confirmation.');
    const roster = await this.roster(user, sessionId);
    const rows: Row[] = [];
    for (const item of roster) rows.push(await this.upsertAttendance(user, sessionId, { workerId: item.worker_id, rosterId: item.id, attendanceStatus: 'Present', completionCandidate: true }, false));
    await this.writeEvent(user, { session_id: sessionId }, 'Attendance Updated', 'All roster workers marked present', null, { count: rows.length });
    return { rows, total: rows.length };
  }

  async submitAttendance(user: RequestUser, sessionId: string, dto: Row = {}) {
    const session = await this.assertSession(user, sessionId);
    const settings = await this.settings(user, { siteId: session.site_id });
    const rows = await this.attendance(user, sessionId);
    if (!rows.length) throw new BadRequestException('Attendance cannot be submitted because no attendance rows exist.');
    if (rows.some((row) => !row.attendance_status || row.attendance_status === 'Pending')) throw new BadRequestException('Attendance cannot be submitted until every worker has an attendance status.');
    await this.db.many(this.db.from('training_attendance_records').update({ submitted_by: user.id, submitted_at: new Date().toISOString(), attendance_locked: Boolean(settings.lock_attendance_after_submit), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('session_id', sessionId).select('id')).catch(() => []);
    await this.generateCompletionsFromAttendance(user, sessionId);
    await this.writeEvent(user, { session_id: sessionId, site_id: session.site_id }, 'Attendance Submitted', 'Training attendance submitted and completion records recalculated', null, { total: rows.length });
    return this.attendance(user, sessionId);
  }

  async lockAttendance(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    await this.db.many(this.db.from('training_attendance_records').update({ attendance_locked: true, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('session_id', sessionId).select('id')).catch(() => []);
    await this.writeEvent(user, { session_id: sessionId, site_id: session.site_id }, 'Attendance Locked', 'Training attendance locked', null, { sessionId });
    return this.attendance(user, sessionId);
  }

  async correctAttendance(user: RequestUser, sessionId: string, attendanceId: string, dto: Row) {
    this.requireText(dto.reason ?? dto.correctionReason, 'Attendance correction reason is required.');
    const before = await this.assertAttendance(user, sessionId, attendanceId);
    const row = await this.upsertAttendance(user, sessionId, { ...dto, id: attendanceId, correctionReason: dto.reason ?? dto.correctionReason }, true);
    await this.writeEvent(user, row, 'Attendance Corrected', 'Training attendance corrected', before, row);
    await this.generateCompletionsFromAttendance(user, sessionId);
    return row;
  }

  async records(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = this.applyRecordFilters(await this.scopedRecords(user, query), query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    return {
      rows: sorted.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: sorted.length,
      allRows: sorted,
      summary: this.recordSummary(sorted),
      savedViews: ['All Completion Records', 'Pending Verification', 'Pending Approval', 'Missing Evidence', 'Failed / Incomplete', 'Manual Corrections', 'Verified', 'Expired', 'Library Link Missing'],
      lastUpdated: new Date().toISOString()
    };
  }

  async createRecord(user: RequestUser, dto: Row) {
    const worker = await this.assertWorker(user, dto.workerId ?? dto.worker_id);
    if (dto.manuallyEntered !== false && dto.manually_entered !== false) this.requireText(dto.reason ?? dto.manualEntryReason ?? dto.manual_entry_reason, 'Manual record requires reason.');
    const trainingItem = dto.trainingItemId ?? dto.training_item_id ? await this.optionalTrainingItem(user, dto.trainingItemId ?? dto.training_item_id) : null;
    const siteId = this.assertSiteAccess(user, dto.siteId ?? dto.site_id ?? worker.primary_site_id);
    const payload = this.recordPayload(user, dto, randomUUID(), worker, siteId, trainingItem, true);
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_completion_records').insert(payload).select().single()), 'Completion record was not returned by the database.');
    await this.writeStatusUpdate(user, null, inserted, dto.reason ?? dto.manualEntryReason ?? 'Manual completion record created.');
    await this.writeEvent(user, inserted, 'Created', 'Training completion record created', null, inserted);
    return this.recordDetail(user, inserted.id);
  }

  async recordDetail(user: RequestUser, recordId: string) {
    const record = await this.assertRecord(user, recordId);
    const [evidence, links, verifications, history] = await Promise.all([
      this.recordEvidence(user, recordId),
      this.recordLinks(user, recordId),
      this.safeMany<Row>(this.db.from('training_record_verifications').select('*').eq('company_id', user.tenantId).eq('completion_record_id', recordId).order('created_at', { ascending: false })),
      this.history(user, { recordId, limit: 40 })
    ]);
    return {
      record,
      header: { workerId: record.worker_id, trainingTitle: record.training_title, completionStatus: record.completion_status, evidenceStatus: record.evidence_status, verificationStatus: record.verification_status, approvalStatus: record.approval_status },
      evidence,
      links,
      verifications,
      readiness: this.recordReadiness(record, evidence),
      history: history.rows
    };
  }

  async updateRecord(user: RequestUser, recordId: string, dto: Row) {
    const before = await this.assertRecord(user, recordId);
    this.assertRecordEditable(before, dto.reason ?? dto.changeReason);
    const worker = await this.assertWorker(user, before.worker_id);
    const trainingItem = dto.trainingItemId ?? dto.training_item_id ? await this.optionalTrainingItem(user, dto.trainingItemId ?? dto.training_item_id) : null;
    const patch = this.recordPayload(user, dto, recordId, worker, before.site_id, trainingItem, false);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update(patch).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Updated completion record was not returned by the database.');
    await this.writeStatusUpdate(user, before, updated, dto.reason ?? dto.changeReason ?? 'Completion record updated.');
    await this.writeEvent(user, updated, 'Updated', 'Training completion record updated', before, updated);
    return this.recordDetail(user, recordId);
  }

  async verifyRecord(user: RequestUser, recordId: string, dto: Row = {}) {
    const before = await this.assertRecord(user, recordId);
    const evidence = await this.recordEvidence(user, recordId);
    const readiness = this.recordReadiness(before, evidence);
    if (readiness.status === 'Blocked' && !dto.overrideReason) throw new BadRequestException(`Verification blocked: ${readiness.blockers.map((b: Row) => b.message).join('; ')}`);
    const nextApproval = before.approval_status === 'Pending Approval' || before.approval_status === 'Not Required' ? before.approval_status : 'Pending Approval';
    const patch = {
      completion_status: nextApproval === 'Pending Approval' ? 'Completed Pending Approval' : 'Completed',
      evidence_status: before.evidence_status === 'Missing' ? 'Provided' : before.evidence_status,
      verification_status: dto.overrideReason ? 'Overridden' : 'Verified',
      manually_verified: Boolean(dto.overrideReason),
      manual_verification_reason: dto.overrideReason ?? before.manual_verification_reason,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      approval_status: nextApproval,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update(patch).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Verified completion record was not returned by the database.');
    await this.db.single(this.db.from('training_record_verifications').insert({ id: randomUUID(), company_id: user.tenantId, site_id: updated.site_id, completion_record_id: recordId, verification_type: dto.verificationType ?? 'Instructor verification', verification_status: patch.verification_status, verifier_user_id: user.id, verifier_role: dto.verifierRole, verification_comment: dto.comment, override_reason: dto.overrideReason, verified_at: patch.verified_at, created_by: user.id }).select('id').single()).catch(() => null);
    await this.writeStatusUpdate(user, before, updated, dto.comment ?? dto.overrideReason ?? 'Completion verified.');
    await this.syncVerifiedCompletion(user, updated);
    await this.writeEvent(user, updated, 'Verified', 'Training completion verified', before, updated);
    return this.recordDetail(user, recordId);
  }

  async rejectRecord(user: RequestUser, recordId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.rejectionReason, 'Rejection reason is required.');
    return this.setRecordStatus(user, recordId, { completion_status: 'Incomplete', verification_status: 'Rejected', approval_status: 'Rejected' }, 'Rejected', dto.reason ?? dto.rejectionReason);
  }

  async approveRecord(user: RequestUser, recordId: string, dto: Row = {}) {
    const before = await this.assertRecord(user, recordId);
    if (!['Verified', 'Overridden'].includes(before.verification_status)) throw new BadRequestException('Approval requires verified completion.');
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update({ approval_status: 'Approved', completion_status: 'Completed', approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Approved completion record was not returned by the database.');
    await this.writeStatusUpdate(user, before, updated, dto.comment ?? 'Completion approved.');
    await this.writeEvent(user, updated, 'Approved', 'Training completion approved', before, updated);
    return this.recordDetail(user, recordId);
  }

  async reopenRecord(user: RequestUser, recordId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.assertRecord(user, recordId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update({ completion_status: 'Reopened', verification_status: 'Needs Correction', approval_status: 'Returned', reopened_by: user.id, reopened_at: new Date().toISOString(), reopen_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Reopened completion record was not returned by the database.');
    await this.writeStatusUpdate(user, before, updated, dto.reason);
    await this.writeEvent(user, updated, 'Reopened', 'Training completion reopened', before, updated);
    return this.recordDetail(user, recordId);
  }

  async recalculateRecordStatus(user: RequestUser, recordId: string) {
    const before = await this.assertRecord(user, recordId);
    const evidence = await this.recordEvidence(user, recordId);
    const patch = this.calculatedRecordStatuses(before, evidence);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Recalculated completion record was not returned by the database.');
    await this.writeStatusUpdate(user, before, updated, 'Completion status recalculated from attendance, evidence, verification, approval, and expiry rules.');
    await this.writeEvent(user, updated, 'Recalculated', 'Training completion status recalculated', before, updated);
    return this.recordDetail(user, recordId);
  }

  async recordEvidence(user: RequestUser, recordId: string) {
    const record = await this.assertRecord(user, recordId);
    return this.safeMany<Row>(this.db.from('training_record_evidence_documents').select('*').eq('company_id', user.tenantId).eq('completion_record_id', record.id).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async sessionEvidence(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    return this.safeMany<Row>(this.db.from('training_record_evidence_documents').select('*').eq('company_id', user.tenantId).eq('session_id', session.id).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkEvidence(user: RequestUser, recordId: string, dto: Row) {
    const record = await this.assertRecord(user, recordId);
    this.requireText(dto.documentId ?? dto.document_id, 'Document Control document is required.');
    const payload = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: record.site_id,
      completion_record_id: recordId,
      session_id: record.session_id,
      attendance_record_id: record.attendance_record_id,
      document_id: dto.documentId ?? dto.document_id,
      document_type: dto.documentType ?? dto.document_type ?? 'Document Control',
      document_number: dto.documentNumber ?? dto.document_number,
      document_title: dto.documentTitle ?? dto.document_title,
      document_status: dto.documentStatus ?? dto.document_status,
      document_revision: dto.documentRevision ?? dto.document_revision,
      evidence_type: dto.evidenceType ?? dto.evidence_type ?? 'Document Control evidence',
      evidence_status: 'Provided',
      required: dto.required ?? false,
      snapshot_json: dto.snapshot ?? dto.snapshot_json ?? {},
      linked_by: user.id
    });
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_record_evidence_documents').insert(payload).select().single()), 'Evidence link was not returned by the database.');
    await this.recalculateRecordStatus(user, recordId);
    await this.writeEvent(user, inserted, 'Evidence Linked', 'Training completion evidence linked through Document Control', null, inserted);
    return inserted;
  }

  async removeEvidence(user: RequestUser, recordId: string, evidenceId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Evidence remove reason is required.');
    const before = await this.assertEvidence(user, recordId, evidenceId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_record_evidence_documents').update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq('company_id', user.tenantId).eq('id', evidenceId).select().single()), 'Removed evidence link was not returned by the database.');
    await this.recalculateRecordStatus(user, recordId);
    await this.writeEvent(user, updated, 'Evidence Removed', 'Training completion evidence removed', before, updated);
    return updated;
  }

  async verifyEvidence(user: RequestUser, recordId: string, evidenceId: string) {
    await this.assertRecord(user, recordId);
    const before = await this.assertEvidence(user, recordId, evidenceId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_record_evidence_documents').update({ evidence_status: 'Verified', verified_by: user.id, verified_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', evidenceId).select().single()), 'Verified evidence link was not returned by the database.');
    await this.recalculateRecordStatus(user, recordId);
    await this.writeEvent(user, updated, 'Evidence Verified', 'Training completion evidence verified', before, updated);
    return updated;
  }

  async rejectEvidence(user: RequestUser, recordId: string, evidenceId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.rejectionReason, 'Evidence rejection reason is required.');
    const before = await this.assertEvidence(user, recordId, evidenceId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_record_evidence_documents').update({ evidence_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason ?? dto.rejectionReason }).eq('company_id', user.tenantId).eq('id', evidenceId).select().single()), 'Rejected evidence link was not returned by the database.');
    await this.recalculateRecordStatus(user, recordId);
    await this.writeEvent(user, updated, 'Evidence Rejected', 'Training completion evidence rejected', before, updated);
    return updated;
  }

  async recordLinks(user: RequestUser, recordId: string) {
    const record = await this.assertRecord(user, recordId);
    return this.safeMany<Row>(this.db.from('training_record_links').select('*').eq('company_id', user.tenantId).eq('completion_record_id', record.id).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async sessionLinks(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    return this.safeMany<Row>(this.db.from('training_record_links').select('*').eq('company_id', user.tenantId).eq('session_id', session.id).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async addRecordLink(user: RequestUser, recordId: string, dto: Row) {
    const record = await this.assertRecord(user, recordId);
    return this.addLink(user, { completion_record_id: recordId, site_id: record.site_id }, dto);
  }

  async addSessionLink(user: RequestUser, sessionId: string, dto: Row) {
    const session = await this.assertSession(user, sessionId);
    return this.addLink(user, { session_id: sessionId, site_id: session.site_id }, dto);
  }

  async removeRecordLink(user: RequestUser, recordId: string, linkId: string, dto: Row = {}) {
    await this.assertRecord(user, recordId);
    return this.removeLink(user, linkId, dto);
  }

  async removeSessionLink(user: RequestUser, sessionId: string, linkId: string, dto: Row = {}) {
    await this.assertSession(user, sessionId);
    return this.removeLink(user, linkId, dto);
  }

  async view(user: RequestUser, query: Row = {}) {
    return this.records(user, query);
  }

  async manualCorrections(user: RequestUser, query: Row = {}) {
    return (await this.scopedAttendance(user, query)).filter((row) => row.corrected_at).slice(0, Number(query.limit ?? 25));
  }

  async history(user: RequestUser, query: Row = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let req: any = this.db.from('training_record_history_events').select('*').eq('company_id', user.tenantId);
    req = this.siteScopedBase(user, req, 'site_id', true);
    if (query.sessionId) req = req.eq('session_id', query.sessionId);
    if (query.recordId) req = req.eq('completion_record_id', query.recordId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }).limit(limit));
    return { rows, total: rows.length };
  }

  async importTemplate() {
    return {
      fileTypes: ['.xlsx', '.csv'],
      columns: ['session_code', 'training_code', 'training_version', 'site_code', 'worker_identifier', 'worker_email', 'employee_id', 'contractor_id', 'badge_number', 'attendance_status', 'check_in_time', 'check_out_time', 'completion_status', 'completion_date', 'expiry_date', 'evidence_document_reference', 'instructor_email', 'provider', 'score_summary', 'verification_status', 'notes'],
      validation: ['Validate before commit', 'Show row-level errors', 'Match worker by email/employee ID/contractor ID/badge', 'Cross-site worker blocked', 'Safety-critical manual completion cannot bypass evidence/verification policy']
    };
  }

  async importJob(user: RequestUser, dto: Row = {}) {
    this.requireText(dto.fileName ?? dto.file_name, 'Import file name is required.');
    const siteId = dto.siteId ?? dto.site_id ? this.assertSiteAccess(user, dto.siteId ?? dto.site_id) : null;
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const errors = rows.flatMap((row: Row, index: number) => this.validateImportRow(row).map((message) => ({ rowNumber: index + 1, message })));
    const payload = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      session_id: dto.sessionId ?? dto.session_id ?? null,
      uploaded_by: user.id,
      file_name: dto.fileName ?? dto.file_name,
      file_key: dto.fileKey ?? dto.file_key ?? null,
      status: errors.length ? 'Validation Failed' : 'Preview',
      total_rows: rows.length,
      valid_rows: Math.max(rows.length - errors.length, 0),
      error_rows: errors.length,
      preview_json: { rows: rows.slice(0, 100), errors }
    };
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_attendance_import_jobs').insert(payload).select().single()), 'Import job was not returned by the database.');
    await this.writeEvent(user, { site_id: siteId }, 'Imported', 'Training attendance import preview created', null, inserted);
    return inserted;
  }

  async export(user: RequestUser, query: Row = {}) {
    const [sessions, records] = await Promise.all([this.sessions(user, { ...query, limit: 100 }), this.records(user, { ...query, limit: 100 })]);
    await this.writeEvent(user, { site_id: query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null }, 'Exported', 'Training records export generated', null, { query, sessionCount: sessions.total, recordCount: records.total });
    return { generatedAt: new Date().toISOString(), format: query.format ?? 'json', sessions: sessions.rows, records: records.rows, note: 'Export is permission scoped and uses backend aggregation.' };
  }

  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    const rows = await this.safeMany<Row>(this.db.from('training_record_settings').select('*').eq('company_id', user.tenantId).or(`site_id.is.null${siteId ? `,site_id.eq.${siteId}` : ''}`).order('site_id', { ascending: false }).limit(1));
    return rows[0] ?? {
      company_id: user.tenantId,
      site_id: siteId,
      require_reason_for_manual_record: true,
      require_reason_for_attendance_correction: true,
      lock_attendance_after_submit: true,
      lock_completion_after_verification: true,
      require_verification_for_safety_critical: true,
      require_approval_for_safety_critical: false,
      allow_manual_completion_for_safety_critical: false,
      auto_update_matrix_on_verified_completion: true,
      auto_update_competency_on_verified_completion: true,
      auto_clear_blockers_on_verified_completion: true,
      auto_notify_worker_on_completion: true,
      auto_notify_supervisor_on_absence: true
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ? this.assertSiteAccess(user, dto.siteId ?? dto.site_id) : null;
    const before = await this.settings(user, { siteId });
    const payload = this.compact({
      id: before.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      require_reason_for_manual_record: dto.requireReasonForManualRecord ?? dto.require_reason_for_manual_record,
      require_reason_for_attendance_correction: dto.requireReasonForAttendanceCorrection ?? dto.require_reason_for_attendance_correction,
      lock_attendance_after_submit: dto.lockAttendanceAfterSubmit ?? dto.lock_attendance_after_submit,
      lock_completion_after_verification: dto.lockCompletionAfterVerification ?? dto.lock_completion_after_verification,
      require_verification_for_safety_critical: dto.requireVerificationForSafetyCritical ?? dto.require_verification_for_safety_critical,
      require_approval_for_safety_critical: dto.requireApprovalForSafetyCritical ?? dto.require_approval_for_safety_critical,
      allow_manual_completion_for_safety_critical: dto.allowManualCompletionForSafetyCritical ?? dto.allow_manual_completion_for_safety_critical,
      auto_update_matrix_on_verified_completion: dto.autoUpdateMatrixOnVerifiedCompletion ?? dto.auto_update_matrix_on_verified_completion,
      auto_update_competency_on_verified_completion: dto.autoUpdateCompetencyOnVerifiedCompletion ?? dto.auto_update_competency_on_verified_completion,
      auto_clear_blockers_on_verified_completion: dto.autoClearBlockersOnVerifiedCompletion ?? dto.auto_clear_blockers_on_verified_completion,
      auto_notify_worker_on_completion: dto.autoNotifyWorkerOnCompletion ?? dto.auto_notify_worker_on_completion,
      auto_notify_supervisor_on_absence: dto.autoNotifySupervisorOnAbsence ?? dto.auto_notify_supervisor_on_absence,
      settings_json: dto.settingsJson ?? dto.settings_json,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_record_settings').upsert(payload, { onConflict: 'company_id,site_id' }).select().single()), 'Training record settings were not returned by the database.');
    await this.writeEvent(user, { site_id: siteId }, 'Settings Updated', 'Training record settings updated', before, row);
    return row;
  }

  async context(user: RequestUser, query: Row = {}) {
    const [sites, units, areas, workers, users, requiredTraining, documents, settings] = await Promise.all([
      this.safeMany<Row>(this.siteScopedBase(user, this.db.from('Site').select('id,name,code,timezone').eq('tenantId', user.tenantId), 'id')),
      this.safeMany<Row>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId)),
      this.safeMany<Row>(this.db.from('Area').select('id,name,code,siteId,unitId').eq('tenantId', user.tenantId)),
      this.scopedWorkers(user, { ...query, limit: 200 }),
      this.safeMany<Row>(this.db.from('User').select('id,email,displayName,title,department,status').eq('tenantId', user.tenantId).order('displayName').limit(100)),
      this.safeMany<Row>(this.siteScopedBase(user, this.db.from('training_required_items').select('id,training_code,training_title,version,training_category,training_type,safety_critical,psm_critical,ptw_critical,moc_critical,pssr_critical,status,evidence_policy_status,recurrence_type,recurrence_interval_days').eq('company_id', user.tenantId).in('status', ['Active', 'Approved Current']), 'site_id', true).limit(100)),
      this.safeMany<Row>(this.db.from('Document').select('id,title,documentNo,status,revision,siteId').eq('tenantId', user.tenantId).limit(80)),
      this.settings(user, query)
    ]);
    return { sites, units, areas, workers, users, requiredTraining, documents, settings, lookups: this.lookups() };
  }

  lookups() {
    return {
      'session-types': sessionTypes,
      'session-statuses': sessionStatuses,
      'attendance-methods': attendanceMethods,
      'attendance-statuses': attendanceStatuses,
      'roster-statuses': rosterStatuses,
      'completion-statuses': completionStatuses,
      'evidence-statuses': evidenceStatuses,
      'verification-statuses': verificationStatuses,
      'training-record-approval-statuses': approvalStatuses,
      'training-record-link-types': linkTypes
    };
  }

  private async setSessionStatus(user: RequestUser, sessionId: string, status: string, extra: Row, eventType: string, title: string) {
    const before = await this.assertSession(user, sessionId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_sessions').update({ ...extra, session_status: status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', sessionId).select().single()), 'Updated training session status was not returned by the database.');
    await this.writeEvent(user, updated, eventType, title, before, updated);
    return this.sessionDetail(user, sessionId);
  }

  private async setRecordStatus(user: RequestUser, recordId: string, patch: Row, eventType: string, reason: string) {
    const before = await this.assertRecord(user, recordId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_completion_records').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', recordId).select().single()), 'Updated completion record status was not returned by the database.');
    await this.writeStatusUpdate(user, before, updated, reason);
    await this.writeEvent(user, updated, eventType, `Training completion ${eventType.toLowerCase()}`, before, updated);
    return this.recordDetail(user, recordId);
  }

  private async addLink(user: RequestUser, base: Row, dto: Row) {
    this.requireText(dto.linkedModule ?? dto.linked_module, 'Linked module is required.');
    this.requireText(dto.linkedRecordId ?? dto.linked_record_id, 'Linked record is required.');
    const payload = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: base.site_id,
      completion_record_id: base.completion_record_id,
      session_id: base.session_id,
      linked_module: dto.linkedModule ?? dto.linked_module,
      linked_record_id: dto.linkedRecordId ?? dto.linked_record_id,
      linked_record_title: dto.linkedRecordTitle ?? dto.linked_record_title,
      relationship_type: dto.relationshipType ?? dto.relationship_type ?? 'Related training evidence',
      relationship_reason: dto.relationshipReason ?? dto.relationship_reason,
      required: dto.required ?? false,
      safety_critical: dto.safetyCritical ?? dto.safety_critical ?? false,
      linked_by: user.id
    });
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_record_links').insert(payload).select().single()), 'Training record link was not returned by the database.');
    await this.writeEvent(user, inserted, 'Linked', 'Training record linked to source record', null, inserted);
    return inserted;
  }

  private async removeLink(user: RequestUser, linkId: string, dto: Row) {
    this.requireText(dto.reason, 'Unlink reason is required.');
    const before = this.must(await this.db.single<Row>(this.db.from('training_record_links').select('*').eq('company_id', user.tenantId).eq('id', linkId).single()), 'Training record link was not found.');
    this.assertSiteAccess(user, before.site_id);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_record_links').update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq('company_id', user.tenantId).eq('id', linkId).select().single()), 'Removed training record link was not returned by the database.');
    await this.writeEvent(user, updated, 'Unlinked', 'Training record unlinked from source record', before, updated);
    return updated;
  }

  private sessionPayload(user: RequestUser, dto: Row, id: string, siteId: string, trainingItem: Row | null, create: boolean) {
    return this.compact({
      id: create ? id : undefined,
      company_id: create ? user.tenantId : undefined,
      site_id: create ? siteId : undefined,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      department_id: dto.departmentId ?? dto.department_id,
      session_code: dto.sessionCode ?? dto.session_code,
      session_title: dto.sessionTitle ?? dto.session_title ?? dto.title,
      session_type: dto.sessionType ?? dto.session_type ?? (create ? 'Classroom' : undefined),
      description: dto.description,
      training_item_id: dto.trainingItemId ?? dto.training_item_id ?? trainingItem?.id,
      training_item_version: dto.trainingItemVersion ?? dto.training_item_version ?? trainingItem?.version,
      training_category: dto.trainingCategory ?? dto.training_category ?? trainingItem?.training_category,
      training_type: dto.trainingType ?? dto.training_type ?? trainingItem?.training_type,
      safety_critical: dto.safetyCritical ?? dto.safety_critical ?? trainingItem?.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical ?? trainingItem?.psm_critical,
      ptw_critical: dto.ptwCritical ?? dto.ptw_critical ?? trainingItem?.ptw_critical,
      moc_critical: dto.mocCritical ?? dto.moc_critical ?? trainingItem?.moc_critical,
      pssr_critical: dto.pssrCritical ?? dto.pssr_critical ?? trainingItem?.pssr_critical,
      start_time: dto.startTime ?? dto.start_time,
      end_time: dto.endTime ?? dto.end_time,
      timezone: dto.timezone,
      location: dto.location,
      online_meeting_link: dto.onlineMeetingLink ?? dto.online_meeting_link,
      room_area: dto.roomArea ?? dto.room_area,
      capacity: dto.capacity,
      attendance_cutoff_time: dto.attendanceCutoffTime ?? dto.attendance_cutoff_time,
      attendance_method: dto.attendanceMethod ?? dto.attendance_method ?? (create ? 'Manual attendance' : undefined),
      session_status: dto.sessionStatus ?? dto.session_status ?? (create ? 'Draft' : undefined),
      approval_status: dto.approvalStatus ?? dto.approval_status ?? (create ? 'Draft' : undefined),
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? user.id,
      instructor_worker_id: dto.instructorWorkerId ?? dto.instructor_worker_id,
      instructor_user_id: dto.instructorUserId ?? dto.instructor_user_id,
      external_instructor_name: dto.externalInstructorName ?? dto.external_instructor_name,
      external_provider_company: dto.externalProviderCompany ?? dto.external_provider_company,
      instructor_qualification_document_id: dto.instructorQualificationDocumentId ?? dto.instructor_qualification_document_id,
      instructor_email: dto.instructorEmail ?? dto.instructor_email,
      instructor_phone: dto.instructorPhone ?? dto.instructor_phone,
      instructor_approval_status: dto.instructorApprovalStatus ?? dto.instructor_approval_status,
      cancellation_reason: dto.cancellationReason ?? dto.cancellation_reason,
      evidence_rules_json: dto.evidenceRules ?? dto.evidence_rules_json,
      linked_records_json: dto.links ?? dto.linked_records_json,
      notes: dto.notes,
      created_by: create ? user.id : undefined,
      updated_by: user.id,
      updated_at: create ? undefined : new Date().toISOString()
    });
  }

  private recordPayload(user: RequestUser, dto: Row, id: string, worker: Row, siteId: string, trainingItem: Row | null, create: boolean) {
    const completionDate = dto.completionDate ?? dto.completion_date ?? null;
    const expiryDate = dto.expiryDate ?? dto.expiry_date ?? this.expiryDateFrom(trainingItem, completionDate);
    return this.compact({
      id: create ? id : undefined,
      company_id: create ? user.tenantId : undefined,
      site_id: create ? siteId : undefined,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      worker_id: create ? worker.id : undefined,
      session_id: dto.sessionId ?? dto.session_id,
      attendance_record_id: dto.attendanceRecordId ?? dto.attendance_record_id,
      training_item_id: dto.trainingItemId ?? dto.training_item_id ?? trainingItem?.id,
      training_item_version: dto.trainingItemVersion ?? dto.training_item_version ?? trainingItem?.version,
      training_code: dto.trainingCode ?? dto.training_code ?? trainingItem?.training_code,
      training_title: dto.trainingTitle ?? dto.training_title ?? trainingItem?.training_title ?? dto.legacyTrainingTitle,
      training_category: dto.trainingCategory ?? dto.training_category ?? trainingItem?.training_category,
      completion_status: dto.completionStatus ?? dto.completion_status ?? (create ? this.initialCompletionStatus(dto) : undefined),
      completion_date: completionDate,
      due_date: dto.dueDate ?? dto.due_date,
      expiry_date: expiryDate,
      attendance_status: dto.attendanceStatus ?? dto.attendance_status,
      evidence_status: dto.evidenceStatus ?? dto.evidence_status ?? (create ? this.initialEvidenceStatus(dto, trainingItem) : undefined),
      verification_status: dto.verificationStatus ?? dto.verification_status ?? (create ? this.initialVerificationStatus(dto, trainingItem) : undefined),
      approval_status: dto.approvalStatus ?? dto.approval_status ?? (create ? this.initialApprovalStatus(dto, trainingItem) : undefined),
      instructor_worker_id: dto.instructorWorkerId ?? dto.instructor_worker_id,
      instructor_user_id: dto.instructorUserId ?? dto.instructor_user_id,
      external_provider_company: dto.externalProviderCompany ?? dto.external_provider_company,
      score_summary: dto.scoreSummary ?? dto.score_summary,
      certificate_id: dto.certificateId ?? dto.certificate_id,
      assessment_result_id: dto.assessmentResultId ?? dto.assessment_result_id,
      sop_acknowledgement_id: dto.sopAcknowledgementId ?? dto.sop_acknowledgement_id,
      matrix_assignment_id: dto.matrixAssignmentId ?? dto.matrix_assignment_id,
      matrix_gap_id: dto.matrixGapId ?? dto.matrix_gap_id,
      competency_requirement_id: dto.competencyRequirementId ?? dto.competency_requirement_id,
      competency_gap_id: dto.competencyGapId ?? dto.competency_gap_id,
      ptw_blocker_id: dto.ptwBlockerId ?? dto.ptw_blocker_id,
      moc_training_requirement_id: dto.mocTrainingRequirementId ?? dto.moc_training_requirement_id,
      pssr_training_blocker_id: dto.pssrTrainingBlockerId ?? dto.pssr_training_blocker_id,
      manually_entered: dto.manuallyEntered ?? dto.manually_entered ?? create,
      manual_entry_reason: dto.reason ?? dto.manualEntryReason ?? dto.manual_entry_reason,
      notes: dto.notes,
      created_by: create ? user.id : undefined,
      updated_by: user.id,
      updated_at: create ? undefined : new Date().toISOString()
    });
  }

  private async upsertAttendance(user: RequestUser, sessionId: string, dto: Row, correction: boolean) {
    const session = await this.assertSession(user, sessionId);
    const before = dto.id ? await this.assertAttendance(user, sessionId, dto.id) : null;
    if (before?.attendance_locked && !correction) throw new BadRequestException('Attendance is locked. Use correction workflow with reason.');
    const workerId = dto.workerId ?? dto.worker_id ?? before?.worker_id;
    this.requireText(workerId, 'Worker is required.');
    const worker = await this.assertWorker(user, workerId);
    const payload = this.compact({
      id: before?.id ?? randomUUID(),
      company_id: before ? undefined : user.tenantId,
      site_id: before ? undefined : session.site_id,
      session_id: before ? undefined : sessionId,
      worker_id: before ? undefined : worker.id,
      roster_id: dto.rosterId ?? dto.roster_id ?? before?.roster_id,
      attendance_status: dto.attendanceStatus ?? dto.attendance_status ?? before?.attendance_status ?? 'Pending',
      check_in_time: dto.checkInTime ?? dto.check_in_time,
      check_out_time: dto.checkOutTime ?? dto.check_out_time,
      attendance_duration_minutes: dto.attendanceDurationMinutes ?? dto.attendance_duration_minutes,
      attendance_percentage: dto.attendancePercentage ?? dto.attendance_percentage,
      completion_candidate: dto.completionCandidate ?? dto.completion_candidate ?? ['Present', 'Late', 'Partial Attendance'].includes(dto.attendanceStatus ?? dto.attendance_status),
      absence_reason: dto.absenceReason ?? dto.absence_reason,
      incomplete_reason: dto.incompleteReason ?? dto.incomplete_reason,
      evidence_note: dto.evidenceNote ?? dto.evidence_note,
      recorded_by: user.id,
      recorded_at: new Date().toISOString(),
      corrected_by: correction ? user.id : undefined,
      corrected_at: correction ? new Date().toISOString() : undefined,
      correction_reason: correction ? (dto.correctionReason ?? dto.correction_reason ?? dto.reason) : undefined,
      notes: dto.notes,
      updated_at: new Date().toISOString()
    });
    const query = before
      ? this.db.from('training_attendance_records').update(payload).eq('company_id', user.tenantId).eq('id', before.id).select().single()
      : this.db.from('training_attendance_records').insert(payload).select().single();
    const row = this.must(await this.db.single<Row>(query), 'Attendance record was not returned by the database.');
    await this.writeEvent(user, row, correction ? 'Attendance Corrected' : 'Attendance Recorded', correction ? 'Attendance corrected' : 'Attendance recorded', before, row);
    return row;
  }

  private async generateCompletionsFromAttendance(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    const attendance = await this.safeMany<Row>(this.db.from('training_attendance_records').select('*').eq('company_id', user.tenantId).eq('session_id', sessionId));
    const trainingItem = session.training_item_id ? await this.optionalTrainingItem(user, session.training_item_id) : null;
    const generated: Row[] = [];
    for (const row of attendance) {
      const worker = await this.assertWorker(user, row.worker_id).catch(() => null);
      if (!worker) continue;
      const existing = await this.safeMany<Row>(this.db.from('training_completion_records').select('*').eq('company_id', user.tenantId).eq('attendance_record_id', row.id).limit(1));
      const payload = this.recordPayload(user, {
        sessionId,
        attendanceRecordId: row.id,
        trainingItemId: session.training_item_id,
        trainingItemVersion: session.training_item_version,
        trainingCategory: session.training_category,
        trainingType: session.training_type,
        attendanceStatus: row.attendance_status,
        completionDate: ['Present', 'Late', 'Partial Attendance'].includes(row.attendance_status) ? this.dateOnly(row.check_out_time ?? row.recorded_at ?? new Date()) : null,
        completionStatus: this.completionFromAttendance(row, session),
        evidenceStatus: this.initialEvidenceStatus(session.evidence_rules_json ?? {}, trainingItem),
        verificationStatus: this.initialVerificationStatus(session.evidence_rules_json ?? {}, trainingItem),
        approvalStatus: this.initialApprovalStatus(session.evidence_rules_json ?? {}, trainingItem),
        instructorWorkerId: session.instructor_worker_id,
        instructorUserId: session.instructor_user_id,
        externalProviderCompany: session.external_provider_company,
        matrixAssignmentId: row.matrix_assignment_id,
        matrixGapId: row.matrix_gap_id,
        competencyRequirementId: row.competency_requirement_id,
        competencyGapId: row.competency_gap_id
      }, existing[0]?.id ?? randomUUID(), worker, session.site_id, trainingItem, !existing[0]);
      const query = existing[0]
        ? this.db.from('training_completion_records').update(payload).eq('company_id', user.tenantId).eq('id', existing[0].id).select().single()
        : this.db.from('training_completion_records').insert(payload).select().single();
      const saved = this.must(await this.db.single<Row>(query), 'Generated completion record was not returned by the database.');
      generated.push(saved);
    }
    return generated;
  }

  private async refreshSessionReadiness(user: RequestUser, sessionId: string) {
    const session = await this.assertSession(user, sessionId);
    const [roster, attendance, records, evidence] = await Promise.all([this.roster(user, sessionId), this.attendance(user, sessionId), this.scopedRecords(user, { sessionId }), this.sessionEvidence(user, sessionId)]);
    const readiness = this.sessionReadiness(session, roster, attendance, records, evidence);
    await this.db.single(this.db.from('training_sessions').update({ readiness_status: readiness.status, readiness_blockers_json: readiness.blockers, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', sessionId).select('id').single()).catch(() => null);
    return readiness;
  }

  private sessionReadiness(session: Row, roster: Row[], attendance: Row[], records: Row[], evidence: Row[]) {
    const blockers: Row[] = [];
    if (!session.session_title) blockers.push({ code: 'SESSION_TITLE_MISSING', message: 'Session title is required.' });
    if (!session.site_id) blockers.push({ code: 'SITE_MISSING', message: 'Site is required.' });
    if (!session.training_item_id) blockers.push({ code: 'LIBRARY_LINK_MISSING', message: 'Required Training Library item is missing or legacy/manual mode must have reason.' });
    if (session.start_time && session.end_time && new Date(session.end_time) <= new Date(session.start_time)) blockers.push({ code: 'INVALID_TIME_RANGE', message: 'End time must be after start time.' });
    if (['Scheduled', 'In Progress', 'Completed'].includes(session.session_status) && !roster.length) blockers.push({ code: 'ROSTER_EMPTY', message: 'Roster is required before scheduling or completion.' });
    if (session.session_status === 'Completed' && attendance.length < roster.length) blockers.push({ code: 'ATTENDANCE_MISSING', message: 'Attendance is missing for one or more roster workers.' });
    if (records.some((row) => row.evidence_status === 'Missing')) blockers.push({ code: 'EVIDENCE_MISSING', message: 'One or more completion records are missing required evidence.' });
    if (records.some((row) => row.verification_status === 'Pending')) blockers.push({ code: 'PENDING_VERIFICATION', message: 'One or more completion records are pending verification.' });
    if (session.safety_critical && !session.instructor_worker_id && !session.instructor_user_id && !session.external_instructor_name) blockers.push({ code: 'SAFETY_CRITICAL_INSTRUCTOR_MISSING', message: 'Safety-critical training requires an instructor/provider.' });
    return { status: blockers.some((b) => ['SESSION_TITLE_MISSING', 'SITE_MISSING', 'INVALID_TIME_RANGE'].includes(b.code)) ? 'Blocked' : blockers.length ? 'Warning' : 'Complete', blockers, evidenceCount: evidence.length };
  }

  private recordReadiness(record: Row, evidence: Row[]) {
    const blockers: Row[] = [];
    if (!record.worker_id) blockers.push({ code: 'WORKER_MISSING', message: 'Worker is required.' });
    if (!record.training_item_id && !record.manual_entry_reason) blockers.push({ code: 'LIBRARY_LINK_MISSING', message: 'Required Training Library item is missing; manual/legacy records require reason.' });
    if (record.completion_status?.includes('Completed') && !record.completion_date) blockers.push({ code: 'COMPLETION_DATE_MISSING', message: 'Completion date is required for completed records.' });
    if (record.evidence_status === 'Missing' || (record.evidence_status !== 'Not Required' && !evidence.length)) blockers.push({ code: 'EVIDENCE_MISSING', message: 'Evidence required by library/session policy is missing.' });
    if (record.verification_status === 'Pending') blockers.push({ code: 'PENDING_VERIFICATION', message: 'Completion record is pending verification.' });
    if (record.approval_status === 'Pending Approval') blockers.push({ code: 'PENDING_APPROVAL', message: 'Completion record is pending approval.' });
    return { status: blockers.some((b) => ['WORKER_MISSING', 'COMPLETION_DATE_MISSING', 'EVIDENCE_MISSING'].includes(b.code)) ? 'Blocked' : blockers.length ? 'Warning' : 'Complete', blockers };
  }

  private calculatedRecordStatuses(record: Row, evidence: Row[]) {
    const evidenceRequired = record.evidence_status !== 'Not Required';
    const evidenceStatus = evidenceRequired ? (evidence.some((row) => row.evidence_status === 'Verified') ? 'Verified' : evidence.length ? 'Provided' : 'Missing') : 'Not Required';
    const verificationStatus = record.verification_status === 'Verified' || record.verification_status === 'Overridden' ? record.verification_status : evidenceStatus === 'Missing' ? 'Pending' : record.verification_status;
    const completionStatus = this.completionFromAttendance(record, {}) === 'Completed' && verificationStatus === 'Pending' ? 'Completed Pending Verification' : record.completion_status;
    return { evidence_status: evidenceStatus, verification_status: verificationStatus, completion_status: completionStatus };
  }

  private async syncVerifiedCompletion(user: RequestUser, record: Row) {
    const settings = await this.settings(user, { siteId: record.site_id });
    if (settings.auto_update_matrix_on_verified_completion && record.matrix_gap_id) {
      await this.db.single(this.db.from('training_matrix_gaps').update({ gap_status: 'Resolved', resolution_source: 'Training Records', resolved_by: user.id, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', record.matrix_gap_id).select('id').single()).catch(() => null);
    }
    if (settings.auto_update_competency_on_verified_completion && record.competency_gap_id) {
      await this.db.single(this.db.from('training_competency_gaps').update({ gap_status: 'Resolved', resolution_source: 'Training Records', resolved_by: user.id, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', record.competency_gap_id).select('id').single()).catch(() => null);
    }
    if (record.worker_id) {
      await this.db.single(this.db.from('training_workers').update({ training_status: 'Complete', updated_at: new Date().toISOString(), updated_by: user.id }).eq('company_id', user.tenantId).eq('id', record.worker_id).select('id').single()).catch(() => null);
    }
  }

  private async scopedSessions(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_sessions').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private async scopedAttendance(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_attendance_records').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.sessionId) req = req.eq('session_id', query.sessionId);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private async scopedRecords(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_completion_records').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.sessionId) req = req.eq('session_id', query.sessionId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.trainingId) req = req.eq('training_item_id', query.trainingId);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private async scopedEvidence(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_record_evidence_documents').select('*').eq('company_id', user.tenantId).is('removed_at', null);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    return this.safeMany<Row>(req.order('linked_at', { ascending: false }));
  }

  private async scopedWorkers(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId).is('archived_at', null);
    if (query.siteId) req = req.eq('primary_site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'primary_site_id', true);
    if (query.workerType) req = req.eq('worker_type', query.workerType);
    if (query.employerType) req = req.eq('employer_type', query.employerType);
    return this.safeMany<Row>(req.order('display_name').limit(Number(query.limit ?? 500)));
  }

  private siteScopedBase(user: RequestUser, req: any, column = 'site_id', includeNull = false) {
    const scope = this.scope(user);
    if (scope.selectedSiteId) return includeNull ? req.or(`${column}.is.null,${column}.eq.${this.assertSiteAccess(user, scope.selectedSiteId)}`) : req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId));
    if (!scope.corporateView && scope.allowedSiteIds.length) return includeNull ? req.or(`${column}.is.null,${column}.in.(${scope.allowedSiteIds.join(',')})`) : req.in(column, scope.allowedSiteIds);
    if (!scope.corporateView) return includeNull ? req.is(column, null) : req.eq(column, '__no_site_access__');
    return req;
  }

  private scope(user: RequestUser): Scope {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) };
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }

  private async assertSession(user: RequestUser, sessionId: string) {
    const row = await this.db.single<Row>(this.db.from('training_sessions').select('*').eq('company_id', user.tenantId).eq('id', sessionId).single());
    if (!row) throw new NotFoundException('Training session was not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertWorker(user: RequestUser, workerId?: string | null) {
    if (!workerId) throw new BadRequestException('Worker is required.');
    const row = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single());
    if (!row) throw new NotFoundException('Worker profile was not found.');
    if (row.primary_site_id) this.assertSiteAccess(user, row.primary_site_id);
    return row;
  }

  private async assertRoster(user: RequestUser, sessionId: string, rosterId: string) {
    const row = await this.db.single<Row>(this.db.from('training_session_roster').select('*').eq('company_id', user.tenantId).eq('session_id', sessionId).eq('id', rosterId).single());
    if (!row) throw new NotFoundException('Roster entry was not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAttendance(user: RequestUser, sessionId: string, attendanceId: string) {
    const row = await this.db.single<Row>(this.db.from('training_attendance_records').select('*').eq('company_id', user.tenantId).eq('session_id', sessionId).eq('id', attendanceId).single());
    if (!row) throw new NotFoundException('Attendance record was not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertRecord(user: RequestUser, recordId: string) {
    const row = await this.db.single<Row>(this.db.from('training_completion_records').select('*').eq('company_id', user.tenantId).eq('id', recordId).single());
    if (!row) throw new NotFoundException('Completion record was not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertEvidence(user: RequestUser, recordId: string, evidenceId: string) {
    const row = await this.db.single<Row>(this.db.from('training_record_evidence_documents').select('*').eq('company_id', user.tenantId).eq('completion_record_id', recordId).eq('id', evidenceId).single());
    if (!row) throw new NotFoundException('Evidence link was not found.');
    this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async optionalTrainingItem(user: RequestUser, trainingId: string) {
    const row = await this.db.single<Row>(this.db.from('training_required_items').select('*').eq('company_id', user.tenantId).eq('id', trainingId).single());
    if (!row) throw new NotFoundException('Required Training Library item was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private assertSessionEditable(row: Row, reason?: string, rosterOrAttendance = false) {
    if (row.archived_at) throw new BadRequestException('Archived training sessions cannot be edited.');
    if (row.session_status === 'Completed' && !reason) throw new BadRequestException(rosterOrAttendance ? 'Completed session changes require controlled correction reason.' : 'Completed session edits require reason.');
    if (row.session_status === 'Cancelled' && !reason) throw new BadRequestException('Cancelled session edits require controlled reason.');
  }

  private assertRecordEditable(row: Row, reason?: string) {
    if (row.archived_at) throw new BadRequestException('Archived completion records cannot be edited.');
    if (['Approved', 'Verified'].includes(row.approval_status) && !reason) throw new BadRequestException('Approved/verified completion records are locked unless a controlled reason is provided.');
  }

  private validateSessionSchedule(row: Row) {
    if (row.start_time && row.end_time && new Date(row.end_time) <= new Date(row.start_time)) throw new BadRequestException('End time must be after start time.');
    if (row.session_status === 'Cancelled') this.requireText(row.cancellation_reason, 'Cancelled session requires cancellation reason.');
  }

  private validateImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.worker_email && !row.employee_id && !row.contractor_id && !row.badge_number && !row.worker_identifier) errors.push('Worker identifier is required.');
    if (row.attendance_status && !attendanceStatuses.includes(row.attendance_status)) errors.push(`Invalid attendance status "${row.attendance_status}".`);
    if (row.completion_status && !completionStatuses.includes(row.completion_status)) errors.push(`Invalid completion status "${row.completion_status}".`);
    if (!row.training_code && !row.session_code) errors.push('Training code or session code is required.');
    return errors;
  }

  private completionFromAttendance(row: Row, session: Row) {
    const status = row.attendance_status;
    if (status === 'Present' || status === 'Late') return 'Completed';
    if (status === 'Partial Attendance') return 'Completed Pending Verification';
    if (status === 'Excused') return 'Excused';
    if (status === 'No-Show') return 'No-Show';
    if (status === 'Absent') return 'Incomplete';
    if (status === 'Incomplete' || status === 'Left Early') return 'Incomplete';
    if (session.session_status === 'Cancelled') return 'Cancelled';
    return 'Not Started';
  }

  private initialCompletionStatus(dto: Row) {
    if (dto.completionStatus ?? dto.completion_status) return dto.completionStatus ?? dto.completion_status;
    return dto.completionDate ?? dto.completion_date ? 'Completed Pending Verification' : 'Not Started';
  }

  private initialEvidenceStatus(dto: Row, trainingItem: Row | null) {
    const rules = dto.evidenceRules ?? dto.evidence_rules_json ?? dto;
    const required = rules.evidence_required ?? rules.evidenceRequired ?? (trainingItem?.evidence_policy_status === 'Evidence Required');
    return required ? 'Missing' : 'Not Required';
  }

  private initialVerificationStatus(dto: Row, trainingItem: Row | null) {
    const rules = dto.evidenceRules ?? dto.evidence_rules_json ?? dto;
    const required = rules.verification_required ?? rules.verificationRequired ?? Boolean(trainingItem?.safety_critical);
    return required ? 'Pending' : 'Not Required';
  }

  private initialApprovalStatus(dto: Row, trainingItem: Row | null) {
    const rules = dto.evidenceRules ?? dto.evidence_rules_json ?? dto;
    const required = rules.approval_required ?? rules.approvalRequired ?? false;
    return required || trainingItem?.psm_critical ? 'Pending Approval' : 'Not Required';
  }

  private expiryDateFrom(trainingItem: Row | null, completionDate: string | null) {
    if (!trainingItem?.recurrence_interval_days || !completionDate) return null;
    const date = new Date(completionDate);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(trainingItem.recurrence_interval_days));
    return this.dateOnly(date);
  }

  private applySessionFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.session_title, row.session_code, row.training_title, row.training_code].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.unitId) result = result.filter((row) => row.unit_id === query.unitId);
    if (query.areaId) result = result.filter((row) => row.area_id === query.areaId);
    if (query.trainingItemId) result = result.filter((row) => row.training_item_id === query.trainingItemId);
    if (query.trainingCategory) result = result.filter((row) => row.training_category === query.trainingCategory);
    if (query.sessionType) result = result.filter((row) => row.session_type === query.sessionType);
    if (query.sessionStatus) result = result.filter((row) => row.session_status === query.sessionStatus);
    if (query.instructor) result = result.filter((row) => [row.instructor_user_id, row.instructor_worker_id, row.external_instructor_name].includes(query.instructor));
    return this.applyDateRange(result, query, 'start_time');
  }

  private applyRecordFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.training_title, row.training_code, row.worker_name, row.score_summary].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.unitId) result = result.filter((row) => row.unit_id === query.unitId);
    if (query.areaId) result = result.filter((row) => row.area_id === query.areaId);
    if (query.trainingItemId || query.trainingId) result = result.filter((row) => row.training_item_id === (query.trainingItemId ?? query.trainingId));
    if (query.trainingCategory) result = result.filter((row) => row.training_category === query.trainingCategory);
    if (query.completionStatus) result = result.filter((row) => row.completion_status === query.completionStatus);
    if (query.attendanceStatus) result = result.filter((row) => row.attendance_status === query.attendanceStatus);
    if (query.evidenceStatus) result = result.filter((row) => row.evidence_status === query.evidenceStatus);
    if (query.verificationStatus) result = result.filter((row) => row.verification_status === query.verificationStatus);
    if (query.approvalStatus) result = result.filter((row) => row.approval_status === query.approvalStatus);
    return this.applyDateRange(result, query, 'completion_date');
  }

  private applyDateRange(rows: Row[], query: Row, field: string) {
    let result = rows;
    if (query.dateFrom) result = result.filter((row) => !row[field] || new Date(row[field]) >= new Date(query.dateFrom));
    if (query.dateTo) result = result.filter((row) => !row[field] || new Date(row[field]) <= new Date(query.dateTo));
    return result;
  }

  private hydrateSession(session: Row, roster: Row[], attendance: Row[], records: Row[]) {
    const sessionRoster = roster.filter((row) => row.session_id === session.id);
    const sessionAttendance = attendance.filter((row) => row.session_id === session.id);
    const sessionRecords = records.filter((row) => row.session_id === session.id);
    return {
      ...session,
      rosterCount: sessionRoster.length,
      present: sessionAttendance.filter((row) => row.attendance_status === 'Present').length,
      absent: sessionAttendance.filter((row) => ['Absent', 'No-Show'].includes(row.attendance_status)).length,
      completed: sessionRecords.filter((row) => ['Completed', 'Manually Verified'].includes(row.completion_status)).length,
      pendingVerification: sessionRecords.filter((row) => row.verification_status === 'Pending').length,
      missingEvidence: sessionRecords.filter((row) => row.evidence_status === 'Missing').length
    };
  }

  private async hydrateRoster(user: RequestUser, rows: Row[]): Promise<Row[]> {
    const workerIds = [...new Set(rows.map((row) => row.worker_id).filter(Boolean))];
    const workers = workerIds.length ? await this.safeMany<Row>(this.db.from('training_workers').select('id,display_name,work_email,worker_type,employer_type,job_title,department_name,training_status,competency_status,primary_site_id').eq('company_id', user.tenantId).in('id', workerIds)) : [];
    const byId = new Map(workers.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, worker: byId.get(row.worker_id) ?? null, workerName: byId.get(row.worker_id)?.display_name ?? row.worker_id }));
  }

  private async hydrateAttendance(user: RequestUser, rows: Row[]): Promise<Row[]> {
    const workerIds = [...new Set(rows.map((row) => row.worker_id).filter(Boolean))];
    const workers = workerIds.length ? await this.safeMany<Row>(this.db.from('training_workers').select('id,display_name,work_email,worker_type,employer_type,job_title').eq('company_id', user.tenantId).in('id', workerIds)) : [];
    const byId = new Map(workers.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, worker: byId.get(row.worker_id) ?? null, workerName: byId.get(row.worker_id)?.display_name ?? row.worker_id }));
  }

  private sessionSummaryFromChildren(session: Row, roster: Row[], attendance: Row[], records: Row[]) {
    return {
      sessionTitleCode: `${session.session_title}${session.session_code ? ` (${session.session_code})` : ''}`,
      trainingItemVersion: session.training_item_version,
      siteUnit: `${session.site_id}${session.unit_id ? ` / ${session.unit_id}` : ''}`,
      dateTime: session.start_time,
      instructor: session.external_instructor_name ?? session.instructor_user_id ?? session.instructor_worker_id,
      rosterCount: roster.length,
      present: attendance.filter((row) => row.attendance_status === 'Present').length,
      absent: attendance.filter((row) => ['Absent', 'No-Show'].includes(row.attendance_status)).length,
      completed: records.filter((row) => ['Completed', 'Manually Verified'].includes(row.completion_status)).length,
      pendingVerification: records.filter((row) => row.verification_status === 'Pending').length,
      missingEvidence: records.filter((row) => row.evidence_status === 'Missing').length,
      sessionStatus: session.session_status,
      approvalStatus: session.approval_status,
      safetyCritical: session.safety_critical,
      matrixGapsAffected: records.filter((row) => row.matrix_gap_id).length,
      blockersCleared: records.filter((row) => row.ptw_blocker_id || row.moc_training_requirement_id || row.pssr_training_blocker_id).length
    };
  }

  private recordSummary(rows: Row[]) {
    return {
      total: rows.length,
      completed: rows.filter((row) => row.completion_status === 'Completed').length,
      pendingVerification: rows.filter((row) => row.verification_status === 'Pending').length,
      pendingApproval: rows.filter((row) => row.approval_status === 'Pending Approval').length,
      missingEvidence: rows.filter((row) => row.evidence_status === 'Missing').length,
      failedIncomplete: rows.filter((row) => ['Failed', 'Incomplete', 'No-Show'].includes(row.completion_status)).length,
      expired: rows.filter((row) => row.completion_status === 'Expired' || (row.expiry_date && row.expiry_date < this.dateOnly(new Date()))).length,
      manuallyEntered: rows.filter((row) => row.manually_entered).length,
      matrixLinked: rows.filter((row) => row.matrix_assignment_id || row.matrix_gap_id).length,
      competencyLinked: rows.filter((row) => row.competency_requirement_id || row.competency_gap_id).length
    };
  }

  private sessionTabs(sessionId: string) {
    return ['Overview', 'Training Item / Version', 'Schedule / Location', 'Instructor / Provider', 'Roster', 'Attendance', 'Completion Records', 'Evidence / Documents', 'Linked Gaps / Matrix / Competency', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/training-competency/training-records/sessions/${sessionId}`, enabled: true }));
  }

  private async addInitialRosterAndLinks(user: RequestUser, session: Row, dto: Row) {
    for (const entry of dto.roster ?? []) await this.addRoster(user, session.id, entry).catch(() => null);
    for (const link of dto.links ?? []) await this.addSessionLink(user, session.id, link).catch(() => null);
  }

  private async writeStatusUpdate(user: RequestUser, before: Row | null, after: Row, reason: string) {
    await this.db.single(this.db.from('training_record_status_updates').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: after.site_id,
      completion_record_id: after.id,
      old_completion_status: before?.completion_status ?? null,
      new_completion_status: after.completion_status,
      old_evidence_status: before?.evidence_status ?? null,
      new_evidence_status: after.evidence_status,
      old_verification_status: before?.verification_status ?? null,
      new_verification_status: after.verification_status,
      old_approval_status: before?.approval_status ?? null,
      new_approval_status: after.approval_status,
      update_reason: reason,
      updated_by: user.id
    }).select('id').single()).catch(() => null);
  }

  private async writeEvent(user: RequestUser, target: Row, eventType: string, title: string, before: Row | null, after: Row | null) {
    const event = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: target?.site_id ?? after?.site_id ?? null,
      unit_id: target?.unit_id ?? after?.unit_id ?? null,
      area_id: target?.area_id ?? after?.area_id ?? null,
      worker_id: target?.worker_id ?? after?.worker_id ?? null,
      session_id: target?.session_id ?? after?.session_id ?? (target?.id && target?.session_title ? target.id : null),
      completion_record_id: target?.completion_record_id ?? (target?.id && target?.completion_status ? target.id : null),
      attendance_record_id: target?.attendance_record_id ?? (target?.id && target?.attendance_status ? target.id : null),
      event_type: eventType,
      event_title: title,
      event_description: title,
      before_value_json: before,
      after_value_json: after,
      actor_user_id: user.id,
      source_module: 'Training Records',
      source_record_id: after?.id ?? target?.id ?? null
    };
    await this.db.single(this.db.from('training_record_history_events').insert(event).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.records.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingRecords', entityId: event.source_record_id ?? undefined, before: before as JsonValue, after: after as JsonValue, metadata: { title, sourceModule: 'Training Records' } as JsonValue }).catch(() => null);
  }

  private sortRows(rows: Row[], sort: string) {
    const [field, direction] = sort.split('.');
    const key = field || 'updated_at';
    return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction === 'asc' ? 1 : -1));
  }

  private countBy(rows: Row[], field: string) {
    return Object.entries(rows.reduce<Record<string, Row[]>>((acc, row) => {
      const key = String(row[field] ?? 'Missing');
      acc[key] = [...(acc[key] ?? []), row];
      return acc;
    }, {})).map(([label, items]) => ({ label, count: items.length }));
  }

  private dateOnly(value: Date | string) {
    return new Date(value).toISOString().slice(0, 10);
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private compact<T extends Row>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
  }

  private must<T>(row: T | null | undefined, message: string): T {
    if (!row) throw new Error(message);
    return row;
  }

  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> {
    return this.db.many<T>(query).catch(() => []);
  }
}
