import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingFinalIntegrationService } from './training-final-integration.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('training-competency/final-integration')
export class TrainingFinalIntegrationController {
  constructor(private readonly finalIntegration: TrainingFinalIntegrationService) {}

  @Get()
  @Permissions('training.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.dashboard(user, query);
  }

  @Get('dashboard')
  @Permissions('training.dashboard.view')
  dashboardAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.dashboard(user, query);
  }

  @Get('compliance')
  @Permissions('training.dashboard.view')
  compliance(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.complianceSummary(user, query);
  }

  @Get('workers/:workerId/compliance')
  @Permissions('training.workforce.view')
  workerCompliance(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string) {
    return this.finalIntegration.workerCompliance(user, workerId);
  }

  @Get('compliance-snapshots')
  @Permissions('training.dashboard.view')
  snapshots(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.snapshotsList(user, query);
  }

  @Post('compliance-snapshots/recalculate')
  @Permissions('training.settings.edit')
  recalculateSnapshots(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.recalculateSnapshots(user, dto);
  }

  @Get('integration-health')
  @Permissions('training.dashboard.view')
  health(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.healthList(user, query);
  }

  @Post('integration-health/run')
  @Permissions('training.settings.edit')
  runHealth(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.runHealth(user, dto);
  }

  @Get('data-quality')
  @Permissions('training.dashboard.view')
  dataQuality(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.dataQualityList(user, query);
  }

  @Post('data-quality/run')
  @Permissions('training.settings.edit')
  runDataQuality(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.runDataQuality(user, dto);
  }

  @Get('sync-events')
  @Permissions('training.history.view')
  syncEvents(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.syncEvents(user, query);
  }

  @Post('sync-events')
  @Permissions('training.settings.edit')
  recordSync(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.recordSync(user, dto);
  }

  @Post('expiry/recalculate')
  @Permissions('training.settings.edit')
  recalculateExpiry(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.recalculateExpiry(user, dto);
  }

  @Post('gaps/reconcile')
  @Permissions('training.settings.edit')
  reconcileGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.reconcileGaps(user, dto);
  }

  @Post('blockers/reconcile')
  @Permissions('training.settings.edit')
  reconcileBlockers(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.reconcileBlockers(user, dto);
  }

  @Get('permission-audit')
  @Permissions('training.settings.view')
  permissionAudit(@CurrentUser() user: RequestUser) {
    return this.finalIntegration.permissionAudit(user);
  }

  @Get('rls-audit')
  @Permissions('training.settings.view')
  rlsAudit() {
    return this.finalIntegration.rlsAudit();
  }

  @Get('route-health')
  @Permissions('training.dashboard.view')
  routeHealth() {
    return this.finalIntegration.routeHealth();
  }

  @Get('hardening-checks')
  @Permissions('training.settings.view')
  hardeningChecks(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.hardeningChecks(user, query);
  }

  @Post('hardening-checks/run')
  @Permissions('training.settings.edit')
  runHardening(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.runHardening(user, dto);
  }

  @Get('settings')
  @Permissions('training.settings.view')
  settings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.settings(user, query);
  }

  @Patch('settings')
  @Permissions('training.settings.edit')
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.finalIntegration.updateSettings(user, dto);
  }

  @Get('report-summary')
  @Permissions('training.reports.view')
  reportSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.finalReportSummary(user, query);
  }

  @Get('history')
  @Permissions('training.history.view')
  history(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.finalIntegration.finalHistory(user, query);
  }

  @Get('audit')
  @Permissions('training.settings.view')
  audit(@CurrentUser() user: RequestUser) {
    return this.finalIntegration.finalAudit(user);
  }
}
