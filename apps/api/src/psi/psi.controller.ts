import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { PsiChemicalService } from './psi-chemical.service';
import { PsiCompletenessEngineService, completenessStatuses, gapSeverities, gapStatuses, gapTypes, requirementApplicabilityScopes, requirementCategories, runStatuses, waiverStatuses } from './psi-completeness-engine.service';
import { PsiDrawingService } from './psi-drawing.service';
import { PsiElectricalClassificationService } from './psi-electrical-classification.service';
import { PsiEquipmentDesignBasisService } from './psi-equipment-design-basis.service';
import { PsiIntegrationService } from './psi-integration.service';
import { PsiMaterialCompatibilityService, compatibilityBasis, compatibilityDocumentTypes, compatibilityRatings, compatibilityScopes, componentTypes, degradationMechanisms, exposureTypes, materialConflictStatuses, materialFamilies, ratingConfidence } from './psi-material-compatibility.service';
import { PsiProcessChemistryService } from './psi-process-chemistry.service';
import { PsiReliefSystemService } from './psi-relief-system.service';
import { PsiSafeguardService, iplQualificationStatuses, safeguardCategories, safeguardConflictStatuses, safeguardCriticalities, safeguardDocumentTypes, safeguardEffectivenessStatuses, safeguardFunctionTypes, safeguardSourceModules, safeguardTestingStatuses, safeguardTypes } from './psi-safeguard.service';
import { PsiSafeOperatingLimitService } from './psi-safe-operating-limit.service';
import { PsiService } from './psi.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information')
export class PsiController {
  constructor(private readonly psi: PsiService, private readonly chemicals: PsiChemicalService, private readonly completenessEngine: PsiCompletenessEngineService, private readonly processChemistry: PsiProcessChemistryService, private readonly safeLimits: PsiSafeOperatingLimitService, private readonly equipmentDesign: PsiEquipmentDesignBasisService, private readonly reliefSystems: PsiReliefSystemService, private readonly drawings: PsiDrawingService, private readonly electricalClassifications: PsiElectricalClassificationService, private readonly materialCompatibility: PsiMaterialCompatibilityService, private readonly safeguards: PsiSafeguardService, private readonly integrations: PsiIntegrationService) {}

