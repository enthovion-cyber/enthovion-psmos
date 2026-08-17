import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MechanicalIntegrityService } from './mechanical-integrity.service';

@ApiTags('mechanical-integrity-safeguards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MechanicalIntegritySafeguardsController {
  constructor(private readonly mi: MechanicalIntegrityService) {}

  @Get('sis') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardDashboard(user, query); }
  @Get('sis/summary') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  summary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardDashboard(user, query).then((x) => x.summary); }
  @Get('sis/health') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  health(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardDashboard(user, query).then((x) => x.health); }
  @Get('sis/due') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  due(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardsDue(user, query); }
  @Get('sis/overdue') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  overdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardsOverdue(user, query); }
  @Get('sis/failed') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  failed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardsFailed(user, query); }
  @Get('sis/bypassed') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassView)
  bypassed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardsBypassed(user, query); }

  @Get('sis/sifs/import-template') @Permissions(PermissionKeys.MechanicalIntegritySifExport)
  async sifImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) { return this.sendCsv(response, await this.mi.sifImportTemplate(user)); }
  @Post('sis/sifs/import') @Permissions(PermissionKeys.MechanicalIntegritySifImport)
  importSifs(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.importSafeguards(user, 'SIF', body); }
  @Get('sis/sifs/export') @Permissions(PermissionKeys.MechanicalIntegritySifExport)
  async exportSifs(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) { return this.sendCsv(response, await this.mi.exportSifs(user, query)); }
  @Get('sis/sifs') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sifs(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.sifs(user, query); }
  @Post('sis/sifs') @Permissions(PermissionKeys.MechanicalIntegritySifCreate)
  createSif(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.createSif(user, body); }
  @Get('sis/sifs/:sifId/export') @Permissions(PermissionKeys.MechanicalIntegritySifExport)
  async exportSif(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Res() response: any) { return this.sendCsv(response, await this.mi.exportSif(user, sifId)); }
  @Get('sis/sifs/:sifId') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sif(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.sifDetail(user, sifId); }
  @Patch('sis/sifs/:sifId') @Permissions(PermissionKeys.MechanicalIntegritySifEdit)
  updateSif(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.updateSif(user, sifId, body); }
  @Post('sis/sifs/:sifId/archive') @Permissions(PermissionKeys.MechanicalIntegritySifArchive)
  archiveSif(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body('reason') reason?: string) { return this.mi.archiveSif(user, sifId, reason); }
  @Post('sis/sifs/:sifId/reactivate') @Permissions(PermissionKeys.MechanicalIntegritySifEdit)
  reactivateSif(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body('reason') reason?: string) { return this.mi.reactivateSif(user, sifId, reason); }

  @Get('sis/sifs/:sifId/devices') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceView)
  sifDevices(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.sifDevices(user, sifId); }
  @Post('sis/sifs/:sifId/devices') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceManage)
  addSifDevice(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.addSifDevice(user, sifId, body); }
  @Patch('sis/sifs/:sifId/devices/:deviceId') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceManage)
  updateSifDevice(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Param('deviceId') deviceId: string, @Body() body: Record<string, any>) { return this.mi.updateSifDevice(user, sifId, deviceId, body); }
  @Delete('sis/sifs/:sifId/devices/:deviceId') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceManage)
  removeSifDevice(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Param('deviceId') deviceId: string) { return this.mi.removeSifDevice(user, sifId, deviceId); }

  @Get('sis/sifs/:sifId/lopa-sil') @Permissions(PermissionKeys.MechanicalIntegritySifSilDataView)
  sifLopaSil(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.sifLopaSil(user, sifId); }
  @Post('sis/sifs/:sifId/lopa-sil') @Permissions(PermissionKeys.MechanicalIntegritySifLopaLinkManage)
  upsertSifLopaSil(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.upsertSifLopaSil(user, sifId, body); }
  @Get('sis/sifs/:sifId/cause-effect') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sifCauseEffect(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.sifCauseEffect(user, sifId); }
  @Patch('sis/sifs/:sifId/cause-effect') @Permissions(PermissionKeys.MechanicalIntegritySifEdit)
  updateSifCauseEffect(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.updateSifCauseEffect(user, sifId, body); }
  @Get('sis/sifs/:sifId/sil-data') @Permissions(PermissionKeys.MechanicalIntegritySifSilDataView)
  sifSilData(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.sifSilData(user, sifId); }
  @Patch('sis/sifs/:sifId/sil-data') @Permissions(PermissionKeys.MechanicalIntegritySifSilDataEdit)
  updateSifSilData(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.updateSifSilData(user, sifId, body); }

  @Post('sis/sifs/:sifId/schedule/recalculate') @Permissions(PermissionKeys.MechanicalIntegritySafeguardSchedulerRun)
  recalculateSifSchedule(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.recalculateSafeguardSchedule(user, 'SIF', sifId); }
  @Get('sis/sifs/:sifId/demands') @Permissions(PermissionKeys.MechanicalIntegritySafeguardDemandView)
  sifDemands(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.safeguardDemands(user, 'SIF', sifId); }
  @Post('sis/sifs/:sifId/demands') @Permissions(PermissionKeys.MechanicalIntegritySafeguardDemandCreate)
  addSifDemand(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.createSafeguardDemand(user, 'SIF', sifId, body); }
  @Get('sis/sifs/:sifId/demands/:demandId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardDemandView)
  getSifDemand(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Param('demandId') demandId: string) { return this.mi.getSafeguardDemand(user, 'SIF', sifId, demandId); }
  @Patch('sis/sifs/:sifId/demands/:demandId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardDemandEdit)
  updateSifDemand(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Param('demandId') demandId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardDemand(user, 'SIF', sifId, demandId, body); }
  @Get('sis/sifs/:sifId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassView)
  sifBypass(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string) { return this.mi.safeguardBypassFoundation(user, 'SIF', sifId); }
  @Patch('sis/sifs/:sifId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassConfigure)
  updateSifBypass(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardBypassFoundation(user, 'SIF', sifId, body); }

  @Get('interlocks/import-template') @Permissions(PermissionKeys.MechanicalIntegrityInterlockExport)
  async interlockImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) { return this.sendCsv(response, await this.mi.interlockImportTemplate(user)); }
  @Post('interlocks/import') @Permissions(PermissionKeys.MechanicalIntegrityInterlockImport)
  importInterlocks(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.importSafeguards(user, 'Interlock', body); }
  @Get('interlocks/export') @Permissions(PermissionKeys.MechanicalIntegrityInterlockExport)
  async exportInterlocks(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) { return this.sendCsv(response, await this.mi.exportInterlocks(user, query)); }
  @Get('interlocks') @Permissions(PermissionKeys.MechanicalIntegrityInterlockView)
  interlocks(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.interlocks(user, query); }
  @Post('interlocks') @Permissions(PermissionKeys.MechanicalIntegrityInterlockCreate)
  createInterlock(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.createInterlock(user, body); }
  @Get('interlocks/:interlockId') @Permissions(PermissionKeys.MechanicalIntegrityInterlockView)
  interlock(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string) { return this.mi.interlockDetail(user, interlockId); }
  @Patch('interlocks/:interlockId') @Permissions(PermissionKeys.MechanicalIntegrityInterlockEdit)
  updateInterlock(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string, @Body() body: Record<string, any>) { return this.mi.updateInterlock(user, interlockId, body); }
  @Post('interlocks/:interlockId/archive') @Permissions(PermissionKeys.MechanicalIntegrityInterlockArchive)
  archiveInterlock(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string, @Body('reason') reason?: string) { return this.mi.archiveInterlock(user, interlockId, reason); }
  @Post('interlocks/:interlockId/reactivate') @Permissions(PermissionKeys.MechanicalIntegrityInterlockEdit)
  reactivateInterlock(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string, @Body('reason') reason?: string) { return this.mi.reactivateInterlock(user, interlockId, reason); }
  @Post('interlocks/:interlockId/schedule/recalculate') @Permissions(PermissionKeys.MechanicalIntegritySafeguardSchedulerRun)
  recalculateInterlockSchedule(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string) { return this.mi.recalculateSafeguardSchedule(user, 'Interlock', interlockId); }
  @Get('interlocks/:interlockId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassView)
  interlockBypass(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string) { return this.mi.safeguardBypassFoundation(user, 'Interlock', interlockId); }
  @Patch('interlocks/:interlockId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassConfigure)
  updateInterlockBypass(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardBypassFoundation(user, 'Interlock', interlockId, body); }

  @Get('critical-alarms/import-template') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmExport)
  async alarmImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) { return this.sendCsv(response, await this.mi.criticalAlarmImportTemplate(user)); }
  @Post('critical-alarms/import') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmImport)
  importAlarms(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.importSafeguards(user, 'Critical Alarm', body); }
  @Get('critical-alarms/export') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmExport)
  async exportAlarms(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) { return this.sendCsv(response, await this.mi.exportCriticalAlarms(user, query)); }
  @Get('critical-alarms') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmView)
  alarms(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.criticalAlarms(user, query); }
  @Post('critical-alarms') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmCreate)
  createAlarm(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.createCriticalAlarm(user, body); }
  @Get('critical-alarms/:alarmId') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmView)
  alarm(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string) { return this.mi.criticalAlarmDetail(user, alarmId); }
  @Patch('critical-alarms/:alarmId') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmEdit)
  updateAlarm(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string, @Body() body: Record<string, any>) { return this.mi.updateCriticalAlarm(user, alarmId, body); }
  @Post('critical-alarms/:alarmId/archive') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmArchive)
  archiveAlarm(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string, @Body('reason') reason?: string) { return this.mi.archiveCriticalAlarm(user, alarmId, reason); }
  @Post('critical-alarms/:alarmId/reactivate') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmEdit)
  reactivateAlarm(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string, @Body('reason') reason?: string) { return this.mi.reactivateCriticalAlarm(user, alarmId, reason); }
  @Post('critical-alarms/:alarmId/schedule/recalculate') @Permissions(PermissionKeys.MechanicalIntegritySafeguardSchedulerRun)
  recalculateAlarmSchedule(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string) { return this.mi.recalculateSafeguardSchedule(user, 'Critical Alarm', alarmId); }
  @Get('critical-alarms/:alarmId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassView)
  alarmBypass(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string) { return this.mi.safeguardBypassFoundation(user, 'Critical Alarm', alarmId); }
  @Patch('critical-alarms/:alarmId/bypass-foundation') @Permissions(PermissionKeys.MechanicalIntegritySafeguardBypassConfigure)
  updateAlarmBypass(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardBypassFoundation(user, 'Critical Alarm', alarmId, body); }

  @Get('safeguard-tests/import-template') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestExport)
  async testImportTemplate(@CurrentUser() user: RequestUser, @Res() response: any) { return this.sendCsv(response, await this.mi.safeguardTestImportTemplate(user)); }
  @Post('safeguard-tests/import') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestCreate)
  importTests(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.importSafeguards(user, 'Safeguard Test', body); }
  @Get('safeguard-tests/export') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestExport)
  async exportTests(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) { return this.sendCsv(response, await this.mi.exportSafeguardTests(user, query)); }
  @Post('safeguard-tests/scheduler/run') @Permissions(PermissionKeys.MechanicalIntegritySafeguardSchedulerRun)
  runScheduler(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.runSafeguardScheduler(user, body); }
  @Get('safeguard-tests/occurrences') @Permissions(PermissionKeys.MechanicalIntegritySafeguardSchedulerView)
  occurrences(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardOccurrences(user, query); }
  @Post('safeguard-tests/occurrences/:occurrenceId/create-test') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestCreate)
  createFromOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string) { return this.mi.createSafeguardTestFromOccurrence(user, occurrenceId); }
  @Post('safeguard-tests/occurrences/:occurrenceId/complete') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestApprove)
  completeOccurrence(@CurrentUser() user: RequestUser, @Param('occurrenceId') occurrenceId: string, @Body() body: Record<string, any>) { return this.mi.completeSafeguardOccurrence(user, occurrenceId, body); }
  @Get('safeguard-tests') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  tests(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardTests(user, query); }
  @Post('safeguard-tests') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestCreate)
  createTest(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.mi.createSafeguardTest(user, body); }
  @Get('safeguard-tests/:testId/export') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestExport)
  async exportTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Res() response: any) { return this.sendCsv(response, await this.mi.exportSafeguardTest(user, testId)); }
  @Get('safeguard-tests/:testId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  test(@CurrentUser() user: RequestUser, @Param('testId') testId: string) { return this.mi.safeguardTestDetail(user, testId); }
  @Patch('safeguard-tests/:testId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestEdit)
  updateTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardTest(user, testId, body); }
  @Post('safeguard-tests/:testId/evaluate') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestEdit)
  evaluateTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string) { return this.mi.evaluateSafeguardTest(user, testId); }
  @Post('safeguard-tests/:testId/submit') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestSubmit)
  submitTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string) { return this.mi.submitSafeguardTest(user, testId); }
  @Post('safeguard-tests/:testId/approve') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestApprove)
  approveTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.mi.approveSafeguardTest(user, testId, body); }
  @Post('safeguard-tests/:testId/reject') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestReject)
  rejectTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.mi.rejectSafeguardTest(user, testId, body); }
  @Post('safeguard-tests/:testId/return-for-correction') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestReview)
  returnTest(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.mi.returnSafeguardTest(user, testId, body); }
  @Get('safeguard-tests/:testId/steps') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  steps(@CurrentUser() user: RequestUser, @Param('testId') testId: string) { return this.mi.safeguardTestSteps(user, testId); }
  @Post('safeguard-tests/:testId/steps') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestEdit)
  addStep(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.mi.addSafeguardTestStep(user, testId, body); }
  @Patch('safeguard-tests/:testId/steps/:stepId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestEdit)
  updateStep(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Param('stepId') stepId: string, @Body() body: Record<string, any>) { return this.mi.updateSafeguardTestStep(user, testId, stepId, body); }
  @Delete('safeguard-tests/:testId/steps/:stepId') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestEdit)
  removeStep(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Param('stepId') stepId: string) { return this.mi.removeSafeguardTestStep(user, testId, stepId); }

  @Get('equipment/:equipmentId/sis-sif-interlocks') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  equipmentSafeguards(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.mi.equipmentSafeguards(user, equipmentId); }
  @Post('equipment/:equipmentId/sis-sif-interlocks') @Permissions(PermissionKeys.MechanicalIntegritySifCreate)
  createEquipmentSif(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) { return this.mi.createSif(user, { ...body, protectedEquipmentId: equipmentId }); }
  @Get('equipment/:equipmentId/safeguards') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  equipmentSafeguardSummary(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.mi.equipmentSafeguards(user, equipmentId); }
  @Get('equipment/:equipmentId/safeguard-tests') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  equipmentSafeguardTests(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) { return this.mi.safeguardTests(user, { ...query, equipmentId }); }
  @Get('equipment/:equipmentId/interlocks') @Permissions(PermissionKeys.MechanicalIntegrityInterlockView)
  equipmentInterlocks(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.mi.interlocks(user, { equipmentId }); }
  @Get('equipment/:equipmentId/critical-alarms') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmView)
  equipmentCriticalAlarms(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string) { return this.mi.criticalAlarms(user, { equipmentId }); }

  @Get('lookups/sif-types') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sifTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.sifTypes); }
  @Get('lookups/sif-statuses') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sifStatuses(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.sifStatuses); }
  @Get('lookups/sil-levels') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  silLevels(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.silLevels); }
  @Get('lookups/sif-architectures') @Permissions(PermissionKeys.MechanicalIntegritySifView)
  sifArchitectures(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.sifArchitectures); }
  @Get('lookups/sif-device-types') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceView)
  sifDeviceTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.sifDeviceTypes); }
  @Get('lookups/sif-device-roles') @Permissions(PermissionKeys.MechanicalIntegritySifDeviceView)
  sifDeviceRoles(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.sifDeviceRoles); }
  @Get('lookups/interlock-types') @Permissions(PermissionKeys.MechanicalIntegrityInterlockView)
  interlockTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.interlockTypes); }
  @Get('lookups/alarm-types') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmView)
  alarmTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.alarmTypes); }
  @Get('lookups/alarm-priorities') @Permissions(PermissionKeys.MechanicalIntegrityCriticalAlarmView)
  alarmPriorities(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.alarmPriorities); }
  @Get('lookups/safeguard-test-types') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  testTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.safeguardTestTypes); }
  @Get('lookups/safeguard-test-results') @Permissions(PermissionKeys.MechanicalIntegritySafeguardTestView)
  testResults(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.safeguardTestResults); }
  @Get('lookups/demand-types') @Permissions(PermissionKeys.MechanicalIntegritySafeguardDemandView)
  demandTypes(@CurrentUser() user: RequestUser) { return this.mi.safeguardLookups(user).then((x) => x.demandTypes); }

  private sendCsv(response: any, file: { fileName: string; content: string }) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }
}
