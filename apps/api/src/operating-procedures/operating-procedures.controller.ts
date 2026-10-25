import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { OpAcknowledgmentService } from './op-acknowledgment.service';
import { OpAuthoringService } from './op-authoring.service';
import { OpCertificationService } from './op-certification.service';
import { OpExecutionService } from './op-execution.service';
import { OpIntegrationsService } from './op-integrations.service';
import { OpLifecycleService } from './op-lifecycle.service';
import { OpReportsService } from './op-reports.service';
import { OpSwpService } from './op-swp.service';
import { OperatingProceduresService, OpScope } from './operating-procedures.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('operating-procedures')
export class OperatingProceduresController {
  constructor(
    private readonly op: OperatingProceduresService,
    private readonly authoring: OpAuthoringService,
    private readonly lifecycle: OpLifecycleService,
    private readonly certification: OpCertificationService,
    private readonly execution: OpExecutionService,
    private readonly integrations: OpIntegrationsService,
    private readonly acknowledgment: OpAcknowledgmentService,
    private readonly swp: OpSwpService,
    private readonly reports: OpReportsService
  ) {}

  // Static routes first (before :procedureId)
  @Get('dashboard') @Permissions('op.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.op.dashboard(this.scope(user), query); }

  @Get('register') @Permissions('op.register.view')
  register(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.op.register(this.scope(user), query); }

  @Get('summary') @Permissions('op.register.view')
  summary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.op.summary(this.scope(user), query); }

  @Get('coverage') @Permissions('op.dashboard.view')
  coverage(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.op.coverageMatrix(this.scope(user), query); }

  @Get('lookups') @Permissions('op.view')
  lookups(@CurrentUser() user: RequestUser) { return this.op.lookups(this.scope(user)); }

  @Get('templates') @Permissions('op.view')
  templates(@CurrentUser() user: RequestUser, @Query('typeCode') typeCode?: string) { return this.authoring.getTemplates(this.scope(user), typeCode); }

  // Phase 4 Certification Static Endpoints
  @Get('certification/cycles') @Permissions('op.certify')
  certificationCycles(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.certification.getCycles(this.scope(user), query);
  }

