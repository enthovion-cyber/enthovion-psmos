import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { CreateEquipmentDto } from '../equipment/dto/create-equipment.dto';
import { EquipmentFilterDto } from '../equipment/dto/equipment-filter.dto';
import { UpdateEquipmentDto } from '../equipment/dto/update-equipment.dto';
import { UploadEquipmentDocumentDto } from '../equipment/dto/upload-equipment-document.dto';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiLinkedRecordsDocumentsService } from './mi-linked-records-documents.service';
import { MechanicalIntegrityService } from './mechanical-integrity.service';

@ApiTags('mechanical-integrity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MechanicalIntegrityController {
  constructor(private readonly mi: MechanicalIntegrityService, private readonly linkedDocuments: MiLinkedRecordsDocumentsService) {}

  @Get('dashboard')
  @Permissions(PermissionKeys.MechanicalIntegrityDashboardView)
  dashboard(@CurrentUser() user: RequestUser) {
    return this.mi.dashboard(user);
  }

  @Get('dashboard/kpis')
  @Permissions(PermissionKeys.MechanicalIntegrityDashboardView)
  kpis(@CurrentUser() user: RequestUser) {
    return this.mi.dashboard(user).then((data) => data.kpis);
  }

  @Get('dashboard/critical-attention')
  @Permissions(PermissionKeys.MechanicalIntegrityDashboardView)
  criticalAttention(@CurrentUser() user: RequestUser) {
    return this.mi.dashboard(user).then((data) => data.criticalAttention);
  }

  @Get('dashboard/charts')
  @Permissions(PermissionKeys.MechanicalIntegrityDashboardView)
  charts(@CurrentUser() user: RequestUser) {
    return this.mi.dashboard(user).then((data) => data.charts);
  }

  @Get('dashboard/recent-activity')
  @Permissions(PermissionKeys.MechanicalIntegrityDashboardView)
  recentActivity(@CurrentUser() user: RequestUser) {
    return this.mi.recentActivity(user);
  }

  @Get('criticality/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalitySummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.criticalitySummary(user, query);
  }

  @Get('criticality/review-queue')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityReview)
  criticalityReviewQueue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.criticalityReviewQueue(user, query);
  }

  @Get('criticality/not-assessed')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityNotAssessed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.criticalityNotAssessed(user, query);
  }

  @Get('criticality/review-due')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityReviewDue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.criticalityReviewDue(user, query);
  }

  @Get('criticality/config')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigView)
  criticalityConfig(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityConfig(user);
  }

  @Post('criticality/config')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigManage)
  createCriticalityConfig(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createCriticalityConfig(user, body);
  }

  @Get('criticality/config/:configId')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigView)
  getCriticalityConfig(@CurrentUser() user: RequestUser, @Param('configId') configId: string) {
    return this.mi.getCriticalityConfig(user, configId);
  }

  @Patch('criticality/config/:configId')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigManage)
  updateCriticalityConfig(@CurrentUser() user: RequestUser, @Param('configId') configId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCriticalityConfig(user, configId, body);
  }

  @Post('criticality/config/:configId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigManage)
  archiveCriticalityConfig(@CurrentUser() user: RequestUser, @Param('configId') configId: string, @Body('reason') reason?: string) {
    return this.mi.archiveCriticalityConfig(user, configId, reason);
  }

  @Post('criticality/config/:configId/activate')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigManage)
  activateCriticalityConfig(@CurrentUser() user: RequestUser, @Param('configId') configId: string, @Body('reason') reason?: string) {
    return this.mi.activateCriticalityConfig(user, configId, reason);
  }

  @Get('criticality/config/:configId/impact-analysis')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityConfigView)
  criticalityConfigImpact(@CurrentUser() user: RequestUser, @Param('configId') configId: string) {
    return this.mi.criticalityConfigImpact(user, configId);
  }

  @Get('criticality/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityExport)
  async criticalityImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.criticalityImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('criticality/import')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  importCriticality(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importCriticality(user, body);
  }

  @Get('criticality/import/:jobId')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  getCriticalityImportJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.getCriticalityImportJob(user, jobId);
  }

  @Post('criticality/import/:jobId/validate')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  validateCriticalityImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.validateCriticalityImport(user, jobId);
  }

  @Post('criticality/import/:jobId/commit')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  commitCriticalityImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.commitCriticalityImport(user, jobId);
  }

  @Get('criticality/import/:jobId/error-report')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  async criticalityImportErrorReport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Res() response: any) {
    const file = await this.mi.criticalityImportErrorReport(user, jobId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('criticality/export')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityExport)
  async exportCriticality(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportCriticality(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('criticality')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.criticalityRegistry(user, query);
  }

  @Post('criticality/assessments')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  createCriticalityAssessment(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createCriticalityAssessment(user, body);
  }

  @Get('criticality/assessments/:assessmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.criticalityAssessmentDetail(user, assessmentId);
  }

  @Patch('criticality/assessments/:assessmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityEdit)
  updateCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCriticalityAssessment(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalitySubmit)
  submitCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.submitCriticalityAssessment(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityApprove)
  approveCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.approveCriticalityAssessment(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityReject)
  rejectCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectCriticalityAssessment(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityReview)
  returnCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.returnCriticalityAssessment(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/create-revision')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  reviseCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createCriticalityRevision(user, assessmentId, body);
  }

  @Post('criticality/assessments/:assessmentId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityArchive)
  archiveCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body('reason') reason?: string) {
    return this.mi.archiveCriticalityAssessment(user, assessmentId, reason);
  }

  @Post('criticality/assessments/:assessmentId/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCalculationRecalculate)
  recalculateCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.recalculateCriticalityAssessment(user, assessmentId);
  }

  @Get('criticality/assessments/:assessmentId/history')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityAssessmentHistory(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.criticalityAssessmentHistory(user, assessmentId);
  }

  @Get('criticality/assessments/:assessmentId/consequence-scores')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  consequenceScores(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.criticalityConsequenceScores(user, assessmentId);
  }

  @Patch('criticality/assessments/:assessmentId/consequence-scores')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityEdit)
  updateConsequenceScores(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCriticalityConsequenceScores(user, assessmentId, body);
  }

  @Get('criticality/assessments/:assessmentId/likelihood-scores')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  likelihoodScores(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.criticalityLikelihoodScores(user, assessmentId);
  }

  @Patch('criticality/assessments/:assessmentId/likelihood-scores')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityEdit)
  updateLikelihoodScores(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCriticalityLikelihoodScores(user, assessmentId, body);
  }

  @Get('criticality/assessments/:assessmentId/calculation')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCalculationView)
  criticalityCalculation(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) {
    return this.mi.criticalityCalculation(user, assessmentId);
  }

  @Post('criticality/assessments/:assessmentId/manual-override')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityOverride)
  criticalityManualOverride(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) {
    return this.mi.criticalityManualOverride(user, assessmentId, body);
  }

  @Get('criticality/assessments/:assessmentId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityExport)
  async exportCriticalityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Res() response: any) {
    const file = await this.mi.exportCriticalityAssessment(user, assessmentId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('lookups/criticality-categories')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  criticalityCategories(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.categories);
  }

  @Get('lookups/risk-matrices')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  riskMatrices(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.riskMatrices);
  }

  @Get('lookups/consequence-dimensions')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  consequenceDimensions(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.consequenceDimensions);
  }

  @Get('lookups/likelihood-dimensions')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  likelihoodDimensions(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.likelihoodDimensions);
  }

  @Get('lookups/assessment-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  assessmentTypes(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.assessmentTypes);
  }

  @Get('lookups/inspection-priorities')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  inspectionPriorities(@CurrentUser() user: RequestUser) {
    return this.mi.criticalityLookups(user).then((lookups) => lookups.inspectionPriorities);
  }

  @Get('inspections/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  inspectionRecordSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionRecordSummary(user, query);
  }

  @Get('inspections/review-queue')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordReview)
  inspectionReviewQueue(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionReviewQueue(user);
  }

  @Get('inspections/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  async inspectionRecordImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.inspectionRecordImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('inspections/import')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  importInspectionRecords(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importInspectionRecords(user, body);
  }

  @Get('inspections/import/:jobId')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  inspectionRecordImportJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.getInspectionRecordImportJob(user, jobId);
  }

  @Post('inspections/import/:jobId/validate')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  validateInspectionRecordImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.validateInspectionRecordImportJob(user, jobId);
  }

  @Post('inspections/import/:jobId/commit')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  commitInspectionRecordImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.commitInspectionRecordImportJob(user, jobId);
  }

  @Get('inspections/import/:jobId/error-report')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  async inspectionRecordImportErrorReport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Res() response: any) {
    const file = await this.mi.inspectionRecordImportErrorReport(user, jobId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspections/export')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordExport)
  async exportInspectionRecords(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportInspectionRecords(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspections')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  inspectionRecords(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionRecordRegistry(user, query);
  }

  @Post('inspections')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordCreate)
  createInspectionRecord(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecord(user, body);
  }

  @Post('inspection-schedule/occurrences/:occurrenceId/start')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordCreate)
  startInspectionOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecordFromOccurrence(user, occurrenceId, body);
  }

  @Post('inspection-schedule/occurrences/:occurrenceId/execute')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordCreate)
  executeInspectionOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecordFromOccurrence(user, occurrenceId, body);
  }

  @Post('inspection-schedule/occurrences/:occurrenceId/create-inspection-record')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordCreate)
  createInspectionFromOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecordFromOccurrence(user, occurrenceId, body);
  }

  @Post('inspection-schedule/occurrences/:occurrenceId/complete')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordApprove)
  completeInspectionOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecordFromOccurrence(user, occurrenceId, body).then((detail: any) => this.mi.approveInspectionRecord(user, detail.record.id, body));
  }

  @Get('inspections/:inspectionId/checklist')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistExecute)
  inspectionRecordChecklist(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordChecklist(user, inspectionId);
  }

  @Patch('inspections/:inspectionId/checklist/:itemId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistExecute)
  updateInspectionRecordChecklist(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('itemId') itemId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionChecklistItem(user, inspectionId, itemId, body);
  }

  @Post('inspections/:inspectionId/checklist/:itemId/evidence')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistExecute)
  addChecklistEvidence(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('itemId') itemId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionChecklistItem(user, inspectionId, itemId, { ...body, evidenceDocumentId: body.documentId ?? body.fileId });
  }

  @Get('inspections/:inspectionId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  inspectionRecordReadings(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordReadings(user, inspectionId);
  }

  @Post('inspections/:inspectionId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingCreate)
  addInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionRecordReading(user, inspectionId, body);
  }

  @Patch('inspections/:inspectionId/readings/:readingId')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingEdit)
  updateInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionRecordReading(user, inspectionId, readingId, body);
  }

  @Post('inspections/:inspectionId/readings/:readingId/review')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingReview)
  reviewInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.reviewInspectionReading(user, inspectionId, readingId, body);
  }

  @Post('inspections/:inspectionId/readings/:readingId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingApprove)
  approveInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.approveInspectionReading(user, inspectionId, readingId, body);
  }

  @Post('inspections/:inspectionId/readings/:readingId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingReject)
  rejectInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectInspectionReading(user, inspectionId, readingId, body);
  }

  @Post('inspections/:inspectionId/readings/:readingId/supersede')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingSupersede)
  supersedeInspectionRecordReading(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.supersedeInspectionReading(user, inspectionId, readingId, body);
  }

  @Post('inspections/:inspectionId/readings/approve-all-valid')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingApprove)
  approveAllValidInspectionReadings(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.approveAllValidInspectionReadings(user, inspectionId, body);
  }

  @Get('inspections/:inspectionId/remaining-life-preview')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeView)
  inspectionRemainingLifePreview(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordRemainingLifePreview(user, inspectionId);
  }

  @Post('inspections/:inspectionId/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeRecalculate)
  recalculateInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.recalculateInspectionRecord(user, inspectionId);
  }

  @Get('inspections/:inspectionId/findings')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingView)
  inspectionFindings(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordFindings(user, inspectionId);
  }

  @Post('inspections/:inspectionId/findings')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingCreate)
  createInspectionFinding(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionFinding(user, inspectionId, body);
  }

  @Patch('inspections/:inspectionId/findings/:findingId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingEdit)
  updateInspectionFinding(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('findingId') findingId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionFinding(user, inspectionId, findingId, body);
  }

  @Post('inspections/:inspectionId/findings/:findingId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingClose)
  closeInspectionFinding(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('findingId') findingId: string, @Body() body: Record<string, any>) {
    return this.mi.closeInspectionFinding(user, inspectionId, findingId, body);
  }

  @Post('inspections/:inspectionId/findings/:findingId/create-action')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingLinkAction)
  createActionFromFinding(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('findingId') findingId: string, @Body() body: Record<string, any>) {
    return this.mi.createActionFromInspectionFinding(user, inspectionId, findingId, body);
  }

  @Post('inspections/:inspectionId/findings/:findingId/create-deficiency-placeholder')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingEdit)
  createDeficiencyPlaceholderFromFinding(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('findingId') findingId: string, @Body() body: Record<string, any>) {
    return this.mi.createDeficiencyPlaceholderFromFinding(user, inspectionId, findingId, body);
  }

  @Post('inspections/:inspectionId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordSubmit)
  submitInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.submitInspectionRecord(user, inspectionId, body);
  }

  @Post('inspections/:inspectionId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordApprove)
  approveInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.approveInspectionRecord(user, inspectionId, body);
  }

  @Post('inspections/:inspectionId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordReject)
  rejectInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectInspectionRecord(user, inspectionId, body);
  }

  @Post('inspections/:inspectionId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordReview)
  returnInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.returnInspectionRecordForCorrection(user, inspectionId, body);
  }

  @Get('inspections/:inspectionId/reviews')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordReview)
  inspectionRecordReviews(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordReviews(user, inspectionId);
  }

  @Get('inspections/:inspectionId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsView)
  inspectionRecordDocuments(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordDocuments(user, inspectionId);
  }

  @Post('inspections/:inspectionId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  addInspectionRecordDocument(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionRecordDocument(user, inspectionId, body);
  }

  @Delete('inspections/:inspectionId/documents/:documentLinkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  removeInspectionRecordDocument(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Param('documentLinkId') documentLinkId: string) {
    return this.mi.removeInspectionRecordDocument(user, inspectionId, documentLinkId);
  }

  @Get('inspections/:inspectionId/report')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordExport)
  async inspectionRecordReport(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Res() response: any) {
    const file = await this.mi.inspectionRecordReport(user, inspectionId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspections/:inspectionId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordExport)
  async exportInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Res() response: any) {
    const file = await this.mi.inspectionRecordReport(user, inspectionId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('inspections/:inspectionId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordArchive)
  archiveInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body('reason') reason?: string) {
    return this.mi.archiveInspectionRecord(user, inspectionId, reason);
  }

  @Get('inspections/:inspectionId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  inspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordDetail(user, inspectionId);
  }

  @Patch('inspections/:inspectionId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordEdit)
  updateInspectionRecord(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionRecord(user, inspectionId, body);
  }

  @Get('lookups/inspection-record-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  inspectionRecordStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.inspectionRecordStatuses);
  }

  @Get('lookups/inspection-results')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  inspectionResults(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.inspectionResults);
  }

  @Get('lookups/reading-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  readingStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.readingStatuses);
  }

  @Get('lookups/finding-types')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingView)
  findingTypes(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.findingTypes);
  }

  @Get('lookups/finding-severities')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionFindingView)
  findingSeverities(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.findingSeverities);
  }

  @Get('lookups/surface-conditions')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  surfaceConditions(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.surfaceConditions);
  }

  @Get('lookups/scan-directions')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  scanDirections(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionRecordLookups(user).then((data) => data.scanDirections);
  }

  @Get('inspection-plans/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionPlanSummary(user, query);
  }

  @Get('inspection-plans/due')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  dueInspectionPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionPlanRegistry(user, { ...query, dueSoon: 'true' });
  }

  @Get('inspection-plans/overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  overdueInspectionPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionPlanRegistry(user, { ...query, overdue: 'true' });
  }

  @Get('inspection-plans/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  async inspectionPlanImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.inspectionPlanImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('relief-devices/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  async reliefDeviceImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.reliefDeviceImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('relief-devices/export')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceExport)
  async exportReliefDevices(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportReliefDevices(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('relief-devices/import')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  importReliefDevices(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importReliefDevices(user, body);
  }

  @Get('relief-devices/import/:jobId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  reliefDeviceImportJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.reliefDeviceImportJob(user, jobId);
  }

  @Post('relief-devices/import/:jobId/validate')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  validateReliefDeviceImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.validateReliefDeviceImport(user, jobId);
  }

  @Post('relief-devices/import/:jobId/commit')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  commitReliefDeviceImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.commitReliefDeviceImport(user, jobId);
  }

  @Get('relief-devices/import/:jobId/error-report')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceImport)
  async reliefDeviceImportErrorReport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Res() response: any) {
    const file = await this.mi.reliefDeviceImportErrorReport(user, jobId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('relief-devices/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  reliefDeviceSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefDeviceSummary(user, query);
  }

  @Get('relief-devices/due')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerView)
  reliefDevicesDue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefDevicesDue(user, query);
  }

  @Get('relief-devices/overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerView)
  reliefDevicesOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefDevicesOverdue(user, query);
  }

  @Get('relief-devices/failed')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefDevicesFailed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefDevicesFailed(user, query);
  }

  @Post('relief-devices/scheduler/run')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerRun)
  runReliefScheduler(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.runReliefScheduler(user, body);
  }

  @Get('relief-devices/tests')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefTests(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefTestRegistry(user, query);
  }

  @Post('relief-devices/tests')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestCreate)
  createReliefTest(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createReliefTest(user, body);
  }

  @Get('relief-devices/tests/:testId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestExport)
  async exportReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Res() response: any) {
    const file = await this.mi.exportReliefTest(user, testId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('relief-devices/tests/:testId/certificate')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefCertificateView)
  reliefTestCertificate(@CurrentUser() user: RequestUser, @Param('testId') testId: string) {
    return this.mi.reliefTestCertificate(user, testId);
  }

  @Get('relief-devices/tests/:testId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string) {
    return this.mi.reliefTestDetail(user, testId);
  }

  @Patch('relief-devices/tests/:testId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestEdit)
  updateReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.mi.updateReliefTest(user, testId, body);
  }

  @Post('relief-devices/tests/:testId/evaluate')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestReview)
  evaluateReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string) {
    return this.mi.evaluateReliefTest(user, testId);
  }

  @Post('relief-devices/tests/:testId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestSubmit)
  submitReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.mi.submitReliefTest(user, testId, body);
  }

  @Post('relief-devices/tests/:testId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestApprove)
  approveReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.mi.approveReliefTest(user, testId, body);
  }

  @Post('relief-devices/tests/:testId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestReject)
  rejectReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectReliefTest(user, testId, body);
  }

  @Post('relief-devices/tests/:testId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestReview)
  returnReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.mi.returnReliefTest(user, testId, body);
  }

  @Get('relief-devices')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  reliefDeviceDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.reliefDeviceDashboard(user, query);
  }

  @Post('relief-devices')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceCreate)
  createReliefDevice(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createReliefDevice(user, body);
  }

  @Get('relief-devices/:reliefDeviceId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceExport)
  async exportReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Res() response: any) {
    const file = await this.mi.exportReliefDevice(user, reliefDeviceId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('relief-devices/:reliefDeviceId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  reliefDevice(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefDeviceDetail(user, reliefDeviceId);
  }

  @Patch('relief-devices/:reliefDeviceId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceEdit)
  updateReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.updateReliefDevice(user, reliefDeviceId, body);
  }

  @Post('relief-devices/:reliefDeviceId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceArchive)
  archiveReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.archiveReliefDevice(user, reliefDeviceId, body);
  }

  @Post('relief-devices/:reliefDeviceId/reactivate')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceEdit)
  reactivateReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.reactivateReliefDevice(user, reliefDeviceId, body);
  }

  @Get('relief-devices/:reliefDeviceId/technical-data')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceTechnicalView)
  reliefTechnicalData(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefTechnicalData(user, reliefDeviceId);
  }

  @Patch('relief-devices/:reliefDeviceId/technical-data')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceTechnicalEdit)
  updateReliefTechnicalData(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.updateReliefTechnicalData(user, reliefDeviceId, body);
  }

  @Get('relief-devices/:reliefDeviceId/relief-basis')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefBasisView)
  reliefBasis(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefBasis(user, reliefDeviceId);
  }

  @Patch('relief-devices/:reliefDeviceId/relief-basis')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefBasisEdit)
  updateReliefBasis(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.updateReliefBasis(user, reliefDeviceId, body);
  }

  @Get('relief-devices/:reliefDeviceId/protected-equipment')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefProtectionView)
  reliefProtectedEquipment(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefProtectedEquipment(user, reliefDeviceId);
  }

  @Post('relief-devices/:reliefDeviceId/protected-equipment')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefProtectionManage)
  linkReliefProtectedEquipment(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.linkReliefProtectedEquipment(user, reliefDeviceId, body);
  }

  @Delete('relief-devices/:reliefDeviceId/protected-equipment/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefProtectionManage)
  unlinkReliefProtectedEquipment(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Param('linkId') linkId: string) {
    return this.mi.unlinkReliefProtectedEquipment(user, reliefDeviceId, linkId);
  }

  @Get('relief-devices/:reliefDeviceId/seals')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  reliefSeals(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefSeals(user, reliefDeviceId);
  }

  @Patch('relief-devices/:reliefDeviceId/seals')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceEdit)
  updateReliefSeals(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.updateReliefSeals(user, reliefDeviceId, body);
  }

  @Post('relief-devices/:reliefDeviceId/seals/change-status')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceEdit)
  changeReliefSealStatus(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.changeReliefSealStatus(user, reliefDeviceId, body);
  }

  @Get('relief-devices/:reliefDeviceId/certificates')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefCertificateView)
  reliefCertificates(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefCertificates(user, reliefDeviceId);
  }

  @Post('relief-devices/:reliefDeviceId/certificates')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefCertificateManage)
  addReliefCertificate(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Body() body: Record<string, any>) {
    return this.mi.addReliefCertificate(user, reliefDeviceId, body);
  }

  @Delete('relief-devices/:reliefDeviceId/certificates/:certificateId')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefCertificateManage)
  deleteReliefCertificate(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Param('certificateId') certificateId: string) {
    return this.mi.deleteReliefCertificate(user, reliefDeviceId, certificateId);
  }

  @Get('relief-devices/:reliefDeviceId/test-history')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefTestHistory(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefDeviceTestHistory(user, reliefDeviceId);
  }

  @Post('relief-devices/:reliefDeviceId/schedule/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerRun)
  recalculateReliefSchedule(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.recalculateReliefSchedule(user, reliefDeviceId);
  }

  @Get('relief-devices/:reliefDeviceId/occurrences')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerView)
  reliefOccurrences(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string) {
    return this.mi.reliefOccurrences(user, reliefDeviceId);
  }

  @Post('relief-devices/occurrences/:occurrenceId/create-test')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestCreate)
  createReliefTestFromOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.createReliefTestFromOccurrence(user, occurrenceId, body);
  }

  @Post('relief-devices/occurrences/:occurrenceId/complete')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefSchedulerRun)
  completeReliefOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) {
    return this.mi.completeReliefOccurrence(user, occurrenceId, body);
  }

  @Get('preventive-maintenance/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanImport)
  async pmImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.pmImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('preventive-maintenance/import')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanImport)
  importPm(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importPm(user, body);
  }

  @Get('preventive-maintenance/export')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanExport)
  async exportPm(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportPm(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('preventive-maintenance')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  pmDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.pmDashboard(user, query);
  }

  @Get('preventive-maintenance/plans')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  pmPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.pmPlanRegistry(user, query);
  }

  @Post('preventive-maintenance/plans')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanCreate)
  createPmPlan(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createPmPlan(user, body);
  }

  @Get('preventive-maintenance/due')
  @Permissions(PermissionKeys.MechanicalIntegrityPmSchedulerView)
  pmDue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.pmDue(user, query);
  }

  @Get('preventive-maintenance/overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityPmSchedulerView)
  pmOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.pmOverdue(user, query);
  }

  @Post('preventive-maintenance/scheduler/run')
  @Permissions(PermissionKeys.MechanicalIntegrityPmSchedulerRun)
  runPmScheduler(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.runPmScheduler(user, body);
  }

  @Get('preventive-maintenance/records')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordView)
  pmRecords(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.pmRecordRegistry(user, query);
  }

  @Post('preventive-maintenance/records')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordCreate)
  createPmRecord(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createPmRecord(user, body);
  }

  @Get('preventive-maintenance/records/:pmRecordId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordExport)
  async exportPmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Res() response: any) {
    const file = await this.mi.exportPmRecord(user, pmRecordId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('preventive-maintenance/records/:pmRecordId')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordView)
  pmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string) {
    return this.mi.pmRecordDetail(user, pmRecordId);
  }

  @Patch('preventive-maintenance/records/:pmRecordId')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordEdit)
  updatePmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.updatePmRecord(user, pmRecordId, body);
  }

  @Post('preventive-maintenance/records/:pmRecordId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordSubmit)
  submitPmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.submitPmRecord(user, pmRecordId, body);
  }

  @Post('preventive-maintenance/records/:pmRecordId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordApprove)
  approvePmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.approvePmRecord(user, pmRecordId, body);
  }

  @Post('preventive-maintenance/records/:pmRecordId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordReject)
  rejectPmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectPmRecord(user, pmRecordId, body);
  }

  @Post('preventive-maintenance/records/:pmRecordId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordReview)
  returnPmRecord(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.returnPmRecord(user, pmRecordId, body);
  }

  @Get('preventive-maintenance/plans/:pmPlanId')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  pmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string) {
    return this.mi.pmPlanDetail(user, pmPlanId);
  }

  @Patch('preventive-maintenance/plans/:pmPlanId')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanEdit)
  updatePmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.updatePmPlan(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanSubmit)
  submitPmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.submitPmPlan(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanApprove)
  approvePmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.approvePmPlan(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanReject)
  rejectPmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectPmPlan(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/create-revision')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanCreate)
  createPmPlanRevision(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.createPmPlanRevision(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanArchive)
  archivePmPlan(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.archivePmPlan(user, pmPlanId, body);
  }

  @Post('preventive-maintenance/plans/:pmPlanId/schedule/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityPmSchedulerRun)
  recalculatePmPlanSchedule(@CurrentUser() user: RequestUser, @Param('pmPlanId') pmPlanId: string) {
    return this.mi.recalculatePmPlanSchedule(user, pmPlanId);
  }

  @Get('calibration/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanImport)
  async calibrationImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.calibrationImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('calibration/import')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanImport)
  importCalibration(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importCalibration(user, body);
  }

  @Get('calibration/export')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanExport)
  async exportCalibration(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportCalibration(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('calibration')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  calibrationDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationDashboard(user, query);
  }

  @Get('calibration/plans')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  calibrationPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationPlanRegistry(user, query);
  }

  @Post('calibration/plans')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanCreate)
  createCalibrationPlan(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createCalibrationPlan(user, body);
  }

  @Get('calibration/due')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationSchedulerView)
  calibrationDue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationDue(user, query);
  }

  @Get('calibration/overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationSchedulerView)
  calibrationOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationOverdue(user, query);
  }

  @Get('calibration/failed')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordView)
  calibrationFailed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationFailed(user, query);
  }

  @Post('calibration/scheduler/run')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationSchedulerRun)
  runCalibrationScheduler(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.runCalibrationScheduler(user, body);
  }

  @Get('calibration/records')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordView)
  calibrationRecords(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.calibrationRecordRegistry(user, query);
  }

  @Post('calibration/records')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordCreate)
  createCalibrationRecord(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createCalibrationRecord(user, body);
  }

  @Get('calibration/records/:calibrationRecordId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordExport)
  async exportCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Res() response: any) {
    const file = await this.mi.exportCalibrationRecord(user, calibrationRecordId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('calibration/records/:calibrationRecordId')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordView)
  calibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string) {
    return this.mi.calibrationRecordDetail(user, calibrationRecordId);
  }

  @Patch('calibration/records/:calibrationRecordId')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordEdit)
  updateCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCalibrationRecord(user, calibrationRecordId, body);
  }

  @Post('calibration/records/:calibrationRecordId/evaluate')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordReview)
  evaluateCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string) {
    return this.mi.evaluateCalibrationRecord(user, calibrationRecordId);
  }

  @Post('calibration/records/:calibrationRecordId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordSubmit)
  submitCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.submitCalibrationRecord(user, calibrationRecordId, body);
  }

  @Post('calibration/records/:calibrationRecordId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordApprove)
  approveCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.approveCalibrationRecord(user, calibrationRecordId, body);
  }

  @Post('calibration/records/:calibrationRecordId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordReject)
  rejectCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectCalibrationRecord(user, calibrationRecordId, body);
  }

  @Post('calibration/records/:calibrationRecordId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordReview)
  returnCalibrationRecord(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.mi.returnCalibrationRecord(user, calibrationRecordId, body);
  }

  @Get('calibration/plans/:calibrationPlanId')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  calibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string) {
    return this.mi.calibrationPlanDetail(user, calibrationPlanId);
  }

  @Patch('calibration/plans/:calibrationPlanId')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanEdit)
  updateCalibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCalibrationPlan(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanSubmit)
  submitCalibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.submitCalibrationPlan(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanApprove)
  approveCalibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.approveCalibrationPlan(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanReject)
  rejectCalibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectCalibrationPlan(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/create-revision')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanCreate)
  createCalibrationPlanRevision(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.createCalibrationPlanRevision(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanArchive)
  archiveCalibrationPlan(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string, @Body() body: Record<string, any>) {
    return this.mi.archiveCalibrationPlan(user, calibrationPlanId, body);
  }

  @Post('calibration/plans/:calibrationPlanId/schedule/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationSchedulerRun)
  recalculateCalibrationPlanSchedule(@CurrentUser() user: RequestUser, @Param('calibrationPlanId') calibrationPlanId: string) {
    return this.mi.recalculateCalibrationPlanSchedule(user, calibrationPlanId);
  }

  @Get('equipment/:equipmentId/relief-devices')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  equipmentReliefDevices(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentReliefDevices(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/relief-devices')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceCreate)
  createEquipmentReliefDevice(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createReliefDevice(user, { ...body, protectedEquipmentId: equipmentId, equipmentId });
  }

  @Get('equipment/:equipmentId/relief-protection-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefProtectionView)
  equipmentReliefProtectionSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentReliefProtectionSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/relief-devices/tests')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  equipmentReliefTests(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentReliefTests(user, equipmentId, query);
  }

  @Get('equipment/:equipmentId/preventive-maintenance')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  equipmentPm(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentPm(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/preventive-maintenance')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanCreate)
  createEquipmentPmPlan(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createPmPlan(user, { ...body, equipmentId });
  }

  @Get('equipment/:equipmentId/pm-records')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordView)
  equipmentPmRecords(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentPmRecords(user, equipmentId, query);
  }

  @Get('equipment/:equipmentId/calibration')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  equipmentCalibration(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentCalibration(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/calibration')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanCreate)
  createEquipmentCalibrationPlan(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createCalibrationPlan(user, { ...body, equipmentId });
  }

  @Get('equipment/:equipmentId/calibration-records')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordView)
  equipmentCalibrationRecords(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentCalibrationRecords(user, equipmentId, query);
  }

  @Get('lookups/pm-categories')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  pmCategories(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).pmCategories;
  }

  @Get('lookups/pm-task-types')
  @Permissions(PermissionKeys.MechanicalIntegrityPmPlanView)
  pmTaskTypes(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).pmTaskTypes;
  }

  @Get('lookups/calibration-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  calibrationTypes(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).calibrationTypes;
  }

  @Get('lookups/instrument-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  instrumentTypes(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).instrumentTypes;
  }

  @Get('lookups/tolerance-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationPlanView)
  toleranceTypes(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).toleranceTypes;
  }

  @Get('lookups/pm-results')
  @Permissions(PermissionKeys.MechanicalIntegrityPmRecordView)
  pmResults(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).pmResults;
  }

  @Get('lookups/calibration-results')
  @Permissions(PermissionKeys.MechanicalIntegrityCalibrationRecordView)
  calibrationResults(@CurrentUser() user: RequestUser) {
    return this.mi.pmCalibrationLookups(user).calibrationResults;
  }

  @Get('lookups/relief-device-types')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  reliefDeviceTypes(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).deviceTypes;
  }

  @Get('lookups/relief-scenario-types')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefBasisView)
  reliefScenarioTypes(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).scenarioTypes;
  }

  @Get('lookups/relief-test-types')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefTestTypes(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).testTypes;
  }

  @Get('lookups/relief-test-results')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  reliefTestResults(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).testResults;
  }

  @Get('lookups/seat-tightness-standards')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefTestView)
  seatTightnessStandards(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).seatTightnessStandards;
  }

  @Get('lookups/seal-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  sealStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).sealStatuses;
  }

  @Get('lookups/car-seal-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityReliefDeviceView)
  carSealStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.reliefLookups(user).carSealStatuses;
  }

  @Post('inspection-plans/import')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  importInspectionPlans(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.importInspectionPlans(user, body);
  }

  @Get('inspection-plans/import/:jobId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  inspectionPlanImportJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.getInspectionPlanImportJob(user, jobId);
  }

  @Post('inspection-plans/import/:jobId/validate')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  validateInspectionPlanImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.validateInspectionPlanImportJob(user, jobId);
  }

  @Post('inspection-plans/import/:jobId/commit')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  commitInspectionPlanImport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.mi.commitInspectionPlanImportJob(user, jobId);
  }

  @Get('inspection-plans/import/:jobId/error-report')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanImport)
  async inspectionPlanImportErrorReport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Res() response: any) {
    const file = await this.mi.inspectionPlanImportErrorReport(user, jobId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspection-plans/export')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanExport)
  async exportInspectionPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportInspectionPlans(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspection-plans')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlans(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionPlanRegistry(user, query);
  }

  @Post('inspection-plans')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanCreate)
  createInspectionPlan(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createInspectionPlan(user, body);
  }

  @Get('inspection-scheduler/rules')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRuleView)
  schedulerRules(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.mi.inspectionSchedulerRules(user, query);
  }

  @Post('inspection-scheduler/rules')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRuleManage)
  createSchedulerRule(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.createInspectionSchedulerRule(user, body);
  }

  @Get('inspection-scheduler/rules/:ruleId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRuleView)
  schedulerRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.mi.inspectionSchedulerRules(user, {}).then((rules) => rules.find((rule: any) => rule.id === ruleId) ?? null);
  }

  @Patch('inspection-scheduler/rules/:ruleId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRuleManage)
  updateSchedulerRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionSchedulerRule(user, ruleId, body);
  }

  @Post('inspection-scheduler/rules/:ruleId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRuleManage)
  archiveSchedulerRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.mi.archiveInspectionSchedulerRule(user, ruleId);
  }

  @Post('inspection-scheduler/run')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRun)
  runInspectionScheduler(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.mi.runInspectionScheduler(user, body);
  }

  @Get('inspection-scheduler/runs')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerView)
  schedulerRuns(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionSchedulerRuns(user);
  }

  @Get('inspection-plans/:planId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanExport)
  async exportInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Res() response: any) {
    const file = await this.mi.exportInspectionPlan(user, planId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('inspection-plans/:planId/scope')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanScope(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanScope(user, planId);
  }

  @Patch('inspection-plans/:planId/scope')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanEdit)
  updateInspectionPlanScope(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionPlanScope(user, planId, body);
  }

  @Get('inspection-plans/:planId/cml-scope')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanCmlScope(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanCmlScope(user, planId);
  }

  @Patch('inspection-plans/:planId/cml-scope')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanEdit)
  updateInspectionPlanCmlScope(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionPlanCmlScope(user, planId, body);
  }

  @Get('inspection-plans/:planId/checklist')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistView)
  inspectionPlanChecklist(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanChecklist(user, planId);
  }

  @Post('inspection-plans/:planId/checklist')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistManage)
  addInspectionPlanChecklist(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionPlanChecklistItem(user, planId, body);
  }

  @Patch('inspection-plans/:planId/checklist/:itemId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistManage)
  updateInspectionPlanChecklist(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Param('itemId') itemId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionPlanChecklistItem(user, planId, itemId, body);
  }

  @Delete('inspection-plans/:planId/checklist/:itemId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistManage)
  deleteInspectionPlanChecklist(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Param('itemId') itemId: string) {
    return this.mi.deleteInspectionPlanChecklistItem(user, planId, itemId);
  }

  @Get('inspection-plans/:planId/acceptance-criteria')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionCriteriaView)
  inspectionPlanCriteria(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanAcceptanceCriteria(user, planId);
  }

  @Post('inspection-plans/:planId/acceptance-criteria')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionCriteriaManage)
  addInspectionPlanCriterion(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionPlanAcceptanceCriterion(user, planId, body);
  }

  @Patch('inspection-plans/:planId/acceptance-criteria/:criterionId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionCriteriaManage)
  updateInspectionPlanCriterion(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Param('criterionId') criterionId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionPlanAcceptanceCriterion(user, planId, criterionId, body);
  }

  @Post('inspection-plans/:planId/schedule/preview')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerView)
  previewInspectionSchedule(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.previewInspectionSchedule(user, planId);
  }

  @Post('inspection-plans/:planId/schedule/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerRun)
  recalculateInspectionSchedule(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.previewInspectionSchedule(user, planId, { persist: true });
  }

  @Post('inspection-plans/:planId/schedule/manual-override')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerOverride)
  inspectionManualOverride(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.applyInspectionManualOverride(user, planId, body);
  }

  @Get('inspection-plans/:planId/schedule/evaluations')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerView)
  inspectionScheduleEvaluations(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanEvaluations(user, planId);
  }

  @Get('inspection-plans/:planId/schedule/occurrences')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionOccurrenceView)
  inspectionScheduleOccurrences(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanOccurrences(user, planId);
  }

  @Post('inspection-plans/:planId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanSubmit)
  submitInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.submitInspectionPlan(user, planId, body);
  }

  @Post('inspection-plans/:planId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanApprove)
  approveInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.approveInspectionPlan(user, planId, body);
  }

  @Post('inspection-plans/:planId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanReject)
  rejectInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectInspectionPlan(user, planId, body);
  }

  @Post('inspection-plans/:planId/create-revision')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanRevisionCreate)
  createInspectionPlanRevision(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionPlanRevision(user, planId, body.reason);
  }

  @Get('inspection-plans/:planId/revisions')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanRevisions(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanRevisions(user, planId);
  }

  @Get('inspection-plans/:planId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanDocuments(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanDocuments(user, planId);
  }

  @Post('inspection-plans/:planId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  addInspectionPlanDocument(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.addInspectionPlanDocument(user, planId, body);
  }

  @Delete('inspection-plans/:planId/documents/:documentLinkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  removeInspectionPlanDocument(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Param('documentLinkId') documentLinkId: string) {
    return this.mi.removeInspectionPlanDocument(user, planId, documentLinkId);
  }

  @Post('inspection-plans/:planId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanArchive)
  archiveInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body('reason') reason?: string) {
    return this.mi.archiveInspectionPlan(user, planId, reason);
  }

  @Post('inspection-plans/:planId/reactivate')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanEdit)
  reactivateInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body('reason') reason?: string) {
    return this.mi.reactivateInspectionPlan(user, planId, reason);
  }

  @Get('inspection-plans/:planId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string) {
    return this.mi.inspectionPlanDetail(user, planId);
  }

  @Patch('inspection-plans/:planId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanEdit)
  updateInspectionPlan(@CurrentUser() user: RequestUser, @Param('planId') planId: string, @Body() body: Record<string, any>) {
    return this.mi.updateInspectionPlan(user, planId, body);
  }

  @Get('equipment')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  registry(@CurrentUser() user: RequestUser, @Query() query: EquipmentFilterDto & Record<string, string | undefined>) {
    return this.mi.registry(user, query);
  }

  @Post('equipment')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEquipmentDto) {
    return this.mi.create(user, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) });
  }

  @Get('equipment/export')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentExport)
  async exportRegistry(@CurrentUser() user: RequestUser, @Query() query: EquipmentFilterDto & Record<string, string | undefined>, @Res() response: any) {
    const file = await this.mi.exportRegistry(user, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('equipment/:equipmentId/inspection-plans')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  equipmentInspectionPlans(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentInspectionPlans(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/inspection-plans')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanCreate)
  createEquipmentInspectionPlan(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionPlan(user, body, equipmentId);
  }

  @Get('equipment/:equipmentId/inspection-plan-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  equipmentInspectionPlanSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentInspectionPlanSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/inspection-schedule')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionSchedulerView)
  equipmentInspectionSchedule(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentInspectionSchedule(user, equipmentId);
  }

  @Get('equipment/:equipmentId/inspection-due-status')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  equipmentInspectionDueStatus(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentInspectionPlanSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/inspection-records')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  equipmentInspectionRecords(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.equipmentInspectionRecords(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/inspection-records')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordCreate)
  createEquipmentInspectionRecord(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createInspectionRecord(user, body, equipmentId);
  }

  @Get('equipment/:equipmentId/inspection-records/:inspectionId')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionRecordView)
  equipmentInspectionRecord(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('inspectionId') inspectionId: string) {
    return this.mi.inspectionRecordDetail(user, inspectionId);
  }

  @Get('equipment/:equipmentId/ut-readings')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  equipmentUtReadings(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentUtReadings(user, equipmentId);
  }

  @Get('equipment/:equipmentId/remaining-life')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeView)
  equipmentRemainingLife(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentRemainingLife(user, equipmentId);
  }

  @Post('equipment/:equipmentId/remaining-life/recalculate-all')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeRecalculate)
  recalculateEquipmentRemainingLife(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.recalculateEquipmentRemainingLife(user, equipmentId);
  }

  @Get('equipment/:equipmentId/criticality')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  equipmentCriticality(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentCriticality(user, equipmentId);
  }

  @Post('equipment/:equipmentId/criticality')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityCreate)
  createEquipmentCriticality(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createCriticalityAssessment(user, { ...body, equipmentId });
  }

  @Get('equipment/:equipmentId/criticality/current')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  currentEquipmentCriticality(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.currentEquipmentCriticality(user, equipmentId);
  }

  @Get('equipment/:equipmentId/criticality/history')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  equipmentCriticalityHistory(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentCriticalityHistory(user, equipmentId);
  }

  @Get('equipment/:equipmentId/criticality/suggestions')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  equipmentCriticalitySuggestions(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentCriticalitySuggestions(user, equipmentId);
  }

  @Get('equipment/:equipmentId/criticality/data-snapshot')
  @Permissions(PermissionKeys.MechanicalIntegrityCriticalityView)
  equipmentCriticalityDataSnapshot(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.criticalityEquipmentSnapshot(user, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/:cmlId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingView)
  cmlInspectionReadings(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.cmlInspectionReadings(user, equipmentId, cmlId);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingCreate)
  addCmlInspectionReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Body() body: Record<string, any>) {
    return this.mi.addCmlInspectionReading(user, equipmentId, cmlId, body);
  }

  @Get('equipment/:equipmentId/cmls/:cmlId/remaining-life')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeView)
  cmlRemainingLife(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.cmlRemainingLife(user, equipmentId, cmlId);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/remaining-life/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityRemainingLifeRecalculate)
  recalculateCmlRemainingLife(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.recalculateCmlRemainingLife(user, equipmentId, cmlId);
  }

  @Get('equipment/:equipmentId/cmls/readings/review')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingReview)
  cmlReadingsReview(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentUtReadings(user, equipmentId).then((rows) => rows.filter((row: any) => /pending|entered|draft/i.test(String(row.review_status))));
  }

  @Get('equipment/:equipmentId/cmls/readings/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  async cmlReadingsImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) {
    const file = await this.mi.inspectionRecordImportTemplate(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('equipment/:equipmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  get(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.get(user, equipmentId);
  }

  @Get('equipment/:equipmentId/header')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  header(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.header(user, equipmentId);
  }

  @Patch('equipment/:equipmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentEdit)
  update(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: UpdateEquipmentDto) {
    return this.mi.update(user, equipmentId, dto);
  }

  @Post('equipment/:equipmentId/status-change')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentEdit)
  changeStatus(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: { status?: string; reason?: string }) {
    return this.mi.changeStatus(user, equipmentId, body.status, body.reason);
  }

  @Post('equipment/:equipmentId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentArchive)
  archive(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body('reason') reason?: string) {
    return this.mi.archive(user, equipmentId, reason);
  }

  @Post('equipment/:equipmentId/reactivate')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentEdit)
  reactivate(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body('reason') reason?: string) {
    return this.mi.reactivate(user, equipmentId, reason);
  }

  @Get('equipment/:equipmentId/overview')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  overview(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.overview(user, equipmentId);
  }

  @Get('equipment/:equipmentId/status-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  statusSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.statusSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/technical-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataView)
  technicalSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.technicalSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/readiness-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  readinessSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.readinessSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/blockers')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  blockers(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.blockers(user, equipmentId);
  }

  @Get('equipment/:equipmentId/recent-activity')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentHistoryView)
  equipmentRecentActivity(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.equipmentRecentActivity(user, equipmentId);
  }

  @Get('equipment/:equipmentId/linked-records/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordsView)
  linkedRecordsSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.linkedRecordsSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/documents/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsView)
  documentsSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.documentsSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/technical-data')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataView)
  technicalData(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.technicalData(user, equipmentId);
  }

  @Patch('equipment/:equipmentId/technical-data')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataEdit)
  updateTechnicalData(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: Record<string, any>) {
    return this.mi.updateTechnicalData(user, equipmentId, dto);
  }

  @Get('equipment/:equipmentId/technical-data/completeness')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataView)
  technicalDataCompleteness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.technicalDataCompleteness(user, equipmentId);
  }

  @Get('equipment/:equipmentId/technical-data/revisions')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataRevisionView)
  technicalDataRevisions(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.technicalDataRevisions(user, equipmentId);
  }

  @Get('equipment/:equipmentId/technical-data/change-impact')
  @Permissions(PermissionKeys.MechanicalIntegrityTechnicalDataView)
  technicalDataChangeImpact(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.technicalDataChangeImpact(user, equipmentId, query);
  }

  @Get('equipment/:equipmentId/cmls/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  cmlSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.cmlSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/alerts')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlAlertView)
  cmlAlerts(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.cmlAlerts(user, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  async cmlImportTemplate(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Res() response: any) {
    const file = await this.mi.cmlImportTemplate(user, equipmentId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('equipment/:equipmentId/cmls/import')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  importCmls(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.importCmls(user, equipmentId, body);
  }

  @Post('equipment/:equipmentId/cmls/readings/import')
  @Permissions(PermissionKeys.MechanicalIntegrityUtReadingImport)
  importCmlReadings(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.importInspectionRecords(user, body, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/import/:jobId')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  getCmlImportJob(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('jobId') jobId: string) {
    return this.mi.getCmlImportJob(user, equipmentId, jobId);
  }

  @Post('equipment/:equipmentId/cmls/import/:jobId/validate')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  validateCmlImportJob(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('jobId') jobId: string) {
    return this.mi.validateCmlImportJob(user, equipmentId, jobId);
  }

  @Post('equipment/:equipmentId/cmls/import/:jobId/commit')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  commitCmlImportJob(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('jobId') jobId: string) {
    return this.mi.commitCmlImportJob(user, equipmentId, jobId);
  }

  @Get('equipment/:equipmentId/cmls/import/:jobId/error-report')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlImport)
  async cmlImportErrorReport(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('jobId') jobId: string, @Res() response: any) {
    const file = await this.mi.cmlImportErrorReport(user, equipmentId, jobId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Post('equipment/:equipmentId/cmls/recalculate-all')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlCalculationRecalculate)
  recalculateAllCmls(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.recalculateAllCmls(user, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/calculation-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlCalculationView)
  cmlCalculationSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.cmlCalculationSummary(user, equipmentId);
  }

  @Get('equipment/:equipmentId/cmls/export')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlExport)
  async exportCmls(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Res() response: any) {
    const file = await this.mi.exportCmls(user, equipmentId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('equipment/:equipmentId/cmls')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  cmls(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.mi.listCmls(user, equipmentId, query);
  }

  @Post('equipment/:equipmentId/cmls')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlCreate)
  createCml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.mi.createCml(user, equipmentId, body);
  }

  @Get('equipment/:equipmentId/cmls/:cmlId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingView)
  cmlReadings(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.cmlReadings(user, equipmentId, cmlId);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingCreate)
  addCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Body() body: Record<string, any>) {
    return this.mi.addCmlReading(user, equipmentId, cmlId, body);
  }

  @Patch('equipment/:equipmentId/cmls/:cmlId/readings/:readingId')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingEdit)
  updateCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCmlReading(user, equipmentId, cmlId, readingId, body);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings/:readingId/review')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingReview)
  reviewCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.reviewCmlReading(user, equipmentId, cmlId, readingId, body);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings/:readingId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingApprove)
  approveCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.approveCmlReading(user, equipmentId, cmlId, readingId, body);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings/:readingId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingApprove)
  rejectCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.rejectCmlReading(user, equipmentId, cmlId, readingId, body);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/readings/:readingId/supersede')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlReadingApprove)
  supersedeCmlReading(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Param('readingId') readingId: string, @Body() body: Record<string, any>) {
    return this.mi.supersedeCmlReading(user, equipmentId, cmlId, readingId, body);
  }

  @Get('equipment/:equipmentId/cmls/:cmlId/calculation')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlCalculationView)
  cmlCalculation(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.cmlCalculation(user, equipmentId, cmlId);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/recalculate')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlCalculationRecalculate)
  recalculateCml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.recalculateCml(user, equipmentId, cmlId);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlArchive)
  archiveCml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Body('reason') reason?: string) {
    return this.mi.archiveCml(user, equipmentId, cmlId, reason);
  }

  @Post('equipment/:equipmentId/cmls/:cmlId/reactivate')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlEdit)
  reactivateCml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Body('reason') reason?: string) {
    return this.mi.reactivateCml(user, equipmentId, cmlId, reason);
  }

  @Get('equipment/:equipmentId/cmls/:cmlId')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  cml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string) {
    return this.mi.getCml(user, equipmentId, cmlId);
  }

  @Patch('equipment/:equipmentId/cmls/:cmlId')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlEdit)
  updateCml(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('cmlId') cmlId: string, @Body() body: Record<string, any>) {
    return this.mi.updateCml(user, equipmentId, cmlId, body);
  }

  @Get('equipment/:equipmentId/history')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentHistoryView)
  history(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.mi.history(user, equipmentId);
  }

  @Get('equipment/:equipmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordsView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query('moduleKey') moduleKey?: string) {
    return this.linkedDocuments.equipmentLinkedRecords(user, equipmentId, moduleKey ? { sourceModule: moduleKey } : {});
  }

  @Post('equipment/:equipmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordsManage)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.linkedDocuments.createLinkedRecord(user, { ...body, equipmentId, sourceModule: body.sourceModule ?? 'Equipment', sourceRecordId: body.sourceRecordId ?? equipmentId });
  }

  @Delete('equipment/:equipmentId/linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordsManage)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('linkId') linkId: string, @Body('reason') reason?: string) {
    return this.linkedDocuments.removeLinkedRecord(user, linkId);
  }

  @Get('equipment/:equipmentId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsView)
  documents(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.linkedDocuments.equipmentDocuments(user, equipmentId);
  }

  @Post('equipment/:equipmentId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  addDocument(
    @CurrentUser() user: RequestUser,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UploadEquipmentDocumentDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    const input = dto as Record<string, any>;
    return file ? this.linkedDocuments.uploadAndLinkDocument(user, { ...input, equipmentId, linkedModule: input.relatedModule ?? 'Equipment', linkedRecordId: input.relatedRecordId ?? equipmentId }, file) : this.linkedDocuments.linkDocument(user, { ...input, equipmentId, linkedModule: input.relatedModule ?? 'Equipment', linkedRecordId: input.relatedRecordId ?? equipmentId });
  }

  @Delete('equipment/:equipmentId/documents/:documentLinkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentsManage)
  removeDocument(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('documentLinkId') documentLinkId: string) {
    return this.linkedDocuments.removeDocumentLink(user, documentLinkId);
  }

  @Get('equipment/:equipmentId/export-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentExport)
  async exportSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Res() response: any) {
    const file = await this.mi.exportEquipmentSummary(user, equipmentId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }

  @Get('lookups/equipment-types')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  equipmentTypes(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.equipmentTypes);
  }

  @Get('lookups/statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  statuses(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.statuses);
  }

  @Get('lookups/fitness-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  fitnessStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.fitnessStatuses);
  }

  @Get('lookups/sites')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  sites(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.sites);
  }

  @Get('lookups/process-units')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  units(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.units);
  }

  @Get('lookups/areas')
  @Permissions(PermissionKeys.MechanicalIntegrityEquipmentView)
  areas(@CurrentUser() user: RequestUser) {
    return this.mi.lookups(user).then((data) => data.areas);
  }

  @Get('lookups/cml-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  cmlTypes(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.cmlTypes);
  }

  @Get('lookups/component-types')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  componentTypes(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.componentTypes);
  }

  @Get('lookups/damage-mechanisms')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  damageMechanisms(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.damageMechanisms);
  }

  @Get('lookups/inspection-methods')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  inspectionMethods(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.inspectionMethods);
  }

  @Get('lookups/thickness-units')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  thicknessUnits(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.thicknessUnits);
  }

  @Get('lookups/corrosion-rate-methods')
  @Permissions(PermissionKeys.MechanicalIntegrityCmlView)
  corrosionRateMethods(@CurrentUser() user: RequestUser) {
    return this.mi.cmlLookups(user).then((data) => data.corrosionRateMethods);
  }

  @Get('lookups/inspection-plan-types')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  inspectionPlanTypes(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.planTypes);
  }

  @Get('lookups/scheduling-modes')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  schedulingModes(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.schedulingModes);
  }

  @Get('lookups/frequency-units')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  frequencyUnits(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.frequencyUnits);
  }

  @Get('lookups/checklist-response-types')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionChecklistView)
  checklistResponseTypes(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.checklistResponseTypes);
  }

  @Get('lookups/acceptance-criteria-types')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionCriteriaView)
  acceptanceCriteriaTypes(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.acceptanceCriteriaTypes);
  }

  @Get('lookups/due-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityInspectionPlanView)
  dueStatuses(@CurrentUser() user: RequestUser) {
    return this.mi.inspectionPlanLookups(user).then((data) => data.dueStatuses);
  }

  private requiredSiteId(user: RequestUser, siteId?: string) {
    const nextSiteId = siteId ?? user.selectedSiteId;
    if (!nextSiteId) throw new BadRequestException('Site is required for Mechanical Integrity equipment records');
    if (user.siteIds.length && !user.siteIds.includes(nextSiteId)) return '__forbidden__';
    return nextSiteId;
  }
}
