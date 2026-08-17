import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PsiIntegrationService } from './psi-integration.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller()
export class PsiIntegrationSourceController {
  constructor(private readonly integrations: PsiIntegrationService) {}

  @Get('moc/:mocId/psi-impact')
  @Permissions('psi.integration.moc.view')
  mocImpact(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string) {
    return this.integrations.mocImpact(user.tenantId, this.scope(user), mocId);
  }

  @Post('moc/:mocId/psi-impact/run')
  @Permissions('psi.integration.moc.assess')
  runMocImpact(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Body() dto: Record<string, any>) {
    return this.integrations.runMocImpact(user.tenantId, user.id, this.scope(user), mocId, dto);
  }

  @Patch('moc/:mocId/psi-impact/items/:itemId')
  @Permissions('psi.integration.moc.assess')
  updateMocItem(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) {
    return this.integrations.updateMocImpactItem(user.tenantId, user.id, this.scope(user), mocId, itemId, dto);
  }

  @Post('moc/:mocId/psi-impact/items/:itemId/create-action')
  @Permissions('psi.integration.action.create')
  createMocItemAction(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) {
    return this.integrations.createMocItemAction(user.tenantId, user.id, this.scope(user), mocId, itemId, dto);
  }

  @Post('moc/:mocId/psi-impact/items/:itemId/verify')
  @Permissions('psi.integration.link.verify')
  verifyMocItem(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) {
    return this.integrations.verifyMocImpactItem(user.tenantId, user.id, this.scope(user), mocId, itemId, dto);
  }

  @Post('moc/:mocId/psi-impact/override-closure-blocker')
  @Permissions('psi.integration.moc.override_blocker')
  overrideMocBlocker(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Body() dto: Record<string, any>) {
    return this.integrations.overrideMocClosureBlocker(user.tenantId, user.id, this.scope(user), mocId, dto);
  }

  @Get('pssr/:pssrId/psi-readiness')
  @Permissions('psi.integration.pssr.view')
  pssrReadiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string) {
    return this.integrations.pssrReadiness(user.tenantId, this.scope(user), pssrId);
  }

  @Post('pssr/:pssrId/psi-readiness/run')
  @Permissions('psi.integration.pssr.run_readiness')
  runPssrReadiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Body() dto: Record<string, any>) {
    return this.integrations.runPssrReadiness(user.tenantId, user.id, this.scope(user), pssrId, dto);
  }

  @Get('pssr/:pssrId/psi-readiness/blockers')
  @Permissions('psi.integration.pssr.view')
  pssrBlockers(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string) {
    return this.integrations.pssrBlockers(user.tenantId, this.scope(user), pssrId);
  }

  @Post('pssr/:pssrId/psi-readiness/blockers/:blockerId/clear')
  @Permissions('psi.integration.pssr.clear_blocker')
  clearPssrBlocker(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.integrations.clearPssrBlocker(user.tenantId, user.id, this.scope(user), pssrId, blockerId, dto);
  }

  @Post('pssr/:pssrId/psi-readiness/blockers/:blockerId/create-action')
  @Permissions('psi.integration.action.create')
  createPssrBlockerAction(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.integrations.createPssrBlockerAction(user.tenantId, user.id, this.scope(user), pssrId, blockerId, dto);
  }

  @Post('pssr/:pssrId/psi-readiness/blockers/:blockerId/override')
  @Permissions('psi.integration.pssr.override_blocker')
  overridePssrBlocker(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) {
    return this.integrations.overridePssrBlocker(user.tenantId, user.id, this.scope(user), pssrId, blockerId, dto);
  }

  @Get('hazop/:hazopId/psi-basis')
  @Permissions('psi.integration.hazop.view')
  hazopBasis(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string) {
    return this.integrations.hazopBasis(user.tenantId, this.scope(user), hazopId);
  }

  @Post('hazop/:hazopId/psi-basis/link')
  @Permissions('psi.integration.hazop.link_basis')
  linkHazopBasis(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string, @Body() dto: Record<string, any>) {
    return this.integrations.linkHazopBasis(user.tenantId, user.id, this.scope(user), hazopId, dto);
  }

  @Delete('hazop/:hazopId/psi-basis/:basisLinkId')
  @Permissions('psi.integration.hazop.link_basis')
  unlinkHazopBasis(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string, @Param('basisLinkId') basisLinkId: string, @Body() dto: Record<string, any>) {
    return this.integrations.unlinkHazopBasis(user.tenantId, user.id, this.scope(user), hazopId, basisLinkId, dto);
  }

  @Post('hazop/:hazopId/psi-basis/check-current')
  @Permissions('psi.integration.sync.run')
  checkHazopCurrent(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string) {
    return this.integrations.checkHazopCurrent(user.tenantId, user.id, this.scope(user), hazopId);
  }

  @Post('hazop/:hazopId/psi-actions')
  @Permissions('psi.integration.hazop.create_psi_action')
  createHazopPsiAction(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string, @Body() dto: Record<string, any>) {
    return this.integrations.createHazopPsiAction(user.tenantId, user.id, this.scope(user), hazopId, dto);
  }

  @Get('hazop/:hazopId/psi-actions')
  @Permissions('psi.integration.hazop.view')
  hazopPsiActions(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string) {
    return this.integrations.hazopPsiActions(user.tenantId, this.scope(user), hazopId);
  }

  @Patch('hazop/:hazopId/psi-actions/:actionId')
  @Permissions('psi.integration.hazop.create_psi_action')
  updateHazopPsiAction(@CurrentUser() user: RequestUser, @Param('hazopId') hazopId: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) {
    return this.integrations.updateHazopPsiAction(user.tenantId, user.id, this.scope(user), hazopId, actionId, dto);
  }

  @Get('mechanical-integrity/equipment/:equipmentId/psi-readiness')
  @Permissions('psi.integration.mi.view')
  miReadiness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.integrations.miReadiness(user.tenantId, this.scope(user), equipmentId);
  }

  @Post('mechanical-integrity/equipment/:equipmentId/psi-readiness/run')
  @Permissions('psi.integration.mi.run_sync_check')
  runMiReadiness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: Record<string, any>) {
    return this.integrations.runMiReadiness(user.tenantId, user.id, this.scope(user), equipmentId, dto);
  }

  @Get('mechanical-integrity/equipment/:equipmentId/psi-readiness/impacts')
  @Permissions('psi.integration.mi.view')
  miImpacts(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) {
    return this.integrations.miImpacts(user.tenantId, this.scope(user), equipmentId);
  }

  @Post('mechanical-integrity/equipment/:equipmentId/psi-readiness/impacts/:impactId/resolve')
  @Permissions('psi.integration.mi.resolve_impact')
  resolveMiImpact(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Param('impactId') impactId: string, @Body() dto: Record<string, any>) {
    return this.integrations.resolveMiImpact(user.tenantId, user.id, this.scope(user), equipmentId, impactId, dto);
  }

  @Post('mechanical-integrity/equipment/:equipmentId/psi-sync-check')
  @Permissions('psi.integration.mi.run_sync_check')
  runMiSync(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() dto: Record<string, any>) {
    return this.integrations.runMiSyncCheck(user.tenantId, user.id, this.scope(user), equipmentId, dto);
  }

  private scope(user: RequestUser): Scope {
    const scope: Scope = {};
    if (user.siteIds) scope.allowedSiteIds = user.siteIds;
    if (user.selectedSiteId !== undefined) scope.selectedSiteId = user.selectedSiteId;
    if (user.corporateView !== undefined) scope.corporateView = user.corporateView;
    return scope;
  }
}
