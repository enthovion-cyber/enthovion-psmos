import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiHistoryReportingService } from './mi-history-reporting.service';

type QueryMap = Record<string, string | undefined>;

function sendFile(response: any, payload: { fileName: string; content: string }) {
  const json = payload.fileName.endsWith('.json');
  response.setHeader('Content-Type', json ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-history-reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiHistoryReportingController {
  constructor(private readonly service: MiHistoryReportingService) {}

  @Get('history')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  history(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.historyDashboard(user, query); }

  @Get('history/summary')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  historySummary(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.historySummaryEndpoint(user, query); }

  @Get('history/timeline')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  historyTimeline(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.timeline(user, query); }

  @Get('history/audit-trail')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryViewAudit)
  auditTrail(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.auditTrail(user, query); }

  @Get('history/changes')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  changes(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.historyDashboard(user, { ...query, beforeAfter: 'true' }); }

  @Get('history/events/:eventId')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  event(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string) { return this.service.eventDetail(user, eventId); }

  @Get('equipment/:equipmentId/history')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  equipmentHistory(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.service.equipmentHistory(user, equipmentId, query); }

  @Get('equipment/:equipmentId/history/timeline')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  equipmentHistoryTimeline(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.service.equipmentHistory(user, equipmentId, query); }

  @Get('equipment/:equipmentId/history/export')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryExport)
  async equipmentHistoryExport(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Res() response: any) { return sendFile(response, await this.service.equipmentHistoryExport(user, equipmentId)); }

  @Get('reports')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  reports(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.reportsDashboard(user, query); }

  @Get('reports/templates')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  templates(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.reportTemplates(user, query); }

  @Post('reports/templates')
  @Permissions(PermissionKeys.MechanicalIntegrityReportManageTemplates)
  createTemplate(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.createReportTemplate(user, body); }

  @Get('reports/templates/:templateId')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  template(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.service.reportTemplate(user, templateId); }

  @Patch('reports/templates/:templateId')
  @Permissions(PermissionKeys.MechanicalIntegrityReportManageTemplates)
  updateTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() body: Record<string, any>) { return this.service.updateReportTemplate(user, templateId, body); }

  @Post('reports/templates/:templateId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityReportManageTemplates)
  archiveTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.service.archiveReportTemplate(user, templateId); }

  @Post('reports/generate')
  @Permissions(PermissionKeys.MechanicalIntegrityReportGenerate)
  generateReport(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.generateReport(user, body); }

  @Get('reports/generated')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  generated(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.generatedReports(user, query); }

  @Get('reports/generated/:reportId')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  generatedDetail(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.service.generatedReport(user, reportId); }

  @Get('reports/generated/:reportId/download')
  @Permissions(PermissionKeys.MechanicalIntegrityReportExport)
  async downloadReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Res() response: any) { return sendFile(response, await this.service.reportDownload(user, reportId)); }

  @Post('reports/generated/:reportId/regenerate')
  @Permissions(PermissionKeys.MechanicalIntegrityReportGenerate)
  regenerateReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.service.regenerateReport(user, reportId); }

  @Get('reports/scheduled')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  scheduled(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.scheduledReports(user, query); }

  @Post('reports/scheduled')
  @Permissions(PermissionKeys.MechanicalIntegrityReportSchedule)
  createSchedule(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.createScheduledReport(user, body); }

  @Patch('reports/scheduled/:scheduleId')
  @Permissions(PermissionKeys.MechanicalIntegrityReportSchedule)
  updateSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string, @Body() body: Record<string, any>) { return this.service.updateScheduledReport(user, scheduleId, body); }

  @Post('reports/scheduled/:scheduleId/disable')
  @Permissions(PermissionKeys.MechanicalIntegrityReportSchedule)
  disableSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') scheduleId: string) { return this.service.disableScheduledReport(user, scheduleId); }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  exportCenter(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.exportCenter(user, query); }

  @Post('export/jobs')
  @Permissions(PermissionKeys.MechanicalIntegrityExportCreate)
  createExportJob(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.createExportJob(user, body); }

  @Get('export/jobs')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  exportJobs(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.exportJobs(user, query); }

  @Get('export/jobs/:exportJobId')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  exportJob(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string) { return this.service.exportJob(user, exportJobId); }

  @Post('export/jobs/:exportJobId/cancel')
  @Permissions(PermissionKeys.MechanicalIntegrityExportCreate)
  cancelExportJob(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string) { return this.service.cancelExportJob(user, exportJobId); }

  @Get('export/jobs/:exportJobId/download')
  @Permissions(PermissionKeys.MechanicalIntegrityExportDownload)
  async downloadExportJob(@CurrentUser() user: RequestUser, @Param('exportJobId') exportJobId: string, @Res() response: any) { return sendFile(response, await this.service.downloadExportJob(user, exportJobId)); }

  @Post('equipment/:equipmentId/export/integrity-file')
  @Permissions(PermissionKeys.MechanicalIntegrityExportCreate)
  equipmentIntegrityFile(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) { return this.service.equipmentIntegrityFileExport(user, equipmentId, body); }

  @Get('export/packages')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  packages(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.exportPackages(user, query); }

  @Get('export/packages/:packageId')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  package(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) { return this.service.exportPackage(user, packageId); }

  @Get('export/packages/:packageId/download')
  @Permissions(PermissionKeys.MechanicalIntegrityExportDownload)
  async downloadPackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Res() response: any) { return sendFile(response, await this.service.downloadPackage(user, packageId)); }
}

@ApiTags('mechanical-integrity-history-reporting-lookups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/lookups')
export class MiHistoryReportingLookupsController {
  constructor(private readonly service: MiHistoryReportingService) {}

  @Get('report-categories')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  reportCategories() { return this.service.lookups().reportCategories; }

  @Get('report-types')
  @Permissions(PermissionKeys.MechanicalIntegrityReportView)
  reportTypes() { return this.service.lookups().reportTypes; }

  @Get('export-types')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  exportTypes() { return this.service.lookups().exportTypes; }

  @Get('export-formats')
  @Permissions(PermissionKeys.MechanicalIntegrityExportView)
  exportFormats() { return this.service.lookups().exportFormats; }

  @Get('history-event-types')
  @Permissions(PermissionKeys.MechanicalIntegrityHistoryView)
  historyEventTypes() { return this.service.lookups().historyEventTypes; }
}
