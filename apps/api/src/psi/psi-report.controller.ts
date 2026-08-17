import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { PsiReportService } from './psi-report.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information/reports')
export class PsiReportController {
  constructor(private readonly reports: PsiReportService) {}

  @Get()
  @Permissions(PermissionKeys.PSIReportDashboardView)
  root(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.dashboard(this.ctx(user), query);
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.PSIReportDashboardView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.dashboard(this.ctx(user), query);
  }

  @Get('summary')
  @Permissions(PermissionKeys.PSIReportDashboardView)
  summary(@CurrentUser() user: RequestUser) {
    return this.reports.summary(this.ctx(user));
  }

  @Get('templates')
  @Permissions(PermissionKeys.PSIReportTemplateView)
  templates(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.templates(this.ctx(user), query);
  }

  @Post('templates')
  @Permissions(PermissionKeys.PSIReportTemplateCreate)
  createTemplate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.saveTemplate(this.ctx(user), dto);
  }

  @Get('templates/:templateId')
  @Permissions(PermissionKeys.PSIReportTemplateView)
  template(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) {
    return this.reports.template(this.ctx(user), templateId);
  }

  @Patch('templates/:templateId')
  @Permissions(PermissionKeys.PSIReportTemplateEdit)
  updateTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() dto: Record<string, any>) {
    return this.reports.saveTemplate(this.ctx(user), dto, templateId);
  }

  @Post('templates/:templateId/archive')
  @Permissions(PermissionKeys.PSIReportTemplateArchive)
  archiveTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() dto: Record<string, any>) {
    return this.reports.archiveTemplate(this.ctx(user), templateId, dto);
  }

  @Post('templates/:templateId/clone')
  @Permissions(PermissionKeys.PSIReportTemplateCreate)
  cloneTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() dto: Record<string, any>) {
    return this.reports.cloneTemplate(this.ctx(user), templateId, dto);
  }

  @Post('generate')
  @Permissions(PermissionKeys.PSIReportGenerate)
  generate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.generateReport(this.ctx(user), dto);
  }

  @Get('generated')
  @Permissions(PermissionKeys.PSIReportView)
  generated(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.generatedReports(this.ctx(user), query);
  }

  @Get('generated/:reportId')
  @Permissions(PermissionKeys.PSIReportView)
  report(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) {
    return this.reports.reportDetail(this.ctx(user), reportId);
  }

  @Get('generated/:reportId/preview')
  @Permissions(PermissionKeys.PSIReportView)
  preview(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) {
    return this.reports.reportPreview(this.ctx(user), reportId);
  }

  @Get('generated/:reportId/files')
  @Permissions(PermissionKeys.PSIReportView)
  files(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) {
    return this.reports.reportFiles(this.ctx(user), reportId);
  }

  @Post('generated/:reportId/regenerate')
  @Permissions(PermissionKeys.PSIReportRegenerate)
  regenerate(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) {
    return this.reports.regenerateReport(this.ctx(user), reportId, dto);
  }

  @Post('generated/:reportId/archive')
  @Permissions(PermissionKeys.PSIReportArchive)
  archiveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) {
    return this.reports.archiveReport(this.ctx(user), reportId, dto);
  }

  @Get('files/:fileId/download')
  @Permissions(PermissionKeys.PSIReportDownload)
  downloadFile(@CurrentUser() user: RequestUser, @Param('fileId') fileId: string, @Query() query: Record<string, any>) {
    return this.reports.downloadFile(this.ctx(user), fileId, query);
  }

  @Post('files/:fileId/download-event')
  @Permissions(PermissionKeys.PSIReportDownload)
  downloadEvent(@CurrentUser() user: RequestUser, @Param('fileId') fileId: string, @Body() dto: Record<string, any>) {
    return this.reports.downloadFile(this.ctx(user), fileId, dto);
  }

  @Post('export')
  @Permissions(PermissionKeys.PSIExportCreate)
  export(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.createExport(this.ctx(user), dto);
  }

  @Get('export/jobs')
  @Permissions(PermissionKeys.PSIExportView)
  exportJobs(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.exportJobs(this.ctx(user), query);
  }

  @Get('export/jobs/:exportJobId')
  @Permissions(PermissionKeys.PSIExportView)
  exportJob(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string) {
    return this.reports.exportJob(this.ctx(user), exportJobId);
  }

  @Post('export/jobs/:exportJobId/cancel')
  @Permissions(PermissionKeys.PSIExportCancel)
  cancelExport(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string, @Body() dto: Record<string, any>) {
    return this.reports.cancelExport(this.ctx(user), exportJobId, dto);
  }

  @Post('export/jobs/:exportJobId/retry')
  @Permissions(PermissionKeys.PSIExportRegenerate)
  retryExport(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string) {
    return this.reports.retryExport(this.ctx(user), exportJobId);
  }

  @Get('export/packages')
  @Permissions(PermissionKeys.PSIExportView)
  packages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.exportPackages(this.ctx(user), query);
  }

  @Get('export/packages/:packageId')
  @Permissions(PermissionKeys.PSIExportView)
  package(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.packageDetail(this.ctx(user), packageId);
  }

  @Get('export/packages/:packageId/manifest')
  @Permissions(PermissionKeys.PSIExportView)
  manifest(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.packageDetail(this.ctx(user), packageId);
  }

  @Get('export/packages/:packageId/items')
  @Permissions(PermissionKeys.PSIExportView)
  packageItems(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.packageDetail(this.ctx(user), packageId);
  }

  @Get('export/packages/:packageId/download')
  @Permissions(PermissionKeys.PSIExportDownload)
  packageDownload(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.packageDetail(this.ctx(user), packageId);
  }

  @Post('export/packages/:packageId/regenerate')
  @Permissions(PermissionKeys.PSIExportRegenerate)
  packageRegenerate(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) {
    return this.reports.packageDetail(this.ctx(user), packageId);
  }

  @Post('export/packages/:packageId/archive')
  @Permissions(PermissionKeys.PSIExportArchive)
  archivePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Body() dto: Record<string, any>) {
    return this.reports.archivePackage(this.ctx(user), packageId, dto);
  }

  @Get('scheduled')
  @Permissions(PermissionKeys.PSIScheduledReportView)
  schedules(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.scheduledReports(this.ctx(user), query);
  }

  @Post('scheduled')
  @Permissions(PermissionKeys.PSIScheduledReportCreate)
  createSchedule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.saveSchedule(this.ctx(user), dto);
  }

  @Get('scheduled/:scheduleId')
  @Permissions(PermissionKeys.PSIScheduledReportView)
  schedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string) {
    return this.reports.scheduledReport(this.ctx(user), scheduleId);
  }

  @Patch('scheduled/:scheduleId')
  @Permissions(PermissionKeys.PSIScheduledReportEdit)
  updateSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string, @Body() dto: Record<string, any>) {
    return this.reports.saveSchedule(this.ctx(user), dto, scheduleId);
  }

  @Post('scheduled/:scheduleId/run-now')
  @Permissions(PermissionKeys.PSIReportGenerate)
  runSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string) {
    return this.reports.runScheduleNow(this.ctx(user), scheduleId);
  }

  @Post('scheduled/:scheduleId/archive')
  @Permissions(PermissionKeys.PSIScheduledReportArchive)
  archiveSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string, @Body() dto: Record<string, any>) {
    return this.reports.archiveSchedule(this.ctx(user), scheduleId, dto);
  }

  @Get('settings')
  @Permissions(PermissionKeys.PSIReportSettingsView)
  settings(@CurrentUser() user: RequestUser) {
    return this.reports.settings(this.ctx(user));
  }

  @Patch('settings')
  @Permissions(PermissionKeys.PSIReportSettingsEdit)
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reports.updateSettings(this.ctx(user), dto);
  }

  @Get('history')
  @Permissions(PermissionKeys.PSIReportView)
  history(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reports.history(this.ctx(user), query);
  }

  @Get('lookups/:kind')
  @Permissions(PermissionKeys.PSIReportView)
  lookups(@Param('kind') kind: string) {
    return this.reports.lookups(kind);
  }

  private ctx(user: RequestUser) {
    return { tenantId: user.tenantId, actorId: user.id, scope: { allowedSiteIds: user.siteIds, selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: user.corporateView === true }, permissions: user.permissions };
  }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information')