  @Get()
  @Permissions(PermissionKeys.PSIDashboardView)
  dashboardRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.dashboard(user.tenantId, user.id, this.scope(user), query, user.permissions);
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.PSIDashboardView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.dashboard(user.tenantId, user.id, this.scope(user), query, user.permissions);
  }

  @Get('dashboard/summary')
  @Permissions(PermissionKeys.PSIDashboardView)
  dashboardSummary(@CurrentUser() user: RequestUser) {
    return this.psi.summary(user.tenantId, this.scope(user));
  }

  @Get('completeness')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.dashboard(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/dashboard')
  @Permissions(PermissionKeys.PSICompletenessDashboardView)
  completenessDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.dashboard(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/scores')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessScores(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.scores(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/scores/by-unit')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessScoresByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.scores(user.tenantId, this.scope(user), { ...query, scoreScope: 'Unit' });
  }

  @Get('completeness/scores/by-module')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessScoresByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.scores(user.tenantId, this.scope(user), { ...query, scoreScope: 'Module' });
  }

  @Get('completeness/matrix')
  @Permissions(PermissionKeys.PSICompletenessMatrixView)
  completenessMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.matrix(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/gaps')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/critical-gaps')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessCriticalGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, critical: 'true' });
  }

  @Get('completeness/pssr-blockers')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessPssrBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, pssrBlockers: 'true' });
  }

  @Get('completeness/moc-required')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessMocRequired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('completeness/review-overdue')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessReviewOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('completeness/document-gaps')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessDocumentGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, documentGaps: 'true' });
  }

  @Get('completeness/conflicts')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessConflicts(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, conflicts: 'true' });
  }

  @Get('completeness/gaps/:gapId')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  completenessGapDetail(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) {
    return this.completenessEngine.gapDetail(user.tenantId, this.scope(user), gapId);
  }

  @Patch('completeness/gaps/:gapId')
  @Permissions(PermissionKeys.PSICompletenessGapAssign)
  completenessGapPatch(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.updateGap(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/gaps/:gapId/assign')
  @Permissions(PermissionKeys.PSICompletenessGapAssign)
  completenessGapAssign(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.assignGap(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/gaps/:gapId/create-action')
  @Permissions(PermissionKeys.PSICompletenessActionCreate)
  completenessGapCreateAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.createAction(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/gaps/:gapId/mark-resolved')
  @Permissions(PermissionKeys.PSICompletenessGapClose)
  completenessGapResolved(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.markResolved(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/gaps/:gapId/verify')
  @Permissions(PermissionKeys.PSICompletenessGapVerify)
  completenessGapVerify(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.verifyGap(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/gaps/:gapId/reopen')
  @Permissions(PermissionKeys.PSICompletenessGapReopen)
  completenessGapReopen(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.reopenGap(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Get('completeness/requirements')
  @Permissions(PermissionKeys.PSICompletenessRequirementView)
  completenessRequirements(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.requirements(user.tenantId, this.scope(user), query);
  }

  @Post('completeness/requirements')
  @Permissions(PermissionKeys.PSICompletenessRequirementCreate)
  completenessRequirementCreate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.saveRequirement(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('completeness/requirements/:requirementId')
  @Permissions(PermissionKeys.PSICompletenessRequirementView)
  completenessRequirementDetail(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) {
    return this.completenessEngine.requirement(user.tenantId, this.scope(user), requirementId);
  }

  @Patch('completeness/requirements/:requirementId')
  @Permissions(PermissionKeys.PSICompletenessRequirementEdit)
  completenessRequirementUpdate(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.saveRequirement(user.tenantId, user.id, this.scope(user), { ...dto, id: requirementId });
  }

  @Post('completeness/requirements/:requirementId/archive')
  @Permissions(PermissionKeys.PSICompletenessRequirementArchive)
  completenessRequirementArchive(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.archiveRequirement(user.tenantId, user.id, this.scope(user), requirementId, dto);
  }

  @Get('completeness/templates')
  @Permissions(PermissionKeys.PSICompletenessRequirementView)
  completenessTemplates(@CurrentUser() user: RequestUser) {
    return this.completenessEngine.templates(user.tenantId, this.scope(user));
  }

  @Post('completeness/templates/apply')
  @Permissions(PermissionKeys.PSICompletenessRequirementCreate)
  completenessTemplateApply(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.applyTemplates(user.tenantId, user.id, this.scope(user), dto);
  }

  @Post('completeness/run')
  @Permissions(PermissionKeys.PSICompletenessRun)
  completenessRun(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.run(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('completeness/run-history')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessRunHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.runHistory(user.tenantId, this.scope(user), query);
  }

  @Get('completeness/run-history/:runId')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessRunDetail(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.completenessEngine.runDetail(user.tenantId, this.scope(user), runId);
  }

  @Post('completeness/run-history/:runId/retry')
  @Permissions(PermissionKeys.PSICompletenessRun)
  completenessRunRetry(@CurrentUser() user: RequestUser, @Param('runId') runId: string) {
    return this.completenessEngine.retryRun(user.tenantId, user.id, this.scope(user), runId);
  }

  @Post('completeness/run-history/:runId/cancel')
  @Permissions(PermissionKeys.PSICompletenessRun)
  completenessRunCancel(@CurrentUser() user: RequestUser, @Param('runId') runId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.cancelRun(user.tenantId, user.id, this.scope(user), runId, dto);
  }

  @Get('completeness/waivers')
  @Permissions(PermissionKeys.PSICompletenessWaiverView)
  completenessWaivers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.waivers(user.tenantId, this.scope(user), query);
  }

  @Post('completeness/gaps/:gapId/waiver-request')
  @Permissions(PermissionKeys.PSICompletenessWaiverRequest)
  completenessWaiverRequest(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.requestWaiver(user.tenantId, user.id, this.scope(user), gapId, dto);
  }

  @Post('completeness/waivers/request')
  @Permissions(PermissionKeys.PSICompletenessWaiverRequest)
  completenessWaiverRequestFromBody(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.requestWaiver(user.tenantId, user.id, this.scope(user), String(dto.gap_id ?? dto.gapId ?? ''), dto);
  }

  @Post('completeness/waivers/:waiverId/approve')
  @Permissions(PermissionKeys.PSICompletenessWaiverApprove)
  completenessWaiverApprove(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.decideWaiver(user.tenantId, user.id, this.scope(user), waiverId, 'Approved', dto);
  }

  @Post('completeness/waivers/:waiverId/reject')
  @Permissions(PermissionKeys.PSICompletenessWaiverReject)
  completenessWaiverReject(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.decideWaiver(user.tenantId, user.id, this.scope(user), waiverId, 'Rejected', dto);
  }

  @Post('completeness/waivers/:waiverId/revoke')
  @Permissions(PermissionKeys.PSICompletenessWaiverRevoke)
  completenessWaiverRevoke(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() dto: Record<string, any>) {
    return this.completenessEngine.decideWaiver(user.tenantId, user.id, this.scope(user), waiverId, 'Revoked', dto);
  }

  @Get('completeness/settings')
  @Permissions(PermissionKeys.PSICompletenessSettingsView)
  completenessSettings(@CurrentUser() user: RequestUser) {
    return this.completenessEngine.settings(user.tenantId, this.scope(user));
  }

  @Patch('completeness/settings')
  @Permissions(PermissionKeys.PSICompletenessSettingsEdit)
  completenessSettingsUpdate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.updateSettings(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('completeness/export')
  @Permissions(PermissionKeys.PSICompletenessExport)
  completenessExport(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.completenessEngine.export(user.tenantId, user.id, this.scope(user), query);
  }

  @Get('completeness/reports')
  @Permissions(PermissionKeys.PSICompletenessExport)
  completenessReports(@CurrentUser() user: RequestUser) {
    return this.completenessEngine.reports(user.tenantId, this.scope(user));
  }

  @Post('completeness/reports/generate')
  @Permissions(PermissionKeys.PSICompletenessExport)
  completenessReportGenerate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.completenessEngine.generateReport(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('integrations')
  @Permissions('psi.integration.view')
  integrationRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.dashboard(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/dashboard')
  @Permissions('psi.integration.dashboard.view')
  integrationDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.dashboard(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/summary')
  @Permissions('psi.integration.dashboard.view')
  integrationSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.summary(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/impact-register')
  @Permissions('psi.integration.view')
  integrationImpactRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.impactRegister(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/moc')
  @Permissions('psi.integration.moc.view')
  integrationMoc(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.mocOverview(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/pssr')
  @Permissions('psi.integration.pssr.view')
  integrationPssr(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.pssrOverview(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/hazop')
  @Permissions('psi.integration.hazop.view')
  integrationHazop(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.hazopOverview(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/mechanical-integrity')
  @Permissions('psi.integration.mi.view')
  integrationMechanicalIntegrity(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.miOverview(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/blockers')
  @Permissions('psi.integration.view')
  integrationBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.outOfSync(user.tenantId, this.scope(user), { ...query, syncStatus: query.syncStatus ?? 'Needs Review' });
  }

  @Get('integrations/out-of-sync')
  @Permissions('psi.integration.view')
  integrationOutOfSync(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.outOfSync(user.tenantId, this.scope(user), query);
  }

  @Post('integrations/sync-check/run')
  @Permissions('psi.integration.sync.run')
  integrationRunSync(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.integrations.runSyncCheck(user.tenantId, user.id, this.scope(user), dto);
  }

  @Post('integrations/sync-checks/:syncCheckId/resolve')
  @Permissions('psi.integration.sync.resolve')
  integrationResolveSync(@CurrentUser() user: RequestUser, @Param('syncCheckId') syncCheckId: string, @Body() dto: Record<string, any>) {
    return this.integrations.resolveSyncCheck(user.tenantId, user.id, this.scope(user), syncCheckId, dto);
  }

  @Post('integrations/sync-checks/:syncCheckId/create-action')
  @Permissions('psi.integration.action.create')
  integrationCreateSyncAction(@CurrentUser() user: RequestUser, @Param('syncCheckId') syncCheckId: string, @Body() dto: Record<string, any>) {
    return this.integrations.createSyncAction(user.tenantId, user.id, this.scope(user), syncCheckId, dto);
  }

  @Get('integrations/history')
  @Permissions('psi.integration.view')
  integrationHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.history(user.tenantId, this.scope(user), query);
  }

  @Get('integrations/settings')
  @Permissions('psi.integration.settings.view')
  integrationSettings(@CurrentUser() user: RequestUser) {
    return this.integrations.settings(user.tenantId, this.scope(user));
  }

  @Patch('integrations/settings')
  @Permissions('psi.integration.settings.edit')
  integrationSettingsUpdate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.integrations.updateSettings(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('integrations/export')
  @Permissions('psi.integration.export')
  integrationExport(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.integrations.export(user.tenantId, user.id, this.scope(user), query);
  }

  @Get('integrations/:integrationLinkId')
  @Permissions('psi.integration.view')
  integrationDetail(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string) {
    return this.integrations.linkDetail(user.tenantId, this.scope(user), integrationLinkId);
  }

  @Patch('integrations/:integrationLinkId')
  @Permissions('psi.integration.link.edit')
  integrationUpdate(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.updateLink(user.tenantId, user.id, this.scope(user), integrationLinkId, dto);
  }

  @Post('integrations/:integrationLinkId/verify')
  @Permissions('psi.integration.link.verify')
  integrationVerify(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.verifyLink(user.tenantId, user.id, this.scope(user), integrationLinkId, dto);
  }

  @Post('integrations/:integrationLinkId/close')
  @Permissions('psi.integration.link.close')
  integrationClose(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.closeLink(user.tenantId, user.id, this.scope(user), integrationLinkId, dto);
  }

  @Post('integrations/:integrationLinkId/reopen')
  @Permissions('psi.integration.link.edit')
  integrationReopen(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.reopenLink(user.tenantId, user.id, this.scope(user), integrationLinkId, dto);
  }

  @Post('integrations/:integrationLinkId/create-action')
  @Permissions('psi.integration.action.create')
  integrationCreateAction(@CurrentUser() user: RequestUser, @Param('integrationLinkId') integrationLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.createIntegrationAction(user.tenantId, user.id, this.scope(user), integrationLinkId, dto);
  }

  @Get('chemicals')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.registry(user.tenantId, this.scope(user), query);
  }

  @Get('chemicals/summary')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.summary(user.tenantId, this.scope(user), query);
  }

  @Get('chemicals/missing-sds')
  @Permissions(PermissionKeys.PSIChemicalView)
  missingSds(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.registry(user.tenantId, this.scope(user), { ...query, sdsStatus: 'Missing' });
  }

  @Get('chemicals/expired-sds')
  @Permissions(PermissionKeys.PSIChemicalView)
  expiredSds(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.registry(user.tenantId, this.scope(user), { ...query, sdsStatus: 'Expired' });
  }

  @Get('chemicals/high-hazard')
  @Permissions(PermissionKeys.PSIChemicalView)
  highHazard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.registry(user.tenantId, this.scope(user), { ...query, highHazard: 'true' });
  }

  @Get('chemicals/incompatibilities')
  @Permissions(PermissionKeys.PSIChemicalView)
  incompatibilities(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.registry(user.tenantId, this.scope(user), { ...query, compatibilityRisk: query.compatibilityRisk ?? 'High' });
  }

  @Get('chemicals/search-chemical-database')
  @Permissions(PermissionKeys.PSIChemicalView)
  searchChemicalDatabase(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.chemicals.searchChemicalDatabase(user.tenantId, this.scope(user), search);
  }

  @Get('chemicals/search-sds-library')
  @Permissions(PermissionKeys.PSIChemicalView)
  searchSdsLibrary(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.chemicals.searchSdsLibrary(user.tenantId, this.scope(user), search);
  }

  @Get('chemicals/import-template')
  @Permissions(PermissionKeys.PSIChemicalImport)
  chemicalImportTemplate() {
    return this.chemicals.importTemplate();
  }

  @Post('chemicals/import')
  @Permissions(PermissionKeys.PSIChemicalImport)
  importChemicals(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.chemicals.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('chemicals/export')
  @Permissions(PermissionKeys.PSIChemicalExport)
  exportChemicals(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.chemicals.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('chemicals')
  @Permissions(PermissionKeys.PSIChemicalCreate)
  createChemical(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.chemicals.createChemical(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('chemicals/:chemicalId')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalDetail(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId);
  }

  @Patch('chemicals/:chemicalId')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  updateChemical(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.updateChemical(user.tenantId, user.id, this.scope(user), chemicalId, dto, user.permissions);
  }

  @Post('chemicals/:chemicalId/archive')
  @Permissions(PermissionKeys.PSIChemicalArchive)
  archiveChemical(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.archiveChemical(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Post('chemicals/:chemicalId/reactivate')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  reactivateChemical(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.reactivateChemical(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Get('chemicals/:chemicalId/sds')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalSds(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.sdsLinks(user.tenantId, this.scope(user), chemicalId);
  }

  @Post('chemicals/:chemicalId/sds/link')
  @Permissions(PermissionKeys.PSIChemicalLinkSds)
  linkChemicalSds(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.linkSds(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Delete('chemicals/:chemicalId/sds/:sdsLinkId')
  @Permissions(PermissionKeys.PSIChemicalRemoveSds)
  removeChemicalSds(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Param('sdsLinkId') sdsLinkId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.removeSds(user.tenantId, user.id, this.scope(user), chemicalId, sdsLinkId, dto);
  }

  @Post('chemicals/:chemicalId/sds/run-check')
  @Permissions(PermissionKeys.PSIChemicalRunSdsCheck)
  runSdsCheck(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.runSdsCheck(user.tenantId, user.id, this.scope(user), chemicalId);
  }

  @Post('chemicals/:chemicalId/sds/request-waiver')
  @Permissions(PermissionKeys.PSIChemicalWaiveSds)
  requestSdsWaiver(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.requestWaiver(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Post('chemicals/:chemicalId/sds/:sdsLinkId/approve-waiver')
  @Permissions(PermissionKeys.PSIChemicalApproveSdsWaiver)
  approveSdsWaiver(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Param('sdsLinkId') sdsLinkId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.decideWaiver(user.tenantId, user.id, this.scope(user), chemicalId, sdsLinkId, 'Approved', dto);
  }

  @Post('chemicals/:chemicalId/sds/:sdsLinkId/reject-waiver')
  @Permissions(PermissionKeys.PSIChemicalApproveSdsWaiver)
  rejectSdsWaiver(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Param('sdsLinkId') sdsLinkId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.decideWaiver(user.tenantId, user.id, this.scope(user), chemicalId, sdsLinkId, 'Rejected', dto);
  }

  @Get('chemicals/:chemicalId/hazards')
  @Permissions(PermissionKeys.PSIChemicalView)
  getHazards(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId).then((detail) => detail.hazards);
  }

  @Patch('chemicals/:chemicalId/hazards')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  updateHazards(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.patchSection(user.tenantId, user.id, this.scope(user), chemicalId, 'hazards', dto);
  }

  @Get('chemicals/:chemicalId/exposure-health')
  @Permissions(PermissionKeys.PSIChemicalView)
  getExposureHealth(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId).then((detail) => detail.exposureHealth);
  }

  @Patch('chemicals/:chemicalId/exposure-health')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  updateExposureHealth(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.patchSection(user.tenantId, user.id, this.scope(user), chemicalId, 'exposure', dto);
  }

  @Get('chemicals/:chemicalId/storage-compatibility')
  @Permissions(PermissionKeys.PSIChemicalView)
  getStorageCompatibility(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId).then((detail) => detail.storageCompatibility);
  }

  @Patch('chemicals/:chemicalId/storage-compatibility')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  updateStorageCompatibility(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.patchSection(user.tenantId, user.id, this.scope(user), chemicalId, 'storage', dto);
  }

  @Get('chemicals/:chemicalId/emergency-controls')
  @Permissions(PermissionKeys.PSIChemicalView)
  getEmergencyControls(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId).then((detail) => detail.emergencyControls);
  }

  @Patch('chemicals/:chemicalId/emergency-controls')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  updateEmergencyControls(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.patchSection(user.tenantId, user.id, this.scope(user), chemicalId, 'emergency', dto);
  }

  @Post('chemicals/:chemicalId/compatibility/run-check')
  @Permissions(PermissionKeys.PSIChemicalRunCompatibilityCheck)
  runCompatibilityCheck(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.runCompatibilityCheck(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Get('chemicals/:chemicalId/compatibility')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalCompatibility(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string) {
    return this.chemicals.detail(user.tenantId, this.scope(user), chemicalId).then((detail) => ({
      storageCompatibility: detail.storageCompatibility,
      compatibilityChecks: detail.compatibilityChecks
    }));
  }

  @Post('chemicals/:chemicalId/sync-from-chemical-database')
  @Permissions(PermissionKeys.PSIChemicalEdit)
  syncFromChemicalDatabase(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.syncFromChemicalDatabase(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Post('chemicals/:chemicalId/sync-from-sds')
  @Permissions(PermissionKeys.PSIChemicalLinkSds)
  syncFromSds(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.syncFromSds(user.tenantId, user.id, this.scope(user), chemicalId, dto);
  }

  @Get('process-chemistry')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.registry(user.tenantId, this.scope(user), query);
  }

  @Get('process-chemistry/summary')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistrySummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.summary(user.tenantId, this.scope(user), query);
  }

  @Get('process-chemistry/runaway-hazards')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  runawayHazards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.registry(user.tenantId, this.scope(user), { ...query, runawayPotential: query.runawayPotential ?? 'High' });
  }

  @Get('process-chemistry/unwanted-reactions')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  unwantedReactions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.registry(user.tenantId, this.scope(user), { ...query, missingData: query.missingData ?? undefined });
  }

  @Get('process-chemistry/missing-data')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  missingProcessChemistryData(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.registry(user.tenantId, this.scope(user), { ...query, missingData: 'true' });
  }

  @Get('process-chemistry/import-template')
  @Permissions(PermissionKeys.PSIProcessChemistryImport)
  processChemistryImportTemplate() {
    return this.processChemistry.importTemplate();
  }

  @Post('process-chemistry/import')
  @Permissions(PermissionKeys.PSIProcessChemistryImport)
  importProcessChemistry(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.processChemistry.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('process-chemistry/export')
  @Permissions(PermissionKeys.PSIProcessChemistryExport)
  exportProcessChemistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.processChemistry.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('process-chemistry')
  @Permissions(PermissionKeys.PSIProcessChemistryCreate)
  createProcessChemistry(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.processChemistry.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('process-chemistry/:chemistryId')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryDetail(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.detail(user.tenantId, this.scope(user), chemistryId);
  }

  @Patch('process-chemistry/:chemistryId')
  @Permissions(PermissionKeys.PSIProcessChemistryEdit)
  updateProcessChemistry(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.update(user.tenantId, user.id, this.scope(user), chemistryId, dto, user.permissions);
  }

  @Post('process-chemistry/:chemistryId/archive')
  @Permissions(PermissionKeys.PSIProcessChemistryArchive)
  archiveProcessChemistry(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.archive(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Post('process-chemistry/:chemistryId/reactivate')
  @Permissions(PermissionKeys.PSIProcessChemistryEdit)
  reactivateProcessChemistry(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.reactivate(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Get('process-chemistry/:chemistryId/chemicals')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryRoles(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.roles(user.tenantId, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/chemicals')
  @Permissions(PermissionKeys.PSIProcessChemistryLinkChemical)
  addProcessChemistryRole(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.addRole(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Patch('process-chemistry/:chemistryId/chemicals/:roleId')
  @Permissions(PermissionKeys.PSIProcessChemistryLinkChemical)
  updateProcessChemistryRole(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('roleId') roleId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.updateRole(user.tenantId, user.id, this.scope(user), chemistryId, roleId, dto);
  }

  @Delete('process-chemistry/:chemistryId/chemicals/:roleId')
  @Permissions(PermissionKeys.PSIProcessChemistryRemoveChemical)
  removeProcessChemistryRole(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('roleId') roleId: string) {
    return this.processChemistry.removeRole(user.tenantId, user.id, this.scope(user), chemistryId, roleId);
  }

  @Get('process-chemistry/:chemistryId/conditions')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryConditions(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.detail(user.tenantId, this.scope(user), chemistryId).then((detail) => detail.conditions);
  }

  @Patch('process-chemistry/:chemistryId/conditions')
  @Permissions(PermissionKeys.PSIProcessChemistryManageConditions)
  updateProcessChemistryConditions(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.patchSection(user.tenantId, user.id, this.scope(user), chemistryId, 'conditions', dto);
  }

  @Get('process-chemistry/:chemistryId/hazards')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryHazards(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.detail(user.tenantId, this.scope(user), chemistryId).then((detail) => detail.hazards);
  }

  @Patch('process-chemistry/:chemistryId/hazards')
  @Permissions(PermissionKeys.PSIProcessChemistryManageHazards)
  updateProcessChemistryHazards(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.patchSection(user.tenantId, user.id, this.scope(user), chemistryId, 'hazards', dto);
  }

  @Get('process-chemistry/:chemistryId/scenarios')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryScenarios(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.scenarios(user.tenantId, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/scenarios')
  @Permissions(PermissionKeys.PSIProcessChemistryManageScenarios)
  createProcessChemistryScenario(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.saveScenario(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Patch('process-chemistry/:chemistryId/scenarios/:scenarioId')
  @Permissions(PermissionKeys.PSIProcessChemistryManageScenarios)
  updateProcessChemistryScenario(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('scenarioId') scenarioId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.saveScenario(user.tenantId, user.id, this.scope(user), chemistryId, dto, scenarioId);
  }

  @Delete('process-chemistry/:chemistryId/scenarios/:scenarioId')
  @Permissions(PermissionKeys.PSIProcessChemistryManageScenarios)
  removeProcessChemistryScenario(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('scenarioId') scenarioId: string) {
    return this.processChemistry.removeScenario(user.tenantId, user.id, this.scope(user), chemistryId, scenarioId);
  }

  @Get('process-chemistry/:chemistryId/controls')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryControls(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.controls(user.tenantId, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/controls')
  @Permissions(PermissionKeys.PSIProcessChemistryManageControls)
  createProcessChemistryControl(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.saveControl(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Patch('process-chemistry/:chemistryId/controls/:controlId')
  @Permissions(PermissionKeys.PSIProcessChemistryManageControls)
  updateProcessChemistryControl(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('controlId') controlId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.saveControl(user.tenantId, user.id, this.scope(user), chemistryId, dto, controlId);
  }

  @Delete('process-chemistry/:chemistryId/controls/:controlId')
  @Permissions(PermissionKeys.PSIProcessChemistryManageControls)
  removeProcessChemistryControl(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('controlId') controlId: string) {
    return this.processChemistry.removeControl(user.tenantId, user.id, this.scope(user), chemistryId, controlId);
  }

  @Get('process-chemistry/:chemistryId/completeness')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  processChemistryCompleteness(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.completeness(user.tenantId, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/completeness/run')
  @Permissions(PermissionKeys.PSIProcessChemistryRunCompletenessCheck)
  runProcessChemistryCompleteness(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.runCompleteness(user.tenantId, user.id, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/submit-review')
  @Permissions(PermissionKeys.PSIProcessChemistrySubmitReview)
  submitProcessChemistryReview(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.submitReview(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Get('process-chemistry/:chemistryId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  processChemistryHistory(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.history(user.tenantId, this.scope(user), chemistryId);
  }

  @Get('process-chemistry/:chemistryId/documents')
  @Permissions(PermissionKeys.PSIDocumentView)
  processChemistryDocuments(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string) {
    return this.processChemistry.documents(user.tenantId, this.scope(user), chemistryId);
  }

  @Post('process-chemistry/:chemistryId/documents')
  @Permissions(PermissionKeys.PSIDocumentLink)
  linkProcessChemistryDocument(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.linkDocument(user.tenantId, user.id, this.scope(user), chemistryId, dto);
  }

  @Delete('process-chemistry/:chemistryId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIDocumentRemove)
  unlinkProcessChemistryDocument(@CurrentUser() user: RequestUser, @Param('chemistryId') chemistryId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.unlinkDocument(user.tenantId, user.id, this.scope(user), chemistryId, documentLinkId, dto);
  }

  @Get('safe-operating-limits')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), query);
  }

  @Get('safe-operating-limits/summary')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.summary(user.tenantId, this.scope(user), query);
  }

  @Get('safe-operating-limits/critical')
  @Permissions(PermissionKeys.PSISafeLimitView)
  criticalSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), { ...query, critical: 'true' });
  }

  @Get('safe-operating-limits/missing')
  @Permissions(PermissionKeys.PSISafeLimitView)
  missingSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('safe-operating-limits/review-overdue')
  @Permissions(PermissionKeys.PSISafeLimitView)
  reviewOverdueSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('safe-operating-limits/moc-required')
  @Permissions(PermissionKeys.PSISafeLimitView)
  mocRequiredSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('safe-operating-limits/conflicts')
  @Permissions(PermissionKeys.PSISafeLimitView)
  conflictingSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.registry(user.tenantId, this.scope(user), { ...query, conflicts: 'true' });
  }

  @Get('safe-operating-limits/import-template')
  @Permissions(PermissionKeys.PSISafeLimitImport)
  safeOperatingLimitImportTemplate() {
    return this.safeLimits.importTemplate();
  }

  @Post('safe-operating-limits/import')
  @Permissions(PermissionKeys.PSISafeLimitImport)
  importSafeOperatingLimits(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.safeLimits.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('safe-operating-limits/export')
  @Permissions(PermissionKeys.PSISafeLimitExport)
  exportSafeOperatingLimits(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeLimits.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('safe-operating-limits')
  @Permissions(PermissionKeys.PSISafeLimitCreate)
  createSafeOperatingLimit(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.safeLimits.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('safe-operating-limits/:limitId')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitDetail(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.detail(user.tenantId, this.scope(user), limitId);
  }

  @Patch('safe-operating-limits/:limitId')
  @Permissions(PermissionKeys.PSISafeLimitEdit)
  updateSafeOperatingLimit(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.update(user.tenantId, user.id, this.scope(user), limitId, dto, user.permissions);
  }

  @Post('safe-operating-limits/:limitId/archive')
  @Permissions(PermissionKeys.PSISafeLimitArchive)
  archiveSafeOperatingLimit(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.archive(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Post('safe-operating-limits/:limitId/reactivate')
  @Permissions(PermissionKeys.PSISafeLimitEdit)
  reactivateSafeOperatingLimit(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.reactivate(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Post('safe-operating-limits/:limitId/clone')
  @Permissions(PermissionKeys.PSISafeLimitCreate)
  cloneSafeOperatingLimit(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.clone(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Get('safe-operating-limits/:limitId/values')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitValues(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.values(user.tenantId, this.scope(user), limitId);
  }

  @Patch('safe-operating-limits/:limitId/values')
  @Permissions(PermissionKeys.PSISafeLimitManageValues)
  updateSafeOperatingLimitValues(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.upsertValues(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Get('safe-operating-limits/:limitId/consequences')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitConsequences(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.consequences(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/consequences')
  @Permissions(PermissionKeys.PSISafeLimitManageConsequences)
  createSafeOperatingLimitConsequence(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveConsequence(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Patch('safe-operating-limits/:limitId/consequences/:consequenceId')
  @Permissions(PermissionKeys.PSISafeLimitManageConsequences)
  updateSafeOperatingLimitConsequence(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('consequenceId') consequenceId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveConsequence(user.tenantId, user.id, this.scope(user), limitId, dto, consequenceId);
  }

  @Delete('safe-operating-limits/:limitId/consequences/:consequenceId')
  @Permissions(PermissionKeys.PSISafeLimitManageConsequences)
  removeSafeOperatingLimitConsequence(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('consequenceId') consequenceId: string) {
    return this.safeLimits.removeConsequence(user.tenantId, user.id, this.scope(user), limitId, consequenceId);
  }

  @Get('safe-operating-limits/:limitId/operator-responses')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitOperatorResponses(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.operatorResponses(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/operator-responses')
  @Permissions(PermissionKeys.PSISafeLimitManageOperatorResponse)
  createSafeOperatingLimitOperatorResponse(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveOperatorResponse(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Patch('safe-operating-limits/:limitId/operator-responses/:responseId')
  @Permissions(PermissionKeys.PSISafeLimitManageOperatorResponse)
  updateSafeOperatingLimitOperatorResponse(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('responseId') responseId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveOperatorResponse(user.tenantId, user.id, this.scope(user), limitId, dto, responseId);
  }

  @Delete('safe-operating-limits/:limitId/operator-responses/:responseId')
  @Permissions(PermissionKeys.PSISafeLimitManageOperatorResponse)
  removeSafeOperatingLimitOperatorResponse(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('responseId') responseId: string) {
    return this.safeLimits.removeOperatorResponse(user.tenantId, user.id, this.scope(user), limitId, responseId);
  }

  @Get('safe-operating-limits/:limitId/controls')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitControls(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.controls(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/controls')
  @Permissions(PermissionKeys.PSISafeLimitManageSafeguards)
  createSafeOperatingLimitControl(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveControl(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Patch('safe-operating-limits/:limitId/controls/:controlId')
  @Permissions(PermissionKeys.PSISafeLimitManageSafeguards)
  updateSafeOperatingLimitControl(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('controlId') controlId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.saveControl(user.tenantId, user.id, this.scope(user), limitId, dto, controlId);
  }

  @Delete('safe-operating-limits/:limitId/controls/:controlId')
  @Permissions(PermissionKeys.PSISafeLimitManageSafeguards)
  removeSafeOperatingLimitControl(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('controlId') controlId: string) {
    return this.safeLimits.removeControl(user.tenantId, user.id, this.scope(user), limitId, controlId);
  }

  @Get('safe-operating-limits/:limitId/completeness')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitCompleteness(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.completeness(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/completeness/run')
  @Permissions(PermissionKeys.PSISafeLimitRunCompletenessCheck)
  runSafeOperatingLimitCompleteness(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.runCompleteness(user.tenantId, user.id, this.scope(user), limitId);
  }

  @Get('safe-operating-limits/:limitId/conflicts')
  @Permissions(PermissionKeys.PSISafeLimitView)
  safeOperatingLimitConflicts(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.conflicts(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/conflict-check/run')
  @Permissions(PermissionKeys.PSISafeLimitRunConflictCheck)
  runSafeOperatingLimitConflictCheck(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.runConflictCheck(user.tenantId, user.id, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSISafeLimitOverrideConflict)
  overrideSafeOperatingLimitConflict(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.overrideConflict(user.tenantId, user.id, this.scope(user), limitId, conflictId, dto);
  }

  @Get('safe-operating-limits/:limitId/documents')
  @Permissions(PermissionKeys.PSIDocumentView)
  safeOperatingLimitDocuments(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.documents(user.tenantId, this.scope(user), limitId);
  }

  @Post('safe-operating-limits/:limitId/documents/link')
  @Permissions(PermissionKeys.PSISafeLimitLinkDocument)
  linkSafeOperatingLimitDocument(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.linkDocument(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Delete('safe-operating-limits/:limitId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSISafeLimitRemoveDocument)
  unlinkSafeOperatingLimitDocument(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.unlinkDocument(user.tenantId, user.id, this.scope(user), limitId, documentLinkId, dto);
  }

  @Post('safe-operating-limits/:limitId/submit-review')
  @Permissions(PermissionKeys.PSISafeLimitSubmitReview)
  submitSafeOperatingLimitReview(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.submitReview(user.tenantId, user.id, this.scope(user), limitId, dto);
  }

  @Get('safe-operating-limits/:limitId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  safeOperatingLimitHistory(@CurrentUser() user: RequestUser, @Param('limitId') limitId: string) {
    return this.safeLimits.history(user.tenantId, this.scope(user), limitId);
  }

  @Get('equipment-design')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.registry(user.tenantId, this.scope(user), query);
  }

  @Get('equipment-design/summary')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.summary(user.tenantId, this.scope(user), query);
  }

  @Get('equipment-design/missing')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  missingEquipmentDesign(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('equipment-design/conflicts')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  conflictingEquipmentDesign(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.registry(user.tenantId, this.scope(user), { ...query, conflicts: 'true' });
  }

  @Get('equipment-design/review-overdue')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  reviewOverdueEquipmentDesign(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('equipment-design/moc-required')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  mocRequiredEquipmentDesign(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('equipment-design/import-template')
  @Permissions(PermissionKeys.PSIEquipmentDesignImport)
  equipmentDesignImportTemplate() {
    return this.equipmentDesign.importTemplate();
  }

  @Post('equipment-design/import')
  @Permissions(PermissionKeys.PSIEquipmentDesignImport)
  importEquipmentDesign(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('equipment-design/export')
  @Permissions(PermissionKeys.PSIEquipmentDesignExport)
  exportEquipmentDesign(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.equipmentDesign.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('equipment-design')
  @Permissions(PermissionKeys.PSIEquipmentDesignCreate)
  createEquipmentDesign(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('equipment-design/:designBasisId')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignDetail(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.detail(user.tenantId, this.scope(user), designBasisId);
  }

  @Patch('equipment-design/:designBasisId')
  @Permissions(PermissionKeys.PSIEquipmentDesignEdit)
  updateEquipmentDesign(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.update(user.tenantId, user.id, this.scope(user), designBasisId, dto, user.permissions);
  }

  @Post('equipment-design/:designBasisId/archive')
  @Permissions(PermissionKeys.PSIEquipmentDesignArchive)
  archiveEquipmentDesign(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.archive(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Post('equipment-design/:designBasisId/reactivate')
  @Permissions(PermissionKeys.PSIEquipmentDesignEdit)
  reactivateEquipmentDesign(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.reactivate(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Post('equipment-design/:designBasisId/clone')
  @Permissions(PermissionKeys.PSIEquipmentDesignCreate)
  cloneEquipmentDesign(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.clone(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Get('equipment-design/:designBasisId/ratings')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignRatings(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'ratings');
  }

  @Patch('equipment-design/:designBasisId/ratings')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageRatings)
  updateEquipmentDesignRatings(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'ratings', dto);
  }

  @Get('equipment-design/:designBasisId/service-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentServiceBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'service-basis');
  }

  @Patch('equipment-design/:designBasisId/service-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageServiceBasis)
  updateEquipmentServiceBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'service-basis', dto);
  }

  @Get('equipment-design/:designBasisId/material-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentMaterialBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'material-basis');
  }

  @Patch('equipment-design/:designBasisId/material-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageMaterialBasis)
  updateEquipmentMaterialBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'material-basis', dto);
  }

  @Get('equipment-design/:designBasisId/capacity-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentCapacityBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'capacity-basis');
  }

  @Patch('equipment-design/:designBasisId/capacity-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageCapacityBasis)
  updateEquipmentCapacityBasis(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'capacity-basis', dto);
  }

  @Get('equipment-design/:designBasisId/codes')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignCodes(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'codes');
  }

  @Patch('equipment-design/:designBasisId/codes')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageCodes)
  updateEquipmentDesignCodes(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'codes', dto);
  }

  @Get('equipment-design/:designBasisId/assumptions')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignAssumptions(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.section(user.tenantId, this.scope(user), designBasisId, 'assumptions');
  }

  @Patch('equipment-design/:designBasisId/assumptions')
  @Permissions(PermissionKeys.PSIEquipmentDesignManageAssumptions)
  updateEquipmentDesignAssumptions(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.upsertSection(user.tenantId, user.id, this.scope(user), designBasisId, 'assumptions', dto);
  }

  @Get('equipment-design/:designBasisId/completeness')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignCompleteness(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.completeness(user.tenantId, this.scope(user), designBasisId);
  }

  @Post('equipment-design/:designBasisId/completeness/run')
  @Permissions(PermissionKeys.PSIEquipmentDesignRunCompletenessCheck)
  runEquipmentDesignCompleteness(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.runCompleteness(user.tenantId, user.id, this.scope(user), designBasisId);
  }

  @Get('equipment-design/:designBasisId/conflicts')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignConflicts(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.conflicts(user.tenantId, this.scope(user), designBasisId);
  }

  @Post('equipment-design/:designBasisId/conflict-check/run')
  @Permissions(PermissionKeys.PSIEquipmentDesignRunConflictCheck)
  runEquipmentDesignConflictCheck(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.runConflictCheck(user.tenantId, user.id, this.scope(user), designBasisId);
  }

  @Post('equipment-design/:designBasisId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSIEquipmentDesignOverrideConflict)
  overrideEquipmentDesignConflict(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.overrideConflict(user.tenantId, user.id, this.scope(user), designBasisId, conflictId, dto);
  }

  @Get('equipment-design/:designBasisId/sync/mi-diff')
  @Permissions(PermissionKeys.PSIEquipmentDesignSyncMi)
  equipmentDesignMiDiff(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.miDiff(user.tenantId, this.scope(user), designBasisId);
  }

  @Post('equipment-design/:designBasisId/sync/from-mi')
  @Permissions(PermissionKeys.PSIEquipmentDesignSyncMi)
  syncEquipmentDesignFromMi(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.syncFromMi(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Post('equipment-design/:designBasisId/sync/to-mi')
  @Permissions(PermissionKeys.PSIEquipmentDesignSyncMi)
  syncEquipmentDesignToMi(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.syncToMi(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Post('equipment-design/:designBasisId/sync/compare-only')
  @Permissions(PermissionKeys.PSIEquipmentDesignSyncMi)
  compareEquipmentDesignOnly(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.compareOnly(user.tenantId, user.id, this.scope(user), designBasisId);
  }

  @Get('equipment-design/:designBasisId/documents')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignDocuments(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.documents(user.tenantId, this.scope(user), designBasisId);
  }

  @Post('equipment-design/:designBasisId/documents/link')
  @Permissions(PermissionKeys.PSIEquipmentDesignLinkDocument)
  linkEquipmentDesignDocument(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.linkDocument(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Delete('equipment-design/:designBasisId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIEquipmentDesignRemoveDocument)
  unlinkEquipmentDesignDocument(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.unlinkDocument(user.tenantId, user.id, this.scope(user), designBasisId, documentLinkId, dto);
  }

  @Post('equipment-design/:designBasisId/submit-review')
  @Permissions(PermissionKeys.PSIEquipmentDesignSubmitReview)
  submitEquipmentDesignReview(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.submitReview(user.tenantId, user.id, this.scope(user), designBasisId, dto);
  }

  @Get('equipment-design/:designBasisId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  equipmentDesignHistory(@CurrentUser() user: RequestUser, @Param('designBasisId') designBasisId: string) {
    return this.equipmentDesign.history(user.tenantId, this.scope(user), designBasisId);
  }

  @Get('relief-systems')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), query);
  }

  @Get('relief-systems/summary')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.summary(user.tenantId, this.scope(user), query);
  }

  @Get('relief-systems/missing')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemMissingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('relief-systems/conflicts')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemConflictRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, conflictStatus: query.conflictStatus ?? 'Critical Conflict' });
  }

  @Get('relief-systems/governing-cases')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemGoverningCaseRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, governingCases: 'true' });
  }

  @Get('relief-systems/review-overdue')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemReviewOverdueRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('relief-systems/moc-required')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemMocRequiredRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('relief-systems/pssr-blockers')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemPssrBlockerRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.registry(user.tenantId, this.scope(user), { ...query, pssrBlocker: 'true' });
  }

  @Get('relief-systems/import-template')
  @Permissions(PermissionKeys.PSIReliefSystemImport)
  reliefSystemImportTemplate() {
    return this.reliefSystems.importTemplate();
  }

  @Post('relief-systems/import')
  @Permissions(PermissionKeys.PSIReliefSystemImport)
  importReliefSystems(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reliefSystems.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('relief-systems/export')
  @Permissions(PermissionKeys.PSIReliefSystemExport)
  exportReliefSystems(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.reliefSystems.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('relief-systems')
  @Permissions(PermissionKeys.PSIReliefSystemCreate)
  createReliefSystem(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.reliefSystems.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('relief-systems/:reliefBasisId')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemDetail(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.detail(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Patch('relief-systems/:reliefBasisId')
  @Permissions(PermissionKeys.PSIReliefSystemEdit)
  updateReliefSystem(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.update(user.tenantId, user.id, this.scope(user), reliefBasisId, dto, user.permissions);
  }

  @Post('relief-systems/:reliefBasisId/archive')
  @Permissions(PermissionKeys.PSIReliefSystemArchive)
  archiveReliefSystem(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.archive(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Post('relief-systems/:reliefBasisId/reactivate')
  @Permissions(PermissionKeys.PSIReliefSystemEdit)
  reactivateReliefSystem(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.reactivate(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Post('relief-systems/:reliefBasisId/clone')
  @Permissions(PermissionKeys.PSIReliefSystemCreate)
  cloneReliefSystem(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.clone(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/protected-equipment')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefProtectedEquipment(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.protectedEquipment(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Patch('relief-systems/:reliefBasisId/protected-equipment')
  @Permissions(PermissionKeys.PSIReliefSystemManageProtectedEquipment)
  updateReliefProtectedEquipment(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.upsertProtectedEquipment(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/devices')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDevices(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.devices(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/devices/link')
  @Permissions(PermissionKeys.PSIReliefSystemLinkDevice)
  linkReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.linkDevice(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Patch('relief-systems/:reliefBasisId/devices/:deviceLinkId')
  @Permissions(PermissionKeys.PSIReliefSystemLinkDevice)
  updateReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('deviceLinkId') deviceLinkId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.updateDevice(user.tenantId, user.id, this.scope(user), reliefBasisId, deviceLinkId, dto);
  }

  @Delete('relief-systems/:reliefBasisId/devices/:deviceLinkId')
  @Permissions(PermissionKeys.PSIReliefSystemRemoveDevice)
  removeReliefDevice(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('deviceLinkId') deviceLinkId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.removeDevice(user.tenantId, user.id, this.scope(user), reliefBasisId, deviceLinkId, dto);
  }

  @Get('relief-systems/:reliefBasisId/scenarios')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefScenarios(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.scenarios(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/scenarios')
  @Permissions(PermissionKeys.PSIReliefSystemManageScenarios)
  createReliefScenario(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.createScenario(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/scenarios/:scenarioId')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefScenario(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('scenarioId') scenarioId: string) {
    return this.reliefSystems.scenario(user.tenantId, this.scope(user), reliefBasisId, scenarioId);
  }

  @Patch('relief-systems/:reliefBasisId/scenarios/:scenarioId')
  @Permissions(PermissionKeys.PSIReliefSystemManageScenarios)
  updateReliefScenario(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('scenarioId') scenarioId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.updateScenario(user.tenantId, user.id, this.scope(user), reliefBasisId, scenarioId, dto);
  }

  @Delete('relief-systems/:reliefBasisId/scenarios/:scenarioId')
  @Permissions(PermissionKeys.PSIReliefSystemManageScenarios)
  deleteReliefScenario(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('scenarioId') scenarioId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.deleteScenario(user.tenantId, user.id, this.scope(user), reliefBasisId, scenarioId, dto);
  }

  @Post('relief-systems/:reliefBasisId/scenarios/:scenarioId/mark-governing')
  @Permissions(PermissionKeys.PSIReliefSystemManageScenarios)
  markReliefGoverning(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('scenarioId') scenarioId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.markGoverning(user.tenantId, user.id, this.scope(user), reliefBasisId, scenarioId, dto);
  }

  @Get('relief-systems/:reliefBasisId/sizing-basis')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSizing(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.sizing(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Patch('relief-systems/:reliefBasisId/sizing-basis')
  @Permissions(PermissionKeys.PSIReliefSystemManageSizingBasis)
  updateReliefSizing(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.upsertSizing(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/discharge-destination')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDischarge(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.discharge(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Patch('relief-systems/:reliefBasisId/discharge-destination')
  @Permissions(PermissionKeys.PSIReliefSystemManageDischargeDestination)
  updateReliefDischarge(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.upsertDischarge(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/completeness')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefCompleteness(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.completeness(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/completeness/run')
  @Permissions(PermissionKeys.PSIReliefSystemRunCompletenessCheck)
  runReliefCompleteness(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.runCompleteness(user.tenantId, user.id, this.scope(user), reliefBasisId);
  }

  @Get('relief-systems/:reliefBasisId/conflicts')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefConflicts(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.conflicts(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/conflict-check/run')
  @Permissions(PermissionKeys.PSIReliefSystemRunConflictCheck)
  runReliefConflictCheck(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.runConflictCheck(user.tenantId, user.id, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSIReliefSystemOverrideConflict)
  overrideReliefConflict(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.overrideConflict(user.tenantId, user.id, this.scope(user), reliefBasisId, conflictId, dto);
  }

  @Get('relief-systems/:reliefBasisId/sync/mi-diff')
  @Permissions(PermissionKeys.PSIReliefSystemSyncMi)
  reliefMiDiff(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.miDiff(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/sync/from-mi')
  @Post('relief-systems/:reliefBasisId/sync/compare-only')
  @Permissions(PermissionKeys.PSIReliefSystemSyncMi)
  reliefSyncFromMi(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.syncFromMi(user.tenantId, user.id, this.scope(user), reliefBasisId, dto ?? { apply: false });
  }

  @Post('relief-systems/:reliefBasisId/sync/to-mi')
  @Permissions(PermissionKeys.PSIReliefSystemSyncMi)
  reliefSyncToMi(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.syncToMi(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/documents')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDocuments(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.documents(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Post('relief-systems/:reliefBasisId/documents/link')
  @Permissions(PermissionKeys.PSIReliefSystemLinkDocument)
  linkReliefDocument(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.linkDocument(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Delete('relief-systems/:reliefBasisId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIReliefSystemRemoveDocument)
  unlinkReliefDocument(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.unlinkDocument(user.tenantId, user.id, this.scope(user), reliefBasisId, documentLinkId, dto);
  }

  @Post('relief-systems/:reliefBasisId/submit-review')
  @Permissions(PermissionKeys.PSIReliefSystemSubmitReview)
  submitReliefReview(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.submitReview(user.tenantId, user.id, this.scope(user), reliefBasisId, dto);
  }

  @Get('relief-systems/:reliefBasisId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  reliefHistory(@CurrentUser() user: RequestUser, @Param('reliefBasisId') reliefBasisId: string) {
    return this.reliefSystems.history(user.tenantId, this.scope(user), reliefBasisId);
  }

  @Get('drawings')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), query);
  }

  @Get('drawings/summary')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.summary(user.tenantId, this.scope(user), query);
  }

  @Get('drawings/pids')
  @Permissions(PermissionKeys.PSIDrawingView)
  pidRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, pids: 'true' });
  }

  @Get('drawings/pfds')
  @Permissions(PermissionKeys.PSIDrawingView)
  pfdRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, pfds: 'true' });
  }

  @Get('drawings/missing')
  @Permissions(PermissionKeys.PSIDrawingView)
  missingDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('drawings/superseded')
  @Permissions(PermissionKeys.PSIDrawingView)
  supersededDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, superseded: 'true' });
  }

  @Get('drawings/pending-approval')
  @Permissions(PermissionKeys.PSIDrawingView)
  pendingApprovalDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, pendingApproval: 'true' });
  }

  @Get('drawings/redlines')
  @Permissions(PermissionKeys.PSIDrawingView)
  redlineDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, redlines: 'true' });
  }

  @Get('drawings/as-built-verification')
  @Permissions(PermissionKeys.PSIDrawingView)
  asBuiltDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, asBuiltRequired: 'true' });
  }

  @Get('drawings/moc-updates-required')
  @Permissions(PermissionKeys.PSIDrawingView)
  mocUpdateDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('drawings/pssr-blockers')
  @Permissions(PermissionKeys.PSIDrawingView)
  pssrDrawingRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.registry(user.tenantId, this.scope(user), { ...query, pssrBlocker: 'true' });
  }

  @Get('drawings/tag-index/search')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingTagSearch(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.globalTagSearch(user.tenantId, this.scope(user), query);
  }

  @Get('drawings/import-template')
  @Permissions(PermissionKeys.PSIDrawingImport)
  drawingImportTemplate() {
    return this.drawings.importTemplate();
  }

  @Post('drawings/import')
  @Permissions(PermissionKeys.PSIDrawingImport)
  importDrawings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.drawings.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('drawings/export')
  @Permissions(PermissionKeys.PSIDrawingExport)
  exportDrawings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.drawings.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('drawings')
  @Permissions(PermissionKeys.PSIDrawingCreate)
  createDrawing(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.drawings.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('drawings/:drawingId')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingDetail(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.detail(user.tenantId, this.scope(user), drawingId);
  }

  @Patch('drawings/:drawingId')
  @Permissions(PermissionKeys.PSIDrawingEdit)
  updateDrawing(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.update(user.tenantId, user.id, this.scope(user), drawingId, dto, user.permissions);
  }

  @Post('drawings/:drawingId/archive')
  @Permissions(PermissionKeys.PSIDrawingArchive)
  archiveDrawing(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.archive(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Post('drawings/:drawingId/reactivate')
  @Permissions(PermissionKeys.PSIDrawingEdit)
  reactivateDrawing(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.reactivate(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Post('drawings/:drawingId/clone')
  @Permissions(PermissionKeys.PSIDrawingCreate)
  cloneDrawing(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.clone(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Get('drawings/:drawingId/documents')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingDocuments(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.documents(user.tenantId, this.scope(user), drawingId);
  }

  @Post('drawings/:drawingId/documents/link')
  @Permissions(PermissionKeys.PSIDrawingLinkDocument)
  linkDrawingDocument(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.linkDocument(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Delete('drawings/:drawingId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIDrawingRemoveDocument)
  unlinkDrawingDocument(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.drawings.unlinkDocument(user.tenantId, user.id, this.scope(user), drawingId, documentLinkId, dto);
  }

  @Post('drawings/:drawingId/documents/sync-status')
  @Permissions(PermissionKeys.PSIDrawingLinkDocument)
  syncDrawingDocumentStatus(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.syncDrawingDocumentStatus(user.tenantId, user.id, this.scope(user), drawingId);
  }

  @Get('drawings/:drawingId/scope')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingScope(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.scopeDetail(user.tenantId, this.scope(user), drawingId);
  }

  @Patch('drawings/:drawingId/scope')
  @Permissions(PermissionKeys.PSIDrawingManageScope)
  updateDrawingScope(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.upsertScope(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Get('drawings/:drawingId/relationships')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingRelationships(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.relationships(user.tenantId, this.scope(user), drawingId);
  }

  @Post('drawings/:drawingId/relationships')
  @Permissions(PermissionKeys.PSIDrawingManageRelationships)
  addDrawingRelationship(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.addRelationship(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Delete('drawings/:drawingId/relationships/:relationshipId')
  @Permissions(PermissionKeys.PSIDrawingManageRelationships)
  removeDrawingRelationship(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Param('relationshipId') relationshipId: string, @Body() dto: Record<string, any>) {
    return this.drawings.removeRelationship(user.tenantId, user.id, this.scope(user), drawingId, relationshipId, dto);
  }

  @Get('drawings/:drawingId/tag-index')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingTagIndex(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Query() query: Record<string, any>) {
    return this.drawings.tagIndex(user.tenantId, this.scope(user), drawingId, query);
  }

  @Post('drawings/:drawingId/tag-index')
  @Permissions(PermissionKeys.PSIDrawingManageTagIndex)
  addDrawingTag(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.addTag(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Patch('drawings/:drawingId/tag-index/:tagId')
  @Permissions(PermissionKeys.PSIDrawingManageTagIndex)
  updateDrawingTag(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Param('tagId') tagId: string, @Body() dto: Record<string, any>) {
    return this.drawings.updateTag(user.tenantId, user.id, this.scope(user), drawingId, tagId, dto);
  }

  @Delete('drawings/:drawingId/tag-index/:tagId')
  @Permissions(PermissionKeys.PSIDrawingManageTagIndex)
  removeDrawingTag(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Param('tagId') tagId: string) {
    return this.drawings.removeTag(user.tenantId, user.id, this.scope(user), drawingId, tagId);
  }

  @Post('drawings/:drawingId/tag-index/import')
  @Permissions(PermissionKeys.PSIDrawingImportTagIndex)
  importDrawingTagIndex(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.importTagIndex(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Post('drawings/:drawingId/tag-index/verify')
  @Permissions(PermissionKeys.PSIDrawingManageTagIndex)
  verifyDrawingTagIndex(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.verifyTagIndex(user.tenantId, user.id, this.scope(user), drawingId);
  }

  @Get('drawings/:drawingId/moc-redlines')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingMocRedlines(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.mocRedlines(user.tenantId, this.scope(user), drawingId);
  }

  @Patch('drawings/:drawingId/moc-redlines')
  @Permissions(PermissionKeys.PSIDrawingManageRedlines)
  updateDrawingMocRedlines(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.upsertMocRedlines(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Post('drawings/:drawingId/mark-as-built-verified')
  @Permissions(PermissionKeys.PSIDrawingVerifyAsBuilt)
  markDrawingAsBuiltVerified(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.markAsBuiltVerified(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Post('drawings/:drawingId/field-walkdown')
  @Permissions(PermissionKeys.PSIDrawingVerifyAsBuilt)
  drawingFieldWalkdown(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.fieldWalkdown(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Get('drawings/:drawingId/as-built-verifications')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingAsBuiltVerifications(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.asBuiltVerifications(user.tenantId, this.scope(user), drawingId);
  }

  @Post('drawings/:drawingId/completeness/run')
  @Permissions(PermissionKeys.PSIDrawingRunCompletenessCheck)
  runDrawingCompleteness(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.runCompleteness(user.tenantId, user.id, this.scope(user), drawingId);
  }

  @Get('drawings/:drawingId/completeness')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingCompleteness(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.completeness(user.tenantId, this.scope(user), drawingId);
  }

  @Post('drawings/:drawingId/conflict-check/run')
  @Permissions(PermissionKeys.PSIDrawingRunConflictCheck)
  runDrawingConflictCheck(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.runConflictCheck(user.tenantId, user.id, this.scope(user), drawingId);
  }

  @Get('drawings/:drawingId/conflicts')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingConflicts(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.conflicts(user.tenantId, this.scope(user), drawingId);
  }

  @Post('drawings/:drawingId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSIDrawingOverrideConflict)
  overrideDrawingConflict(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.drawings.overrideConflict(user.tenantId, user.id, this.scope(user), drawingId, conflictId, dto);
  }

  @Post('drawings/:drawingId/submit-review')
  @Permissions(PermissionKeys.PSIDrawingSubmitReview)
  submitDrawingReview(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string, @Body() dto: Record<string, any>) {
    return this.drawings.submitReview(user.tenantId, user.id, this.scope(user), drawingId, dto);
  }

  @Get('drawings/:drawingId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  drawingHistory(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.history(user.tenantId, this.scope(user), drawingId);
  }

  @Get('drawings/:drawingId/export-tag-index')
  @Permissions(PermissionKeys.PSIDrawingExport)
  exportDrawingTagIndex(@CurrentUser() user: RequestUser, @Param('drawingId') drawingId: string) {
    return this.drawings.tagIndex(user.tenantId, this.scope(user), drawingId, {});
  }

  @Get('electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), query);
  }

  @Get('electrical-classification/summary')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.summary(user.tenantId, this.scope(user), query);
  }

  @Get('electrical-classification/hazardous-areas')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  hazardousAreas(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, hazardousAreas: 'true' });
  }

  @Get('electrical-classification/equipment-ratings')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalEquipmentRatings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, equipmentRatings: 'true' });
  }

  @Get('electrical-classification/rating-mismatches')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalRatingMismatches(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, ratingMismatches: 'true' });
  }

  @Get('electrical-classification/missing')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  missingElectricalClassifications(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('electrical-classification/review-overdue')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  overdueElectricalClassificationReviews(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('electrical-classification/moc-required')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationMocRequired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('electrical-classification/pssr-blockers')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationPssrBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.registry(user.tenantId, this.scope(user), { ...query, pssrBlocker: 'true' });
  }

  @Get('electrical-classification/import-template')
  @Permissions(PermissionKeys.PSIElectricalClassificationImport)
  electricalClassificationImportTemplate() {
    return this.electricalClassifications.importTemplate();
  }

  @Post('electrical-classification/import')
  @Permissions(PermissionKeys.PSIElectricalClassificationImport)
  importElectricalClassifications(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('electrical-classification/export')
  @Permissions(PermissionKeys.PSIElectricalClassificationExport)
  exportElectricalClassifications(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.electricalClassifications.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationCreate)
  createElectricalClassification(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('electrical-classification/:classificationId')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationDetail(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.detail(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId')
  @Permissions(PermissionKeys.PSIElectricalClassificationEdit)
  updateElectricalClassification(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.update(user.tenantId, user.id, this.scope(user), classificationId, dto, user.permissions);
  }

  @Post('electrical-classification/:classificationId/archive')
  @Permissions(PermissionKeys.PSIElectricalClassificationArchive)
  archiveElectricalClassification(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.archive(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Post('electrical-classification/:classificationId/reactivate')
  @Permissions(PermissionKeys.PSIElectricalClassificationEdit)
  reactivateElectricalClassification(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.reactivate(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Post('electrical-classification/:classificationId/clone')
  @Permissions(PermissionKeys.PSIElectricalClassificationCreate)
  cloneElectricalClassification(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.clone(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/hazard-sources')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalHazardSources(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.hazardSources(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId/hazard-sources')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageHazardSources)
  updateElectricalHazardSources(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.upsertHazardSources(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/area-details')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalAreaDetails(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.areaDetails(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId/area-details')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageAreaDetails)
  updateElectricalAreaDetails(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.upsertAreaDetails(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/ventilation-basis')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalVentilationBasis(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.ventilationBasis(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId/ventilation-basis')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageVentilationBasis)
  updateElectricalVentilationBasis(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.upsertVentilationBasis(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/protection-requirements')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalProtectionRequirements(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.protectionRequirements(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId/protection-requirements')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageProtectionRequirements)
  updateElectricalProtectionRequirements(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.upsertProtectionRequirements(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/installed-equipment')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalInstalledEquipment(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Query() query: Record<string, any>) {
    return this.electricalClassifications.installedEquipment(user.tenantId, this.scope(user), classificationId, query);
  }

  @Post('electrical-classification/:classificationId/installed-equipment')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageInstalledEquipment)
  addElectricalInstalledEquipment(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.addInstalledEquipment(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Patch('electrical-classification/:classificationId/installed-equipment/:itemId')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageInstalledEquipment)
  updateElectricalInstalledEquipment(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.updateInstalledEquipment(user.tenantId, user.id, this.scope(user), classificationId, itemId, dto);
  }

  @Delete('electrical-classification/:classificationId/installed-equipment/:itemId')
  @Permissions(PermissionKeys.PSIElectricalClassificationManageInstalledEquipment)
  removeElectricalInstalledEquipment(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.removeInstalledEquipment(user.tenantId, user.id, this.scope(user), classificationId, itemId, dto);
  }

  @Post('electrical-classification/:classificationId/rating-check/run')
  @Permissions(PermissionKeys.PSIElectricalClassificationRunRatingCheck)
  runElectricalRatingCheck(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.runRatingCheck(user.tenantId, user.id, this.scope(user), classificationId);
  }

  @Get('electrical-classification/:classificationId/ptw-controls')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalPtwControls(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.ptwControls(user.tenantId, this.scope(user), classificationId);
  }

  @Patch('electrical-classification/:classificationId/ptw-controls')
  @Permissions(PermissionKeys.PSIElectricalClassificationManagePtwControls)
  updateElectricalPtwControls(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.upsertPtwControls(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/documents')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationDocuments(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.documents(user.tenantId, this.scope(user), classificationId);
  }

  @Post('electrical-classification/:classificationId/documents/link')
  @Permissions(PermissionKeys.PSIElectricalClassificationLinkDocument)
  linkElectricalClassificationDocument(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.linkDocument(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Delete('electrical-classification/:classificationId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIElectricalClassificationRemoveDocument)
  unlinkElectricalClassificationDocument(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.unlinkDocument(user.tenantId, user.id, this.scope(user), classificationId, documentLinkId, dto);
  }

  @Post('electrical-classification/:classificationId/completeness/run')
  @Permissions(PermissionKeys.PSIElectricalClassificationRunCompletenessCheck)
  runElectricalCompleteness(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.runCompleteness(user.tenantId, user.id, this.scope(user), classificationId);
  }

  @Get('electrical-classification/:classificationId/completeness')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalCompleteness(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.completeness(user.tenantId, this.scope(user), classificationId);
  }

  @Post('electrical-classification/:classificationId/conflict-check/run')
  @Permissions(PermissionKeys.PSIElectricalClassificationRunConflictCheck)
  runElectricalConflictCheck(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.runConflictCheck(user.tenantId, user.id, this.scope(user), classificationId);
  }

  @Get('electrical-classification/:classificationId/conflicts')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalConflicts(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.conflicts(user.tenantId, this.scope(user), classificationId);
  }

  @Post('electrical-classification/:classificationId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSIElectricalClassificationOverrideConflict)
  overrideElectricalConflict(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.overrideConflict(user.tenantId, user.id, this.scope(user), classificationId, conflictId, dto);
  }

  @Post('electrical-classification/:classificationId/submit-review')
  @Permissions(PermissionKeys.PSIElectricalClassificationSubmitReview)
  submitElectricalReview(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.submitReview(user.tenantId, user.id, this.scope(user), classificationId, dto);
  }

  @Get('electrical-classification/:classificationId/change-history')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalChangeHistory(@CurrentUser() user: RequestUser, @Param('classificationId') classificationId: string) {
    return this.electricalClassifications.history(user.tenantId, this.scope(user), classificationId);
  }

  @Get('safeguards')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), query);
  }

  @Get('safeguards/summary')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.summary(user.tenantId, this.scope(user), query);
  }

  @Get('safeguards/critical')
  @Permissions(PermissionKeys.PSISafeguardView)
  criticalSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, critical: 'true' });
  }

  @Get('safeguards/missing')
  @Permissions(PermissionKeys.PSISafeguardView)
  missingSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('safeguards/conflicts')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardConflictsRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, conflicts: 'true' });
  }

  @Get('safeguards/bypassed-impaired')
  @Permissions(PermissionKeys.PSISafeguardView)
  bypassedImpairedSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, bypassedImpaired: 'true' });
  }

  @Get('safeguards/overdue-testing')
  @Permissions(PermissionKeys.PSISafeguardView)
  overdueTestingSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, overdueTesting: 'true' });
  }

  @Get('safeguards/unverified')
  @Permissions(PermissionKeys.PSISafeguardView)
  unverifiedSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, unverified: 'true' });
  }

  @Get('safeguards/review-overdue')
  @Permissions(PermissionKeys.PSISafeguardView)
  reviewOverdueSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('safeguards/moc-required')
  @Permissions(PermissionKeys.PSISafeguardView)
  mocRequiredSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('safeguards/pssr-blockers')
  @Permissions(PermissionKeys.PSISafeguardView)
  pssrBlockerSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.registry(user.tenantId, this.scope(user), { ...query, pssrBlockers: 'true' });
  }

  @Get('safeguards/import-template')
  @Permissions(PermissionKeys.PSISafeguardImport)
  safeguardImportTemplate() {
    return this.safeguards.importTemplate();
  }

  @Post('safeguards/import')
  @Permissions(PermissionKeys.PSISafeguardImport)
  importSafeguards(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.safeguards.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('safeguards/export')
  @Permissions(PermissionKeys.PSISafeguardExport)
  exportSafeguards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.safeguards.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('safeguards')
  @Permissions(PermissionKeys.PSISafeguardCreate)
  createSafeguard(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.safeguards.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('safeguards/:safeguardId')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardDetail(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.detail(user.tenantId, this.scope(user), safeguardId);
  }

  @Patch('safeguards/:safeguardId')
  @Permissions(PermissionKeys.PSISafeguardEdit)
  updateSafeguard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.update(user.tenantId, user.id, this.scope(user), safeguardId, dto, user.permissions);
  }

  @Post('safeguards/:safeguardId/archive')
  @Permissions(PermissionKeys.PSISafeguardArchive)
  archiveSafeguard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.archive(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Post('safeguards/:safeguardId/reactivate')
  @Permissions(PermissionKeys.PSISafeguardEdit)
  reactivateSafeguard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.reactivate(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Post('safeguards/:safeguardId/clone')
  @Permissions(PermissionKeys.PSISafeguardCreate)
  cloneSafeguard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.clone(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Get('safeguards/:safeguardId/hazards')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardHazards(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.hazards(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/hazards')
  @Permissions(PermissionKeys.PSISafeguardLinkHazard)
  addSafeguardHazard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.addHazard(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Patch('safeguards/:safeguardId/hazards/:hazardLinkId')
  @Permissions(PermissionKeys.PSISafeguardLinkHazard)
  updateSafeguardHazard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('hazardLinkId') hazardLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.updateHazard(user.tenantId, user.id, this.scope(user), safeguardId, hazardLinkId, dto);
  }

  @Delete('safeguards/:safeguardId/hazards/:hazardLinkId')
  @Permissions(PermissionKeys.PSISafeguardRemoveHazard)
  removeSafeguardHazard(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('hazardLinkId') hazardLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.removeHazard(user.tenantId, user.id, this.scope(user), safeguardId, hazardLinkId, dto);
  }

  @Get('safeguards/:safeguardId/function-requirements')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardFunctionRequirements(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.functionRequirements(user.tenantId, this.scope(user), safeguardId);
  }

  @Patch('safeguards/:safeguardId/function-requirements')
  @Permissions(PermissionKeys.PSISafeguardManageFunctionRequirements)
  updateSafeguardFunctionRequirements(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.upsertFunctionRequirements(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Get('safeguards/:safeguardId/source-links')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardSourceLinks(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.sourceLinks(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/source-links')
  @Permissions(PermissionKeys.PSISafeguardLinkSourceRecord)
  addSafeguardSourceLink(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.addSourceLink(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Patch('safeguards/:safeguardId/source-links/:sourceLinkId')
  @Permissions(PermissionKeys.PSISafeguardLinkSourceRecord)
  updateSafeguardSourceLink(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('sourceLinkId') sourceLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.updateSourceLink(user.tenantId, user.id, this.scope(user), safeguardId, sourceLinkId, dto);
  }

  @Delete('safeguards/:safeguardId/source-links/:sourceLinkId')
  @Permissions(PermissionKeys.PSISafeguardRemoveSourceRecord)
  removeSafeguardSourceLink(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('sourceLinkId') sourceLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.removeSourceLink(user.tenantId, user.id, this.scope(user), safeguardId, sourceLinkId, dto);
  }

  @Post('safeguards/:safeguardId/source-status-check')
  @Permissions(PermissionKeys.PSISafeguardRunSourceStatusCheck)
  runSafeguardSourceStatusCheck(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.runSourceStatusCheck(user.tenantId, user.id, this.scope(user), safeguardId);
  }

  @Get('safeguards/:safeguardId/source-diff')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardSourceDiff(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.sourceDiff(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/source-sync/compare-only')
  @Permissions(PermissionKeys.PSISafeguardRunSourceStatusCheck)
  compareSafeguardSource(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.compareSource(user.tenantId, user.id, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/source-sync/pull')
  @Permissions(PermissionKeys.PSISafeguardRunSourceStatusCheck)
  pullSafeguardSource(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.pullSource(user.tenantId, user.id, this.scope(user), safeguardId);
  }

  @Get('safeguards/:safeguardId/effectiveness')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardEffectiveness(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.effectiveness(user.tenantId, this.scope(user), safeguardId);
  }

  @Patch('safeguards/:safeguardId/effectiveness')
  @Permissions(PermissionKeys.PSISafeguardManageEffectiveness)
  updateSafeguardEffectiveness(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.upsertEffectiveness(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Get('safeguards/:safeguardId/testing-status')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardTestingStatus(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.testingStatus(user.tenantId, this.scope(user), safeguardId);
  }

  @Patch('safeguards/:safeguardId/testing-status')
  @Permissions(PermissionKeys.PSISafeguardManageTestingStatus)
  updateSafeguardTestingStatus(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.upsertTestingStatus(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Get('safeguards/:safeguardId/documents')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardDocuments(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.documents(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/documents/link')
  @Permissions(PermissionKeys.PSISafeguardLinkDocument)
  linkSafeguardDocument(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.linkDocument(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Delete('safeguards/:safeguardId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSISafeguardRemoveDocument)
  unlinkSafeguardDocument(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.unlinkDocument(user.tenantId, user.id, this.scope(user), safeguardId, documentLinkId, dto);
  }

  @Post('safeguards/:safeguardId/completeness/run')
  @Permissions(PermissionKeys.PSISafeguardRunCompletenessCheck)
  runSafeguardCompleteness(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.runCompleteness(user.tenantId, user.id, this.scope(user), safeguardId);
  }

  @Get('safeguards/:safeguardId/completeness')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardCompleteness(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.completeness(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/conflict-check/run')
  @Permissions(PermissionKeys.PSISafeguardRunConflictCheck)
  runSafeguardConflictCheck(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.runConflictCheck(user.tenantId, user.id, this.scope(user), safeguardId);
  }

  @Get('safeguards/:safeguardId/conflicts')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardConflictResults(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.conflicts(user.tenantId, this.scope(user), safeguardId);
  }

  @Post('safeguards/:safeguardId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSISafeguardOverrideConflict)
  overrideSafeguardConflict(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.overrideConflict(user.tenantId, user.id, this.scope(user), safeguardId, conflictId, dto);
  }

  @Post('safeguards/:safeguardId/submit-review')
  @Permissions(PermissionKeys.PSISafeguardSubmitReview)
  submitSafeguardReview(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.submitReview(user.tenantId, user.id, this.scope(user), safeguardId, dto);
  }

  @Get('safeguards/:safeguardId/change-history')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardChangeHistory(@CurrentUser() user: RequestUser, @Param('safeguardId') safeguardId: string) {
    return this.safeguards.history(user.tenantId, this.scope(user), safeguardId);
  }

  @Get('lookups/safeguard-categories')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardCategoriesLookup() { return safeguardCategories; }

  @Get('lookups/safeguard-types')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardTypesLookup() { return safeguardTypes; }

  @Get('lookups/safeguard-function-types')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardFunctionTypesLookup() { return safeguardFunctionTypes; }

  @Get('lookups/safeguard-criticalities')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardCriticalitiesLookup() { return safeguardCriticalities; }

  @Get('lookups/safeguard-source-modules')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardSourceModulesLookup() { return safeguardSourceModules; }

  @Get('lookups/safeguard-effectiveness-statuses')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardEffectivenessStatusesLookup() { return safeguardEffectivenessStatuses; }

  @Get('lookups/ipl-qualification-statuses')
  @Permissions(PermissionKeys.PSISafeguardView)
  iplQualificationStatusesLookup() { return iplQualificationStatuses; }

  @Get('lookups/safeguard-testing-statuses')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardTestingStatusesLookup() { return safeguardTestingStatuses; }

  @Get('lookups/safeguard-conflict-statuses')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardConflictStatusesLookup() { return safeguardConflictStatuses; }

  @Get('lookups/safeguard-document-types')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardDocumentTypesLookup() { return safeguardDocumentTypes; }

  @Get('material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityRegistry(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), query);
  }

  @Get('material-compatibility/summary')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilitySummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.summary(user.tenantId, this.scope(user), query);
  }

  @Get('material-compatibility/conflicts')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityConflicts(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, conflicts: 'true' });
  }

  @Get('material-compatibility/incompatible')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityIncompatible(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, incompatible: 'true' });
  }

  @Get('material-compatibility/missing')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityMissing(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, missing: 'true' });
  }

  @Get('material-compatibility/review-overdue')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityReviewOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, reviewOverdue: 'true' });
  }

  @Get('material-compatibility/moc-required')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityMocRequired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, mocRequired: 'true' });
  }

  @Get('material-compatibility/pssr-blockers')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityPssrBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, pssrBlockers: 'true' });
  }

  @Get('material-compatibility/mi-readiness-impact')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityMiImpact(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.registry(user.tenantId, this.scope(user), { ...query, miReadinessImpact: 'true' });
  }

  @Get('material-compatibility/import-template')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityImport)
  materialCompatibilityImportTemplate() {
    return this.materialCompatibility.importTemplate();
  }

  @Post('material-compatibility/import')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityImport)
  importMaterialCompatibility(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.importPreview(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('material-compatibility/export')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityExport)
  exportMaterialCompatibility(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.materialCompatibility.exportRows(user.tenantId, user.id, this.scope(user), query);
  }

  @Post('material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityCreate)
  createMaterialCompatibility(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.create(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('material-compatibility/:compatibilityId')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityDetail(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.detail(user.tenantId, this.scope(user), compatibilityId);
  }

  @Patch('material-compatibility/:compatibilityId')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityEdit)
  updateMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.update(user.tenantId, user.id, this.scope(user), compatibilityId, dto, user.permissions);
  }

  @Post('material-compatibility/:compatibilityId/archive')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityArchive)
  archiveMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.archive(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Post('material-compatibility/:compatibilityId/reactivate')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityEdit)
  reactivateMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.reactivate(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Post('material-compatibility/:compatibilityId/clone')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityCreate)
  cloneMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.clone(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/service-conditions')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialServiceConditions(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.serviceConditions(user.tenantId, this.scope(user), compatibilityId);
  }

  @Patch('material-compatibility/:compatibilityId/service-conditions')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageServiceConditions)
  updateMaterialServiceConditions(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.upsertServiceConditions(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/material-details')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialDetails(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.materialDetails(user.tenantId, this.scope(user), compatibilityId);
  }

  @Patch('material-compatibility/:compatibilityId/material-details')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageMaterialDetails)
  updateMaterialDetails(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.upsertMaterialDetails(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/rating')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialRating(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.rating(user.tenantId, this.scope(user), compatibilityId);
  }

  @Patch('material-compatibility/:compatibilityId/rating')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageRating)
  updateMaterialRating(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.upsertRating(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/degradation-mechanisms')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialDegradationMechanisms(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.degradationMechanisms(user.tenantId, this.scope(user), compatibilityId);
  }

  @Post('material-compatibility/:compatibilityId/degradation-mechanisms')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageDegradationMechanisms)
  addMaterialDegradationMechanism(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.addDegradationMechanism(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Patch('material-compatibility/:compatibilityId/degradation-mechanisms/:mechanismId')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageDegradationMechanisms)
  updateMaterialDegradationMechanism(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Param('mechanismId') mechanismId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.updateDegradationMechanism(user.tenantId, user.id, this.scope(user), compatibilityId, mechanismId, dto);
  }

  @Delete('material-compatibility/:compatibilityId/degradation-mechanisms/:mechanismId')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageDegradationMechanisms)
  removeMaterialDegradationMechanism(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Param('mechanismId') mechanismId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.removeDegradationMechanism(user.tenantId, user.id, this.scope(user), compatibilityId, mechanismId, dto);
  }

  @Get('material-compatibility/:compatibilityId/controls')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialControls(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.controls(user.tenantId, this.scope(user), compatibilityId);
  }

  @Patch('material-compatibility/:compatibilityId/controls')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityManageControls)
  updateMaterialControls(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.upsertControls(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/documents')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialDocuments(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.documents(user.tenantId, this.scope(user), compatibilityId);
  }

  @Post('material-compatibility/:compatibilityId/documents/link')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityLinkDocument)
  linkMaterialDocument(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.linkDocument(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Delete('material-compatibility/:compatibilityId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityRemoveDocument)
  unlinkMaterialDocument(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.unlinkDocument(user.tenantId, user.id, this.scope(user), compatibilityId, documentLinkId, dto);
  }

  @Post('material-compatibility/:compatibilityId/compatibility-check/run')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityRunCompatibilityCheck)
  runMaterialCompatibilityCheck(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.runCompatibilityCheck(user.tenantId, user.id, this.scope(user), compatibilityId);
  }

  @Post('material-compatibility/:compatibilityId/completeness/run')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityRunCompletenessCheck)
  runMaterialCompleteness(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.runCompleteness(user.tenantId, user.id, this.scope(user), compatibilityId);
  }

  @Get('material-compatibility/:compatibilityId/completeness')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompleteness(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.completeness(user.tenantId, this.scope(user), compatibilityId);
  }

  @Post('material-compatibility/:compatibilityId/conflict-check/run')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityRunConflictCheck)
  runMaterialConflictCheck(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.runConflictCheck(user.tenantId, user.id, this.scope(user), compatibilityId);
  }

  @Get('material-compatibility/:compatibilityId/conflicts')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialConflicts(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.conflicts(user.tenantId, this.scope(user), compatibilityId);
  }

  @Post('material-compatibility/:compatibilityId/conflicts/:conflictId/override')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityOverrideConflict)
  overrideMaterialConflict(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Param('conflictId') conflictId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.overrideConflict(user.tenantId, user.id, this.scope(user), compatibilityId, conflictId, dto);
  }

  @Post('material-compatibility/:compatibilityId/submit-review')
  @Permissions(PermissionKeys.PSIMaterialCompatibilitySubmitReview)
  submitMaterialReview(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.submitReview(user.tenantId, user.id, this.scope(user), compatibilityId, dto);
  }

  @Get('material-compatibility/:compatibilityId/change-history')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialChangeHistory(@CurrentUser() user: RequestUser, @Param('compatibilityId') compatibilityId: string) {
    return this.materialCompatibility.history(user.tenantId, this.scope(user), compatibilityId);
  }

  @Get('lookups/material-families')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialFamiliesLookup() { return materialFamilies; }

  @Get('lookups/material-grades')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialGradesLookup() { return []; }

  @Get('lookups/component-types')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  componentTypesLookup() { return componentTypes; }

  @Get('lookups/compatibility-scopes')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  compatibilityScopesLookup() { return compatibilityScopes; }

  @Get('lookups/compatibility-ratings')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  compatibilityRatingsLookup() { return compatibilityRatings; }

  @Get('lookups/rating-confidence')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  ratingConfidenceLookup() { return ratingConfidence; }

  @Get('lookups/compatibility-basis')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  compatibilityBasisLookup() { return compatibilityBasis; }

  @Get('lookups/degradation-mechanisms')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  degradationMechanismsLookup() { return degradationMechanisms; }

  @Get('lookups/exposure-types')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  exposureTypesLookup() { return exposureTypes; }

  @Get('lookups/compatibility-document-types')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  compatibilityDocumentTypesLookup() { return compatibilityDocumentTypes; }

  @Get('lookups/material-conflict-statuses')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialConflictStatusesLookup() { return materialConflictStatuses; }

  @Get('dashboard/missing-critical')
  @Permissions(PermissionKeys.PSIDashboardView)
  missingCritical(@CurrentUser() user: RequestUser) {
    return this.psi.dashboardList(user.tenantId, this.scope(user), { criticalGaps: 'true' });
  }

  @Get('dashboard/review-overdue')
  @Permissions(PermissionKeys.PSIDashboardView)
  reviewOverdue(@CurrentUser() user: RequestUser) {
    return this.psi.dashboardList(user.tenantId, this.scope(user), { reviewOverdue: 'true' });
  }

  @Get('dashboard/moc-updates-required')
  @Permissions(PermissionKeys.PSIDashboardView)
  mocUpdatesRequired(@CurrentUser() user: RequestUser) {
    return this.psi.dashboardList(user.tenantId, this.scope(user), { mocUpdateRequired: 'true' });
  }

  @Get('dashboard/pssr-blockers')
  @Permissions(PermissionKeys.PSIDashboardView)
  pssrBlockers(@CurrentUser() user: RequestUser) {
    return this.psi.dashboardList(user.tenantId, this.scope(user), { pssrBlocker: 'true' });
  }

  @Get('unit-form/lookups/sites')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitFormSites(@CurrentUser() user: RequestUser) {
    return this.psi.unitFormSites(user.tenantId, this.scope(user));
  }

  @Get('unit-form/lookups/departments')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitFormDepartments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.unitFormDepartments(user.tenantId, this.scope(user), query);
  }

  @Get('unit-form/lookups/areas')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitFormAreas(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.unitFormAreas(user.tenantId, this.scope(user), query);
  }

  @Get('unit-form/lookups/users')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitFormUsers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.unitFormUsers(user.tenantId, this.scope(user), query);
  }

  @Get('unit-form/lookups/equipment')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitFormEquipment(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.unitFormEquipment(user.tenantId, this.scope(user), query);
  }

  @Get('units')
  @Permissions(PermissionKeys.PSIUnitView)
  units(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.units(user.tenantId, this.scope(user), query);
  }

  @Post('units')
  @Permissions(PermissionKeys.PSIUnitCreate)
  createUnit(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.psi.createUnit(user.tenantId, user.id, this.scope(user), dto);
  }

  @Get('units/:unitId/chemicals')
  @Permissions(PermissionKeys.PSIChemicalView)
  unitChemicals(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.chemicals.unitChemicals(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/chemicals')
  @Permissions(PermissionKeys.PSIChemicalCreate)
  createUnitChemical(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.chemicals.createChemical(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/process-chemistry')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  unitProcessChemistry(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.processChemistry.unitChemistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/process-chemistry')
  @Permissions(PermissionKeys.PSIProcessChemistryCreate)
  createUnitProcessChemistry(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.processChemistry.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/safe-operating-limits')
  @Permissions(PermissionKeys.PSISafeLimitView)
  unitSafeOperatingLimits(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.safeLimits.unitLimits(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/safe-operating-limits')
  @Permissions(PermissionKeys.PSISafeLimitCreate)
  createUnitSafeOperatingLimit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.safeLimits.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/equipment-design')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  unitEquipmentDesign(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.equipmentDesign.unitDesignBasis(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/equipment-design')
  @Permissions(PermissionKeys.PSIEquipmentDesignCreate)
  createUnitEquipmentDesign(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.equipmentDesign.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/relief-systems')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  unitReliefSystems(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.reliefSystems.unitRegistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/relief-systems')
  @Permissions(PermissionKeys.PSIReliefSystemCreate)
  createUnitReliefSystem(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.reliefSystems.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/drawings')
  @Permissions(PermissionKeys.PSIDrawingView)
  unitDrawings(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.drawings.unitRegistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/drawings')
  @Permissions(PermissionKeys.PSIDrawingCreate)
  createUnitDrawing(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.drawings.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  unitElectricalClassifications(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.electricalClassifications.unitRegistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationCreate)
  createUnitElectricalClassification(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.electricalClassifications.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  unitMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.materialCompatibility.unitRegistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityCreate)
  createUnitMaterialCompatibility(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.materialCompatibility.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/safeguards')
  @Permissions(PermissionKeys.PSISafeguardView)
  unitSafeguards(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.safeguards.unitRegistry(user.tenantId, this.scope(user), unitId, query);
  }

  @Post('units/:unitId/safeguards')
  @Permissions(PermissionKeys.PSISafeguardCreate)
  createUnitSafeguard(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.safeguards.create(user.tenantId, user.id, this.scope(user), { ...dto, unitId });
  }

  @Get('units/:unitId/integrations')
  @Permissions('psi.integration.view')
  unitIntegrations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.unitIntegrations(user.tenantId, this.scope(user), unitId);
  }

  @Get('units/:unitId/integrations/moc')
  @Permissions('psi.integration.moc.view')
  unitMocIntegrations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.unitIntegrations(user.tenantId, this.scope(user), unitId, 'MOC');
  }

  @Get('units/:unitId/integrations/pssr')
  @Permissions('psi.integration.pssr.view')
  unitPssrIntegrations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.unitIntegrations(user.tenantId, this.scope(user), unitId, 'PSSR');
  }

  @Get('units/:unitId/integrations/hazop')
  @Permissions('psi.integration.hazop.view')
  unitHazopIntegrations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.unitIntegrations(user.tenantId, this.scope(user), unitId, 'HAZOP');
  }

  @Get('units/:unitId/integrations/mechanical-integrity')
  @Permissions('psi.integration.mi.view')
  unitMiIntegrations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.unitIntegrations(user.tenantId, this.scope(user), unitId, 'Mechanical Integrity');
  }

  @Get('units/:unitId/integrations/blockers')
  @Permissions('psi.integration.view')
  unitIntegrationBlockers(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.integrations.impactRegister(user.tenantId, this.scope(user), { unitId, blocking: 'true' });
  }

  @Get('areas/:areaId/electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  areaElectricalClassifications(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.electricalClassifications.areaRegistry(user.tenantId, this.scope(user), areaId, query);
  }

  @Get('equipment/:equipmentId/safe-operating-limits')
  @Permissions(PermissionKeys.PSISafeLimitView)
  equipmentSafeOperatingLimits(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.safeLimits.equipmentLimits(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/design-basis')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentDesignByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.equipmentDesign.equipmentDesignBasis(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/relief-systems')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemsByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.reliefSystems.equipmentRegistry(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/drawings')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingsByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.drawings.equipmentRegistry(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/electrical-classification')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.electricalClassifications.equipmentRegistry(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.materialCompatibility.equipmentRegistry(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/safeguards')
  @Permissions(PermissionKeys.PSISafeguardView)
  safeguardsByEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.safeguards.equipmentRegistry(user.tenantId, this.scope(user), equipmentId, query);
  }

  @Get('equipment/:equipmentId/integrations')
  @Permissions('psi.integration.view')
  equipmentIntegrations(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.integrations.equipmentIntegrations(user.tenantId, this.scope(user), equipmentId);
  }

  @Get('chemicals/:chemicalId/material-compatibility')
  @Permissions(PermissionKeys.PSIMaterialCompatibilityView)
  materialCompatibilityByChemical(@CurrentUser() user: RequestUser, @Param('chemicalId') chemicalId: string, @Query() query: Record<string, any>) {
    return this.materialCompatibility.chemicalRegistry(user.tenantId, this.scope(user), chemicalId, query);
  }

  @Get('units/:unitId')
  @Permissions(PermissionKeys.PSIUnitView)
  unit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.unitDetail(user.tenantId, this.scope(user), unitId);
  }

  @Patch('units/:unitId')
  @Permissions(PermissionKeys.PSIUnitEdit)
  updateUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.updateUnit(user.tenantId, user.id, this.scope(user), unitId, dto, user.permissions);
  }

  @Post('units/:unitId/archive')
  @Permissions(PermissionKeys.PSIUnitArchive)
  archiveUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.archiveUnit(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Post('units/:unitId/reactivate')
  @Permissions(PermissionKeys.PSIUnitEdit)
  reactivateUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.reactivateUnit(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Get('units/:unitId/equipment')
  @Permissions(PermissionKeys.PSIUnitView)
  equipment(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.equipmentLinks(user.tenantId, this.scope(user), unitId);
  }

  @Post('units/:unitId/equipment')
  @Permissions(PermissionKeys.PSIUnitEdit)
  linkEquipment(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.linkEquipment(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Delete('units/:unitId/equipment/:linkId')
  @Permissions(PermissionKeys.PSIUnitEdit)
  unlinkEquipment(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Param('linkId') linkId: string) {
    return this.psi.unlinkEquipment(user.tenantId, user.id, this.scope(user), unitId, linkId);
  }

  @Get('units/:unitId/equipment-links')
  @Permissions(PermissionKeys.PSIUnitView)
  equipmentLinkAliases(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.equipmentLinks(user.tenantId, this.scope(user), unitId);
  }

  @Post('units/:unitId/equipment-links')
  @Permissions(PermissionKeys.PSIUnitLinkEquipment)
  linkEquipmentAlias(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.linkEquipment(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Patch('units/:unitId/equipment-links/:linkId')
  @Permissions(PermissionKeys.PSIUnitLinkEquipment)
  updateEquipmentLink(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.psi.updateEquipmentLink(user.tenantId, user.id, this.scope(user), unitId, linkId, dto);
  }

  @Delete('units/:unitId/equipment-links/:linkId')
  @Permissions(PermissionKeys.PSIUnitUnlinkEquipment)
  unlinkEquipmentAlias(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Param('linkId') linkId: string) {
    return this.psi.unlinkEquipment(user.tenantId, user.id, this.scope(user), unitId, linkId);
  }

  @Get('units/:unitId/completeness')
  @Permissions(PermissionKeys.PSICompletenessView)
  completeness(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.completenessEngine.unitCompleteness(user.tenantId, this.scope(user), unitId);
  }

  @Post('units/:unitId/completeness/run')
  @Permissions(PermissionKeys.PSICompletenessRunUnit)
  runCompleteness(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.completenessEngine.runUnit(user.tenantId, user.id, this.scope(user), unitId);
  }

  @Get('units/:unitId/completeness/matrix')
  @Permissions(PermissionKeys.PSICompletenessMatrixView)
  unitCompletenessMatrix(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.completenessEngine.matrix(user.tenantId, this.scope(user), { ...query, unitId });
  }

  @Get('units/:unitId/completeness/gaps')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  unitCompletenessGaps(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.completenessEngine.gaps(user.tenantId, this.scope(user), { ...query, unitId });
  }

  @Get('units/:unitId/completeness/report')
  @Permissions(PermissionKeys.PSICompletenessExport)
  unitCompletenessReport(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.completenessEngine.export(user.tenantId, user.id, this.scope(user), { unitId });
  }

  @Get('equipment/:equipmentId/completeness')
  @Permissions(PermissionKeys.PSICompletenessView)
  equipmentCompleteness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.completenessEngine.equipmentCompleteness(user.tenantId, this.scope(user), equipmentId);
  }

  @Post('equipment/:equipmentId/completeness/run')
  @Permissions(PermissionKeys.PSICompletenessRun)
  runEquipmentCompleteness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.completenessEngine.runEquipment(user.tenantId, user.id, this.scope(user), equipmentId);
  }

  @Get('equipment/:equipmentId/completeness/matrix')
  @Permissions(PermissionKeys.PSICompletenessMatrixView)
  equipmentCompletenessMatrix(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.completenessEngine.matrix(user.tenantId, this.scope(user), { ...query, equipmentId });
  }

  @Get('units/:unitId/linked-records')
  @Permissions(PermissionKeys.PSILinkedRecordView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.linkedRecords(user.tenantId, this.scope(user), unitId);
  }

  @Post('units/:unitId/linked-records')
  @Permissions(PermissionKeys.PSILinkedRecordCreate)
  createLinkedRecord(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.linkRecord(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Delete('units/:unitId/linked-records/:linkId')
  @Permissions(PermissionKeys.PSILinkedRecordRemove)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.psi.removeLinkedRecord(user.tenantId, user.id, this.scope(user), unitId, linkId, dto);
  }

  @Get('units/:unitId/documents')
  @Permissions(PermissionKeys.PSIDocumentView)
  documents(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.documents(user.tenantId, this.scope(user), unitId);
  }

  @Post('units/:unitId/documents/link')
  @Permissions(PermissionKeys.PSIDocumentLink)
  linkDocument(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.linkDocument(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Delete('units/:unitId/documents/:documentLinkId')
  @Permissions(PermissionKeys.PSIDocumentRemove)
  unlinkDocument(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Param('documentLinkId') documentLinkId: string, @Body() dto: Record<string, any>) {
    return this.psi.unlinkDocument(user.tenantId, user.id, this.scope(user), unitId, documentLinkId, dto);
  }

  @Post('units/:unitId/submit-review')
  @Permissions(PermissionKeys.PSIUnitSubmitReview)
  submitReview(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: Record<string, any>) {
    return this.psi.submitReview(user.tenantId, user.id, this.scope(user), unitId, dto);
  }

  @Post('reviews/:reviewId/approve')
  @Permissions(PermissionKeys.PSIUnitApprove)
  approveReview(@CurrentUser() user: RequestUser, @Param('reviewId') reviewId: string, @Body() dto: Record<string, any>) {
    return this.psi.decideReview(user.tenantId, user.id, this.scope(user), reviewId, 'Approved', dto);
  }

  @Post('reviews/:reviewId/reject')
  @Permissions(PermissionKeys.PSIUnitReject)
  rejectReview(@CurrentUser() user: RequestUser, @Param('reviewId') reviewId: string, @Body() dto: Record<string, any>) {
    return this.psi.decideReview(user.tenantId, user.id, this.scope(user), reviewId, 'Rejected', dto);
  }

  @Get('change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  changeHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.psi.changeHistory(user.tenantId, this.scope(user), query);
  }

  @Get('units/:unitId/change-history')
  @Permissions(PermissionKeys.PSIChangeHistoryView)
  unitChangeHistory(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) {
    return this.psi.changeHistory(user.tenantId, this.scope(user), { unitId });
  }

  @Get('lookups/unit-types')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitTypes() { return this.psi.unitTypes(); }

  @Get('lookups/unit-statuses')
  @Permissions(PermissionKeys.PSIDashboardView)
  unitStatuses() { return this.psi.unitStatuses(); }

  @Get('lookups/psi-statuses')
  @Permissions(PermissionKeys.PSIDashboardView)
  psiStatuses() { return this.psi.psiStatuses(); }

  @Get('lookups/completeness-categories')
  @Permissions(PermissionKeys.PSIDashboardView)
  completenessCategories() { return this.psi.completenessCategories(); }

  @Get('lookups/completeness-statuses')
  @Permissions(PermissionKeys.PSICompletenessView)
  completenessStatusesLookup() { return completenessStatuses; }

  @Get('lookups/gap-types')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  gapTypesLookup() { return gapTypes; }

  @Get('lookups/gap-severities')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  gapSeveritiesLookup() { return gapSeverities; }

  @Get('lookups/gap-statuses')
  @Permissions(PermissionKeys.PSICompletenessGapView)
  gapStatusesLookup() { return gapStatuses; }

  @Get('lookups/requirement-categories')
  @Permissions(PermissionKeys.PSICompletenessRequirementView)
  requirementCategoriesLookup() { return requirementCategories; }

  @Get('lookups/requirement-applicability-scopes')
  @Permissions(PermissionKeys.PSICompletenessRequirementView)
  requirementApplicabilityScopesLookup() { return requirementApplicabilityScopes; }

  @Get('lookups/waiver-statuses')
  @Permissions(PermissionKeys.PSICompletenessWaiverView)
  waiverStatusesLookup() { return waiverStatuses; }

  @Get('lookups/run-statuses')
  @Permissions(PermissionKeys.PSICompletenessView)
  runStatusesLookup() { return runStatuses; }

  @Get('lookups/chemical-categories')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalCategories() { return this.chemicals.lookups('chemical-categories'); }

  @Get('lookups/physical-states')
  @Permissions(PermissionKeys.PSIChemicalView)
  physicalStates() { return this.chemicals.lookups('physical-states'); }

  @Get('lookups/chemical-use-types')
  @Permissions(PermissionKeys.PSIChemicalView)
  chemicalUseTypes() { return this.chemicals.lookups('chemical-use-types'); }

  @Get('lookups/ghs-hazard-classes')
  @Permissions(PermissionKeys.PSIChemicalView)
  ghsHazardClasses() { return this.chemicals.lookups('ghs-hazard-classes'); }

  @Get('lookups/sds-statuses')
  @Permissions(PermissionKeys.PSIChemicalView)
  sdsStatuses() { return this.chemicals.lookups('sds-statuses'); }

  @Get('lookups/storage-classes')
  @Permissions(PermissionKeys.PSIChemicalView)
  storageClasses() { return this.chemicals.lookups('storage-classes'); }

  @Get('lookups/compatibility-risk-levels')
  @Permissions(PermissionKeys.PSIChemicalView)
  compatibilityRiskLevels() { return this.chemicals.lookups('compatibility-risk-levels'); }

  @Get('lookups/chemistry-types')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  chemistryTypes() { return this.processChemistry.lookups('chemistry-types'); }

  @Get('lookups/reaction-phases')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  reactionPhases() { return this.processChemistry.lookups('reaction-phases'); }

  @Get('lookups/operating-modes')
  @Permissions(PermissionKeys.PSIView)
  operatingModes() { return this.processChemistry.lookups('operating-modes'); }

  @Get('lookups/chemical-roles')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  chemicalRoles() { return this.processChemistry.lookups('chemical-roles'); }

  @Get('lookups/reaction-hazard-levels')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  reactionHazardLevels() { return this.processChemistry.lookups('reaction-hazard-levels'); }

  @Get('lookups/unwanted-scenario-types')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  unwantedScenarioTypes() { return this.processChemistry.lookups('unwanted-scenario-types'); }

  @Get('lookups/chemistry-control-types')
  @Permissions(PermissionKeys.PSIProcessChemistryView)
  chemistryControlTypes() { return this.processChemistry.lookups('chemistry-control-types'); }

  @Get('lookups/parameter-types')
  @Permissions(PermissionKeys.PSISafeLimitView)
  parameterTypes() { return this.safeLimits.lookups('parameter-types'); }

  @Get('lookups/limit-scopes')
  @Permissions(PermissionKeys.PSISafeLimitView)
  limitScopes() { return this.safeLimits.lookups('limit-scopes'); }

  @Get('lookups/limit-criticalities')
  @Permissions(PermissionKeys.PSISafeLimitView)
  limitCriticalities() { return this.safeLimits.lookups('limit-criticalities'); }

  @Get('lookups/deviation-directions')
  @Permissions(PermissionKeys.PSISafeLimitView)
  deviationDirections() { return this.safeLimits.lookups('deviation-directions'); }

  @Get('lookups/consequence-severities')
  @Permissions(PermissionKeys.PSISafeLimitView)
  consequenceSeverities() { return this.safeLimits.lookups('consequence-severities'); }

  @Get('lookups/sol-control-types')
  @Permissions(PermissionKeys.PSISafeLimitView)
  solControlTypes() { return this.safeLimits.lookups('sol-control-types'); }

  @Get('lookups/conflict-statuses')
  @Permissions(PermissionKeys.PSISafeLimitView)
  conflictStatuses() { return this.safeLimits.lookups('conflict-statuses'); }

  @Get('lookups/equipment-types')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentTypes() { return this.equipmentDesign.lookups('equipment-types'); }

  @Get('lookups/equipment-categories')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentCategories() { return this.equipmentDesign.lookups('equipment-categories'); }

  @Get('lookups/design-codes')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  designCodes() { return this.equipmentDesign.lookups('design-codes'); }

  @Get('lookups/fluid-phases')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  fluidPhases() { return this.equipmentDesign.lookups('fluid-phases'); }

  @Get('lookups/materials')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  materials() { return this.equipmentDesign.lookups('materials'); }

  @Get('lookups/equipment-criticalities')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  equipmentCriticalities() { return this.equipmentDesign.lookups('equipment-criticalities'); }

  @Get('lookups/design-basis-conflict-statuses')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  designBasisConflictStatuses() { return this.equipmentDesign.lookups('design-basis-conflict-statuses'); }

  @Get('lookups/design-basis-document-types')
  @Permissions(PermissionKeys.PSIEquipmentDesignView)
  designBasisDocumentTypes() { return this.equipmentDesign.lookups('design-basis-document-types'); }

  @Get('lookups/relief-system-types')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefSystemTypes() { return this.reliefSystems.lookups('relief-system-types'); }

  @Get('lookups/relief-device-types')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDeviceTypes() { return this.reliefSystems.lookups('relief-device-types'); }

  @Get('lookups/relief-scenario-types')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefScenarioTypes() { return this.reliefSystems.lookups('relief-scenario-types'); }

  @Get('lookups/relief-destination-types')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDestinationTypes() { return this.reliefSystems.lookups('relief-destination-types'); }

  @Get('lookups/calculation-statuses')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefCalculationStatuses() { return this.reliefSystems.lookups('calculation-statuses'); }

  @Get('lookups/relief-conflict-statuses')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefConflictStatuses() { return this.reliefSystems.lookups('relief-conflict-statuses'); }

  @Get('lookups/relief-document-types')
  @Permissions(PermissionKeys.PSIReliefSystemView)
  reliefDocumentTypes() { return this.reliefSystems.lookups('relief-document-types'); }

  @Get('lookups/drawing-types')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingTypes() { return this.drawings.lookups().drawingTypes; }

  @Get('lookups/drawing-disciplines')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingDisciplines() { return this.drawings.lookups().drawingDisciplines; }

  @Get('lookups/drawing-statuses')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingStatuses() { return this.drawings.lookups().drawingStatuses; }

  @Get('lookups/tag-types')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingTagTypes() { return this.drawings.lookups().tagTypes; }

  @Get('lookups/tag-verification-statuses')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingTagVerificationStatuses() { return this.drawings.lookups().tagVerificationStatuses; }

  @Get('lookups/redline-statuses')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingRedlineStatuses() { return this.drawings.lookups().redlineStatuses; }

  @Get('lookups/moc-drawing-update-statuses')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingMocUpdateStatuses() { return this.drawings.lookups().mocDrawingUpdateStatuses; }

  @Get('lookups/drawing-conflict-statuses')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingConflictStatuses() { return this.drawings.lookups().drawingConflictStatuses; }

  @Get('lookups/drawing-relationship-types')
  @Permissions(PermissionKeys.PSIDrawingView)
  drawingRelationshipTypes() { return this.drawings.lookups().relationshipTypes; }

  @Get('lookups/classification-systems')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  classificationSystems() { return this.electricalClassifications.lookups().classificationSystems; }

  @Get('lookups/hazardous-area-standards')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  hazardousAreaStandards() { return this.electricalClassifications.lookups().hazardousAreaStandards; }

  @Get('lookups/zones')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalZones() { return this.electricalClassifications.lookups().zones; }

  @Get('lookups/class-divisions')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  classDivisions() { return this.electricalClassifications.lookups().classDivisions; }

  @Get('lookups/gas-groups')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalGasGroups() { return this.electricalClassifications.lookups().gasGroups; }

  @Get('lookups/dust-groups')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalDustGroups() { return this.electricalClassifications.lookups().dustGroups; }

  @Get('lookups/temperature-classes')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalTemperatureClasses() { return this.electricalClassifications.lookups().temperatureClasses; }

  @Get('lookups/protection-methods')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalProtectionMethods() { return this.electricalClassifications.lookups().protectionMethods; }

  @Get('lookups/release-source-types')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalReleaseSourceTypes() { return this.electricalClassifications.lookups().releaseSourceTypes; }

  @Get('lookups/release-grades')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalReleaseGrades() { return this.electricalClassifications.lookups().releaseGrades; }

  @Get('lookups/ventilation-types')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalVentilationTypes() { return this.electricalClassifications.lookups().ventilationTypes; }

  @Get('lookups/electrical-classification-document-types')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalClassificationDocumentTypes() { return this.electricalClassifications.lookups().electricalDocumentTypes; }

  @Get('lookups/electrical-conflict-statuses')
  @Permissions(PermissionKeys.PSIElectricalClassificationView)
  electricalConflictStatuses() { return this.electricalClassifications.lookups().electricalConflictStatuses; }

  @Get('lookups/integration-types')
  @Permissions('psi.integration.view')
  integrationTypesLookup() { return this.integrations.lookups('integrationTypes'); }

  @Get('lookups/integration-statuses')
  @Permissions('psi.integration.view')
  integrationStatusesLookup() { return this.integrations.lookups('integrationStatuses'); }

  @Get('lookups/sync-statuses')
  @Permissions('psi.integration.view')
  syncStatusesLookup() { return this.integrations.lookups('syncStatuses'); }

  @Get('lookups/impact-types')
  @Permissions('psi.integration.view')
  impactTypesLookup() { return this.integrations.lookups('impactTypes'); }

  @Get('lookups/impact-severities')
  @Permissions('psi.integration.view')
  impactSeveritiesLookup() { return this.integrations.lookups('impactSeverities'); }

  @Get('lookups/source-modules')
  @Permissions('psi.integration.view')
  sourceModulesLookup() { return this.integrations.lookups('sourceModules'); }

  @Get('lookups/relationship-types')
  @Permissions('psi.integration.view')
  relationshipTypesLookup() { return this.integrations.lookups('relationshipTypes'); }

  @Get('lookups/equipment')
  @Permissions(PermissionKeys.PSIUnitView)
  equipmentLookup(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.psi.equipmentLookup(user.tenantId, this.scope(user), search);
  }

  @Get('lookups/documents')
  @Permissions(PermissionKeys.PSIDocumentView)
  documentLookup(@CurrentUser() user: RequestUser, @Query('search') search = '') {
    return this.psi.documentLookup(user.tenantId, this.scope(user), search);
  }

  private scope(user: RequestUser): { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean } {
    const scope: { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean } = {};
    if (user.siteIds) scope.allowedSiteIds = user.siteIds;
    if (user.selectedSiteId !== undefined) scope.selectedSiteId = user.selectedSiteId;
    if (user.corporateView !== undefined) scope.corporateView = user.corporateView;
    return scope;
  }
}
