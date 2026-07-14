import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import {
  BulkGenerateHazopScenariosDto,
  CreateHazopNodeDto,
  CreateHazopRecommendationDto,
  CreateHazopScenarioDto,
  CreateHazopStudyDto,
  HazopCommentDto,
  HazopFilterDto,
  HazopIplValidationDto,
  HazopRecommendationActionDto,
  HazopRecommendationDeferralDto,
  HazopRecommendationEvidenceDto,
  HazopRecommendationVerificationDto,
  HazopRiskAcceptanceDecisionDto,
  HazopRiskAcceptanceDto,
  HazopRiskBulkLopaDto,
  HazopRiskBulkOwnerDto,
  HazopRiskUpdateDto,
  HazopSafeguardActionDto,
  HazopSafeguardDto,
  HazopSafeguardGapDto,
  HazopSafeguardLinkDto,
  HazopSafeguardTestStatusDto,
  HazopAttendanceDto,
  HazopBulkAttendanceDto,
  HazopSessionActionDto,
  HazopSessionDecisionDto,
  HazopSessionDto,
  HazopSessionMinutesDto,
  HazopSessionRescheduleDto,
  HazopTeamMemberDto,
  HazopTeamReplaceDto,
  ReorderHazopNodesDto,
  UpdateHazopStudyDto
} from './dto/hazop.dto';
import { HazopService } from './hazop.service';