export class PsiReportSourceController {
  constructor(private readonly reports: PsiReportService) {}

  @Get('units/:unitId/reports')
  @Permissions(PermissionKeys.PSIReportView)
  unitReports(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.reports.generatedReports(this.ctx(user), { ...query, unitId });
  }

  @Post('units/:unitId/reports/generate')
  @Permissions(PermissionKeys.PSIReportGenerateUnit)
  unitGenerate(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.reports.scopedReport(this.ctx(user), 'Unit', unitId, dto);
  }

  @Post('units/:unitId/export')
  @Permissions(PermissionKeys.PSIExportCreate)
  unitExport(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.reports.scopedExport(this.ctx(user), 'Unit', unitId, dto);
  }

  @Post('units/:unitId/export/psi-package')
  @Permissions(PermissionKeys.PSIExportCreate)
  unitPackage(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.reports.scopedExport(this.ctx(user), 'Unit', unitId, { ...dto, packageType: 'Unit PSI Package' });
  }

  @Get('equipment/:equipmentId/reports')
  @Permissions(PermissionKeys.PSIReportView)
  equipmentReports(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.reports.generatedReports(this.ctx(user), { ...query, equipmentId });
  }

  @Post('equipment/:equipmentId/export')
  @Permissions(PermissionKeys.PSIExportCreate)
  equipmentExport(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: Record<string, any>) {
    return this.reports.scopedExport(this.ctx(user), 'Equipment', equipmentId, dto);
  }

  @Get(':moduleKey/reports')
  @Permissions(PermissionKeys.PSIReportView)
  moduleReports(@CurrentUser() user: RequestUser, @Param('moduleKey') moduleKey: string, @Query() query: Record<string, any>) {
    return this.reports.moduleReports(this.ctx(user), moduleKey, query);
  }

  private ctx(user: RequestUser) {
    return { tenantId: user.tenantId, actorId: user.id, scope: { allowedSiteIds: user.siteIds, selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: user.corporateView === true }, permissions: user.permissions };
  }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/equipment/:equipmentId')
export class PsiReportMechanicalIntegrityController {
  constructor(private readonly reports: PsiReportService) {}

  @Get('psi-report')
  @Permissions(PermissionKeys.PSIReportView)
  miPsiReports(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.reports.generatedReports(this.ctx(user), { ...query, equipmentId });
  }

  @Post('psi-export')
  @Permissions(PermissionKeys.PSIExportCreate)
  miPsiExport(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: Record<string, any>) {
    return this.reports.scopedExport(this.ctx(user), 'Equipment', equipmentId, { ...dto, packageType: 'MI PSI Readiness Package' });
  }

  private ctx(user: RequestUser) {
    return { tenantId: user.tenantId, actorId: user.id, scope: { allowedSiteIds: user.siteIds, selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: user.corporateView === true }, permissions: user.permissions };
  }
}
