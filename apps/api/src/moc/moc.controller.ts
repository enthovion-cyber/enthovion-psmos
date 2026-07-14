import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { CreateMocDto } from './dto/create-moc.dto';
import { MocClosedLoopActionService } from './moc-closed-loop-action.service';
import { MocAttachmentsService } from './moc-attachments.service';
import { MocCommunicationTrainingService } from './moc-communication-training.service';
import { MocDashboardService } from './moc-dashboard.service';
import { MocEngineeringPackageService } from './moc-engineering-package.service';
import { MocEngineeringRequirementService } from './moc-engineering-requirement.service';
import { MocHistoryService } from './moc-history.service';
import { MocImpactAssessmentService } from './moc-impact-assessment.service';
import { MocRiskService } from './moc-risk.service';
import { MocStartupReadinessService } from './moc-startup-readiness.service';
import { MocTemporaryEmergencyService } from './moc-temporary-emergency.service';
import { MocWorkflowService } from './moc-workflow.service';
import { MocService } from './moc.service';
import { PssrService } from '../pssr/pssr.service';

@ApiTags('moc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('moc')
export class MocController {
  constructor(
    private readonly moc: MocService,
    private readonly impactService: MocImpactAssessmentService,
    private readonly riskService: MocRiskService,
    private readonly engineeringService: MocEngineeringPackageService,
    private readonly engineeringRequirements: MocEngineeringRequirementService,
    private readonly closedLoopService: MocClosedLoopActionService,
    private readonly workflowService: MocWorkflowService,
    private readonly temporaryEmergencyService: MocTemporaryEmergencyService,
    private readonly startupService: MocStartupReadinessService,
    private readonly communicationTrainingService: MocCommunicationTrainingService,
    private readonly historyService: MocHistoryService,
    private readonly attachmentsService: MocAttachmentsService,
    private readonly dashboardService: MocDashboardService,
    private readonly pssrService: PssrService
  ) {}

  @Get('new/context')
  @Permissions(PermissionKeys.MOCCreate)
  context(@CurrentUser() user: RequestUser) {
    return this.moc.context(user.tenantId, this.scope(user));
  }

  @Get('equipment-search')
  @Permissions(PermissionKeys.MOCCreate)
  equipmentSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.moc.equipmentSearch(user.tenantId, this.scope(user), search);
  }

  @Get()
  @Permissions(PermissionKeys.MOCRead)
  list(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) {
    return this.moc.list(user.tenantId, this.scope(user), filters);
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.MOCRead)
  dashboard(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) {
    return this.dashboardService.dashboard(user.tenantId, this.scope(user), user.id, filters);
  }

  @Get('dashboard/kpis')
  @Permissions(PermissionKeys.MOCRead)
  dashboardKpis(@CurrentUser() user: RequestUser) {
    return this.dashboardService.kpis(user.tenantId, this.scope(user));
  }

  @Get('dashboard/register')
  @Permissions(PermissionKeys.MOCRead)
  dashboardRegister(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) {
    return this.dashboardService.register(user.tenantId, this.scope(user), filters);
  }

  @Get('dashboard/risk-overview')
  @Permissions(PermissionKeys.MOCRead)
  dashboardRiskOverview(@CurrentUser() user: RequestUser) {
    return this.dashboardService.riskOverview(user.tenantId, this.scope(user));
  }

  @Get('dashboard/type-distribution')
  @Permissions(PermissionKeys.MOCRead)
  dashboardTypeDistribution(@CurrentUser() user: RequestUser) {
    return this.dashboardService.typeDistribution(user.tenantId, this.scope(user));
  }

  @Get('dashboard/lifecycle-health')
  @Permissions(PermissionKeys.MOCRead)
  dashboardLifecycleHealth(@CurrentUser() user: RequestUser) {
    return this.dashboardService.lifecycleHealth(user.tenantId, this.scope(user));
  }

  @Get('dashboard/temporary')
  @Permissions(PermissionKeys.MOCRead)
  dashboardTemporary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.temporary(user.tenantId, this.scope(user));
  }

  @Get('dashboard/emergency')
  @Permissions(PermissionKeys.MOCRead)
  dashboardEmergency(@CurrentUser() user: RequestUser) {
    return this.dashboardService.emergency(user.tenantId, this.scope(user));
  }

  @Get('dashboard/action-health')
  @Permissions(PermissionKeys.MOCRead)
  dashboardActionHealth(@CurrentUser() user: RequestUser) {
    return this.dashboardService.actionHealth(user.tenantId, this.scope(user));
  }

  @Get('dashboard/approval-aging')
  @Permissions(PermissionKeys.MOCRead)
  dashboardApprovalAging(@CurrentUser() user: RequestUser) {
    return this.dashboardService.approvalAging(user.tenantId, this.scope(user));
  }

  @Get('dashboard/approval-queue')
  @Permissions(PermissionKeys.MOCRead)
  dashboardApprovalQueue(@CurrentUser() user: RequestUser) {
    return this.dashboardService.approvalQueue(user.tenantId, this.scope(user), user.id);
  }

  @Get('dashboard/startup-readiness')
  @Permissions(PermissionKeys.MOCRead)
  dashboardStartupReadiness(@CurrentUser() user: RequestUser) {
    return this.dashboardService.startupReadiness(user.tenantId, this.scope(user));
  }

  @Get('dashboard/recent-activity')
  @Permissions(PermissionKeys.MOCRead)
  dashboardRecentActivity(@CurrentUser() user: RequestUser) {
    return this.dashboardService.recentActivity(user.tenantId, this.scope(user));
  }

  @Get('dashboard/export/pdf')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportPdf(@CurrentUser() user: RequestUser) {
    return this.dashboardService.export(user.tenantId, this.scope(user), 'pdf');
  }

  @Get('dashboard/export/csv')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportCsv(@CurrentUser() user: RequestUser) {
    return this.dashboardService.export(user.tenantId, this.scope(user), 'csv');
  }

  @Get('dashboard/export/register')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportRegister(@CurrentUser() user: RequestUser) {
    return this.dashboardService.exportReport(user.tenantId, this.scope(user), 'register');
  }

  @Get('dashboard/export/temporary')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportTemporary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.exportReport(user.tenantId, this.scope(user), 'temporary');
  }

  @Get('dashboard/export/high-critical')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportHighCritical(@CurrentUser() user: RequestUser) {
    return this.dashboardService.exportReport(user.tenantId, this.scope(user), 'high-critical');
  }

  @Get('dashboard/export/audit-evidence')
  @Permissions(PermissionKeys.MOCRead)
  dashboardExportAuditEvidence(@CurrentUser() user: RequestUser) {
    return this.dashboardService.exportReport(user.tenantId, this.scope(user), 'audit-evidence');
  }

  @Post()
  @Permissions(PermissionKeys.MOCCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMocDto, @Query('submit') submit?: string) {
    return this.moc.create(user.tenantId, user.id, dto, this.scope(user), submit === 'true');
  }

  @Get(':id/preview')
  @Permissions(PermissionKeys.MOCRead)
  preview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.dashboardService.preview(user.tenantId, this.scope(user), id);
  }

  @Get(':id/summary')
  @Permissions(PermissionKeys.MOCRead)
  summary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.summary(user.tenantId, id, this.scope(user));
  }

  @Patch(':id')
  @Permissions(PermissionKeys.MOCEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Partial<CreateMocDto>) {
    return this.moc.update(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/submit')
  @Permissions(PermissionKeys.MOCSubmit)
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.submit(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/approve')
  @Permissions(PermissionKeys.MOCApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'approve', body, this.scope(user));
  }

  @Post(':id/reject')
  @Permissions(PermissionKeys.MOCReject)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'reject', body, this.scope(user));
  }

  @Post(':id/return')
  @Permissions(PermissionKeys.MOCReturn)
  returnForRevision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'return', body, this.scope(user));
  }

  @Post(':id/start-implementation')
  @Permissions(PermissionKeys.MOCImplementationStart)
  startImplementation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'start-implementation', body, this.scope(user));
  }

  @Post(':id/mark-implementation-complete')
  @Permissions(PermissionKeys.MOCImplementationComplete)
  markImplementationComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'mark-implementation-complete', body, this.scope(user));
  }

  @Post(':id/ready-for-startup')
  @Permissions(PermissionKeys.MOCReadyForStartup)
  readyForStartup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.startupService.readyForStartup(user.tenantId, user.id, id, body, this.scope(user));
  }

  @Post(':id/close')
  @Permissions(PermissionKeys.MOCClose)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'close', body, this.scope(user));
  }

  @Post(':id/cancel')
  @Permissions(PermissionKeys.MOCCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.moc.transition(user.tenantId, user.id, id, 'cancel', body, this.scope(user));
  }

  @Post(':id/duplicate')
  @Permissions(PermissionKeys.MOCCreate)
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.duplicate(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/risk')
  @Permissions(PermissionKeys.MOCRiskView)
  risk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.getRisk(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/risk')
  @Permissions(PermissionKeys.MOCRiskEdit)
  updateRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.riskService.updateRisk(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk/recalculate')
  @Permissions(PermissionKeys.MOCRiskRecalculate)
  recalculateRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.riskService.recalculate(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk/complete')
  @Permissions(PermissionKeys.MOCRiskComplete)
  completeRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.complete(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/risk/request-reassessment')
  @Permissions(PermissionKeys.MOCRiskReassessmentRequest)
  requestRiskReassessment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.riskService.requestReassessment(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk/lock')
  @Permissions(PermissionKeys.MOCRiskLock)
  lockRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.lock(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/risk/unlock')
  @Permissions(PermissionKeys.MOCRiskUnlock)
  unlockRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.unlock(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/risk/history')
  @Permissions(PermissionKeys.MOCRiskView)
  riskHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.historyEvents(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk/review-requirements')
  @Permissions(PermissionKeys.MOCRiskView)
  riskReviewRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.reviewRequirementList(user.tenantId, id, this.scope(user));
  }

  @Post(':id/risk/apply-review-requirements')
  @Permissions(PermissionKeys.MOCRiskApplyReviewRequirements)
  applyRiskReviewRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.riskService.applyReviewRequirements(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/impact-assessment')
  @Permissions(PermissionKeys.MOCImpactView)
  impact(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.getAssessment(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/impact-assessment')
  @Permissions(PermissionKeys.MOCImpactEdit)
  updateImpact(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.impactService.saveAnswers(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/impact-assessment/answers')
  @Permissions(PermissionKeys.MOCImpactView)
  impactAnswers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.getAnswers(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/impact-assessment/answers')
  @Permissions(PermissionKeys.MOCImpactEdit)
  updateImpactAnswers(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.impactService.saveAnswers(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/impact-assessment/complete')
  @Permissions(PermissionKeys.MOCImpactComplete)
  completeImpactAssessment(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.complete(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/impact-assessment/regenerate-actions')
  @Permissions(PermissionKeys.MOCImpactRegenerateActions)
  regenerateImpactActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.regenerateActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/impact-assessment/generated-actions')
  @Permissions(PermissionKeys.MOCImpactView)
  impactGeneratedActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.generatedActions(user.tenantId, id, this.scope(user));
  }

  @Post(':id/impact-assessment/apply-generated-actions')
  @Permissions(PermissionKeys.MOCImpactApplyGeneratedActions)
  applyGeneratedImpactActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.impactService.applyGeneratedActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get('impact-action-rules')
  @Permissions(PermissionKeys.MOCImpactRulesManage)
  impactRules(@CurrentUser() user: RequestUser) {
    return this.impactService.rules(user.tenantId);
  }

  @Post('impact-action-rules')
  @Permissions(PermissionKeys.MOCImpactRulesManage)
  createImpactRule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.impactService.createRule(user.tenantId, dto);
  }

  @Patch('impact-action-rules/:ruleId')
  @Permissions(PermissionKeys.MOCImpactRulesManage)
  updateImpactRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Record<string, any>) {
    return this.impactService.updateRule(user.tenantId, ruleId, dto);
  }

  @Delete('impact-action-rules/:ruleId')
  @Permissions(PermissionKeys.MOCImpactRulesManage)
  deleteImpactRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.impactService.deleteRule(user.tenantId, ruleId);
  }

  @Get('engineering-document-requirements')
  @Permissions(PermissionKeys.MOCEngineeringView)
  engineeringRequirementRules(@CurrentUser() user: RequestUser) {
    return this.engineeringRequirements.listAdmin(user.tenantId);
  }

  @Post('engineering-document-requirements')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  createEngineeringRequirementRule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.engineeringRequirements.createAdmin(user.tenantId, dto);
  }

  @Patch('engineering-document-requirements/:requirementId')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  updateEngineeringRequirementRule(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.engineeringRequirements.updateAdmin(user.tenantId, requirementId, dto);
  }

  @Delete('engineering-document-requirements/:requirementId')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  deleteEngineeringRequirementRule(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.engineeringRequirements.deleteAdmin(user.tenantId, requirementId);
  }

  @Get(':id/engineering-package')
  @Permissions(PermissionKeys.MOCEngineeringView)
  engineeringPackage(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.getPackage(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/engineering-package')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  updateEngineeringPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.updatePackage(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/engineering-package/summary')
  @Permissions(PermissionKeys.MOCEngineeringView)
  engineeringPackageSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.summaryOnly(user.tenantId, id, this.scope(user));
  }

  @Get(':id/engineering-package/requirements')
  @Permissions(PermissionKeys.MOCEngineeringView)
  engineeringPackageRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.requirementsFor(user.tenantId, id, this.scope(user));
  }

  @Post(':id/engineering-package/regenerate-requirements')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  regenerateEngineeringRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.regenerateRequirements(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/engineering-package/submit-review')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  submitEngineeringReview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.submitReview(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/engineering-package/approve')
  @Permissions(PermissionKeys.MOCEngineeringApprove)
  approveEngineeringPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.approve(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/engineering-package/reject')
  @Permissions(PermissionKeys.MOCEngineeringApprove)
  rejectEngineeringPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.reject(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/engineering-package/request-document')
  @Permissions(PermissionKeys.MOCEngineeringReview)
  requestEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.requestDocument(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/engineering-documents')
  @Permissions(PermissionKeys.MOCEngineeringView)
  engineeringDocuments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.engineeringService.getPackage(user.tenantId, id, this.scope(user)).then((result) => result.documents);
  }

  @Post(':id/engineering-documents')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.MOCEngineeringUpload)
  uploadEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, string>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.engineeringService.uploadDocument(user.tenantId, user.id, id, dto, file, this.scope(user));
  }

  @Get(':id/engineering-documents/:documentId')
  @Permissions(PermissionKeys.MOCEngineeringView)
  getEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.engineeringService.getDocument(user.tenantId, id, documentId, this.scope(user));
  }

  @Get(':id/engineering-documents/:documentId/download')
  @Permissions(PermissionKeys.MOCEngineeringView)
  downloadEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.engineeringService.downloadDocument(user.tenantId, id, documentId, this.scope(user));
  }

  @Get(':id/engineering-documents/:documentId/preview')
  @Permissions(PermissionKeys.MOCEngineeringView)
  previewEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.engineeringService.previewDocument(user.tenantId, id, documentId, this.scope(user));
  }

  @Delete(':id/engineering-documents/:documentId')
  @Permissions(PermissionKeys.MOCEngineeringDelete)
  deleteEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.engineeringService.deleteDocument(user.tenantId, user.id, id, documentId, this.scope(user));
  }

  @Post(':id/engineering-documents/link-document')
  @Permissions(PermissionKeys.MOCEngineeringLinkDocument)
  linkEngineeringDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.linkDocumentControl(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/engineering-documents/link-document-control')
  @Permissions(PermissionKeys.MOCEngineeringLinkDocument)
  linkEngineeringDocumentControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.engineeringService.linkDocumentControl(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id/engineering-documents/unlink-document-control/:documentId')
  @Permissions(PermissionKeys.MOCEngineeringLinkDocument)
  unlinkEngineeringDocumentControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.engineeringService.unlinkDocumentControl(user.tenantId, user.id, id, documentId, this.scope(user));
  }

  @Get(':id/required-actions')
  @Permissions(PermissionKeys.MOCActionsView)
  requiredActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.list(user.tenantId, id, this.scope(user)).then((result) => result.actions);
  }

  @Get(':id/required-actions/summary')
  @Permissions(PermissionKeys.MOCActionsView)
  requiredActionsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.summaryOnly(user.tenantId, id, this.scope(user));
  }

  @Post(':id/required-actions/generate')
  @Permissions(PermissionKeys.MOCActionsGenerate)
  generateRequiredActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.generate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/required-actions/sync')
  @Permissions(PermissionKeys.MOCActionsSync)
  syncRequiredActions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.closedLoopService.sync(user.tenantId, user.id, id, this.scope(user), dto.source);
  }

  @Post(':id/required-actions')
  @Permissions(PermissionKeys.MOCActionsCreateCustom)
  addRequiredAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.closedLoopService.createCustom(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/required-actions/custom')
  @Permissions(PermissionKeys.MOCActionsCreateCustom)
  addCustomRequiredAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.closedLoopService.createCustom(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/required-actions/:actionId')
  @Permissions(PermissionKeys.MOCActionsSync)
  updateRequiredAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) {
    return this.closedLoopService.update(user.tenantId, user.id, id, actionId, dto, this.scope(user));
  }

  @Post(':id/required-actions/:requiredActionId/no-longer-required')
  @Permissions(PermissionKeys.MOCActionsMarkNoLongerRequired)
  noLongerRequired(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requiredActionId') requiredActionId: string, @Body() dto: Record<string, any>) {
    return this.closedLoopService.markNoLongerRequired(user.tenantId, user.id, id, requiredActionId, dto, this.scope(user));
  }

  @Post(':id/required-actions/create-universal-actions')
  @Permissions(PermissionKeys.MOCActionsGenerate)
  createUniversalActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.createUniversalActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/startup-blockers')
  @Permissions(PermissionKeys.MOCStartupView)
  actionStartupBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.startupService.startupBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/closure-blockers')
  @Permissions(PermissionKeys.MOCActionsViewBlockers)
  actionClosureBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.closureBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/closure-checklist')
  @Permissions(PermissionKeys.MOCActionsView)
  closureChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.closureChecklist(user.tenantId, id, this.scope(user));
  }

  @Post(':id/closure-checklist/recalculate')
  @Permissions(PermissionKeys.MOCActionsSync)
  recalculateClosureChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.recalculateClosureChecklist(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/action-links')
  @Permissions(PermissionKeys.MOCActionsView)
  actionLinks(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.closedLoopService.actionLinks(user.tenantId, id, this.scope(user));
  }

  @Get(':id/workflow')
  @Permissions(PermissionKeys.MOCWorkflowView)
  workflow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflowService.get(user.tenantId, id, this.scope(user));
  }

  @Post(':id/workflow/start')
  @Permissions(PermissionKeys.MOCWorkflowStart)
  startWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflowService.start(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/workflow/approve')
  @Permissions(PermissionKeys.MOCWorkflowApprove)
  approveWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.workflowService.approve(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/workflow/reject')
  @Permissions(PermissionKeys.MOCWorkflowReject)
  rejectWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.workflowService.reject(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/workflow/return')
  @Permissions(PermissionKeys.MOCWorkflowReturn)
  returnWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.workflowService.returnForRevision(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/workflow/delegate')
  @Permissions(PermissionKeys.MOCWorkflowDelegate)
  delegateWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.workflowService.delegate(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/workflow/escalate')
  @Permissions(PermissionKeys.MOCWorkflowEscalate)
  escalateWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflowService.escalate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/workflow/restart')
  @Permissions(PermissionKeys.MOCWorkflowRestart)
  restartWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.workflowService.restart(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/workflow/history')
  @Permissions(PermissionKeys.MOCWorkflowView)
  workflowHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflowService.historyFor(user.tenantId, id, this.scope(user));
  }

  @Get(':id/workflow/blockers')
  @Permissions(PermissionKeys.MOCWorkflowView)
  workflowBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflowService.blockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/temporary-control')
  @Permissions(PermissionKeys.MOCTemporaryView)
  temporaryControl(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.temporaryEmergencyService.temporary(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/temporary-control')
  @Permissions(PermissionKeys.MOCTemporaryEdit)
  updateTemporaryControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.updateTemporary(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/temporary-control/request-extension')
  @Permissions(PermissionKeys.MOCTemporaryExtend)
  requestTemporaryExtension(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.requestExtension(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/temporary-control/approve-extension')
  @Permissions(PermissionKeys.MOCTemporaryApproveExtension)
  approveTemporaryExtension(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.approveExtension(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/temporary-control/reject-extension')
  @Permissions(PermissionKeys.MOCTemporaryApproveExtension)
  rejectTemporaryExtension(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.rejectExtension(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/temporary-control/mark-removal-complete')
  @Permissions(PermissionKeys.MOCTemporaryClose)
  markTemporaryRemovalComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.markRemovalComplete(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/temporary-control/convert-to-permanent')
  @Permissions(PermissionKeys.MOCTemporaryClose)
  convertTemporaryToPermanent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.convertTemporaryToPermanent(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/temporary-control/extensions')
  @Permissions(PermissionKeys.MOCTemporaryView)
  temporaryExtensions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.temporaryEmergencyService.extensions(user.tenantId, id, this.scope(user));
  }

  @Post(':id/temporary-control/extend')
  @Permissions(PermissionKeys.MOCTemporaryExtend)
  extendTemporaryControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.requestExtension(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get('temporary/expiring')
  @Permissions(PermissionKeys.MOCTemporaryView)
  temporaryExpiring(@CurrentUser() user: RequestUser) {
    return this.temporaryEmergencyService.temporaryExpiring(user.tenantId, this.scope(user));
  }

  @Get('temporary/overdue')
  @Permissions(PermissionKeys.MOCTemporaryView)
  temporaryOverdue(@CurrentUser() user: RequestUser) {
    return this.temporaryEmergencyService.temporaryOverdue(user.tenantId, this.scope(user));
  }

  @Get('temporary/normalization-risk')
  @Permissions(PermissionKeys.MOCTemporaryView)
  temporaryNormalizationRisk(@CurrentUser() user: RequestUser) {
    return this.temporaryEmergencyService.normalizationRisk(user.tenantId, this.scope(user));
  }

  @Get(':id/emergency-control')
  @Permissions(PermissionKeys.MOCEmergencyView)
  emergencyControl(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.temporaryEmergencyService.emergency(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/emergency-control')
  @Permissions(PermissionKeys.MOCEmergencyEdit)
  updateEmergencyControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.updateEmergency(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/emergency-control/complete-review')
  @Permissions(PermissionKeys.MOCEmergencyReview)
  completeEmergencyReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.completeEmergencyReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/emergency-control/create-follow-up-action')
  @Permissions(PermissionKeys.MOCEmergencyReview)
  createEmergencyFollowupAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.createEmergencyFollowupAction(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/emergency-control/convert-to-permanent')
  @Permissions(PermissionKeys.MOCEmergencyConvert)
  convertEmergencyToPermanent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.temporaryEmergencyService.convertEmergencyToPermanent(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get('emergency/reviews-due')
  @Permissions(PermissionKeys.MOCEmergencyView)
  emergencyReviewsDue(@CurrentUser() user: RequestUser) {
    return this.temporaryEmergencyService.emergencyReviewsDue(user.tenantId, this.scope(user));
  }

  @Get('emergency/reviews-overdue')
  @Permissions(PermissionKeys.MOCEmergencyView)
  emergencyReviewsOverdue(@CurrentUser() user: RequestUser) {
    return this.temporaryEmergencyService.emergencyReviewsOverdue(user.tenantId, this.scope(user));
  }

  @Get(':id/pssr-startup')
  @Permissions(PermissionKeys.MOCStartupView)
  pssrStartup(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.startupService.aggregate(user.tenantId, id, this.scope(user));
  }

  @Get(':id/pssr')
  @Permissions(PermissionKeys.MOCPssrView)
  pssr(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.pssrService.mocPssr(user.tenantId, id);
  }

  @Post(':id/pssr/trigger')
  @Permissions(PermissionKeys.MOCPssrTrigger)
  triggerPssr(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.pssrService.triggerFromMoc(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/pssr/auto-evaluate')
  @Permissions(PermissionKeys.MOCPssrView)
  autoEvaluatePssr(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.pssrService.autoEvaluateMoc(user.tenantId, id, this.scope(user), dto.triggerEvent ?? dto.trigger_event ?? 'MOC Approved');
  }

  @Post(':id/pssr/auto-create')
  @Permissions(PermissionKeys.MOCPssrTrigger)
  autoCreatePssr(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.pssrService.autoCreateFromMoc(user.tenantId, user.id, id, this.scope(user), dto.triggerEvent ?? dto.trigger_event ?? 'MOC Approved');
  }

  @Get(':id/pssr/auto-creation-log')
  @Permissions(PermissionKeys.MOCPssrView)
  autoCreationLog(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.pssrService.mocAutoCreationLog(user.tenantId, id);
  }

  @Post(':id/pssr/sync')
  @Permissions(PermissionKeys.MOCPssrSync)
  syncPssr(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.startupService.syncPssr(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/startup-readiness')
  @Permissions(PermissionKeys.MOCStartupView)
  startupReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.startupService.startupReadiness(user.tenantId, id, this.scope(user));
  }

  @Post(':id/startup-readiness/check')
  @Permissions(PermissionKeys.MOCStartupCheck)
  runStartupReadinessCheck(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.startupService.runCheck(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/startup-blockers/create-action')
  @Permissions(PermissionKeys.MOCStartupCheck)
  createStartupBlockerAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.startupService.createStartupBlockerAction(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/release-for-startup')
  @Permissions(PermissionKeys.MOCReleaseForStartup)
  releaseForStartup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.startupService.releaseForStartup(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/return-to-implementation')
  @Permissions(PermissionKeys.MOCReturnToImplementation)
  returnToImplementation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.startupService.returnToImplementation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/communication-training')
  @Permissions(PermissionKeys.MOCCommunicationView)
  communicationTraining(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.aggregate(user.tenantId, id, this.scope(user));
  }

  @Get(':id/communication-training/summary')
  @Permissions(PermissionKeys.MOCCommunicationView)
  communicationTrainingSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.summaryOnly(user.tenantId, id, this.scope(user));
  }

  @Get(':id/communication-training/startup-blockers')
  @Permissions(PermissionKeys.MOCCommunicationView)
  communicationTrainingStartupBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.startupBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/stakeholders')
  @Permissions(PermissionKeys.MOCCommunicationView)
  stakeholders(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.stakeholders(user.tenantId, id, this.scope(user));
  }

  @Post(':id/stakeholders')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  addStakeholder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.createStakeholder(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/stakeholders/:stakeholderId')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  updateStakeholder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('stakeholderId') stakeholderId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.updateStakeholder(user.tenantId, user.id, id, stakeholderId, dto, this.scope(user));
  }

  @Delete(':id/stakeholders/:stakeholderId')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  deleteStakeholder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('stakeholderId') stakeholderId: string) {
    return this.communicationTrainingService.deleteStakeholder(user.tenantId, user.id, id, stakeholderId, this.scope(user));
  }

  @Post(':id/stakeholders/import-from-impact')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  importStakeholdersFromImpact(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.importFromImpact(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/stakeholders/import-from-equipment')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  importStakeholdersFromEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.importFromEquipment(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/communication-plan')
  @Permissions(PermissionKeys.MOCCommunicationView)
  communicationPlan(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.plan(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/communication-plan')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  updateCommunicationPlan(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.updatePlan(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/communication')
  @Permissions(PermissionKeys.MOCCommunicationSend)
  addCommunication(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.sendCommunication(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/communication/send')
  @Permissions(PermissionKeys.MOCCommunicationSend)
  sendCommunication(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.sendCommunication(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/communication/schedule')
  @Permissions(PermissionKeys.MOCCommunicationEdit)
  scheduleCommunication(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.scheduleCommunication(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/communication/logs')
  @Permissions(PermissionKeys.MOCCommunicationView)
  communicationLogs(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.logs(user.tenantId, id, this.scope(user));
  }

  @Post(':id/communication/logs/:logId/resend')
  @Permissions(PermissionKeys.MOCCommunicationSend)
  resendCommunicationLog(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('logId') logId: string) {
    return this.communicationTrainingService.resendLog(user.tenantId, user.id, id, logId, this.scope(user));
  }

  @Post(':id/communication/logs/:logId/reminder')
  @Permissions(PermissionKeys.MOCCommunicationSend)
  remindCommunicationLog(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('logId') logId: string) {
    return this.communicationTrainingService.remindLog(user.tenantId, user.id, id, logId, this.scope(user));
  }

  @Get(':id/acknowledgements')
  @Permissions(PermissionKeys.MOCAcknowledgementView)
  acknowledgements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.acknowledgements(user.tenantId, id, this.scope(user));
  }

  @Post(':id/acknowledgements/:ackId/acknowledge')
  @Permissions(PermissionKeys.MOCAcknowledgementAcknowledge)
  acknowledge(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ackId') ackId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.acknowledge(user.tenantId, user.id, id, ackId, dto, this.scope(user));
  }

  @Post(':id/acknowledgements/:ackId/reminder')
  @Permissions(PermissionKeys.MOCCommunicationSend)
  remindAcknowledgement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ackId') ackId: string) {
    return this.communicationTrainingService.remindAck(user.tenantId, user.id, id, ackId, this.scope(user));
  }

  @Post(':id/acknowledgements/:ackId/waive')
  @Permissions(PermissionKeys.MOCAcknowledgementWaive)
  waiveAcknowledgement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ackId') ackId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.waiveAck(user.tenantId, user.id, id, ackId, dto, this.scope(user));
  }

  @Get(':id/training-requirements')
  @Permissions(PermissionKeys.MOCTrainingView)
  trainingRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.trainingRequirements(user.tenantId, id, this.scope(user));
  }

  @Post(':id/training-requirements')
  @Permissions(PermissionKeys.MOCTrainingCreate)
  addTrainingRequirement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.createTrainingRequirement(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/training-requirements/:requirementId')
  @Permissions(PermissionKeys.MOCTrainingCreate)
  updateTrainingRequirement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.updateTrainingRequirement(user.tenantId, user.id, id, requirementId, dto, this.scope(user));
  }

  @Delete(':id/training-requirements/:requirementId')
  @Permissions(PermissionKeys.MOCTrainingCreate)
  deleteTrainingRequirement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string) {
    return this.communicationTrainingService.deleteTrainingRequirement(user.tenantId, user.id, id, requirementId, this.scope(user));
  }

  @Post(':id/training-requirements/generate-from-impact')
  @Permissions(PermissionKeys.MOCTrainingCreate)
  generateTrainingFromImpact(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.generateTrainingFromImpact(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/training-requirements/:requirementId/assign')
  @Permissions(PermissionKeys.MOCTrainingCreate)
  assignTraining(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.assignTraining(user.tenantId, user.id, id, requirementId, dto, this.scope(user));
  }

  @Get(':id/training-assignments')
  @Permissions(PermissionKeys.MOCTrainingView)
  trainingAssignments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.communicationTrainingService.trainingAssignments(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/training-assignments/:assignmentId')
  @Permissions(PermissionKeys.MOCTrainingComplete)
  updateTrainingAssignment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.updateTrainingAssignment(user.tenantId, user.id, id, assignmentId, dto, this.scope(user));
  }

  @Post(':id/training-assignments/:assignmentId/complete')
  @Permissions(PermissionKeys.MOCTrainingComplete)
  completeTrainingAssignment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.completeAssignment(user.tenantId, user.id, id, assignmentId, dto, this.scope(user));
  }

  @Post(':id/training-assignments/:assignmentId/verify')
  @Permissions(PermissionKeys.MOCTrainingVerify)
  verifyTrainingAssignment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.verifyAssignment(user.tenantId, user.id, id, assignmentId, dto, this.scope(user));
  }

  @Post(':id/training-assignments/:assignmentId/waive')
  @Permissions(PermissionKeys.MOCTrainingWaive)
  waiveTrainingAssignment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) {
    return this.communicationTrainingService.waiveAssignment(user.tenantId, user.id, id, assignmentId, dto, this.scope(user));
  }

  @Get(':id/history')
  @Permissions(PermissionKeys.MOCHistoryView)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() filters: Record<string, any>) {
    return this.historyService.list(user.tenantId, id, this.scope(user), filters);
  }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.MOCHistoryView)
  historySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.historyService.summary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/history/export/pdf')
  @Permissions(PermissionKeys.MOCHistoryExport)
  historyExportPdf(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.historyService.export(user.tenantId, id, this.scope(user), 'pdf');
  }

  @Get(':id/history/export/csv')
  @Permissions(PermissionKeys.MOCHistoryExport)
  historyExportCsv(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.historyService.export(user.tenantId, id, this.scope(user), 'csv');
  }

  @Get(':id/history/:eventId')
  @Permissions(PermissionKeys.MOCHistoryView)
  historyEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) {
    return this.historyService.getEvent(user.tenantId, id, eventId, this.scope(user));
  }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.MOCAttachmentsView)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.attachmentsService.list(user.tenantId, id, this.scope(user));
  }

  @Get(':id/attachments/summary')
  @Permissions(PermissionKeys.MOCAttachmentsView)
  attachmentsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.attachmentsService.summary(user.tenantId, id, this.scope(user));
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.MOCAttachmentsUpload)
  uploadAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, string>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.attachmentsService.upload(user.tenantId, user.id, id, dto, file, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.MOCAttachmentsView)
  getAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.get(user.tenantId, id, attachmentId, this.scope(user));
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.MOCAttachmentsDelete)
  deleteAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.remove(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/download')
  @Permissions(PermissionKeys.MOCAttachmentsDownload)
  downloadAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.download(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/preview')
  @Permissions(PermissionKeys.MOCAttachmentsPreview)
  previewAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.preview(user.tenantId, id, attachmentId, this.scope(user));
  }

  @Post(':id/attachments/link-document')
  @Permissions(PermissionKeys.MOCAttachmentsLinkDocument)
  linkAttachmentDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.attachmentsService.linkDocument(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id/attachments/unlink-document/:documentId')
  @Permissions(PermissionKeys.MOCAttachmentsLinkDocument)
  unlinkAttachmentDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.attachmentsService.unlinkDocument(user.tenantId, user.id, id, documentId, this.scope(user));
  }

  @Get(':id/report')
  @Permissions(PermissionKeys.MOCReportDownload)
  report(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.report(user.tenantId, id, this.scope(user));
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.MOCUploadDocuments)
  uploadDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, string>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.moc.uploadDocument(user.tenantId, user.id, id, dto, file, this.scope(user));
  }

  @Delete(':id/documents/:documentId')
  @Permissions(PermissionKeys.MOCUploadDocuments)
  deleteDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.moc.deleteDocument(user.tenantId, user.id, id, documentId, this.scope(user));
  }

  @Post(':id/generated-actions')
  @Permissions(PermissionKeys.MOCGenerateActions)
  createGeneratedActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.createGeneratedActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Post('generated-actions-preview')
  @Permissions(PermissionKeys.MOCCreate)
  generatedActionsPreview(@Body() dto: Partial<CreateMocDto>) {
    return this.moc.generatedActionsPreview(dto);
  }

  @Get('risk-dashboard')
  @Permissions(PermissionKeys.MOCRiskView)
  riskDashboard(@CurrentUser() user: RequestUser) {
    return this.riskService.dashboard(user.tenantId, this.scope(user));
  }

  @Get('risk-summary')
  @Permissions(PermissionKeys.MOCRiskView)
  riskSummary(@CurrentUser() user: RequestUser) {
    return this.riskService.summaryForTenant(user.tenantId, this.scope(user));
  }

  @Get(':id/generated-actions-preview')
  @Permissions(PermissionKeys.MOCRead)
  async persistedGeneratedActionsPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const moc = await this.moc.get(user.tenantId, id, this.scope(user));
    return moc.actions;
  }

  @Get(':id')
  @Permissions(PermissionKeys.MOCRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.moc.get(user.tenantId, id, this.scope(user));
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: Boolean(user.corporateView) };
  }
}
