import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId: string | null; corporateView: boolean };

const certificateCategories = ['Required Training Certificate', 'External License', 'Regulatory Certificate', 'Operator Qualification', 'Permit Authorization Certificate', 'SOP Acknowledgement Evidence', 'Equipment / Unit Authorization', 'Emergency Response Certificate', 'Contractor Certificate', 'Other'];
const certificateStatuses = ['Draft', 'Current', 'Expiring Soon', 'Expired', 'Missing', 'Pending Verification', 'Rejected', 'Revoked', 'Superseded', 'Archived'];
const certificateVerificationStatuses = ['Not Required', 'Pending', 'Verified', 'Rejected', 'Needs Correction', 'Overridden'];
const assessmentTypes = ['Quiz', 'Written Assessment', 'Practical Assessment', 'Oral Assessment', 'Supervisor Evaluation', 'Field Demonstration', 'Simulation / Drill', 'Refresher Test', 'PTW Authorization Test', 'SOP Comprehension Check', 'Custom'];
const assessmentStatuses = ['Draft', 'Active', 'Inactive', 'Archived', 'Superseded', 'Pending Approval', 'Approved', 'Rejected'];
const questionTypes = ['Multiple Choice - Single Answer', 'Multiple Choice - Multiple Answer', 'True / False', 'Short Answer', 'Numeric Answer', 'Scenario Response', 'Practical Checklist Item', 'Assessor Observation', 'File Upload Evidence', 'Acknowledgement'];
const attemptStatuses = ['Assigned', 'Started', 'Submitted', 'Auto-Graded', 'Pending Manual Grading', 'Pending Verification', 'Passed', 'Failed', 'Rejected', 'Reopened', 'Expired', 'Cancelled'];
const assessmentResultStatuses = ['Pending', 'Passed', 'Failed', 'Pending Verification', 'Verified Passed', 'Verified Failed', 'Rejected', 'Expired', 'Superseded', 'Reopened'];

