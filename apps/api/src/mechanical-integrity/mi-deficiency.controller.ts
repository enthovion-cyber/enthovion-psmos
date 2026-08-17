import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiDeficiencyService } from './mi-deficiency.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-deficiencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/deficiencies')
export class MiDeficiencyController {
  constructor(private readonly deficiencies: MiDeficiencyService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  list(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, query);
  }

  @Get('summary')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  summary(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.summary(user, query);
  }

  @Get('open')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  open(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, closed: 'false' });
  }

  @Get('overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  overdue(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, overdue: 'true' });
  }

  @Get('critical')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  critical(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, critical: 'true' });
  }

  @Get('pending-approval')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  pendingApproval(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, status: query.status ?? 'Under Review' });
  }

  @Get('lookups')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  lookups() {
    return this.deficiencies.lookups();
  }

  @Get('import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyImport)
  async importTemplate(@Res() response: any) {
    return sendCsv(response, await this.deficiencies.importTemplate());
  }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) {
    return sendCsv(response, await this.deficiencies.exportDeficiencies(user, query));
  }

  @Post('import')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyImport)
  importRows(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.deficiencies.importDeficiencies(user, body);
  }

  @Post()
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, body);
  }

  @Get(':deficiencyId')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  detail(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string) {
    return this.deficiencies.deficiencyDetail(user, deficiencyId);
  }

  @Get(':deficiencyId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyExport)
  async exportOne(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Res() response: any) {
    return sendCsv(response, await this.deficiencies.exportDeficiency(user, deficiencyId));
  }

  @Patch(':deficiencyId')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyEdit)
  update(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.updateDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencySubmit)
  submit(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.submitDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/review')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyReview)
  review(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.reviewDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyApprove)
  approve(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.approveDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyReject)
  reject(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.rejectDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/verify')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyVerify)
  verify(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.verifyDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyClose)
  close(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.closeDeficiency(user, deficiencyId, body);
  }

  @Post(':deficiencyId/cancel')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.cancelDeficiency(user, deficiencyId, body);
  }

  @Get(':deficiencyId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string) {
    return this.deficiencies.linkedRecords(user, deficiencyId);
  }

  @Post(':deficiencyId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyEdit)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.addLinkedRecord(user, deficiencyId, body);
  }

  @Delete(':deficiencyId/linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyEdit)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Param('linkId') linkId: string) {
    return this.deficiencies.removeLinkedRecord(user, deficiencyId, linkId);
  }

  @Get(':deficiencyId/history')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  history(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string) {
    return this.deficiencies.history(user, deficiencyId);
  }
}

@ApiTags('mechanical-integrity-deviations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/deviations')
export class MiDeviationController {
  constructor(private readonly deficiencies: MiDeficiencyService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationView)
  list(@CurrentUser() user: RequestUser, @Query() query: QueryMap) {
    return this.deficiencies.listDeviations(user, query);
  }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) {
    return sendCsv(response, await this.deficiencies.exportDeviations(user, query));
  }

  @Post()
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationCreate)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeviation(user, body);
  }

  @Get(':deviationId')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationView)
  detail(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string) {
    return this.deficiencies.deviationDetail(user, deviationId);
  }

  @Patch(':deviationId')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationEdit)
  update(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.updateDeviation(user, deviationId, body);
  }

  @Post(':deviationId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationApprove)
  approve(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.approveDeviation(user, deviationId, body);
  }

  @Post(':deviationId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationEdit)
  submit(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.submitDeviation(user, deviationId, body);
  }

  @Post(':deviationId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationApprove)
  reject(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.rejectDeviation(user, deviationId, body);
  }

  @Post(':deviationId/request-extension')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationExtend)
  requestExtension(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.requestDeviationExtension(user, deviationId, body);
  }

  @Post(':deviationId/approve-extension')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationApprove)
  approveExtension(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.approveDeviationExtension(user, deviationId, body);
  }

  @Post(':deviationId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationClose)
  close(@CurrentUser() user: RequestUser, @Param('deviationId') deviationId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.closeDeviation(user, deviationId, body);
  }
}

@ApiTags('mechanical-integrity-deficiency-scoped')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiDeficiencyScopedController {
  constructor(private readonly deficiencies: MiDeficiencyService) {}

  @Get('equipment/:equipmentId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  equipmentDeficiencies(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, equipmentId });
  }

  @Post('equipment/:equipmentId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createForEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, equipmentId });
  }

  @Get('equipment/:equipmentId/deviations')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationView)
  equipmentDeviations(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeviations(user, { ...query, equipmentId });
  }

  @Post('equipment/:equipmentId/deviations')
  @Permissions(PermissionKeys.MechanicalIntegrityDeviationCreate)
  createDeviationForEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeviation(user, { ...body, equipmentId });
  }

  @Post('inspections/:inspectionId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromInspection(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Inspection', sourceRecordId: inspectionId });
  }

  @Get('inspections/:inspectionId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  inspectionDeficiencies(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Inspection', sourceRecordId: inspectionId });
  }

  @Post('preventive-maintenance/records/:pmRecordId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromPm(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Preventive Maintenance', sourceRecordId: pmRecordId });
  }

  @Get('preventive-maintenance/records/:pmRecordId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  pmDeficiencies(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Preventive Maintenance', sourceRecordId: pmRecordId });
  }

  @Post('calibration/records/:calibrationRecordId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromCalibration(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Calibration', sourceRecordId: calibrationRecordId });
  }

  @Get('calibration/records/:calibrationRecordId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  calibrationDeficiencies(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Calibration', sourceRecordId: calibrationRecordId });
  }

  @Post('relief-devices/tests/:testId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromReliefTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Relief Device Test', sourceRecordId: testId });
  }

  @Get('relief-devices/tests/:testId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  reliefTestDeficiencies(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Relief Device Test', sourceRecordId: testId });
  }

  @Post('safeguard-tests/:testId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromSafeguardTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Safeguard Test', sourceRecordId: testId });
  }

  @Get('safeguard-tests/:testId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  safeguardTestDeficiencies(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Safeguard Test', sourceRecordId: testId });
  }

  @Post('bypass-impairments/:impairmentId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyCreate)
  createFromImpairment(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.deficiencies.createDeficiency(user, { ...body, sourceModule: 'Bypass / Impairment', sourceRecordId: impairmentId });
  }

  @Get('bypass-impairments/:impairmentId/deficiencies')
  @Permissions(PermissionKeys.MechanicalIntegrityDeficiencyView)
  impairmentDeficiencies(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Query() query: QueryMap) {
    return this.deficiencies.listDeficiencies(user, { ...query, sourceModule: 'Bypass / Impairment', sourceRecordId: impairmentId });
  }
}
