import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { CreatePssrDto } from './dto/create-pssr.dto';
import { PssrService } from './pssr.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('pssr')
export class PssrController {
  constructor(private readonly pssr: PssrService) {}

  @Get('admin/auto-creation-policy')
  @Permissions(PermissionKeys.PSSRRead)
  autoCreationPolicy(@CurrentUser() user: RequestUser) { return this.pssr.autoCreationPolicy(user.tenantId, this.scope(user)); }

  @Patch('admin/auto-creation-policy')
  @Permissions(PermissionKeys.PSSRManage)
  updateAutoCreationPolicy(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.pssr.updateAutoCreationPolicy(user.tenantId, user.id, this.scope(user), dto); }

  @Get('admin/unit-hazard-profiles')
  @Permissions(PermissionKeys.PSSRRead)
  unitHazardProfiles(@CurrentUser() user: RequestUser) { return this.pssr.hazardProfiles(user.tenantId, this.scope(user)); }

  @Post('admin/unit-hazard-profiles')
  @Permissions(PermissionKeys.PSSRManage)
  createUnitHazardProfile(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.pssr.saveHazardProfile(user.tenantId, user.id, this.scope(user), dto); }

  @Patch('admin/unit-hazard-profiles/:profileId')
  @Permissions(PermissionKeys.PSSRManage)
  updateUnitHazardProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.pssr.saveHazardProfile(user.tenantId, user.id, this.scope(user), dto, profileId); }

  @Delete('admin/unit-hazard-profiles/:profileId')
  @Permissions(PermissionKeys.PSSRManage)
  deleteUnitHazardProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) { return this.pssr.deleteHazardProfile(user.tenantId, user.id, profileId); }

  @Get('admin/hazard-checklist-rules')
  @Permissions(PermissionKeys.PSSRRead)
  hazardChecklistRules(@CurrentUser() user: RequestUser) { return this.pssr.hazardRules(user.tenantId, this.scope(user)); }

  @Post('admin/hazard-checklist-rules')
  @Permissions(PermissionKeys.PSSRManage)
  createHazardChecklistRule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.pssr.saveHazardRule(user.tenantId, user.id, this.scope(user), dto); }

  @Patch('admin/hazard-checklist-rules/:ruleId')
  @Permissions(PermissionKeys.PSSRManage)
  updateHazardChecklistRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Record<string, any>) { return this.pssr.saveHazardRule(user.tenantId, user.id, this.scope(user), dto, ruleId); }

  @Get('new/context')
  @Permissions(PermissionKeys.PSSRManage)
  context(@CurrentUser() user: RequestUser) { return this.pssr.context(user.tenantId, this.scope(user)); }

  @Get('new/from-moc/:mocId/context')
  @Permissions(PermissionKeys.PSSRManage)
  fromMocContext(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string) { return this.pssr.fromMocContext(user.tenantId, mocId, this.scope(user)); }

  @Get('equipment-search')
  @Permissions(PermissionKeys.PSSRRead)
  equipmentSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.pssr.equipmentSearch(user.tenantId, this.scope(user), search); }

  @Get('dashboard')
  @Permissions(PermissionKeys.PSSRRead)
  dashboard(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters); }

  @Get('dashboard/kpis')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardKpis(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.kpis); }

  @Get('dashboard/readiness-overview')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardReadiness(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.readinessOverview); }

  @Get('dashboard/startup-schedule')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardSchedule(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.startupSchedule); }

  @Get('dashboard/blockers-health')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardBlockers(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.blockersHealth); }

  @Get('dashboard/punch-health')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardPunch(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.punchHealth); }

  @Get('dashboard/authorization-queue')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardAuthorization(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.authorizationQueue); }

  @Get('dashboard/linked-mocs')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardLinkedMocs(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.linkedMocs); }

  @Get('dashboard/recent-activity')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardActivity(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboard(user.tenantId, this.scope(user), filters).then((row) => row.recentActivity); }

  @Get('dashboard/export/csv')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardExportCsv(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboardExport(user.tenantId, this.scope(user), filters, 'csv'); }

  @Get('dashboard/export/pdf')
  @Permissions(PermissionKeys.PSSRRead)
  dashboardExportPdf(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.dashboardExport(user.tenantId, this.scope(user), filters, 'pdf'); }

  @Get()
  @Permissions(PermissionKeys.PSSRRead)
  list(@CurrentUser() user: RequestUser, @Query() filters: Record<string, any>) { return this.pssr.list(user.tenantId, this.scope(user), filters); }

  @Post()
  @Permissions(PermissionKeys.PSSRManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePssrDto) { return this.pssr.create(user.tenantId, user.id, dto, this.scope(user)); }

  @Get(':id')
  @Permissions(PermissionKeys.PSSRRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.get(user.tenantId, id, this.scope(user)); }

  @Patch(':id')
  @Permissions(PermissionKeys.PSSRManage)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Partial<CreatePssrDto>) { return this.pssr.update(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/summary')
  @Permissions(PermissionKeys.PSSRRead)
  summary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.get(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Get(':id/overview')
  @Permissions(PermissionKeys.PSSRRead)
  overview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.overview(user.tenantId, id, this.scope(user)); }

  @Get(':id/generated-checklist-preview')
  @Permissions(PermissionKeys.PSSRRead)
  checklistPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generatedChecklistPreview(user.tenantId, id, this.scope(user)); }

  @Get(':id/startup-blockers-preview')
  @Permissions(PermissionKeys.PSSRRead)
  blockersPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupBlockersPreview(user.tenantId, id, this.scope(user)); }

  @Get(':id/linked-moc')
  @Permissions(PermissionKeys.PSSRRead)
  linkedMoc(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.linkedMocByPssr(user.tenantId, id); }

  @Get(':id/equipment')
  @Permissions(PermissionKeys.PSSRRead)
  equipment(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.get(user.tenantId, id, this.scope(user)).then((row) => row.equipment); }

  @Post(':id/equipment')
  @Permissions(PermissionKeys.PSSRManage)
  addEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: { equipmentId?: string; isPrimary?: boolean }) { return this.pssr.addEquipment(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Delete(':id/equipment/:equipmentId')
  @Permissions(PermissionKeys.PSSRManage)
  removeEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('equipmentId') equipmentId: string) { return this.pssr.removeEquipment(user.tenantId, user.id, id, equipmentId, this.scope(user)); }

  @Get(':id/startup-blockers')
  @Permissions(PermissionKeys.PSSRRead)
  blockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.get(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/history')
  @Permissions(PermissionKeys.PSSRRead)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.pssr.historyTab(user.tenantId, id, this.scope(user), query); }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.PSSRRead)
  historySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.historyTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Get(':id/history/export/csv')
  @Permissions(PermissionKeys.PSSRRead)
  historyExportCsv(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.pssr.historyExport(user.tenantId, id, this.scope(user), query, 'csv'); }

  @Get(':id/history/export/pdf')
  @Permissions(PermissionKeys.PSSRRead)
  historyExportPdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.pssr.historyExport(user.tenantId, id, this.scope(user), query, 'pdf'); }

  @Get(':id/history/:eventId')
  @Permissions(PermissionKeys.PSSRRead)
  historyEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.pssr.historyEvent(user.tenantId, id, eventId, this.scope(user)); }

  @Get(':id/preview')
  @Permissions(PermissionKeys.PSSRRead)
  preview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.preview(user.tenantId, id, this.scope(user)); }

  @Get(':id/report')
  @Permissions(PermissionKeys.PSSRRead)
  report(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.report(user.tenantId, id, this.scope(user)); }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.PSSRRead)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.attachmentsTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/attachments/summary')
  @Permissions(PermissionKeys.PSSRRead)
  attachmentsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.attachmentsTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Post(':id/attachments')
  @Permissions(PermissionKeys.PSSRManage)
  attachmentUpload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addAttachment(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.PSSRRead)
  attachmentGet(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.pssr.attachment(user.tenantId, id, attachmentId, this.scope(user)); }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.PSSRManage)
  attachmentDelete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.pssr.deleteAttachment(user.tenantId, user.id, id, attachmentId, this.scope(user)); }

  @Get(':id/attachments/:attachmentId/download')
  @Permissions(PermissionKeys.PSSRRead)
  attachmentDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.pssr.attachmentAccess(user.tenantId, user.id, id, attachmentId, this.scope(user), 'download'); }

  @Get(':id/attachments/:attachmentId/preview')
  @Permissions(PermissionKeys.PSSRRead)
  attachmentPreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.pssr.attachmentAccess(user.tenantId, user.id, id, attachmentId, this.scope(user), 'preview'); }

  @Post(':id/attachments/link-document')
  @Permissions(PermissionKeys.PSSRManage)
  attachmentLinkDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.linkAttachmentDocument(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Delete(':id/attachments/unlink-document/:documentId')
  @Permissions(PermissionKeys.PSSRManage)
  attachmentUnlinkDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) { return this.pssr.unlinkAttachmentDocument(user.tenantId, user.id, id, documentId, this.scope(user)); }

  @Post(':id/readiness-check')
  @Permissions(PermissionKeys.PSSRManage)
  readiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.readinessCheck(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/generate-checklist')
  @Permissions(PermissionKeys.PSSRManage)
  generateChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateChecklist(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/sync-linked-moc')
  @Permissions(PermissionKeys.PSSRManage)
  syncLinkedMoc(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.syncLinkedMoc(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/checklist')
  @Permissions(PermissionKeys.PSSRRead)
  checklist(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.checklistTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/checklist/summary')
  @Permissions(PermissionKeys.PSSRRead)
  checklistSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.checklistSummaryApi(user.tenantId, id, this.scope(user)); }

  @Post(':id/checklist/generate')
  @Permissions(PermissionKeys.PSSRManage)
  checklistGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateChecklist(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/checklist/regenerate')
  @Permissions(PermissionKeys.PSSRManage)
  checklistRegenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.regenerateChecklist(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/checklist/generate-hazard-items')
  @Permissions(PermissionKeys.PSSRManage)
  checklistGenerateHazardItems(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateHazardItems(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/checklist/items')
  @Permissions(PermissionKeys.PSSRManage)
  checklistAddItem(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addChecklistItem(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/checklist/items/:itemId')
  @Permissions(PermissionKeys.PSSRManage)
  checklistPatchItem(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.patchChecklistItem(user.tenantId, user.id, id, itemId, dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/complete')
  @Permissions(PermissionKeys.PSSRManage)
  checklistComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistAction(user.tenantId, user.id, id, itemId, 'complete', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/not-applicable')
  @Permissions(PermissionKeys.PSSRManage)
  checklistNotApplicable(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistAction(user.tenantId, user.id, id, itemId, 'not-applicable', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/fail')
  @Permissions(PermissionKeys.PSSRManage)
  checklistFail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistAction(user.tenantId, user.id, id, itemId, 'fail', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/waive')
  @Permissions(PermissionKeys.PSSRManage)
  checklistWaive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistAction(user.tenantId, user.id, id, itemId, 'waive', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/evidence')
  @Permissions(PermissionKeys.PSSRManage)
  checklistEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistEvidence(user.tenantId, user.id, id, itemId, dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/request-verification')
  @Permissions(PermissionKeys.PSSRManage)
  checklistRequestVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistAction(user.tenantId, user.id, id, itemId, 'request-verification', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  checklistVerify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistVerification(user.tenantId, user.id, id, itemId, 'verify', dto, this.scope(user)); }

  @Post(':id/checklist/items/:itemId/reject-verification')
  @Permissions(PermissionKeys.PSSRManage)
  checklistRejectVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.checklistVerification(user.tenantId, user.id, id, itemId, 'reject-verification', dto, this.scope(user)); }

  @Get(':id/checklist/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  checklistBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.checklistTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/checklist/history')
  @Permissions(PermissionKeys.PSSRRead)
  checklistHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.checklistTab(user.tenantId, id, this.scope(user)).then((row) => row.history); }

  @Get(':id/management-acceptances')
  @Permissions(PermissionKeys.PSSRRead)
  managementAcceptances(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.managementAcceptances(user.tenantId, id, this.scope(user)); }

  @Post(':id/management-acceptances')
  @Permissions(PermissionKeys.PSSRManage)
  createManagementAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.createManagementAcceptance(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/items/:recordType/:recordId/request-deferral')
  @Permissions(PermissionKeys.PSSRManage)
  requestDeferral(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recordType') recordType: string, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) { return this.pssr.createManagementAcceptance(user.tenantId, user.id, id, { ...dto, recordType, recordId }, this.scope(user)); }

  @Post(':id/items/:recordType/:recordId/accept-deferral')
  @Permissions(PermissionKeys.PSSRManage)
  acceptDeferral(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recordType') recordType: string, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) { return this.pssr.decideManagementAcceptance(user.tenantId, user.id, id, recordType, recordId, 'Accepted', dto, this.scope(user)); }

  @Post(':id/items/:recordType/:recordId/reject-deferral')
  @Permissions(PermissionKeys.PSSRManage)
  rejectDeferral(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recordType') recordType: string, @Param('recordId') recordId: string, @Body() dto: Record<string, any>) { return this.pssr.decideManagementAcceptance(user.tenantId, user.id, id, recordType, recordId, 'Rejected', dto, this.scope(user)); }

  @Get(':id/field-verification')
  @Permissions(PermissionKeys.PSSRRead)
  fieldVerification(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.fieldVerificationTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/field-verification/summary')
  @Permissions(PermissionKeys.PSSRRead)
  fieldVerificationSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.fieldVerificationTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Get(':id/field-verification/equipment')
  @Permissions(PermissionKeys.PSSRRead)
  fieldVerificationEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.fieldVerificationTab(user.tenantId, id, this.scope(user)).then((row) => row.equipment); }

  @Post(':id/field-verification/generate')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateFieldVerification(user.tenantId, user.id, id, this.scope(user)); }

  @Patch(':id/field-verification/equipment/:verificationId')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationPatchEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('verificationId') verificationId: string, @Body() dto: Record<string, any>) { return this.pssr.patchFieldEquipment(user.tenantId, user.id, id, verificationId, dto, this.scope(user)); }

  @Post(':id/field-verification/equipment/:verificationId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationVerifyEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('verificationId') verificationId: string, @Body() dto: Record<string, any>) { return this.pssr.verifyFieldEquipment(user.tenantId, user.id, id, verificationId, dto, this.scope(user)); }

  @Post(':id/field-verification/equipment/:verificationId/fail')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationFailEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('verificationId') verificationId: string, @Body() dto: Record<string, any>) { return this.pssr.verifyFieldEquipment(user.tenantId, user.id, id, verificationId, { ...dto, failed: true }, this.scope(user)); }

  @Get(':id/field-verification/equipment/:verificationId/checklist')
  @Permissions(PermissionKeys.PSSRRead)
  fieldVerificationEquipmentChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('verificationId') verificationId: string) { return this.pssr.fieldVerificationTab(user.tenantId, id, this.scope(user)).then((row) => row.checklist.filter((item: any) => item.equipment_verification_id === verificationId)); }

  @Patch(':id/field-verification/checklist/:itemId')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationPatchChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.patchFieldChecklist(user.tenantId, user.id, id, itemId, dto, this.scope(user)); }

  @Post(':id/field-verification/evidence')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.fieldEvidence(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/field-verification/signoff')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.fieldSignoff(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/field-verification/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  fieldVerificationBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.fieldVerificationTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Post(':id/field-verification/scan-equipment')
  @Permissions(PermissionKeys.PSSRManage)
  fieldVerificationScan(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.scanEquipment(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/document-readiness')
  @Permissions(PermissionKeys.PSSRRead)
  documentReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.documentReadinessTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/document-readiness/summary')
  @Permissions(PermissionKeys.PSSRRead)
  documentReadinessSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.documentReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Get(':id/document-readiness/requirements')
  @Permissions(PermissionKeys.PSSRRead)
  documentReadinessRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.documentReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.requirements); }

  @Post(':id/document-readiness/generate')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateDocumentReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/document-readiness/link-document')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessLink(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.linkDocument(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Delete(':id/document-readiness/unlink-document/:readinessId')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessUnlink(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('readinessId') readinessId: string) { return this.pssr.unlinkDocument(user.tenantId, user.id, id, readinessId, this.scope(user)); }

  @Post(':id/document-readiness/:readinessId/request-revision')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessRequestRevision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) { return this.pssr.documentAction(user.tenantId, user.id, id, readinessId, 'request-revision', dto, this.scope(user)); }

  @Post(':id/document-readiness/:readinessId/justify-not-required')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessJustify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) { return this.pssr.documentAction(user.tenantId, user.id, id, readinessId, 'justify-not-required', dto, this.scope(user)); }

  @Post(':id/document-readiness/:readinessId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessVerify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) { return this.pssr.documentAction(user.tenantId, user.id, id, readinessId, 'verify', dto, this.scope(user)); }

  @Post(':id/document-readiness/:readinessId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('readinessId') readinessId: string, @Body() dto: Record<string, any>) { return this.pssr.documentAction(user.tenantId, user.id, id, readinessId, 'reject', dto, this.scope(user)); }

  @Get(':id/document-readiness/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  documentReadinessBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.documentReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Post(':id/document-readiness/sync-from-moc')
  @Permissions(PermissionKeys.PSSRManage)
  documentReadinessSyncFromMoc(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateDocumentReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/startup-authorization')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorization(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/startup-authorization/summary')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Post(':id/startup-authorization/readiness-check')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.runFinalReadinessCheck(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/startup-authorization/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/startup-authorization/signatures')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationSignatures(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationTab(user.tenantId, id, this.scope(user)).then((row) => row.signatures); }

  @Post(':id/startup-authorization/generate-signatures')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationGenerateSignatures(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateAuthorizationSignatures(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/startup-authorization/signatures/:signatureId/sign')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationSign(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string, @Body() dto: Record<string, any>) { return this.pssr.authorizationSignatureAction(user.tenantId, user.id, id, signatureId, 'sign', dto, this.scope(user)); }

  @Post(':id/startup-authorization/signatures/:signatureId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string, @Body() dto: Record<string, any>) { return this.pssr.authorizationSignatureAction(user.tenantId, user.id, id, signatureId, 'reject', dto, this.scope(user)); }

  @Post(':id/startup-authorization/signatures/:signatureId/waive')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationWaive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signatureId') signatureId: string, @Body() dto: Record<string, any>) { return this.pssr.authorizationSignatureAction(user.tenantId, user.id, id, signatureId, 'waive', dto, this.scope(user)); }

  @Get(':id/startup-authorization/conditions')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationConditions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationTab(user.tenantId, id, this.scope(user)).then((row) => row.conditions); }

  @Post(':id/startup-authorization/conditions')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationAddCondition(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addStartupCondition(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/startup-authorization/conditions/:conditionId')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationPatchCondition(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conditionId') conditionId: string, @Body() dto: Record<string, any>) { return this.pssr.patchStartupCondition(user.tenantId, user.id, id, conditionId, dto, this.scope(user)); }

  @Delete(':id/startup-authorization/conditions/:conditionId')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationDeleteCondition(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('conditionId') conditionId: string) { return this.pssr.deleteStartupCondition(user.tenantId, user.id, id, conditionId, this.scope(user)); }

  @Post(':id/startup-authorization/return-for-correction')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationReturn(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.startupAuthorizationDecision(user.tenantId, user.id, id, 'return-for-correction', dto, this.scope(user)); }

  @Post(':id/startup-authorization/mark-ready')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationMarkReady(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationDecision(user.tenantId, user.id, id, 'mark-ready', {}, this.scope(user)); }

  @Post(':id/startup-authorization/authorize')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationAuthorize(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.startupAuthorizationDecision(user.tenantId, user.id, id, 'authorize', dto, this.scope(user)); }

  @Post(':id/startup-authorization/release')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationRelease(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.startupAuthorizationDecision(user.tenantId, user.id, id, 'release', dto, this.scope(user)); }

  @Post(':id/startup-authorization/cancel')
  @Permissions(PermissionKeys.PSSRManage)
  startupAuthorizationCancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.startupAuthorizationDecision(user.tenantId, user.id, id, 'cancel', dto, this.scope(user)); }

  @Get(':id/startup-authorization/history')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.historyTab(user.tenantId, id, this.scope(user), { category: 'AUTHORIZATION' }); }

  @Get(':id/startup-authorization/certificate')
  @Permissions(PermissionKeys.PSSRRead)
  startupAuthorizationCertificate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.startupAuthorizationCertificate(user.tenantId, id, this.scope(user)); }

  @Get(':id/auto-verifications')
  @Permissions(PermissionKeys.PSSRRead)
  autoVerifications(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.autoVerifications(user.tenantId, id, this.scope(user)); }

  @Post(':id/auto-verifications/sync')
  @Permissions(PermissionKeys.PSSRManage)
  autoVerificationsSync(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.syncAutoVerifications(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/auto-verifications/:linkId/sync')
  @Permissions(PermissionKeys.PSSRManage)
  autoVerificationSyncOne(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) { return this.pssr.syncAutoVerifications(user.tenantId, user.id, id, this.scope(user), linkId); }

  @Get(':id/auto-verifications/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  autoVerificationBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.autoVerificationBlockers(user.tenantId, id, this.scope(user)); }

  @Get(':id/discipline-signoffs')
  @Permissions(PermissionKeys.PSSRRead)
  disciplineSignoffs(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.disciplineSignoffs(user.tenantId, id, this.scope(user)); }

  @Post(':id/discipline-signoffs/generate')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineSignoffsGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateDisciplineSignoffs(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/discipline-signoffs/:signoffId/checklist')
  @Permissions(PermissionKeys.PSSRRead)
  disciplineChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string) { return this.pssr.disciplineSignoffs(user.tenantId, id, this.scope(user)).then((row) => row.items.filter((item: any) => item.signoff_id === signoffId)); }

  @Patch(':id/discipline-signoffs/:signoffId/checklist/:itemId')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineChecklistPatch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.pssr.patchDisciplineChecklistItem(user.tenantId, user.id, id, signoffId, itemId, dto, this.scope(user)); }

  @Post(':id/discipline-signoffs/:signoffId/sign')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineSign(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) { return this.pssr.signDiscipline(user.tenantId, user.id, id, signoffId, dto, this.scope(user)); }

  @Post(':id/discipline-signoffs/:signoffId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) { return this.pssr.rejectDiscipline(user.tenantId, user.id, id, signoffId, dto, this.scope(user)); }

  @Post(':id/discipline-signoffs/:signoffId/flag-blocker')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineFlag(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) { return this.pssr.signoffFlag(user.tenantId, user.id, id, signoffId, dto, this.scope(user)); }

  @Post(':id/discipline-signoffs/:signoffId/resolve-blocker')
  @Permissions(PermissionKeys.PSSRManage)
  disciplineResolveFlag(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) { return this.pssr.resolveSignoffFlag(user.tenantId, user.id, id, signoffId, dto.flagId ?? dto.flag_id, this.scope(user)); }

  @Post(':id/certificate/generate')
  @Permissions(PermissionKeys.PSSRManage)
  certificateGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateCertificate(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/certificate')
  @Permissions(PermissionKeys.PSSRRead)
  certificate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.certificate(user.tenantId, id, this.scope(user)); }

  @Get(':id/certificate/download')
  @Permissions(PermissionKeys.PSSRRead)
  certificateDownload(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.certificateAccess(user.tenantId, id, this.scope(user), 'download'); }

  @Get(':id/certificate/preview')
  @Permissions(PermissionKeys.PSSRRead)
  certificatePreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.certificateAccess(user.tenantId, id, this.scope(user), 'preview'); }

  @Post(':id/certificate/validate-before-release')
  @Permissions(PermissionKeys.PSSRManage)
  certificateValidate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.validateCertificateBeforeRelease(user.tenantId, id, this.scope(user)); }

  @Post(':id/certificate/revoke')
  @Permissions(PermissionKeys.PSSRManage)
  certificateRevoke(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.revokeCertificate(user.tenantId, user.id, id, this.scope(user), dto.reason); }

  @Post(':id/certificate/regenerate')
  @Permissions(PermissionKeys.PSSRManage)
  certificateRegenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateCertificate(user.tenantId, user.id, id, this.scope(user), true); }

  @Get(':id/certificate/versions')
  @Permissions(PermissionKeys.PSSRRead)
  certificateVersions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.certificateVersions(user.tenantId, id, this.scope(user)); }

  @Post(':id/certificate/:certificateId/supersede')
  @Permissions(PermissionKeys.PSSRManage)
  certificateSupersede(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('certificateId') certificateId: string, @Body() dto: Record<string, any>) { return this.pssr.supersedeCertificate(user.tenantId, user.id, id, certificateId, this.scope(user), dto.reason); }

  @Post(':id/certificate/revalidate')
  @Permissions(PermissionKeys.PSSRManage)
  certificateRevalidate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.revalidateCertificate(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/secure-share')
  @Permissions(PermissionKeys.PSSRManage)
  secureShareCreate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.createSecureShare(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/secure-share')
  @Permissions(PermissionKeys.PSSRRead)
  secureShares(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.secureShares(user.tenantId, id, this.scope(user)); }

  @Delete(':id/secure-share/:shareId')
  @Permissions(PermissionKeys.PSSRManage)
  secureShareRevoke(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('shareId') shareId: string) { return this.pssr.revokeSecureShare(user.tenantId, user.id, id, shareId, this.scope(user)); }

  @Get(':id/secure-share/:shareId/access-log')
  @Permissions(PermissionKeys.PSSRRead)
  secureShareAccessLog(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('shareId') shareId: string) { return this.pssr.secureShareAccessLog(user.tenantId, id, shareId, this.scope(user)); }

  @Get(':id/training-readiness')
  @Permissions(PermissionKeys.PSSRRead)
  trainingReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/training-readiness/summary')
  @Permissions(PermissionKeys.PSSRRead)
  trainingReadinessSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Post(':id/training-readiness/generate')
  @Permissions(PermissionKeys.PSSRManage)
  trainingGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTrainingReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/training-readiness/sync-from-moc')
  @Permissions(PermissionKeys.PSSRManage)
  trainingSyncMoc(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTrainingReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/training-readiness/sync-from-documents')
  @Permissions(PermissionKeys.PSSRManage)
  trainingSyncDocuments(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTrainingReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/training-requirements')
  @Permissions(PermissionKeys.PSSRRead)
  trainingRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.requirements); }

  @Post(':id/training-requirements')
  @Permissions(PermissionKeys.PSSRManage)
  trainingRequirementCreate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addTrainingRequirement(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/training-requirements/:requirementId')
  @Permissions(PermissionKeys.PSSRManage)
  trainingRequirementPatch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) { return this.pssr.patchTrainingRequirement(user.tenantId, user.id, id, requirementId, dto, this.scope(user)); }

  @Delete(':id/training-requirements/:requirementId')
  @Permissions(PermissionKeys.PSSRManage)
  trainingRequirementDelete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string) { return this.pssr.deleteTrainingRequirement(user.tenantId, user.id, id, requirementId, this.scope(user)); }

  @Get(':id/training-assignments')
  @Permissions(PermissionKeys.PSSRRead)
  trainingAssignments(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.assignments); }

  @Post(':id/training-assignments/:assignmentId/complete')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingAssignmentAction(user.tenantId, user.id, id, assignmentId, 'complete', dto, this.scope(user)); }

  @Post(':id/training-assignments/:assignmentId/evidence')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingEvidence(user.tenantId, user.id, id, assignmentId, dto, this.scope(user)); }

  @Post(':id/training-assignments/:assignmentId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentVerify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingAssignmentAction(user.tenantId, user.id, id, assignmentId, 'verify', dto, this.scope(user)); }

  @Post(':id/training-assignments/:assignmentId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingAssignmentAction(user.tenantId, user.id, id, assignmentId, 'reject', dto, this.scope(user)); }

  @Post(':id/training-assignments/:assignmentId/waive')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentWaive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingAssignmentAction(user.tenantId, user.id, id, assignmentId, 'waive', dto, this.scope(user)); }

  @Post(':id/training-assignments/:assignmentId/reminder')
  @Permissions(PermissionKeys.PSSRManage)
  trainingAssignmentReminder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assignmentId') assignmentId: string, @Body() dto: Record<string, any>) { return this.pssr.trainingAssignmentAction(user.tenantId, user.id, id, assignmentId, 'reminder', dto, this.scope(user)); }

  @Get(':id/personnel-acknowledgements')
  @Permissions(PermissionKeys.PSSRRead)
  personnelAcknowledgements(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.acknowledgements); }

  @Post(':id/personnel-acknowledgements/:ackId/acknowledge')
  @Permissions(PermissionKeys.PSSRManage)
  personnelAcknowledge(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ackId') ackId: string, @Body() dto: Record<string, any>) { return this.pssr.acknowledgementAction(user.tenantId, user.id, id, ackId, 'acknowledge', dto, this.scope(user)); }

  @Post(':id/personnel-acknowledgements/:ackId/waive')
  @Permissions(PermissionKeys.PSSRManage)
  personnelWaive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ackId') ackId: string, @Body() dto: Record<string, any>) { return this.pssr.acknowledgementAction(user.tenantId, user.id, id, ackId, 'waive', dto, this.scope(user)); }

  @Get(':id/training-readiness/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  trainingBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.trainingReadinessTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/testing-commissioning')
  @Permissions(PermissionKeys.PSSRRead)
  testingCommissioning(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.testingCommissioningTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/testing-commissioning/summary')
  @Permissions(PermissionKeys.PSSRRead)
  testingSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.testingCommissioningTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Post(':id/testing-commissioning/generate')
  @Permissions(PermissionKeys.PSSRManage)
  testingGenerate(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTestingCommissioning(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/testing-commissioning/sync-from-moc')
  @Permissions(PermissionKeys.PSSRManage)
  testingSyncMoc(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTestingCommissioning(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/testing-commissioning/sync-from-engineering')
  @Permissions(PermissionKeys.PSSRManage)
  testingSyncEngineering(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.generateTestingCommissioning(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/test-requirements')
  @Permissions(PermissionKeys.PSSRRead)
  testRequirements(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.testingCommissioningTab(user.tenantId, id, this.scope(user)).then((row) => row.requirements); }

  @Post(':id/test-requirements')
  @Permissions(PermissionKeys.PSSRManage)
  testRequirementCreate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addTestRequirement(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/test-requirements/:requirementId')
  @Permissions(PermissionKeys.PSSRManage)
  testRequirementPatch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) { return this.pssr.patchTestRequirement(user.tenantId, user.id, id, requirementId, dto, this.scope(user)); }

  @Get(':id/test-records')
  @Permissions(PermissionKeys.PSSRRead)
  testRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.testingCommissioningTab(user.tenantId, id, this.scope(user)).then((row) => row.records); }

  @Post(':id/test-records')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordCreate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addTestRecord(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/test-records/:testRecordId')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordPatch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.patchTestRecord(user.tenantId, user.id, id, testRecordId, dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/pass')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordPass(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'pass', dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/fail')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordFail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'fail', dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/evidence')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testEvidence(user.tenantId, user.id, id, testRecordId, dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/request-verification')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordRequestVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'request-verification', dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordVerify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'verify', dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'reject', dto, this.scope(user)); }

  @Post(':id/test-records/:testRecordId/waive')
  @Permissions(PermissionKeys.PSSRManage)
  testRecordWaive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('testRecordId') testRecordId: string, @Body() dto: Record<string, any>) { return this.pssr.testRecordAction(user.tenantId, user.id, id, testRecordId, 'waive', dto, this.scope(user)); }

  @Get(':id/testing-commissioning/blockers')
  @Permissions(PermissionKeys.PSSRRead)
  testingBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.testingCommissioningTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/punch-list')
  @Permissions(PermissionKeys.PSSRRead)
  punchList(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.punchListTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/punch-list/summary')
  @Permissions(PermissionKeys.PSSRRead)
  punchSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.punchListTab(user.tenantId, id, this.scope(user)).then((row) => row.summary); }

  @Post(':id/punch-list/sync')
  @Permissions(PermissionKeys.PSSRManage)
  punchSync(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.syncPunchItems(user.tenantId, user.id, id, this.scope(user)); }

  @Post(':id/punch-list/items')
  @Permissions(PermissionKeys.PSSRManage)
  punchCreate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.pssr.addPunchItem(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/punch-list/items/:punchItemId')
  @Permissions(PermissionKeys.PSSRManage)
  punchPatch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.patchPunchItem(user.tenantId, user.id, id, punchItemId, dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/evidence')
  @Permissions(PermissionKeys.PSSRManage)
  punchEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchEvidence(user.tenantId, user.id, id, punchItemId, dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/request-verification')
  @Permissions(PermissionKeys.PSSRManage)
  punchRequestVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchAction(user.tenantId, user.id, id, punchItemId, 'request-verification', dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/verify')
  @Permissions(PermissionKeys.PSSRManage)
  punchVerify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchAction(user.tenantId, user.id, id, punchItemId, 'verify', dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/reject')
  @Permissions(PermissionKeys.PSSRManage)
  punchReject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchAction(user.tenantId, user.id, id, punchItemId, 'reject', dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/defer')
  @Permissions(PermissionKeys.PSSRManage)
  punchDefer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.deferPunchItem(user.tenantId, user.id, id, punchItemId, dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/close')
  @Permissions(PermissionKeys.PSSRManage)
  punchClose(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchAction(user.tenantId, user.id, id, punchItemId, 'close', dto, this.scope(user)); }

  @Post(':id/punch-list/items/:punchItemId/reopen')
  @Permissions(PermissionKeys.PSSRManage)
  punchReopen(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('punchItemId') punchItemId: string, @Body() dto: Record<string, any>) { return this.pssr.punchAction(user.tenantId, user.id, id, punchItemId, 'reopen', dto, this.scope(user)); }

  @Get(':id/punch-list/startup-blockers')
  @Permissions(PermissionKeys.PSSRRead)
  punchStartupBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.punchListTab(user.tenantId, id, this.scope(user)).then((row) => row.blockers); }

  @Get(':id/punch-list/action-links')
  @Permissions(PermissionKeys.PSSRRead)
  punchActionLinks(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.punchListTab(user.tenantId, id, this.scope(user)).then((row) => row.links); }

  @Post(':id/punch-list/refresh-action-statuses')
  @Permissions(PermissionKeys.PSSRManage)
  punchRefreshActions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.pssr.punchListTab(user.tenantId, id, this.scope(user)); }

  @Post(':id/:action')
  @Permissions(PermissionKeys.PSSRManage)
  transition(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('action') action: string) { return this.pssr.transition(user.tenantId, user.id, id, action, this.scope(user)); }

  private scope(user: RequestUser): { allowedSiteIds?: string[] | undefined; selectedSiteId?: string | null | undefined; corporateView?: boolean | undefined } {
    return { allowedSiteIds: user.siteIds, selectedSiteId: user.selectedSiteId, corporateView: user.corporateView };
  }
}

@Controller('public/pssr-share')
export class PublicPssrShareController {
  constructor(private readonly pssr: PssrService) {}

  @Get(':token')
  view(@Param('token') token: string) {
    return this.pssr.publicShare(token, 'view');
  }

  @Get(':token/download')
  download(@Param('token') token: string) {
    return this.pssr.publicShare(token, 'download');
  }
}
