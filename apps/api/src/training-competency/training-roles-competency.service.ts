import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

export const competencyProfileTypes = ['Job Role Profile', 'Competency Profile', 'PTW Role Profile', 'Safety-Critical Role Profile', 'Contractor Role Profile', 'Equipment-Specific Profile', 'Unit-Specific Profile', 'Emergency Response Profile', 'Supervisor / Approver Profile', 'Custom'];
export const competencyCategories = ['Process Safety Fundamentals', 'Site Induction', 'Unit / Area Familiarity', 'Equipment Operation', 'Chemical / SDS Awareness', 'Process Chemistry Awareness', 'Safe Operating Limits', 'Alarm / Interlock Response', 'Safeguards / Controls', 'PTW', 'LOTO / Isolation', 'Gas Testing', 'Confined Space', 'Hot Work', 'Work at Height', 'Excavation', 'Lifting', 'Electrical Safety', 'Emergency Response', 'Fire Safety', 'Mechanical Integrity', 'Environmental', 'SOP / Procedure', 'MOC Awareness', 'PSSR / Startup Readiness', 'HAZOP / Risk Awareness', 'Supervisor / Approver Competency', 'Other'];
export const competencyLevels = ['Awareness', 'Basic', 'Working Knowledge', 'Competent', 'Advanced', 'Authorized', 'Supervisor', 'Approver', 'Assessor', 'Expert'];
export const competencyStatuses = ['Not Assessed', 'Competent', 'Competent With Restrictions', 'Partially Competent', 'Not Competent', 'Expired', 'Pending Verification', 'Pending Assessment', 'Missing Evidence', 'Waived', 'Blocked', 'Not Applicable'];
export const taskTypes = ['Normal operation', 'Startup', 'Shutdown', 'Emergency shutdown', 'Line break', 'Confined space', 'Hot work', 'Gas testing', 'Isolation / LOTO', 'Electrical work', 'Chemical handling', 'Sampling', 'Maintenance', 'Inspection', 'Lifting', 'Excavation', 'Emergency response', 'Permit approval', 'Field supervision', 'Control room operation', 'Other'];
export const evidenceTypes = ['Training record', 'Certificate', 'Assessment / quiz result', 'Practical demonstration', 'Supervisor sign-off', 'HSE sign-off', 'SOP acknowledgement', 'External certificate', 'LMS import', 'Vendor training document', 'Document Control evidence', 'Manual verification', 'Other'];
export const profileStatuses = ['Draft', 'Active', 'Inactive', 'Approved', 'Locked', 'Archived', 'Superseded'];
export const assignmentStatuses = ['Active', 'Pending', 'Expired', 'Superseded', 'Removed', 'Needs Review'];
export const versionTypes = ['Initial version', 'Minor edit', 'Major revision', 'MOC-driven update', 'SOP-driven update', 'PSI-driven update', 'PTW authorization update', 'Regulatory/company standard update', 'Reapproval version'];
export const gapTypes = ['Missing Competency Profile', 'Missing Competency Requirement', 'Missing Training Evidence', 'Missing Certificate', 'Missing Assessment', 'Missing SOP Acknowledgement', 'Pending Verification', 'Failed Assessment', 'Expired Competency', 'Expired Profile Assignment', 'Safety-Critical Competency Gap', 'PTW Competency Blocker', 'MOC Competency Blocker', 'PSSR Competency Blocker', 'Outdated Profile Version', 'Unknown / Needs Review'];
export const gapStatuses = ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Evidence', 'Waiting Assessment', 'Waiting Verification', 'Waiting Approval', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Closed', 'Reopened', 'Cancelled'];
export const gapSeverities = ['Info', 'Low', 'Medium', 'High', 'Critical', 'Work Blocker', 'Startup Blocker'];

