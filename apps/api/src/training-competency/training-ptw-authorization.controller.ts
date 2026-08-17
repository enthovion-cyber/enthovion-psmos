import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingPtwAuthorizationService } from './training-ptw-authorization.service';

type QueryDto = Record<string, any>;
type BodyDto = Record<string, any>;

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('training-competency')
export class TrainingPtwAuthorizationController {
  constructor(private readonly ptwAuth: TrainingPtwAuthorizationService) {}

  @Get('ptw-role-authorization')
  @Permissions('training.ptw_authorization.view')
  dashboardRoot(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboard(user, query); }

  @Get('ptw-role-authorization/dashboard')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboard(user, query); }

  @Get('ptw-role-authorization/dashboard/summary')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardSummary(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardSummary(user, query); }

  @Get('ptw-role-authorization/dashboard/by-site')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardBySite(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardBySite(user, query); }

  @Get('ptw-role-authorization/dashboard/by-unit')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardByUnit(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardByUnit(user, query); }

  @Get('ptw-role-authorization/dashboard/by-role')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardByRole(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardByRole(user, query); }

  @Get('ptw-role-authorization/dashboard/expiring')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardExpiring(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardExpiringPreview(user, query); }

  @Get('ptw-role-authorization/dashboard/gaps')
  @Permissions('training.ptw_authorization.dashboard.view')
  dashboardGaps(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.dashboardGapsPreview(user, query); }

  @Get('ptw-role-authorization/rules')
  @Permissions('training.ptw_authorization.rule.view')
  rules(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.rules(user, query); }

  @Post('ptw-role-authorization/rules')
  @Permissions('training.ptw_authorization.rule.create')
  createRule(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.createRule(user, dto); }

  @Get('ptw-role-authorization/rules/new/context')
  @Permissions('training.ptw_authorization.rule.create')
  newRuleContext() { return this.ptwAuth.lookups(); }

  @Get('ptw-role-authorization/rules/:ruleId')
  @Permissions('training.ptw_authorization.rule.view')
  ruleDetail(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.ptwAuth.ruleDetail(user, ruleId); }

  @Patch('ptw-role-authorization/rules/:ruleId')
  @Permissions('training.ptw_authorization.rule.edit')
  updateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: BodyDto) { return this.ptwAuth.updateRule(user, ruleId, dto); }

  @Delete('ptw-role-authorization/rules/:ruleId')
  @Permissions('training.ptw_authorization.rule.archive')
  archiveRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: BodyDto) { return this.ptwAuth.archiveRule(user, ruleId, dto); }

  @Post('ptw-role-authorization/rules/:ruleId/reactivate')
  @Permissions('training.ptw_authorization.rule.activate')
  reactivateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.ptwAuth.reactivateRule(user, ruleId); }

  @Post('ptw-role-authorization/rules/:ruleId/activate')
  @Permissions('training.ptw_authorization.rule.activate')
  activateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.ptwAuth.activateRule(user, ruleId); }

  @Get('ptw-role-authorization/rules/:ruleId/eligible-workers')
  @Permissions('training.ptw_authorization.rule.evaluate')
  eligibleWorkers(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Query() query: QueryDto) { return this.ptwAuth.previewEligibleWorkers(user, ruleId, query); }

  @Post('ptw-role-authorization/rules/:ruleId/evaluate-workers')
  @Permissions('training.ptw_authorization.rule.evaluate')
  evaluateRuleWorkers(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: BodyDto) { return this.ptwAuth.evaluateRuleWorkers(user, ruleId, dto); }

  @Post('ptw-role-authorization/rules/:ruleId/generate-requests')
  @Permissions('training.ptw_authorization.rule.generate_requests')
  generateRequests(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: BodyDto) { return this.ptwAuth.generateRequests(user, ruleId, dto); }

  @Get('ptw-role-authorization/authorizations')
  @Permissions('training.ptw_authorization.record.view')
  authorizations(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.authorizations(user, query); }

  @Post('ptw-role-authorization/authorizations')
  @Permissions('training.ptw_authorization.record.create')
  createAuthorization(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.createAuthorization(user, dto); }

  @Get('ptw-role-authorization/authorizations/:authorizationId')
  @Permissions('training.ptw_authorization.record.view')
  authorizationDetail(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string) { return this.ptwAuth.authorizationDetail(user, authorizationId); }

  @Patch('ptw-role-authorization/authorizations/:authorizationId')
  @Permissions('training.ptw_authorization.record.edit')
  updateAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.updateAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/evaluate')
  @Permissions('training.ptw_authorization.record.evaluate')
  evaluateAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.evaluateAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/submit-approval')
  @Permissions('training.ptw_authorization.record.submit_approval')
  submitAuthorizationApproval(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.submitAuthorizationApproval(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/approve')
  @Permissions('training.ptw_authorization.record.approve')
  approveAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.approveAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/reject')
  @Permissions('training.ptw_authorization.record.reject')
  rejectAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.rejectAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/renew')
  @Permissions('training.ptw_authorization.record.renew')
  renewAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.renewAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/suspend')
  @Permissions('training.ptw_authorization.record.suspend')
  suspendAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.suspendAuthorization(user, authorizationId, dto); }

  @Post('ptw-role-authorization/authorizations/:authorizationId/revoke')
  @Permissions('training.ptw_authorization.record.revoke')
  revokeAuthorization(@CurrentUser() user: RequestUser, @Param('authorizationId') authorizationId: string, @Body() dto: BodyDto) { return this.ptwAuth.revokeAuthorization(user, authorizationId, dto); }

  @Get('ptw-role-authorization/requests')
  @Permissions('training.ptw_authorization.request.view')
  requests(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.requests(user, query); }

  @Post('ptw-role-authorization/requests')
  @Permissions('training.ptw_authorization.request.create')
  createRequest(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.createRequest(user, dto); }

  @Get('ptw-role-authorization/requests/:requestId')
  @Permissions('training.ptw_authorization.request.view')
  requestDetail(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string) { return this.ptwAuth.requestDetail(user, requestId); }

  @Patch('ptw-role-authorization/requests/:requestId')
  @Permissions('training.ptw_authorization.request.edit')
  updateRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: BodyDto) { return this.ptwAuth.updateRequest(user, requestId, dto); }

  @Post('ptw-role-authorization/requests/:requestId/submit')
  @Permissions('training.ptw_authorization.request.submit')
  submitRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: BodyDto) { return this.ptwAuth.submitRequest(user, requestId, dto); }

  @Post('ptw-role-authorization/requests/:requestId/approve')
  @Permissions('training.ptw_authorization.request.approve')
  approveRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideRequest(user, requestId, 'approve', dto); }

  @Post('ptw-role-authorization/requests/:requestId/reject')
  @Permissions('training.ptw_authorization.request.reject')
  rejectRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideRequest(user, requestId, 'reject', dto); }

  @Post('ptw-role-authorization/requests/:requestId/return')
  @Permissions('training.ptw_authorization.request.return')
  returnRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideRequest(user, requestId, 'return', dto); }

  @Get('ptw-role-authorization/evaluations')
  @Permissions('training.ptw_authorization.evaluation.view')
  evaluations(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.evaluations(user, query); }

  @Post('ptw-role-authorization/evaluations/run')
  @Permissions('training.ptw_authorization.evaluation.run')
  evaluate(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.evaluate(user, dto); }

  @Post('ptw-role-authorization/evaluations/workers/:workerId')
  @Permissions('training.ptw_authorization.evaluation.run')
  evaluateWorker(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Body() dto: BodyDto) { return this.ptwAuth.evaluateWorker(user, workerId, dto); }

  @Get('ptw-role-authorization/gaps')
  @Permissions('training.ptw_authorization.gap.view')
  gaps(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.gaps(user, query); }

  @Get('ptw-role-authorization/gaps/:gapId')
  @Permissions('training.ptw_authorization.gap.view')
  gapDetail(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) { return this.ptwAuth.gapDetail(user, gapId); }

  @Post('ptw-role-authorization/gaps/:gapId/create-action')
  @Permissions('training.ptw_authorization.gap.close')
  createGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: BodyDto) { return this.ptwAuth.createGapAction(user, gapId, dto); }

  @Post('ptw-role-authorization/gaps/:gapId/resolve')
  @Permissions('training.ptw_authorization.gap.close')
  resolveGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: BodyDto) { return this.ptwAuth.markGapResolved(user, gapId, dto); }

  @Post('ptw-role-authorization/gaps/:gapId/verify')
  @Permissions('training.ptw_authorization.gap.verify')
  verifyGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: BodyDto) { return this.ptwAuth.verifyGap(user, gapId, dto); }

  @Post('ptw-role-authorization/gaps/:gapId/reopen')
  @Permissions('training.ptw_authorization.gap.reopen')
  reopenGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: BodyDto) { return this.ptwAuth.reopenGap(user, gapId, dto); }

  @Get('ptw-role-authorization/waivers')
  @Permissions('training.ptw_authorization.waiver.view')
  waivers(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.waivers(user, query); }

  @Post('ptw-role-authorization/gaps/:gapId/waiver')
  @Permissions('training.ptw_authorization.waiver.request')
  requestWaiver(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: BodyDto) { return this.ptwAuth.requestWaiver(user, gapId, dto); }

  @Post('ptw-role-authorization/waivers/:waiverId/approve')
  @Permissions('training.ptw_authorization.waiver.approve')
  approveWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideWaiver(user, waiverId, 'approve', dto); }

  @Post('ptw-role-authorization/waivers/:waiverId/reject')
  @Permissions('training.ptw_authorization.waiver.reject')
  rejectWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideWaiver(user, waiverId, 'reject', dto); }

  @Post('ptw-role-authorization/waivers/:waiverId/revoke')
  @Permissions('training.ptw_authorization.waiver.revoke')
  revokeWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: BodyDto) { return this.ptwAuth.decideWaiver(user, waiverId, 'revoke', dto); }

  @Get('ptw-role-authorization/expired') @Permissions('training.ptw_authorization.record.view') expired(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.expired(user, query); }
  @Get('ptw-role-authorization/expiring') @Permissions('training.ptw_authorization.record.view') expiring(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.expiring(user, query); }
  @Get('ptw-role-authorization/suspended') @Permissions('training.ptw_authorization.record.view') suspended(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.suspended(user, query); }
  @Get('ptw-role-authorization/pending-approval') @Permissions('training.ptw_authorization.record.view') pendingApproval(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.pendingApproval(user, query); }
  @Get('ptw-role-authorization/blocked-workers') @Permissions('training.ptw_authorization.gap.view') blockedWorkers(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.blockedWorkers(user, query); }
  @Get('ptw-role-authorization/gas-testers') @Permissions('training.ptw_authorization.record.view') gasTesters(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.gasTesters(user, query); }
  @Get('ptw-role-authorization/isolating-authorities') @Permissions('training.ptw_authorization.record.view') isolatingAuthorities(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.isolatingAuthorities(user, query); }
  @Get('ptw-role-authorization/permit-issuers') @Permissions('training.ptw_authorization.record.view') permitIssuers(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.permitIssuers(user, query); }
  @Get('ptw-role-authorization/performing-authorities') @Permissions('training.ptw_authorization.record.view') performingAuthorities(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.performingAuthorities(user, query); }

  @Get('workforce/:workerId/ptw-authorizations') @Permissions('training.ptw_authorization.record.view') workerAuthorizations(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: QueryDto) { return this.ptwAuth.workerAuthorizations(user, workerId, query); }
  @Get('workforce/:workerId/ptw-authorization-gaps') @Permissions('training.ptw_authorization.gap.view') workerGaps(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: QueryDto) { return this.ptwAuth.workerGaps(user, workerId, query); }
  @Get('workforce/:workerId/ptw-authorization-history') @Permissions('training.ptw_authorization.history.view') workerHistory(@CurrentUser() user: RequestUser, @Param('workerId') workerId: string, @Query() query: QueryDto) { return this.ptwAuth.workerHistory(user, workerId, query); }

  @Get('sites/:siteId/ptw-role-authorization') @Permissions('training.ptw_authorization.record.view') siteScope(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: QueryDto) { return this.ptwAuth.scopedSite(user, siteId, query); }
  @Get('units/:unitId/ptw-role-authorization') @Permissions('training.ptw_authorization.record.view') unitScope(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: QueryDto) { return this.ptwAuth.scopedUnit(user, unitId, query); }
  @Get('areas/:areaId/ptw-role-authorization') @Permissions('training.ptw_authorization.record.view') areaScope(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: QueryDto) { return this.ptwAuth.scopedArea(user, areaId, query); }

  @Get('ptw-role-authorization/check-logs') @Permissions('training.ptw_authorization.history.view') checkLogs(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.checkLogs(user, query); }
  @Get('ptw-role-authorization/history') @Permissions('training.ptw_authorization.history.view') history(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.history(user, query); }
  @Get('ptw-role-authorization/import/template') @Permissions('training.ptw_authorization.import') importTemplate() { return this.ptwAuth.importTemplate(); }
  @Post('ptw-role-authorization/import') @Permissions('training.ptw_authorization.import') importRows(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.importRows(user, dto); }
  @Get('ptw-role-authorization/export') @Permissions('training.ptw_authorization.export') exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.exportRows(user, query); }
  @Get('ptw-role-authorization/settings') @Permissions('training.ptw_authorization.settings.view') settings(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.settings(user, query); }
  @Patch('ptw-role-authorization/settings') @Permissions('training.ptw_authorization.settings.edit') updateSettings(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.updateSettings(user, dto); }
  @Get('ptw-role-authorization/lookups') @Permissions('training.ptw_authorization.view') lookups() { return this.ptwAuth.lookups(); }
  @Get('ptw-role-authorization/lookups/:name') @Permissions('training.ptw_authorization.view') lookup(@Param('name') name: string) { return this.ptwAuth.lookup(name); }
}

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('ptw')
export class PtwAuthorizationIntegrationController {
  constructor(private readonly ptwAuth: TrainingPtwAuthorizationService) {}

