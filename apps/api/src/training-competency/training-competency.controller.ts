import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingCertAssessmentService } from './training-cert-assessment.service';
import { TrainingCompetencyService } from './training-competency.service';
import { TrainingMatrixService } from './training-matrix.service';
import { TrainingRecordsAttendanceService } from './training-records-attendance.service';
import { TrainingRequiredLibraryService } from './training-required-library.service';
import { TrainingMocRequirementService } from './training-moc-requirement.service';
import { TrainingPssrReadinessService } from './training-pssr-readiness.service';
import { TrainingRolesCompetencyService } from './training-roles-competency.service';
import { TrainingSopAcknowledgementService } from './training-sop-acknowledgement.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('training-competency')
export class TrainingCompetencyController {
  constructor(private readonly training: TrainingCompetencyService, private readonly certAssessment: TrainingCertAssessmentService, private readonly matrix: TrainingMatrixService, private readonly competency: TrainingRolesCompetencyService, private readonly requiredTraining: TrainingRequiredLibraryService, private readonly records: TrainingRecordsAttendanceService, private readonly sopAck: TrainingSopAcknowledgementService, private readonly mocTraining: TrainingMocRequirementService, private readonly pssrTraining: TrainingPssrReadinessService) {}

  @Get('pssr-training-readiness')
  @Permissions('training.pssr.view')
  pssrTrainingDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.dashboard(user, query);
  }

  @Get('pssr-training-readiness/dashboard')
  @Permissions('training.pssr.dashboard.view')
  pssrTrainingDashboardPage(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.dashboard(user, query);
  }

  @Get('pssr-training-readiness/dashboard/summary')
  @Permissions('training.pssr.dashboard.view')
  pssrTrainingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.dashboardSummary(user, query);
  }

  @Get('pssr-training-readiness/register')
  @Permissions('training.pssr.readiness.view')
  pssrTrainingRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.register(user, query);
  }

  @Get('pssr-training-readiness/new/context')
  @Permissions('training.pssr.readiness.create')
  pssrTrainingNewContext(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.settings(user, query);
  }

  @Get('pssr-training-readiness/impact-checks')
  @Permissions('training.pssr.impact_check.view')
  pssrTrainingImpactChecks(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.impactChecks(user, query);
  }

  @Get('pssr-training-readiness/readiness-checks')
  @Permissions('training.pssr.readiness_check.view')
  pssrTrainingReadinessChecks(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.impactChecks(user, query);
  }

  @Get('pssr-training-readiness/assignments')
  @Permissions('training.pssr.assignment.view')
  pssrTrainingAssignments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.assignments(user, query);
  }

  @Get('pssr-training-readiness/pending')
  @Permissions('training.pssr.assignment.view')
  pssrTrainingPending(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.pending(user, query);
  }

  @Get('pssr-training-readiness/overdue')
  @Permissions('training.pssr.assignment.view')
  pssrTrainingOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.overdue(user, query);
  }

  @Get('pssr-training-readiness/ready')
  @Permissions('training.pssr.readiness.view')
  pssrTrainingReady(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.ready(user, query);
  }

  @Get('pssr-training-readiness/blockers')
  @Permissions('training.pssr.blocker.view')
  pssrTrainingBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.blockers(user, query);
  }

  @Get('pssr-training-readiness/approval-blockers')
  @Permissions('training.pssr.blocker.view')
  pssrTrainingApprovalBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.approvalBlockers(user, query);
  }

  @Get('pssr-training-readiness/handover-blockers')
  @Permissions('training.pssr.blocker.view')
  pssrTrainingHandoverBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.handoverBlockers(user, query);
  }

  @Get('pssr-training-readiness/startup-blockers')
  @Permissions('training.pssr.blocker.view')
  pssrTrainingStartupBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.startupBlockers(user, query);
  }

  @Get('pssr-training-readiness/waivers')
  @Permissions('training.pssr.waiver.view')
  pssrTrainingWaivers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.waivers(user, query);
  }

  @Get('pssr-training-readiness/history')
  @Permissions('training.pssr.history.view')
  pssrTrainingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.history(user, query);
  }

  @Get('pssr-training-readiness/settings')
  @Permissions('training.pssr.settings.view')
  pssrTrainingSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.settings(user, query);
  }

  @Patch('pssr-training-readiness/settings')
  @Permissions('training.pssr.settings.edit')
  updatePssrTrainingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.pssrTraining.updateSettings(user, dto);
  }

  @Get('pssr-training-readiness/import-template')
  @Permissions('training.pssr.import')
  pssrTrainingImportTemplate() {
    return this.pssrTraining.importTemplate();
  }

  @Post('pssr-training-readiness/import')
  @Permissions('training.pssr.import')
  importPssrTraining(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.pssrTraining.importRows(user, dto);
  }

  @Get('pssr-training-readiness/export')
  @Permissions('training.pssr.export')
  exportPssrTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.pssrTraining.exportRows(user, query);
  }

  @Post('pssr-training-readiness')
  @Permissions('training.pssr.readiness.create')
  createPssrTrainingReadiness(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.pssrTraining.createReadiness(user, dto);
  }

  @Get('pssr-training-readiness/assignments/:assignmentId')
  @Permissions('training.pssr.assignment.view')
  pssrTrainingAssignmentDetail(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.pssrTraining.assignmentDetail(user, assignmentId);
  }

  @Post('pssr-training-readiness/assignments/:assignmentId/cancel')
  @Permissions('training.pssr.assignment.cancel')
  cancelPssrTrainingAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.cancelAssignment(user, assignmentId, dto);
  }

  @Post('pssr-training-readiness/assignments/:assignmentId/recalculate')
  @Permissions('training.pssr.readiness.run')
  recalculatePssrTrainingAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.pssrTraining.recalculateAssignment(user, assignmentId);
  }

  @Get('pssr-training-readiness/blockers/:blockerId')
  @Permissions('training.pssr.blocker.view')
  pssrTrainingBlockerDetail(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string) {
    return this.pssrTraining.blockerDetail(user, blockerId);
  }

  @Post('pssr-training-readiness/blockers/:blockerId/create-action')
  @Permissions('training.pssr.blocker.close')
  createPssrTrainingBlockerAction(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.createBlockerAction(user, blockerId, dto);
  }

  @Post('pssr-training-readiness/blockers/:blockerId/mark-resolved')
  @Permissions('training.pssr.blocker.close')
  resolvePssrTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.markBlockerResolved(user, blockerId, dto);
  }

  @Post('pssr-training-readiness/blockers/:blockerId/verify')
  @Permissions('training.pssr.blocker.verify')
  verifyPssrTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.verifyBlocker(user, blockerId, dto);
  }

  @Post('pssr-training-readiness/blockers/:blockerId/reopen')
  @Permissions('training.pssr.blocker.reopen')
  reopenPssrTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.reopenBlocker(user, blockerId, dto);
  }

  @Post('pssr-training-readiness/blockers/:blockerId/waiver-request')
  @Permissions('training.pssr.waiver.request')
  requestPssrTrainingWaiver(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.requestWaiver(user, blockerId, dto);
  }

  @Post('pssr-training-readiness/waivers/:waiverId/:decision')
  @Permissions('training.pssr.waiver.approve', 'training.pssr.waiver.reject', 'training.pssr.waiver.revoke')
  decidePssrTrainingWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Param('decision') decision: 'approve' | 'reject' | 'revoke', @Body() dto: Record<string, any>) {
    return this.pssrTraining.decideWaiver(user, waiverId, decision, dto);
  }

  @Get('pssr-training-readiness/:readinessId')
  @Permissions('training.pssr.readiness.view')
  pssrTrainingDetail(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string) {
    return this.pssrTraining.readinessDetail(user, readinessId);
  }

  @Patch('pssr-training-readiness/:readinessId')
  @Permissions('training.pssr.readiness.edit')
  updatePssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.updateReadiness(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/archive')
  @Permissions('training.pssr.readiness.archive')
  archivePssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.archiveReadiness(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/reactivate')
  @Permissions('training.pssr.readiness.edit')
  reactivatePssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.reactivateReadiness(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/activate')
  @Permissions('training.pssr.readiness.edit')
  activatePssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.activateReadiness(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/impact-check/run')
  @Permissions('training.pssr.impact_check.run')
  runPssrTrainingImpactCheck(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runImpactCheck(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/readiness-check/run')
  @Permissions('training.pssr.readiness_check.run')
  runPssrTrainingReadinessCheck(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runImpactCheck(user, readinessId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/preview-required-workers')
  @Permissions('training.pssr.required_workers.view')
  previewPssrTrainingRequiredWorkers(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.previewAffectedWorkers(user, readinessId, dto);
  }

  @Get('pssr-training-readiness/:readinessId/required-workers')
  @Permissions('training.pssr.required_workers.view')
  pssrTrainingRequiredWorkers(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.requiredWorkers(user, readinessId, query);
  }

  @Post('pssr-training-readiness/:readinessId/required-workers')
  @Permissions('training.pssr.required_workers.manage')
  addPssrTrainingRequiredWorker(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.addAffectedWorker(user, readinessId, dto);
  }

  @Delete('pssr-training-readiness/:readinessId/required-workers/:requiredWorkerId')
  @Permissions('training.pssr.required_workers.manage')
  removePssrTrainingRequiredWorker(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Param('requiredWorkerId') requiredWorkerId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.removeAffectedWorker(user, readinessId, requiredWorkerId, dto);
  }

  @Post('pssr-training-readiness/:readinessId/generate-assignments')
  @Permissions('training.pssr.assignment.generate')
  generatePssrTrainingAssignments(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.generateAssignments(user, readinessId, dto);
  }

  @Get('pssr-training-readiness/:readinessId/assignments')
  @Permissions('training.pssr.assignment.view')
  pssrTrainingReadinessAssignments(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.readinessAssignments(user, readinessId, query);
  }

  @Get('pssr-training-readiness/:readinessId/readiness-check')
  @Permissions('training.pssr.readiness_check.view')
  pssrTrainingReadinessCheck(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string) {
    return this.pssrTraining.readiness(user, readinessId);
  }

  @Post('pssr-training-readiness/:readinessId/readiness/run')
  @Permissions('training.pssr.readiness.run')
  runPssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runReadiness(user, readinessId, dto);
  }

  @Get('workforce/:workerId/pssr-training-readiness')
  @Permissions('training.pssr.assignment.view')
  workerPssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.workerReadiness(user, workerId, query);
  }

  @Get('workforce/:workerId/pssr-training-assignments')
  @Permissions('training.pssr.assignment.view')
  workerPssrTrainingAssignments(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.workerAssignments(user, workerId, query);
  }

  @Get('workforce/:workerId/pssr-training-history')
  @Permissions('training.pssr.history.view')
  workerPssrTrainingHistory(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.workerHistory(user, workerId, query);
  }

  @Get('sites/:siteId/pssr-training-readiness')
  @Permissions('training.pssr.readiness.view')
  sitePssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.scopedSite(user, siteId, query);
  }

  @Get('units/:unitId/pssr-training-readiness')
  @Permissions('training.pssr.readiness.view')
  unitPssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.scopedUnit(user, unitId, query);
  }

  @Get('areas/:areaId/pssr-training-readiness')
  @Permissions('training.pssr.readiness.view')
  areaPssrTrainingReadiness(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.scopedArea(user, areaId, query);
  }

  @Get()
  @Permissions('training.view')
  root(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.dashboard(user, query);
  }

  @Get('dashboard')
  @Permissions('training.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.dashboard(user, query);
  }

  @Get('dashboard/summary')
  @Permissions('training.dashboard.view')
  dashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.dashboardSummary(user, query);
  }

  @Get('dashboard/readiness-by-site')
  @Permissions('training.dashboard.view')
  readinessBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.readinessBySite(user, query);
  }

  @Get('dashboard/readiness-by-unit')
  @Permissions('training.dashboard.view')
  readinessByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.readinessByUnit(user, query);
  }

  @Get('dashboard/overdue-preview')
  @Permissions('training.dashboard.view')
  overduePreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, trainingStatus: 'Overdue', limit: query.limit ?? 8 });
  }

  @Get('dashboard/recent-history')
  @Permissions('training.history.view')
  dashboardHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.history(user, query);
  }

  @Get('certifications')
  @Permissions('training.certifications.view')
  certificationsRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationDashboard(user, query);
  }

  @Get('certifications/dashboard')
  @Permissions('training.certifications.dashboard.view')
  certificationsDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationDashboard(user, query);
  }

  @Get('certifications/register')
  @Permissions('training.certifications.view')
  certificationsRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationRegister(user, query);
  }

  @Get('certifications/expiring')
  @Permissions('training.certifications.view')
  certificationsExpiring(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.expiringCertificates(user, query);
  }

  @Get('certifications/expired')
  @Permissions('training.certifications.view')
  certificationsExpired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.expiredCertificates(user, query);
  }

  @Get('certifications/missing')
  @Permissions('training.certifications.view')
  certificationsMissing(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.missingCertificates(user, query);
  }

  @Get('certifications/pending-verification')
  @Permissions('training.certifications.view')
  certificationsPendingVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.pendingVerificationCertificates(user, query);
  }

  @Get('certifications/rejected')
  @Permissions('training.certifications.view')
  certificationsRejected(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationRegister(user, { ...query, certificateStatus: 'Rejected' });
  }

  @Get('certifications/safety-critical')
  @Permissions('training.certifications.view')
  certificationsSafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationRegister(user, { ...query, safetyCritical: 'true' });
  }

  @Get('certifications/import-template')
  @Permissions('training.certifications.import')
  certificateImportTemplate() {
    return this.certAssessment.certificateImportTemplate();
  }

  @Post('certifications/import')
  @Permissions('training.certifications.import')
  importCertificates(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.certificateImport(user, dto);
  }

  @Get('certifications/export')
  @Permissions('training.certifications.export')
  exportCertificates(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.certificateExport(user, query);
  }

  @Post('certifications')
  @Permissions('training.certifications.create')
  createCertificate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.createCertificate(user, dto);
  }

  @Get('certifications/:certificateId')
  @Permissions('training.certifications.view')
  certificateDetail(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string) {
    return this.certAssessment.certificateDetail(user, certificateId);
  }

  @Patch('certifications/:certificateId')
  @Permissions('training.certifications.edit')
  updateCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.updateCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/verify')
  @Permissions('training.certifications.verify')
  verifyCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.verifyCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/reject')
  @Permissions('training.certifications.reject')
  rejectCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.rejectCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/renew')
  @Permissions('training.certifications.renew')
  renewCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.renewCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/revoke')
  @Permissions('training.certifications.revoke')
  revokeCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.revokeCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/archive')
  @Permissions('training.certifications.archive')
  archiveCertificate(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.archiveCertificate(user, certificateId, dto);
  }

  @Post('certifications/:certificateId/documents/link')
  @Permissions('training.certifications.link_document')
  linkCertificateDocument(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.linkCertificateDocument(user, certificateId, dto);
  }

  @Delete('certifications/:certificateId/documents/:documentLinkId')
  @Permissions('training.certifications.remove_document')
  removeCertificateDocument(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.removeCertificateDocument(user, certificateId, documentLinkId, dto);
  }

  @Get('assessments')
  @Permissions('training.assessments.view')
  assessmentsRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentDashboard(user, query);
  }

  @Get('assessments/dashboard')
  @Permissions('training.assessments.dashboard.view')
  assessmentsDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentDashboard(user, query);
  }

  @Get('assessments/library')
  @Permissions('training.assessments.library.view')
  assessmentLibrary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentLibrary(user, query);
  }

  @Post('assessments/library')
  @Permissions('training.assessments.library.create')
  createAssessment(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.createAssessment(user, dto);
  }

  @Get('assessments/library/:assessmentId')
  @Permissions('training.assessments.library.view')
  assessmentDetail(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.certAssessment.assessmentDetail(user, assessmentId);
  }

  @Patch('assessments/library/:assessmentId')
  @Permissions('training.assessments.library.edit')
  updateAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.updateAssessment(user, assessmentId, dto);
  }

  @Post('assessments/library/:assessmentId/archive')
  @Permissions('training.assessments.library.archive')
  archiveAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.archiveAssessment(user, assessmentId, dto);
  }

  @Get('assessments/library/:assessmentId/questions')
  @Permissions('training.assessments.library.view')
  assessmentQuestions(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.certAssessment.assessmentQuestions(user, assessmentId);
  }

  @Post('assessments/library/:assessmentId/questions')
  @Permissions('training.assessments.questions.manage')
  addAssessmentQuestion(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.addAssessmentQuestion(user, assessmentId, dto);
  }

  @Patch('assessments/library/:assessmentId/questions/:questionId')
  @Permissions('training.assessments.questions.manage')
  updateAssessmentQuestion(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('questionId') questionId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.updateAssessmentQuestion(user, assessmentId, questionId, dto);
  }

  @Delete('assessments/library/:assessmentId/questions/:questionId')
  @Permissions('training.assessments.questions.manage')
  removeAssessmentQuestion(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('questionId') questionId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.removeAssessmentQuestion(user, assessmentId, questionId, dto);
  }

  @Get('assessments/assignments')
  @Permissions('training.assessments.view')
  assessmentAssignments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentAssignments(user, query);
  }

  @Post('assessments/assignments')
  @Permissions('training.assessments.assign')
  createAssessmentAssignment(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.createAssessmentAssignment(user, dto);
  }

  @Get('assessments/assignments/:assignmentId')
  @Permissions('training.assessments.view')
  assessmentAssignmentDetail(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.certAssessment.assessmentAssignmentDetail(user, assignmentId);
  }

  @Post('assessments/assignments/:assignmentId/start')
  @Permissions('training.assessments.take')
  startAssessmentAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.startAssessmentAssignment(user, assignmentId, dto);
  }

  @Get('assessments/attempts/:attemptId')
  @Permissions('training.assessments.take')
  assessmentAttempt(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string) {
    return this.certAssessment.assessmentAttempt(user, attemptId);
  }

  @Post('assessments/attempts/:attemptId/save-answer')
  @Permissions('training.assessments.take')
  saveAssessmentAnswer(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.saveAssessmentAnswer(user, attemptId, dto);
  }

  @Post('assessments/attempts/:attemptId/submit')
  @Permissions('training.assessments.take')
  submitAssessmentAttempt(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.submitAssessmentAttempt(user, attemptId, dto);
  }

  @Post('assessments/attempts/:attemptId/grade')
  @Permissions('training.assessments.grade')
  gradeAssessmentAttempt(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.gradeAssessmentAttempt(user, attemptId, dto);
  }

  @Post('assessments/attempts/:attemptId/verify')
  @Permissions('training.assessments.verify')
  verifyAssessmentAttempt(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.verifyAssessmentAttempt(user, attemptId, dto);
  }

  @Post('assessments/attempts/:attemptId/reopen')
  @Permissions('training.assessments.reopen')
  reopenAssessmentAttempt(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string, @Body() dto: Record<string, any>) {
    return this.certAssessment.reopenAssessmentAttempt(user, attemptId, dto);
  }

  @Get('assessments/results')
  @Permissions('training.assessments.view')
  assessmentResults(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentResults(user, query);
  }

  @Get('assessments/failed')
  @Permissions('training.assessments.view')
  assessmentFailed(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentResults(user, { ...query, failed: 'true' });
  }

  @Get('assessments/pending')
  @Permissions('training.assessments.view')
  assessmentPending(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentResults(user, { ...query, resultStatus: 'Pending' });
  }

  @Get('assessments/pending-verification')
  @Permissions('training.assessments.view')
  assessmentPendingVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentResults(user, { ...query, pendingVerification: 'true' });
  }

  @Get('assessments/import-template')
  @Permissions('training.assessments.import')
  assessmentImportTemplate() {
    return this.certAssessment.assessmentImportTemplate();
  }

  @Post('assessments/import')
  @Permissions('training.assessments.import')
  importAssessments(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.assessmentImport(user, dto);
  }

  @Get('assessments/export')
  @Permissions('training.assessments.export')
  exportAssessments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentExport(user, query);
  }

  @Get('expiry-overdue')
  @Permissions('training.certifications.view', 'training.assessments.view')
  expiryOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.expiryOverdue(user, query);
  }

  @Get('cert-assessment/history')
  @Permissions('training.history.view')
  certAssessmentHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.history(user, query);
  }

  @Get('cert-assessment/settings')
  @Permissions('training.certifications.settings.view', 'training.assessments.settings.view')
  certAssessmentSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certAssessment.settings(user, query);
  }

  @Patch('cert-assessment/settings')
  @Permissions('training.certifications.settings.edit', 'training.assessments.settings.edit')
  updateCertAssessmentSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.certAssessment.updateSettings(user, dto);
  }

  @Get('lookups/certificate-categories')
  @Permissions('training.certifications.view')
  certificateCategoriesLookup() {
    return this.certAssessment.lookup('certificateCategories');
  }

  @Get('lookups/certificate-statuses')
  @Permissions('training.certifications.view')
  certificateStatusesLookup() {
    return this.certAssessment.lookup('certificateStatuses');
  }

  @Get('lookups/certificate-verification-statuses')
  @Permissions('training.certifications.view')
  certificateVerificationStatusesLookup() {
    return this.certAssessment.lookup('certificateVerificationStatuses');
  }

  @Get('lookups/assessment-types')
  @Permissions('training.assessments.view')
  assessmentTypesLookup() {
    return this.certAssessment.lookup('assessmentTypes');
  }

  @Get('lookups/assessment-statuses')
  @Permissions('training.assessments.view')
  assessmentStatusesLookup() {
    return this.certAssessment.lookup('assessmentStatuses');
  }

  @Get('lookups/question-types')
  @Permissions('training.assessments.view')
  questionTypesLookup() {
    return this.certAssessment.lookup('questionTypes');
  }

  @Get('lookups/attempt-statuses')
  @Permissions('training.assessments.view')
  attemptStatusesLookup() {
    return this.certAssessment.lookup('attemptStatuses');
  }

  @Get('lookups/assessment-result-statuses')
  @Permissions('training.assessments.view')
  assessmentResultStatusesLookup() {
    return this.certAssessment.lookup('assessmentResultStatuses');
  }

  @Get('required-training')
  @Permissions('training.required.view')
  requiredTrainingRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.dashboard(user, query);
  }

  @Get('required-training/dashboard')
  @Permissions('training.required.dashboard.view')
  requiredTrainingDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.dashboard(user, query);
  }

  @Get('required-training/dashboard/summary')
  @Permissions('training.required.dashboard.view')
  requiredTrainingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.dashboardSummary(user, query);
  }

  @Get('required-training/dashboard/by-category')
  @Permissions('training.required.dashboard.view')
  requiredTrainingByCategory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.dashboardByCategory(user, query);
  }

  @Get('required-training/dashboard/by-status')
  @Permissions('training.required.dashboard.view')
  requiredTrainingByStatus(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.dashboardByStatus(user, query);
  }

  @Get('required-training/dashboard/review-overdue-preview')
  @Permissions('training.required.library.view')
  requiredTrainingReviewOverduePreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.reviewOverduePreview(user, query);
  }

  @Get('required-training/dashboard/matrix-unlinked-preview')
  @Permissions('training.required.library.view')
  requiredTrainingMatrixUnlinkedPreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.matrixUnlinkedPreview(user, query);
  }

  @Get('required-training/library')
  @Permissions('training.required.library.view')
  requiredTrainingLibrary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, query);
  }

  @Get('required-training/library/summary')
  @Permissions('training.required.library.view')
  requiredTrainingLibrarySummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.librarySummary(user, query);
  }

  @Post('required-training/library')
  @Permissions('training.required.library.create')
  createRequiredTraining(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.requiredTraining.createItem(user, dto);
  }

  @Get('required-training/library/:trainingId/certifications')
  @Permissions('training.certifications.view')
  requiredTrainingCertificates(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.certificationRegister(user, { ...query, trainingItemId: trainingId });
  }

  @Get('required-training/library/:trainingId/assessments')
  @Permissions('training.assessments.library.view')
  requiredTrainingAssessments(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.assessmentLibrary(user, { ...query, trainingItemId: trainingId });
  }

  @Get('required-training/library/:trainingId')
  @Permissions('training.required.library.view')
  requiredTrainingDetail(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.detail(user, trainingId);
  }

  @Patch('required-training/library/:trainingId')
  @Permissions('training.required.library.edit')
  updateRequiredTraining(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.updateItem(user, trainingId, dto);
  }

  @Post('required-training/library/:trainingId/archive')
  @Permissions('training.required.library.archive')
  archiveRequiredTraining(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.archive(user, trainingId, dto);
  }

  @Post('required-training/library/:trainingId/reactivate')
  @Permissions('training.required.library.reactivate')
  reactivateRequiredTraining(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.reactivate(user, trainingId, dto);
  }

  @Post('required-training/library/:trainingId/activate')
  @Permissions('training.required.library.activate')
  activateRequiredTraining(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.activate(user, trainingId);
  }

  @Post('required-training/library/:trainingId/new-version')
  @Permissions('training.required.library.new_version')
  newRequiredTrainingVersion(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.newVersion(user, trainingId, dto);
  }

  @Get('required-training/library/:trainingId/content')
  @Permissions('training.required.library.view')
  requiredTrainingContent(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.content(user, trainingId);
  }

  @Post('required-training/library/:trainingId/content')
  @Permissions('training.required.content.manage')
  addRequiredTrainingContent(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.addContentSection(user, trainingId, dto);
  }

  @Patch('required-training/library/:trainingId/content/:sectionId')
  @Permissions('training.required.content.manage')
  updateRequiredTrainingContent(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('sectionId') sectionId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.updateContentSection(user, trainingId, sectionId, dto);
  }

  @Delete('required-training/library/:trainingId/content/:sectionId')
  @Permissions('training.required.content.manage')
  deleteRequiredTrainingContent(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('sectionId') sectionId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.deleteContentSection(user, trainingId, sectionId, dto);
  }

  @Get('required-training/library/:trainingId/delivery-rules')
  @Permissions('training.required.library.view')
  requiredTrainingDelivery(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.deliveryRules(user, trainingId);
  }

  @Patch('required-training/library/:trainingId/delivery-rules')
  @Permissions('training.required.delivery.manage')
  patchRequiredTrainingDelivery(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.patchDeliveryRules(user, trainingId, dto);
  }

  @Get('required-training/library/:trainingId/evidence-rules')
  @Permissions('training.required.library.view')
  requiredTrainingEvidence(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.evidenceRules(user, trainingId);
  }

  @Patch('required-training/library/:trainingId/evidence-rules')
  @Permissions('training.required.evidence.manage')
  patchRequiredTrainingEvidence(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.patchEvidenceRules(user, trainingId, dto);
  }

  @Get('required-training/library/:trainingId/applicability')
  @Permissions('training.required.library.view')
  requiredTrainingApplicability(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.applicability(user, trainingId);
  }

  @Post('required-training/library/:trainingId/applicability')
  @Permissions('training.required.scope.manage')
  addRequiredTrainingApplicability(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.addApplicability(user, trainingId, dto);
  }

  @Patch('required-training/library/:trainingId/applicability/:scopeId')
  @Permissions('training.required.scope.manage')
  updateRequiredTrainingApplicability(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('scopeId') scopeId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.updateApplicability(user, trainingId, scopeId, dto);
  }

  @Delete('required-training/library/:trainingId/applicability/:scopeId')
  @Permissions('training.required.scope.manage')
  deleteRequiredTrainingApplicability(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('scopeId') scopeId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.deleteApplicability(user, trainingId, scopeId, dto);
  }

  @Get('required-training/library/:trainingId/links')
  @Permissions('training.required.library.view')
  requiredTrainingLinks(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.links(user, trainingId);
  }

  @Post('required-training/library/:trainingId/links')
  @Permissions('training.required.link.manage')
  addRequiredTrainingLink(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.addLink(user, trainingId, dto);
  }

  @Delete('required-training/library/:trainingId/links/:linkId')
  @Permissions('training.required.link.manage')
  deleteRequiredTrainingLink(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.removeLink(user, trainingId, linkId, dto);
  }

  @Get('required-training/library/:trainingId/documents')
  @Permissions('training.required.library.view')
  requiredTrainingDocuments(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.documents(user, trainingId);
  }

  @Post('required-training/library/:trainingId/documents/link')
  @Permissions('training.required.document.link')
  linkRequiredTrainingDocument(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.linkDocument(user, trainingId, dto);
  }

  @Delete('required-training/library/:trainingId/documents/:documentLinkId')
  @Permissions('training.required.document.remove')
  removeRequiredTrainingDocument(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.removeDocument(user, trainingId, documentLinkId, dto);
  }

  @Get('required-training/library/:trainingId/matrix-links')
  @Permissions('training.required.library.view')
  requiredTrainingMatrixLinks(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.matrixLinks(user, trainingId);
  }

  @Post('required-training/library/:trainingId/matrix-links')
  @Permissions('training.required.matrix.link')
  addRequiredTrainingMatrixLink(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.addMatrixLink(user, trainingId, dto);
  }

  @Get('required-training/library/:trainingId/preview-matrix-impact')
  @Permissions('training.required.library.view')
  previewRequiredTrainingMatrixImpact(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.previewMatrixImpact(user, trainingId);
  }

  @Post('required-training/library/:trainingId/sync-to-matrix')
  @Permissions('training.required.matrix.sync')
  syncRequiredTrainingMatrix(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.syncToMatrix(user, trainingId);
  }

  @Get('required-training/matrix-unlinked')
  @Permissions('training.required.library.view')
  requiredTrainingMatrixUnlinked(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.matrixUnlinked(user, query);
  }

  @Post('required-training/link-temp-ref')
  @Permissions('training.required.matrix.link')
  linkRequiredTrainingTempRef(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.requiredTraining.linkTemporaryMatrixReference(user, dto);
  }

  @Get('required-training/library/:trainingId/competency-links')
  @Permissions('training.required.library.view')
  requiredTrainingCompetencyLinks(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.competencyLinks(user, trainingId);
  }

  @Post('required-training/library/:trainingId/competency-links')
  @Permissions('training.required.competency.link')
  addRequiredTrainingCompetencyLink(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.addCompetencyLink(user, trainingId, dto);
  }

  @Post('required-training/library/:trainingId/sync-to-competency-profiles')
  @Permissions('training.required.competency.link')
  syncRequiredTrainingCompetency(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.syncToCompetencyProfiles(user, trainingId);
  }

  @Post('required-training/library/:trainingId/submit-review')
  @Permissions('training.required.submit_review')
  submitRequiredTrainingReview(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.submitReview(user, trainingId, dto);
  }

  @Post('required-training/library/:trainingId/approve')
  @Permissions('training.required.approve')
  approveRequiredTraining(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Body() dto: Record<string, any>) {
    return this.requiredTraining.approve(user, trainingId, dto);
  }

  @Get('required-training/library/:trainingId/version-history')
  @Permissions('training.required.history.view')
  requiredTrainingVersionHistory(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string) {
    return this.requiredTraining.versionHistory(user, trainingId);
  }

  @Get('required-training/library/:trainingId/history')
  @Permissions('training.required.history.view')
  requiredTrainingItemHistory(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.requiredTraining.history(user, { ...query, trainingId });
  }

  @Get('required-training/history')
  @Permissions('training.required.history.view')
  requiredTrainingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.history(user, query);
  }

  @Get('required-training/export')
  @Permissions('training.required.export')
  exportRequiredTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.exportLibrary(user, query);
  }

  @Get('required-training/import/template')
  @Permissions('training.required.import')
  requiredTrainingImportTemplate(@CurrentUser() user: RequestUser) {
    return this.requiredTraining.importTemplate(user);
  }

  @Post('required-training/import')
  @Permissions('training.required.import')
  requiredTrainingImport(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.requiredTraining.importJob(user, dto);
  }

  @Get('required-training/settings')
  @Permissions('training.required.settings.view')
  requiredTrainingSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.settings(user, query);
  }

  @Patch('required-training/settings')
  @Permissions('training.required.settings.edit')
  updateRequiredTrainingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.requiredTraining.updateSettings(user, dto);
  }

  @Get('required-training/context')
  @Permissions('training.required.view')
  requiredTrainingContext(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.context(user, query);
  }

  @Get('required-training/lookups')
  @Permissions('training.required.view')
  requiredTrainingLookups() {
    return this.requiredTraining.lookups();
  }

  @Get('required-training/safety-critical')
  @Permissions('training.required.library.view')
  requiredTrainingSafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, safetyCritical: 'true' });
  }

  @Get('required-training/ptw-critical')
  @Permissions('training.required.library.view')
  requiredTrainingPtwCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, ptwCritical: 'true' });
  }

  @Get('required-training/psm-critical')
  @Permissions('training.required.library.view')
  requiredTrainingPsmCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, psmCritical: 'true' });
  }

  @Get('required-training/review-overdue')
  @Permissions('training.required.library.view')
  requiredTrainingReviewOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, reviewOverdue: 'true' });
  }

  @Get('required-training/pending-approval')
  @Permissions('training.required.library.view')
  requiredTrainingPendingApproval(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, reviewStatus: 'Pending Review' });
  }

  @Get('sites/:siteId/required-training')
  @Permissions('training.required.library.view')
  requiredTrainingBySite(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, siteId });
  }

  @Get('units/:unitId/required-training')
  @Permissions('training.required.library.view')
  requiredTrainingByUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, unitId });
  }

  @Get('areas/:areaId/required-training')
  @Permissions('training.required.library.view')
  requiredTrainingByArea(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.requiredTraining.library(user, { ...query, areaId });
  }

  @Get('training-records')
  @Permissions('training.records.view')
  trainingRecordsRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.dashboard(user, query);
  }

  @Get('training-records/dashboard')
  @Permissions('training.records.dashboard.view')
  trainingRecordsDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.dashboard(user, query);
  }

  @Get('training-records/dashboard/summary')
  @Permissions('training.records.dashboard.view')
  trainingRecordsDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.dashboardSummary(user, query);
  }

  @Get('training-records/dashboard/by-site')
  @Permissions('training.records.dashboard.view')
  trainingRecordsDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.dashboardBySite(user, query);
  }

  @Get('training-records/dashboard/by-unit')
  @Permissions('training.records.dashboard.view')
  trainingRecordsDashboardByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.dashboardByUnit(user, query);
  }

  @Get('training-records/dashboard/pending-verification-preview')
  @Permissions('training.records.completion.view')
  trainingRecordsPendingVerificationPreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.pendingVerificationPreview(user, query);
  }

  @Get('training-records/dashboard/missing-evidence-preview')
  @Permissions('training.records.completion.view')
  trainingRecordsMissingEvidencePreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.missingEvidencePreview(user, query);
  }

  @Get('training-records/sessions')
  @Permissions('training.records.session.view')
  trainingSessions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.sessions(user, query);
  }

  @Get('training-records/sessions/summary')
  @Permissions('training.records.session.view')
  trainingSessionsSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.sessionsSummary(user, query);
  }

  @Post('training-records/sessions')
  @Permissions('training.records.session.create')
  createTrainingSession(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.records.createSession(user, dto);
  }

  @Get('training-records/sessions/:sessionId')
  @Permissions('training.records.session.view')
  trainingSessionDetail(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.sessionDetail(user, sessionId);
  }

  @Patch('training-records/sessions/:sessionId')
  @Permissions('training.records.session.edit')
  updateTrainingSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.updateSession(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/cancel')
  @Permissions('training.records.session.cancel')
  cancelTrainingSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.cancelSession(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/archive')
  @Permissions('training.records.session.archive')
  archiveTrainingSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.archiveSession(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/complete')
  @Permissions('training.records.session.edit')
  completeTrainingSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.completeSession(user, sessionId, dto);
  }

  @Get('training-records/sessions/:sessionId/roster')
  @Permissions('training.records.roster.view')
  trainingSessionRoster(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.roster(user, sessionId);
  }

  @Post('training-records/sessions/:sessionId/roster')
  @Permissions('training.records.roster.manage')
  addTrainingSessionRoster(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.addRoster(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/roster/from-matrix-gaps')
  @Permissions('training.records.roster.manage')
  trainingSessionRosterFromMatrixGaps(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.addRosterFromMatrixGaps(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/roster/from-required-training')
  @Permissions('training.records.roster.manage')
  trainingSessionRosterFromRequiredTraining(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.addRosterFromRequiredTraining(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/roster/from-role')
  @Permissions('training.records.roster.manage')
  trainingSessionRosterFromRole(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.addRosterFromRole(user, sessionId, dto);
  }

  @Delete('training-records/sessions/:sessionId/roster/:rosterId')
  @Permissions('training.records.roster.manage')
  removeTrainingSessionRoster(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Param('rosterId') rosterId: string, @Body() dto: Record<string, any>) {
    return this.records.removeRoster(user, sessionId, rosterId, dto);
  }

  @Get('training-records/sessions/:sessionId/attendance')
  @Permissions('training.records.attendance.view')
  trainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.attendance(user, sessionId);
  }

  @Post('training-records/sessions/:sessionId/attendance')
  @Permissions('training.records.attendance.record')
  saveTrainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.saveAttendance(user, sessionId, dto);
  }

  @Patch('training-records/sessions/:sessionId/attendance/:attendanceId')
  @Permissions('training.records.attendance.record')
  updateTrainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Param('attendanceId') attendanceId: string, @Body() dto: Record<string, any>) {
    return this.records.updateAttendance(user, sessionId, attendanceId, dto);
  }

  @Post('training-records/sessions/:sessionId/attendance/mark-all-present')
  @Permissions('training.records.attendance.record')
  markTrainingSessionAllPresent(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.markAllPresent(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/attendance/submit')
  @Permissions('training.records.attendance.submit')
  submitTrainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.submitAttendance(user, sessionId, dto);
  }

  @Post('training-records/sessions/:sessionId/attendance/lock')
  @Permissions('training.records.attendance.lock')
  lockTrainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.lockAttendance(user, sessionId);
  }

  @Post('training-records/sessions/:sessionId/attendance/:attendanceId/correct')
  @Permissions('training.records.attendance.correct')
  correctTrainingSessionAttendance(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Param('attendanceId') attendanceId: string, @Body() dto: Record<string, any>) {
    return this.records.correctAttendance(user, sessionId, attendanceId, dto);
  }

  @Get('training-records/sessions/:sessionId/evidence')
  @Permissions('training.records.view')
  trainingSessionEvidence(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.sessionEvidence(user, sessionId);
  }

  @Get('training-records/sessions/:sessionId/links')
  @Permissions('training.records.view')
  trainingSessionLinks(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.records.sessionLinks(user, sessionId);
  }

  @Post('training-records/sessions/:sessionId/links')
  @Permissions('training.records.evidence.link')
  addTrainingSessionLink(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: Record<string, any>) {
    return this.records.addSessionLink(user, sessionId, dto);
  }

  @Delete('training-records/sessions/:sessionId/links/:linkId')
  @Permissions('training.records.evidence.remove')
  removeTrainingSessionLink(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.records.removeSessionLink(user, sessionId, linkId, dto);
  }

  @Get('training-records/records')
  @Permissions('training.records.completion.view')
  completionRecords(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.records(user, query);
  }

  @Post('training-records/records')
  @Permissions('training.records.completion.manual_entry')
  createCompletionRecord(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.records.createRecord(user, dto);
  }

  @Get('training-records/records/:recordId')
  @Permissions('training.records.completion.view')
  completionRecordDetail(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string) {
    return this.records.recordDetail(user, recordId);
  }

  @Patch('training-records/records/:recordId')
  @Permissions('training.records.completion.edit')
  updateCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.updateRecord(user, recordId, dto);
  }

  @Post('training-records/records/:recordId/verify')
  @Permissions('training.records.completion.verify')
  verifyCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.verifyRecord(user, recordId, dto);
  }

  @Post('training-records/records/:recordId/reject')
  @Permissions('training.records.completion.reject')
  rejectCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.rejectRecord(user, recordId, dto);
  }

  @Post('training-records/records/:recordId/approve')
  @Permissions('training.records.completion.approve')
  approveCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.approveRecord(user, recordId, dto);
  }

  @Post('training-records/records/:recordId/reopen')
  @Permissions('training.records.completion.reopen')
  reopenCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.reopenRecord(user, recordId, dto);
  }

  @Post('training-records/records/:recordId/recalculate-status')
  @Permissions('training.records.completion.edit')
  recalculateCompletionRecord(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string) {
    return this.records.recalculateRecordStatus(user, recordId);
  }

  @Get('training-records/records/:recordId/evidence')
  @Permissions('training.records.completion.view')
  completionRecordEvidence(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string) {
    return this.records.recordEvidence(user, recordId);
  }

  @Post('training-records/records/:recordId/evidence/link')
  @Permissions('training.records.evidence.link')
  linkCompletionRecordEvidence(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.linkEvidence(user, recordId, dto);
  }

  @Delete('training-records/records/:recordId/evidence/:evidenceId')
  @Permissions('training.records.evidence.remove')
  removeCompletionRecordEvidence(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) {
    return this.records.removeEvidence(user, recordId, evidenceId, dto);
  }

  @Post('training-records/records/:recordId/evidence/:evidenceId/verify')
  @Permissions('training.records.evidence.verify')
  verifyCompletionRecordEvidence(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Param('evidenceId') evidenceId: string) {
    return this.records.verifyEvidence(user, recordId, evidenceId);
  }

  @Post('training-records/records/:recordId/evidence/:evidenceId/reject')
  @Permissions('training.records.evidence.verify')
  rejectCompletionRecordEvidence(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) {
    return this.records.rejectEvidence(user, recordId, evidenceId, dto);
  }

  @Get('training-records/records/:recordId/links')
  @Permissions('training.records.completion.view')
  completionRecordLinks(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string) {
    return this.records.recordLinks(user, recordId);
  }

  @Post('training-records/records/:recordId/links')
  @Permissions('training.records.evidence.link')
  addCompletionRecordLink(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) {
    return this.records.addRecordLink(user, recordId, dto);
  }

  @Delete('training-records/records/:recordId/links/:linkId')
  @Permissions('training.records.evidence.remove')
  removeCompletionRecordLink(@CurrentUser() user: RequestUser, @Param('recordId') recordId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.records.removeRecordLink(user, recordId, linkId, dto);
  }

  @Get('training-records/attendance')
  @Permissions('training.records.attendance.view')
  trainingRecordsAttendanceView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.view(user, query);
  }

  @Get('training-records/completions')
  @Permissions('training.records.completion.view')
  trainingRecordsCompletionsView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.records(user, query);
  }

  @Get('training-records/missing-attendance')
  @Permissions('training.records.attendance.view')
  trainingRecordsMissingAttendance(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.sessions(user, { ...query, sessionStatus: query.sessionStatus ?? 'Scheduled' });
  }

  @Get('training-records/pending-verification')
  @Permissions('training.records.completion.view')
  trainingRecordsPendingVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, verificationStatus: 'Pending' });
  }

  @Get('training-records/pending-approval')
  @Permissions('training.records.completion.view')
  trainingRecordsPendingApproval(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, approvalStatus: 'Pending Approval' });
  }

  @Get('training-records/failed-incomplete')
  @Permissions('training.records.completion.view')
  trainingRecordsFailedIncomplete(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, completionStatus: query.completionStatus ?? 'Incomplete' });
  }

  @Get('training-records/manual-corrections')
  @Permissions('training.records.attendance.correct')
  trainingRecordsManualCorrections(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.manualCorrections(user, query);
  }

  @Get('training-records/import-template')
  @Permissions('training.records.import')
  trainingRecordsImportTemplate() {
    return this.records.importTemplate();
  }

  @Post('training-records/import')
  @Permissions('training.records.import')
  trainingRecordsImport(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.records.importJob(user, dto);
  }

  @Get('training-records/export')
  @Permissions('training.records.export')
  trainingRecordsExport(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.export(user, query);
  }

  @Get('training-records/history')
  @Permissions('training.records.history.view')
  trainingRecordsHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.history(user, query);
  }

  @Get('training-records/settings')
  @Permissions('training.records.settings.view')
  trainingRecordsSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.settings(user, query);
  }

  @Patch('training-records/settings')
  @Permissions('training.records.settings.edit')
  updateTrainingRecordsSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.records.updateSettings(user, dto);
  }

  @Get('training-records/context')
  @Permissions('training.records.view')
  trainingRecordsContext(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.records.context(user, query);
  }

  @Get('lookups/session-types')
  @Permissions('training.records.view')
  lookupTrainingSessionTypes() {
    return this.records.lookups()['session-types'];
  }

  @Get('lookups/session-statuses')
  @Permissions('training.records.view')
  lookupTrainingSessionStatuses() {
    return this.records.lookups()['session-statuses'];
  }

  @Get('lookups/attendance-methods')
  @Permissions('training.records.view')
  lookupAttendanceMethods() {
    return this.records.lookups()['attendance-methods'];
  }

  @Get('lookups/attendance-statuses')
  @Permissions('training.records.view')
  lookupAttendanceStatuses() {
    return this.records.lookups()['attendance-statuses'];
  }

  @Get('lookups/roster-statuses')
  @Permissions('training.records.view')
  lookupRosterStatuses() {
    return this.records.lookups()['roster-statuses'];
  }

  @Get('lookups/completion-statuses')
  @Permissions('training.records.view')
  lookupCompletionStatuses() {
    return this.records.lookups()['completion-statuses'];
  }

  @Get('lookups/evidence-statuses')
  @Permissions('training.records.view')
  lookupEvidenceStatuses() {
    return this.records.lookups()['evidence-statuses'];
  }

  @Get('lookups/verification-statuses')
  @Permissions('training.records.view')
  lookupVerificationStatuses() {
    return this.records.lookups()['verification-statuses'];
  }

  @Get('lookups/training-record-approval-statuses')
  @Permissions('training.records.view')
  lookupTrainingRecordApprovalStatuses() {
    return this.records.lookups()['training-record-approval-statuses'];
  }

  @Get('lookups/training-record-link-types')
  @Permissions('training.records.view')
  lookupTrainingRecordLinkTypes() {
    return this.records.lookups()['training-record-link-types'];
  }

  @Get('workforce/:workerId/training-records')
  @Permissions('training.records.completion.view')
  workerTrainingRecords(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, workerId });
  }

  @Get('workforce/:workerId/certifications')
  @Permissions('training.certifications.view')
  workerCertifications(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.workerCertifications(user, workerId, query);
  }

  @Get('workforce/:workerId/certifications/:certificateId')
  @Permissions('training.certifications.view')
  workerCertificateDetail(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string) {
    return this.certAssessment.certificateDetail(user, certificateId);
  }

  @Get('workforce/:workerId/assessments')
  @Permissions('training.assessments.view')
  workerAssessments(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.workerAssessments(user, workerId, query);
  }

  @Get('workforce/:workerId/assessment-results')
  @Permissions('training.assessments.view')
  workerAssessmentResults(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.workerAssessmentResults(user, workerId, query);
  }

  @Get('workforce/:workerId/expiry-overdue')
  @Permissions('training.certifications.view', 'training.assessments.view')
  workerExpiryOverdue(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.certAssessment.expiryOverdue(user, { ...query, workerId });
  }

  @Get('workforce/:workerId/attendance')
  @Permissions('training.records.attendance.view')
  workerTrainingAttendance(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.records.view(user, { ...query, workerId });
  }

  @Get('workforce/:workerId/completions')
  @Permissions('training.records.completion.view')
  workerTrainingCompletions(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, workerId });
  }

  @Get('required-training/library/:trainingId/records')
  @Permissions('training.records.completion.view')
  requiredTrainingCompletionRecords(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, trainingId });
  }

  @Get('required-training/library/:trainingId/sessions')
  @Permissions('training.records.session.view')
  requiredTrainingSessions(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.records.sessions(user, { ...query, trainingItemId: trainingId });
  }

  @Get('required-training/library/:trainingId/attendance')
  @Permissions('training.records.attendance.view')
  requiredTrainingAttendance(@CurrentUser() user: RequestUser, @Param('trainingId') trainingId: string, @Query() query: Record<string, any>) {
    return this.records.view(user, { ...query, trainingId });
  }

  @Get('sites/:siteId/training-records')
  @Permissions('training.records.view')
  trainingRecordsBySite(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.records.dashboard(user, { ...query, siteId });
  }

  @Get('units/:unitId/training-records')
  @Permissions('training.records.view')
  trainingRecordsByUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, unitId });
  }

  @Get('areas/:areaId/training-records')
  @Permissions('training.records.view')
  trainingRecordsByArea(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.records.records(user, { ...query, areaId });
  }

  @Get('training-matrix')
  @Permissions('training.matrix.view')
  trainingMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.matrix(user, query);
  }

  @Get('roles-competency-profiles')
  @Permissions('training.competency.view')
  competencyRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboard(user, query);
  }

  @Get('roles-competency-profiles/dashboard')
  @Permissions('training.competency.dashboard.view')
  competencyDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboard(user, query);
  }

  @Get('roles-competency-profiles/dashboard/summary')
  @Permissions('training.competency.dashboard.view')
  competencyDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboardSummary(user, query);
  }

  @Get('roles-competency-profiles/dashboard/by-site')
  @Permissions('training.competency.dashboard.view')
  competencyDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboardBySite(user, query);
  }

  @Get('roles-competency-profiles/dashboard/by-unit')
  @Permissions('training.competency.dashboard.view')
  competencyDashboardByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboardByUnit(user, query);
  }

  @Get('roles-competency-profiles/dashboard/by-role')
  @Permissions('training.competency.dashboard.view')
  competencyDashboardByRole(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.dashboardByRole(user, query);
  }

  @Get('roles-competency-profiles/dashboard/gaps-preview')
  @Permissions('training.competency.gap.view')
  competencyDashboardGapsPreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.gaps(user, { ...query, safetyCritical: 'true', limit: query.limit ?? 8 });
  }

  @Get('roles-competency-profiles/profiles')
  @Permissions('training.competency.profile.view')
  competencyProfiles(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, query);
  }

  @Post('roles-competency-profiles/profiles')
  @Permissions('training.competency.profile.create')
  createCompetencyProfile(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.competency.createProfile(user, dto);
  }

  @Get('roles-competency-profiles/profiles/:profileId')
  @Permissions('training.competency.profile.view')
  competencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.profile(user, profileId);
  }

  @Patch('roles-competency-profiles/profiles/:profileId')
  @Permissions('training.competency.profile.edit')
  updateCompetencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.updateProfile(user, profileId, dto);
  }

  @Post('roles-competency-profiles/profiles/:profileId/archive')
  @Permissions('training.competency.profile.archive')
  archiveCompetencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.archiveProfile(user, profileId, dto);
  }

  @Post('roles-competency-profiles/profiles/:profileId/reactivate')
  @Permissions('training.competency.profile.activate')
  reactivateCompetencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.setProfileActive(user, profileId, true);
  }

  @Post('roles-competency-profiles/profiles/:profileId/activate')
  @Permissions('training.competency.profile.activate')
  activateCompetencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.setProfileActive(user, profileId, true);
  }

  @Post('roles-competency-profiles/profiles/:profileId/new-version')
  @Permissions('training.competency.profile.new_version')
  newCompetencyProfileVersion(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.newVersion(user, profileId, dto);
  }

  @Post('roles-competency-profiles/profiles/:profileId/submit-review')
  @Permissions('training.competency.profile.submit_review')
  submitCompetencyProfileReview(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.submitReview(user, profileId, dto);
  }

  @Post('roles-competency-profiles/profiles/:profileId/approve')
  @Permissions('training.competency.profile.approve')
  approveCompetencyProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.approveProfile(user, profileId, dto);
  }

  @Get('roles-competency-profiles/profiles/:profileId/duties')
  @Permissions('training.competency.requirement.view')
  competencyProfileDuties(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.duties(user, profileId);
  }

  @Post('roles-competency-profiles/profiles/:profileId/duties')
  @Permissions('training.competency.requirement.manage')
  createCompetencyProfileDuty(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.createDuty(user, profileId, dto);
  }

  @Patch('roles-competency-profiles/profiles/:profileId/duties/:dutyId')
  @Permissions('training.competency.requirement.manage')
  updateCompetencyProfileDuty(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Param('dutyId') dutyId: string, @Body() dto: Record<string, any>) {
    return this.competency.updateDuty(user, profileId, dutyId, dto);
  }

  @Delete('roles-competency-profiles/profiles/:profileId/duties/:dutyId')
  @Permissions('training.competency.requirement.manage')
  removeCompetencyProfileDuty(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Param('dutyId') dutyId: string, @Body() dto: Record<string, any>) {
    return this.competency.removeDuty(user, profileId, dutyId, dto);
  }

  @Get('roles-competency-profiles/profiles/:profileId/requirements')
  @Permissions('training.competency.requirement.view')
  competencyProfileRequirements(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.requirements(user, profileId);
  }

  @Post('roles-competency-profiles/profiles/:profileId/requirements')
  @Permissions('training.competency.requirement.manage')
  createCompetencyRequirement(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) {
    return this.competency.createRequirement(user, profileId, dto);
  }

  @Patch('roles-competency-profiles/profiles/:profileId/requirements/:requirementId')
  @Permissions('training.competency.requirement.manage')
  updateCompetencyRequirement(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.competency.updateRequirement(user, profileId, requirementId, dto);
  }

  @Delete('roles-competency-profiles/profiles/:profileId/requirements/:requirementId')
  @Permissions('training.competency.requirement.manage')
  removeCompetencyRequirement(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.competency.removeRequirement(user, profileId, requirementId, dto);
  }

  @Get('roles-competency-profiles/competencies')
  @Permissions('training.competency.library.view')
  competencyLibrary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.competencyLibrary(user, query);
  }

  @Post('roles-competency-profiles/competencies')
  @Permissions('training.competency.library.create')
  createCompetency(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.competency.createCompetency(user, dto);
  }

  @Get('roles-competency-profiles/competencies/:competencyId')
  @Permissions('training.competency.library.view')
  competencyLibraryDetail(@CurrentUser() user: RequestUser, @Param('competencyId') competencyId: string) {
    return this.competency.competency(user, competencyId);
  }

  @Patch('roles-competency-profiles/competencies/:competencyId')
  @Permissions('training.competency.library.edit')
  updateCompetency(@CurrentUser() user: RequestUser, @Param('competencyId') competencyId: string, @Body() dto: Record<string, any>) {
    return this.competency.updateCompetency(user, competencyId, dto);
  }

  @Post('roles-competency-profiles/competencies/:competencyId/archive')
  @Permissions('training.competency.library.edit')
  archiveCompetency(@CurrentUser() user: RequestUser, @Param('competencyId') competencyId: string, @Body() dto: Record<string, any>) {
    return this.competency.archiveCompetency(user, competencyId, dto);
  }

  @Get('roles-competency-profiles/assignments')
  @Permissions('training.competency.assignment.view')
  competencyAssignments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.assignments(user, query);
  }

  @Post('roles-competency-profiles/assignments')
  @Permissions('training.competency.assignment.create')
  assignCompetencyProfile(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.competency.assignProfile(user, dto);
  }

  @Delete('roles-competency-profiles/assignments/:assignmentId')
  @Permissions('training.competency.assignment.remove')
  removeCompetencyAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.competency.removeAssignment(user, assignmentId, dto);
  }

  @Post('roles-competency-profiles/evaluate')
  @Permissions('training.competency.evaluate')
  evaluateCompetency(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.competency.evaluate(user, dto);
  }

  @Get('roles-competency-profiles/evaluation-runs')
  @Permissions('training.competency.view')
  competencyEvaluationRuns(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.evaluationRuns(user, query);
  }

  @Get('roles-competency-profiles/evaluation-runs/:runId')
  @Permissions('training.competency.view')
  competencyEvaluationRun(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.competency.runDetail(user, runId);
  }

  @Post('roles-competency-profiles/evaluation-runs/:runId/retry')
  @Permissions('training.competency.evaluate')
  retryCompetencyEvaluationRun(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.competency.evaluate(user, { runId, triggeredByType: 'Retry' });
  }

  @Get('roles-competency-profiles/gaps')
  @Permissions('training.competency.gap.view')
  competencyGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.gaps(user, query);
  }

  @Get('roles-competency-profiles/safety-critical')
  @Permissions('training.competency.gap.view')
  competencySafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.gaps(user, { ...query, safetyCritical: 'true' });
  }

  @Get('roles-competency-profiles/ptw-critical')
  @Permissions('training.competency.gap.view')
  competencyPtwCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.gaps(user, { ...query, ptwCritical: 'true' });
  }

  @Get('roles-competency-profiles/review-overdue')
  @Permissions('training.competency.profile.view')
  competencyReviewOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, { ...query, reviewOverdue: 'true' });
  }

  @Get('roles-competency-profiles/gaps/:gapId')
  @Permissions('training.competency.gap.view')
  competencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) {
    return this.competency.gap(user, gapId);
  }

  @Patch('roles-competency-profiles/gaps/:gapId')
  @Permissions('training.competency.gap.assign')
  updateCompetencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.updateGap(user, gapId, dto);
  }

  @Post('roles-competency-profiles/gaps/:gapId/assign')
  @Permissions('training.competency.gap.assign')
  assignCompetencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.assignGap(user, gapId, dto);
  }

  @Post('roles-competency-profiles/gaps/:gapId/create-action')
  @Permissions('training.competency.gap.assign')
  createCompetencyGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.createGapAction(user, gapId, dto);
  }

  @Post('roles-competency-profiles/gaps/:gapId/mark-resolved')
  @Permissions('training.competency.gap.close')
  resolveCompetencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.markGapResolved(user, gapId, dto);
  }

  @Post('roles-competency-profiles/gaps/:gapId/verify')
  @Permissions('training.competency.gap.verify')
  verifyCompetencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.verifyGap(user, gapId, dto);
  }

  @Post('roles-competency-profiles/gaps/:gapId/reopen')
  @Permissions('training.competency.gap.reopen')
  reopenCompetencyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.competency.reopenGap(user, gapId, dto);
  }

  @Post('roles-competency-profiles/profiles/:profileId/sync-to-matrix')
  @Permissions('training.competency.matrix.sync')
  syncCompetencyProfileToMatrix(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.syncToMatrix(user, profileId);
  }

  @Get('roles-competency-profiles/profiles/:profileId/matrix-sync-status')
  @Permissions('training.competency.profile.view')
  competencyProfileMatrixSyncStatus(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.matrixSyncStatus(user, profileId);
  }

  @Post('roles-competency-profiles/profiles/:profileId/preview-matrix-impact')
  @Permissions('training.competency.profile.view')
  competencyProfileMatrixImpact(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) {
    return this.competency.previewMatrixImpact(user, profileId);
  }

  @Get('roles-competency-profiles/history')
  @Permissions('training.history.view')
  competencyHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.history(user, query);
  }

  @Get('roles-competency-profiles/import-template')
  @Permissions('training.competency.import')
  competencyImportTemplate() {
    return { columns: ['profile_code', 'profile_name', 'profile_type', 'job_role', 'department_code', 'worker_type', 'employer_type', 'site_code', 'unit_code', 'area_code', 'assignment_mode', 'auto_assign', 'competency_code', 'competency_title', 'competency_category', 'required_level', 'mandatory', 'safety_critical', 'psm_critical', 'ptw_critical', 'recurring', 'renewal_interval_days', 'evidence_required', 'verification_required', 'assessment_required', 'certificate_required', 'sop_acknowledgement_required', 'practical_demonstration_required', 'supervisor_signoff_required', 'hse_signoff_required', 'minimum_passing_score', 'linked_training_code', 'linked_sop_reference', 'blocks_ptw_authorization', 'blocks_moc_implementation', 'blocks_pssr_startup', 'waiver_allowed', 'owner_email', 'reviewer_email', 'active'] };
  }

  @Post('roles-competency-profiles/import')
  @Permissions('training.competency.import')
  importCompetencyProfiles(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return { status: 'Validation Required', message: 'Import preview endpoint is available. File parsing/storage adapter is intentionally not duplicated in this phase.', rowsReceived: Array.isArray(dto.rows) ? dto.rows.length : 0, actorUserId: user.id };
  }

  @Get('roles-competency-profiles/export')
  @Permissions('training.competency.export')
  exportCompetencyProfiles(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, { ...query, limit: query.limit ?? 100 });
  }

  @Get('roles-competency-profiles/settings')
  @Permissions('training.competency.settings.view')
  competencySettings(@CurrentUser() user: RequestUser) {
    return this.competency.settings(user);
  }

  @Patch('roles-competency-profiles/settings')
  @Permissions('training.competency.settings.edit')
  updateCompetencySettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.competency.updateSettings(user, dto);
  }

  @Get('training-matrix/dashboard')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.dashboard(user, query);
  }

  @Get('training-matrix/dashboard/summary')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.dashboardSummary(user, query);
  }

  @Get('training-matrix/dashboard/by-site')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.dashboardBySite(user, query);
  }

  @Get('training-matrix/dashboard/by-unit')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.dashboardByUnit(user, query);
  }

  @Get('training-matrix/dashboard/by-role')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixByRole(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.dashboardByRole(user, query);
  }

  @Get('training-matrix/dashboard/safety-critical-gaps-preview')
  @Permissions('training.matrix.dashboard.view')
  trainingMatrixSafetyCriticalPreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, { ...query, safetyCritical: 'true', limit: query.limit ?? 8 });
  }

  @Get('training-matrix/worker-view')
  @Permissions('training.matrix.view')
  trainingMatrixWorkerView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.matrix(user, query);
  }

  @Get('training-matrix/role-view')
  @Permissions('training.matrix.view')
  trainingMatrixRoleView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.roleView(user, query);
  }

  @Get('training-matrix/unit-view')
  @Permissions('training.matrix.view')
  trainingMatrixUnitView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.unitView(user, query);
  }

  @Get('training-matrix/rules')
  @Permissions('training.matrix.rule.view')
  matrixRules(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.rules(user, query);
  }

  @Post('training-matrix/rules')
  @Permissions('training.matrix.rule.create')
  createMatrixRule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.matrix.createRule(user, dto);
  }

  @Get('training-matrix/rules/:ruleId')
  @Permissions('training.matrix.rule.view')
  matrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.matrix.rule(user, ruleId);
  }

  @Patch('training-matrix/rules/:ruleId')
  @Permissions('training.matrix.rule.edit')
  updateMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Record<string, any>) {
    return this.matrix.updateRule(user, ruleId, dto);
  }

  @Post('training-matrix/rules/:ruleId/archive')
  @Permissions('training.matrix.rule.archive')
  archiveMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Record<string, any>) {
    return this.matrix.archiveRule(user, ruleId, dto);
  }

  @Post('training-matrix/rules/:ruleId/reactivate')
  @Permissions('training.matrix.rule.activate')
  reactivateMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.matrix.setRuleActive(user, ruleId, true);
  }

  @Post('training-matrix/rules/:ruleId/activate')
  @Permissions('training.matrix.rule.activate')
  activateMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.matrix.setRuleActive(user, ruleId, true);
  }

  @Post('training-matrix/rules/:ruleId/deactivate')
  @Permissions('training.matrix.rule.activate')
  deactivateMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.matrix.setRuleActive(user, ruleId, false);
  }

  @Post('training-matrix/rules/:ruleId/preview-affected-workers')
  @Permissions('training.matrix.rule.view')
  previewAffectedWorkers(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.matrix.previewAffectedWorkers(user, ruleId);
  }

  @Post('training-matrix/evaluate')
  @Permissions('training.matrix.evaluate')
  evaluateMatrix(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.matrix.evaluate(user, dto);
  }

  @Get('training-matrix/evaluations')
  @Permissions('training.matrix.view')
  matrixEvaluations(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.evaluations(user, query);
  }

  @Get('training-matrix/run-history')
  @Permissions('training.matrix.view')
  matrixRunHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.runHistory(user, query);
  }

  @Get('training-matrix/run-history/:runId')
  @Permissions('training.matrix.view')
  matrixRunDetail(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.matrix.runDetail(user, runId);
  }

  @Post('training-matrix/run-history/:runId/retry')
  @Permissions('training.matrix.evaluate')
  retryMatrixRun(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.matrix.evaluate(user, { runId, triggeredByType: 'Retry' });
  }

  @Post('training-matrix/run-history/:runId/cancel')
  @Permissions('training.matrix.evaluate')
  cancelMatrixRun(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.matrix.cancelRun(user, runId);
  }

  @Get('training-matrix/gaps')
  @Permissions('training.matrix.gap.view')
  matrixGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, query);
  }

  @Get('training-matrix/overdue')
  @Permissions('training.matrix.gap.view')
  matrixOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, { ...query, gapType: 'Overdue Training' });
  }

  @Get('training-matrix/expiring')
  @Permissions('training.matrix.gap.view')
  matrixExpiring(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, { ...query, gapType: 'Expiring Training' });
  }

  @Get('training-matrix/safety-critical-gaps')
  @Permissions('training.matrix.gap.view')
  matrixSafetyCriticalGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, { ...query, safetyCritical: 'true' });
  }

  @Get('training-matrix/gaps/:gapId')
  @Permissions('training.matrix.gap.view')
  matrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) {
    return this.matrix.gap(user, gapId);
  }

  @Patch('training-matrix/gaps/:gapId')
  @Permissions('training.matrix.gap.assign')
  updateMatrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.updateGap(user, gapId, dto);
  }

  @Post('training-matrix/gaps/:gapId/assign')
  @Permissions('training.matrix.gap.assign')
  assignMatrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.assignGap(user, gapId, dto);
  }

  @Post('training-matrix/gaps/:gapId/create-action')
  @Permissions('training.matrix.action.create')
  createMatrixGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.createGapAction(user, gapId, dto);
  }

  @Post('training-matrix/gaps/:gapId/mark-resolved')
  @Permissions('training.matrix.gap.close')
  resolveMatrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.markGapResolved(user, gapId, dto);
  }

  @Post('training-matrix/gaps/:gapId/verify')
  @Permissions('training.matrix.gap.verify')
  verifyMatrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.verifyGap(user, gapId, dto);
  }

  @Post('training-matrix/gaps/:gapId/reopen')
  @Permissions('training.matrix.gap.reopen')
  reopenMatrixGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.reopenGap(user, gapId, dto);
  }

  @Get('training-matrix/waivers')
  @Permissions('training.matrix.waiver.view')
  matrixWaivers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.waivers(user, query);
  }

  @Post('training-matrix/gaps/:gapId/waiver-request')
  @Permissions('training.matrix.waiver.request')
  requestMatrixWaiver(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.matrix.requestWaiver(user, gapId, dto);
  }

  @Post('training-matrix/waivers/:waiverId/approve')
  @Permissions('training.matrix.waiver.approve')
  approveMatrixWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.matrix.decideWaiver(user, waiverId, 'Approved', dto);
  }

  @Post('training-matrix/waivers/:waiverId/reject')
  @Permissions('training.matrix.waiver.reject')
  rejectMatrixWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.matrix.decideWaiver(user, waiverId, 'Rejected', dto);
  }

  @Post('training-matrix/waivers/:waiverId/revoke')
  @Permissions('training.matrix.waiver.revoke')
  revokeMatrixWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.matrix.decideWaiver(user, waiverId, 'Revoked', dto);
  }

  @Get('training-matrix/import-template')
  @Permissions('training.matrix.import')
  matrixImportTemplate() {
    return this.matrix.importTemplate();
  }

  @Post('training-matrix/import')
  @Permissions('training.matrix.import')
  importMatrixRules(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.matrix.importRules(user, dto);
  }

  @Get('training-matrix/export')
  @Permissions('training.matrix.export')
  exportMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.exportData(user, query);
  }

  @Get('training-matrix/history')
  @Permissions('training.history.view')
  matrixHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.matrix.history(user, query);
  }

  @Get('training-matrix/settings')
  @Permissions('training.matrix.settings.view')
  matrixSettings(@CurrentUser() user: RequestUser) {
    return this.matrix.settings(user);
  }

  @Patch('training-matrix/settings')
  @Permissions('training.matrix.settings.edit')
  updateMatrixSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.matrix.updateSettings(user, dto);
  }

  @Get('sites/:siteId/training-matrix')
  @Permissions('training.matrix.view')
  siteMatrix(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.matrix.matrix(user, { ...query, siteId });
  }

  @Get('sites/:siteId/competency-profiles')
  @Permissions('training.competency.profile.view')
  siteCompetencyProfiles(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, { ...query, siteId });
  }

  @Post('sites/:siteId/training-matrix/evaluate')
  @Permissions('training.matrix.evaluate.site')
  evaluateSiteMatrix(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string) {
    return this.matrix.evaluate(user, { siteId, runScope: 'Site' });
  }

  @Get('units/:unitId/training-matrix')
  @Permissions('training.matrix.view')
  unitMatrix(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.matrix.matrix(user, { ...query, unitId });
  }

  @Get('units/:unitId/competency-profiles')
  @Permissions('training.competency.profile.view')
  unitCompetencyProfiles(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, { ...query, unitId });
  }

  @Post('units/:unitId/training-matrix/evaluate')
  @Permissions('training.matrix.evaluate.unit')
  evaluateUnitMatrix(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.matrix.evaluate(user, { unitId, runScope: 'Unit' });
  }

  @Get('areas/:areaId/training-matrix')
  @Permissions('training.matrix.view')
  areaMatrix(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.matrix.matrix(user, { ...query, areaId });
  }

  @Get('areas/:areaId/competency-profiles')
  @Permissions('training.competency.profile.view')
  areaCompetencyProfiles(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.competency.profiles(user, { ...query, areaId });
  }

  @Get('workforce')
  @Permissions('training.workforce.view')
  workforce(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.workforce(user, query);
  }

  @Get('workforce/summary')
  @Permissions('training.workforce.view')
  workforceSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.workforceSummary(user, query);
  }

  @Get('workforce/missing-assignment')
  @Permissions('training.workforce.view')
  missingAssignment(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, missingAssignment: 'true' });
  }

  @Get('workforce/missing-role')
  @Permissions('training.workforce.view')
  missingRole(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, missingRole: 'true' });
  }

  @Get('workforce/training-overdue')
  @Permissions('training.workforce.view')
  trainingOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, trainingStatus: 'Overdue' });
  }

  @Get('workforce/certifications-expiring')
  @Permissions('training.workforce.view')
  workforceCertificationsExpiring(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, certificationStatus: 'Expiring Soon' });
  }

  @Get('workforce/ptw-authorization-gaps')
  @Permissions('training.workforce.view')
  ptwAuthorizationGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.filteredWorkers(user, { ...query, ptwAuthorizationStatus: 'Not Authorized' });
  }

  @Get('sites/:siteId/workforce')
  @Permissions('training.workforce.view')
  siteWorkforce(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.training.workforce(user, { ...query, siteId });
  }

  @Get('units/:unitId/workforce')
  @Permissions('training.workforce.view')
  unitWorkforce(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.training.workforce(user, { ...query, unitId });
  }

  @Get('areas/:areaId/workforce')
  @Permissions('training.workforce.view')
  areaWorkforce(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.training.workforce(user, { ...query, areaId });
  }

  @Get('sop-acknowledgements')
  @Permissions('training.sop_ack.view')
  sopAckRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.dashboard(user, query);
  }

  @Get('sop-acknowledgements/dashboard')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.dashboard(user, query);
  }

  @Get('sop-acknowledgements/dashboard/summary')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.dashboardSummary(user, query);
  }

  @Get('sop-acknowledgements/dashboard/by-site')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.dashboardBySite(user, query);
  }

  @Get('sop-acknowledgements/dashboard/by-unit')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.dashboardByUnit(user, query);
  }

  @Get('sop-acknowledgements/dashboard/pending-preview')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckPendingPreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.pending(user, { ...query, limit: query.limit ?? 8 });
  }

  @Get('sop-acknowledgements/dashboard/overdue-preview')
  @Permissions('training.sop_ack.dashboard.view')
  sopAckOverduePreview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.overdue(user, { ...query, limit: query.limit ?? 8 });
  }

  @Get('sop-acknowledgements/requirements')
  @Permissions('training.sop_ack.requirement.view')
  sopAckRequirements(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.requirements(user, query);
  }

  @Post('sop-acknowledgements/requirements')
  @Permissions('training.sop_ack.requirement.create')
  createSopAckRequirement(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.sopAck.createRequirement(user, dto);
  }

  @Get('sop-acknowledgements/requirements/:requirementId')
  @Permissions('training.sop_ack.requirement.view')
  sopAckRequirementDetail(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.sopAck.requirementDetail(user, requirementId);
  }

  @Patch('sop-acknowledgements/requirements/:requirementId')
  @Permissions('training.sop_ack.requirement.edit')
  updateSopAckRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.updateRequirement(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/archive')
  @Permissions('training.sop_ack.requirement.archive')
  archiveSopAckRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.archiveRequirement(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/reactivate')
  @Permissions('training.sop_ack.requirement.activate')
  reactivateSopAckRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.reactivateRequirement(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/activate')
  @Permissions('training.sop_ack.requirement.activate')
  activateSopAckRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.activateRequirement(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/preview-affected-workers')
  @Permissions('training.sop_ack.assignment.generate')
  previewSopAckWorkers(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.previewAffectedWorkers(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/generate-assignments')
  @Permissions('training.sop_ack.assignment.generate')
  generateSopAckAssignments(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.generateAssignments(user, requirementId, dto);
  }

  @Post('sop-acknowledgements/requirements/:requirementId/evaluate')
  @Permissions('training.sop_ack.assignment.generate')
  evaluateSopAckRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.evaluateRequirement(user, requirementId, dto);
  }

  @Get('sop-acknowledgements/assignments')
  @Permissions('training.sop_ack.assignment.view')
  sopAckAssignments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.assignments(user, query);
  }

  @Get('sop-acknowledgements/assignments/:assignmentId')
  @Permissions('training.sop_ack.assignment.view')
  sopAckAssignmentDetail(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.sopAck.assignmentDetail(user, assignmentId);
  }

  @Post('sop-acknowledgements/assignments/:assignmentId/send-reminder')
  @Permissions('training.sop_ack.assignment.view')
  sendSopAckReminder(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.sendReminder(user, assignmentId, dto);
  }

  @Post('sop-acknowledgements/assignments/:assignmentId/cancel')
  @Permissions('training.sop_ack.assignment.cancel')
  cancelSopAckAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.cancelAssignment(user, assignmentId, dto);
  }

  @Post('sop-acknowledgements/assignments/:assignmentId/request-reacknowledgement')
  @Permissions('training.sop_ack.request_reacknowledgement')
  requestSopReack(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.requestReacknowledgement(user, assignmentId, dto);
  }

  @Post('sop-acknowledgements/assignments/:assignmentId/acknowledge')
  @Permissions('training.sop_ack.acknowledge', 'training.sop_ack.acknowledge.self')
  acknowledgeSop(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.acknowledge(user, assignmentId, dto);
  }

  @Post('sop-acknowledgements/assignments/:assignmentId/waiver-request')
  @Permissions('training.sop_ack.waiver.request')
  requestSopAckWaiver(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.requestWaiver(user, assignmentId, dto);
  }

  @Get('sop-acknowledgements/acknowledgements/:acknowledgementId')
  @Permissions('training.sop_ack.view')
  sopAcknowledgementDetail(@CurrentUser() user: RequestUser, @Param('acknowledgementId') acknowledgementId: string) {
    return this.sopAck.acknowledgementDetail(user, acknowledgementId);
  }

  @Post('sop-acknowledgements/acknowledgements/:acknowledgementId/verify')
  @Permissions('training.sop_ack.verify')
  verifySopAcknowledgement(@CurrentUser() user: RequestUser, @Param('acknowledgementId') acknowledgementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.verifyAcknowledgement(user, acknowledgementId, dto);
  }

  @Post('sop-acknowledgements/acknowledgements/:acknowledgementId/reject')
  @Permissions('training.sop_ack.reject')
  rejectSopAcknowledgement(@CurrentUser() user: RequestUser, @Param('acknowledgementId') acknowledgementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.rejectAcknowledgement(user, acknowledgementId, dto);
  }

  @Post('sop-acknowledgements/acknowledgements/:acknowledgementId/return')
  @Permissions('training.sop_ack.return')
  returnSopAcknowledgement(@CurrentUser() user: RequestUser, @Param('acknowledgementId') acknowledgementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.returnAcknowledgement(user, acknowledgementId, dto);
  }

  @Post('sop-acknowledgements/acknowledgements/:acknowledgementId/reopen')
  @Permissions('training.sop_ack.reopen')
  reopenSopAcknowledgement(@CurrentUser() user: RequestUser, @Param('acknowledgementId') acknowledgementId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.reopenAcknowledgement(user, acknowledgementId, dto);
  }

  @Get('sop-acknowledgements/pending')
  @Permissions('training.sop_ack.assignment.view')
  sopAckPending(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.pending(user, query); }

  @Get('sop-acknowledgements/overdue')
  @Permissions('training.sop_ack.assignment.view')
  sopAckOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.overdue(user, query); }

  @Get('sop-acknowledgements/completed')
  @Permissions('training.sop_ack.assignment.view')
  sopAckCompleted(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.completed(user, query); }

  @Get('sop-acknowledgements/reacknowledgement-required')
  @Permissions('training.sop_ack.assignment.view')
  sopAckReackRequired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.reacknowledgementRequired(user, query); }

  @Get('sop-acknowledgements/current-version-gaps')
  @Permissions('training.sop_ack.assignment.view')
  sopAckVersionGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.currentVersionGaps(user, query); }

  @Get('sop-acknowledgements/safety-critical')
  @Permissions('training.sop_ack.assignment.view')
  sopAckSafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.safetyCritical(user, query); }

  @Get('sop-acknowledgements/ptw-blockers')
  @Permissions('training.sop_ack.assignment.view')
  sopAckPtwBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.ptwBlockers(user, query); }

  @Get('sop-acknowledgements/moc-blockers')
  @Permissions('training.sop_ack.assignment.view')
  sopAckMocBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.mocBlockers(user, query); }

  @Get('sop-acknowledgements/pssr-blockers')
  @Permissions('training.sop_ack.assignment.view')
  sopAckPssrBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.pssrBlockers(user, query); }

  @Get('sop-acknowledgements/verification')
  @Permissions('training.sop_ack.assignment.view')
  sopAckVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.verification(user, query); }

  @Post('sop-acknowledgements/revision-impact/detect')
  @Permissions('training.sop_ack.request_reacknowledgement')
  detectSopAckRevisionImpact(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.sopAck.detectRevisionImpact(user, dto);
  }

  @Get('sop-acknowledgements/revision-impact')
  @Permissions('training.sop_ack.view')
  sopAckRevisionImpact(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.revisionImpact(user, query);
  }

  @Get('sop-acknowledgements/waivers')
  @Permissions('training.sop_ack.waiver.view')
  sopAckWaivers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.sopAck.waivers(user, query);
  }

  @Post('sop-acknowledgements/waivers/:waiverId/approve')
  @Permissions('training.sop_ack.waiver.approve')
  approveSopAckWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.decideWaiver(user, waiverId, 'Approved', dto);
  }

  @Post('sop-acknowledgements/waivers/:waiverId/reject')
  @Permissions('training.sop_ack.waiver.reject')
  rejectSopAckWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.decideWaiver(user, waiverId, 'Rejected', dto);
  }

  @Post('sop-acknowledgements/waivers/:waiverId/revoke')
  @Permissions('training.sop_ack.waiver.revoke')
  revokeSopAckWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.sopAck.decideWaiver(user, waiverId, 'Revoked', dto);
  }

  @Get('sop-acknowledgements/import-template')
  @Permissions('training.sop_ack.import')
  sopAckImportTemplate() { return this.sopAck.importTemplate(); }

  @Post('sop-acknowledgements/import')
  @Permissions('training.sop_ack.import')
  importSopAck(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.sopAck.importRows(user, dto); }

  @Get('sop-acknowledgements/export')
  @Permissions('training.sop_ack.export')
  exportSopAck(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.exportRows(user, query); }

  @Get('sop-acknowledgements/history')
  @Permissions('training.sop_ack.history.view')
  sopAckHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.history(user, query); }

  @Get('sop-acknowledgements/settings')
  @Permissions('training.sop_ack.settings.view')
  sopAckSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.sopAck.settings(user, query); }

  @Patch('sop-acknowledgements/settings')
  @Permissions('training.sop_ack.settings.edit')
  updateSopAckSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.sopAck.updateSettings(user, dto); }

  @Get('workforce/:workerId/sop-acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  workerSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) { return this.sopAck.workerAcknowledgements(user, workerId, query); }

  @Get('workforce/:workerId/sop-acknowledgements/pending')
  @Permissions('training.sop_ack.assignment.view')
  workerPendingSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) { return this.sopAck.workerPending(user, workerId, query); }

  @Get('sop/:sopId/acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  sopLevelAcknowledgements(@CurrentUser() user: RequestUser, @Param('sopId') sopId: string, @Query() query: Record<string, any>) { return this.sopAck.sopAcknowledgements(user, sopId, query); }

  @Get('documents/:documentId/sop-acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  documentSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('documentId') documentId: string, @Query() query: Record<string, any>) { return this.sopAck.documentAcknowledgements(user, documentId, query); }

  @Get('sites/:siteId/sop-acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  siteSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.sopAck.scopedSite(user, siteId, query); }

  @Get('units/:unitId/sop-acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  unitSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.sopAck.scopedUnit(user, unitId, query); }

  @Get('areas/:areaId/sop-acknowledgements')
  @Permissions('training.sop_ack.assignment.view')
  areaSopAcknowledgements(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.sopAck.scopedArea(user, areaId, query); }

  @Get('lookups/sop-ack-requirement-sources')
  @Permissions('training.sop_ack.view')
  sopAckRequirementSources() { return this.sopAck.lookup('sop-ack-requirement-sources'); }

  @Get('lookups/sop-ack-requirement-statuses')
  @Permissions('training.sop_ack.view')
  sopAckRequirementStatuses() { return this.sopAck.lookup('sop-ack-requirement-statuses'); }

  @Get('lookups/sop-version-policies')
  @Permissions('training.sop_ack.view')
  sopVersionPolicies() { return this.sopAck.lookup('sop-version-policies'); }

  @Get('lookups/sop-ack-methods')
  @Permissions('training.sop_ack.view')
  sopAckMethods() { return this.sopAck.lookup('sop-ack-methods'); }

  @Get('lookups/sop-ack-assignment-statuses')
  @Permissions('training.sop_ack.view')
  sopAckAssignmentStatuses() { return this.sopAck.lookup('sop-ack-assignment-statuses'); }

  @Get('lookups/sop-ack-statuses')
  @Permissions('training.sop_ack.view')
  sopAckStatuses() { return this.sopAck.lookup('sop-ack-statuses'); }

  @Get('lookups/sop-ack-verification-statuses')
  @Permissions('training.sop_ack.view')
  sopAckVerificationStatuses() { return this.sopAck.lookup('sop-ack-verification-statuses'); }

  @Get('lookups/sop-ack-waiver-statuses')
  @Permissions('training.sop_ack.view')
  sopAckWaiverStatuses() { return this.sopAck.lookup('sop-ack-waiver-statuses'); }

  @Get('moc-training-requirements')
  @Permissions('training.moc.view')
  mocTrainingDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.dashboard(user, query);
  }

  @Get('moc-training-requirements/dashboard')
  @Permissions('training.moc.dashboard.view')
  mocTrainingDashboardPage(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.dashboard(user, query);
  }

  @Get('moc-training-requirements/dashboard/summary')
  @Permissions('training.moc.dashboard.view')
  mocTrainingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.dashboardSummary(user, query);
  }

  @Get('moc-training-requirements/dashboard/by-site')
  @Permissions('training.moc.dashboard.view')
  mocTrainingDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.dashboardBySite(user, query);
  }

  @Get('moc-training-requirements/dashboard/by-unit')
  @Permissions('training.moc.dashboard.view')
  mocTrainingDashboardByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.dashboardByUnit(user, query);
  }

  @Get('moc-training-requirements/register')
  @Permissions('training.moc.requirement.view')
  mocTrainingRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.register(user, query);
  }

  @Get('moc-training-requirements/new/context')
  @Permissions('training.moc.requirement.create')
  mocTrainingNewContext(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.settings(user, query);
  }

  @Get('moc-training-requirements/impact-checks')
  @Permissions('training.moc.impact_check.view')
  mocTrainingImpactChecks(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.impactChecks(user, query);
  }

  @Get('moc-training-requirements/assignments')
  @Permissions('training.moc.assignment.view')
  mocTrainingAssignments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.assignments(user, query);
  }

  @Get('moc-training-requirements/assignments/:assignmentId')
  @Permissions('training.moc.assignment.view')
  mocTrainingAssignmentDetail(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.mocTraining.assignmentDetail(user, assignmentId);
  }

  @Post('moc-training-requirements/assignments/:assignmentId/cancel')
  @Permissions('training.moc.assignment.cancel')
  cancelMocTrainingAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.cancelAssignment(user, assignmentId, dto);
  }

  @Post('moc-training-requirements/assignments/:assignmentId/recalculate')
  @Permissions('training.moc.assignment.generate')
  recalculateMocTrainingAssignment(@CurrentUser() user: RequestUser, @Param('assignmentId') assignmentId: string) {
    return this.mocTraining.recalculateAssignment(user, assignmentId);
  }

  @Get('moc-training-requirements/pending')
  @Permissions('training.moc.assignment.view')
  pendingMocTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.pending(user, query);
  }

  @Get('moc-training-requirements/overdue')
  @Permissions('training.moc.assignment.view')
  overdueMocTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.overdue(user, query);
  }

  @Get('moc-training-requirements/ready')
  @Permissions('training.moc.readiness.view')
  readyMocTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.ready(user, query);
  }

  @Get('moc-training-requirements/blockers')
  @Permissions('training.moc.blocker.view')
  mocTrainingBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.blockers(user, query);
  }

  @Get('moc-training-requirements/implementation-blockers')
  @Permissions('training.moc.blocker.view')
  mocTrainingImplementationBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.blockers(user, { ...query, blockerScope: 'implementation' });
  }

  @Get('moc-training-requirements/closure-blockers')
  @Permissions('training.moc.blocker.view')
  mocTrainingClosureBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.blockers(user, { ...query, blockerScope: 'closure' });
  }

  @Get('moc-training-requirements/startup-blockers')
  @Permissions('training.moc.blocker.view')
  mocTrainingStartupBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.blockers(user, { ...query, blockerScope: 'startup' });
  }

  @Get('moc-training-requirements/blockers/:blockerId')
  @Permissions('training.moc.blocker.view')
  mocTrainingBlockerDetail(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string) {
    return this.mocTraining.blockerDetail(user, blockerId);
  }

  @Post('moc-training-requirements/blockers/:blockerId/create-action')
  @Permissions('training.moc.blocker.close')
  createMocTrainingBlockerAction(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.createBlockerAction(user, blockerId, dto);
  }

  @Post('moc-training-requirements/blockers/:blockerId/mark-resolved')
  @Permissions('training.moc.blocker.close')
  resolveMocTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.markBlockerResolved(user, blockerId, dto);
  }

  @Post('moc-training-requirements/blockers/:blockerId/verify')
  @Permissions('training.moc.blocker.verify')
  verifyMocTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.verifyBlocker(user, blockerId, dto);
  }

  @Post('moc-training-requirements/blockers/:blockerId/reopen')
  @Permissions('training.moc.blocker.reopen')
  reopenMocTrainingBlocker(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.reopenBlocker(user, blockerId, dto);
  }

  @Get('moc-training-requirements/waivers')
  @Permissions('training.moc.waiver.view')
  mocTrainingWaivers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.waivers(user, query);
  }

  @Post('moc-training-requirements/blockers/:blockerId/waiver-request')
  @Permissions('training.moc.waiver.request')
  requestMocTrainingWaiver(@CurrentUser() user: RequestUser, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.requestWaiver(user, blockerId, dto);
  }

  @Post('moc-training-requirements/waivers/:waiverId/approve')
  @Permissions('training.moc.waiver.approve')
  approveMocTrainingWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.decideWaiver(user, waiverId, 'approve', dto);
  }

  @Post('moc-training-requirements/waivers/:waiverId/reject')
  @Permissions('training.moc.waiver.reject')
  rejectMocTrainingWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.decideWaiver(user, waiverId, 'reject', dto);
  }

  @Post('moc-training-requirements/waivers/:waiverId/revoke')
  @Permissions('training.moc.waiver.revoke')
  revokeMocTrainingWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.decideWaiver(user, waiverId, 'revoke', dto);
  }

  @Get('moc-training-requirements/import-template')
  @Permissions('training.moc.import')
  mocTrainingImportTemplate() {
    return this.mocTraining.importTemplate();
  }

  @Post('moc-training-requirements/import')
  @Permissions('training.moc.import')
  importMocTraining(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.mocTraining.importRows(user, dto);
  }

  @Get('moc-training-requirements/export')
  @Permissions('training.moc.export')
  exportMocTraining(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.exportRows(user, query);
  }

  @Get('moc-training-requirements/history')
  @Permissions('training.moc.history.view')
  mocTrainingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.history(user, query);
  }

  @Get('moc-training-requirements/settings')
  @Permissions('training.moc.settings.view')
  mocTrainingSettings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.mocTraining.settings(user, query);
  }

  @Patch('moc-training-requirements/settings')
  @Permissions('training.moc.settings.edit')
  updateMocTrainingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.mocTraining.updateSettings(user, dto);
  }

  @Get('moc-training-requirements/lookups/:lookup')
  @Permissions('training.moc.view')
  mocTrainingLookup(@Param('lookup') lookup: string) {
    return this.mocTraining.lookup(lookup);
  }

  @Post('moc-training-requirements')
  @Permissions('training.moc.requirement.create')
  createMocTrainingRequirement(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.mocTraining.createRequirement(user, dto);
  }

  @Get('moc-training-requirements/:requirementId')
  @Permissions('training.moc.requirement.view')
  mocTrainingDetail(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.mocTraining.requirementDetail(user, requirementId);
  }

  @Patch('moc-training-requirements/:requirementId')
  @Permissions('training.moc.requirement.edit')
  updateMocTrainingRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.updateRequirement(user, requirementId, dto);
  }

  @Post('moc-training-requirements/:requirementId/archive')
  @Permissions('training.moc.requirement.archive')
  archiveMocTrainingRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.archiveRequirement(user, requirementId, dto);
  }

  @Post('moc-training-requirements/:requirementId/reactivate')
  @Permissions('training.moc.requirement.edit')
  reactivateMocTrainingRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.reactivateRequirement(user, requirementId, dto);
  }

  @Post('moc-training-requirements/:requirementId/activate')
  @Permissions('training.moc.requirement.edit')
  activateMocTrainingRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.activateRequirement(user, requirementId, dto);
  }

  @Post('moc-training-requirements/:requirementId/impact-check/run')
  @Permissions('training.moc.impact_check.run')
  runMocRequirementImpactCheck(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.runImpactCheck(user, requirementId, dto);
  }

  @Post('moc-training-requirements/:requirementId/preview-affected-workers')
  @Permissions('training.moc.affected_workers.view')
  previewMocAffectedWorkers(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.previewAffectedWorkers(user, requirementId, query);
  }

  @Get('moc-training-requirements/:requirementId/affected-workers')
  @Permissions('training.moc.affected_workers.view')
  mocAffectedWorkers(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.affectedWorkers(user, requirementId, query);
  }

  @Post('moc-training-requirements/:requirementId/affected-workers')
  @Permissions('training.moc.affected_workers.manage')
  addMocAffectedWorker(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.addAffectedWorker(user, requirementId, dto);
  }

  @Delete('moc-training-requirements/:requirementId/affected-workers/:affectedWorkerId')
  @Permissions('training.moc.affected_workers.manage')
  removeMocAffectedWorker(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Param('affectedWorkerId') affectedWorkerId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.removeAffectedWorker(user, requirementId, affectedWorkerId, dto);
  }

  @Post('moc-training-requirements/:requirementId/generate-assignments')
  @Permissions('training.moc.assignment.generate')
  generateMocTrainingAssignments(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.generateAssignments(user, requirementId, dto);
  }

  @Get('moc-training-requirements/:requirementId/assignments')
  @Permissions('training.moc.assignment.view')
  mocRequirementAssignments(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.requirementAssignments(user, requirementId, query);
  }

  @Get('moc-training-requirements/:requirementId/readiness')
  @Permissions('training.moc.readiness.view')
  mocRequirementReadiness(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.mocTraining.readiness(user, requirementId);
  }

  @Post('moc-training-requirements/:requirementId/readiness/run')
  @Permissions('training.moc.readiness.run')
  runMocRequirementReadiness(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.runReadiness(user, requirementId, dto);
  }

  @Get('workforce/:workerId/moc-training-requirements')
  @Permissions('training.moc.assignment.view')
  workerMocTrainingRequirements(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.workerRequirements(user, workerId, query);
  }

  @Get('workforce/:workerId/moc-training-assignments')
  @Permissions('training.moc.assignment.view')
  workerMocTrainingAssignments(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.workerAssignments(user, workerId, query);
  }

  @Get('workforce/:workerId/moc-training-history')
  @Permissions('training.moc.history.view')
  workerMocTrainingHistory(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.workerHistory(user, workerId, query);
  }

  @Get('sites/:siteId/moc-training-requirements')
  @Permissions('training.moc.requirement.view')
  siteMocTrainingRequirements(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.scopedSite(user, siteId, query);
  }

  @Get('units/:unitId/moc-training-requirements')
  @Permissions('training.moc.requirement.view')
  unitMocTrainingRequirements(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.scopedUnit(user, unitId, query);
  }

  @Get('areas/:areaId/moc-training-requirements')
  @Permissions('training.moc.requirement.view')
  areaMocTrainingRequirements(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.scopedArea(user, areaId, query);
  }

  @Post('workforce')
  @Permissions('training.workforce.create')
  createWorker(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.training.createWorker(user, dto);
  }

  @Get('workforce/:workerId/training-matrix')
  @Permissions('training.matrix.view')
  workerMatrix(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.matrix.workerMatrix(user, workerId);
  }

  @Post('workforce/:workerId/training-matrix/evaluate')
  @Permissions('training.matrix.evaluate.worker')
  evaluateWorkerMatrix(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.matrix.evaluate(user, { workerId, runScope: 'Worker' });
  }

  @Get('workforce/:workerId/competency-profile')
  @Permissions('training.competency.assignment.view')
  workerCompetencyProfile(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.competency.workerCompetencyProfile(user, workerId);
  }

  @Post('workforce/:workerId/competency-profile/assign')
  @Permissions('training.competency.assignment.create')
  assignWorkerCompetencyProfile(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.competency.assignProfile(user, { ...dto, workerId });
  }

  @Delete('workforce/:workerId/competency-profile/:assignmentId')
  @Permissions('training.competency.assignment.remove')
  removeWorkerCompetencyProfile(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.competency.removeAssignment(user, assignmentId, { ...dto, workerId });
  }

  @Post('workforce/:workerId/competency-profile/evaluate')
  @Permissions('training.competency.evaluate.worker')
  evaluateWorkerCompetencyProfile(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.competency.evaluate(user, { workerId, runScope: 'Worker' });
  }

  @Get('workforce/:workerId/competency-gaps')
  @Permissions('training.competency.gap.view')
  workerCompetencyGaps(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.competency.gaps(user, { ...query, workerId });
  }

  @Get('workforce/:workerId/training-matrix/gaps')
  @Permissions('training.matrix.gap.view')
  workerMatrixGaps(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.matrix.gaps(user, { ...query, workerId });
  }

  @Get('workforce/:workerId')
  @Permissions('training.workforce.view')
  worker(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.workerDetail(user, workerId);
  }

  @Patch('workforce/:workerId')
  @Permissions('training.workforce.edit')
  updateWorker(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.updateWorker(user, workerId, dto);
  }

  @Post('workforce/:workerId/archive')
  @Permissions('training.workforce.archive')
  archiveWorker(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.archiveWorker(user, workerId, dto);
  }

  @Post('workforce/:workerId/reactivate')
  @Permissions('training.workforce.reactivate')
  reactivateWorker(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.reactivateWorker(user, workerId, dto);
  }

  @Get('workforce/:workerId/assignments')
  @Permissions('training.workforce.view')
  assignments(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.assignments(user, workerId);
  }

  @Post('workforce/:workerId/assignments')
  @Permissions('training.workforce.assign_site')
  addAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.addAssignment(user, workerId, dto);
  }

  @Patch('workforce/:workerId/assignments/:assignmentId')
  @Permissions('training.workforce.assign_site')
  updateAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.training.updateAssignment(user, workerId, assignmentId, dto);
  }

  @Delete('workforce/:workerId/assignments/:assignmentId')
  @Permissions('training.workforce.assign_site')
  removeAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.training.removeAssignment(user, workerId, assignmentId, dto);
  }

  @Get('workforce/:workerId/role-assignments')
  @Permissions('training.workforce.view')
  roleAssignments(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.roleAssignments(user, workerId);
  }

  @Post('workforce/:workerId/role-assignments')
  @Permissions('training.workforce.assign_role')
  addRoleAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.addRoleAssignment(user, workerId, dto);
  }

  @Patch('workforce/:workerId/role-assignments/:roleAssignmentId')
  @Permissions('training.workforce.assign_role')
  updateRoleAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('roleAssignmentId') roleAssignmentId: string, @Body() dto: Record<string, any>) {
    return this.training.updateRoleAssignment(user, workerId, roleAssignmentId, dto);
  }

  @Delete('workforce/:workerId/role-assignments/:roleAssignmentId')
  @Permissions('training.workforce.assign_role')
  removeRoleAssignment(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('roleAssignmentId') roleAssignmentId: string, @Body() dto: Record<string, any>) {
    return this.training.removeRoleAssignment(user, workerId, roleAssignmentId, dto);
  }

  @Get('workforce/:workerId/account-link')
  @Permissions('training.workforce.view')
  accountLink(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.accountLink(user, workerId);
  }

  @Post('workforce/:workerId/account-link')
  @Permissions('training.workforce.link_user')
  linkAccount(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.linkAccount(user, workerId, dto);
  }

  @Delete('workforce/:workerId/account-link')
  @Permissions('training.workforce.unlink_user')
  unlinkAccount(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.unlinkAccount(user, workerId, dto);
  }

  @Post('workforce/:workerId/invite-user-account')
  @Permissions('training.workforce.link_user')
  inviteAccount(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.inviteAccount(user, workerId, dto);
  }

  @Get('workforce/:workerId/documents')
  @Permissions('training.workforce.view')
  documents(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.documents(user, workerId);
  }

  @Post('workforce/:workerId/documents/link')
  @Permissions('training.workforce.link_document')
  linkDocument(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: Record<string, any>) {
    return this.training.linkDocument(user, workerId, dto);
  }

  @Delete('workforce/:workerId/documents/:documentLinkId')
  @Permissions('training.workforce.remove_document')
  removeDocument(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.training.removeDocument(user, workerId, documentLinkId, dto);
  }

  @Get('workforce/:workerId/training-summary')
  @Permissions('training.workforce.view')
  trainingSummary(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.trainingSummary(user, workerId);
  }

  @Post('workforce/:workerId/status/recalculate')
  @Permissions('training.workforce.edit')
  recalculateStatus(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.training.recalculateStatus(user, workerId);
  }

  @Get('workforce/:workerId/history')
  @Permissions('training.history.view')
  workerHistory(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Record<string, any>) {
    return this.training.history(user, { ...query, workerId });
  }

  @Get('history')
  @Permissions('training.history.view')
  history(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.history(user, query);
  }

  @Get('settings')
  @Permissions('training.settings.view')
  settings(@CurrentUser() user: RequestUser) {
    return this.training.settings(user);
  }

  @Patch('settings')
  @Permissions('training.settings.edit')
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.training.updateSettings(user, dto);
  }

  @Get('context')
  @Permissions('training.workforce.view')
  context(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.training.context(user, query);
  }

  @Get('lookups/:lookup')
  @Permissions('training.view')
  lookup(@Param('lookup') lookup: string) {
    return this.training.lookup(lookup);
  }
}