@Injectable()
export class TrainingRolesCompetencyService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, bySite, byUnit, byRole, gaps, profiles, runs, history] = await Promise.all([
      this.dashboardSummary(user, query),
      this.dashboardBySite(user, query),
      this.dashboardByUnit(user, query),
      this.dashboardByRole(user, query),
      this.gaps(user, { ...query, safetyCritical: 'true', limit: 8 }),
      this.profiles(user, { ...query, reviewStatus: 'Pending Review', limit: 8 }),
      this.evaluationRuns(user, { limit: 8 }),
      this.history(user, { limit: 8 })
    ]);
    return { header: { title: 'Roles & Competency Profiles', subtitle: 'Role-based competency standards, assignments, evaluations, blockers, and matrix sync status.', lastUpdated: new Date().toISOString() }, summary, bySite, byUnit, byRole, safetyCriticalGapsPreview: gaps.rows, profilesPendingApproval: profiles.rows, recentCompetencyEvaluations: runs.rows, recentProfileChanges: history.rows };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [profiles, requirements, assignments, workers, evaluations, gaps] = await Promise.all([this.profileRows(user, query), this.requirementRows(user, query), this.assignmentRows(user, query), this.workerRows(user, query), this.evaluationRows(user, query), this.gapRows(user, query)]);
    const assignedWorkerIds = new Set(assignments.filter((row) => row.assignment_status === 'Active').map((row) => row.worker_id));
    return {
      totalCompetencyProfiles: profiles.length,
      activeProfiles: profiles.filter((row) => row.profile_status === 'Active').length,
      draftProfiles: profiles.filter((row) => row.profile_status === 'Draft').length,
      approvedProfiles: profiles.filter((row) => ['Approved', 'Locked'].includes(row.profile_status)).length,
      profilesPendingReview: profiles.filter((row) => row.review_status === 'Pending Review').length,
      profilesReviewOverdue: profiles.filter((row) => row.next_review_due && new Date(row.next_review_due) < new Date() && row.review_status !== 'Approved').length,
      workersAssignedToProfiles: assignedWorkerIds.size,
      workersMissingProfile: workers.filter((worker) => !assignedWorkerIds.has(worker.id)).length,
      competencyRequirements: requirements.length,
      safetyCriticalCompetencies: requirements.filter((row) => row.safety_critical).length,
      psmCriticalCompetencies: requirements.filter((row) => row.psm_critical).length,
      ptwCriticalCompetencies: requirements.filter((row) => row.ptw_critical).length,
      competentWorkers: this.workerStatusCount(evaluations, 'Competent'),
      partiallyCompetentWorkers: this.workerStatusCount(evaluations, 'Partially Competent'),
      notCompetentWorkers: this.workerStatusCount(evaluations, 'Not Competent'),
      pendingAssessment: evaluations.filter((row) => row.competency_status === 'Pending Assessment').length,
      expiredCompetency: evaluations.filter((row) => row.competency_status === 'Expired').length,
      competencyGaps: gaps.filter((row) => !['Resolved', 'Verified', 'Closed', 'Cancelled'].includes(row.gap_status)).length,
      safetyCriticalCompetencyGaps: gaps.filter((row) => row.safety_critical_work_blocker || row.gap_type === 'Safety-Critical Competency Gap').length,
      profilesRequiringMatrixUpdate: profiles.filter((row) => row.matrix_sync_status === 'Sync Required').length
    };
  }

  async dashboardBySite(user: RequestUser, query: Row = {}) {
    return this.aggregateBy('site_id', await this.evaluationRows(user, query));
  }

  async dashboardByUnit(user: RequestUser, query: Row = {}) {
    return this.aggregateBy('unit_id', await this.assignmentRows(user, query));
  }

  async dashboardByRole(user: RequestUser, query: Row = {}) {
    return this.aggregateBy('job_role', await this.profileRows(user, query));
  }

  async profiles(user: RequestUser, query: Row = {}) {
    const rows = this.filterProfiles(await this.profileRows(user, query), query);
    const requirements = await this.requirementRows(user, query);
    const assignments = await this.assignmentRows(user, query);
    const enriched = rows.map((profile) => ({
      ...profile,
      competency_count: requirements.filter((row) => row.profile_id === profile.id && !row.removed_at).length,
      safety_critical_count: requirements.filter((row) => row.profile_id === profile.id && row.safety_critical && !row.removed_at).length,
      assigned_workers: assignments.filter((row) => row.profile_id === profile.id && row.assignment_status === 'Active').length,
      actions: this.profileActions(profile)
    }));
    return this.paginate(enriched, query);
  }

  async profile(user: RequestUser, profileId: string) {
    const profile = await this.assertProfile(user, profileId);
    const [scopes, duties, requirements, assignments, evaluations, gaps, versions, matrixLinks] = await Promise.all([
      this.safeMany<Row>(this.db.from('training_competency_profile_scopes').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).order('created_at')),
      this.duties(user, profileId),
      this.requirements(user, profileId),
      this.assignments(user, { profileId, limit: 200 }),
      this.evaluations(user, { profileId, limit: 200 }),
      this.gaps(user, { profileId, limit: 200 }),
      this.versionHistory(user, profileId),
      this.safeMany<Row>(this.db.from('training_competency_matrix_links').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).order('created_at', { ascending: false }))
    ]);
    return { profile, scopes, duties, requirements, assignments: assignments.rows, evaluations: evaluations.rows, gaps: gaps.rows, versions, matrixLinks, tabs: this.profileTabs(profileId) };
  }

  async createProfile(user: RequestUser, dto: Row) {
    this.validateProfile(user, dto, true);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').insert(this.profilePayload(user, dto, true)).select().single()), 'Competency profile was not returned by the database.');
    await this.createInitialVersion(user, row, 'Initial version', null, row);
    await this.writeHistory(user, 'Created', 'Competency profile created', null, row, { profile_id: row.id, site_id: row.site_id });
    if (dto.scopes?.length) await this.replaceScopes(user, row.id, dto.scopes);
    if (dto.duties?.length) for (const duty of dto.duties) await this.createDuty(user, row.id, duty);
    if (dto.requirements?.length) for (const requirement of dto.requirements) await this.createRequirement(user, row.id, requirement);
    return this.profile(user, row.id);
  }

  async updateProfile(user: RequestUser, profileId: string, dto: Row) {
    const before = await this.assertProfile(user, profileId);
    if (['Approved', 'Locked'].includes(before.profile_status) && !dto.newVersionReason) throw new BadRequestException('Approved/locked competency profiles require a controlled new-version workflow for major edits.');
    this.validateProfile(user, { ...before, ...dto }, false);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update(this.profilePayload(user, dto, false)).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Updated competency profile was not returned by the database.');
    await this.writeHistory(user, 'Updated', 'Competency profile updated', before, row, { profile_id: row.id, site_id: row.site_id });
    if (Array.isArray(dto.scopes)) await this.replaceScopes(user, row.id, dto.scopes);
    return this.profile(user, row.id);
  }

  async archiveProfile(user: RequestUser, profileId: string, dto: Row) {
    this.requireText(dto.reason, 'Archive reason is required.');
    const before = await this.assertProfile(user, profileId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ profile_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Archived competency profile was not returned by the database.');
    await this.writeHistory(user, 'Archived', 'Competency profile archived', before, row, { profile_id: row.id, site_id: row.site_id });
    return row;
  }

  async setProfileActive(user: RequestUser, profileId: string, active: boolean) {
    const before = await this.assertProfile(user, profileId);
    const target = active ? 'Active' : 'Inactive';
    if (active) await this.validateProfileReady(user, profileId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ profile_status: target, matrix_sync_status: active ? 'Sync Required' : before.matrix_sync_status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Profile status change was not returned by the database.');
    await this.writeHistory(user, active ? 'Activated' : 'Deactivated', active ? 'Competency profile activated' : 'Competency profile deactivated', before, row, { profile_id: row.id, site_id: row.site_id });
    if (active) await this.evaluate(user, { profileId, runScope: 'Profile', triggeredByType: 'Profile activated' });
    return this.profile(user, profileId);
  }

  async newVersion(user: RequestUser, profileId: string, dto: Row) {
    const before = await this.assertProfile(user, profileId);
    this.requireText(dto.changeSummary, 'Change summary is required.');
    const version = String(dto.version ?? this.nextVersion(before.version));
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ version, profile_status: 'Draft', review_status: 'Not Submitted', matrix_sync_status: 'Sync Required', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'New profile version was not returned by the database.');
    await this.createInitialVersion(user, row, dto.versionType ?? 'Major revision', before, row, dto.changeSummary);
    await this.writeHistory(user, 'Version Created', 'New competency profile version created', before, row, { profile_id: row.id, site_id: row.site_id });
    return this.profile(user, profileId);
  }

  async submitReview(user: RequestUser, profileId: string, dto: Row = {}) {
    await this.validateProfileReady(user, profileId);
    const before = await this.assertProfile(user, profileId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ review_status: 'Pending Review', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Review submission was not returned by the database.');
    await this.writeHistory(user, 'Submitted', 'Competency profile submitted for review', before, row, { profile_id: row.id, reason: dto.reason ?? null });
    return row;
  }

  async approveProfile(user: RequestUser, profileId: string, dto: Row = {}) {
    const before = await this.assertProfile(user, profileId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ profile_status: 'Approved', review_status: 'Approved', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Approved profile was not returned by the database.');
    await this.db.many(this.db.from('training_competency_profile_versions').update({ version_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('profile_id', profileId).eq('version', row.version).select('id')).catch(() => []);
    await this.writeHistory(user, 'Approved', 'Competency profile approved and locked', before, row, { profile_id: row.id, reason: dto.reason ?? null });
    return row;
  }

  async duties(user: RequestUser, profileId: string) {
    await this.assertProfile(user, profileId);
    return this.safeMany<Row>(this.db.from('training_role_duties').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).is('removed_at', null).order('created_at'));
  }

  async createDuty(user: RequestUser, profileId: string, dto: Row) {
    const profile = await this.assertProfileEditable(user, profileId);
    this.requireText(dto.dutyTitle ?? dto.duty_title, 'Role duty title is required.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_role_duties').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id, profile_id: profileId, duty_title: dto.dutyTitle ?? dto.duty_title, duty_description: dto.dutyDescription ?? dto.duty_description ?? null, task_type: dto.taskType ?? dto.task_type ?? 'Other', safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical), psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical), ptw_critical: Boolean(dto.ptwCritical ?? dto.ptw_critical), requires_authorization: Boolean(dto.requiresAuthorization ?? dto.requires_authorization), unit_id: dto.unitId ?? dto.unit_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, equipment_id: dto.equipmentId ?? dto.equipment_id ?? null, related_hazard: dto.relatedHazard ?? dto.related_hazard ?? null, related_sop_id: dto.relatedSopId ?? dto.related_sop_id ?? null, related_psi_module: dto.relatedPsiModule ?? dto.related_psi_module ?? null, related_psi_record_id: dto.relatedPsiRecordId ?? dto.related_psi_record_id ?? null, related_ptw_type: dto.relatedPtwType ?? dto.related_ptw_type ?? null, related_emergency_response_duty: dto.relatedEmergencyResponseDuty ?? dto.related_emergency_response_duty ?? null, minimum_supervision_requirement: dto.minimumSupervisionRequirement ?? dto.minimum_supervision_requirement ?? null, notes: dto.notes ?? null, created_by: user.id, updated_by: user.id }).select().single()), 'Role duty was not returned by the database.');
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Created', 'Role duty created', null, row, { profile_id: profileId, duty_id: row.id });
    return row;
  }

  async updateDuty(user: RequestUser, profileId: string, dutyId: string, dto: Row) {
    await this.assertProfileEditable(user, profileId);
    const before = await this.assertDuty(user, profileId, dutyId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_role_duties').update({ duty_title: dto.dutyTitle ?? dto.duty_title ?? before.duty_title, duty_description: dto.dutyDescription ?? dto.duty_description ?? before.duty_description, task_type: dto.taskType ?? dto.task_type ?? before.task_type, safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical ?? before.safety_critical), psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical ?? before.psm_critical), ptw_critical: Boolean(dto.ptwCritical ?? dto.ptw_critical ?? before.ptw_critical), requires_authorization: Boolean(dto.requiresAuthorization ?? dto.requires_authorization ?? before.requires_authorization), notes: dto.notes ?? before.notes, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', dutyId).select().single()), 'Updated duty was not returned by the database.');
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Updated', 'Role duty updated', before, row, { profile_id: profileId, duty_id: dutyId });
    return row;
  }

  async removeDuty(user: RequestUser, profileId: string, dutyId: string, dto: Row = {}) {
    await this.assertProfileEditable(user, profileId);
    const before = await this.assertDuty(user, profileId, dutyId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_role_duties').update({ removed_at: new Date().toISOString(), removed_by: user.id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', dutyId).select().single()), 'Removed duty was not returned by the database.');
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Deleted', 'Role duty removed', before, row, { profile_id: profileId, reason: dto.reason ?? null });
    return row;
  }

  async requirements(user: RequestUser, profileId: string): Promise<Row[]> {
    await this.assertProfile(user, profileId);
    const rows = await this.safeMany<Row>(this.db.from('training_competency_requirements').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).is('removed_at', null).order('created_at'));
    const rules = await this.safeMany<Row>(this.db.from('training_competency_evidence_rules').select('*').eq('company_id', user.tenantId).in('competency_requirement_id', rows.map((row) => row.id).length ? rows.map((row) => row.id) : ['__none__']));
    return rows.map((row) => ({ ...row, evidence_rule: rules.find((rule) => rule.competency_requirement_id === row.id) ?? null })) as Row[];
  }

  async createRequirement(user: RequestUser, profileId: string, dto: Row) {
    const profile = await this.assertProfileEditable(user, profileId);
    this.validateRequirement(dto);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_requirements').insert(this.requirementPayload(user, profile, dto)).select().single()), 'Competency requirement was not returned by the database.');
    await this.upsertEvidenceRule(user, profile, row.id, dto.evidenceRule ?? dto.evidence_rule ?? dto);
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Created', 'Competency requirement created', null, row, { profile_id: profileId, requirement_id: row.id });
    return row;
  }

  async updateRequirement(user: RequestUser, profileId: string, requirementId: string, dto: Row) {
    const profile = await this.assertProfileEditable(user, profileId);
    const before = await this.assertRequirement(user, profileId, requirementId);
    this.validateRequirement({ ...before, ...dto });
    const payload = this.compact({ ...this.requirementPayload(user, profile, dto), created_by: undefined, created_at: undefined });
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_requirements').update(payload).eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', requirementId).select().single()), 'Updated competency requirement was not returned by the database.');
    if (dto.evidenceRule || dto.evidence_rule) await this.upsertEvidenceRule(user, profile, row.id, dto.evidenceRule ?? dto.evidence_rule);
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Updated', 'Competency requirement updated', before, row, { profile_id: profileId, requirement_id: requirementId });
    return row;
  }

  async removeRequirement(user: RequestUser, profileId: string, requirementId: string, dto: Row = {}) {
    await this.assertProfileEditable(user, profileId);
    const before = await this.assertRequirement(user, profileId, requirementId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_requirements').update({ removed_at: new Date().toISOString(), removed_by: user.id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', requirementId).select().single()), 'Removed requirement was not returned by the database.');
    await this.markMatrixSyncRequired(user, profileId);
    await this.writeHistory(user, 'Deleted', 'Competency requirement removed', before, row, { profile_id: profileId, reason: dto.reason ?? null });
    return row;
  }

  async competencyLibrary(user: RequestUser, query: Row = {}) {
    let rows = await this.competencyRows(user, query);
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.competency_name, row.competency_code, row.category].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.category) rows = rows.filter((row) => row.category === query.category);
    if (query.active) rows = rows.filter((row) => String(row.active) === String(query.active));
    return this.paginate(rows, query);
  }

  async competency(user: RequestUser, competencyId: string) {
    return this.assertCompetency(user, competencyId);
  }

  async createCompetency(user: RequestUser, dto: Row) {
    this.requireText(dto.competencyCode ?? dto.competency_code, 'Competency code is required.');
    this.requireText(dto.competencyName ?? dto.competency_name, 'Competency name is required.');
    this.requireText(dto.category, 'Competency category is required.');
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competencies').insert({ id: randomUUID(), company_id: user.tenantId, site_id: siteId, competency_code: dto.competencyCode ?? dto.competency_code, competency_name: dto.competencyName ?? dto.competency_name, category: dto.category, description: dto.description ?? null, default_required_level: dto.defaultRequiredLevel ?? dto.default_required_level ?? 'Competent', default_evidence_rule_json: dto.defaultEvidenceRuleJson ?? dto.default_evidence_rule_json ?? null, safety_critical_default: Boolean(dto.safetyCriticalDefault ?? dto.safety_critical_default), psm_critical_default: Boolean(dto.psmCriticalDefault ?? dto.psm_critical_default), ptw_critical_default: Boolean(dto.ptwCriticalDefault ?? dto.ptw_critical_default), renewal_interval_days_default: dto.renewalIntervalDaysDefault ?? dto.renewal_interval_days_default ?? null, linked_training_reference_id: dto.linkedTrainingReferenceId ?? dto.linked_training_reference_id ?? null, linked_sop_id: dto.linkedSopId ?? dto.linked_sop_id ?? null, active: dto.active !== false, created_by: user.id, updated_by: user.id }).select().single()), 'Competency was not returned by the database.');
    await this.writeHistory(user, 'Created', 'Reusable competency created', null, row, { competency_id: row.id, site_id: row.site_id });
    return row;
  }

  async updateCompetency(user: RequestUser, competencyId: string, dto: Row) {
    const before = await this.assertCompetency(user, competencyId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competencies').update(this.compact({ competency_code: dto.competencyCode ?? dto.competency_code, competency_name: dto.competencyName ?? dto.competency_name, category: dto.category, description: dto.description, default_required_level: dto.defaultRequiredLevel ?? dto.default_required_level, default_evidence_rule_json: dto.defaultEvidenceRuleJson ?? dto.default_evidence_rule_json, safety_critical_default: dto.safetyCriticalDefault ?? dto.safety_critical_default, psm_critical_default: dto.psmCriticalDefault ?? dto.psm_critical_default, ptw_critical_default: dto.ptwCriticalDefault ?? dto.ptw_critical_default, renewal_interval_days_default: dto.renewalIntervalDaysDefault ?? dto.renewal_interval_days_default, active: dto.active, updated_by: user.id, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', competencyId).select().single()), 'Updated competency was not returned by the database.');
    await this.writeHistory(user, 'Updated', 'Reusable competency updated', before, row, { competency_id: competencyId });
    return row;
  }

  async archiveCompetency(user: RequestUser, competencyId: string, dto: Row = {}) {
    const before = await this.assertCompetency(user, competencyId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competencies').update({ active: false, archived_at: new Date().toISOString(), archived_by: user.id, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', competencyId).select().single()), 'Archived competency was not returned by the database.');
    await this.writeHistory(user, 'Archived', 'Reusable competency archived', before, row, { competency_id: competencyId, reason: dto.reason ?? null });
    return row;
  }

  async assignments(user: RequestUser, query: Row = {}) {
    const rows = this.filterAssignments(await this.assignmentRows(user, query), query);
    return this.paginate(rows, query);
  }

  async assignProfile(user: RequestUser, dto: Row) {
    const workerId = dto.workerId ?? dto.worker_id;
    const profileId = dto.profileId ?? dto.profile_id;
    this.requireText(workerId, 'Worker is required.');
    this.requireText(profileId, 'Competency profile is required.');
    const [worker, profile] = await Promise.all([this.assertWorker(user, workerId), this.assertProfile(user, profileId)]);
    if (profile.site_id && worker.primary_site_id && profile.site_id !== worker.primary_site_id) throw new ForbiddenException('Worker and competency profile must belong to the same allowed site scope.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_competency_profile_assignments').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id ?? worker.primary_site_id ?? null, worker_id: workerId, profile_id: profileId, profile_version: profile.version, unit_id: dto.unitId ?? dto.unit_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, assignment_source: dto.assignmentSource ?? dto.assignment_source ?? 'Manual assignment', assignment_reason: dto.assignmentReason ?? dto.assignment_reason ?? null, primary_profile: Boolean(dto.primaryProfile ?? dto.primary_profile), effective_date: dto.effectiveDate ?? dto.effective_date ?? null, expiry_date: dto.expiryDate ?? dto.expiry_date ?? null, assignment_status: dto.assignmentStatus ?? dto.assignment_status ?? 'Active', assigned_by: user.id, assigned_at: new Date().toISOString(), notes: dto.notes ?? null }).select().single()), 'Profile assignment was not returned by the database.');
    await this.writeHistory(user, 'Assigned', 'Competency profile assigned to worker', null, row, { worker_id: workerId, profile_id: profileId });
    await this.evaluate(user, { workerId, profileId, runScope: 'Worker', triggeredByType: 'Profile assigned' });
    return row;
  }

  async removeAssignment(user: RequestUser, assignmentId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Remove reason is required.');
    const before = await this.assertAssignment(user, assignmentId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_worker_competency_profile_assignments').update({ assignment_status: 'Removed', removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq('company_id', user.tenantId).eq('id', assignmentId).select().single()), 'Removed assignment was not returned by the database.');
    await this.writeHistory(user, 'Unassigned', 'Competency profile assignment removed', before, row, { worker_id: row.worker_id, profile_id: row.profile_id });
    return row;
  }

  async evaluate(user: RequestUser, dto: Row = {}) {
    const runScope = dto.runScope ?? dto.run_scope ?? (dto.workerId ? 'Worker' : dto.profileId ? 'Profile' : dto.siteId ? 'Site' : dto.unitId ? 'Unit' : 'Company');
    if (runScope === 'Company' && !this.scope(user).corporateView) throw new ForbiddenException('Company-wide competency evaluation requires elevated company permission.');
    if (dto.siteId) this.assertSiteAccess(user, dto.siteId);
    const run = this.must(await this.db.single<Row>(this.db.from('training_competency_evaluation_runs').insert({ id: randomUUID(), company_id: user.tenantId, site_id: dto.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null, run_scope: runScope, scope_record_id: dto.workerId ?? dto.profileId ?? dto.siteId ?? dto.unitId ?? null, triggered_by_type: dto.triggeredByType ?? dto.triggered_by_type ?? 'Manual run', triggered_by_user_id: user.id, triggered_by_module: dto.triggeredByModule ?? dto.triggered_by_module ?? 'Training & Competency', triggered_by_record_id: dto.triggeredByRecordId ?? dto.triggered_by_record_id ?? null, status: 'Running', started_at: new Date().toISOString() }).select().single()), 'Competency evaluation run was not returned by the database.');
    try {
      const assignments = await this.evaluationAssignments(user, dto);
      let gapsCreated = 0;
      for (const assignment of assignments) {
        const requirements = await this.requirements(user, assignment.profile_id);
        for (const requirement of requirements) {
          const evaluation = await this.createEvaluation(user, assignment, requirement, run.id);
          const gap = await this.upsertGap(user, assignment, requirement, evaluation);
          if (gap.created) gapsCreated += 1;
        }
      }
      const completed = this.must(await this.db.single<Row>(this.db.from('training_competency_evaluation_runs').update({ status: assignments.length ? 'Completed' : 'Completed With Warnings', completed_at: new Date().toISOString(), total_workers: new Set(assignments.map((row) => row.worker_id)).size, evaluated_workers: new Set(assignments.map((row) => row.worker_id)).size, total_profiles: new Set(assignments.map((row) => row.profile_id)).size, evaluated_profiles: new Set(assignments.map((row) => row.profile_id)).size, gaps_created: gapsCreated, warnings_count: assignments.length ? 0 : 1, result_summary_json: { message: assignments.length ? 'Competency evaluation completed from real profile assignments.' : 'No active competency profile assignments found for this scope.' }, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', run.id).select().single()), 'Completed competency run was not returned by the database.');
      await this.writeHistory(user, 'Calculated', 'Competency evaluation completed', null, completed, { run_id: run.id, site_id: completed.site_id });
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown competency evaluation error';
      const failed = await this.db.single<Row>(this.db.from('training_competency_evaluation_runs').update({ status: 'Failed', completed_at: new Date().toISOString(), errors_count: 1, error_message: message, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', run.id).select().single()).catch(() => run);
      await this.writeHistory(user, 'Failed', 'Competency evaluation failed', null, failed, { run_id: run.id });
      throw new BadRequestException(`Competency evaluation failed: ${message}`);
    }
  }

  async evaluations(user: RequestUser, query: Row = {}) {
    return this.paginate(await this.evaluationRows(user, query), query);
  }

  async evaluationRuns(user: RequestUser, query: Row = {}) {
    return this.paginate(await this.runRows(user, query), query);
  }

  async runDetail(user: RequestUser, runId: string) {
    const run = await this.db.single<Row>(this.db.from('training_competency_evaluation_runs').select('*').eq('company_id', user.tenantId).eq('id', runId).single());
    if (!run) throw new NotFoundException('Competency evaluation run was not found.');
    if (run.site_id) this.assertSiteAccess(user, run.site_id);
    return run;
  }

  async gaps(user: RequestUser, query: Row = {}) {
    return this.paginate(this.filterGaps(await this.gapRows(user, query), query), query);
  }

  async gap(user: RequestUser, gapId: string) {
    const gap = await this.db.single<Row>(this.db.from('training_competency_gaps').select('*').eq('company_id', user.tenantId).eq('id', gapId).single());
    if (!gap) throw new NotFoundException('Competency gap was not found.');
    if (gap.site_id) this.assertSiteAccess(user, gap.site_id);
    return gap;
  }

  async updateGap(user: RequestUser, gapId: string, dto: Row) {
    const before = await this.gap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_gaps').update(this.compact({ gap_status: dto.gapStatus ?? dto.gap_status, gap_severity: dto.gapSeverity ?? dto.gap_severity, owner_user_id: dto.ownerUserId ?? dto.owner_user_id, supervisor_user_id: dto.supervisorUserId ?? dto.supervisor_user_id, due_date: dto.dueDate ?? dto.due_date, recommended_action: dto.recommendedAction ?? dto.recommended_action, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Updated gap was not returned by the database.');
    await this.writeHistory(user, 'Updated', 'Competency gap updated', before, row, { gap_id: gapId });
    return row;
  }

  async assignGap(user: RequestUser, gapId: string, dto: Row) {
    this.requireText(dto.ownerUserId ?? dto.owner_user_id, 'Gap owner is required.');
    return this.updateGap(user, gapId, { ...dto, gapStatus: 'Assigned' });
  }

  async createGapAction(user: RequestUser, gapId: string, dto: Row = {}) {
    const before = await this.gap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_gaps').update({ gap_status: 'Action Created', action_id: dto.actionId ?? `pending-action:${randomUUID()}`, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Gap action link was not returned by the database.');
    await this.writeHistory(user, 'Action Created', 'Competency gap action linked through Action Engine adapter', before, row, { gap_id: gapId, adapter_status: 'Pending Universal Action Engine record' });
    return row;
  }

  async markGapResolved(user: RequestUser, gapId: string, dto: Row = {}) {
    this.requireText(dto.closureNote ?? dto.closure_note, 'Closure note is required.');
    const before = await this.gap(user, gapId);
    if ((before.safety_critical_work_blocker || before.ptw_blocker || before.moc_blocker || before.pssr_blocker) && !dto.evidenceDocumentId && before.gap_status !== 'Waived') throw new BadRequestException('Safety-critical/blocking competency gaps require evidence or approved waiver before closure.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_gaps').update({ gap_status: 'Resolved', resolved_at: new Date().toISOString(), resolved_by: user.id, closure_note: dto.closureNote ?? dto.closure_note, evidence_found: dto.evidenceFound ?? dto.evidence_found ?? before.evidence_found, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Resolved gap was not returned by the database.');
    await this.writeHistory(user, 'Resolved', 'Competency gap resolved', before, row, { gap_id: gapId });
    return row;
  }

  async verifyGap(user: RequestUser, gapId: string, dto: Row = {}) {
    const before = await this.gap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_gaps').update({ gap_status: 'Verified', verified_at: new Date().toISOString(), verified_by: user.id, closure_note: dto.closureNote ?? dto.closure_note ?? before.closure_note, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Verified gap was not returned by the database.');
    await this.writeHistory(user, 'Verified', 'Competency gap closure verified', before, row, { gap_id: gapId });
    return row;
  }

  async reopenGap(user: RequestUser, gapId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.gap(user, gapId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_gaps').update({ gap_status: 'Reopened', resolved_at: null, resolved_by: null, verified_at: null, verified_by: null, closure_note: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', gapId).select().single()), 'Reopened gap was not returned by the database.');
    await this.writeHistory(user, 'Reopened', 'Competency gap reopened', before, row, { gap_id: gapId, reason: dto.reason });
    return row;
  }

  async syncToMatrix(user: RequestUser, profileId: string) {
    const profile = await this.assertProfile(user, profileId);
    const requirements = await this.requirements(user, profileId);
    let linked = 0;
    for (const requirement of requirements.filter((row) => row.safety_critical || row.psm_critical || row.ptw_critical)) {
      const rule = await this.db.single<Row>(this.db.from('training_matrix_rules').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id, rule_code: `${profile.profile_code}-${requirement.competency_code ?? requirement.id}`.slice(0, 120), rule_title: requirement.competency_title, training_reference_id: requirement.linked_training_reference_id, training_code: requirement.competency_code, training_title: requirement.competency_title, training_category: requirement.competency_category, requirement_source: 'Competency Profile', applicability_scope: 'Competency profile', applicability_condition_json: { profile_id: profileId, competency_requirement_id: requirement.id }, worker_type_filter: profile.worker_type, employer_type_filter: profile.employer_type, contractor_company_filter: profile.contractor_company_name, department_id: profile.department_id, job_role_filter: profile.job_role, competency_profile_id: profileId, mandatory: requirement.mandatory, safety_critical: requirement.safety_critical, psm_critical: requirement.psm_critical, recurring: requirement.recurring, recurrence_interval_days: requirement.renewal_interval_days, expiry_warning_days: requirement.expiry_warning_days, grace_period_days: requirement.grace_period_days, evidence_required: requirement.evidence_required, verification_required: requirement.verification_required, blocks_ptw_authorization: requirement.ptw_critical, blocks_moc_implementation: Boolean(requirement.psm_critical), blocks_pssr_startup: Boolean(requirement.psm_critical), blocks_safety_critical_work: Boolean(requirement.safety_critical), waiver_allowed: true, rule_status: 'Active', active: true, notes: `Generated from competency profile ${profile.profile_code}`, created_by: user.id, updated_by: user.id }).select().single()).catch(() => null);
      if (rule?.id) {
        linked += 1;
        await this.db.single(this.db.from('training_competency_matrix_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id, profile_id: profileId, competency_requirement_id: requirement.id, matrix_rule_id: rule.id, sync_status: 'Synced', last_synced_at: new Date().toISOString(), sync_message: 'Training Matrix rule created from competency requirement.', created_by: user.id }).select('id').single()).catch(() => null);
      }
    }
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_profiles').update({ matrix_sync_status: linked ? 'Synced' : 'No Critical Requirements', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select().single()), 'Matrix sync status was not returned by the database.');
    await this.writeHistory(user, 'Synced', 'Competency profile synced to Training Matrix', profile, row, { profile_id: profileId, linked_rules: linked });
    return { profile: row, linkedMatrixRules: linked, status: row.matrix_sync_status };
  }

  async matrixSyncStatus(user: RequestUser, profileId: string) {
    const profile = await this.assertProfile(user, profileId);
    const links = await this.safeMany<Row>(this.db.from('training_competency_matrix_links').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).order('created_at', { ascending: false }));
    return { status: profile.matrix_sync_status ?? 'Not Synced', links, syncRequired: profile.matrix_sync_status === 'Sync Required' };
  }

  async previewMatrixImpact(user: RequestUser, profileId: string) {
    const profile = await this.assertProfile(user, profileId);
    const requirements = await this.requirements(user, profileId);
    const workers = (await this.assignmentRows(user, { profileId })).filter((row) => row.assignment_status === 'Active');
    const criticalRequirements = requirements.filter((row) => row.safety_critical || row.psm_critical || row.ptw_critical);
    return { profileId, profileCode: profile.profile_code, affectedWorkers: workers.length, criticalRequirements: criticalRequirements.length, matrixRulesToCreateOrUpdate: criticalRequirements.length, blockingImpact: this.blockingImpact(criticalRequirements) };
  }

  async workerCompetencyProfile(user: RequestUser, workerId: string) {
    const worker = await this.assertWorker(user, workerId);
    const [assignments, evaluations, gaps] = await Promise.all([this.assignments(user, { workerId, limit: 200 }), this.evaluations(user, { workerId, limit: 300 }), this.gaps(user, { workerId, limit: 200 })]);
    return { worker, assignments: assignments.rows, evaluations: evaluations.rows, gaps: gaps.rows, summary: this.workerCompetencySummary(evaluations.rows, gaps.rows) };
  }

  async versionHistory(user: RequestUser, profileId: string) {
    await this.assertProfile(user, profileId);
    return this.safeMany<Row>(this.db.from('training_competency_profile_versions').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).order('created_at', { ascending: false }));
  }

  async history(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_competency_history_events').select('*').eq('company_id', user.tenantId).order('created_at', { ascending: false });
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.profileId) req = req.eq('profile_id', query.profileId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.paginate(await this.safeMany<Row>(req), query);
  }

  async settings(user: RequestUser) {
    const siteId = user.selectedSiteId ?? user.activeSiteId ?? null;
    const existing = await this.db.single<Row>(this.db.from('training_competency_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId).maybeSingle()).catch(() => null);
    if (existing) return existing;
    return this.must(await this.db.single<Row>(this.db.from('training_competency_settings').insert({ id: randomUUID(), company_id: user.tenantId, site_id: siteId, updated_by: user.id }).select().single()), 'Competency settings were not returned by the database.');
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const before = await this.settings(user);
    const row = this.must(await this.db.single<Row>(this.db.from('training_competency_settings').update(this.compact({ default_profile_review_frequency_days: dto.defaultProfileReviewFrequencyDays ?? dto.default_profile_review_frequency_days, auto_assign_profiles_on_worker_change: dto.autoAssignProfilesOnWorkerChange ?? dto.auto_assign_profiles_on_worker_change, auto_sync_profiles_to_matrix: dto.autoSyncProfilesToMatrix ?? dto.auto_sync_profiles_to_matrix, auto_evaluate_on_profile_change: dto.autoEvaluateOnProfileChange ?? dto.auto_evaluate_on_profile_change, auto_create_actions_for_critical_gaps: dto.autoCreateActionsForCriticalGaps ?? dto.auto_create_actions_for_critical_gaps, auto_notify_workers: dto.autoNotifyWorkers ?? dto.auto_notify_workers, auto_notify_supervisors: dto.autoNotifySupervisors ?? dto.auto_notify_supervisors, block_ptw_on_competency_gap: dto.blockPtwOnCompetencyGap ?? dto.block_ptw_on_competency_gap, block_moc_on_competency_gap: dto.blockMocOnCompetencyGap ?? dto.block_moc_on_competency_gap, block_pssr_on_competency_gap: dto.blockPssrOnCompetencyGap ?? dto.block_pssr_on_competency_gap, allow_safety_critical_waivers: dto.allowSafetyCriticalWaivers ?? dto.allow_safety_critical_waivers, require_esign_for_blocker_waiver: dto.requireEsignForBlockerWaiver ?? dto.require_esign_for_blocker_waiver, require_review_for_safety_critical_profiles: dto.requireReviewForSafetyCriticalProfiles ?? dto.require_review_for_safety_critical_profiles, settings_json: dto.settingsJson ?? dto.settings_json, updated_by: user.id, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', before.id).select().single()), 'Updated competency settings were not returned by the database.');
    await this.writeHistory(user, 'Updated', 'Competency settings updated', before, row, { site_id: row.site_id });
    return row;
  }

  lookup(lookup: string) {
    return this.allLookups()[lookup] ?? [];
  }

  private async profileRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competency_profiles').select('*').eq('company_id', user.tenantId).order('updated_at', { ascending: false });
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async requirementRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competency_requirements').select('*').eq('company_id', user.tenantId).is('removed_at', null);
    if (query.profileId) req = req.eq('profile_id', query.profileId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async competencyRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competencies').select('*').eq('company_id', user.tenantId).order('competency_name');
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async assignmentRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_worker_competency_profile_assignments').select('*').eq('company_id', user.tenantId).order('assigned_at', { ascending: false });
    if (query.profileId) req = req.eq('profile_id', query.profileId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async evaluationRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competency_evaluations').select('*').eq('company_id', user.tenantId).order('evaluated_at', { ascending: false });
    if (query.profileId) req = req.eq('profile_id', query.profileId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async gapRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competency_gaps').select('*').eq('company_id', user.tenantId).order('last_detected_at', { ascending: false });
    if (query.profileId) req = req.eq('profile_id', query.profileId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async runRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_competency_evaluation_runs').select('*').eq('company_id', user.tenantId).order('created_at', { ascending: false });
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req);
  }

  private async workerRows(user: RequestUser, query: Row) {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId).order('display_name');
    if (query.siteId) req = req.eq('primary_site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'primary_site_id', true);
    return this.safeMany<Row>(req);
  }

  private async assertProfile(user: RequestUser, profileId: string) {
    const profile = await this.db.single<Row>(this.db.from('training_competency_profiles').select('*').eq('company_id', user.tenantId).eq('id', profileId).single());
    if (!profile) throw new NotFoundException('Competency profile was not found.');
    if (profile.site_id) this.assertSiteAccess(user, profile.site_id);
    return profile;
  }

  private async assertProfileEditable(user: RequestUser, profileId: string) {
    const profile = await this.assertProfile(user, profileId);
    if (['Approved', 'Locked'].includes(profile.profile_status)) throw new BadRequestException('Approved/locked competency profiles are read-only. Create a new version first.');
    return profile;
  }

  private async assertDuty(user: RequestUser, profileId: string, dutyId: string) {
    const row = await this.db.single<Row>(this.db.from('training_role_duties').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', dutyId).single());
    if (!row) throw new NotFoundException('Role duty was not found.');
    return row;
  }

  private async assertRequirement(user: RequestUser, profileId: string, requirementId: string) {
    const row = await this.db.single<Row>(this.db.from('training_competency_requirements').select('*').eq('company_id', user.tenantId).eq('profile_id', profileId).eq('id', requirementId).single());
    if (!row) throw new NotFoundException('Competency requirement was not found.');
    return row;
  }

  private async assertCompetency(user: RequestUser, competencyId: string) {
    const row = await this.db.single<Row>(this.db.from('training_competencies').select('*').eq('company_id', user.tenantId).eq('id', competencyId).single());
    if (!row) throw new NotFoundException('Reusable competency was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertWorker(user: RequestUser, workerId: string) {
    const worker = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('company_id', user.tenantId).eq('id', workerId).single());
    if (!worker) throw new NotFoundException('Worker was not found.');
    if (worker.primary_site_id) this.assertSiteAccess(user, worker.primary_site_id);
    return worker;
  }

  private async assertAssignment(user: RequestUser, assignmentId: string) {
    const row = await this.db.single<Row>(this.db.from('training_worker_competency_profile_assignments').select('*').eq('company_id', user.tenantId).eq('id', assignmentId).single());
    if (!row) throw new NotFoundException('Competency profile assignment was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private validateProfile(user: RequestUser, dto: Row, create: boolean) {
    this.requireText(dto.profileName ?? dto.profile_name, 'Profile name is required.');
    this.requireText(dto.profileCode ?? dto.profile_code, 'Profile code is required.');
    this.requireText(dto.profileType ?? dto.profile_type, 'Profile type is required.');
    this.requireText(dto.version, 'Profile version is required.');
    const profileType = dto.profileType ?? dto.profile_type;
    if (profileType !== 'Custom') this.requireText(dto.jobRole ?? dto.job_role, 'Job role is required unless the profile type is Custom.');
    if ((dto.safetyCritical ?? dto.safety_critical) && !(dto.ownerUserId ?? dto.owner_user_id)) throw new BadRequestException('Owner is required for safety-critical profiles.');
    const siteId = dto.siteId ?? dto.site_id ?? (create ? user.selectedSiteId ?? user.activeSiteId ?? null : undefined);
    if (siteId) this.assertSiteAccess(user, siteId);
  }

  private validateRequirement(dto: Row) {
    this.requireText(dto.competencyTitle ?? dto.competency_title, 'Competency requirement title is required.');
    this.requireText(dto.competencyCategory ?? dto.competency_category, 'Competency category is required.');
    this.requireText(dto.requiredLevel ?? dto.required_level, 'Required level is required.');
    if ((dto.mandatory ?? true) && (dto.evidenceRequired ?? dto.evidence_required) === false) throw new BadRequestException('Mandatory competency requires an evidence rule.');
    if ((dto.safetyCritical ?? dto.safety_critical) && !(dto.verificationRequired ?? dto.verification_required)) throw new BadRequestException('Safety-critical competency requires verification rule.');
    if ((dto.recurring ?? dto.recurring) && !(dto.renewalIntervalDays ?? dto.renewal_interval_days)) throw new BadRequestException('Recurring competency requires renewal interval.');
    const blocking = Boolean(dto.blocksPtwAuthorization ?? dto.blocks_ptw_authorization ?? dto.blocksMocImplementation ?? dto.blocks_moc_implementation ?? dto.blocksPssrStartup ?? dto.blocks_pssr_startup);
    if (blocking && !(dto.safetyCritical ?? dto.safety_critical ?? dto.psmCritical ?? dto.psm_critical)) throw new BadRequestException('Blocking competency requires safety-critical or PSM-critical justification.');
  }

  private async validateProfileReady(user: RequestUser, profileId: string) {
    const [profile, requirements, duties] = await Promise.all([this.assertProfile(user, profileId), this.requirements(user, profileId), this.duties(user, profileId)]);
    const missing: string[] = [];
    if (!profile.profile_code) missing.push('Profile code');
    if (!profile.profile_name) missing.push('Profile name');
    if (!requirements.length) missing.push('Competency requirements');
    if (duties.some((duty) => duty.safety_critical) && !requirements.some((req) => req.safety_critical)) missing.push('Safety-critical competency requirement for safety-critical duty');
    if (missing.length) throw new BadRequestException(`Competency profile is not ready: ${missing.join(', ')}.`);
  }

  private profilePayload(user: RequestUser, dto: Row, create: boolean) {
    const base = this.compact({
      id: create ? randomUUID() : undefined,
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? (create ? user.selectedSiteId ?? user.activeSiteId ?? null : undefined),
      profile_code: dto.profileCode ?? dto.profile_code,
      profile_name: dto.profileName ?? dto.profile_name,
      profile_type: dto.profileType ?? dto.profile_type,
      description: dto.description,
      job_role: dto.jobRole ?? dto.job_role,
      department_id: dto.departmentId ?? dto.department_id,
      worker_type: dto.workerType ?? dto.worker_type,
      employer_type: dto.employerType ?? dto.employer_type,
      contractor_company_name: dto.contractorCompanyName ?? dto.contractor_company_name,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      version: dto.version,
      profile_status: dto.profileStatus ?? dto.profile_status ?? (create ? 'Draft' : undefined),
      review_status: dto.reviewStatus ?? dto.review_status ?? (create ? 'Not Submitted' : undefined),
      matrix_sync_status: dto.matrixSyncStatus ?? dto.matrix_sync_status ?? (create ? 'Not Synced' : 'Sync Required'),
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      safety_critical: dto.safetyCritical ?? dto.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical,
      ptw_critical: dto.ptwCritical ?? dto.ptw_critical,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    if (create) return { ...base, created_by: user.id };
    return base;
  }

  private requirementPayload(user: RequestUser, profile: Row, dto: Row) {
    return {
      id: dto.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: profile.site_id,
      profile_id: profile.id,
      competency_id: dto.competencyId ?? dto.competency_id ?? null,
      competency_code: dto.competencyCode ?? dto.competency_code ?? null,
      competency_title: dto.competencyTitle ?? dto.competency_title,
      competency_category: dto.competencyCategory ?? dto.competency_category,
      competency_description: dto.competencyDescription ?? dto.competency_description ?? null,
      required_level: dto.requiredLevel ?? dto.required_level,
      mandatory: dto.mandatory !== false,
      safety_critical: Boolean(dto.safetyCritical ?? dto.safety_critical),
      psm_critical: Boolean(dto.psmCritical ?? dto.psm_critical),
      ptw_critical: Boolean(dto.ptwCritical ?? dto.ptw_critical),
      recurring: Boolean(dto.recurring),
      renewal_interval_days: dto.renewalIntervalDays ?? dto.renewal_interval_days ?? null,
      evidence_required: dto.evidenceRequired ?? dto.evidence_required ?? true,
      verification_required: Boolean(dto.verificationRequired ?? dto.verification_required),
      assessment_required: Boolean(dto.assessmentRequired ?? dto.assessment_required),
      certificate_required: Boolean(dto.certificateRequired ?? dto.certificate_required),
      sop_acknowledgement_required: Boolean(dto.sopAcknowledgementRequired ?? dto.sop_acknowledgement_required),
      practical_demonstration_required: Boolean(dto.practicalDemonstrationRequired ?? dto.practical_demonstration_required),
      supervisor_signoff_required: Boolean(dto.supervisorSignoffRequired ?? dto.supervisor_signoff_required),
      hse_signoff_required: Boolean(dto.hseSignoffRequired ?? dto.hse_signoff_required),
      minimum_passing_score: dto.minimumPassingScore ?? dto.minimum_passing_score ?? null,
      grace_period_days: dto.gracePeriodDays ?? dto.grace_period_days ?? null,
      expiry_warning_days: dto.expiryWarningDays ?? dto.expiry_warning_days ?? null,
      linked_training_reference_id: dto.linkedTrainingReferenceId ?? dto.linked_training_reference_id ?? null,
      linked_sop_id: dto.linkedSopId ?? dto.linked_sop_id ?? null,
      linked_psi_module: dto.linkedPsiModule ?? dto.linked_psi_module ?? null,
      linked_psi_record_id: dto.linkedPsiRecordId ?? dto.linked_psi_record_id ?? null,
      linked_ptw_role: dto.linkedPtwRole ?? dto.linked_ptw_role ?? null,
      notes: dto.notes ?? null,
      created_by: user.id,
      updated_by: user.id
    };
  }

  private async upsertEvidenceRule(user: RequestUser, profile: Row, requirementId: string, dto: Row = {}) {
    const existing = await this.db.single<Row>(this.db.from('training_competency_evidence_rules').select('*').eq('company_id', user.tenantId).eq('competency_requirement_id', requirementId).maybeSingle()).catch(() => null);
    const payload = {
      company_id: user.tenantId,
      site_id: profile.site_id,
      competency_requirement_id: requirementId,
      accepted_evidence_types_json: dto.acceptedEvidenceTypes ?? dto.accepted_evidence_types_json ?? ['Training record'],
      primary_evidence_type: dto.primaryEvidenceType ?? dto.primary_evidence_type ?? null,
      evidence_source_module: dto.evidenceSourceModule ?? dto.evidence_source_module ?? null,
      evidence_validity_days: dto.evidenceValidityDays ?? dto.evidence_validity_days ?? null,
      verification_workflow_required: Boolean(dto.verificationWorkflowRequired ?? dto.verification_workflow_required),
      reviewer_role: dto.reviewerRole ?? dto.reviewer_role ?? null,
      assessor_role: dto.assessorRole ?? dto.assessor_role ?? null,
      esign_required: Boolean(dto.esignRequired ?? dto.esign_required),
      minimum_score: dto.minimumScore ?? dto.minimum_score ?? null,
      retake_required_after_failure: Boolean(dto.retakeRequiredAfterFailure ?? dto.retake_required_after_failure),
      max_attempts: dto.maxAttempts ?? dto.max_attempts ?? null,
      evidence_document_required: Boolean(dto.evidenceDocumentRequired ?? dto.evidence_document_required),
      evidence_review_frequency_days: dto.evidenceReviewFrequencyDays ?? dto.evidence_review_frequency_days ?? null,
      notes: dto.evidenceNotes ?? dto.notes ?? null,
      updated_at: new Date().toISOString()
    };
    if (existing?.id) return this.db.single<Row>(this.db.from('training_competency_evidence_rules').update(payload).eq('id', existing.id).select().single());
    return this.db.single<Row>(this.db.from('training_competency_evidence_rules').insert({ id: randomUUID(), ...payload }).select().single());
  }

  private async replaceScopes(user: RequestUser, profileId: string, scopes: Row[]) {
    const profile = await this.assertProfileEditable(user, profileId);
    await this.db.many(this.db.from('training_competency_profile_scopes').delete().eq('company_id', user.tenantId).eq('profile_id', profileId).select('id')).catch(() => []);
    for (const scope of scopes) {
      const siteId = scope.siteScopeId ?? scope.site_scope_id ?? profile.site_id ?? null;
      if (siteId) this.assertSiteAccess(user, siteId);
      await this.db.single(this.db.from('training_competency_profile_scopes').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id, profile_id: profileId, scope_type: scope.scopeType ?? scope.scope_type ?? 'Site', site_scope_id: siteId, department_id: scope.departmentId ?? scope.department_id ?? null, unit_id: scope.unitId ?? scope.unit_id ?? null, area_id: scope.areaId ?? scope.area_id ?? null, equipment_id: scope.equipmentId ?? scope.equipment_id ?? null, worker_type_filter: scope.workerTypeFilter ?? scope.worker_type_filter ?? null, employer_type_filter: scope.employerTypeFilter ?? scope.employer_type_filter ?? null, contractor_company_filter: scope.contractorCompanyFilter ?? scope.contractor_company_filter ?? null, job_role_filter: scope.jobRoleFilter ?? scope.job_role_filter ?? null, ptw_role_filter: scope.ptwRoleFilter ?? scope.ptw_role_filter ?? null, safety_critical_filter: scope.safetyCriticalFilter ?? scope.safety_critical_filter ?? null, assignment_mode: scope.assignmentMode ?? scope.assignment_mode ?? 'Manual assignment', auto_assign: Boolean(scope.autoAssign ?? scope.auto_assign), applicability_rule_json: scope.applicabilityRuleJson ?? scope.applicability_rule_json ?? null }).select('id').single()).catch(() => null);
    }
    await this.markMatrixSyncRequired(user, profileId);
  }

  private async createInitialVersion(user: RequestUser, profile: Row, versionType: string, before: Row | null, after: Row, changeSummary?: string) {
    return this.db.single(this.db.from('training_competency_profile_versions').insert({ id: randomUUID(), company_id: user.tenantId, site_id: profile.site_id, profile_id: profile.id, version: profile.version, version_type: versionType, version_status: profile.profile_status === 'Approved' ? 'Approved' : 'Draft', change_summary: changeSummary ?? `${versionType} for ${profile.profile_code}`, before_value_json: before, after_value_json: after, diff_json: { source: 'backend-profile-versioning' }, created_by: user.id }).select('id').single()).catch(() => null);
  }

  private async evaluationAssignments(user: RequestUser, dto: Row) {
    let rows = await this.assignmentRows(user, { ...dto, limit: 10000 });
    rows = rows.filter((row) => row.assignment_status === 'Active');
    if (dto.profileId) rows = rows.filter((row) => row.profile_id === dto.profileId);
    if (dto.workerId) rows = rows.filter((row) => row.worker_id === dto.workerId);
    return rows;
  }

  private async createEvaluation(user: RequestUser, assignment: Row, requirement: Row, runId: string) {
    const status = requirement.evidence_required ? 'Missing Evidence' : 'Pending Verification';
    const severity = requirement.ptw_critical ? 'Work Blocker' : requirement.psm_critical || requirement.safety_critical ? 'Critical' : 'Medium';
    const payload = { id: randomUUID(), company_id: user.tenantId, site_id: assignment.site_id, worker_id: assignment.worker_id, profile_id: assignment.profile_id, competency_requirement_id: requirement.id, evaluation_run_id: runId, competency_status: status, evidence_status: requirement.evidence_required ? 'Missing Evidence' : 'Not Required', verification_status: requirement.verification_required ? 'Pending Verification' : 'Not Required', expiry_status: 'Not Determined', gap_status: status === 'Missing Evidence' ? 'Open' : 'Waiting Verification', gap_severity: severity, ptw_blocker: Boolean(requirement.ptw_critical), moc_blocker: Boolean(requirement.psm_critical), pssr_blocker: Boolean(requirement.psm_critical), safety_critical_work_blocker: Boolean(requirement.safety_critical), reason: requirement.evidence_required ? 'No real source evidence record was found for this competency requirement.' : 'Verification pending from configured evidence workflow.', recommended_action: this.recommendedAction(requirement), evaluated_at: new Date().toISOString() };
    return this.must(await this.db.single<Row>(this.db.from('training_competency_evaluations').insert(payload).select().single()), 'Competency evaluation was not returned by the database.');
  }

  private async upsertGap(user: RequestUser, assignment: Row, requirement: Row, evaluation: Row) {
    const existing = await this.db.single<Row>(this.db.from('training_competency_gaps').select('*').eq('company_id', user.tenantId).eq('worker_id', assignment.worker_id).eq('profile_id', assignment.profile_id).eq('competency_requirement_id', requirement.id).maybeSingle()).catch(() => null);
    const payload = { company_id: user.tenantId, site_id: assignment.site_id, worker_id: assignment.worker_id, profile_id: assignment.profile_id, competency_requirement_id: requirement.id, evaluation_id: evaluation.id, gap_title: `${requirement.competency_title} - ${evaluation.evidence_status}`, gap_type: requirement.ptw_critical ? 'PTW Competency Blocker' : requirement.safety_critical ? 'Safety-Critical Competency Gap' : requirement.certificate_required ? 'Missing Certificate' : requirement.assessment_required ? 'Missing Assessment' : 'Missing Training Evidence', gap_severity: evaluation.gap_severity, gap_status: evaluation.gap_status, site_scope_id: assignment.site_id, unit_id: assignment.unit_id, area_id: assignment.area_id, required_evidence: this.requiredEvidenceText(requirement), evidence_found: evaluation.evidence_status === 'Missing Evidence' ? null : evaluation.evidence_status, ptw_blocker: evaluation.ptw_blocker, moc_blocker: evaluation.moc_blocker, pssr_blocker: evaluation.pssr_blocker, safety_critical_work_blocker: evaluation.safety_critical_work_blocker, last_detected_at: new Date().toISOString(), recommended_action: evaluation.recommended_action, updated_at: new Date().toISOString() };
    if (existing?.id) {
      await this.db.single<Row>(this.db.from('training_competency_gaps').update(payload).eq('id', existing.id).select().single());
      return { created: false };
    }
    await this.db.single<Row>(this.db.from('training_competency_gaps').insert({ id: randomUUID(), ...payload, first_detected_at: new Date().toISOString() }).select().single());
    return { created: true };
  }

  private filterProfiles(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.profile_name, row.profile_code, row.job_role].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.profileStatus) result = result.filter((row) => row.profile_status === query.profileStatus);
    if (query.reviewStatus) result = result.filter((row) => row.review_status === query.reviewStatus);
    if (query.profileType) result = result.filter((row) => row.profile_type === query.profileType);
    if (query.jobRole) result = result.filter((row) => row.job_role === query.jobRole);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical);
    if (query.ptwCritical === 'true') result = result.filter((row) => row.ptw_critical);
    if (query.reviewOverdue === 'true') result = result.filter((row) => row.next_review_due && new Date(row.next_review_due) < new Date());
    return result;
  }

  private filterAssignments(rows: Row[], query: Row) {
    let result = rows;
    if (query.assignmentStatus) result = result.filter((row) => row.assignment_status === query.assignmentStatus);
    if (query.primaryProfile === 'true') result = result.filter((row) => row.primary_profile);
    return result;
  }

  private filterGaps(rows: Row[], query: Row) {
    let result = rows;
    if (query.gapStatus) result = result.filter((row) => row.gap_status === query.gapStatus);
    if (query.gapType) result = result.filter((row) => row.gap_type === query.gapType);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical_work_blocker);
    if (query.ptwCritical === 'true') result = result.filter((row) => row.ptw_blocker);
    if (query.mocBlocker === 'true') result = result.filter((row) => row.moc_blocker);
    if (query.pssrBlocker === 'true') result = result.filter((row) => row.pssr_blocker);
    return result;
  }

  private aggregateBy(field: string, rows: Row[]) {
    return Object.entries(this.groupBy(rows, field)).map(([label, items]) => ({ label: label === 'null' ? 'Missing' : label, total: items.length, competent: items.filter((row) => row.competency_status === 'Competent').length, missingEvidence: items.filter((row) => row.competency_status === 'Missing Evidence').length, blockers: items.filter((row) => row.ptw_blocker || row.moc_blocker || row.pssr_blocker || row.safety_critical_work_blocker).length, completionPercent: this.percent(items.filter((row) => row.competency_status === 'Competent').length, items.length) }));
  }

  private workerStatusCount(evaluations: Row[], status: string) {
    return new Set(evaluations.filter((row) => row.competency_status === status).map((row) => row.worker_id)).size;
  }

  private workerCompetencySummary(evaluations: Row[], gaps: Row[]) {
    return { totalEvaluations: evaluations.length, competent: evaluations.filter((row) => row.competency_status === 'Competent').length, missingEvidence: evaluations.filter((row) => row.competency_status === 'Missing Evidence').length, pendingVerification: evaluations.filter((row) => row.competency_status === 'Pending Verification').length, openGaps: gaps.filter((row) => !['Resolved', 'Verified', 'Closed', 'Cancelled'].includes(row.gap_status)).length, ptwBlockers: gaps.filter((row) => row.ptw_blocker).length, mocBlockers: gaps.filter((row) => row.moc_blocker).length, pssrBlockers: gaps.filter((row) => row.pssr_blocker).length };
  }

  private blockingImpact(rows: Row[]) {
    return { ptwBlockers: rows.filter((row) => row.ptw_critical || row.ptw_blocker).length, mocBlockers: rows.filter((row) => row.psm_critical || row.moc_blocker).length, pssrBlockers: rows.filter((row) => row.psm_critical || row.pssr_blocker).length, safetyCriticalWorkBlockers: rows.filter((row) => row.safety_critical || row.safety_critical_work_blocker).length };
  }

  private requiredEvidenceText(row: Row) {
    const parts = [];
    if (row.evidence_required) parts.push('Evidence');
    if (row.certificate_required) parts.push('Certificate');
    if (row.assessment_required) parts.push('Assessment');
    if (row.sop_acknowledgement_required) parts.push('SOP acknowledgement');
    if (row.practical_demonstration_required) parts.push('Practical demonstration');
    if (row.supervisor_signoff_required) parts.push('Supervisor sign-off');
    if (row.hse_signoff_required) parts.push('HSE sign-off');
    return parts.join(', ') || 'No evidence required';
  }

  private recommendedAction(requirement: Row) {
    if (requirement.certificate_required) return 'Upload or verify certificate evidence.';
    if (requirement.assessment_required) return 'Schedule assessment and verify result.';
    if (requirement.sop_acknowledgement_required) return 'Complete SOP acknowledgement.';
    if (requirement.verification_required) return 'Complete competency verification workflow.';
    return 'Provide traceable training evidence.';
  }

  private profileActions(profile: Row) {
    return {
      view: true,
      edit: !['Approved', 'Locked'].includes(profile.profile_status),
      newVersion: ['Approved', 'Locked'].includes(profile.profile_status),
      archive: !profile.archived_at,
      disabledReasons: ['Approved', 'Locked'].includes(profile.profile_status) ? { edit: 'Approved/locked profiles require New Version.' } : {}
    };
  }

  private profileTabs(profileId: string) {
    const base = `/training-competency/roles-competency-profiles/profiles/${profileId}`;
    return ['Overview', 'Scope', 'Role Duties', 'Competency Requirements', 'Workers', 'Evaluations', 'Matrix Sync', 'Review & Approval', 'Version History'].map((label) => ({ label, href: label === 'Overview' ? base : `${base}/${label === 'Role Duties' ? 'requirements' : label.toLowerCase().replaceAll(' & ', '-').replaceAll(' ', '-')}`, enabled: true }));
  }

  private nextVersion(version: string) {
    const parts = String(version ?? '1.0').split('.');
    const major = Number(parts[0] ?? 1);
    const minor = Number(parts[1] ?? 0) + 1;
    return `${Number.isFinite(major) ? major : 1}.${Number.isFinite(minor) ? minor : 1}`;
  }

  private markMatrixSyncRequired(user: RequestUser, profileId: string) {
    return this.db.single(this.db.from('training_competency_profiles').update({ matrix_sync_status: 'Sync Required', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', profileId).select('id').single()).catch(() => null);
  }

  private scope(user: RequestUser): Scope {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) };
  }

  private siteScopedBase(user: RequestUser, req: any, column = 'site_id', includeNull = false) {
    const scope = this.scope(user);
    if (scope.selectedSiteId) return includeNull ? req.or(`${column}.is.null,${column}.eq.${this.assertSiteAccess(user, scope.selectedSiteId)}`) : req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId));
    if (!scope.corporateView && scope.allowedSiteIds.length) return includeNull ? req.or(`${column}.is.null,${column}.in.(${scope.allowedSiteIds.join(',')})`) : req.in(column, scope.allowedSiteIds);
    if (!scope.corporateView) return includeNull ? req.is(column, null) : req.eq(column, '__no_site_access__');
    return req;
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }

  private paginate(rows: Row[], query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, lastUpdated: new Date().toISOString() };
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

  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, metadata: Row = {}) {
    const history = { id: randomUUID(), company_id: user.tenantId, site_id: metadata.site_id ?? after?.site_id ?? before?.site_id ?? null, unit_id: metadata.unit_id ?? after?.unit_id ?? null, area_id: metadata.area_id ?? after?.area_id ?? null, worker_id: metadata.worker_id ?? after?.worker_id ?? null, profile_id: metadata.profile_id ?? after?.profile_id ?? after?.id ?? null, competency_requirement_id: metadata.requirement_id ?? after?.competency_requirement_id ?? null, gap_id: metadata.gap_id ?? after?.gap_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before, after_value_json: after, actor_user_id: user.id, source_module: 'Training Roles & Competency Profiles', source_record_id: metadata.profile_id ?? metadata.gap_id ?? after?.id ?? null };
    await this.db.single(this.db.from('training_competency_history_events').insert(history).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.competency.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingCompetency', entityId: history.source_record_id, before: before as JsonValue, after: after as JsonValue, metadata: { ...metadata, title } as JsonValue }).catch(() => null);
  }

  private allLookups(): Record<string, string[]> {
    return {
      'competency-profile-types': competencyProfileTypes,
      'competency-categories': competencyCategories,
      'competency-levels': competencyLevels,
      'competency-statuses': competencyStatuses,
      'task-types': taskTypes,
      'evidence-types': evidenceTypes,
      'profile-statuses': profileStatuses,
      'profile-assignment-statuses': assignmentStatuses,
      'profile-version-types': versionTypes,
      'competency-gap-types': gapTypes,
      'competency-gap-statuses': gapStatuses,
      'competency-gap-severities': gapSeverities
    };
  }
}