  // Phase 5 Execution Static Endpoints
  @Get('executions') @Permissions('op.execution.perform', 'op.procedure.view')
  executions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.execution.getExecutions(this.scope(user), query);
  }

  @Get('executions/:executionId') @Permissions('op.execution.perform', 'op.procedure.view')
  executionDetail(@CurrentUser() user: RequestUser, @Param('executionId') executionId: string) {
    return this.execution.getExecution(this.scope(user), executionId);
  }

  @Post('executions/:executionId/steps/:stepId') @Permissions('op.execution.perform')
  recordStep(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Param('stepId') stepId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.recordStepExecution(user.id, this.scope(user), executionId, stepId, dto);
  }

  @Post('executions/:executionId/holds/:holdId/release') @Permissions('op.execution.release_hold')
  releaseHold(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Param('holdId') holdId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.releaseHoldPoint(user.id, this.scope(user), executionId, holdId, dto);
  }

  @Post('executions/:executionId/deviations') @Permissions('op.execution.perform')
  logDeviation(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.logDeviation(user.id, this.scope(user), executionId, dto);
  }

  @Post('executions/:executionId/handover') @Permissions('op.execution.perform')
  recordHandover(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.recordHandover(user.id, this.scope(user), executionId, dto);
  }

  @Post('executions/:executionId/complete') @Permissions('op.execution.review')
  completeExecution(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.completeExecution(user.id, this.scope(user), executionId, dto);
  }

  @Post('executions/:executionId/abort') @Permissions('op.execution.abort')
  abortExecution(
    @CurrentUser() user: RequestUser,
    @Param('executionId') executionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.abortExecution(user.id, this.scope(user), executionId, dto);
  }

  // Phase 6 Change Flags & MOC Integration
  @Get('change-flags') @Permissions('op.change_flag.manage', 'op.procedure.view')
  changeFlags(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.getChangeFlags(this.scope(user), query);
  }

  @Post('change-flags/:flagId/resolve') @Permissions('op.change_flag.manage')
  resolveChangeFlag(
    @CurrentUser() user: RequestUser,
    @Param('flagId') flagId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.integrations.resolveChangeFlag(user.id, this.scope(user), flagId, dto);
  }

  @Post('change-flags/:flagId/dismiss') @Permissions('op.change_flag.manage')
  dismissChangeFlag(
    @CurrentUser() user: RequestUser,
    @Param('flagId') flagId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.integrations.dismissChangeFlag(user.id, this.scope(user), flagId, dto);
  }

  @Get('moc-blockers/:mocId') @Permissions('op.view')
  checkMocBlockers(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string) {
    return this.integrations.checkMocBlockers(this.scope(user), mocId);
  }

  @Delete('linked-records/:linkId') @Permissions('op.procedure.edit')
  unlinkRecord(@CurrentUser() user: RequestUser, @Param('linkId') linkId: string) {
    return this.integrations.unlinkRecord(user.id, this.scope(user), linkId);
  }

  // Phase 7 Read-and-Understand Acknowledgment
  @Get('acknowledgments') @Permissions('op.view')
  acknowledgments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.acknowledgment.getAcknowledgments(this.scope(user), query);
  }

  @Post('acknowledgments/:recordId/sign') @Permissions('op.view')
  signAcknowledgment(
    @CurrentUser() user: RequestUser,
    @Param('recordId') recordId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.acknowledgment.signAcknowledgment(user.id, this.scope(user), recordId, dto);
  }

  // Phase 8 Safe Work Practices (SWP) & JSA
  @Get('swp/programs') @Permissions('op.view')
  swpPrograms(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.swp.getSwpPrograms(this.scope(user), query);
  }

  @Get('swp/programs/:programId') @Permissions('op.view')
  swpProgramDetail(@CurrentUser() user: RequestUser, @Param('programId') programId: string) {
    return this.swp.getSwpProgram(this.scope(user), programId);
  }

  @Post('swp/programs') @Permissions('op.settings.edit')
  saveSwpProgram(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.swp.saveSwpProgram(user.id, this.scope(user), dto);
  }

  @Get('jsas') @Permissions('op.view')
  jsasList(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.swp.getJsas(this.scope(user), query);
  }

  @Get('jsas/:jsaId') @Permissions('op.view')
  jsaDetail(@CurrentUser() user: RequestUser, @Param('jsaId') jsaId: string) {
    return this.swp.getJsa(this.scope(user), jsaId);
  }

  @Post('jsas') @Permissions('op.procedure.create')
  createJsa(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.swp.createJsa(user.id, this.scope(user), dto);
  }

  @Post('jsas/:jsaId/roster') @Permissions('op.view')
  signJsaRoster(
    @CurrentUser() user: RequestUser,
    @Param('jsaId') jsaId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.swp.signJsaBriefing(user.id, this.scope(user), jsaId, dto);
  }

  @Post('jsas/:jsaId/approve') @Permissions('op.approve')
  approveJsa(
    @CurrentUser() user: RequestUser,
    @Param('jsaId') jsaId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.swp.approveJsa(user.id, this.scope(user), jsaId, dto);
  }

  // Phase 9 Reports & OSHA Audit Packages
  @Get('audit-packages') @Permissions('op.report.view')
  auditPackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.getAuditPackages(this.scope(user), query);
  }

  @Get('audit-packages/:packageId') @Permissions('op.report.view')
  auditPackageDetail(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.getAuditPackageDetail(this.scope(user), packageId);
  }

  @Post('audit-packages/generate') @Permissions('op.report.export')
  generateAuditPackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.generateAuditPackage(user.id, this.scope(user), dto);
  }

  @Get('certification/checklist') @Permissions('op.certify')
  certificationChecklist(@CurrentUser() user: RequestUser) {
    return this.certification.getChecklistItems(this.scope(user));
  }

  @Post('certification/cycles/:cycleId/review') @Permissions('op.certify')
  recordCertificationReview(
    @CurrentUser() user: RequestUser,
    @Param('cycleId') cycleId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.certification.recordReview(user.id, this.scope(user), cycleId, dto);
  }

  @Get('certification/statements') @Permissions('op.annual_statement.sign')
  certificationStatements(@CurrentUser() user: RequestUser, @Query('siteId') siteId?: string) {
    return this.certification.getStatements(this.scope(user), siteId ?? user.selectedSiteId ?? undefined);
  }

  @Post('certification/statements/generate') @Permissions('op.annual_statement.sign')
  generateStatement(
    @CurrentUser() user: RequestUser,
    @Body('siteId') siteId: string,
    @Body('year') year: number
  ) {
    return this.certification.generateStatement(user.id, this.scope(user), siteId ?? user.selectedSiteId, year ?? new Date().getFullYear());
  }

  @Post('certification/statements/:statementId/sign') @Permissions('op.annual_statement.sign')
  signStatement(
    @CurrentUser() user: RequestUser,
    @Param('statementId') statementId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.certification.signStatement(user.id, this.scope(user), statementId, dto);
  }

  @Get('pending-reviews') @Permissions('op.review.perform')
  pendingReviews(@CurrentUser() user: RequestUser) { return this.lifecycle.getPendingReviews(this.scope(user), user.id); }

  @Get('approval-requests/:requestId') @Permissions('op.procedure.view')
  approvalRequestDetail(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string) {
    return this.lifecycle.getApprovalRequest(this.scope(user), requestId);
  }

  @Post('approval-requests/:requestId/stages/:stageId/decide') @Permissions('op.review.perform')
  recordDecision(
    @CurrentUser() user: RequestUser,
    @Param('requestId') requestId: string,
    @Param('stageId') stageId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.lifecycle.recordDecision(user.id, this.scope(user), requestId, stageId, dto);
  }

  @Get('settings') @Permissions('op.settings.view')
  settings(@CurrentUser() user: RequestUser, @Query('siteId') siteId?: string) { return this.op.settings(this.scope(user), siteId ?? null); }

  @Patch('settings') @Permissions('op.settings.edit')
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.op.updateSettings(user.id, this.scope(user), dto); }

  @Post() @Permissions('op.procedure.create')
  create(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.op.createProcedure(user.id, this.scope(user), dto); }

  // Authoring & Steps endpoints
  @Post('revisions/:revisionId/sections') @Permissions('op.revision.author')
  saveSection(@CurrentUser() user: RequestUser, @Param('revisionId') revisionId: string, @Body() dto: Record<string, any>) {
    return this.authoring.saveSection(user.id, this.scope(user), revisionId, dto);
  }

  @Delete('sections/:sectionId') @Permissions('op.revision.author')
  deleteSection(@CurrentUser() user: RequestUser, @Param('sectionId') sectionId: string) {
    return this.authoring.deleteSection(this.scope(user), sectionId);
  }

  @Post('revisions/:revisionId/steps') @Permissions('op.revision.author')
  saveStep(@CurrentUser() user: RequestUser, @Param('revisionId') revisionId: string, @Body() dto: Record<string, any>) {
    return this.authoring.saveStep(user.id, this.scope(user), revisionId, dto);
  }

  @Delete('steps/:stepId') @Permissions('op.revision.author')
  deleteStep(@CurrentUser() user: RequestUser, @Param('stepId') stepId: string) {
    return this.authoring.deleteStep(this.scope(user), stepId);
  }

  @Post('revisions/:revisionId/reorder-steps') @Permissions('op.revision.author')
  reorderSteps(@CurrentUser() user: RequestUser, @Param('revisionId') revisionId: string, @Body('stepIds') stepIds: string[]) {
    return this.authoring.reorderSteps(this.scope(user), revisionId, stepIds ?? []);
  }

  @Post('steps/:stepId/hazards') @Permissions('op.revision.author')
  addHazard(@CurrentUser() user: RequestUser, @Param('stepId') stepId: string, @Body() dto: Record<string, any>) {
    return this.authoring.addStepHazard(this.scope(user), stepId, dto);
  }

  @Delete('hazards/:hazardId') @Permissions('op.revision.author')
  removeHazard(@CurrentUser() user: RequestUser, @Param('hazardId') hazardId: string) {
    return this.authoring.removeStepHazard(this.scope(user), hazardId);
  }

  @Post('revisions/:revisionId/comments') @Permissions('op.review.perform')
  addComment(@CurrentUser() user: RequestUser, @Param('revisionId') revisionId: string, @Body() dto: Record<string, any>) {
    return this.authoring.addComment(user.id, this.scope(user), revisionId, dto);
  }

  @Post('comments/:commentId/resolve') @Permissions('op.revision.author')
  resolveComment(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string) {
    return this.authoring.resolveComment(user.id, this.scope(user), commentId);
  }

  // Procedure-level
  @Get(':procedureId') @Permissions('op.procedure.view')
  detail(@CurrentUser() user: RequestUser, @Param('procedureId') id: string) { return this.op.getProcedure(this.scope(user), id, user.id); }

  @Get(':procedureId/revisions') @Permissions('op.procedure.view')
  revisions(@CurrentUser() user: RequestUser, @Param('procedureId') id: string) { return this.authoring.getRevisions(this.scope(user), id); }

  @Post(':procedureId/revisions') @Permissions('op.revision.author')
  createRevision(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) {
    return this.authoring.createRevision(user.id, this.scope(user), id, dto);
  }

  @Get(':procedureId/revisions/:revisionId') @Permissions('op.procedure.view')
  revisionDetail(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Param('revisionId') revisionId: string) {
    return this.authoring.getRevision(this.scope(user), id, revisionId);
  }

  @Post(':procedureId/revisions/:revisionId/submit') @Permissions('op.revision.author')
  submitForReview(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Param('revisionId') revisionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.lifecycle.submitForReview(user.id, this.scope(user), procedureId, revisionId, dto);
  }

  @Post(':procedureId/revisions/:revisionId/publish') @Permissions('op.publish')
  publishProcedure(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Param('revisionId') revisionId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.lifecycle.publishProcedure(user.id, this.scope(user), procedureId, revisionId, dto);
  }

  @Get(':procedureId/approval-requests') @Permissions('op.procedure.view')
  approvalRequests(@CurrentUser() user: RequestUser, @Param('procedureId') procedureId: string) {
    return this.lifecycle.getApprovalRequests(this.scope(user), procedureId);
  }

  @Get(':procedureId/certification') @Permissions('op.certify')
  procedureCertification(@CurrentUser() user: RequestUser, @Param('procedureId') procedureId: string) {
    return this.certification.getProcedureCertification(this.scope(user), procedureId);
  }

  @Get(':procedureId/executions') @Permissions('op.procedure.view')
  procedureExecutions(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Query() query: Record<string, any>
  ) {
    return this.execution.getExecutions(this.scope(user), { ...query, procedureId });
  }

  @Post(':procedureId/executions') @Permissions('op.execution.start')
  startExecution(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.execution.createExecution(user.id, this.scope(user), procedureId, dto);
  }

  @Get(':procedureId/change-flags') @Permissions('op.procedure.view')
  procedureChangeFlags(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Query() query: Record<string, any>
  ) {
    return this.integrations.getChangeFlags(this.scope(user), { ...query, procedureId });
  }

  @Post(':procedureId/change-flags') @Permissions('op.change_flag.manage')
  createChangeFlag(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.integrations.createChangeFlag(user.id, this.scope(user), procedureId, dto);
  }

  @Get(':procedureId/linked-records') @Permissions('op.procedure.view')
  linkedRecords(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Query('type') recordType?: string
  ) {
    return this.integrations.getLinkedRecords(this.scope(user), procedureId, recordType);
  }

  @Post(':procedureId/linked-records') @Permissions('op.procedure.edit')
  linkRecord(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Body() dto: Record<string, any>
  ) {
    return this.integrations.linkRecord(user.id, this.scope(user), procedureId, dto);
  }

  @Get(':procedureId/acknowledgments') @Permissions('op.view')
  procedureAcknowledgments(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Query('revisionId') revisionId?: string
  ) {
    return this.acknowledgment.getProcedureAckStats(this.scope(user), procedureId, revisionId);
  }

  @Get(':procedureId/execution-gate/:revisionId') @Permissions('op.execution.perform')
  executionGate(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Param('revisionId') revisionId: string
  ) {
    return this.acknowledgment.checkExecutionGate(user.id, this.scope(user), procedureId, revisionId);
  }

  @Get(':procedureId/controlled-copy') @Permissions('op.procedure.view')
  controlledCopyWatermark(
    @CurrentUser() user: RequestUser,
    @Param('procedureId') procedureId: string,
    @Query('revisionId') revisionId?: string
  ) {
    return this.reports.getControlledCopyWatermark(this.scope(user), procedureId, revisionId);
  }

  @Patch(':procedureId') @Permissions('op.procedure.edit')
  update(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.updateProcedure(user.id, this.scope(user), id, dto); }

  @Post(':procedureId/archive') @Permissions('op.procedure.archive')
  archive(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.archive(user.id, this.scope(user), id, dto); }

  @Post(':procedureId/reactivate') @Permissions('op.procedure.reactivate')
  reactivate(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.reactivate(user.id, this.scope(user), id, dto); }

  @Post(':procedureId/lock') @Permissions('op.procedure.lock')
  lock(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.lock(user.id, this.scope(user), id, dto, true); }

  @Post(':procedureId/unlock') @Permissions('op.procedure.unlock')
  unlock(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.lock(user.id, this.scope(user), id, dto, false); }

  @Post(':procedureId/assign-owner') @Permissions('op.procedure.assign_owner')
  assignOwner(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.assignOwner(user.id, this.scope(user), id, dto); }

  @Post(':procedureId/scopes') @Permissions('op.scope.manage')
  addScope(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.addScope(user.id, this.scope(user), id, dto); }

  @Delete(':procedureId/scopes/:scopeId') @Permissions('op.scope.manage')
  removeScope(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Param('scopeId') scopeId: string, @Body() dto: Record<string, any>) { return this.op.removeScope(user.id, this.scope(user), id, scopeId, dto ?? {}); }

  @Get(':procedureId/history') @Permissions('op.history.view')
  history(@CurrentUser() user: RequestUser, @Param('procedureId') id: string) { return this.op.history(this.scope(user), id); }

  @Get(':procedureId/access-log') @Permissions('op.access_log.view')
  accessLog(@CurrentUser() user: RequestUser, @Param('procedureId') id: string) { return this.op.accessLog(this.scope(user), id); }

  @Post(':procedureId/access-log') @Permissions('op.procedure.view')
  logAccess(@CurrentUser() user: RequestUser, @Param('procedureId') id: string, @Body() dto: Record<string, any>) { return this.op.logAccess(this.scope(user), user.id, id, dto); }

  private scope(user: RequestUser): OpScope {
    return {
      companyId: user.tenantId,
      selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
      siteIds: user.siteIds,
      corporateView: user.corporateView,
      isCompanyAdmin: user.isCompanyAdmin,
      isSiteAdmin: user.isSiteAdmin
    };
  }
}
