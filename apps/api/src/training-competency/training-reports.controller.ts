import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingReportsService } from './training-reports.service';

type Dto = Record<string, any>;

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('training-competency')
export class TrainingReportsController {
  constructor(private readonly reports: TrainingReportsService) {}

  @Get('reports') @Permissions('training.reports.view') root(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.dashboard(user, query); }
  @Get('reports/dashboard') @Permissions('training.reports.dashboard.view') dashboard(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.dashboard(user, query); }
  @Get('reports/dashboard/summary') @Permissions('training.reports.dashboard.view') summary(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.dashboardSummary(user, query); }
  @Get('reports/dashboard/recent') @Permissions('training.reports.dashboard.view') recent(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.generated(user, query); }
  @Get('reports/dashboard/export-jobs') @Permissions('training.reports.dashboard.view') dashboardJobs(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.exportJobs(user, query); }
  @Get('reports/dashboard/download-activity') @Permissions('training.reports.dashboard.view') downloadActivity(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.downloads(user, query); }

  @Get('reports/templates') @Permissions('training.reports.template.view') templates(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.templates(user, query); }
  @Post('reports/templates') @Permissions('training.reports.template.create') createTemplate(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.createTemplate(user, dto); }
  @Get('reports/templates/:templateId') @Permissions('training.reports.template.view') template(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.reports.templateDetail(user, templateId); }
  @Patch('reports/templates/:templateId') @Permissions('training.reports.template.edit') updateTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() dto: Dto) { return this.reports.updateTemplate(user, templateId, dto); }
  @Post('reports/templates/:templateId/archive') @Permissions('training.reports.template.archive') archiveTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string, @Body() dto: Dto) { return this.reports.archiveTemplate(user, templateId, dto); }
  @Post('reports/templates/:templateId/reactivate') @Permissions('training.reports.template.activate') reactivateTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.reports.reactivateTemplate(user, templateId); }
  @Post('reports/templates/:templateId/activate') @Permissions('training.reports.template.activate') activateTemplate(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.reports.activateTemplate(user, templateId); }
  @Post('reports/templates/:templateId/new-version') @Permissions('training.reports.template.edit') newVersion(@CurrentUser() user: RequestUser, @Param('templateId') templateId: string) { return this.reports.newVersion(user, templateId); }

  @Post('reports/preview') @Permissions('training.reports.generate') preview(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.preview(user, dto); }
  @Post('reports/generate') @Permissions('training.reports.generate') generate(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.generate(user, dto); }
  @Post('reports/export') @Permissions('training.reports.generate') export(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.exportReport(user, dto); }
  @Get('reports/generated') @Permissions('training.reports.view') generated(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.generated(user, query); }
  @Get('reports/generated/:reportId') @Permissions('training.reports.view') generatedDetail(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.generatedDetail(user, reportId); }
  @Get('reports/generated/:reportId/files') @Permissions('training.reports.view') files(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.files(user, reportId); }
  @Post('reports/generated/:reportId/archive') @Permissions('training.reports.generate') archiveGenerated(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Dto) { return this.reports.archiveGenerated(user, reportId, dto); }
  @Delete('reports/generated/:reportId') @Permissions('training.reports.generate') deleteGenerated(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Dto) { return this.reports.deleteGenerated(user, reportId, dto); }

  @Get('reports/export/jobs') @Permissions('training.reports.view') exportJobs(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.exportJobs(user, query); }
  @Get('reports/export/jobs/:jobId') @Permissions('training.reports.view') exportJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) { return this.reports.exportJobDetail(user, jobId); }
  @Post('reports/export/jobs/:jobId/retry') @Permissions('training.reports.generate') retryJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) { return this.reports.retryJob(user, jobId); }
  @Post('reports/export/jobs/:jobId/cancel') @Permissions('training.reports.generate') cancelJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) { return this.reports.cancelJob(user, jobId); }
  @Delete('reports/export/jobs/:jobId') @Permissions('training.reports.generate') deleteJob(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) { return this.reports.deleteJob(user, jobId); }

  @Get('reports/files/:fileId/download') @Permissions('training.reports.download') downloadFile(@CurrentUser() user: RequestUser, @Param('fileId') fileId: string) { return this.reports.downloadFile(user, fileId); }
  @Get('reports/packages/:packageId/download') @Permissions('training.reports.package.download') downloadPackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) { return this.reports.downloadPackage(user, packageId); }
  @Get('reports/downloads') @Permissions('training.reports.history.view') downloads(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.downloads(user, query); }

  @Get('reports/packages') @Permissions('training.reports.package.view') packages(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.packages(user, query); }
  @Post('reports/packages') @Permissions('training.reports.package.create') createPackage(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.createPackage(user, dto); }
  @Get('reports/packages/:packageId') @Permissions('training.reports.package.view') packageDetail(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) { return this.reports.packageDetail(user, packageId); }
  @Post('reports/packages/:packageId/regenerate') @Permissions('training.reports.package.create') regeneratePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) { return this.reports.regeneratePackage(user, packageId); }
  @Get('reports/audit-evidence') @Permissions('training.reports.audit_evidence.view') auditEvidence(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.auditEvidence(user, query); }

  @Get('reports/scheduled') @Permissions('training.reports.scheduled.view') scheduled(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.scheduled(user, query); }
  @Post('reports/scheduled') @Permissions('training.reports.scheduled.create') createScheduled(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.createScheduled(user, dto); }
  @Get('reports/scheduled/:scheduledReportId') @Permissions('training.reports.scheduled.view') scheduledDetail(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string) { return this.reports.scheduledDetail(user, scheduledReportId); }
  @Patch('reports/scheduled/:scheduledReportId') @Permissions('training.reports.scheduled.edit') updateScheduled(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string, @Body() dto: Dto) { return this.reports.updateScheduled(user, scheduledReportId, dto); }
  @Post('reports/scheduled/:scheduledReportId/run-now') @Permissions('training.reports.generate') runScheduledNow(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string) { return this.reports.runScheduledNow(user, scheduledReportId); }
  @Post('reports/scheduled/:scheduledReportId/pause') @Permissions('training.reports.scheduled.edit') pauseScheduled(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string) { return this.reports.scheduledStatus(user, scheduledReportId, 'Paused'); }
  @Post('reports/scheduled/:scheduledReportId/resume') @Permissions('training.reports.scheduled.edit') resumeScheduled(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string) { return this.reports.scheduledStatus(user, scheduledReportId, 'Active'); }
  @Post('reports/scheduled/:scheduledReportId/archive') @Permissions('training.reports.scheduled.archive') archiveScheduled(@CurrentUser() user: RequestUser, @Param('scheduledReportId') scheduledReportId: string) { return this.reports.scheduledStatus(user, scheduledReportId, 'Archived'); }

  @Get('reports/workforce') @Permissions('training.reports.view') workforce(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Workforce', query); }
  @Get('reports/training-matrix') @Permissions('training.reports.view') matrix(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Training Matrix', query); }
  @Get('reports/competency') @Permissions('training.reports.view') competency(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Competency', query); }
  @Get('reports/required-training') @Permissions('training.reports.view') required(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Required Training', query); }
  @Get('reports/training-records') @Permissions('training.reports.view') records(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Training Records', query); }
  @Get('reports/certifications') @Permissions('training.reports.view') certifications(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Certifications', query); }
  @Get('reports/assessments') @Permissions('training.reports.view') assessments(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Assessments', query); }
  @Get('reports/sop-acknowledgements') @Permissions('training.reports.view') sop(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'SOP Acknowledgements', query); }
  @Get('reports/moc-training') @Permissions('training.reports.view') moc(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'MOC Training', query); }
  @Get('reports/pssr-training') @Permissions('training.reports.view') pssr(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'PSSR Training', query); }
  @Get('reports/ptw-authorization') @Permissions('training.reports.view') ptw(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'PTW Authorization', query); }
  @Get('reports/gaps') @Permissions('training.reports.view') gaps(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Gaps', query); }
  @Get('reports/expiry-overdue') @Permissions('training.reports.view') expiry(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Expiry / Overdue', query); }
  @Get('reports/waivers') @Permissions('training.reports.view') waivers(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Waivers', query); }
  @Get('reports/executive-summary') @Permissions('training.reports.view') executive(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.reportView(user, 'Executive Summary', query); }

  @Get('workforce/:workerId/reports') @Permissions('training.reports.view') workerReports(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: Dto) { return this.reports.workerReports(user, workerId, query); }
  @Post('workforce/:workerId/evidence-package') @Permissions('training.reports.worker_evidence.export') workerEvidencePackage(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) { return this.reports.workerEvidencePackage(user, workerId); }
  @Get('sites/:siteId/training-reports') @Permissions('training.reports.view') siteReports(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string) { return this.reports.scoped(user, 'site', siteId); }
  @Get('units/:unitId/training-reports') @Permissions('training.reports.view') unitReports(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) { return this.reports.scoped(user, 'unit', unitId); }
  @Get('areas/:areaId/training-reports') @Permissions('training.reports.view') areaReports(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string) { return this.reports.scoped(user, 'area', areaId); }

  @Get('reports/history') @Permissions('training.reports.history.view') history(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.history(user, query); }
  @Get('reports/settings') @Permissions('training.reports.settings.view') settings(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.reports.settings(user, query); }
  @Patch('reports/settings') @Permissions('training.reports.settings.edit') updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.reports.updateSettings(user, dto); }
  @Get('reports/lookups') @Permissions('training.reports.view') lookups() { return this.reports.lookups(); }
  @Get('lookups/training-report-types') @Permissions('training.reports.view') reportTypes() { return this.reports.lookups('trainingReportTypes'); }
  @Get('lookups/training-report-formats') @Permissions('training.reports.view') reportFormats() { return this.reports.lookups('trainingReportFormats'); }
  @Get('lookups/training-report-statuses') @Permissions('training.reports.view') reportStatuses() { return this.reports.lookups('trainingReportStatuses'); }
  @Get('lookups/training-export-job-statuses') @Permissions('training.reports.view') jobStatuses() { return this.reports.lookups('trainingExportJobStatuses'); }
  @Get('lookups/training-package-types') @Permissions('training.reports.view') packageTypes() { return this.reports.lookups('trainingPackageTypes'); }
  @Get('lookups/training-confidentiality-levels') @Permissions('training.reports.view') confidentialityLevels() { return this.reports.lookups('trainingConfidentialityLevels'); }
  @Get('lookups/training-scheduled-report-frequencies') @Permissions('training.reports.view') scheduleFrequencies() { return this.reports.lookups('trainingScheduledReportFrequencies'); }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
export class TrainingReportsIntegrationController {
  constructor(private readonly reports: TrainingReportsService) {}
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('moc')
export class MocTrainingEvidencePackageController {
  constructor(private readonly reports: TrainingReportsService) {}
  @Post(':mocId/training-evidence-package') @Permissions('training.reports.moc_evidence.export') create(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string) { return this.reports.mocEvidencePackage(user, mocId); }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('pssr')
export class PssrTrainingEvidencePackageController {
  constructor(private readonly reports: TrainingReportsService) {}
  @Post(':pssrId/training-evidence-package') @Permissions('training.reports.pssr_evidence.export') create(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string) { return this.reports.pssrEvidencePackage(user, pssrId); }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('ptw')
export class PtwTrainingEvidencePackageController {
  constructor(private readonly reports: TrainingReportsService) {}
  @Post('permits/:permitId/training-authorization-evidence') @Permissions('training.reports.ptw_evidence.export') create(@CurrentUser() user: RequestUser, @Param('permitId') permitId: string) { return this.reports.ptwEvidencePackage(user, permitId); }
}