@ApiTags('hazop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('hazop')
export class HazopController {
  constructor(private readonly hazop: HazopService) {}

  @Get()
  @Permissions(PermissionKeys.HAZOPRead)
  list(@CurrentUser() user: RequestUser, @Query() query: HazopFilterDto) {
    return this.hazop.list(user.tenantId, query, this.scope(user), user.id);
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboard(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboard(user.tenantId, this.scope(user));
  }

  @Get('dashboard/kpis')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  kpis(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardKpis(user.tenantId, this.scope(user));
  }

  @Get('dashboard/summary')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardSummary(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardKpis(user.tenantId, this.scope(user));
  }

  @Get('dashboard/studies')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardStudies(@CurrentUser() user: RequestUser, @Query() query: HazopFilterDto) {
    return this.hazop.dashboardStudies(user.tenantId, query, this.scope(user), user.id);
  }

  @Get('dashboard/risk-overview')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardRiskOverview(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardRiskOverview(user.tenantId, this.scope(user));
  }

  @Get('dashboard/status-distribution')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardStatusDistribution(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardStatusDistribution(user.tenantId, this.scope(user));
  }

  @Get('dashboard/high-risk-scenarios')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  highRisk(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardHighRisk(user.tenantId, this.scope(user));
  }

  @Get('dashboard/recommendation-health')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  recommendationHealth(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardRecommendationHealth(user.tenantId, this.scope(user));
  }

  @Get('dashboard/revalidation')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  revalidation(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardRevalidation(user.tenantId, this.scope(user));
  }

  @Get('dashboard/revalidation-due')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  revalidationDue(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardRevalidation(user.tenantId, this.scope(user));
  }

  @Get('dashboard/overdue')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardOverdue(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardOverdue(user.tenantId, this.scope(user));
  }

  @Get('dashboard/high-critical')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardHighCritical(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardHighRisk(user.tenantId, this.scope(user));
  }

  @Get('dashboard/lopa-required')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardLopaRequired(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardLopaRequired(user.tenantId, this.scope(user));
  }

  @Get('dashboard/team-signoff')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardTeamSignoff(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardTeamSignoff(user.tenantId, this.scope(user));
  }

  @Get('dashboard/recent-activity')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  recentActivity(@CurrentUser() user: RequestUser) {
    return this.hazop.recentActivity(user.tenantId, this.scope(user));
  }

  @Get('dashboard/trends')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardTrends(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardTrends(user.tenantId, this.scope(user));
  }

  @Post('dashboard/export')
  @Permissions(PermissionKeys.HAZOPDashboardView)
  dashboardExport(@CurrentUser() user: RequestUser) {
    return this.hazop.dashboardExport(user.tenantId, this.scope(user));
  }

  @Get('new/context')
  @Permissions(PermissionKeys.HAZOPRead)
  newContext(@CurrentUser() user: RequestUser) {
    return this.hazop.newContext(user.tenantId, this.scope(user));
  }

  @Get('config/guidewords')
  @Permissions(PermissionKeys.HAZOPRead)
  guidewords(@CurrentUser() user: RequestUser) {
    return this.hazop.configGuidewords(user.tenantId);
  }

  @Get('config/parameters')
  @Permissions(PermissionKeys.HAZOPRead)
  parameters(@CurrentUser() user: RequestUser) {
    return this.hazop.configParameters(user.tenantId);
  }

  @Get('config/risk-matrices')
  @Permissions(PermissionKeys.HAZOPRead)
  riskMatrices(@CurrentUser() user: RequestUser) {
    return this.hazop.configRiskMatrices(user.tenantId);
  }

  @Get('config/templates')
  @Permissions(PermissionKeys.HAZOPRead)
  templates(@CurrentUser() user: RequestUser) {
    return this.hazop.configTemplates(user.tenantId);
  }

  @Post()
  @Permissions(PermissionKeys.HAZOPCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateHazopStudyDto) {
    return this.hazop.create(user.tenantId, user.id, dto, this.scope(user));
  }

  @Get(':id')
  @Permissions(PermissionKeys.HAZOPRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.get(user.tenantId, id, this.scope(user));
  }

  @Get(':id/overview')
  @Permissions(PermissionKeys.HAZOPRead)
  overview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.overview(user.tenantId, id, this.scope(user), user.permissions ?? []);
  }

  @Get(':id/overview/:section')
  @Permissions(PermissionKeys.HAZOPRead)
  overviewSection(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('section') section: string) {
    return this.hazop.overviewSection(user.tenantId, id, section, this.scope(user), user.permissions ?? []);
  }

  @Post(':id/overview/export')
  @Permissions(PermissionKeys.HAZOPExport)
  exportOverview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportOverview(user.tenantId, user.id, id, this.scope(user), user.permissions ?? []);
  }

  @Patch(':id')
  @Permissions(PermissionKeys.HAZOPEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateHazopStudyDto) {
    return this.hazop.update(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id')
  @Permissions(PermissionKeys.HAZOPDelete)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.delete(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/submit')
  @Permissions(PermissionKeys.HAZOPEdit)
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.transition(user.tenantId, user.id, id, 'submit', this.scope(user));
  }

  @Post(':id/start-preparation')
  @Permissions(PermissionKeys.HAZOPEdit)
  startPreparation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.transition(user.tenantId, user.id, id, 'start-preparation', this.scope(user));
  }

  @Post(':id/start-study')
  @Permissions(PermissionKeys.HAZOPEdit)
  startStudy(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.transition(user.tenantId, user.id, id, 'start-study', this.scope(user));
  }

  @Post(':id/request-approval')
  @Permissions(PermissionKeys.HAZOPEdit)
  requestApproval(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.transition(user.tenantId, user.id, id, 'request-approval', this.scope(user));
  }

  @Post(':id/approve')
  @Permissions(PermissionKeys.HAZOPApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopCommentDto) {
    return this.hazop.transition(user.tenantId, user.id, id, 'approve', this.scope(user), dto.comment);
  }

  @Post(':id/close')
  @Permissions(PermissionKeys.HAZOPClose)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopCommentDto) {
    return this.hazop.transition(user.tenantId, user.id, id, 'close', this.scope(user), dto.comment);
  }

  @Post(':id/reopen')
  @Permissions(PermissionKeys.HAZOPEdit)
  reopen(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopCommentDto) {
    return this.hazop.transition(user.tenantId, user.id, id, 'reopen', this.scope(user), dto.reason ?? dto.comment);
  }

  @Post(':id/cancel')
  @Permissions(PermissionKeys.HAZOPCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopCommentDto) {
    return this.hazop.transition(user.tenantId, user.id, id, 'cancel', this.scope(user), dto.reason ?? dto.comment);
  }

  @Get(':id/nodes')
  @Permissions(PermissionKeys.HAZOPNodeView)
  nodes(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.get(user.tenantId, id, this.scope(user)).then((study) => study.nodes);
  }

  @Get(':id/nodes/context')
  @Permissions(PermissionKeys.HAZOPNodeView)
  nodesContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.nodesContext(user.tenantId, id, this.scope(user));
  }

  @Post(':id/nodes')
  @Permissions(PermissionKeys.HAZOPNodeCreate)
  addNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateHazopNodeDto) {
    return this.hazop.addNode(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/nodes/:nodeId')
  @Permissions(PermissionKeys.HAZOPNodeView)
  getNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.getNodeDetail(user.tenantId, id, nodeId, this.scope(user));
  }

  @Get(':id/nodes/:nodeId/equipment')
  @Permissions(PermissionKeys.HAZOPNodeView)
  nodeEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.nodeEquipment(user.tenantId, id, nodeId, this.scope(user));
  }

  @Get(':id/nodes/:nodeId/documents')
  @Permissions(PermissionKeys.HAZOPNodeView)
  nodeDocuments(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.nodeDocuments(user.tenantId, id, nodeId, this.scope(user));
  }

  @Get(':id/nodes/:nodeId/parameters')
  @Permissions(PermissionKeys.HAZOPNodeView)
  nodeParameters(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.nodeParameters(user.tenantId, id, nodeId, this.scope(user));
  }

  @Post(':id/nodes/:nodeId/parameters')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  replaceNodeParameters(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string, @Body() body: { parameters?: Record<string, unknown>[] }) {
    return this.hazop.replaceNodeParameters(user.tenantId, user.id, id, nodeId, body.parameters ?? [], this.scope(user));
  }

  @Get(':id/parameters/master')
  @Permissions(PermissionKeys.HAZOPNodeView)
  masterParameters(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.masterParametersForStudy(user.tenantId, id, this.scope(user));
  }

  @Post(':id/parameters/custom')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  createCustomParameter(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.hazop.createCustomParameter(user.tenantId, user.id, id, body, this.scope(user));
  }

  @Patch(':id/nodes/:nodeId')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  updateNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string, @Body() dto: CreateHazopNodeDto) {
    return this.hazop.updateNode(user.tenantId, user.id, id, nodeId, dto, this.scope(user));
  }

  @Delete(':id/nodes/:nodeId')
  @Permissions(PermissionKeys.HAZOPNodeDelete)
  deleteNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.deleteNode(user.tenantId, user.id, id, nodeId, this.scope(user));
  }

  @Post(':id/nodes/:nodeId/duplicate')
  @Permissions(PermissionKeys.HAZOPNodeCreate)
  duplicateNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.duplicateNode(user.tenantId, user.id, id, nodeId, this.scope(user));
  }

  @Post(':id/nodes/reorder')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  reorderNodes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReorderHazopNodesDto) {
    return this.hazop.reorderNodes(user.tenantId, user.id, id, dto.nodeIds, this.scope(user));
  }

  @Post(':id/nodes/:nodeId/mark-complete')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  markNodeComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.setNodeStatus(user.tenantId, user.id, id, nodeId, 'Completed', this.scope(user));
  }

  @Post(':id/nodes/:nodeId/reopen')
  @Permissions(PermissionKeys.HAZOPNodeEdit)
  reopenNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.setNodeStatus(user.tenantId, user.id, id, nodeId, 'Draft', this.scope(user));
  }

  @Get(':id/nodes/:nodeId/scenarios')
  @Permissions(PermissionKeys.HAZOPScenarioView)
  nodeScenarios(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.hazop.getNodeScenarios(user.tenantId, id, nodeId, this.scope(user));
  }

  @Post(':id/nodes/:nodeId/scenarios')
  @Permissions(PermissionKeys.HAZOPScenarioCreate)
  addNodeScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('nodeId') nodeId: string, @Body() dto: CreateHazopScenarioDto) {
    return this.hazop.addScenario(user.tenantId, user.id, id, { ...dto, nodeId }, this.scope(user));
  }

  @Get(':id/scenarios')
  @Permissions(PermissionKeys.HAZOPScenarioView)
  scenarios(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.get(user.tenantId, id, this.scope(user)).then((study) => study.scenarios);
  }

  @Get(':id/risk/summary')
  @Permissions(PermissionKeys.HAZOPRiskView)
  riskSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.riskSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk/matrix')
  @Permissions(PermissionKeys.HAZOPRiskView)
  riskMatrix(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.riskMatrix(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk/register')
  @Permissions(PermissionKeys.HAZOPRiskView)
  riskRegister(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.riskRegister(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/risk/high-critical')
  @Permissions(PermissionKeys.HAZOPRiskView)
  highCriticalRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.highCriticalRisk(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk/lopa-triggers')
  @Permissions(PermissionKeys.HAZOPRiskView)
  lopaTriggers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.lopaTriggers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk/history')
  @Permissions(PermissionKeys.HAZOPRiskView)
  riskHistory(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.riskHistory(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/risk/acceptances')
  @Permissions(PermissionKeys.HAZOPRiskView)
  riskAcceptances(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.riskAcceptances(user.tenantId, id, this.scope(user));
  }

  @Post(':id/risk/bulk-update-owner')
  @Permissions(PermissionKeys.HAZOPRiskEdit)
  bulkRiskOwner(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopRiskBulkOwnerDto) {
    return this.hazop.bulkRiskOwner(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk/bulk-mark-lopa-required')
  @Permissions(PermissionKeys.HAZOPRiskLopaMark)
  bulkRiskLopa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopRiskBulkLopaDto) {
    return this.hazop.bulkMarkLopa(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk/export')
  @Permissions(PermissionKeys.HAZOPRiskExport)
  exportRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportRiskRegister(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/scenarios')
  @Permissions(PermissionKeys.HAZOPScenarioCreate)
  addScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateHazopScenarioDto) {
    return this.hazop.addScenario(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/risk')
  @Permissions(PermissionKeys.HAZOPRiskEdit)
  createScenarioRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopRiskUpdateDto) {
    return this.hazop.updateScenarioRisk(user.tenantId, user.id, id, scenarioId, dto, this.scope(user));
  }

  @Patch(':id/scenarios/:scenarioId/risk')
  @Permissions(PermissionKeys.HAZOPRiskEdit)
  updateScenarioRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopRiskUpdateDto) {
    return this.hazop.updateScenarioRisk(user.tenantId, user.id, id, scenarioId, dto, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/risk/recalculate')
  @Permissions(PermissionKeys.HAZOPRiskRecalculate)
  recalculateScenarioRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string) {
    return this.hazop.recalculateScenarioRisk(user.tenantId, user.id, id, scenarioId, this.scope(user));
  }

  @Patch(':id/scenarios/:scenarioId')
  @Permissions(PermissionKeys.HAZOPScenarioEdit)
  updateScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: CreateHazopScenarioDto) {
    return this.hazop.updateScenario(user.tenantId, user.id, id, scenarioId, dto, this.scope(user));
  }

  @Delete(':id/scenarios/:scenarioId')
  @Permissions(PermissionKeys.HAZOPScenarioDelete)
  deleteScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string) {
    return this.hazop.deleteScenario(user.tenantId, user.id, id, scenarioId, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/duplicate')
  @Permissions(PermissionKeys.HAZOPScenarioCreate)
  duplicateScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string) {
    return this.hazop.duplicateScenario(user.tenantId, user.id, id, scenarioId, this.scope(user));
  }

  @Post(':id/scenarios/bulk-generate')
  @Permissions(PermissionKeys.HAZOPScenarioCreate)
  bulkGenerateScenarios(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: BulkGenerateHazopScenariosDto) {
    return this.hazop.bulkGenerateScenarios(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/mark-lopa-required')
  @Permissions(PermissionKeys.HAZOPRiskLopaMark)
  markScenarioLopa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopCommentDto) {
    return this.hazop.markScenarioLopaRequired(user.tenantId, user.id, id, scenarioId, dto.reason ?? dto.comment ?? 'Manual LOPA trigger', this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/clear-lopa-required')
  @Permissions(PermissionKeys.HAZOPRiskLopaClear)
  clearScenarioLopa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopCommentDto) {
    return this.hazop.clearScenarioLopaRequired(user.tenantId, user.id, id, scenarioId, dto.reason ?? dto.comment ?? 'Manual LOPA cleared', this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/risk-acceptance')
  @Permissions(PermissionKeys.HAZOPRiskAccept)
  requestRiskAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopRiskAcceptanceDto) {
    return this.hazop.requestRiskAcceptance(user.tenantId, user.id, id, scenarioId, dto, this.scope(user));
  }

  @Patch(':id/risk-acceptance/:acceptanceId')
  @Permissions(PermissionKeys.HAZOPRiskAccept)
  updateRiskAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('acceptanceId') acceptanceId: string, @Body() dto: HazopRiskAcceptanceDto) {
    return this.hazop.updateRiskAcceptance(user.tenantId, user.id, id, acceptanceId, dto, this.scope(user));
  }

  @Post(':id/risk-acceptance/:acceptanceId/approve')
  @Permissions(PermissionKeys.HAZOPRiskAcceptApprove)
  approveRiskAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('acceptanceId') acceptanceId: string, @Body() dto: HazopRiskAcceptanceDecisionDto) {
    return this.hazop.decideRiskAcceptance(user.tenantId, user.id, id, acceptanceId, 'Approved', dto.comment, this.scope(user));
  }

  @Post(':id/risk-acceptance/:acceptanceId/reject')
  @Permissions(PermissionKeys.HAZOPRiskAcceptApprove)
  rejectRiskAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('acceptanceId') acceptanceId: string, @Body() dto: HazopRiskAcceptanceDecisionDto) {
    return this.hazop.decideRiskAcceptance(user.tenantId, user.id, id, acceptanceId, 'Rejected', dto.reason ?? dto.comment, this.scope(user));
  }

  @Post(':id/risk-acceptance/:acceptanceId/expire')
  @Permissions(PermissionKeys.HAZOPRiskAcceptApprove)
  expireRiskAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('acceptanceId') acceptanceId: string, @Body() dto: HazopRiskAcceptanceDecisionDto) {
    return this.hazop.decideRiskAcceptance(user.tenantId, user.id, id, acceptanceId, 'Expired', dto.reason ?? dto.comment, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/close')
  @Permissions(PermissionKeys.HAZOPScenarioEdit)
  closeScenario(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string) {
    return this.hazop.setScenarioStatus(user.tenantId, user.id, id, scenarioId, 'Closed', this.scope(user));
  }

  @Get(':id/safeguards/context')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safeguardsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/safeguards/summary')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safeguardsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/safeguards/register')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.safeguardsRegister(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/safeguards/ipl-candidates')
  @Permissions(PermissionKeys.HAZOPIplView)
  safeguardsIplCandidates(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safeguardsIplCandidates(user.tenantId, id, this.scope(user));
  }

  @Get(':id/safeguards/gaps')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardGaps(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safeguardGaps(user.tenantId, id, this.scope(user));
  }

  @Get(':id/safeguards/proof-test-status')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardProofTests(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safeguardProofTests(user.tenantId, id, this.scope(user));
  }

  @Get(':id/safeguards/:safeguardId')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.safeguardDetail(user.tenantId, id, safeguardId, this.scope(user));
  }

  @Patch(':id/safeguards/:safeguardId')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  updateSafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardDto) {
    return this.hazop.updateEnhancedSafeguard(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Delete(':id/safeguards/:safeguardId')
  @Permissions(PermissionKeys.HAZOPSafeguardsDelete)
  deleteSafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.deleteEnhancedSafeguard(user.tenantId, user.id, id, safeguardId, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/mark-ipl-candidate')
  @Permissions(PermissionKeys.HAZOPSafeguardsMarkIpl)
  markSafeguardIpl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.markSafeguardIplCandidate(user.tenantId, user.id, id, safeguardId, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/mark-credited')
  @Permissions(PermissionKeys.HAZOPSafeguardsMarkCredited)
  markSafeguardCredited(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.setSafeguardCredited(user.tenantId, user.id, id, safeguardId, true, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/mark-not-credited')
  @Permissions(PermissionKeys.HAZOPSafeguardsMarkCredited)
  markSafeguardNotCredited(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.setSafeguardCredited(user.tenantId, user.id, id, safeguardId, false, this.scope(user));
  }

  @Get(':id/safeguards/:safeguardId/ipl-validation')
  @Permissions(PermissionKeys.HAZOPIplView)
  safeguardIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.safeguardIplValidation(user.tenantId, id, safeguardId, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/ipl-validation')
  @Permissions(PermissionKeys.HAZOPIplValidate)
  createIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopIplValidationDto) {
    return this.hazop.createIplValidation(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Patch(':id/safeguards/:safeguardId/ipl-validation/:validationId')
  @Permissions(PermissionKeys.HAZOPIplValidate)
  updateIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Param('validationId') validationId: string, @Body() dto: HazopIplValidationDto) {
    return this.hazop.updateIplValidation(user.tenantId, user.id, id, safeguardId, validationId, dto, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/ipl-validation/:validationId/finalize')
  @Permissions(PermissionKeys.HAZOPIplFinalize)
  finalizeIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Param('validationId') validationId: string) {
    return this.hazop.finalizeIplValidation(user.tenantId, user.id, id, safeguardId, validationId, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/equipment-links')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  linkSafeguardEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardLinkDto) {
    return this.hazop.linkSafeguardEquipment(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Delete(':id/safeguards/:safeguardId/equipment-links/:linkId')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  unlinkSafeguardEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Param('linkId') linkId: string) {
    return this.hazop.unlinkSafeguardLink(user.tenantId, user.id, id, safeguardId, linkId, 'equipment', this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/document-links')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  linkSafeguardDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardLinkDto) {
    return this.hazop.linkSafeguardDocument(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Delete(':id/safeguards/:safeguardId/document-links/:linkId')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  unlinkSafeguardDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Param('linkId') linkId: string) {
    return this.hazop.unlinkSafeguardLink(user.tenantId, user.id, id, safeguardId, linkId, 'document', this.scope(user));
  }

  @Get(':id/safeguards/:safeguardId/test-status')
  @Permissions(PermissionKeys.HAZOPSafeguardsView)
  safeguardTestStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.safeguardTestStatus(user.tenantId, id, safeguardId, this.scope(user));
  }

  @Patch(':id/safeguards/:safeguardId/test-status')
  @Permissions(PermissionKeys.HAZOPSafeguardsEdit)
  updateSafeguardTestStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardTestStatusDto) {
    return this.hazop.updateSafeguardTestStatus(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/gaps')
  @Permissions(PermissionKeys.HAZOPSafeguardGapCreate)
  createSafeguardGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardGapDto) {
    return this.hazop.createSafeguardGap(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Patch(':id/safeguard-gaps/:gapId')
  @Permissions(PermissionKeys.HAZOPSafeguardGapCreate)
  updateSafeguardGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string, @Body() dto: HazopSafeguardGapDto) {
    return this.hazop.updateSafeguardGap(user.tenantId, user.id, id, gapId, dto, this.scope(user));
  }

  @Post(':id/safeguard-gaps/:gapId/create-action')
  @Permissions(PermissionKeys.HAZOPActionCreate)
  createSafeguardGapAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string, @Body() dto: HazopSafeguardActionDto) {
    return this.hazop.createSafeguardGapAction(user.tenantId, user.id, id, gapId, dto, this.scope(user));
  }

  @Post(':id/safeguard-gaps/:gapId/link-action')
  @Permissions(PermissionKeys.HAZOPActionCreate)
  linkSafeguardGapAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string, @Body() dto: HazopSafeguardActionDto) {
    return this.hazop.linkSafeguardGapAction(user.tenantId, user.id, id, gapId, dto, this.scope(user));
  }

  @Post(':id/safeguard-gaps/:gapId/close')
  @Permissions(PermissionKeys.HAZOPSafeguardGapClose)
  closeSafeguardGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string) {
    return this.hazop.closeSafeguardGap(user.tenantId, user.id, id, gapId, this.scope(user));
  }

  @Post(':id/safeguards/export')
  @Permissions(PermissionKeys.HAZOPSafeguardsExport)
  exportSafeguards(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportSafeguards(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/scenarios/:scenarioId/safeguards')
  @Permissions(PermissionKeys.HAZOPScenarioView)
  scenarioSafeguards(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string) {
    return this.hazop.getScenarioSafeguards(user.tenantId, id, scenarioId, this.scope(user));
  }

  @Post(':id/scenarios/:scenarioId/safeguards')
  @Permissions(PermissionKeys.HAZOPScenarioEdit)
  addScenarioSafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Body() dto: HazopSafeguardDto) {
    return this.hazop.addScenarioSafeguard(user.tenantId, user.id, id, scenarioId, dto, this.scope(user));
  }

  @Patch(':id/scenarios/:scenarioId/safeguards/:safeguardId')
  @Permissions(PermissionKeys.HAZOPScenarioEdit)
  updateScenarioSafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Param('safeguardId') safeguardId: string, @Body() dto: HazopSafeguardDto) {
    return this.hazop.updateScenarioSafeguard(user.tenantId, user.id, id, scenarioId, safeguardId, dto, this.scope(user));
  }

  @Delete(':id/scenarios/:scenarioId/safeguards/:safeguardId')
  @Permissions(PermissionKeys.HAZOPScenarioEdit)
  deleteScenarioSafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('scenarioId') scenarioId: string, @Param('safeguardId') safeguardId: string) {
    return this.hazop.deleteScenarioSafeguard(user.tenantId, user.id, id, scenarioId, safeguardId, this.scope(user));
  }

  @Get(':id/recommendations/context')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.recommendationsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/summary')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.recommendationsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/register')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.recommendationsRegister(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/recommendations/overdue')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationsOverdue(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.overdueRecommendations(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/closure-blockers')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationClosureBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.recommendationClosureBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendations(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.recommendationsRegister(user.tenantId, id, query, this.scope(user)).then((result) => result.rows);
  }

  @Get(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.recommendationDetail(user.tenantId, id, recommendationId, this.scope(user));
  }

  @Post(':id/recommendations')
  @Permissions(PermissionKeys.HAZOPRecommendationsCreate)
  addRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateHazopRecommendationDto) {
    return this.hazop.addRecommendation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.HAZOPRecommendationsEdit)
  updateRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: CreateHazopRecommendationDto) {
    return this.hazop.updateRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Delete(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.HAZOPRecommendationsDelete)
  deleteRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.deleteRecommendation(user.tenantId, user.id, id, recommendationId, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/cancel')
  @Permissions(PermissionKeys.HAZOPRecommendationsCancel)
  cancelRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopCommentDto) {
    return this.hazop.cancelRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/defer')
  @Permissions(PermissionKeys.HAZOPRecommendationsDefer)
  deferRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationDeferralDto) {
    return this.hazop.deferRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/request-verification')
  @Permissions(PermissionKeys.HAZOPRecommendationsVerify)
  requestRecommendationVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.requestRecommendationVerification(user.tenantId, user.id, id, recommendationId, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/verify')
  @Permissions(PermissionKeys.HAZOPRecommendationsVerify)
  verifyRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationVerificationDto) {
    return this.hazop.verifyRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/reject-verification')
  @Permissions(PermissionKeys.HAZOPRecommendationsVerify)
  rejectRecommendationVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationVerificationDto) {
    return this.hazop.rejectRecommendationVerification(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/create-action')
  @Permissions(PermissionKeys.HAZOPRecommendationsActionCreate)
  createAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationActionDto) {
    return this.hazop.createActionFromRecommendation(user.tenantId, user.id, id, recommendationId, this.scope(user), dto);
  }

  @Post(':id/recommendations/:recommendationId/link-action')
  @Permissions(PermissionKeys.HAZOPRecommendationsActionLink)
  linkRecommendationAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationActionDto) {
    return this.hazop.linkRecommendationAction(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Delete(':id/recommendations/:recommendationId/link-action')
  @Permissions(PermissionKeys.HAZOPRecommendationsActionLink)
  unlinkRecommendationAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.unlinkRecommendationAction(user.tenantId, user.id, id, recommendationId, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/sync-action')
  @Permissions(PermissionKeys.HAZOPRecommendationsActionLink)
  syncRecommendationAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.syncRecommendationAction(user.tenantId, user.id, id, recommendationId, this.scope(user));
  }

  @Get(':id/recommendations/:recommendationId/evidence')
  @Permissions(PermissionKeys.HAZOPRecommendationsView)
  recommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.hazop.recommendationEvidence(user.tenantId, id, recommendationId, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/evidence')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.HAZOPRecommendationsEvidenceUpload)
  addRecommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: HazopRecommendationEvidenceDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.hazop.addRecommendationEvidence(user.tenantId, user.id, id, recommendationId, dto, this.scope(user), file);
  }

  @Delete(':id/recommendations/:recommendationId/evidence/:evidenceId')
  @Permissions(PermissionKeys.HAZOPRecommendationsEvidenceUpload)
  deleteRecommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Param('evidenceId') evidenceId: string) {
    return this.hazop.deleteRecommendationEvidence(user.tenantId, user.id, id, recommendationId, evidenceId, this.scope(user));
  }

  @Post(':id/recommendations/export')
  @Permissions(PermissionKeys.HAZOPRecommendationsExport)
  exportRecommendations(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportRecommendations(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/team-sessions/context')
  @Permissions(PermissionKeys.HAZOPTeamView)
  teamSessionsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.teamSessionsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/summary')
  @Permissions(PermissionKeys.HAZOPTeamView)
  teamSessionsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.teamSessionsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/coverage')
  @Permissions(PermissionKeys.HAZOPTeamCoverageView)
  teamCoverage(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.teamCoverage(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/signoff-readiness')
  @Permissions(PermissionKeys.HAZOPTeamView)
  teamSignoffReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.teamSignoffReadiness(user.tenantId, id, this.scope(user));
  }

  @Post(':id/team-sessions/export')
  @Permissions(PermissionKeys.HAZOPSessionsExport)
  exportTeamSessions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportTeamSessions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/team')
  @Permissions(PermissionKeys.HAZOPTeamView)
  team(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.teamRegister(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/team')
  @Permissions(PermissionKeys.HAZOPTeamManage)
  addTeam(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopTeamMemberDto) {
    return this.hazop.addTeamMember(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/team/:memberId')
  @Permissions(PermissionKeys.HAZOPTeamView)
  teamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.hazop.teamMemberDetail(user.tenantId, id, memberId, this.scope(user));
  }

  @Patch(':id/team/:memberId')
  @Permissions(PermissionKeys.HAZOPTeamManage)
  updateTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: HazopTeamMemberDto) {
    return this.hazop.updateTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Delete(':id/team/:memberId')
  @Permissions(PermissionKeys.HAZOPTeamRemove)
  deleteTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.hazop.removeTeamMember(user.tenantId, user.id, id, memberId, this.scope(user), true);
  }

  @Post(':id/team/:memberId/remove')
  @Permissions(PermissionKeys.HAZOPTeamRemove)
  removeTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: HazopCommentDto) {
    return this.hazop.removeTeamMember(user.tenantId, user.id, id, memberId, this.scope(user), false, dto.reason ?? dto.comment);
  }

  @Post(':id/team/:memberId/replace')
  @Permissions(PermissionKeys.HAZOPTeamManage)
  replaceTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: HazopTeamReplaceDto) {
    return this.hazop.replaceTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Post(':id/team/:memberId/resend-invite')
  @Permissions(PermissionKeys.HAZOPTeamInvite)
  resendTeamInvite(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.hazop.resendTeamInvite(user.tenantId, user.id, id, memberId, this.scope(user));
  }

  @Get(':id/sessions')
  @Permissions(PermissionKeys.HAZOPSessionsView)
  sessions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.sessionsRegister(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/sessions')
  @Permissions(PermissionKeys.HAZOPSessionsCreate)
  createSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: HazopSessionDto) {
    return this.hazop.createSession(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId')
  @Permissions(PermissionKeys.HAZOPSessionsView)
  sessionDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.sessionDetail(user.tenantId, id, sessionId, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId')
  @Permissions(PermissionKeys.HAZOPSessionsEdit)
  updateSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionDto) {
    return this.hazop.updateSession(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/start')
  @Permissions(PermissionKeys.HAZOPSessionsEdit)
  startSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.startSession(user.tenantId, user.id, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/complete')
  @Permissions(PermissionKeys.HAZOPSessionsComplete)
  completeSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.completeSession(user.tenantId, user.id, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/reschedule')
  @Permissions(PermissionKeys.HAZOPSessionsEdit)
  rescheduleSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionRescheduleDto) {
    return this.hazop.rescheduleSession(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/cancel')
  @Permissions(PermissionKeys.HAZOPSessionsCancel)
  cancelSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopCommentDto) {
    return this.hazop.cancelSession(user.tenantId, user.id, id, sessionId, dto.reason ?? dto.comment, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/attendance')
  @Permissions(PermissionKeys.HAZOPSessionsView)
  attendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.sessionAttendance(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/attendance')
  @Permissions(PermissionKeys.HAZOPSessionsAttendanceManage)
  addAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopAttendanceDto) {
    return this.hazop.upsertAttendance(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/attendance/:attendanceId')
  @Permissions(PermissionKeys.HAZOPSessionsAttendanceManage)
  updateAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('attendanceId') attendanceId: string, @Body() dto: HazopAttendanceDto) {
    return this.hazop.updateAttendance(user.tenantId, user.id, id, sessionId, attendanceId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/attendance/bulk-mark')
  @Permissions(PermissionKeys.HAZOPSessionsAttendanceManage)
  bulkAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopBulkAttendanceDto) {
    return this.hazop.bulkMarkAttendance(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/minutes')
  @Permissions(PermissionKeys.HAZOPSessionsView)
  minutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.sessionMinutes(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/minutes')
  @Permissions(PermissionKeys.HAZOPSessionsMinutesManage)
  addMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionMinutesDto) {
    return this.hazop.upsertMinutes(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/minutes/:minutesId')
  @Permissions(PermissionKeys.HAZOPSessionsMinutesManage)
  updateMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('minutesId') minutesId: string, @Body() dto: HazopSessionMinutesDto) {
    return this.hazop.updateMinutes(user.tenantId, user.id, id, sessionId, minutesId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/minutes/:minutesId/approve')
  @Permissions(PermissionKeys.HAZOPSessionsMinutesManage)
  approveMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('minutesId') minutesId: string) {
    return this.hazop.approveMinutes(user.tenantId, user.id, id, sessionId, minutesId, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/decisions')
  @Permissions(PermissionKeys.HAZOPSessionsView)
  decisions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.sessionDecisions(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/decisions')
  @Permissions(PermissionKeys.HAZOPSessionsDecisionsManage)
  addDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionDecisionDto) {
    return this.hazop.addDecision(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/decisions/:decisionId')
  @Permissions(PermissionKeys.HAZOPSessionsDecisionsManage)
  updateDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('decisionId') decisionId: string, @Body() dto: HazopSessionDecisionDto) {
    return this.hazop.updateDecision(user.tenantId, user.id, id, sessionId, decisionId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId/decisions/:decisionId')
  @Permissions(PermissionKeys.HAZOPSessionsDecisionsManage)
  deleteDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('decisionId') decisionId: string) {
    return this.hazop.deleteDecision(user.tenantId, user.id, id, sessionId, decisionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/create-action')
  @Permissions(PermissionKeys.HAZOPSessionsActionsCreate)
  createSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionActionDto) {
    return this.hazop.createSessionAction(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/link-action')
  @Permissions(PermissionKeys.HAZOPSessionsActionsCreate)
  linkSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: HazopSessionActionDto) {
    return this.hazop.linkSessionAction(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId/link-action/:linkId')
  @Permissions(PermissionKeys.HAZOPSessionsActionsCreate)
  unlinkSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('linkId') linkId: string) {
    return this.hazop.unlinkSessionAction(user.tenantId, user.id, id, sessionId, linkId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/sync-actions')
  @Permissions(PermissionKeys.HAZOPSessionsActionsCreate)
  syncSessionActions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.hazop.syncSessionActions(user.tenantId, user.id, id, sessionId, this.scope(user));
  }

  @Get(':id/linked-records/summary')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  linkedRecordsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.linkedRecordsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/context')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  linkedRecordsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.linkedRecordsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/blockers')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  linkedRecordBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.linkedRecordBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/search')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  searchLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.searchLinkedRecords(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/linked-records')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.linkedRecordsRegister(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/linked-records')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsCreate)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.addLinkedRecord(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/linked-records/export')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsExport)
  exportLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportLinkedRecords(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsView)
  linkedRecordDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.hazop.linkedRecordDetail(user.tenantId, id, linkId, this.scope(user));
  }

  @Patch(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsEdit)
  updateLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.hazop.updateLinkedRecord(user.tenantId, user.id, id, linkId, dto, this.scope(user));
  }

  @Delete(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsDelete)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.hazop.removeLinkedRecord(user.tenantId, user.id, id, linkId, dto?.reason, this.scope(user));
  }

  @Post(':id/linked-records/:linkId/sync')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsSync)
  syncLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.hazop.syncLinkedRecord(user.tenantId, user.id, id, linkId, this.scope(user));
  }

  @Post(':id/linked-records/:linkId/mark-blocking')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsEdit)
  markLinkedRecordBlocking(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.hazop.markLinkedRecordBlocking(user.tenantId, user.id, id, linkId, dto, this.scope(user));
  }

  @Post(':id/linked-records/:linkId/resolve-blocker')
  @Permissions(PermissionKeys.HAZOPLinkedRecordsEdit)
  resolveLinkedRecordBlocker(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.hazop.resolveLinkedRecordBlocker(user.tenantId, user.id, id, dto.blockerId ?? linkId, dto, this.scope(user));
  }

  @Get(':id/review/readiness')
  @Permissions(PermissionKeys.HAZOPReviewView)
  reviewReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.reviewReadiness(user.tenantId, id, this.scope(user));
  }

  @Post(':id/review/readiness/recalculate')
  @Permissions(PermissionKeys.HAZOPReviewStart)
  recalculateReviewReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.recalculateReviewReadiness(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/review/blockers')
  @Permissions(PermissionKeys.HAZOPReviewView)
  reviewBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.reviewBlockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/review/workflow')
  @Permissions(PermissionKeys.HAZOPReviewView)
  reviewWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.reviewWorkflow(user.tenantId, id, this.scope(user));
  }

  @Post(':id/review/start')
  @Permissions(PermissionKeys.HAZOPReviewStart)
  startReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.startReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/request-approval')
  @Permissions(PermissionKeys.HAZOPReviewRequestApproval)
  requestReviewApproval(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.requestReviewApproval(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/approve')
  @Permissions(PermissionKeys.HAZOPReviewApprove)
  approveReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.approveReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/reject')
  @Permissions(PermissionKeys.HAZOPReviewReject)
  rejectReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.rejectReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/return-for-rework')
  @Permissions(PermissionKeys.HAZOPReviewReturnForRework)
  returnForRework(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.returnForRework(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/close')
  @Permissions(PermissionKeys.HAZOPReviewClose)
  closeReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.closeReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/review/reopen')
  @Permissions(PermissionKeys.HAZOPReviewReopen)
  reopenReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.reopenReview(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/review/comments')
  @Permissions(PermissionKeys.HAZOPReviewView)
  reviewComments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.reviewComments(user.tenantId, id, this.scope(user));
  }

  @Post(':id/review/comments')
  @Permissions(PermissionKeys.HAZOPReviewCommentsCreate)
  addReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.hazop.addReviewComment(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/review/comments/:commentId')
  @Permissions(PermissionKeys.HAZOPReviewCommentsCreate)
  updateReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.updateReviewComment(user.tenantId, user.id, id, commentId, dto, this.scope(user));
  }

  @Post(':id/review/comments/:commentId/resolve')
  @Permissions(PermissionKeys.HAZOPReviewCommentsResolve)
  resolveReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.resolveReviewComment(user.tenantId, user.id, id, commentId, dto, this.scope(user));
  }

  @Post(':id/review/comments/:commentId/create-action')
  @Permissions(PermissionKeys.HAZOPReviewCommentsResolve)
  createReviewCommentAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.createReviewCommentAction(user.tenantId, user.id, id, commentId, dto, this.scope(user));
  }

  @Post(':id/review/export-package')
  @Permissions(PermissionKeys.HAZOPReviewExportPackage)
  exportReviewPackage(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportReviewPackage(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/signoffs')
  @Permissions(PermissionKeys.HAZOPSignoffView)
  signoffs(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.signoffs(user.tenantId, id, this.scope(user));
  }

  @Post(':id/signoffs/generate')
  @Permissions(PermissionKeys.HAZOPSignoffRequest)
  generateSignoffs(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.generateSignoffs(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/signoffs/:signoffId/request')
  @Permissions(PermissionKeys.HAZOPSignoffRequest)
  requestSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) {
    return this.hazop.requestSignoff(user.tenantId, user.id, id, signoffId, dto, this.scope(user));
  }

  @Post(':id/signoffs/:signoffId/sign')
  @Permissions(PermissionKeys.HAZOPSignoffSign)
  signHazopSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) {
    return this.hazop.signHazopSignoff(user.tenantId, user.id, id, signoffId, dto, this.scope(user));
  }

  @Post(':id/signoffs/:signoffId/reject')
  @Permissions(PermissionKeys.HAZOPSignoffReject)
  rejectHazopSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) {
    return this.hazop.rejectHazopSignoff(user.tenantId, user.id, id, signoffId, dto, this.scope(user));
  }

  @Post(':id/signoffs/:signoffId/delegate')
  @Permissions(PermissionKeys.HAZOPSignoffDelegate)
  delegateHazopSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) {
    return this.hazop.delegateHazopSignoff(user.tenantId, user.id, id, signoffId, dto, this.scope(user));
  }

  @Post(':id/signoffs/:signoffId/supersede')
  @Permissions(PermissionKeys.HAZOPSignoffRequest)
  supersedeHazopSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('signoffId') signoffId: string, @Body() dto: Record<string, any>) {
    return this.hazop.supersedeHazopSignoff(user.tenantId, user.id, id, signoffId, dto, this.scope(user));
  }

  @Get(':id/attachments/summary')
  @Permissions(PermissionKeys.HAZOPAttachmentsView)
  attachmentSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.attachmentSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.HAZOPAttachmentsView)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.attachmentsRegister(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.HAZOPAttachmentsUpload)
  addAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.hazop.addAttachment(user.tenantId, user.id, id, dto, this.scope(user), file);
  }

  @Post(':id/attachments/export')
  @Permissions(PermissionKeys.HAZOPAttachmentsExport)
  exportAttachments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.exportAttachments(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.HAZOPAttachmentsView)
  attachmentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.hazop.attachmentDetail(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/preview')
  @Permissions(PermissionKeys.HAZOPAttachmentsView)
  attachmentPreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.hazop.attachmentDetail(user.tenantId, user.id, id, attachmentId, this.scope(user), 'preview');
  }

  @Get(':id/attachments/:attachmentId/download')
  @Permissions(PermissionKeys.HAZOPAttachmentsDownload)
  attachmentDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.hazop.downloadAttachment(user.tenantId, user.id, id, attachmentId, this.scope(user));
  }

  @Patch(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.HAZOPAttachmentsEdit)
  updateAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.updateAttachment(user.tenantId, user.id, id, attachmentId, dto, this.scope(user));
  }

  @Post(':id/attachments/:attachmentId/replace')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.HAZOPAttachmentsReplace)
  replaceAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: Record<string, any>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.hazop.replaceAttachment(user.tenantId, user.id, id, attachmentId, dto, this.scope(user), file);
  }

  @Post(':id/attachments/:attachmentId/archive')
  @Permissions(PermissionKeys.HAZOPAttachmentsArchive)
  archiveAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.archiveAttachment(user.tenantId, user.id, id, attachmentId, dto, this.scope(user));
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.HAZOPAttachmentsDelete)
  deleteAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: Record<string, any>) {
    return this.hazop.deleteAttachment(user.tenantId, user.id, id, attachmentId, dto ?? {}, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/versions')
  @Permissions(PermissionKeys.HAZOPAttachmentsView)
  attachmentVersions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.hazop.attachmentVersions(user.tenantId, id, attachmentId, this.scope(user));
  }

  @Get(':id/attachments/:attachmentId/access-logs')
  @Permissions(PermissionKeys.HAZOPAttachmentsAccessLogsView)
  attachmentAccessLogs(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.hazop.attachmentAccessLogs(user.tenantId, id, attachmentId, this.scope(user));
  }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.HAZOPHistoryView)
  historySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.historySummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/history/safety-critical')
  @Permissions(PermissionKeys.HAZOPHistorySafetyCriticalView)
  safetyCriticalHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hazop.safetyCriticalHistory(user.tenantId, id, this.scope(user), this.has(user, PermissionKeys.HAZOPHistoryViewSensitive));
  }

  @Get(':id/history')
  @Permissions(PermissionKeys.HAZOPHistoryView)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) {
    return this.hazop.historyRegister(user.tenantId, id, query, this.scope(user), this.has(user, PermissionKeys.HAZOPHistoryViewSensitive));
  }

  @Post(':id/history/export')
  @Permissions(PermissionKeys.HAZOPHistoryExport)
  exportHistory(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() query: Record<string, any>) {
    return this.hazop.exportHistory(user.tenantId, user.id, id, query ?? {}, this.scope(user), this.has(user, PermissionKeys.HAZOPHistoryViewSensitive));
  }

  @Get(':id/history/:eventId')
  @Permissions(PermissionKeys.HAZOPHistoryView)
  historyEventDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) {
    return this.hazop.historyEventDetail(user.tenantId, id, eventId, this.scope(user), this.has(user, PermissionKeys.HAZOPHistoryViewSensitive));
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }

  private has(user: RequestUser, permission: string) {
    return (user.permissions ?? []).includes(permission) || (user.permissions ?? []).includes('hazop:manage');
  }
}
