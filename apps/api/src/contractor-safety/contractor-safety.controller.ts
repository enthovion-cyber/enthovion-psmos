// apps/api/src/contractor-safety/contractor-safety.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { ContractorSafetyService, CsmScope } from './contractor-safety.service';
import { ContractorEvaluationService } from './contractor-evaluation.service';
import { ContractorInductionService } from './contractor-induction.service';
import { ContractorPrequalService } from './contractor-prequal.service';
import { ContractorWorkerService } from './contractor-worker.service';
import {
  AcknowledgeEvaluationDto,
  AddWorkerCertDto,
  ApproveVarianceDto,
  CheckPtwEligibilityDto,
  CreateContractorDocumentDto,
  CreateContractorDto,
  CreateContractorWorkerDto,
  CreateInductionCourseDto,
  CreatePostJobEvaluationDto,
  CreateVarianceRequestDto,
  EvaluateContractorPrequalDto,
  GenerateAuditPackageDto,
  IssueGatePassDto,
  ScanGatePassDto,
  SubmitInductionQuizDto,
  UpdateContractorDto,
  UpdateContractorWorkerDto,
  UpdateInductionCourseDto,
  UpsertContractorMetricsDto,
  VerifyCertDto,
  VerifyContractorDocumentDto
} from './dto/contractor-safety.dto';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('contractor-safety')
export class ContractorSafetyController {
  constructor(
    private readonly csm: ContractorSafetyService,
    private readonly prequal: ContractorPrequalService,
    private readonly workerService: ContractorWorkerService,
    private readonly inductionService: ContractorInductionService,
    private readonly evaluationService: ContractorEvaluationService
  ) {}

  @Get('lookups')
  @Permissions('csm.view')
  lookups() {
    return this.csm.lookups();
  }

  @Get('prequal/rules')
  @Permissions('csm.view')
  getScoringRules() {
    return this.prequal.getScoringRules();
  }

  @Get('variances')
  @Permissions('csm.view')
  listVariances(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    return this.prequal.listVariances(this.scope(user), status);
  }

  @Patch('variances/:varianceId/decision')
  @Permissions('csm.contractor.edit')
  approveVariance(
    @CurrentUser() user: RequestUser,
    @Param('varianceId') varianceId: string,
    @Body() dto: ApproveVarianceDto
  ) {
    return this.prequal.approveVariance(this.scope(user), varianceId, dto, user.id);
  }

  @Get('contractors/:id/prequal')
  @Permissions('csm.contractor.view')
  getContractorPrequal(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.prequal.getContractorPrequal(this.scope(user), id);
  }

  @Post('contractors/:id/prequal/metrics')
  @Permissions('csm.contractor.edit')
  upsertMetrics(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpsertContractorMetricsDto
  ) {
    return this.prequal.upsertMetrics(this.scope(user), id, dto, user.id);
  }

  @Post('contractors/:id/prequal/evaluate')
  @Permissions('csm.contractor.edit')
  evaluatePrequal(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: EvaluateContractorPrequalDto
  ) {
    return this.prequal.evaluate(this.scope(user), id, dto, user.id);
  }

  @Post('contractors/:id/variances')
  @Permissions('csm.contractor.edit')
  createVariance(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateVarianceRequestDto
  ) {
    return this.prequal.createVariance(this.scope(user), id, dto, user.id);
  }

  @Get('dashboard')
  @Permissions('csm.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser) {
    return this.csm.dashboard(this.scope(user));
  }

  @Get('contractors')
  @Permissions('csm.contractor.view')
  list(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.csm.list(this.scope(user), query);
  }

