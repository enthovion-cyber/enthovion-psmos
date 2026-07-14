import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { AddGasTestDto } from './dto/add-gas-test.dto';
import { AddIsolationDto } from './dto/add-isolation.dto';
import { AddSignatureDto } from './dto/add-signature.dto';
import { AddWorkforceDto } from './dto/add-workforce.dto';
import { ClosureChecklistDto } from './dto/closure-checklist.dto';
import { ClosePermitDto } from './dto/close-permit.dto';
import { ConfirmIsolationDto } from './dto/confirm-isolation.dto';
import { CreatePermitDto } from './dto/create-permit.dto';
import { CreatePermitTemplateDto } from './dto/create-permit-template.dto';
import { ExtendPermitDto } from './dto/extend-permit.dto';
import { GasThresholdDto } from './dto/gas-threshold.dto';
import { IssuePermitDto } from './dto/issue-permit.dto';
import { AttachmentRequirementDto, LinkDocumentAttachmentDto, PermitAttachmentDto, PermitHistoryFilterDto } from './dto/attachment.dto';
import { PermitFilterDto } from './dto/permit-filter.dto';
import { SuspendPermitDto } from './dto/suspend-permit.dto';
import { UpdateWorkforceDto } from './dto/update-workforce.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { UpdateIsolationDto } from './dto/update-isolation.dto';
import { UpdateGasTestDto } from './dto/update-gas-test.dto';
import { WorkforceAccountabilityDto, WorkforceBriefingDto, WorkforceBulkDto, WorkerBriefingDto } from './dto/workforce-briefing.dto';
import { HandoverAcknowledgeDto, HandoverChecklistDto, ShiftHandoverDto, SuspendHandoverDto } from './dto/shift-handover.dto';
import { ConflictMatrixRuleDto, ConflictOverrideDto, ConflictRejectDto, SimopsControlDto, SimopsReviewDto, UpdateConflictDto } from './dto/conflict-simops.dto';
import { RejectPermitSignatureDto, SignatureRequirementDto, SignPermitSignatureDto } from './dto/signature-tab.dto';
import { PtwService } from './ptw.service';

@ApiTags('ptw')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('ptw')
export class PtwController {
  constructor(private readonly ptw: PtwService) {}

  @Get()
  @Permissions(PermissionKeys.PTWRead)
  list(@CurrentUser() user: RequestUser, @Query() query: PermitFilterDto) {
    return this.ptw.list(user.tenantId, query, this.scope(user));
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.PTWRead)
  dashboard(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboard(user.tenantId, this.scope(user));
  }

  @Get('dashboard/kpis')
  @Permissions(PermissionKeys.PTWRead)
  dashboardKpis(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardKpis(user.tenantId, this.scope(user));
  }

  @Get('dashboard/alerts')
  @Permissions(PermissionKeys.PTWRead)
  dashboardAlerts(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardAlerts(user.tenantId, this.scope(user));
  }

  @Get('dashboard/expiring')
  @Permissions(PermissionKeys.PTWRead)
  dashboardExpiring(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardExpiring(user.tenantId, this.scope(user));
  }

  @Get('dashboard/gas-retest')
  @Permissions(PermissionKeys.PTWGasTestView)
  dashboardGasRetest(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardGasRetest(user.tenantId, this.scope(user));
  }

  @Get('dashboard/conflicts')
  @Permissions(PermissionKeys.PTWConflictView)
  dashboardConflicts(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardConflicts(user.tenantId, this.scope(user));
  }

  @Get('dashboard/isolation')
  @Permissions(PermissionKeys.PTWRead)
  dashboardIsolation(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardIsolation(user.tenantId, this.scope(user));
  }

  @Get('dashboard/handover')
  @Permissions(PermissionKeys.PTWHandoverView)
  dashboardHandover(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardHandover(user.tenantId, this.scope(user));
  }

  @Get('dashboard/safety-critical')
  @Permissions(PermissionKeys.PTWRead)
  dashboardSafetyCritical(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardSafetyCritical(user.tenantId, this.scope(user));
  }

  @Get('dashboard/area-overview')
  @Permissions(PermissionKeys.PTWRead)
  dashboardAreaOverview(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardAreaOverview(user.tenantId, this.scope(user));
  }

  @Post('dashboard/run-conflict-scan')
  @Permissions(PermissionKeys.PTWConflictCheck)
  dashboardRunConflictScan(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardRunConflictScan(user.tenantId, user.id, this.scope(user));
  }

  @Get('dashboard/export/pdf')
  @Permissions(PermissionKeys.PTWExport)
  dashboardExportPdf(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardExport(user.tenantId, user.id, this.scope(user), 'pdf');
  }

  @Get('dashboard/export/csv')
  @Permissions(PermissionKeys.PTWExport)
  dashboardExportCsv(@CurrentUser() user: RequestUser) {
    return this.ptw.dashboardExport(user.tenantId, user.id, this.scope(user), 'csv');
  }

