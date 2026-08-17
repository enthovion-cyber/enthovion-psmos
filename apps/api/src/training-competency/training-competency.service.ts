import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const workerTypes = ['Employee', 'Contractor', 'Vendor', 'Visitor', 'Trainee', 'Intern', 'Auditor', 'Consultant', 'Temporary worker', 'Other'];
const employerTypes = ['Company employee', 'Contractor company', 'Vendor company', 'Visitor', 'External auditor', 'Other'];
const employmentStatuses = ['Active', 'Pending onboarding', 'Suspended', 'Inactive', 'Archived', 'Left company', 'Contract expired'];
const assignmentStatuses = ['Active', 'Pending', 'Temporary', 'Expired', 'Suspended', 'Removed'];
const trainingStatuses = ['Not Assessed', 'Complete', 'Incomplete', 'Overdue', 'Expiring Soon', 'Pending Verification', 'Not Applicable', 'Blocked'];
const certificationStatuses = ['Not Assessed', 'Current', 'Expiring Soon', 'Expired', 'Missing', 'Pending Verification', 'Not Applicable'];
const competencyStatuses = ['Not Assessed', 'Competent', 'Competent With Restrictions', 'Not Competent', 'Needs Assessment', 'Suspended', 'Not Applicable'];
const ptwStatuses = ['Not Assessed', 'Authorized', 'Partially Authorized', 'Not Authorized', 'Expired', 'Suspended', 'Pending Approval', 'Not Applicable'];
const reviewStatuses = ['Not Reviewed', 'Pending Review', 'Approved', 'Returned', 'Rejected'];
const workerStatuses = ['Draft', 'Active', 'Pending Review', 'Archived', 'Blocked'];
const jobRoles = ['Operator', 'Senior Operator', 'Maintenance Technician', 'Mechanical Technician', 'Electrical Technician', 'Instrument Technician', 'HSE Specialist', 'Process Engineer', 'Supervisor', 'Contractor Supervisor', 'Manager', 'Auditor', 'Visitor', 'Other'];
const ptwRoleCandidates = ['Permit Applicant', 'Performing Authority', 'Permit Receiver', 'Permit Issuer', 'Area Authority', 'Gas Tester', 'Isolating Authority', 'Electrical Isolator', 'Mechanical Isolator', 'Confined Space Attendant', 'Fire Watch', 'Standby Person', 'Lifting Supervisor', 'Excavation Competent Person', 'Contractor Supervisor'];
const workerDocumentTypes = ['Employment record reference', 'Contractor onboarding document', 'Training certificate', 'Competency assessment evidence', 'Medical/fitness document', 'ID/badge document', 'Authorization letter', 'Vendor qualification document', 'Signed policy acknowledgement', 'Other'];