  @Post('contractors')
  @Permissions('csm.contractor.create')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateContractorDto) {
    return this.csm.create(this.scope(user), dto, user.id);
  }

  @Get('contractors/:id')
  @Permissions('csm.contractor.view')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.csm.getById(this.scope(user), id);
  }

  @Put('contractors/:id')
  @Permissions('csm.contractor.edit')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractorDto
  ) {
    return this.csm.update(this.scope(user), id, dto, user.id);
  }

  @Post('contractors/:id/regenerate-token')
  @Permissions('csm.contractor.edit')
  regenerateToken(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.csm.regenerateToken(this.scope(user), id, user.id);
  }

  @Get('contractors/:id/documents')
  @Permissions('csm.contractor.view')
  getDocuments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.csm.getDocuments(this.scope(user), id);
  }

  @Post('contractors/:id/documents')
  @Permissions('csm.contractor.edit')
  addDocument(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractorDocumentDto
  ) {
    return this.csm.addDocument(this.scope(user), id, dto, user.id);
  }

  @Patch('documents/:docId/verify')
  @Permissions('csm.contractor.edit')
  verifyDocument(
    @CurrentUser() user: RequestUser,
    @Param('docId') docId: string,
    @Body() dto: VerifyContractorDocumentDto
  ) {
    return this.csm.verifyDocument(this.scope(user), docId, dto, user.id);
  }

  @Delete('documents/:docId')
  @Permissions('csm.contractor.edit')
  deleteDocument(@CurrentUser() user: RequestUser, @Param('docId') docId: string) {
    return this.csm.deleteDocument(this.scope(user), docId, user.id);
  }

  // --------------------------------------------------------------------------
  // Phase 3: Worker-Level Credential & Certification Endpoints
  // --------------------------------------------------------------------------

  @Get('workers')
  @Permissions('csm.contractor.view')
  listWorkers(
    @CurrentUser() user: RequestUser,
    @Query('contractor_id') contractorId?: string,
    @Query('craft_trade') craftTrade?: string,
    @Query('badge_status') badgeStatus?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.workerService.listWorkers(this.companyId(user), {
      contractor_id: contractorId,
      craft_trade: craftTrade,
      badge_status: badgeStatus,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
  }

  @Get('workers/radar')
  @Permissions('csm.contractor.view')
  getExpiringRadar(
    @CurrentUser() user: RequestUser,
    @Query('days') days?: string
  ) {
    return this.workerService.getExpiringCredentialsRadar(
      this.companyId(user),
      days ? parseInt(days, 10) : 60
    );
  }

  @Get('workers/:id')
  @Permissions('csm.contractor.view')
  getWorkerById(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.workerService.getWorkerById(this.companyId(user), id);
  }

  @Post('workers')
  @Permissions('csm.contractor.edit')
  createWorker(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateContractorWorkerDto
  ) {
    return this.workerService.createWorker(this.companyId(user), user.id, dto);
  }

  @Put('workers/:id')
  @Permissions('csm.contractor.edit')
  updateWorker(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractorWorkerDto
  ) {
    return this.workerService.updateWorker(this.companyId(user), id, dto);
  }

  @Delete('workers/:id')
  @Permissions('csm.contractor.edit')
  deleteWorker(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.workerService.deleteWorker(this.companyId(user), id);
  }

  @Post('workers/:id/certifications')
  @Permissions('csm.contractor.edit')
  addCertification(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddWorkerCertDto
  ) {
    return this.workerService.addCertification(this.companyId(user), id, dto);
  }

  @Patch('certifications/:certId/verify')
  @Permissions('csm.contractor.edit')
  verifyCertification(
    @CurrentUser() user: RequestUser,
    @Param('certId') certId: string,
    @Body() dto: VerifyCertDto
  ) {
    return this.workerService.verifyCertification(this.companyId(user), certId, user.id, dto);
  }

  @Delete('certifications/:certId')
  @Permissions('csm.contractor.edit')
  deleteCertification(
    @CurrentUser() user: RequestUser,
    @Param('certId') certId: string
  ) {
    return this.workerService.deleteCertification(this.companyId(user), certId);
  }

  @Post('workers/:id/check-ptw')
  @Permissions('csm.contractor.view')
  checkPtwEligibility(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CheckPtwEligibilityDto
  ) {
    return this.workerService.checkWorkerPtwEligibility(
      this.companyId(user),
      id,
      dto.required_certifications ?? []
    );
  }

  // --------------------------------------------------------------------------
  // Phase 4: Digital Site Inductions & QR Gate Pass Endpoints
  // --------------------------------------------------------------------------

  @Get('inductions')
  @Permissions('csm.contractor.view')
  listCourses(
    @CurrentUser() user: RequestUser,
    @Query('site_id') siteId?: string,
    @Query('target_audience') targetAudience?: string
  ) {
    return this.inductionService.listCourses(this.companyId(user), {
      site_id: siteId,
      target_audience: targetAudience
    });
  }

  @Get('inductions/:id')
  @Permissions('csm.contractor.view')
  getCourseById(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.inductionService.getCourseById(this.companyId(user), id);
  }

  @Post('inductions')
  @Permissions('csm.contractor.edit')
  createCourse(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateInductionCourseDto
  ) {
    return this.inductionService.createCourse(this.companyId(user), user.id, dto);
  }

  @Put('inductions/:id')
  @Permissions('csm.contractor.edit')
  updateCourse(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateInductionCourseDto
  ) {
    return this.inductionService.updateCourse(this.companyId(user), id, dto);
  }

  @Get('workers/:id/inductions')
  @Permissions('csm.contractor.view')
  getWorkerInductions(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.inductionService.getWorkerInductions(this.companyId(user), id);
  }

  @Post('workers/:id/inductions/:courseId/submit')
  @Permissions('csm.contractor.edit')
  submitInductionQuiz(
    @CurrentUser() user: RequestUser,
    @Param('id') workerId: string,
    @Param('courseId') courseId: string,
    @Body() dto: SubmitInductionQuizDto
  ) {
    return this.inductionService.submitInductionQuiz(this.companyId(user), workerId, courseId, dto);
  }

  @Get('gate-passes')
  @Permissions('csm.contractor.view')
  listGatePasses(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.inductionService.listGatePasses(this.companyId(user), {
      status,
      search
    });
  }

  @Post('gate-passes')
  @Permissions('csm.contractor.edit')
  issueGatePass(
    @CurrentUser() user: RequestUser,
    @Body() dto: IssueGatePassDto
  ) {
    return this.inductionService.issueGatePass(this.companyId(user), dto);
  }

  @Post('gate-passes/scan')
  @Permissions('csm.contractor.view')
  scanGatePass(
    @CurrentUser() user: RequestUser,
    @Body() dto: ScanGatePassDto
  ) {
    return this.inductionService.scanGatePass(this.companyId(user), dto);
  }

  // --------------------------------------------------------------------------
  // Phase 5: Post-Job Evaluations & OSHA 1910.119(h) Compliance Audit Package
  // --------------------------------------------------------------------------

  @Get('evaluations')
  @Permissions('csm.contractor.view')
  listEvaluations(
    @CurrentUser() user: RequestUser,
    @Query('contractor_id') contractorId?: string,
    @Query('work_category') workCategory?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.evaluationService.listEvaluations(this.companyId(user), {
      contractor_id: contractorId,
      work_category: workCategory,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
  }

  @Get('evaluations/:id')
  @Permissions('csm.contractor.view')
  getEvaluationById(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.evaluationService.getEvaluationById(this.companyId(user), id);
  }

  @Post('evaluations')
  @Permissions('csm.contractor.edit')
  createEvaluation(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePostJobEvaluationDto
  ) {
    return this.evaluationService.createEvaluation(this.companyId(user), user.id, dto);
  }

  @Get('contractors/:id/evaluations/summary')
  @Permissions('csm.contractor.view')
  getContractorEvaluationSummary(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string
  ) {
    return this.evaluationService.getContractorEvaluationSummary(this.companyId(user), id);
  }

  @Post('evaluations/:id/acknowledge')
  @Permissions('csm.contractor.edit')
  acknowledgeEvaluation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AcknowledgeEvaluationDto
  ) {
    return this.evaluationService.acknowledgeEvaluation(this.companyId(user), id, dto);
  }

  @Get('audit/package')
  @Permissions('csm.contractor.view')
  getOshaAuditPackage(
    @CurrentUser() user: RequestUser,
    @Query('contractor_id') contractorId?: string,
    @Query('year') year?: string
  ) {
    return this.evaluationService.generateOshaAuditPackage(this.companyId(user), {
      contractor_id: contractorId,
      year: year ? parseInt(year, 10) : undefined
    });
  }

  private companyId(user: RequestUser): string {
    return user.companyIds?.[0] ?? user.tenantId;
  }

  private scope(user: RequestUser): CsmScope {
    return {
      tenantId: user.tenantId,
      companyId: user.companyIds?.[0] ?? user.tenantId,
      selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
      siteIds: user.siteIds,
      corporateView: user.corporateView,
      isCompanyAdmin: user.isCompanyAdmin,
      isSiteAdmin: user.isSiteAdmin
    };
  }
}