  @Get('map/summary')
  @Permissions(PermissionKeys.PTWMapView)
  mapSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapSummary(user.tenantId, this.scope(user), query);
  }

  @Get('map/areas')
  @Permissions(PermissionKeys.PTWMapView)
  mapAreas(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapAreas(user.tenantId, this.scope(user), query);
  }

  @Get('map/equipment')
  @Permissions(PermissionKeys.PTWMapView)
  mapEquipment(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapEquipment(user.tenantId, this.scope(user), query);
  }

  @Get('map/conflicts')
  @Permissions(PermissionKeys.PTWMapView)
  mapConflicts(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapConflicts(user.tenantId, this.scope(user), query);
  }

  @Get('map/alerts')
  @Permissions(PermissionKeys.PTWMapView)
  mapAlerts(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapAlerts(user.tenantId, this.scope(user), query);
  }

  @Get('map/permit/:permitId/preview')
  @Permissions(PermissionKeys.PTWMapView)
  mapPermitPreview(@CurrentUser() user: RequestUser, @Param('permitId') permitId: string) {
    return this.ptw.preview(user.tenantId, permitId, this.scope(user));
  }

  @Get('map/layouts')
  @Permissions(PermissionKeys.PTWMapView)
  mapLayouts(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.mapLayouts(user.tenantId, this.scope(user), query);
  }

  @Post('map/layouts')
  @Permissions(PermissionKeys.PTWMapManageLayouts)
  createMapLayout(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.ptw.createMapLayout(user.tenantId, user.id, this.scope(user), dto);
  }

  @Patch('map/layouts/:layoutId')
  @Permissions(PermissionKeys.PTWMapManageLayouts)
  updateMapLayout(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Body() dto: Record<string, any>) {
    return this.ptw.updateMapLayout(user.tenantId, user.id, this.scope(user), layoutId, dto);
  }

  @Delete('map/layouts/:layoutId')
  @Permissions(PermissionKeys.PTWMapManageLayouts)
  deleteMapLayout(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string) {
    return this.ptw.deleteMapLayout(user.tenantId, user.id, this.scope(user), layoutId);
  }

  @Post('map/layouts/:layoutId/upload-svg')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.PTWMapManageLayouts)
  uploadMapSvg(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.ptw.uploadMapSvg(user.tenantId, user.id, this.scope(user), layoutId, file);
  }

  @Get('map/layouts/:layoutId/zones')
  @Permissions(PermissionKeys.PTWMapView)
  mapZones(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string) {
    return this.ptw.mapZones(user.tenantId, this.scope(user), layoutId);
  }

  @Post('map/layouts/:layoutId/zones')
  @Permissions(PermissionKeys.PTWMapManageZones)
  createMapZone(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Body() dto: Record<string, any>) {
    return this.ptw.createMapZone(user.tenantId, user.id, this.scope(user), layoutId, dto);
  }

  @Patch('map/layouts/:layoutId/zones/:zoneId')
  @Permissions(PermissionKeys.PTWMapManageZones)
  updateMapZone(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Param('zoneId') zoneId: string, @Body() dto: Record<string, any>) {
    return this.ptw.updateMapZone(user.tenantId, user.id, this.scope(user), layoutId, zoneId, dto);
  }

  @Delete('map/layouts/:layoutId/zones/:zoneId')
  @Permissions(PermissionKeys.PTWMapManageZones)
  deleteMapZone(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Param('zoneId') zoneId: string) {
    return this.ptw.deleteMapZone(user.tenantId, user.id, this.scope(user), layoutId, zoneId);
  }

  @Get('map/layouts/:layoutId/markers')
  @Permissions(PermissionKeys.PTWMapView)
  mapConfiguredMarkers(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string) {
    return this.ptw.mapConfiguredMarkers(user.tenantId, this.scope(user), layoutId);
  }

  @Post('map/layouts/:layoutId/markers')
  @Permissions(PermissionKeys.PTWMapManageMarkers)
  createMapMarker(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Body() dto: Record<string, any>) {
    return this.ptw.createMapMarker(user.tenantId, user.id, this.scope(user), layoutId, dto);
  }

  @Patch('map/layouts/:layoutId/markers/:markerId')
  @Permissions(PermissionKeys.PTWMapManageMarkers)
  updateMapMarker(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Param('markerId') markerId: string, @Body() dto: Record<string, any>) {
    return this.ptw.updateMapMarker(user.tenantId, user.id, this.scope(user), layoutId, markerId, dto);
  }

  @Delete('map/layouts/:layoutId/markers/:markerId')
  @Permissions(PermissionKeys.PTWMapManageMarkers)
  deleteMapMarker(@CurrentUser() user: RequestUser, @Param('layoutId') layoutId: string, @Param('markerId') markerId: string) {
    return this.ptw.deleteMapMarker(user.tenantId, user.id, this.scope(user), layoutId, markerId);
  }

  @Get('map')
  @Permissions(PermissionKeys.PTWMapView)
  map(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.ptw.map(user.tenantId, this.scope(user), query);
  }

  @Get('expiring')
  @Permissions(PermissionKeys.PTWRead)
  expiring(@CurrentUser() user: RequestUser) {
    return this.ptw.expiring(user.tenantId, this.scope(user));
  }

  @Get('active')
  @Permissions(PermissionKeys.PTWRead)
  active(@CurrentUser() user: RequestUser) {
    return this.ptw.active(user.tenantId, this.scope(user));
  }

  @Get('new/context')
  @Permissions(PermissionKeys.PTWRead)
  newContext(@CurrentUser() user: RequestUser) {
    return this.ptw.newPermitContext(user.tenantId, this.scope(user));
  }

  @Get('equipment-search')
  @Permissions(PermissionKeys.PTWRead)
  equipmentSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.ptw.equipmentSearch(user.tenantId, search, this.scope(user));
  }

  @Get('equipment/:equipmentId')
  @Permissions(PermissionKeys.PTWRead)
  equipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.ptw.equipmentPermits(user.tenantId, equipmentId, this.scope(user));
  }

  @Get('gas-thresholds')
  @Permissions(PermissionKeys.PTWGasTestView)
  gasThresholds(@CurrentUser() user: RequestUser, @Query('siteId') siteId?: string, @Query('permitType') permitType?: string) {
    return this.ptw.gasThresholds(user.tenantId, this.scope(user), siteId, permitType);
  }

  @Post('gas-thresholds')
  @Permissions(PermissionKeys.PTWGasThresholdsManage)
  createGasThreshold(@CurrentUser() user: RequestUser, @Body() dto: GasThresholdDto) {
    return this.ptw.createGasThreshold(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('gas-thresholds/:thresholdId')
  @Permissions(PermissionKeys.PTWGasThresholdsManage)
  updateGasThreshold(@CurrentUser() user: RequestUser, @Param('thresholdId') thresholdId: string, @Body() dto: GasThresholdDto) {
    return this.ptw.updateGasThreshold(user.tenantId, user.id, thresholdId, dto, this.scope(user));
  }

  @Delete('gas-thresholds/:thresholdId')
  @Permissions(PermissionKeys.PTWGasThresholdsManage)
  deleteGasThreshold(@CurrentUser() user: RequestUser, @Param('thresholdId') thresholdId: string) {
    return this.ptw.deleteGasThreshold(user.tenantId, user.id, thresholdId, this.scope(user));
  }

  @Get('templates')
  @Permissions(PermissionKeys.PTWRead)
  templates(@CurrentUser() user: RequestUser) {
    return this.ptw.templates(user.tenantId, this.scope(user));
  }

  @Post('templates')
  @Permissions(PermissionKeys.PTWTemplateManage)
  createTemplate(@CurrentUser() user: RequestUser, @Body() dto: CreatePermitTemplateDto) {
    return this.ptw.createTemplate(user.tenantId, user.id, dto, this.scope(user));
  }

  @Get('conflict-matrix')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictMatrix(@CurrentUser() user: RequestUser) {
    return this.ptw.conflictMatrix(user.tenantId, this.scope(user));
  }

  @Post('conflict-matrix')
  @Permissions(PermissionKeys.PTWConflictMatrixManage)
  createConflictMatrixRule(@CurrentUser() user: RequestUser, @Body() dto: ConflictMatrixRuleDto) {
    return this.ptw.createConflictMatrixRule(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('conflict-matrix/:ruleId')
  @Permissions(PermissionKeys.PTWConflictMatrixManage)
  updateConflictMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: ConflictMatrixRuleDto) {
    return this.ptw.updateConflictMatrixRule(user.tenantId, user.id, ruleId, dto, this.scope(user));
  }

  @Delete('conflict-matrix/:ruleId')
  @Permissions(PermissionKeys.PTWConflictMatrixManage)
  deleteConflictMatrixRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) {
    return this.ptw.deleteConflictMatrixRule(user.tenantId, user.id, ruleId, this.scope(user));
  }

  @Get('signature-requirements')
  @Permissions(PermissionKeys.PTWSignaturesView)
  signatureRequirements(@CurrentUser() user: RequestUser) {
    return this.ptw.signatureRequirements(user.tenantId, this.scope(user));
  }

  @Post('signature-requirements')
  @Permissions(PermissionKeys.PTWSignatureRequirementsManage)
  createSignatureRequirement(@CurrentUser() user: RequestUser, @Body() dto: SignatureRequirementDto) {
    return this.ptw.createSignatureRequirement(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('signature-requirements/:requirementId')
  @Permissions(PermissionKeys.PTWSignatureRequirementsManage)
  updateSignatureRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: SignatureRequirementDto) {
    return this.ptw.updateSignatureRequirement(user.tenantId, user.id, requirementId, dto, this.scope(user));
  }

  @Delete('signature-requirements/:requirementId')
  @Permissions(PermissionKeys.PTWSignatureRequirementsManage)
  deleteSignatureRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.ptw.deleteSignatureRequirement(user.tenantId, user.id, requirementId, this.scope(user));
  }

  @Get('attachment-requirements')
  @Permissions(PermissionKeys.PTWAttachmentsView)
  attachmentRequirements(@CurrentUser() user: RequestUser) {
    return this.ptw.attachmentRequirements(user.tenantId, this.scope(user));
  }

  @Post('attachment-requirements')
  @Permissions(PermissionKeys.PTWAttachmentRequirementsManage)
  createAttachmentRequirement(@CurrentUser() user: RequestUser, @Body() dto: AttachmentRequirementDto) {
    return this.ptw.createAttachmentRequirement(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('attachment-requirements/:requirementId')
  @Permissions(PermissionKeys.PTWAttachmentRequirementsManage)
  updateAttachmentRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: AttachmentRequirementDto) {
    return this.ptw.updateAttachmentRequirement(user.tenantId, user.id, requirementId, dto, this.scope(user));
  }

  @Delete('attachment-requirements/:requirementId')
  @Permissions(PermissionKeys.PTWAttachmentRequirementsManage)
  deleteAttachmentRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.ptw.deleteAttachmentRequirement(user.tenantId, user.id, requirementId);
  }

  @Get(':id')
  @Permissions(PermissionKeys.PTWRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.get(user.tenantId, id, this.scope(user));
  }

  @Get(':id/preview')
  @Permissions(PermissionKeys.PTWRead)
  preview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.preview(user.tenantId, id, this.scope(user));
  }

  @Get(':id/summary')
  @Permissions(PermissionKeys.PTWRead)
  summary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.summary(user.tenantId, id, this.scope(user));
  }

  @Post()
  @Permissions(PermissionKeys.PTWCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePermitDto) {
    return this.ptw.create(user.tenantId, user.id, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) }, this.scope(user));
  }

  @Patch(':id')
  @Permissions(PermissionKeys.PTWEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdatePermitDto) {
    return this.ptw.update(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id')
  @Permissions(PermissionKeys.PTWCancel)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.cancel(user.tenantId, user.id, id, { reason: 'Cancelled by user request' }, this.scope(user));
  }

  @Post(':id/submit')
  @Permissions(PermissionKeys.PTWSubmit)
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.submit(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/submit')
  @Permissions(PermissionKeys.PTWSubmit)
  submitFromGet(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.submit(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/approve')
  @Permissions(PermissionKeys.PTWApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.approve(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/approve')
  @Permissions(PermissionKeys.PTWApprove)
  approveFromGet(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.approve(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/issue')
  @Permissions(PermissionKeys.PTWIssue)
  issue(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: IssuePermitDto) {
    return this.ptw.issue(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/issue')
  @Permissions(PermissionKeys.PTWIssue)
  issueFromGet(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.issue(user.tenantId, user.id, id, {}, this.scope(user));
  }

  @Post(':id/activate')
  @Permissions(PermissionKeys.PTWActivate)
  activate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.activate(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/activate')
  @Permissions(PermissionKeys.PTWActivate)
  activateFromGet(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.activate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/suspend')
  @Permissions(PermissionKeys.PTWSuspend)
  suspend(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SuspendPermitDto) {
    return this.ptw.suspend(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/extend')
  @Permissions(PermissionKeys.PTWExtend)
  extend(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ExtendPermitDto) {
    return this.ptw.extend(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/close')
  @Permissions(PermissionKeys.PTWClose)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ClosePermitDto) {
    return this.ptw.close(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/cancel')
  @Permissions(PermissionKeys.PTWCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SuspendPermitDto) {
    return this.ptw.cancel(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/isolation')
  @Permissions(PermissionKeys.PTWIsolationAdd)
  addIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AddIsolationDto) {
    return this.ptw.addIsolation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/isolation')
  @Permissions(PermissionKeys.PTWRead)
  isolation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.isolationForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/isolation/summary')
  @Permissions(PermissionKeys.PTWRead)
  isolationSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.isolationSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/isolation/history')
  @Permissions(PermissionKeys.PTWRead)
  isolationHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.isolationHistoryForPermit(user.tenantId, id, this.scope(user));
  }

  @Post(':id/isolation/import-from-equipment')
  @Permissions(PermissionKeys.PTWIsolationAdd)
  importIsolationFromEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.importIsolationFromEquipment(user.tenantId, user.id, id, this.scope(user));
  }

  @Patch(':id/isolation/:isolationId')
  @Permissions(PermissionKeys.PTWIsolationEdit)
  updateIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string, @Body() dto: UpdateIsolationDto) {
    return this.ptw.updateIsolation(user.tenantId, user.id, id, isolationId, dto, this.scope(user));
  }

  @Delete(':id/isolation/:isolationId')
  @Permissions(PermissionKeys.PTWIsolationDelete)
  deleteIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string) {
    return this.ptw.deleteIsolation(user.tenantId, user.id, id, isolationId, this.scope(user));
  }

  @Patch(':id/isolation/:isolationId/confirm')
  @Permissions(PermissionKeys.PTWIsolationConfirm)
  confirmIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string, @Body() dto: ConfirmIsolationDto) {
    return this.ptw.confirmIsolation(user.tenantId, user.id, id, isolationId, dto, this.scope(user));
  }

  @Patch(':id/isolation/:isolationId/verify')
  @Permissions(PermissionKeys.PTWIsolationVerify)
  verifyIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string) {
    return this.ptw.verifyIsolation(user.tenantId, user.id, id, isolationId, this.scope(user));
  }

  @Get(':id/isolation/:isolationId/confirm')
  @Permissions(PermissionKeys.PTWIsolationConfirm)
  confirmIsolationFromGet(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string) {
    return this.ptw.confirmIsolation(user.tenantId, user.id, id, isolationId, {}, this.scope(user));
  }

  @Post(':id/de-isolation')
  @Permissions(PermissionKeys.PTWDeisolationConfirm)
  deisolate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.deisolate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/de-isolation/start')
  @Permissions(PermissionKeys.PTWDeisolationConfirm)
  startDeIsolation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.startDeIsolation(user.tenantId, user.id, id, this.scope(user));
  }

  @Patch(':id/isolation/:isolationId/de-isolate')
  @Permissions(PermissionKeys.PTWDeisolationConfirm)
  deIsolatePoint(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string, @Body() dto: ConfirmIsolationDto) {
    return this.ptw.deIsolatePoint(user.tenantId, user.id, id, isolationId, dto, this.scope(user));
  }

  @Patch(':id/isolation/:isolationId/removal-verify')
  @Permissions(PermissionKeys.PTWDeisolationConfirm)
  verifyRemoval(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('isolationId') isolationId: string, @Body() dto: ConfirmIsolationDto) {
    return this.ptw.verifyRemoval(user.tenantId, user.id, id, isolationId, dto, this.scope(user));
  }

  @Post(':id/gas-tests')
  @Permissions(PermissionKeys.PTWGasTestAdd)
  addGasTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AddGasTestDto) {
    return this.ptw.addGasTest(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/gas-tests/:gasTestId')
  @Permissions(PermissionKeys.PTWGasTestEdit)
  updateGasTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gasTestId') gasTestId: string, @Body() dto: UpdateGasTestDto) {
    return this.ptw.updateGasTest(user.tenantId, user.id, id, gasTestId, dto, this.scope(user));
  }

  @Get(':id/gas-tests')
  @Permissions(PermissionKeys.PTWGasTestView)
  gasTests(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.gasTests(user.tenantId, id, this.scope(user));
  }

  @Delete(':id/gas-tests/:gasTestId')
  @Permissions(PermissionKeys.PTWGasTestDelete)
  deleteGasTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gasTestId') gasTestId: string) {
    return this.ptw.deleteGasTest(user.tenantId, user.id, id, gasTestId, this.scope(user));
  }

  @Get(':id/gas-tests/latest')
  @Permissions(PermissionKeys.PTWGasTestView)
  latestGasTest(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.latestGasTest(user.tenantId, id, this.scope(user));
  }

  @Get(':id/gas-tests/summary')
  @Permissions(PermissionKeys.PTWGasTestView)
  gasTestSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.gasTestSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/gas-tests/history')
  @Permissions(PermissionKeys.PTWGasTestView)
  gasTestHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.gasTestHistoryForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/gas-tests/trends')
  @Permissions(PermissionKeys.PTWGasTestView)
  gasTestTrends(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.gasTestTrends(user.tenantId, id, this.scope(user));
  }

  @Get(':id/gas-thresholds')
  @Permissions(PermissionKeys.PTWGasTestView)
  permitGasThresholds(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.permitGasThresholds(user.tenantId, id, this.scope(user));
  }

  @Post(':id/gas-tests/:gasTestId/validate')
  @Permissions(PermissionKeys.PTWGasTestValidate)
  validateGasTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gasTestId') gasTestId: string) {
    return this.ptw.validateGasTest(user.tenantId, user.id, id, gasTestId, this.scope(user));
  }

  @Post(':id/gas-tests/check-overdue')
  @Permissions(PermissionKeys.PTWGasTestValidate)
  checkGasTestOverdue(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.checkGasTestOverdue(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/workforce')
  @Permissions(PermissionKeys.PTWWorkforceAdd)
  addWorkforce(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AddWorkforceDto) {
    return this.ptw.addWorkforce(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/workforce')
  @Permissions(PermissionKeys.PTWWorkforceView)
  workforce(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.workforceForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/workforce/summary')
  @Permissions(PermissionKeys.PTWWorkforceView)
  workforceSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.workforceSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/workforce/required-roles')
  @Permissions(PermissionKeys.PTWWorkforceView)
  workforceRequiredRoles(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.workforceRequiredRoles(user.tenantId, id, this.scope(user));
  }

  @Get(':id/workforce/history')
  @Permissions(PermissionKeys.PTWWorkforceView)
  workforceHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.workforceHistoryForPermit(user.tenantId, id, this.scope(user));
  }

  @Post(':id/workforce/bulk-briefing')
  @Permissions(PermissionKeys.PTWWorkforceBriefing)
  bulkBriefing(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: WorkforceBulkDto) {
    return this.ptw.bulkBriefing(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/workforce/bulk-sign-in')
  @Permissions(PermissionKeys.PTWWorkforceSignIn)
  bulkSignIn(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: WorkforceBulkDto) {
    return this.ptw.bulkWorkforceSign(user.tenantId, user.id, id, dto, 'in', this.scope(user));
  }

  @Post(':id/workforce/bulk-sign-out')
  @Permissions(PermissionKeys.PTWWorkforceSignOut)
  bulkSignOut(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: WorkforceBulkDto) {
    return this.ptw.bulkWorkforceSign(user.tenantId, user.id, id, dto, 'out', this.scope(user));
  }

  @Post(':id/workforce/accountability-check')
  @Permissions(PermissionKeys.PTWWorkforceAccountability)
  accountabilityCheck(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: WorkforceAccountabilityDto) {
    return this.ptw.accountabilityCheck(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/workforce/:workerId/sign-in')
  @Permissions(PermissionKeys.PTWWorkforceSignIn)
  signIn(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string) {
    return this.ptw.workforceSign(user.tenantId, user.id, id, workerId, 'in', this.scope(user));
  }

  @Post(':id/workforce/:workerId/sign-in')
  @Permissions(PermissionKeys.PTWWorkforceSignIn)
  signInPost(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string) {
    return this.ptw.workforceSign(user.tenantId, user.id, id, workerId, 'in', this.scope(user));
  }

  @Post(':id/workforce/:workerId/briefing')
  @Permissions(PermissionKeys.PTWWorkforceBriefing)
  workerBriefing(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string, @Body() dto: WorkerBriefingDto) {
    return this.ptw.completeWorkerBriefing(user.tenantId, user.id, id, workerId, dto, this.scope(user));
  }

  @Patch(':id/workforce/:workerId')
  @Permissions(PermissionKeys.PTWWorkforceEdit)
  updateWorkforce(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string, @Body() dto: UpdateWorkforceDto) {
    return this.ptw.updateWorkforce(user.tenantId, user.id, id, workerId, dto, this.scope(user));
  }

  @Patch(':id/workforce/:workerId/sign-out')
  @Permissions(PermissionKeys.PTWWorkforceSignOut)
  signOut(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string) {
    return this.ptw.workforceSign(user.tenantId, user.id, id, workerId, 'out', this.scope(user));
  }

  @Post(':id/workforce/:workerId/sign-out')
  @Permissions(PermissionKeys.PTWWorkforceSignOut)
  signOutPost(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string) {
    return this.ptw.workforceSign(user.tenantId, user.id, id, workerId, 'out', this.scope(user));
  }

  @Delete(':id/workforce/:workerId')
  @Permissions(PermissionKeys.PTWWorkforceDelete)
  deleteWorker(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('workerId') workerId: string) {
    return this.ptw.deleteWorkforce(user.tenantId, user.id, id, workerId, this.scope(user));
  }

  @Post(':id/briefings')
  @Permissions(PermissionKeys.PTWWorkforceBriefing)
  createBriefing(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: WorkforceBriefingDto) {
    return this.ptw.createBriefing(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/briefings/:briefingId')
  @Permissions(PermissionKeys.PTWWorkforceBriefing)
  updateBriefing(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('briefingId') briefingId: string, @Body() dto: WorkforceBriefingDto) {
    return this.ptw.updateBriefing(user.tenantId, user.id, id, briefingId, dto, this.scope(user));
  }

  @Get(':id/briefings')
  @Permissions(PermissionKeys.PTWWorkforceView)
  briefings(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.briefingsForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/handover')
  @Permissions(PermissionKeys.PTWHandoverView)
  handovers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.shiftHandoversForPermit(user.tenantId, id, this.scope(user));
  }

  @Post(':id/handover')
  @Permissions(PermissionKeys.PTWHandoverCreate)
  createHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ShiftHandoverDto) {
    return this.ptw.createShiftHandover(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/handover/current')
  @Permissions(PermissionKeys.PTWHandoverView)
  currentHandover(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.currentShiftHandover(user.tenantId, id, this.scope(user));
  }

  @Get(':id/handover/history')
  @Permissions(PermissionKeys.PTWHandoverView)
  handoverHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.shiftHandoverHistory(user.tenantId, id, this.scope(user));
  }

  @Get(':id/handover/readiness')
  @Permissions(PermissionKeys.PTWHandoverView)
  handoverReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.shiftHandoverReadiness(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/handover/:handoverId')
  @Permissions(PermissionKeys.PTWHandoverEdit)
  updateHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string, @Body() dto: ShiftHandoverDto) {
    return this.ptw.updateShiftHandover(user.tenantId, user.id, id, handoverId, dto, this.scope(user));
  }

  @Delete(':id/handover/:handoverId')
  @Permissions(PermissionKeys.PTWHandoverDelete)
  deleteHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string) {
    return this.ptw.deleteShiftHandover(user.tenantId, user.id, id, handoverId, this.scope(user));
  }

  @Post(':id/handover/:handoverId/acknowledge')
  @Permissions(PermissionKeys.PTWHandoverAcknowledge)
  acknowledgeHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string, @Body() dto: HandoverAcknowledgeDto) {
    return this.ptw.acknowledgeShiftHandover(user.tenantId, user.id, id, handoverId, dto, this.scope(user));
  }

  @Post(':id/handover/:handoverId/complete')
  @Permissions(PermissionKeys.PTWHandoverComplete)
  completeHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string) {
    return this.ptw.completeShiftHandover(user.tenantId, user.id, id, handoverId, this.scope(user));
  }

  @Post(':id/handover/:handoverId/suspend-permit')
  @Permissions(PermissionKeys.PTWHandoverSuspend)
  suspendForHandover(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string, @Body() dto: SuspendHandoverDto) {
    return this.ptw.suspendPermitDuringHandover(user.tenantId, user.id, id, handoverId, dto, this.scope(user));
  }

  @Patch(':id/handover/:handoverId/checklist/:checklistItemId')
  @Permissions(PermissionKeys.PTWHandoverEdit)
  updateHandoverChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('handoverId') handoverId: string, @Param('checklistItemId') checklistItemId: string, @Body() dto: HandoverChecklistDto) {
    return this.ptw.updateShiftHandoverChecklistItem(user.tenantId, user.id, id, handoverId, checklistItemId, dto, this.scope(user));
  }

  @Get(':id/conflicts')
  @Permissions(PermissionKeys.PTWConflictView)
  conflicts(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.conflictsForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/conflicts/summary')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.conflictSummary(user.tenantId, id, this.scope(user));
  }

  @Post(':id/conflicts/check')
  @Permissions(PermissionKeys.PTWConflictCheck)
  checkConflicts(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.runConflictCheck(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/conflicts/map')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictMap(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.conflictMap(user.tenantId, id, this.scope(user));
  }

  @Get(':id/conflicts/history')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.conflictHistoryForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/conflicts/:conflictId')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string) {
    return this.ptw.conflictDetail(user.tenantId, id, conflictId, this.scope(user));
  }

  @Patch(':id/conflicts/:conflictId')
  @Permissions(PermissionKeys.PTWConflictResolve)
  updateConflict(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: UpdateConflictDto) {
    return this.ptw.updateConflict(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/resolve')
  @Permissions(PermissionKeys.PTWConflictResolve)
  resolveConflict(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: UpdateConflictDto) {
    return this.ptw.resolveConflict(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/false-positive')
  @Permissions(PermissionKeys.PTWConflictFalsePositive)
  falsePositiveConflict(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: UpdateConflictDto) {
    return this.ptw.falsePositiveConflict(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PTWConflictOverride)
  overrideConflict(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: SuspendPermitDto) {
    return this.ptw.overrideConflict(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/override/request')
  @Permissions(PermissionKeys.PTWConflictOverrideRequest)
  requestConflictOverride(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: ConflictOverrideDto) {
    return this.ptw.requestConflictOverride(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/override/approve')
  @Permissions(PermissionKeys.PTWConflictOverrideApprove)
  approveConflictOverride(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: ConflictOverrideDto) {
    return this.ptw.approveConflictOverride(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Post(':id/conflicts/:conflictId/override/reject')
  @Permissions(PermissionKeys.PTWConflictOverrideApprove)
  rejectConflictOverride(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string, @Body() dto: ConflictRejectDto) {
    return this.ptw.rejectConflictOverride(user.tenantId, user.id, id, conflictId, dto, this.scope(user));
  }

  @Get(':id/conflicts/:conflictId/override-history')
  @Permissions(PermissionKeys.PTWConflictView)
  conflictOverrideHistory(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conflictId') conflictId: string) {
    return this.ptw.conflictOverrideHistory(user.tenantId, id, conflictId, this.scope(user));
  }

  @Get(':id/simops')
  @Permissions(PermissionKeys.PTWSimopsView)
  simops(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.simopsForPermit(user.tenantId, id, this.scope(user));
  }

  @Post(':id/simops')
  @Permissions(PermissionKeys.PTWSimopsCreate)
  createSimops(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SimopsReviewDto) {
    return this.ptw.createSimopsReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/simops/:simopsId')
  @Permissions(PermissionKeys.PTWSimopsCreate)
  updateSimops(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string, @Body() dto: SimopsReviewDto) {
    return this.ptw.updateSimopsReview(user.tenantId, user.id, id, simopsId, dto, this.scope(user));
  }

  @Post(':id/simops/:simopsId/approve')
  @Permissions(PermissionKeys.PTWSimopsApprove)
  approveSimops(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string) {
    return this.ptw.approveSimopsReview(user.tenantId, user.id, id, simopsId, this.scope(user));
  }

  @Post(':id/simops/:simopsId/reject')
  @Permissions(PermissionKeys.PTWSimopsApprove)
  rejectSimops(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string, @Body() dto: ConflictRejectDto) {
    return this.ptw.rejectSimopsReview(user.tenantId, user.id, id, simopsId, dto, this.scope(user));
  }

  @Post(':id/simops/:simopsId/control-room-acknowledge')
  @Permissions(PermissionKeys.PTWSimopsApprove)
  acknowledgeControlRoom(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string) {
    return this.ptw.acknowledgeSimopsControlRoom(user.tenantId, user.id, id, simopsId, this.scope(user));
  }

  @Post(':id/simops/:simopsId/controls')
  @Permissions(PermissionKeys.PTWSimopsCreate)
  createSimopsControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string, @Body() dto: SimopsControlDto) {
    return this.ptw.createSimopsControl(user.tenantId, user.id, id, simopsId, dto, this.scope(user));
  }

  @Patch(':id/simops/:simopsId/controls/:controlId')
  @Permissions(PermissionKeys.PTWSimopsCreate)
  updateSimopsControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('simopsId') simopsId: string, @Param('controlId') controlId: string, @Body() dto: SimopsControlDto) {
    return this.ptw.updateSimopsControl(user.tenantId, user.id, id, simopsId, controlId, dto, this.scope(user));
  }

  @Post(':id/closure-checklist')
  @Permissions(PermissionKeys.PTWEdit)
  closureChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ClosureChecklistDto) {
    return this.ptw.closureChecklist(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.PTWAttachmentsUpload)
  addAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: PermitAttachmentDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.ptw.addAttachment(user.tenantId, user.id, id, dto, this.scope(user), file);
  }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.PTWAttachmentsView)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.attachmentsForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/attachments/summary')
  @Permissions(PermissionKeys.PTWAttachmentsView)
  attachmentSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.attachmentSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/attachments/requirements')
  @Permissions(PermissionKeys.PTWAttachmentsView)
  attachmentRequirementsForPermit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.attachmentRequirementsForPermit(user.tenantId, id, this.scope(user));
  }

  @Post(':id/attachments/link-document')
  @Permissions(PermissionKeys.PTWAttachmentsUpload)
  linkDocumentAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LinkDocumentAttachmentDto) {
    return this.ptw.linkDocumentAttachment(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id/attachments/unlink-document/:documentId')
  @Permissions(PermissionKeys.PTWAttachmentsDelete)
  unlinkDocumentAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.ptw.unlinkDocumentAttachment(user.tenantId, user.id, id, documentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.PTWAttachmentsView)
  attachmentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.ptw.attachmentDetail(user.tenantId, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/preview')
  @Permissions(PermissionKeys.PTWAttachmentsPreview)
  attachmentPreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.ptw.previewAttachment(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/download')
  @Permissions(PermissionKeys.PTWAttachmentsDownload)
  async downloadAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: any) {
    const file = await this.ptw.readAttachment(user.tenantId, id, attachmentId, this.scope(user));
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.PTWAttachmentsDelete)
  deleteAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.ptw.deleteAttachment(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Post(':id/signatures')
  @Permissions(PermissionKeys.PTWSign)
  addSignature(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AddSignatureDto) {
    return this.ptw.addSignature(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/signatures')
  @Permissions(PermissionKeys.PTWSignaturesView)
  signatures(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.signaturesForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/signatures/summary')
  @Permissions(PermissionKeys.PTWSignaturesView)
  signatureSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.signatureSummary(user.tenantId, id, this.scope(user));
  }

  @Post(':id/signatures/generate-requirements')
  @Permissions(PermissionKeys.PTWSignaturesSign)
  generateSignatureRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.generateSignatureRequirements(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/signatures/:signatureId/sign')
  @Permissions(PermissionKeys.PTWSignaturesSign)
  signPermitSignature(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string, @Body() dto: SignPermitSignatureDto) {
    return this.ptw.signPermitSignature(user.tenantId, user.id, id, signatureId, dto, this.scope(user));
  }

  @Post(':id/signatures/:signatureId/reject')
  @Permissions(PermissionKeys.PTWSignaturesReject)
  rejectPermitSignature(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string, @Body() dto: RejectPermitSignatureDto) {
    return this.ptw.rejectPermitSignature(user.tenantId, user.id, id, signatureId, dto, this.scope(user));
  }

  @Post(':id/signatures/:signatureId/revalidate')
  @Permissions(PermissionKeys.PTWSignaturesRevalidate)
  revalidatePermitSignature(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string) {
    return this.ptw.revalidatePermitSignature(user.tenantId, user.id, id, signatureId, this.scope(user));
  }

  @Get(':id/signatures/history')
  @Permissions(PermissionKeys.PTWSignaturesView)
  signatureHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.signatureHistoryForPermit(user.tenantId, id, this.scope(user));
  }

  @Get(':id/history')
  @Permissions(PermissionKeys.PTWRead)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: PermitHistoryFilterDto) {
    return this.ptw.historyForPermit(user.tenantId, id, this.scope(user), query);
  }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.PTWRead)
  historySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.historySummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/history/export/pdf')
  @Permissions(PermissionKeys.PTWExport)
  async historyExportPdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.ptw.historyExport(user.tenantId, id, this.scope(user), 'pdf');
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Get(':id/history/export/csv')
  @Permissions(PermissionKeys.PTWExport)
  async historyExportCsv(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.ptw.historyExport(user.tenantId, id, this.scope(user), 'csv');
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Get(':id/history/:eventId')
  @Permissions(PermissionKeys.PTWRead)
  historyEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) {
    return this.ptw.historyEvent(user.tenantId, id, eventId, this.scope(user));
  }

  @Get(':id/certificate')
  @Permissions(PermissionKeys.PTWExport)
  async certificate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.ptw.certificate(user.tenantId, id, this.scope(user), 'permit');
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Get(':id/isolation-certificate')
  @Permissions(PermissionKeys.PTWExport)
  async isolationCertificate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.ptw.certificate(user.tenantId, id, this.scope(user), 'isolation');
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Post(':id/isolation-certificate')
  @Permissions(PermissionKeys.PTWIsolationCertificateGenerate)
  generateIsolationCertificate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.generateIsolationCertificate(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/isolation-certificate/record')
  @Permissions(PermissionKeys.PTWRead)
  isolationCertificateRecord(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.isolationCertificateRecord(user.tenantId, id, this.scope(user));
  }

  @Post(':id/clone')
  @Permissions(PermissionKeys.PTWCreate)
  clone(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.clone(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/create-moc')
  @Permissions(PermissionKeys.PTWEdit)
  createMocAction(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.createMocAction(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/save-template')
  @Permissions(PermissionKeys.PTWTemplateManage)
  saveTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ptw.saveTemplate(user.tenantId, user.id, id, this.scope(user));
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }

  private requiredSiteId(user: RequestUser, siteId: string) {
    const nextSiteId = siteId ?? user.selectedSiteId;
    if (user.siteIds.length && !user.siteIds.includes(nextSiteId)) return '__forbidden__';
    return nextSiteId;
  }
}