@Injectable()
export class TrainingCertAssessmentService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async certificationDashboard(user: RequestUser, query: Row = {}) {
    const [certificates, settings] = await Promise.all([this.scopedCertificates(user, query), this.settings(user, query)]);
    const current = certificates.filter((row) => this.certificateRuntimeStatus(row, settings) === 'Current').length;
    return {
      summary: {
        totalCertificates: certificates.length,
        current,
        expiringSoon: certificates.filter((row) => this.certificateRuntimeStatus(row, settings) === 'Expiring Soon').length,
        expired: certificates.filter((row) => this.certificateRuntimeStatus(row, settings) === 'Expired').length,
        missingRequired: certificates.filter((row) => row.certificate_status === 'Missing').length,
        pendingVerification: certificates.filter((row) => row.verification_status === 'Pending').length,
        rejected: certificates.filter((row) => row.certificate_status === 'Rejected').length,
        revoked: certificates.filter((row) => row.certificate_status === 'Revoked').length,
        safetyCritical: certificates.filter((row) => row.safety_critical).length,
        ptwCriticalGaps: certificates.filter((row) => row.ptw_critical && this.certificateRuntimeStatus(row, settings) !== 'Current').length,
        mocBlockers: certificates.filter((row) => row.moc_critical && this.certificateRuntimeStatus(row, settings) !== 'Current').length,
        pssrBlockers: certificates.filter((row) => row.pssr_critical && this.certificateRuntimeStatus(row, settings) !== 'Current').length,
        externalCertificates: certificates.filter((row) => row.external_provider).length,
        withoutEvidence: certificates.filter((row) => row.evidence_status === 'Missing').length,
        renewalsDue: certificates.filter((row) => ['Expiring Soon', 'Expired'].includes(this.certificateRuntimeStatus(row, settings))).length,
        overdueRenewals: certificates.filter((row) => this.certificateRuntimeStatus(row, settings) === 'Expired' && row.renewal_required).length,
        matrixGaps: certificates.filter((row) => row.matrix_gap_id).length,
        competencyGaps: certificates.filter((row) => row.competency_requirement_id).length
      },
      expiring: certificates.filter((row) => this.certificateRuntimeStatus(row, settings) === 'Expiring Soon').slice(0, 8),
      pendingVerification: certificates.filter((row) => row.verification_status === 'Pending').slice(0, 8),
      safetyCriticalGaps: certificates.filter((row) => row.safety_critical && this.certificateRuntimeStatus(row, settings) !== 'Current').slice(0, 8),
      settings,
      lastUpdated: new Date().toISOString()
    };
  }

  async certificationRegister(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyCertificateFilters(await this.scopedCertificates(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const settings = await this.settings(user, query);
    const rows = allRows.slice((page - 1) * limit, page * limit).map((row) => ({ ...row, runtime_status: this.certificateRuntimeStatus(row, settings) }));
    return { rows, total: allRows.length, page, limit, filters: this.lookups(), savedViews: ['All', 'Current', 'Expiring Soon', 'Expired', 'Missing', 'Pending Verification', 'Rejected', 'Safety-Critical'], summary: (await this.certificationDashboard(user, query)).summary };
  }

  async createCertificate(user: RequestUser, dto: Row) {
    this.requireText(dto.workerId, 'Worker is required.');
    this.requireText(dto.certificateTitle, 'Certificate title is required.');
    this.requireText(dto.certificateCategory, 'Certificate category is required.');
    const worker = await this.assertWorker(user, dto.workerId);
    if (dto.siteId) this.assertSiteAccess(user, dto.siteId);
    const settings = await this.settings(user, { siteId: dto.siteId ?? worker.primary_site_id });
    const row = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? worker.primary_site_id ?? null,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      worker_id: worker.id,
      certificate_title: String(dto.certificateTitle).trim(),
      certificate_code: dto.certificateCode ?? null,
      certificate_number: dto.certificateNumber ?? null,
      certificate_category: dto.certificateCategory,
      issuer_provider: dto.issuerProvider ?? null,
      external_provider: Boolean(dto.externalProvider),
      description: dto.description ?? null,
      notes: dto.notes ?? null,
      issue_date: dto.issueDate ?? null,
      effective_date: dto.effectiveDate ?? null,
      expiry_date: dto.expiryDate ?? null,
      no_expiry: Boolean(dto.noExpiry),
      renewal_required: Boolean(dto.renewalRequired),
      renewal_interval_days: this.numberOrNull(dto.renewalIntervalDays),
      expiry_warning_days: this.numberOrNull(dto.expiryWarningDays),
      grace_period_days: this.numberOrNull(dto.gracePeriodDays),
      certificate_status: dto.certificateStatus ?? 'Pending Verification',
      verification_status: dto.verificationStatus ?? 'Pending',
      evidence_status: dto.evidenceStatus ?? (settings.require_certificate_evidence ? 'Missing' : 'Not Required'),
      safety_critical: Boolean(dto.safetyCritical),
      psm_critical: Boolean(dto.psmCritical),
      ptw_critical: Boolean(dto.ptwCritical),
      moc_critical: Boolean(dto.mocCritical),
      pssr_critical: Boolean(dto.pssrCritical),
      training_item_id: dto.trainingItemId ?? null,
      training_item_version: dto.trainingItemVersion ?? null,
      completion_record_id: dto.completionRecordId ?? null,
      competency_profile_id: dto.competencyProfileId ?? null,
      competency_requirement_id: dto.competencyRequirementId ?? null,
      matrix_assignment_id: dto.matrixAssignmentId ?? null,
      matrix_gap_id: dto.matrixGapId ?? null,
      previous_certificate_id: dto.previousCertificateId ?? null,
      created_by: user.id,
      updated_by: user.id
    };
    const inserted = await this.db.single<Row>(this.db.from('training_certificates').insert(row).select().single(), 'Unable to create certificate.');
    await this.writeHistory(user, 'Created', 'Training certificate created', null, inserted, inserted);
    return inserted;
  }

  async certificateDetail(user: RequestUser, certificateId: string) {
    const certificate = await this.assertCertificate(user, certificateId);
    const [documents, renewals, history] = await Promise.all([
      this.safeMany(this.db.from('training_certificate_documents').select('*').eq('company_id', user.tenantId).eq('certificate_id', certificateId).is('removed_at', null)),
      this.safeMany(this.db.from('training_certificate_renewals').select('*').eq('company_id', user.tenantId).or(`old_certificate_id.eq.${certificateId},new_certificate_id.eq.${certificateId}`)),
      this.safeMany(this.db.from('training_cert_assessment_history_events').select('*').eq('company_id', user.tenantId).eq('certificate_id', certificateId).order('created_at', { ascending: false }).limit(50))
    ]);
    return { certificate, documents, renewals, history, runtimeStatus: this.certificateRuntimeStatus(certificate, await this.settings(user, { siteId: certificate.site_id })) };
  }

  async updateCertificate(user: RequestUser, certificateId: string, dto: Row) {
    const before = await this.assertCertificate(user, certificateId);
    this.assertMutable(before);
    const patch = this.compact({
      site_id: dto.siteId ? this.assertSiteAccess(user, dto.siteId) : undefined,
      unit_id: dto.unitId,
      area_id: dto.areaId,
      certificate_title: dto.certificateTitle,
      certificate_code: dto.certificateCode,
      certificate_number: dto.certificateNumber,
      certificate_category: dto.certificateCategory,
      issuer_provider: dto.issuerProvider,
      external_provider: dto.externalProvider,
      description: dto.description,
      notes: dto.notes,
      issue_date: dto.issueDate,
      effective_date: dto.effectiveDate,
      expiry_date: dto.expiryDate,
      no_expiry: dto.noExpiry,
      renewal_required: dto.renewalRequired,
      renewal_interval_days: dto.renewalIntervalDays,
      expiry_warning_days: dto.expiryWarningDays,
      grace_period_days: dto.gracePeriodDays,
      evidence_status: dto.evidenceStatus,
      safety_critical: dto.safetyCritical,
      psm_critical: dto.psmCritical,
      ptw_critical: dto.ptwCritical,
      moc_critical: dto.mocCritical,
      pssr_critical: dto.pssrCritical,
      training_item_id: dto.trainingItemId,
      training_item_version: dto.trainingItemVersion,
      completion_record_id: dto.completionRecordId,
      competency_profile_id: dto.competencyProfileId,
      competency_requirement_id: dto.competencyRequirementId,
      matrix_assignment_id: dto.matrixAssignmentId,
      matrix_gap_id: dto.matrixGapId,
      override_reason: dto.overrideReason,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update(patch).eq('company_id', user.tenantId).eq('id', certificateId).select().single(), 'Unable to update certificate.');
    await this.writeHistory(user, 'Updated', 'Training certificate updated', before, updated, updated);
    return updated;
  }

  async verifyCertificate(user: RequestUser, certificateId: string, dto: Row = {}) {
    const before = await this.assertCertificate(user, certificateId);
    const settings = await this.settings(user, { siteId: before.site_id });
    const status = this.certificateRuntimeStatus(before, settings);
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update({ certificate_status: status, verification_status: 'Verified', evidence_status: before.evidence_status === 'Missing' ? 'Verified' : before.evidence_status, verified_by: user.id, verified_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString(), override_reason: dto.reason ?? null }).eq('company_id', user.tenantId).eq('id', certificateId).select().single());
    await this.syncCertificateImpact(user, updated);
    await this.writeHistory(user, 'Verified', 'Training certificate verified', before, updated, updated);
    return updated;
  }

  async rejectCertificate(user: RequestUser, certificateId: string, dto: Row) {
    this.requireText(dto.reason, 'Rejection reason is required.');
    const before = await this.assertCertificate(user, certificateId);
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update({ certificate_status: 'Rejected', verification_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', certificateId).select().single());
    await this.syncCertificateImpact(user, updated);
    await this.writeHistory(user, 'Rejected', 'Training certificate rejected', before, updated, updated);
    return updated;
  }

  async renewCertificate(user: RequestUser, certificateId: string, dto: Row) {
    const before = await this.assertCertificate(user, certificateId);
    const renewal = await this.db.single<Row>(this.db.from('training_certificate_renewals').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: before.site_id ?? null,
      worker_id: before.worker_id,
      old_certificate_id: before.id,
      new_certificate_id: dto.newCertificateId ?? null,
      renewal_status: dto.renewalStatus ?? 'Renewal Started',
      renewal_due_date: dto.renewalDueDate ?? before.expiry_date ?? null,
      renewal_completed_at: dto.renewalCompletedAt ?? null,
      renewal_notes: dto.notes ?? null,
      created_by: user.id
    }).select().single());
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update({ certificate_status: dto.newCertificateId ? 'Superseded' : 'Expiring Soon', superseded_by_certificate_id: dto.newCertificateId ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', certificateId).select().single());
    await this.writeHistory(user, 'Renewed', 'Training certificate renewal recorded', before, updated, { ...updated, renewal });
    return { certificate: updated, renewal };
  }

  async revokeCertificate(user: RequestUser, certificateId: string, dto: Row) {
    this.requireText(dto.reason, 'Revocation reason is required.');
    const before = await this.assertCertificate(user, certificateId);
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update({ certificate_status: 'Revoked', revoked_by: user.id, revoked_at: new Date().toISOString(), revoke_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', certificateId).select().single());
    await this.syncCertificateImpact(user, updated);
    await this.writeHistory(user, 'Revoked', 'Training certificate revoked', before, updated, updated);
    return updated;
  }

  async archiveCertificate(user: RequestUser, certificateId: string, dto: Row = {}) {
    const before = await this.assertCertificate(user, certificateId);
    const updated = await this.db.single<Row>(this.db.from('training_certificates').update({ certificate_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', certificateId).select().single());
    await this.writeHistory(user, 'Archived', 'Training certificate archived', before, updated, updated);
    return updated;
  }

  async linkCertificateDocument(user: RequestUser, certificateId: string, dto: Row) {
    this.requireText(dto.documentId, 'Document is required.');
    const certificate = await this.assertCertificate(user, certificateId);
    const row = await this.db.single<Row>(this.db.from('training_certificate_documents').insert({ id: randomUUID(), company_id: user.tenantId, site_id: certificate.site_id ?? null, certificate_id: certificateId, document_id: dto.documentId, document_type: dto.documentType ?? 'Certificate document', evidence_status: dto.evidenceStatus ?? 'Linked', required: dto.required ?? true, linked_by: user.id }).select().single());
    await this.db.single(this.db.from('training_certificates').update({ evidence_status: 'Provided', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', certificateId).select('id').single()).catch(() => null);
    await this.writeHistory(user, 'Linked', 'Certificate evidence document linked', null, row, certificate);
    return row;
  }

  async removeCertificateDocument(user: RequestUser, certificateId: string, documentLinkId: string, dto: Row = {}) {
    this.requireText(dto.reason, 'Document removal reason is required.');
    const certificate = await this.assertCertificate(user, certificateId);
    const before = await this.db.single<Row>(this.db.from('training_certificate_documents').select('*').eq('company_id', user.tenantId).eq('certificate_id', certificateId).eq('id', documentLinkId).single(), 'Document link not found.');
    const row = await this.db.single<Row>(this.db.from('training_certificate_documents').update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq('company_id', user.tenantId).eq('id', documentLinkId).select().single());
    await this.writeHistory(user, 'Unlinked', 'Certificate evidence document removed', before, row, certificate);
    return row;
  }

  async expiringCertificates(user: RequestUser, query: Row = {}) { return this.filteredCertificateShortcut(user, { ...query, runtimeStatus: 'Expiring Soon' }); }
  async expiredCertificates(user: RequestUser, query: Row = {}) { return this.filteredCertificateShortcut(user, { ...query, runtimeStatus: 'Expired' }); }
  async missingCertificates(user: RequestUser, query: Row = {}) { return this.filteredCertificateShortcut(user, { ...query, certificateStatus: 'Missing' }); }
  async pendingVerificationCertificates(user: RequestUser, query: Row = {}) { return this.filteredCertificateShortcut(user, { ...query, verificationStatus: 'Pending' }); }

  async assessmentDashboard(user: RequestUser, query: Row = {}) {
    const [assessments, assignments, attempts, results] = await Promise.all([this.scopedAssessments(user, query), this.scopedAssignments(user, query), this.scopedAttempts(user, query), this.scopedResults(user, query)]);
    const completed = attempts.filter((row) => ['Submitted', 'Auto-Graded', 'Pending Manual Grading', 'Pending Verification', 'Passed', 'Failed'].includes(row.attempt_status));
    const passed = results.filter((row) => row.passed);
    return {
      summary: {
        totalAssessments: assessments.length,
        active: assessments.filter((row) => row.assessment_status === 'Active').length,
        draft: assessments.filter((row) => row.assessment_status === 'Draft').length,
        approved: assessments.filter((row) => row.approval_status === 'Approved' || row.assessment_status === 'Approved').length,
        assignmentsOpen: assignments.filter((row) => ['Assigned', 'In Progress', 'Overdue'].includes(row.assignment_status)).length,
        attemptsStarted: attempts.filter((row) => row.started_at).length,
        attemptsCompleted: completed.length,
        passed: passed.length,
        failed: results.filter((row) => row.result_status.includes('Failed') || row.passed === false).length,
        pending: results.filter((row) => row.result_status === 'Pending').length,
        pendingManualGrading: attempts.filter((row) => row.attempt_status === 'Pending Manual Grading').length,
        pendingVerification: results.filter((row) => row.verification_status === 'Pending').length,
        averageScore: results.length ? Math.round(results.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / results.length) : 0,
        passRate: results.length ? Math.round((passed.length / results.length) * 100) : 0,
        safetyCriticalFailed: results.filter((row) => !row.passed && assessments.find((assessment) => assessment.id === row.assessment_id)?.safety_critical).length,
        ptwMocPssrBlockers: assignments.filter((row) => row.ptw_blocker_id || row.moc_training_requirement_id || row.pssr_training_blocker_id).length,
        retakesRequired: assignments.filter((row) => row.retake_required).length,
        overdue: assignments.filter((row) => this.isPast(row.due_date) && !['Completed', 'Cancelled'].includes(row.assignment_status)).length
      },
      pendingManualGrading: attempts.filter((row) => row.attempt_status === 'Pending Manual Grading').slice(0, 8),
      failedSafetyCritical: results.filter((row) => !row.passed).slice(0, 8),
      openAssignments: assignments.filter((row) => ['Assigned', 'In Progress', 'Overdue'].includes(row.assignment_status)).slice(0, 8),
      lastUpdated: new Date().toISOString()
    };
  }

  async assessmentLibrary(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyAssessmentFilters(await this.scopedAssessments(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: allRows.slice((page - 1) * limit, page * limit), total: allRows.length, page, limit, filters: this.lookups(), summary: (await this.assessmentDashboard(user, query)).summary };
  }

  async createAssessment(user: RequestUser, dto: Row) {
    this.requireText(dto.assessmentTitle, 'Assessment title is required.');
    this.requireText(dto.assessmentType, 'Assessment type is required.');
    if (Number(dto.passingScore ?? 0) > Number(dto.maxScore ?? 100)) throw new BadRequestException('Passing score cannot exceed max score.');
    const row = await this.db.single<Row>(this.db.from('training_assessments').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ? this.assertSiteAccess(user, dto.siteId) : user.selectedSiteId ?? user.activeSiteId ?? null,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      assessment_title: dto.assessmentTitle,
      assessment_code: dto.assessmentCode ?? null,
      assessment_type: dto.assessmentType,
      assessment_category: dto.assessmentCategory ?? null,
      description: dto.description ?? null,
      instructions: dto.instructions ?? null,
      assessment_status: dto.assessmentStatus ?? 'Draft',
      approval_status: dto.approvalStatus ?? 'Draft',
      version: dto.version ?? '1.0',
      passing_score: Number(dto.passingScore ?? 80),
      max_score: Number(dto.maxScore ?? 100),
      time_limit_minutes: this.numberOrNull(dto.timeLimitMinutes),
      attempt_limit: this.numberOrNull(dto.attemptLimit) ?? 1,
      validity_days: this.numberOrNull(dto.validityDays),
      randomize_questions: Boolean(dto.randomizeQuestions),
      randomize_answers: Boolean(dto.randomizeAnswers),
      manual_grading_required: Boolean(dto.manualGradingRequired),
      verification_required: Boolean(dto.verificationRequired),
      safety_critical: Boolean(dto.safetyCritical),
      psm_critical: Boolean(dto.psmCritical),
      ptw_critical: Boolean(dto.ptwCritical),
      moc_critical: Boolean(dto.mocCritical),
      pssr_critical: Boolean(dto.pssrCritical),
      training_item_id: dto.trainingItemId ?? null,
      competency_requirement_id: dto.competencyRequirementId ?? null,
      matrix_rule_id: dto.matrixRuleId ?? null,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.writeHistory(user, 'Created', 'Training assessment created', null, row, row);
    return row;
  }

  async assessmentDetail(user: RequestUser, assessmentId: string) {
    const assessment = await this.assertAssessment(user, assessmentId);
    const [questions, assignments, results, history] = await Promise.all([
      this.assessmentQuestions(user, assessmentId),
      this.safeMany(this.db.from('training_assessment_assignments').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(25)),
      this.safeMany(this.db.from('training_assessment_results').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(25)),
      this.safeMany(this.db.from('training_cert_assessment_history_events').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(50))
    ]);
    return { assessment, questions, assignments, results, history };
  }

  async updateAssessment(user: RequestUser, assessmentId: string, dto: Row) {
    const before = await this.assertAssessment(user, assessmentId);
    this.assertMutable(before);
    const updated = await this.db.single<Row>(this.db.from('training_assessments').update(this.compact({
      assessment_title: dto.assessmentTitle,
      assessment_code: dto.assessmentCode,
      assessment_type: dto.assessmentType,
      assessment_category: dto.assessmentCategory,
      description: dto.description,
      instructions: dto.instructions,
      assessment_status: dto.assessmentStatus,
      approval_status: dto.approvalStatus,
      version: dto.version,
      passing_score: dto.passingScore,
      max_score: dto.maxScore,
      time_limit_minutes: dto.timeLimitMinutes,
      attempt_limit: dto.attemptLimit,
      validity_days: dto.validityDays,
      randomize_questions: dto.randomizeQuestions,
      randomize_answers: dto.randomizeAnswers,
      manual_grading_required: dto.manualGradingRequired,
      verification_required: dto.verificationRequired,
      safety_critical: dto.safetyCritical,
      psm_critical: dto.psmCritical,
      ptw_critical: dto.ptwCritical,
      moc_critical: dto.mocCritical,
      pssr_critical: dto.pssrCritical,
      training_item_id: dto.trainingItemId,
      competency_requirement_id: dto.competencyRequirementId,
      matrix_rule_id: dto.matrixRuleId,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })).eq('company_id', user.tenantId).eq('id', assessmentId).select().single());
    await this.writeHistory(user, 'Updated', 'Training assessment updated', before, updated, updated);
    return updated;
  }

  async archiveAssessment(user: RequestUser, assessmentId: string, dto: Row = {}) {
    const before = await this.assertAssessment(user, assessmentId);
    const updated = await this.db.single<Row>(this.db.from('training_assessments').update({ assessment_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', assessmentId).select().single());
    await this.writeHistory(user, 'Archived', 'Training assessment archived', before, updated, updated);
    return updated;
  }

  async assessmentQuestions(user: RequestUser, assessmentId: string) {
    await this.assertAssessment(user, assessmentId);
    return this.safeMany(this.db.from('training_assessment_questions').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).order('question_order'));
  }

  async addAssessmentQuestion(user: RequestUser, assessmentId: string, dto: Row) {
    const assessment = await this.assertAssessment(user, assessmentId);
    this.requireText(dto.questionText, 'Question text is required.');
    this.requireText(dto.questionType, 'Question type is required.');
    const row = await this.db.single<Row>(this.db.from('training_assessment_questions').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: assessment.site_id ?? null,
      assessment_id: assessmentId,
      question_order: Number(dto.questionOrder ?? 1),
      question_type: dto.questionType,
      question_text: dto.questionText,
      question_help_text: dto.questionHelpText ?? null,
      answer_options_json: dto.answerOptions ?? null,
      correct_answer_json: dto.correctAnswer ?? null,
      points: Number(dto.points ?? 1),
      required: dto.required ?? true,
      safety_critical_question: Boolean(dto.safetyCriticalQuestion),
      manual_grading_required: Boolean(dto.manualGradingRequired),
      created_by: user.id
    }).select().single());
    await this.writeHistory(user, 'Created', 'Assessment question added', null, row, assessment);
    return row;
  }

  async updateAssessmentQuestion(user: RequestUser, assessmentId: string, questionId: string, dto: Row) {
    const assessment = await this.assertAssessment(user, assessmentId);
    const before = await this.db.single<Row>(this.db.from('training_assessment_questions').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).eq('id', questionId).single(), 'Question not found.');
    const updated = await this.db.single<Row>(this.db.from('training_assessment_questions').update(this.compact({ question_order: dto.questionOrder, question_type: dto.questionType, question_text: dto.questionText, question_help_text: dto.questionHelpText, answer_options_json: dto.answerOptions, correct_answer_json: dto.correctAnswer, points: dto.points, required: dto.required, safety_critical_question: dto.safetyCriticalQuestion, manual_grading_required: dto.manualGradingRequired, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', questionId).select().single());
    await this.writeHistory(user, 'Updated', 'Assessment question updated', before, updated, assessment);
    return updated;
  }

  async removeAssessmentQuestion(user: RequestUser, assessmentId: string, questionId: string, dto: Row = {}) {
    const assessment = await this.assertAssessment(user, assessmentId);
    const before = await this.db.single<Row>(this.db.from('training_assessment_questions').select('*').eq('company_id', user.tenantId).eq('assessment_id', assessmentId).eq('id', questionId).single(), 'Question not found.');
    await this.db.single(this.db.from('training_assessment_questions').delete().eq('company_id', user.tenantId).eq('id', questionId).select('id').single());
    await this.writeHistory(user, 'Deleted', 'Assessment question deleted', before, dto, assessment);
    return { deleted: true, id: questionId };
  }

  async assessmentAssignments(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyAssignmentFilters(await this.scopedAssignments(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: allRows.slice((page - 1) * limit, page * limit), total: allRows.length, page, limit };
  }

  async createAssessmentAssignment(user: RequestUser, dto: Row) {
    this.requireText(dto.workerId, 'Worker is required.');
    this.requireText(dto.assessmentId, 'Assessment is required.');
    const [worker, assessment] = await Promise.all([this.assertWorker(user, dto.workerId), this.assertAssessment(user, dto.assessmentId)]);
    const row = await this.db.single<Row>(this.db.from('training_assessment_assignments').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? worker.primary_site_id ?? assessment.site_id ?? null,
      worker_id: worker.id,
      assessment_id: assessment.id,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      due_date: dto.dueDate ?? null,
      assignment_status: dto.assignmentStatus ?? 'Assigned',
      required: dto.required ?? true,
      retake_required: Boolean(dto.retakeRequired),
      training_item_id: dto.trainingItemId ?? assessment.training_item_id ?? null,
      completion_record_id: dto.completionRecordId ?? null,
      matrix_gap_id: dto.matrixGapId ?? null,
      competency_gap_id: dto.competencyGapId ?? null,
      ptw_blocker_id: dto.ptwBlockerId ?? null,
      moc_training_requirement_id: dto.mocTrainingRequirementId ?? null,
      pssr_training_blocker_id: dto.pssrTrainingBlockerId ?? null,
      assignment_message: dto.assignmentMessage ?? null
    }).select().single());
    await this.writeHistory(user, 'Assigned', 'Assessment assigned', null, row, { ...assessment, worker_id: worker.id });
    return row;
  }

  async assessmentAssignmentDetail(user: RequestUser, assignmentId: string) {
    const assignment = await this.assertAssignment(user, assignmentId);
    const [assessment, attempts, results] = await Promise.all([this.assertAssessment(user, assignment.assessment_id), this.safeMany(this.db.from('training_assessment_attempts').select('*').eq('company_id', user.tenantId).eq('assignment_id', assignmentId).order('created_at', { ascending: false })), this.safeMany(this.db.from('training_assessment_results').select('*').eq('company_id', user.tenantId).eq('assignment_id', assignmentId).order('created_at', { ascending: false }))]);
    return { assignment, assessment, attempts, results };
  }

  async startAssessmentAssignment(user: RequestUser, assignmentId: string, dto: Row = {}) {
    const assignment = await this.assertAssignment(user, assignmentId);
    const assessment = await this.assertAssessment(user, assignment.assessment_id);
    const attempts = await this.safeMany(this.db.from('training_assessment_attempts').select('id').eq('company_id', user.tenantId).eq('assignment_id', assignmentId));
    if (attempts.length >= Number(assessment.attempt_limit ?? 1)) throw new BadRequestException('Attempt limit reached.');
    const row = await this.db.single<Row>(this.db.from('training_assessment_attempts').insert({ id: randomUUID(), company_id: user.tenantId, site_id: assignment.site_id ?? assessment.site_id ?? null, worker_id: assignment.worker_id, assessment_id: assessment.id, assignment_id: assignment.id, attempt_number: attempts.length + 1, attempt_status: 'Started', started_at: new Date().toISOString(), started_by: dto.startedBy ?? user.id }).select().single());
    await this.db.single(this.db.from('training_assessment_assignments').update({ assignment_status: 'In Progress', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', assignmentId).select('id').single()).catch(() => null);
    await this.writeHistory(user, 'Started', 'Assessment attempt started', null, row, assessment);
    return row;
  }

  async assessmentAttempt(user: RequestUser, attemptId: string) {
    const attempt = await this.assertAttempt(user, attemptId);
    const [assessment, questions, answers, result] = await Promise.all([this.assertAssessment(user, attempt.assessment_id), this.assessmentQuestions(user, attempt.assessment_id), this.safeMany(this.db.from('training_assessment_answers').select('*').eq('company_id', user.tenantId).eq('attempt_id', attemptId)), this.db.single<Row>(this.db.from('training_assessment_results').select('*').eq('company_id', user.tenantId).eq('attempt_id', attemptId).maybeSingle()).catch(() => null)]);
    return { attempt, assessment, questions, answers, result };
  }

  async saveAssessmentAnswer(user: RequestUser, attemptId: string, dto: Row) {
    const attempt = await this.assertAttempt(user, attemptId);
    this.requireText(dto.questionId, 'Question is required.');
    const existing = await this.db.single<Row>(this.db.from('training_assessment_answers').select('*').eq('company_id', user.tenantId).eq('attempt_id', attemptId).eq('question_id', dto.questionId).maybeSingle()).catch(() => null);
    const payload = { id: existing?.id ?? randomUUID(), company_id: user.tenantId, site_id: attempt.site_id ?? null, attempt_id: attemptId, question_id: dto.questionId, answer_json: dto.answer ?? null, answer_text: dto.answerText ?? null, evidence_document_id: dto.evidenceDocumentId ?? null, updated_at: new Date().toISOString() };
    const row = existing
      ? await this.db.single<Row>(this.db.from('training_assessment_answers').update(payload).eq('company_id', user.tenantId).eq('id', existing.id).select().single())
      : await this.db.single<Row>(this.db.from('training_assessment_answers').insert(payload).select().single());
    await this.writeHistory(user, 'Updated', 'Assessment answer saved', existing, row, attempt);
    return row;
  }

  async submitAssessmentAttempt(user: RequestUser, attemptId: string, dto: Row = {}) {
    const attempt = await this.assertAttempt(user, attemptId);
    const detail = await this.assessmentAttempt(user, attemptId);
    const grade = this.gradeAttempt(detail.assessment, detail.questions, detail.answers);
    const status = grade.requiresManual ? 'Pending Manual Grading' : grade.passed ? 'Passed' : 'Failed';
    const updated = await this.db.single<Row>(this.db.from('training_assessment_attempts').update({ attempt_status: status, submitted_at: new Date().toISOString(), submitted_by: dto.submittedBy ?? user.id, score: grade.score, max_score: grade.maxScore, passed: grade.passed, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', attemptId).select().single());
    const result = await this.upsertAssessmentResult(user, updated, detail.assessment, grade, status);
    await this.writeHistory(user, 'Submitted', 'Assessment attempt submitted and graded by backend', attempt, updated, updated);
    return { attempt: updated, result };
  }

  async gradeAssessmentAttempt(user: RequestUser, attemptId: string, dto: Row) {
    const before = await this.assertAttempt(user, attemptId);
    const score = Number(dto.score ?? before.score ?? 0);
    const maxScore = Number(dto.maxScore ?? before.max_score ?? 100);
    const assessment = await this.assertAssessment(user, before.assessment_id);
    const passed = score >= Number(assessment.passing_score ?? 0);
    const status = assessment.verification_required ? 'Pending Verification' : passed ? 'Passed' : 'Failed';
    const updated = await this.db.single<Row>(this.db.from('training_assessment_attempts').update({ attempt_status: status, score, max_score: maxScore, passed, graded_at: new Date().toISOString(), graded_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', attemptId).select().single());
    const result = await this.upsertAssessmentResult(user, updated, assessment, { score, maxScore, passed, requiresManual: false }, status);
    await this.writeHistory(user, 'Graded', 'Assessment attempt manually graded', before, updated, updated);
    return { attempt: updated, result };
  }

  async verifyAssessmentAttempt(user: RequestUser, attemptId: string, dto: Row = {}) {
    const before = await this.assertAttempt(user, attemptId);
    const passed = Boolean(before.passed);
    const status = passed ? 'Verified Passed' : 'Verified Failed';
    const updated = await this.db.single<Row>(this.db.from('training_assessment_attempts').update({ attempt_status: passed ? 'Passed' : 'Failed', verified_by: user.id, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', attemptId).select().single());
    await this.db.single(this.db.from('training_assessment_results').update({ result_status: status, verification_status: 'Verified', verified_by: user.id, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('attempt_id', attemptId).select('id').single()).catch(() => null);
    await this.syncAssessmentImpact(user, updated);
    await this.writeHistory(user, 'Verified', dto.reason ?? 'Assessment result verified', before, updated, updated);
    return updated;
  }

  async reopenAssessmentAttempt(user: RequestUser, attemptId: string, dto: Row) {
    this.requireText(dto.reason, 'Reopen reason is required.');
    const before = await this.assertAttempt(user, attemptId);
    const updated = await this.db.single<Row>(this.db.from('training_assessment_attempts').update({ attempt_status: 'Reopened', reopen_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', attemptId).select().single());
    await this.writeHistory(user, 'Reopened', 'Assessment attempt reopened', before, updated, updated);
    return updated;
  }

  async assessmentResults(user: RequestUser, query: Row = {}) {
    const allRows = this.sortRows(this.applyResultFilters(await this.scopedResults(user, query), query), String(query.sort ?? 'updated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: allRows.slice((page - 1) * limit, page * limit), total: allRows.length, page, limit };
  }

  async workerCertifications(user: RequestUser, workerId: string, query: Row = {}) { await this.assertWorker(user, workerId); return this.certificationRegister(user, { ...query, workerId }); }
  async workerAssessments(user: RequestUser, workerId: string, query: Row = {}) { await this.assertWorker(user, workerId); return this.assessmentAssignments(user, { ...query, workerId }); }
  async workerAssessmentResults(user: RequestUser, workerId: string, query: Row = {}) { await this.assertWorker(user, workerId); return this.assessmentResults(user, { ...query, workerId }); }

  async expiryOverdue(user: RequestUser, query: Row = {}) {
    const [certificates, assignments] = await Promise.all([this.certificationRegister(user, query), this.assessmentAssignments(user, query)]);
    const certRows = (certificates.rows ?? []).filter((row: Row) => ['Expiring Soon', 'Expired'].includes(row.runtime_status ?? row.certificate_status));
    const assignmentRows = (assignments.rows ?? []).filter((row: Row) => this.isPast(row.due_date) && !['Completed', 'Cancelled'].includes(row.assignment_status));
    return {
      summary: { totalOverdue: certRows.filter((row: Row) => (row.runtime_status ?? row.certificate_status) === 'Expired').length + assignmentRows.length, certificatesExpiring: certRows.filter((row: Row) => (row.runtime_status ?? row.certificate_status) === 'Expiring Soon').length, certificatesExpired: certRows.filter((row: Row) => (row.runtime_status ?? row.certificate_status) === 'Expired').length, assessmentsOverdue: assignmentRows.length },
      certificateRows: certRows,
      assessmentRows: assignmentRows,
      blockers: [...certRows, ...assignmentRows].filter((row: Row) => row.ptw_critical || row.moc_critical || row.pssr_critical || row.ptw_blocker_id || row.moc_training_requirement_id || row.pssr_training_blocker_id),
      lastUpdated: new Date().toISOString()
    };
  }

  certificateImportTemplate() { return { columns: ['workerId', 'certificateTitle', 'certificateCategory', 'certificateNumber', 'issuerProvider', 'issueDate', 'expiryDate', 'safetyCritical', 'trainingItemId', 'documentId'], lookups: this.lookups() }; }
  assessmentImportTemplate() { return { columns: ['assessmentTitle', 'assessmentType', 'assessmentCategory', 'passingScore', 'maxScore', 'safetyCritical', 'trainingItemId'], lookups: this.lookups() }; }
  async certificateImport(user: RequestUser, dto: Row) { const rows = Array.isArray(dto.rows) ? dto.rows : []; const created = []; for (const row of rows) created.push(await this.createCertificate(user, row)); return { created, count: created.length }; }
  async assessmentImport(user: RequestUser, dto: Row) { const rows = Array.isArray(dto.rows) ? dto.rows : []; const created = []; for (const row of rows) created.push(await this.createAssessment(user, row)); return { created, count: created.length }; }
  async certificateExport(user: RequestUser, query: Row = {}) { await this.writeHistory(user, 'Exported', 'Certificate export requested', null, query, {}); return { exportType: query.format ?? 'csv', generatedAt: new Date().toISOString(), data: await this.certificationRegister(user, { ...query, limit: 100 }) }; }
  async assessmentExport(user: RequestUser, query: Row = {}) { await this.writeHistory(user, 'Exported', 'Assessment export requested', null, query, {}); return { exportType: query.format ?? 'csv', generatedAt: new Date().toISOString(), data: await this.assessmentLibrary(user, { ...query, limit: 100 }) }; }
  async history(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_cert_assessment_history_events').select('*').eq('company_id', user.tenantId).order('created_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 200));
    req = this.siteScopedBase(user, req);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.certificateId) req = req.eq('certificate_id', query.certificateId);
    if (query.assessmentId) req = req.eq('assessment_id', query.assessmentId);
    return this.safeMany(req);
  }

  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    const existing = await this.db.single<Row>(this.db.from('training_cert_assessment_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId).maybeSingle()).catch(() => null);
    if (existing) return existing;
    return { company_id: user.tenantId, site_id: siteId, default_certificate_expiry_warning_days: 60, default_assessment_due_warning_days: 14, require_certificate_evidence: true, require_verification_for_safety_critical_certificates: true, require_verification_for_safety_critical_assessments: true, auto_update_matrix_on_certificate_verify: true, auto_update_competency_on_certificate_verify: true, auto_update_matrix_on_assessment_pass: true, auto_update_competency_on_assessment_pass: true, auto_reopen_gaps_on_certificate_expiry: true, auto_notify_expiring_certificates: true, auto_notify_failed_assessments: true, require_esign_for_safety_critical_override: true };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    const before = await this.db.single<Row>(this.db.from('training_cert_assessment_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId).maybeSingle()).catch(() => null);
    const payload = { id: before?.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, default_certificate_expiry_warning_days: Number(dto.defaultCertificateExpiryWarningDays ?? dto.default_certificate_expiry_warning_days ?? 60), default_assessment_due_warning_days: Number(dto.defaultAssessmentDueWarningDays ?? dto.default_assessment_due_warning_days ?? 14), require_certificate_evidence: dto.requireCertificateEvidence ?? dto.require_certificate_evidence ?? true, require_verification_for_safety_critical_certificates: dto.requireVerificationForSafetyCriticalCertificates ?? dto.require_verification_for_safety_critical_certificates ?? true, require_verification_for_safety_critical_assessments: dto.requireVerificationForSafetyCriticalAssessments ?? dto.require_verification_for_safety_critical_assessments ?? true, auto_update_matrix_on_certificate_verify: dto.autoUpdateMatrixOnCertificateVerify ?? dto.auto_update_matrix_on_certificate_verify ?? true, auto_update_competency_on_certificate_verify: dto.autoUpdateCompetencyOnCertificateVerify ?? dto.auto_update_competency_on_certificate_verify ?? true, auto_update_matrix_on_assessment_pass: dto.autoUpdateMatrixOnAssessmentPass ?? dto.auto_update_matrix_on_assessment_pass ?? true, auto_update_competency_on_assessment_pass: dto.autoUpdateCompetencyOnAssessmentPass ?? dto.auto_update_competency_on_assessment_pass ?? true, auto_reopen_gaps_on_certificate_expiry: dto.autoReopenGapsOnCertificateExpiry ?? dto.auto_reopen_gaps_on_certificate_expiry ?? true, auto_notify_expiring_certificates: dto.autoNotifyExpiringCertificates ?? dto.auto_notify_expiring_certificates ?? true, auto_notify_failed_assessments: dto.autoNotifyFailedAssessments ?? dto.auto_notify_failed_assessments ?? true, require_esign_for_safety_critical_override: dto.requireEsignForSafetyCriticalOverride ?? dto.require_esign_for_safety_critical_override ?? true, settings_json: dto.settingsJson ?? dto.settings_json ?? null, updated_by: user.id, updated_at: new Date().toISOString() };
    const row = before ? await this.db.single<Row>(this.db.from('training_cert_assessment_settings').update(payload).eq('id', before.id).select().single()) : await this.db.single<Row>(this.db.from('training_cert_assessment_settings').insert(payload).select().single());
    await this.writeHistory(user, 'Updated', 'Certification and assessment settings updated', before, row, row);
    return row;
  }

  lookups() {
    return { certificateCategories, certificateStatuses, certificateVerificationStatuses, assessmentTypes, assessmentStatuses, questionTypes, attemptStatuses, assessmentResultStatuses };
  }

  lookup(name: string) {
    const value = this.lookups()[name as keyof ReturnType<TrainingCertAssessmentService['lookups']>];
    if (!value) throw new NotFoundException('Lookup not found.');
    return value;
  }

  private async filteredCertificateShortcut(user: RequestUser, query: Row) {
    return this.certificationRegister(user, query);
  }

  private async scopedCertificates(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_certificates').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    return this.safeMany<Row>(req);
  }

  private async scopedAssessments(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_assessments').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    return this.safeMany<Row>(req);
  }

  private async scopedAssignments(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_assessment_assignments').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.assessmentId) req = req.eq('assessment_id', query.assessmentId);
    return this.safeMany<Row>(req);
  }

  private async scopedAttempts(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_assessment_attempts').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.assessmentId) req = req.eq('assessment_id', query.assessmentId);
    return this.safeMany<Row>(req);
  }

  private async scopedResults(user: RequestUser, query: Row = {}) {
    let req = this.db.from('training_assessment_results').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.assessmentId) req = req.eq('assessment_id', query.assessmentId);
    return this.safeMany<Row>(req);
  }

  private async assertWorker(user: RequestUser, workerId: string) {
    const row = await this.db.single<Row>(this.db.from('training_workers').select('*').eq('tenant_id', user.tenantId).eq('id', workerId).maybeSingle(), 'Worker not found.');
    if (!row) throw new NotFoundException('Worker not found.');
    if (row.primary_site_id) this.assertSiteAccess(user, row.primary_site_id);
    return row;
  }

  private async assertCertificate(user: RequestUser, certificateId: string) {
    const row = await this.db.single<Row>(this.db.from('training_certificates').select('*').eq('company_id', user.tenantId).eq('id', certificateId).maybeSingle(), 'Certificate not found.');
    if (!row) throw new NotFoundException('Certificate not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAssessment(user: RequestUser, assessmentId: string) {
    const row = await this.db.single<Row>(this.db.from('training_assessments').select('*').eq('company_id', user.tenantId).eq('id', assessmentId).maybeSingle(), 'Assessment not found.');
    if (!row) throw new NotFoundException('Assessment not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAssignment(user: RequestUser, assignmentId: string) {
    const row = await this.db.single<Row>(this.db.from('training_assessment_assignments').select('*').eq('company_id', user.tenantId).eq('id', assignmentId).maybeSingle(), 'Assignment not found.');
    if (!row) throw new NotFoundException('Assignment not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertAttempt(user: RequestUser, attemptId: string) {
    const row = await this.db.single<Row>(this.db.from('training_assessment_attempts').select('*').eq('company_id', user.tenantId).eq('id', attemptId).maybeSingle(), 'Attempt not found.');
    if (!row) throw new NotFoundException('Attempt not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private assertMutable(row: Row) {
    if (['Archived', 'Superseded', 'Revoked'].includes(row.certificate_status ?? row.assessment_status)) throw new ForbiddenException('This record is locked. Use the controlled renewal/reopen workflow.');
  }

  private async syncCertificateImpact(user: RequestUser, certificate: Row | null) {
    if (!certificate) return;
    const status = ['Current', 'Verified'].includes(certificate.certificate_status) || certificate.verification_status === 'Verified' ? 'Current' : certificate.certificate_status;
    await this.db.single(this.db.from('training_workers').update({ certification_status: status, updated_at: new Date().toISOString() }).eq('tenant_id', user.tenantId).eq('id', certificate.worker_id).select('id').single()).catch(() => null);
  }

  private async syncAssessmentImpact(user: RequestUser, attempt: Row | null) {
    if (!attempt) return;
    const status = attempt.passed ? 'Complete' : 'Blocked';
    await this.db.single(this.db.from('training_workers').update({ competency_status: status, training_status: attempt.passed ? 'Complete' : 'Incomplete', updated_at: new Date().toISOString() }).eq('tenant_id', user.tenantId).eq('id', attempt.worker_id).select('id').single()).catch(() => null);
  }

  private async upsertAssessmentResult(user: RequestUser, attempt: Row | null, assessment: Row, grade: { score: number; maxScore: number; passed: boolean; requiresManual: boolean }, status: string) {
    if (!attempt) throw new BadRequestException('Assessment attempt was not returned by the database.');
    const existing = await this.db.single<Row>(this.db.from('training_assessment_results').select('*').eq('company_id', user.tenantId).eq('attempt_id', attempt.id).maybeSingle()).catch(() => null);
    const expiry = assessment.validity_days ? this.addDays(new Date(), Number(assessment.validity_days)).toISOString().slice(0, 10) : null;
    const payload = { id: existing?.id ?? randomUUID(), company_id: user.tenantId, site_id: attempt.site_id ?? null, worker_id: attempt.worker_id, assessment_id: attempt.assessment_id, assignment_id: attempt.assignment_id ?? null, attempt_id: attempt.id, result_status: assessment.verification_required && grade.passed ? 'Pending Verification' : status, score: grade.score, max_score: grade.maxScore, passing_score: assessment.passing_score, passed: grade.passed, completion_date: new Date().toISOString().slice(0, 10), expiry_date: expiry, evidence_status: 'Assessment Result', verification_status: assessment.verification_required ? 'Pending' : 'Not Required', training_item_id: assessment.training_item_id ?? null, competency_requirement_id: assessment.competency_requirement_id ?? null, updated_at: new Date().toISOString() };
    return existing ? this.db.single<Row>(this.db.from('training_assessment_results').update(payload).eq('id', existing.id).select().single()) : this.db.single<Row>(this.db.from('training_assessment_results').insert(payload).select().single());
  }

  private gradeAttempt(assessment: Row, questions: Row[], answers: Row[]) {
    let score = 0;
    let maxScore = 0;
    let requiresManual = Boolean(assessment.manual_grading_required);
    for (const question of questions) {
      maxScore += Number(question.points ?? 0);
      const answer = answers.find((row) => row.question_id === question.id);
      if (question.manual_grading_required || ['Short Answer', 'Scenario Response', 'Practical Checklist Item', 'Assessor Observation', 'File Upload Evidence'].includes(question.question_type)) {
        requiresManual = true;
        continue;
      }
      const correct = JSON.stringify(question.correct_answer_json ?? null) === JSON.stringify(answer?.answer_json ?? answer?.answer_text ?? null);
      if (correct) score += Number(question.points ?? 0);
    }
    const passed = !requiresManual && score >= Number(assessment.passing_score ?? 0);
    return { score, maxScore: maxScore || Number(assessment.max_score ?? 100), passed, requiresManual };
  }

  private certificateRuntimeStatus(row: Row, settings: Row) {
    if (['Archived', 'Revoked', 'Rejected', 'Superseded', 'Missing'].includes(row.certificate_status)) return row.certificate_status;
    if (row.verification_status === 'Pending') return 'Pending Verification';
    if (row.no_expiry || !row.expiry_date) return 'Current';
    const expiry = new Date(row.expiry_date);
    const now = new Date();
    const graceDays = Number(row.grace_period_days ?? 0);
    if (expiry.getTime() + graceDays * 86400000 < now.getTime()) return 'Expired';
    const warningDays = Number(row.expiry_warning_days ?? settings.default_certificate_expiry_warning_days ?? 60);
    if (expiry.getTime() - warningDays * 86400000 <= now.getTime()) return 'Expiring Soon';
    return 'Current';
  }

  private applyCertificateFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.certificate_title, row.certificate_code, row.certificate_number, row.issuer_provider, row.worker_id].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.certificateStatus) result = result.filter((row) => row.certificate_status === query.certificateStatus);
    if (query.verificationStatus) result = result.filter((row) => row.verification_status === query.verificationStatus);
    if (query.category) result = result.filter((row) => row.certificate_category === query.category);
    if (query.trainingItemId) result = result.filter((row) => row.training_item_id === query.trainingItemId);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical);
    if (query.runtimeStatus) result = result.filter((row) => this.certificateRuntimeStatus(row, { default_certificate_expiry_warning_days: row.expiry_warning_days ?? 60 }) === query.runtimeStatus);
    return result;
  }

  private applyAssessmentFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.assessment_title, row.assessment_code, row.assessment_category].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.assessmentStatus) result = result.filter((row) => row.assessment_status === query.assessmentStatus);
    if (query.assessmentType) result = result.filter((row) => row.assessment_type === query.assessmentType);
    if (query.trainingItemId) result = result.filter((row) => row.training_item_id === query.trainingItemId);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical);
    return result;
  }

  private applyAssignmentFilters(rows: Row[], query: Row) {
    let result = rows;
    if (query.assignmentStatus) result = result.filter((row) => row.assignment_status === query.assignmentStatus);
    if (query.overdue === 'true') result = result.filter((row) => this.isPast(row.due_date) && !['Completed', 'Cancelled'].includes(row.assignment_status));
    return result;
  }

  private applyResultFilters(rows: Row[], query: Row) {
    let result = rows;
    if (query.resultStatus) result = result.filter((row) => row.result_status === query.resultStatus);
    if (query.failed === 'true') result = result.filter((row) => !row.passed);
    if (query.pendingVerification === 'true') result = result.filter((row) => row.verification_status === 'Pending');
    return result;
  }

  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row | null) {
    const auditLog = await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.cert_assessment.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingCertAssessment', entityId: scope?.id ?? after?.id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('training_cert_assessment_history_events').insert({ id: randomUUID(), company_id: user.tenantId, site_id: scope?.site_id ?? null, unit_id: scope?.unit_id ?? null, area_id: scope?.area_id ?? null, worker_id: scope?.worker_id ?? after?.worker_id ?? null, certificate_id: scope?.certificate_id ?? after?.certificate_id ?? (scope?.certificate_title ? scope.id : null), assessment_id: scope?.assessment_id ?? after?.assessment_id ?? (scope?.assessment_title ? scope.id : null), attempt_id: scope?.attempt_id ?? after?.attempt_id ?? null, event_type: eventType, event_title: title, event_description: after?.reason ?? after?.rejection_reason ?? after?.revoke_reason ?? null, before_value_json: before, after_value_json: after, actor_user_id: user.id, source_record_id: scope?.id ?? after?.id ?? null }).select('id').single()).catch(() => null);
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

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private sortRows(rows: Row[], sort: string) {
    const [field, direction] = sort.split('.');
    const key = field || 'updated_at';
    return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction === 'asc' ? 1 : -1));
  }

  private compact<T extends Row>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
  }

  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> {
    return this.db.many<T>(query).catch(() => []);
  }

  private numberOrNull(value: unknown) {
    return value === undefined || value === null || value === '' ? null : Number(value);
  }

  private isPast(value: unknown) {
    return Boolean(value && new Date(String(value)).getTime() < Date.now());
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 86400000);
  }
}