@Injectable()
export class TrainingCompetencyService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row) {
    const [summary, registry, readinessBySite, readinessByUnit, overdue, recentHistory] = await Promise.all([
      this.dashboardSummary(user, query),
      this.workforce(user, { ...query, limit: query.limit ?? 10 }),
      this.readinessBySite(user, query),
      this.readinessByUnit(user, query),
      this.filteredWorkers(user, { ...query, trainingStatus: 'Overdue', limit: 8 }),
      this.history(user, { limit: 8 })
    ]);
    return {
      header: {
        title: 'Training & Competency',
        subtitle: 'Workforce, employee and contractor competency foundation for safety-critical work',
        activeSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      readinessBySite,
      readinessByUnit,
      workforceByEmployerType: this.countBy(registry.allRows ?? registry.rows, 'employer_type'),
      workforceByDepartment: this.countBy(registry.allRows ?? registry.rows, 'department_name'),
      workforceByRole: this.countBy(registry.allRows ?? registry.rows, 'job_title'),
      overduePreview: overdue.rows,
      expiringCertificationsPreview: (await this.filteredWorkers(user, { ...query, certificationStatus: 'Expiring Soon', limit: 8 })).rows,
      safetyCriticalGapsPreview: (await this.filteredWorkers(user, { ...query, safetyCriticalGap: 'true', limit: 8 })).rows,
      ptwAuthorizationGapsPreview: (await this.filteredWorkers(user, { ...query, ptwAuthorizationStatus: 'Not Authorized', limit: 8 })).rows,
      mocPssrTrainingReadinessPreview: (registry.allRows ?? registry.rows).filter((row: Row) => ['Pending', 'Blocked', 'Incomplete'].includes(row.moc_training_status) || ['Pending', 'Blocked', 'Incomplete'].includes(row.pssr_training_readiness_status)).slice(0, 8),
      recentWorkforceChanges: recentHistory.rows,
      recentTrainingHistoryEvents: recentHistory.rows,
      registry
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedWorkers(user, query);
    const now = new Date();
    return {
      totalWorkforce: rows.length,
      activeEmployees: rows.filter((row) => row.worker_type === 'Employee' && row.employment_status === 'Active' && !row.archived_at).length,
      activeContractors: rows.filter((row) => row.worker_type === 'Contractor' && row.employment_status === 'Active' && !row.archived_at).length,
      workersWithoutSiteAssignment: rows.filter((row) => !row.primary_site_id).length,
      workersMissingRoleAssignment: rows.filter((row) => !row.job_title && !row.current_role_assignment?.job_role).length,
      trainingComplete: rows.filter((row) => row.training_status === 'Complete').length,
      trainingIncomplete: rows.filter((row) => ['Incomplete', 'Not Assessed', 'Blocked'].includes(row.training_status)).length,
      trainingOverdue: rows.filter((row) => row.training_status === 'Overdue').length,
      trainingExpiringSoon: rows.filter((row) => row.training_status === 'Expiring Soon').length,
      certificationsExpiringSoon: rows.filter((row) => row.certification_status === 'Expiring Soon').length,
      safetyCriticalTrainingGaps: rows.filter((row) => row.safety_critical_role && row.training_status !== 'Complete').length,
      ptwAuthorizationGaps: rows.filter((row) => row.ptw_authorization_status === 'Not Authorized').length,
      sopAcknowledgementGaps: rows.filter((row) => row.sop_acknowledgement_status && row.sop_acknowledgement_status !== 'Complete').length,
      mocTrainingPending: rows.filter((row) => row.moc_training_status === 'Pending').length,
      pssrTrainingBlockers: rows.filter((row) => row.pssr_training_readiness_status === 'Blocked').length,
      workersPendingReview: rows.filter((row) => row.review_status === 'Pending Review').length,
      recordsPendingApproval: rows.filter((row) => row.review_status === 'Pending Review').length,
      recentTrainingUpdates: rows.filter((row) => row.updated_at && now.getTime() - new Date(row.updated_at).getTime() < 14 * 86400000).length
    };
  }

  async workforce(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.scopedWorkers(user, query);
    const filtered = this.applyInMemoryFilters(allRows, query);
    const sorted = this.sortRows(filtered, String(query.sort ?? 'updated_at.desc'));
    const rows = sorted.slice((page - 1) * limit, page * limit);
    return {
      rows,
      page,
      limit,
      total: filtered.length,
      allRows: sorted,
      summary: this.summaryFromRows(filtered),
      savedViews: ['All Workforce', 'Active Employees', 'Active Contractors', 'Missing Assignment', 'Missing Role', 'Training Overdue', 'Certifications Expiring', 'PTW Authorization Gaps', 'Pending Review', 'Blocked From Safety-Critical Work', 'My Site Workforce'],
      lastUpdated: new Date().toISOString()
    };
  }

  async workforceSummary(user: RequestUser, query: Row = {}) {
    return this.summaryFromRows(this.applyInMemoryFilters(await this.scopedWorkers(user, query), query));
  }

  async filteredWorkers(user: RequestUser, query: Row = {}) {
    return this.workforce(user, query);
  }

  async readinessBySite(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedWorkers(user, query);
    const bySite = this.groupBy(rows, 'primary_site_id');
    const sites = await this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId));
    const siteById = new Map(sites.map((site) => [site.id, site]));
    return Object.entries(bySite).map(([siteId, workers]) => ({
      siteId: siteId === 'null' ? null : siteId,
      siteName: siteById.get(siteId)?.name ?? (siteId === 'null' ? 'No site assignment' : siteId),
      totalWorkers: workers.length,
      trainingComplete: workers.filter((row) => row.training_status === 'Complete').length,
      readinessPercent: this.percent(workers.filter((row) => row.training_status === 'Complete').length, workers.length),
      safetyCriticalGaps: workers.filter((row) => row.safety_critical_role && row.training_status !== 'Complete').length
    }));
  }

  async readinessByUnit(user: RequestUser, query: Row = {}) {
    const assignments = await this.safeMany<Row>(this.scopeAssignments(user, this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).is('removed_at', null), query));
    const units = await this.safeMany<Row>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId));
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const workerIds = [...new Set(assignments.map((row) => row.worker_id).filter(Boolean))];
    const workers = workerIds.length ? await this.safeMany<Row>(this.db.from('training_workers').select('id,training_status,safety_critical_role').eq('company_id', user.tenantId).in('id', workerIds)) : [];
    const workerById = new Map(workers.map((worker) => [worker.id, worker]));
    return Object.entries(this.groupBy(assignments, 'unit_id')).map(([unitId, rows]) => {
      const mappedWorkers = rows.map((row) => workerById.get(row.worker_id)).filter(Boolean) as Row[];
      return {
        unitId: unitId === 'null' ? null : unitId,
        unitName: unitById.get(unitId)?.name ?? (unitId === 'null' ? 'No unit assignment' : unitId),
        totalWorkers: mappedWorkers.length,
        trainingComplete: mappedWorkers.filter((row) => row.training_status === 'Complete').length,
        readinessPercent: this.percent(mappedWorkers.filter((row) => row.training_status === 'Complete').length, mappedWorkers.length),
        safetyCriticalGaps: mappedWorkers.filter((row) => row.safety_critical_role && row.training_status !== 'Complete').length
      };
    });
  }

  async createWorker(user: RequestUser, dto: Row) {
    const cleanDto = this.normalizeWorkerDto(dto);
    this.ensureWorkerIdentifier(cleanDto);
    await this.validateWorkerInput(user, cleanDto);
    const row = this.workerPayload(user, cleanDto, true);
    const inserted = await this.insertWorkerRow(user, row);
    await this.writeHistory(user, inserted, 'Created', 'Worker profile created', null, inserted);
    await this.createInitialChildren(user, inserted, cleanDto);
    await this.recalculateStatus(user, inserted.id).catch(() => null);
    return this.workerDetail(user, inserted.id).catch(() => this.workerDetailFallback(user, inserted));
  }

  async updateWorker(user: RequestUser, workerId: string, dto: Row) {
    const before = await this.assertWorker(user, workerId);
    if (before.archived_at) throw new BadRequestException('Archived worker records must be reactivated before editing.');
    const cleanDto = this.normalizeWorkerDto(dto);
    this.ensureWorkerIdentifier(cleanDto);
    const patch = this.workerPayload(user, cleanDto, false);
    const updated = await this.writeWorkerRow(this.db.from('training_workers').update(patch).eq('company_id', user.tenantId).eq('id', workerId).select().single(), 'update');
    await this.writeHistory(user, updated, 'Updated', 'Worker profile updated', before, updated);
    return this.workerDetail(user, workerId);
  }

  async archiveWorker(user: RequestUser, workerId: string, dto: Row) {
    this.requireText(dto.reason, 'Archive reason is required');
    const before = await this.assertWorker(user, workerId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_workers').update({ status: 'Archived', employment_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select().single()), 'Archived worker profile was not returned by the database.');
    await this.writeHistory(user, updated, 'Archived', 'Worker profile archived', before, updated);
    return this.workerDetail(user, workerId);
  }

  async reactivateWorker(user: RequestUser, workerId: string, dto: Row) {
    const before = await this.assertWorker(user, workerId);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_workers').update({ status: 'Active', employment_status: dto.employmentStatus ?? 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select().single()), 'Reactivated worker profile was not returned by the database.');
    await this.writeHistory(user, updated, 'Restored', 'Worker profile reactivated', before, updated);
    return this.workerDetail(user, workerId);
  }

  async workerDetail(user: RequestUser, workerId: string) {
    const worker = await this.assertWorker(user, workerId);
    const [assignments, roles, accountLink, documents, history, settings] = await Promise.all([
      this.assignments(user, workerId),
      this.roleAssignments(user, workerId),
      this.accountLink(user, workerId),
      this.documents(user, workerId),
      this.history(user, { workerId, limit: 25 }),
      this.settings(user)
    ]);
    return {
      worker,
      header: {
        title: worker.display_name,
        status: worker.status,
        workerType: worker.worker_type,
        employerType: worker.employer_type,
        primarySiteId: worker.primary_site_id,
        trainingStatus: worker.training_status,
        certificationStatus: worker.certification_status,
        competencyStatus: worker.competency_status,
        ptwAuthorizationStatus: worker.ptw_authorization_status,
        reviewStatus: worker.review_status,
        accountLinkStatus: accountLink?.link_status ?? 'Not Linked'
      },
      summary: this.workerProfileSummary(worker, assignments, roles, accountLink, documents),
      assignments,
      roleAssignments: roles,
      accountLink,
      documents,
      trainingSummary: this.trainingSummaryPayload(worker),
      tabs: this.workerTabs(workerId),
      history: history.rows,
      settings
    };
  }

  async assignments(user: RequestUser, workerId: string) {
    await this.assertWorker(user, workerId);
    return this.safeMany(this.scopeAssignments(user, this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).is('removed_at', null).order('created_at', { ascending: false })));
  }

  async addAssignment(user: RequestUser, workerId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    const siteId = this.assertSiteAccess(user, dto.siteId ?? dto.site_id ?? worker.primary_site_id);
    const payload = this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      worker_id: workerId,
      site_id: siteId,
      department_id: dto.departmentId ?? dto.department_id,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      equipment_id: dto.equipmentId ?? dto.equipment_id,
      primary_assignment: Boolean(dto.primaryAssignment ?? dto.primary_assignment),
      assignment_status: dto.assignmentStatus ?? dto.assignment_status ?? 'Active',
      assignment_start_date: dto.assignmentStartDate ?? dto.assignment_start_date,
      assignment_end_date: dto.assignmentEndDate ?? dto.assignment_end_date,
      assignment_reason: dto.assignmentReason ?? dto.assignment_reason,
      supervisor_user_id: dto.supervisorUserId ?? dto.supervisor_user_id,
      created_by: user.id,
      updated_by: user.id
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_site_assignments').insert(payload).select().single()), 'Worker assignment was not returned by the database.');
    if (row.primary_assignment) await this.db.single(this.db.from('training_workers').update({ primary_site_id: row.site_id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    await this.writeHistory(user, worker, 'Assigned', 'Worker site/unit/area assignment added', null, row);
    return this.assignments(user, workerId);
  }

  async updateAssignment(user: RequestUser, workerId: string, assignmentId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    const before = await this.assertAssignment(user, workerId, assignmentId);
    const patch = this.compact({
      site_id: dto.siteId ? this.assertSiteAccess(user, dto.siteId) : undefined,
      department_id: dto.departmentId,
      unit_id: dto.unitId,
      area_id: dto.areaId,
      equipment_id: dto.equipmentId,
      primary_assignment: dto.primaryAssignment,
      assignment_status: dto.assignmentStatus,
      assignment_start_date: dto.assignmentStartDate,
      assignment_end_date: dto.assignmentEndDate,
      assignment_reason: dto.assignmentReason,
      supervisor_user_id: dto.supervisorUserId,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_site_assignments').update(patch).eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', assignmentId).select().single()), 'Worker assignment was not returned by the database.');
    if (row.primary_assignment) await this.db.single(this.db.from('training_workers').update({ primary_site_id: row.site_id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    await this.writeHistory(user, worker, 'Updated', 'Worker assignment updated', before, row);
    return this.assignments(user, workerId);
  }

  async removeAssignment(user: RequestUser, workerId: string, assignmentId: string, dto: Row) {
    this.requireText(dto.reason, 'Remove reason is required');
    const worker = await this.assertWorker(user, workerId);
    const before = await this.assertAssignment(user, workerId, assignmentId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_site_assignments').update({ assignment_status: 'Removed', removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', assignmentId).select().single()), 'Removed assignment was not returned by the database.');
    await this.writeHistory(user, worker, 'Removed', 'Worker assignment removed', before, row);
    return this.assignments(user, workerId);
  }

  async roleAssignments(user: RequestUser, workerId: string) {
    await this.assertWorker(user, workerId);
    return this.safeMany(this.db.from('training_worker_role_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).is('removed_at', null).order('created_at', { ascending: false }));
  }

  async addRoleAssignment(user: RequestUser, workerId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    this.requireText(dto.jobRole ?? dto.job_role, 'Job role is required');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_role_assignments').insert(this.rolePayload(user, workerId, dto, true)).select().single()), 'Worker role assignment was not returned by the database.');
    await this.db.single(this.db.from('training_workers').update({ job_title: row.job_role, safety_critical_role: row.safety_critical, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    await this.writeHistory(user, worker, 'Assigned', 'Worker role/competency foundation added', null, row);
    return this.roleAssignments(user, workerId);
  }

  async updateRoleAssignment(user: RequestUser, workerId: string, roleAssignmentId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    const before = await this.assertRoleAssignment(user, workerId, roleAssignmentId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_role_assignments').update(this.rolePayload(user, workerId, dto, false)).eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', roleAssignmentId).select().single()), 'Worker role assignment was not returned by the database.');
    await this.writeHistory(user, worker, 'Updated', 'Worker role/competency foundation updated', before, row);
    return this.roleAssignments(user, workerId);
  }

  async removeRoleAssignment(user: RequestUser, workerId: string, roleAssignmentId: string, dto: Row) {
    this.requireText(dto.reason, 'Remove reason is required');
    const worker = await this.assertWorker(user, workerId);
    const before = await this.assertRoleAssignment(user, workerId, roleAssignmentId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_role_assignments').update({ role_status: 'Removed', removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', roleAssignmentId).select().single()), 'Removed role assignment was not returned by the database.');
    await this.writeHistory(user, worker, 'Removed', 'Worker role assignment removed', before, row);
    return this.roleAssignments(user, workerId);
  }

  async accountLink(user: RequestUser, workerId: string) {
    await this.assertWorker(user, workerId);
    return this.db.single<Row>(this.db.from('training_worker_account_links').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).is('unlinked_at', null).maybeSingle()).catch(() => null);
  }

  async linkAccount(user: RequestUser, workerId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    const userId = String(dto.userId ?? dto.user_id ?? '');
    this.requireText(userId, 'Linked user account is required');
    const linkedUser = await this.db.single<Row>(this.db.from('User').select('id,email,status,tenantId').eq('tenantId', user.tenantId).eq('id', userId).single());
    if (!linkedUser || linkedUser.status === 'DISABLED') throw new BadRequestException('Linked user account is not active or was not found in this company.');
    await this.unlinkExistingLinks(user, workerId, 'Replaced by new account link');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_account_links').insert({ id: randomUUID(), company_id: user.tenantId, worker_id: workerId, user_id: userId, link_status: 'Linked', linked_email: linkedUser.email, app_access_required: Boolean(dto.appAccessRequired ?? dto.app_access_required), linked_by: user.id }).select().single()), 'Account link was not returned by the database.');
    await this.db.single(this.db.from('training_workers').update({ linked_user_id: userId, work_email: worker.work_email ?? linkedUser.email, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    await this.writeHistory(user, worker, 'Linked', 'Worker linked to IAM user account', null, row);
    return this.accountLink(user, workerId);
  }

  async unlinkAccount(user: RequestUser, workerId: string, dto: Row) {
    this.requireText(dto.reason, 'Unlink reason is required');
    const worker = await this.assertWorker(user, workerId);
    await this.unlinkExistingLinks(user, workerId, dto.reason);
    await this.db.single(this.db.from('training_workers').update({ linked_user_id: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', workerId).select('id').single()).catch(() => null);
    await this.writeHistory(user, worker, 'Unlinked', 'Worker IAM user account link removed', null, { reason: dto.reason });
    return null;
  }

  async inviteAccount(user: RequestUser, workerId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    const email = String(dto.email ?? worker.work_email ?? '');
    this.requireText(email, 'User account email is required before invitation.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_account_links').insert({ id: randomUUID(), company_id: user.tenantId, worker_id: workerId, user_id: worker.linked_user_id ?? null, link_status: 'Invitation Requested', linked_email: email, app_access_required: true, linked_by: user.id }).select().single()), 'Account invitation record was not returned by the database.');
    await this.writeHistory(user, worker, 'Notification Sent', 'Worker account invitation requested through IAM foundation', null, row);
    return row;
  }

  async documents(user: RequestUser, workerId: string) {
    await this.assertWorker(user, workerId);
    return this.safeMany(this.db.from('training_worker_documents').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(user: RequestUser, workerId: string, dto: Row) {
    const worker = await this.assertWorker(user, workerId);
    this.requireText(dto.documentId ?? dto.document_id, 'Document Control record is required');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_documents').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      worker_id: workerId,
      site_id: dto.siteId ?? dto.site_id ?? worker.primary_site_id ?? null,
      document_id: dto.documentId ?? dto.document_id,
      document_type: dto.documentType ?? dto.document_type ?? 'Other',
      relationship_type: dto.relationshipType ?? dto.relationship_type ?? 'Evidence',
      restricted_visibility: Boolean(dto.restrictedVisibility ?? dto.restricted_visibility),
      linked_by: user.id
    }).select().single()), 'Worker document link was not returned by the database.');
    await this.writeHistory(user, worker, 'Linked', 'Worker document link added', null, row);
    return this.documents(user, workerId);
  }

  async removeDocument(user: RequestUser, workerId: string, documentLinkId: string, dto: Row) {
    this.requireText(dto.reason, 'Remove reason is required');
    const worker = await this.assertWorker(user, workerId);
    const before = this.must(await this.db.single<Row>(this.db.from('training_worker_documents').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', documentLinkId).single()), 'Worker document link was not found.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_documents').update({ removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason }).eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', documentLinkId).select().single()), 'Removed document link was not returned by the database.');
    await this.writeHistory(user, worker, 'Unlinked', 'Worker document link removed', before, row);
    return this.documents(user, workerId);
  }

  async trainingSummary(user: RequestUser, workerId: string) {
    return this.trainingSummaryPayload(await this.assertWorker(user, workerId));
  }

  async recalculateStatus(user: RequestUser, workerId: string) {
    const worker = await this.assertWorker(user, workerId);
    const [assignments, roles] = await Promise.all([this.assignments(user, workerId), this.roleAssignments(user, workerId)]);
    const settings = await this.settings(user);
    const blockers: string[] = [];
    if (settings.require_site_assignment_for_active_worker && worker.employment_status === 'Active' && assignments.length === 0) blockers.push('Active worker is missing required site assignment.');
    if (settings.require_role_assignment_for_active_worker && worker.employment_status === 'Active' && roles.length === 0 && !worker.job_title) blockers.push('Active worker is missing required role assignment.');
    if (worker.safety_critical_role && worker.training_status !== 'Complete') blockers.push('Safety-critical worker has incomplete training foundation status.');
    const trainingStatus = blockers.length ? (worker.training_status === 'Complete' ? 'Incomplete' : worker.training_status ?? 'Not Assessed') : worker.training_status ?? 'Not Assessed';
    const snapshot = this.must(await this.db.single<Row>(this.db.from('training_worker_status_snapshots').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      worker_id: workerId,
      site_id: worker.primary_site_id ?? null,
      snapshot_type: 'Foundation Recalculation',
      training_status: trainingStatus,
      certification_status: worker.certification_status ?? 'Not Assessed',
      competency_status: worker.competency_status ?? 'Not Assessed',
      ptw_authorization_status: worker.ptw_authorization_status ?? 'Not Assessed',
      sop_acknowledgement_status: worker.sop_acknowledgement_status ?? 'Not Assessed',
      moc_training_status: worker.moc_training_status ?? 'Not Assessed',
      pssr_training_readiness_status: worker.pssr_training_readiness_status ?? 'Not Assessed',
      safety_critical_gap_count: worker.safety_critical_role && worker.training_status !== 'Complete' ? 1 : 0,
      overdue_training_count: worker.training_status === 'Overdue' ? 1 : 0,
      expiring_certification_count: worker.certification_status === 'Expiring Soon' ? 1 : 0,
      blocked_reason: blockers.join(' '),
      calculated_by_system: true,
      calculated_at: new Date().toISOString()
    }).select().single()), 'Status snapshot was not returned by the database.');
    await this.writeHistory(user, worker, 'Calculated', 'Worker training status foundation recalculated', null, snapshot);
    return { snapshot, blockers, summary: this.trainingSummaryPayload({ ...worker, training_status: trainingStatus }) };
  }

  async history(user: RequestUser, query: Row = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let req: any = this.db.from('training_worker_history_events').select('*').eq('company_id', user.tenantId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.siteId) req = req.eq('site_id', query.siteId);
    req = req.order('created_at', { ascending: false }).limit(limit);
    const rows = await this.safeMany(req);
    return { rows, total: rows.length, lastUpdated: new Date().toISOString() };
  }

  async settings(user: RequestUser) {
    const selectedSiteId = user.selectedSiteId ?? user.activeSiteId ?? null;
    const rows = await this.safeMany(this.db.from('training_settings').select('*').eq('company_id', user.tenantId).or(`site_id.is.null${selectedSiteId ? `,site_id.eq.${selectedSiteId}` : ''}`).order('site_id', { ascending: false }).limit(1));
    return rows[0] ?? {
      company_id: user.tenantId,
      site_id: selectedSiteId,
      default_training_expiry_warning_days: 30,
      default_certification_expiry_warning_days: 60,
      require_site_assignment_for_active_worker: true,
      require_role_assignment_for_active_worker: true,
      allow_worker_without_user_account: true,
      contractor_access_requires_site_assignment: true,
      safety_critical_worker_requires_review: true,
      settings_json: {}
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const selectedSiteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    let existingReq: any = this.db.from('training_settings').select('*').eq('company_id', user.tenantId);
    existingReq = selectedSiteId ? existingReq.eq('site_id', selectedSiteId) : existingReq.is('site_id', null);
    const existing = await this.safeMany(existingReq.limit(1)).catch(() => []);
    const payload = this.compact({
      id: existing[0]?.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: selectedSiteId,
      default_training_expiry_warning_days: dto.defaultTrainingExpiryWarningDays ?? dto.default_training_expiry_warning_days ?? 30,
      default_certification_expiry_warning_days: dto.defaultCertificationExpiryWarningDays ?? dto.default_certification_expiry_warning_days ?? 60,
      require_site_assignment_for_active_worker: dto.requireSiteAssignmentForActiveWorker ?? dto.require_site_assignment_for_active_worker ?? true,
      require_role_assignment_for_active_worker: dto.requireRoleAssignmentForActiveWorker ?? dto.require_role_assignment_for_active_worker ?? true,
      allow_worker_without_user_account: dto.allowWorkerWithoutUserAccount ?? dto.allow_worker_without_user_account ?? true,
      contractor_access_requires_site_assignment: dto.contractorAccessRequiresSiteAssignment ?? dto.contractor_access_requires_site_assignment ?? true,
      safety_critical_worker_requires_review: dto.safetyCriticalWorkerRequiresReview ?? dto.safety_critical_worker_requires_review ?? true,
      settings_json: dto.settingsJson ?? dto.settings_json ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const row = this.must(await this.db.single<Row>(this.db.from('training_settings').upsert(payload, { onConflict: 'id' }).select().single()), 'Training settings were not returned by the database.');
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'training.settings.updated', entityType: 'TrainingSettings', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async context(user: RequestUser, query: Row = {}) {
    const scope = this.scope(user);
    const [sites, units, areas, users, documents] = await Promise.all([
      this.safeMany(this.siteScopedBase(user, this.db.from('Site').select('id,name,code,timezone').eq('tenantId', user.tenantId), 'id')),
      this.safeMany(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId)),
      this.safeMany(this.db.from('Area').select('id,name,code,unitId').eq('tenantId', user.tenantId)),
      this.safeMany(this.db.from('User').select('id,email,displayName,title,department,status').eq('tenantId', user.tenantId).or(query.search ? `displayName.ilike.%${query.search}%,email.ilike.%${query.search}%` : 'displayName.not.is.null').limit(50)),
      this.safeMany(this.db.from('Document').select('id,title,documentNo,status,ownerId,entityType,entityId').eq('tenantId', user.tenantId).limit(50))
    ]);
    return { sites, units, areas, users, documents, allowedSiteIds: scope.allowedSiteIds, selectedSiteId: scope.selectedSiteId, lookups: this.allLookups() };
  }

  lookup(lookup: string) {
    const lookups = this.allLookups();
    return { values: lookups[lookup] ?? [] };
  }

  private async scopedWorkers(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId);
    if (query.includeArchived !== 'true') req = req.is('archived_at', null);
    if (query.siteId) req = req.eq('primary_site_id', query.siteId);
    else req = this.siteScopedBase(user, req, 'primary_site_id');
    const rows = await this.safeMany<Row>(req);
    return this.hydrateWorkers(user, rows);
  }

  private async hydrateWorkers(user: RequestUser, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return [];
    const siteIds = [...new Set(rows.map((row) => row.primary_site_id).filter(Boolean))];
    const userIds = [...new Set(rows.flatMap((row) => [row.linked_user_id, row.supervisor_user_id, row.line_manager_user_id]).filter(Boolean))];
    const workerIds = rows.map((row) => row.id);
    const [sites, users, assignments, roles, accountLinks] = await Promise.all([
      siteIds.length ? this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId).in('id', siteIds)) : [],
      userIds.length ? this.safeMany<Row>(this.db.from('User').select('id,email,displayName,title,department,status').eq('tenantId', user.tenantId).in('id', userIds)) : [],
      this.safeMany<Row>(this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).in('worker_id', workerIds).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('training_worker_role_assignments').select('*').eq('company_id', user.tenantId).in('worker_id', workerIds).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('training_worker_account_links').select('*').eq('company_id', user.tenantId).in('worker_id', workerIds).is('unlinked_at', null))
    ]);
    const siteById = new Map(sites.map((site) => [site.id, site]));
    const userById = new Map(users.map((u) => [u.id, u]));
    const assignmentsByWorker = this.groupBy(assignments, 'worker_id');
    const rolesByWorker = this.groupBy(roles, 'worker_id');
    const accountByWorker = new Map(accountLinks.map((link) => [link.worker_id, link]));
    return rows.map((row) => ({
      ...row,
      primarySite: siteById.get(row.primary_site_id) ?? null,
      linkedUser: userById.get(row.linked_user_id) ?? null,
      supervisor: userById.get(row.supervisor_user_id) ?? null,
      lineManager: userById.get(row.line_manager_user_id) ?? null,
      assignments: assignmentsByWorker[row.id] ?? [],
      roleAssignments: rolesByWorker[row.id] ?? [],
      current_role_assignment: (rolesByWorker[row.id] ?? [])[0] ?? null,
      accountLink: accountByWorker.get(row.id) ?? null
    }));
  }

  private async validateWorkerInput(user: RequestUser, dto: Row) {
    this.requireText(dto.displayName ?? dto.display_name, 'Display name is required');
    const identifiers = [dto.workEmail ?? dto.work_email, dto.employeeId ?? dto.employee_id, dto.contractorId ?? dto.contractor_id, dto.badgeNumber ?? dto.badge_number].filter(Boolean);
    if (!identifiers.length) throw new BadRequestException('At least one unique identifier is required: work email, employee ID, contractor ID, or badge number.');
    const workerType = dto.workerType ?? dto.worker_type;
    if (workerType === 'Contractor') this.requireText(dto.contractorCompanyName ?? dto.contractor_company_name, 'Contractor company is required for contractor workers.');
    const duplicates = await this.safeMany<Row>(this.db.from('training_workers').select('id,display_name,work_email,employee_id,contractor_id,badge_number').eq('company_id', user.tenantId).is('archived_at', null));
    const normalized = (value: unknown) => String(value ?? '').trim().toLowerCase();
    const duplicate = duplicates.find((row) => (
      (dto.workEmail || dto.work_email) && normalized(row.work_email) === normalized(dto.workEmail ?? dto.work_email)
    ) || (
      (dto.employeeId || dto.employee_id) && normalized(row.employee_id) === normalized(dto.employeeId ?? dto.employee_id)
    ) || (
      (dto.contractorId || dto.contractor_id) && normalized(row.contractor_id) === normalized(dto.contractorId ?? dto.contractor_id)
    ) || (
      (dto.badgeNumber || dto.badge_number) && normalized(row.badge_number) === normalized(dto.badgeNumber ?? dto.badge_number)
    ));
    if (duplicate) throw new BadRequestException(`Duplicate active worker found: ${duplicate.display_name}.`);
    if (dto.primarySiteId ?? dto.primary_site_id) this.assertSiteAccess(user, dto.primarySiteId ?? dto.primary_site_id);
  }

  private async writeWorkerRow(query: PromiseLike<any>, action: 'create' | 'update') {
    try {
      return this.must(await this.db.single<Row>(query), action === 'create' ? 'Worker profile was not returned by the database.' : 'Updated worker profile was not returned by the database.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('training_workers_identifier_check')) throw new BadRequestException('At least one unique identifier is required: work email, employee ID, contractor ID, or badge number.');
      if (message.toLowerCase().includes('duplicate key') || message.includes('training_workers_active_work_email_unique')) throw new BadRequestException('A worker with the same work email, employee ID, contractor ID, or badge number already exists.');
      throw error;
    }
  }

  private async insertWorkerRow(user: RequestUser, row: Partial<Row>) {
    try {
      return await this.writeWorkerRow(this.db.from('training_workers').insert(row).select().single(), 'create');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!this.isSchemaCacheColumnError(message)) throw error;
      const fallback = this.compact({
        id: row.id,
        company_id: row.company_id,
        primary_site_id: row.primary_site_id ?? user.selectedSiteId ?? user.activeSiteId ?? undefined,
        display_name: row.display_name,
        employee_id: row.employee_id ?? `WRK-${randomUUID().slice(0, 8).toUpperCase()}`
      });
      return await this.writeWorkerRow(this.db.from('training_workers').insert(fallback).select().single(), 'create');
    }
  }

  private workerDetailFallback(user: RequestUser, worker: Row) {
    const normalized: Row = {
      worker_type: 'Employee',
      employer_type: 'Company employee',
      employment_status: 'Pending onboarding',
      training_status: 'Not Assessed',
      certification_status: 'Not Assessed',
      competency_status: 'Not Assessed',
      ptw_authorization_status: 'Not Assessed',
      sop_acknowledgement_status: 'Not Assessed',
      moc_training_status: 'Not Assessed',
      pssr_training_readiness_status: 'Not Assessed',
      review_status: 'Not Reviewed',
      status: 'Draft',
      ...worker
    };
    return {
      worker: normalized,
      header: {
        title: normalized.display_name,
        status: normalized.status,
        workerType: normalized.worker_type,
        employerType: normalized.employer_type,
        primarySiteId: normalized.primary_site_id ?? null,
        trainingStatus: normalized.training_status,
        certificationStatus: normalized.certification_status,
        competencyStatus: normalized.competency_status,
        ptwAuthorizationStatus: normalized.ptw_authorization_status,
        reviewStatus: normalized.review_status,
        accountLinkStatus: 'Not Linked'
      },
      summary: this.workerProfileSummary(normalized, [], [], null, []),
      assignments: [],
      roleAssignments: [],
      accountLink: null,
      documents: [],
      trainingSummary: this.trainingSummaryPayload(normalized),
      tabs: this.workerTabs(normalized.id),
      history: [],
      settings: {
        company_id: user.tenantId,
        site_id: user.selectedSiteId ?? user.activeSiteId ?? null,
        default_training_expiry_warning_days: 30,
        default_certification_expiry_warning_days: 60,
        require_site_assignment_for_active_worker: true,
        require_role_assignment_for_active_worker: true,
        allow_worker_without_user_account: true,
        contractor_access_requires_site_assignment: true,
        safety_critical_worker_requires_review: true,
        settings_json: {}
      }
    };
  }

  private isSchemaCacheColumnError(message: string) {
    const lower = message.toLowerCase();
    return lower.includes('schema cache') || lower.includes('could not find') || lower.includes('column') || lower.includes('pgrst204');
  }

  private normalizeWorkerDto(dto: Row) {
    const normalized = { ...dto };
    for (const key of Object.keys(normalized)) {
      if (typeof normalized[key] === 'string') {
        const trimmed = normalized[key].trim();
        normalized[key] = trimmed === '' ? null : trimmed;
      }
    }
    if (normalized.assignment && typeof normalized.assignment === 'object') normalized.assignment = this.normalizeWorkerDto(normalized.assignment as Row);
    if (normalized.roleAssignment && typeof normalized.roleAssignment === 'object') normalized.roleAssignment = this.normalizeWorkerDto(normalized.roleAssignment as Row);
    return normalized;
  }

  private ensureWorkerIdentifier(dto: Row) {
    const identifiers = [dto.workEmail ?? dto.work_email, dto.employeeId ?? dto.employee_id, dto.contractorId ?? dto.contractor_id, dto.badgeNumber ?? dto.badge_number].filter(Boolean);
    if (!identifiers.length) dto.employeeId = `WRK-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private workerPayload(user: RequestUser, dto: Row, create: boolean) {
    const status = dto.status ?? (dto.employmentStatus === 'Active' || dto.employment_status === 'Active' ? 'Active' : 'Draft');
    return this.compact({
      id: create ? randomUUID() : undefined,
      company_id: create ? user.tenantId : undefined,
      primary_site_id: dto.primarySiteId ?? dto.primary_site_id,
      linked_user_id: dto.linkedUserId ?? dto.linked_user_id,
      first_name: dto.firstName ?? dto.first_name,
      last_name: dto.lastName ?? dto.last_name,
      display_name: dto.displayName ?? dto.display_name,
      work_email: dto.workEmail ?? dto.work_email,
      personal_email: dto.personalEmail ?? dto.personal_email,
      phone: dto.phone,
      employee_id: dto.employeeId ?? dto.employee_id,
      contractor_id: dto.contractorId ?? dto.contractor_id,
      badge_number: dto.badgeNumber ?? dto.badge_number,
      preferred_language: dto.preferredLanguage ?? dto.preferred_language,
      timezone: dto.timezone,
      worker_type: dto.workerType ?? dto.worker_type ?? 'Employee',
      employer_type: dto.employerType ?? dto.employer_type ?? 'Company employee',
      contractor_company_name: dto.contractorCompanyName ?? dto.contractor_company_name,
      vendor_company_name: dto.vendorCompanyName ?? dto.vendor_company_name,
      department_id: dto.departmentId ?? dto.department_id,
      department_name: dto.departmentName ?? dto.department_name,
      job_title: dto.jobTitle ?? dto.job_title,
      employment_status: dto.employmentStatus ?? dto.employment_status ?? 'Pending onboarding',
      start_date: dto.startDate ?? dto.start_date,
      end_date: dto.endDate ?? dto.end_date,
      contract_expiry_date: dto.contractExpiryDate ?? dto.contract_expiry_date,
      supervisor_user_id: dto.supervisorUserId ?? dto.supervisor_user_id,
      line_manager_user_id: dto.lineManagerUserId ?? dto.line_manager_user_id,
      work_schedule_foundation: dto.workScheduleFoundation ?? dto.work_schedule_foundation,
      shift_team_foundation: dto.shiftTeamFoundation ?? dto.shift_team_foundation,
      safety_critical_role: dto.safetyCriticalRole ?? dto.safety_critical_role ?? false,
      app_access_required: dto.appAccessRequired ?? dto.app_access_required ?? false,
      training_status: dto.trainingStatus ?? dto.training_status ?? 'Not Assessed',
      certification_status: dto.certificationStatus ?? dto.certification_status ?? 'Not Assessed',
      competency_status: dto.competencyStatus ?? dto.competency_status ?? 'Not Assessed',
      ptw_authorization_status: dto.ptwAuthorizationStatus ?? dto.ptw_authorization_status ?? 'Not Assessed',
      sop_acknowledgement_status: dto.sopAcknowledgementStatus ?? dto.sop_acknowledgement_status ?? 'Not Assessed',
      moc_training_status: dto.mocTrainingStatus ?? dto.moc_training_status ?? 'Not Assessed',
      pssr_training_readiness_status: dto.pssrTrainingReadinessStatus ?? dto.pssr_training_readiness_status ?? 'Not Assessed',
      review_status: dto.reviewStatus ?? dto.review_status ?? 'Not Reviewed',
      status,
      notes: dto.notes,
      created_by: create ? user.id : undefined,
      updated_by: user.id,
      updated_at: create ? undefined : new Date().toISOString()
    });
  }

  private rolePayload(user: RequestUser, workerId: string, dto: Row, create: boolean) {
    return this.compact({
      id: create ? randomUUID() : undefined,
      company_id: create ? user.tenantId : undefined,
      worker_id: create ? workerId : undefined,
      site_id: dto.siteId ?? dto.site_id,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      job_role: dto.jobRole ?? dto.job_role,
      competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id,
      required_training_profile_id: dto.requiredTrainingProfileId ?? dto.required_training_profile_id,
      safety_critical: dto.safetyCritical ?? dto.safety_critical ?? false,
      ptw_role_candidate: dto.ptwRoleCandidate ?? dto.ptw_role_candidate ?? false,
      operations_role: dto.operationsRole ?? dto.operations_role ?? false,
      maintenance_role: dto.maintenanceRole ?? dto.maintenance_role ?? false,
      hse_role: dto.hseRole ?? dto.hse_role ?? false,
      engineering_role: dto.engineeringRole ?? dto.engineering_role ?? false,
      contractor_role: dto.contractorRole ?? dto.contractor_role ?? false,
      ptw_role_candidates_json: dto.ptwRoleCandidates ?? dto.ptw_role_candidates_json ?? [],
      role_status: dto.roleStatus ?? dto.role_status ?? 'Active',
      effective_date: dto.effectiveDate ?? dto.effective_date,
      expiry_date: dto.expiryDate ?? dto.expiry_date,
      notes: dto.notes,
      created_by: create ? user.id : undefined,
      updated_by: user.id,
      updated_at: create ? undefined : new Date().toISOString()
    });
  }

  private async createInitialChildren(user: RequestUser, worker: Row, dto: Row) {
    if (dto.assignment || dto.primarySiteId || dto.primary_site_id) {
      await this.addAssignment(user, worker.id, { ...(dto.assignment ?? {}), siteId: dto.primarySiteId ?? dto.primary_site_id, primaryAssignment: true }).catch(() => null);
    }
    if (dto.roleAssignment || dto.jobRole) {
      await this.addRoleAssignment(user, worker.id, { ...(dto.roleAssignment ?? {}), jobRole: dto.jobRole ?? dto.job_title, safetyCritical: dto.safetyCriticalRole ?? dto.safety_critical_role }).catch(() => null);
    }
    if (dto.linkedUserId || dto.linked_user_id) {
      await this.linkAccount(user, worker.id, { userId: dto.linkedUserId ?? dto.linked_user_id, appAccessRequired: dto.appAccessRequired ?? dto.app_access_required }).catch(() => null);
    }
  }

  private async assertWorker(user: RequestUser, workerId: string) {
    const worker = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single());
    if (!worker) throw new NotFoundException('Worker profile was not found.');
    if (worker.primary_site_id) this.assertSiteAccess(user, worker.primary_site_id);
    return worker;
  }

  private async assertAssignment(user: RequestUser, workerId: string, assignmentId: string) {
    const assignment = await this.db.single<Row>(this.db.from('training_worker_site_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', assignmentId).single());
    if (!assignment) throw new NotFoundException('Worker assignment was not found.');
    this.assertSiteAccess(user, assignment.site_id);
    return assignment;
  }

  private async assertRoleAssignment(user: RequestUser, workerId: string, roleAssignmentId: string) {
    const role = await this.db.single<Row>(this.db.from('training_worker_role_assignments').select('*').eq('company_id', user.tenantId).eq('worker_id', workerId).eq('id', roleAssignmentId).single());
    if (!role) throw new NotFoundException('Worker role assignment was not found.');
    if (role.site_id) this.assertSiteAccess(user, role.site_id);
    return role;
  }

  private async unlinkExistingLinks(user: RequestUser, workerId: string, reason: string) {
    await this.db.many(this.db.from('training_worker_account_links').update({ link_status: 'Unlinked', unlinked_by: user.id, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('company_id', user.tenantId).eq('worker_id', workerId).is('unlinked_at', null).select('id')).catch(() => []);
  }

  private async writeHistory(user: RequestUser, worker: Row, eventType: string, title: string, before: Row | null, after: Row | null) {
    const history = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: worker?.primary_site_id ?? after?.site_id ?? null,
      unit_id: after?.unit_id ?? null,
      area_id: after?.area_id ?? null,
      worker_id: worker?.id ?? after?.worker_id ?? null,
      event_type: eventType,
      event_title: title,
      event_description: title,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: user.id,
      source_module: 'Training & Competency',
      source_record_id: after?.id ?? worker?.id ?? null
    };
    await this.db.single(this.db.from('training_worker_history_events').insert(history).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingWorker', entityId: worker?.id ?? after?.worker_id ?? after?.id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null);
  }

  private summaryFromRows(rows: Row[]) {
    return {
      totalWorkers: rows.length,
      activeWorkers: rows.filter((row) => row.employment_status === 'Active' && !row.archived_at).length,
      employees: rows.filter((row) => row.worker_type === 'Employee').length,
      contractors: rows.filter((row) => row.worker_type === 'Contractor').length,
      vendors: rows.filter((row) => row.worker_type === 'Vendor').length,
      trainees: rows.filter((row) => row.worker_type === 'Trainee').length,
      visitors: rows.filter((row) => row.worker_type === 'Visitor').length,
      inactiveArchived: rows.filter((row) => row.archived_at || ['Inactive', 'Archived', 'Left company', 'Contract expired'].includes(row.employment_status)).length,
      missingSiteAssignment: rows.filter((row) => !row.primary_site_id).length,
      missingRoleAssignment: rows.filter((row) => !row.job_title && !row.current_role_assignment?.job_role).length,
      trainingComplete: rows.filter((row) => row.training_status === 'Complete').length,
      trainingIncomplete: rows.filter((row) => ['Incomplete', 'Not Assessed', 'Blocked'].includes(row.training_status)).length,
      trainingOverdue: rows.filter((row) => row.training_status === 'Overdue').length,
      certificationExpiring: rows.filter((row) => row.certification_status === 'Expiring Soon').length,
      pendingReview: rows.filter((row) => row.review_status === 'Pending Review').length,
      blockedFromSafetyCriticalWork: rows.filter((row) => row.safety_critical_role && row.training_status !== 'Complete').length
    };
  }

  private workerProfileSummary(worker: Row, assignments: Row[], roles: Row[], accountLink: Row | null, documents: Row[]) {
    return {
      workerName: worker.display_name,
      workerType: worker.worker_type,
      employer: worker.contractor_company_name ?? worker.vendor_company_name ?? worker.employer_type,
      primarySite: worker.primary_site_id,
      primaryUnit: assignments.find((row) => row.primary_assignment)?.unit_id ?? assignments[0]?.unit_id ?? null,
      jobTitle: worker.job_title ?? roles[0]?.job_role ?? null,
      department: worker.department_name ?? worker.department_id,
      trainingStatus: worker.training_status,
      certificationStatus: worker.certification_status,
      ptwAuthorizationStatus: worker.ptw_authorization_status,
      sopAcknowledgementStatus: worker.sop_acknowledgement_status ?? 'Not Assessed',
      mocTrainingStatus: worker.moc_training_status ?? 'Not Assessed',
      pssrTrainingReadiness: worker.pssr_training_readiness_status ?? 'Not Assessed',
      safetyCriticalRole: worker.safety_critical_role,
      reviewStatus: worker.review_status,
      accountLinkStatus: accountLink?.link_status ?? 'Not Linked',
      workerStatus: worker.status,
      documentsLinked: documents.length
    };
  }

  private trainingSummaryPayload(worker: Row) {
    return {
      trainingStatus: worker.training_status ?? 'Not Assessed',
      certificationStatus: worker.certification_status ?? 'Not Assessed',
      competencyStatus: worker.competency_status ?? 'Not Assessed',
      ptwAuthorizationStatus: worker.ptw_authorization_status ?? 'Not Assessed',
      sopAcknowledgementStatus: worker.sop_acknowledgement_status ?? 'Not Assessed',
      mocTrainingStatus: worker.moc_training_status ?? 'Not Assessed',
      pssrTrainingReadinessStatus: worker.pssr_training_readiness_status ?? 'Not Assessed',
      message: 'Phase 1 stores calculated foundation statuses only. Later phases will calculate from training matrix, records, certificates, assessments, SOP acknowledgements, MOC/PSSR readiness, and PTW authorization logic.',
      emptyStates: {
        trainingRecords: 'No Training Records phase data exists yet.',
        certifications: 'No Certifications phase data exists yet.',
        ptwAuthorization: 'PTW Role Authorization enforcement is a later phase.',
        sopAcknowledgements: 'SOP Acknowledgement records are a later phase.',
        mocPssrReadiness: 'MOC/PSSR readiness is displayed when linked systems provide records.'
      }
    };
  }

  private workerTabs(workerId: string) {
    return ['Overview', 'Identity', 'Employment / Contractor Details', 'Site / Unit / Area Assignments', 'Job Roles / Competency Foundation', 'Training Summary', 'Certifications Summary', 'PTW Authorization Foundation', 'SOP Acknowledgement Foundation', 'MOC / PSSR Training Readiness', 'Documents', 'Linked User Account', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/training-competency/workforce/${workerId}`, enabled: true }));
  }

  private applyInMemoryFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.display_name, row.work_email, row.employee_id, row.contractor_id, row.badge_number].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.workerType) result = result.filter((row) => row.worker_type === query.workerType);
    if (query.employerType) result = result.filter((row) => row.employer_type === query.employerType);
    if (query.employmentStatus) result = result.filter((row) => row.employment_status === query.employmentStatus);
    if (query.trainingStatus) result = result.filter((row) => row.training_status === query.trainingStatus);
    if (query.certificationStatus) result = result.filter((row) => row.certification_status === query.certificationStatus);
    if (query.ptwAuthorizationStatus) result = result.filter((row) => row.ptw_authorization_status === query.ptwAuthorizationStatus);
    if (query.reviewStatus) result = result.filter((row) => row.review_status === query.reviewStatus);
    if (query.contractorCompany) result = result.filter((row) => row.contractor_company_name === query.contractorCompany);
    if (query.missingAssignment === 'true') result = result.filter((row) => !row.primary_site_id);
    if (query.missingRole === 'true') result = result.filter((row) => !row.job_title && !row.current_role_assignment?.job_role);
    if (query.safetyCriticalGap === 'true') result = result.filter((row) => row.safety_critical_role && row.training_status !== 'Complete');
    if (query.unitId) result = result.filter((row) => row.assignments?.some((assignment: Row) => assignment.unit_id === query.unitId));
    if (query.areaId) result = result.filter((row) => row.assignments?.some((assignment: Row) => assignment.area_id === query.areaId));
    return result;
  }

  private sortRows(rows: Row[], sort: string) {
    const [field, direction] = sort.split('.');
    const key = field || 'updated_at';
    return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction === 'asc' ? 1 : -1));
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

  private scopeAssignments(user: RequestUser, req: any, query: Row = {}) {
    if (query.siteId) return req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    return this.siteScopedBase(user, req, 'site_id');
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private countBy(rows: Row[], field: string) {
    return Object.entries(this.groupBy(rows, field)).map(([label, items]) => ({ label: label === 'null' ? 'Missing' : label, count: items.length }));
  }

  private groupBy(rows: Row[], field: string) {
    return rows.reduce<Record<string, Row[]>>((acc, row) => {
      const key = String(row[field] ?? 'null');
      acc[key] = [...(acc[key] ?? []), row];
      return acc;
    }, {});
  }

  private percent(part: number, total: number) {
    return total ? Math.round((part / total) * 100) : 0;
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

  private allLookups(): Record<string, string[]> {
    return {
      'worker-types': workerTypes,
      'employer-types': employerTypes,
      'employment-statuses': employmentStatuses,
      'assignment-statuses': assignmentStatuses,
      'job-roles': jobRoles,
      'ptw-role-candidates': ptwRoleCandidates,
      'training-statuses': trainingStatuses,
      'certification-statuses': certificationStatuses,
      'competency-statuses': competencyStatuses,
      'ptw-authorization-statuses': ptwStatuses,
      'worker-document-types': workerDocumentTypes,
      'review-statuses': reviewStatuses,
      'worker-statuses': workerStatuses,
      'training-categories': ['Site Induction', 'Contractor Onboarding', 'Process Safety Management', 'Chemical / SDS Awareness', 'Process Chemistry', 'Safe Operating Limits', 'SOP / Procedure', 'PTW', 'LOTO / Isolation', 'Hot Work', 'Confined Space', 'Work at Height', 'Excavation', 'Lifting', 'Electrical Safety', 'Gas Testing', 'Emergency Response', 'Fire Safety', 'Environmental', 'Mechanical Integrity', 'Equipment-Specific', 'HAZOP / Risk Awareness', 'MOC Training', 'PSSR / Startup Readiness', 'Security / General Compliance', 'Other'],
      'requirement-sources': ['Company Policy', 'Site Policy', 'Unit Requirement', 'Job Role', 'Competency Profile', 'Worker Type', 'Contractor Requirement', 'PTW Role', 'SOP', 'PSI Chemical Hazard', 'PSI Safe Operating Limit', 'PSI Safeguard', 'PSI Electrical Classification', 'PSI Material Compatibility', 'MOC', 'PSSR', 'HAZOP Recommendation', 'Incident Lesson Learned', 'Audit Finding', 'Manual'],
      'applicability-scopes': ['Company', 'Site', 'Department', 'Unit', 'Area', 'Equipment', 'Worker', 'Worker type', 'Job role', 'Competency profile', 'Contractor company', 'PTW role', 'SOP', 'MOC', 'PSSR', 'PSI hazard', 'Custom rule'],
      'matrix-cell-statuses': ['Required - Complete', 'Required - Missing', 'Required - Overdue', 'Required - Expiring Soon', 'Required - Pending Verification', 'Required - Waived', 'Required - Not Applicable', 'Optional', 'Not Required', 'Blocked', 'Unknown / Not Evaluated'],
      'matrix-gap-types': ['Missing Required Training', 'Overdue Training', 'Expiring Training', 'Missing Evidence', 'Pending Verification', 'Failed Assessment', 'Missing Certificate', 'Expired Certificate', 'SOP Acknowledgement Missing', 'PTW Authorization Blocker', 'MOC Training Blocker', 'PSSR Training Blocker', 'Safety-Critical Training Gap', 'Contractor Onboarding Gap', 'Site Induction Missing', 'Unknown / Needs Review'],
      'matrix-gap-statuses': ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Evidence', 'Waiting Verification', 'Waiting Approval', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Closed', 'Reopened', 'Cancelled'],
      'matrix-gap-severities': ['Info', 'Low', 'Medium', 'High', 'Critical', 'Work Blocker', 'Startup Blocker'],
      'evidence-types': ['Training attendance record', 'Certificate', 'Assessment score', 'Quiz pass', 'SOP acknowledgement', 'Practical assessment', 'Supervisor sign-off', 'HSE approval', 'External document', 'LMS import', 'Manual verification', 'Other'],
      'matrix-run-statuses': ['Queued', 'Running', 'Completed', 'Completed With Warnings', 'Failed', 'Cancelled'],
      'waiver-statuses': ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed']
      ,
      'competency-profile-types': ['Job Role Profile', 'Competency Profile', 'PTW Role Profile', 'Safety-Critical Role Profile', 'Contractor Role Profile', 'Equipment-Specific Profile', 'Unit-Specific Profile', 'Emergency Response Profile', 'Supervisor / Approver Profile', 'Custom'],
      'competency-categories': ['Process Safety Fundamentals', 'Site Induction', 'Unit / Area Familiarity', 'Equipment Operation', 'Chemical / SDS Awareness', 'Process Chemistry Awareness', 'Safe Operating Limits', 'Alarm / Interlock Response', 'Safeguards / Controls', 'PTW', 'LOTO / Isolation', 'Gas Testing', 'Confined Space', 'Hot Work', 'Work at Height', 'Excavation', 'Lifting', 'Electrical Safety', 'Emergency Response', 'Fire Safety', 'Mechanical Integrity', 'Environmental', 'SOP / Procedure', 'MOC Awareness', 'PSSR / Startup Readiness', 'HAZOP / Risk Awareness', 'Supervisor / Approver Competency', 'Other'],
      'competency-levels': ['Awareness', 'Basic', 'Working Knowledge', 'Competent', 'Advanced', 'Authorized', 'Supervisor', 'Approver', 'Assessor', 'Expert'],
      'task-types': ['Normal operation', 'Startup', 'Shutdown', 'Emergency shutdown', 'Line break', 'Confined space', 'Hot work', 'Gas testing', 'Isolation / LOTO', 'Electrical work', 'Chemical handling', 'Sampling', 'Maintenance', 'Inspection', 'Lifting', 'Excavation', 'Emergency response', 'Permit approval', 'Field supervision', 'Control room operation', 'Other'],
      'profile-statuses': ['Draft', 'Active', 'Inactive', 'Approved', 'Locked', 'Archived', 'Superseded'],
      'profile-assignment-statuses': ['Active', 'Pending', 'Expired', 'Superseded', 'Removed', 'Needs Review'],
      'profile-version-types': ['Initial version', 'Minor edit', 'Major revision', 'MOC-driven update', 'SOP-driven update', 'PSI-driven update', 'PTW authorization update', 'Regulatory/company standard update', 'Reapproval version'],
      'competency-gap-types': ['Missing Competency Profile', 'Missing Competency Requirement', 'Missing Training Evidence', 'Missing Certificate', 'Missing Assessment', 'Missing SOP Acknowledgement', 'Pending Verification', 'Failed Assessment', 'Expired Competency', 'Expired Profile Assignment', 'Safety-Critical Competency Gap', 'PTW Competency Blocker', 'MOC Competency Blocker', 'PSSR Competency Blocker', 'Outdated Profile Version', 'Unknown / Needs Review'],
      'competency-gap-statuses': ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Evidence', 'Waiting Assessment', 'Waiting Verification', 'Waiting Approval', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Closed', 'Reopened', 'Cancelled'],
      'competency-gap-severities': ['Info', 'Low', 'Medium', 'High', 'Critical', 'Work Blocker', 'Startup Blocker']
    };
  }
}