  @Post('authorization-check')
  @Permissions('training.ptw_authorization.check.run')
  authorizationCheck(@CurrentUser() user: RequestUser, @Body() dto: BodyDto) { return this.ptwAuth.authorizationCheck(user, dto); }

  @Get('workforce/authorized-workers')
  @Permissions('training.ptw_authorization.record.view')
  authorizedWorkers(@CurrentUser() user: RequestUser, @Query() query: QueryDto) { return this.ptwAuth.authorizedWorkers(user, query); }

  @Post('permits/:permitId/authorization-check')
  @Permissions('training.ptw_authorization.check.run')
  permitAuthorizationCheck(@CurrentUser() user: RequestUser, @Param('permitId') permitId: string, @Body() dto: BodyDto) { return this.ptwAuth.permitAuthorizationCheck(user, permitId, dto); }

  @Get('permits/:permitId/role-authorization')
  @Permissions('training.ptw_authorization.history.view')
  permitRoleAuthorization(@CurrentUser() user: RequestUser, @Param('permitId') permitId: string, @Query() query: QueryDto) { return this.ptwAuth.permitRoleAuthorization(user, permitId, query); }

  @Get('permits/:permitId/workforce-authorization')
  @Permissions('training.ptw_authorization.record.view')
  permitWorkforceAuthorization(@CurrentUser() user: RequestUser, @Param('permitId') permitId: string, @Query() query: QueryDto) { return this.ptwAuth.permitWorkforceAuthorization(user, permitId, query); }
}
