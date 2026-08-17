import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiReadinessService } from './mi-readiness.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-readiness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/readiness')
export class MiReadinessController {
  constructor(private readonly readiness: MiReadinessService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  list(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, query); }

  @Get('dashboard')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, query); }

  @Get('summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  summary(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.summary(user, query); }

  @Get('startup-blockers')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  startupBlockers(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, { ...query, startupBlocked: 'true' }); }

  @Get('not-fit')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  notFit(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, { ...query, decision: 'Not Fit for Service' }); }

  @Get('fit-with-restrictions')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  restricted(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, { ...query, decision: 'Fit for Service with Restrictions' }); }

  @Get('pending-approval')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  pendingApproval(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.readiness.list(user, { ...query, pendingApproval: 'true' }); }

  @Get('import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessImport)
  async importTemplate(@Res() response: any) { return sendCsv(response, await this.readiness.importTemplate()); }

  @Post('import')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessImport)
  importRows(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.readiness.importRows(user, body); }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.readiness.exportRows(user, query)); }

  @Post('assessments')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessCreate)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.readiness.create(user, body); }

  @Get('assessments/:assessmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  detail(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.readiness.detail(user, assessmentId); }

  @Patch('assessments/:assessmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessEdit)
  update(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.update(user, assessmentId, body); }

  @Get('assessments/:assessmentId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessExport)
  async exportOne(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Res() response: any) { return sendCsv(response, await this.readiness.exportOne(user, assessmentId)); }

  @Post('assessments/:assessmentId/run-check')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessRunCheck)
  runCheck(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.runCheck(user, assessmentId, body); }

  @Post('assessments/:assessmentId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessSubmit)
  submit(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.submit(user, assessmentId, body); }

  @Post('assessments/:assessmentId/review')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessReview)
  review(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.review(user, assessmentId, body); }

  @Post('assessments/:assessmentId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessApprove)
  approve(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.approve(user, assessmentId, body); }

  @Post('assessments/:assessmentId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessReject)
  reject(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.reject(user, assessmentId, body); }

  @Post('assessments/:assessmentId/override')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessOverride)
  override(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.override(user, assessmentId, body); }

  @Post('assessments/:assessmentId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessClose)
  close(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.close(user, assessmentId, body); }

  @Get('assessments/:assessmentId/blockers')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  blockers(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.readiness.blockers(user, assessmentId); }

  @Post('assessments/:assessmentId/blockers/:blockerId/waive')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessWaiveBlocker)
  waive(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('blockerId') blockerId: string, @Body() body: Record<string, any>) { return this.readiness.waiveBlocker(user, assessmentId, blockerId, body); }

  @Post('assessments/:assessmentId/blockers/:blockerId/clear')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessClearBlocker)
  clear(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('blockerId') blockerId: string, @Body() body: Record<string, any>) { return this.readiness.clearBlocker(user, assessmentId, blockerId, body); }

  @Post('assessments/:assessmentId/blockers/:blockerId/create-action')
  @Permissions(PermissionKeys.MechanicalIntegrityActionCreate)
  action(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('blockerId') blockerId: string, @Body() body: Record<string, any>) { return this.readiness.createActionFromBlocker(user, assessmentId, blockerId, body); }

  @Get('assessments/:assessmentId/restrictions')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  restrictions(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.readiness.restrictions(user, assessmentId); }

  @Post('assessments/:assessmentId/restrictions')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessEdit)
  addRestriction(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.addRestriction(user, assessmentId, body); }

  @Patch('assessments/:assessmentId/restrictions/:restrictionId')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessEdit)
  updateRestriction(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('restrictionId') restrictionId: string, @Body() body: Record<string, any>) { return this.readiness.updateRestriction(user, assessmentId, restrictionId, body); }

  @Get('assessments/:assessmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.readiness.linkedRecords(user, assessmentId); }

  @Post('assessments/:assessmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessEdit)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() body: Record<string, any>) { return this.readiness.addLinkedRecord(user, assessmentId, body); }

  @Delete('assessments/:assessmentId/linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessEdit)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('linkId') linkId: string) { return this.readiness.removeLinkedRecord(user, assessmentId, linkId); }
}

@ApiTags('mechanical-integrity-readiness-scoped')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiReadinessScopedController {
  constructor(private readonly readiness: MiReadinessService) {}

  @Get('equipment/:equipmentId/readiness')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  equipmentReadiness(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.readiness.equipmentReadiness(user, equipmentId); }

  @Post('equipment/:equipmentId/readiness/run-check')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessRunCheck)
  runEquipmentCheck(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.readiness.runEquipmentCheck(user, equipmentId); }

  @Post('equipment/:equipmentId/readiness/assessments')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessCreate)
  createForEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) { return this.readiness.create(user, body, equipmentId); }

  @Get('equipment/:equipmentId/readiness/blockers')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  equipmentBlockers(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.readiness.equipmentBlockers(user, equipmentId); }

  @Get('equipment/:equipmentId/readiness/history')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  equipmentHistory(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.readiness.equipmentHistory(user, equipmentId); }

  @Get('readiness/pssr/:pssrId')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  pssrReadiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: QueryMap) { return this.readiness.list(user, { ...query, pssrId }); }

  @Get('lookups/readiness-decisions')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  decisions() { return this.readiness.lookups().decisions; }

  @Get('lookups/readiness-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  statuses() { return this.readiness.lookups().statuses; }

  @Get('lookups/readiness-blocker-types')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  blockerTypes() { return this.readiness.lookups().blockerTypes; }

  @Get('lookups/readiness-severity-levels')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  severities() { return this.readiness.lookups().severities; }

  @Get('lookups/readiness-assessment-reasons')
  @Permissions(PermissionKeys.MechanicalIntegrityReadinessView)
  reasons() { return this.readiness.lookups().assessmentReasons; }
}
