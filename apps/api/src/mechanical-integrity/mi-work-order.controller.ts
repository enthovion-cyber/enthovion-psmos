import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiWorkOrderService } from './mi-work-order.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-work-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/work-orders')
export class MiWorkOrderController {
  constructor(private readonly workOrders: MiWorkOrderService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  list(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.list(user, query); }

  @Get('summary')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  summary(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.summary(user, query); }

  @Get('open')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  open(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, closed: 'false' }); }

  @Get('overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  overdue(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, overdue: 'true' }); }

  @Get('safety-critical')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  safetyCritical(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, safetyCritical: 'true' }); }

  @Get('pending-verification')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  pendingVerification(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, pendingVerification: 'true' }); }

  @Get('import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderImport)
  async importTemplate(@Res() response: any) { return sendCsv(response, await this.workOrders.importTemplate()); }

  @Post('import')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderImport)
  importRows(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.workOrders.importRows(user, body); }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.workOrders.exportRows(user, query)); }

  @Post()
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.workOrders.create(user, body); }

  @Get(':workOrderId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  detail(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string) { return this.workOrders.detail(user, workOrderId); }

  @Patch(':workOrderId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  update(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.update(user, workOrderId, body); }

  @Get(':workOrderId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderExport)
  async exportOne(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Res() response: any) { return sendCsv(response, await this.workOrders.exportOne(user, workOrderId)); }

  @Post(':workOrderId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderSubmit)
  submit(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.submit(user, workOrderId, body); }

  @Post(':workOrderId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderApprove)
  approve(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.approve(user, workOrderId, body); }

  @Post(':workOrderId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderReject)
  reject(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.reject(user, workOrderId, body); }

  @Post(':workOrderId/plan')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderPlan)
  plan(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.plan(user, workOrderId, body); }

  @Post(':workOrderId/assign')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderAssign)
  assign(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.assign(user, workOrderId, body); }

  @Post(':workOrderId/start')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderStart)
  start(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.start(user, workOrderId, body); }

  @Post(':workOrderId/hold')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  hold(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.hold(user, workOrderId, body); }

  @Post(':workOrderId/resume')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  resume(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.resume(user, workOrderId, body); }

  @Post(':workOrderId/complete')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderComplete)
  complete(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.complete(user, workOrderId, body); }

  @Post(':workOrderId/verify')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderVerify)
  verify(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.verify(user, workOrderId, body); }

  @Post(':workOrderId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderClose)
  close(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.close(user, workOrderId, body); }

  @Post(':workOrderId/cancel')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.cancel(user, workOrderId, body); }

  @Get(':workOrderId/tasks')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  tasks(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string) { return this.workOrders.tasks(user, workOrderId); }

  @Post(':workOrderId/tasks')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  addTask(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.addTask(user, workOrderId, body); }

  @Patch(':workOrderId/tasks/:taskId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  updateTask(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Param('taskId') taskId: string, @Body() body: Record<string, any>) { return this.workOrders.updateTask(user, workOrderId, taskId, body); }

  @Delete(':workOrderId/tasks/:taskId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  deleteTask(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Param('taskId') taskId: string) { return this.workOrders.deleteTask(user, workOrderId, taskId); }

  @Get(':workOrderId/parts')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  parts(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string) { return this.workOrders.parts(user, workOrderId); }

  @Post(':workOrderId/parts')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  addPart(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.addPart(user, workOrderId, body); }

  @Patch(':workOrderId/parts/:partId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  updatePart(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Param('partId') partId: string, @Body() body: Record<string, any>) { return this.workOrders.updatePart(user, workOrderId, partId, body); }

  @Get(':workOrderId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string) { return this.workOrders.linkedRecords(user, workOrderId); }

  @Post(':workOrderId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.addLinkedRecord(user, workOrderId, body); }

  @Delete(':workOrderId/linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderEdit)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Param('linkId') linkId: string) { return this.workOrders.removeLinkedRecord(user, workOrderId, linkId); }

  @Post(':workOrderId/create-action')
  @Permissions(PermissionKeys.MechanicalIntegrityActionCreate)
  createAction(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.createAction(user, workOrderId, body); }

  @Post(':workOrderId/link-action')
  @Permissions(PermissionKeys.MechanicalIntegrityActionEdit)
  linkAction(@CurrentUser() user: RequestUser, @Param('workOrderId') workOrderId: string, @Body() body: Record<string, any>) { return this.workOrders.linkAction(user, workOrderId, body); }
}

@ApiTags('mechanical-integrity-work-order-scoped')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiWorkOrderScopedController {
  constructor(private readonly workOrders: MiWorkOrderService) {}

  @Get('actions')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  actions(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.actions(user, query); }

  @Get('actions/my-actions')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  myActions(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.myActions(user, query); }

  @Get('actions/overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  overdueActions(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.workOrders.overdueActions(user, query); }

  @Post('actions')
  @Permissions(PermissionKeys.MechanicalIntegrityActionCreate)
  createActionStandalone(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, workOrderType: body.workOrderType ?? 'Corrective maintenance' }); }

  @Get('actions/:actionId')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  actionDetail(@CurrentUser() user: RequestUser, @Param('actionId') actionId: string) { return this.workOrders.detail(user, actionId); }

  @Get('equipment/:equipmentId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  equipmentWorkOrders(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, equipmentId }); }

  @Post('equipment/:equipmentId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createForEquipment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, equipmentId }); }

  @Get('equipment/:equipmentId/actions')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  equipmentActions(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.workOrders.actions(user, { ...query, equipmentId }); }

  @Get('lookups/work-order-types')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  workOrderTypes() { return this.workOrders.lookups().workOrderTypes; }

  @Get('lookups/work-order-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  workOrderStatuses() { return this.workOrders.lookups().workStatuses; }

  @Get('lookups/work-categories')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  workCategories() { return this.workOrders.lookups().workCategories; }

  @Get('lookups/work-priorities')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  workPriorities() { return this.workOrders.lookups().priorities; }

  @Get('lookups/work-risk-levels')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  workRiskLevels() { return this.workOrders.lookups().riskLevels; }

  @Get('lookups/parts-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  partsStatuses() { return this.workOrders.lookups().partsStatuses; }

  @Get('lookups/action-types')
  @Permissions(PermissionKeys.MechanicalIntegrityActionView)
  actionTypes() { return this.workOrders.lookups().actionTypes; }

  @Get('deficiencies/:deficiencyId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  deficiencyWorkOrders(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, linkedDeficiencyId: deficiencyId, sourceModule: query.sourceModule ?? 'Deficiency', sourceRecordId: query.sourceRecordId ?? deficiencyId }); }

  @Post('deficiencies/:deficiencyId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromDeficiency(@CurrentUser() user: RequestUser, @Param('deficiencyId') deficiencyId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, linkedDeficiencyId: deficiencyId, sourceModule: 'Deficiency', sourceRecordId: deficiencyId }); }

  @Get('inspections/:inspectionId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  inspectionWorkOrders(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Inspection', sourceRecordId: inspectionId }); }

  @Post('inspections/:inspectionId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromInspection(@CurrentUser() user: RequestUser, @Param('inspectionId') inspectionId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Inspection', sourceRecordId: inspectionId }); }

  @Get('preventive-maintenance/records/:pmRecordId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  pmWorkOrders(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Preventive Maintenance', sourceRecordId: pmRecordId }); }

  @Post('preventive-maintenance/records/:pmRecordId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromPm(@CurrentUser() user: RequestUser, @Param('pmRecordId') pmRecordId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Preventive Maintenance', sourceRecordId: pmRecordId }); }

  @Get('calibration/records/:calibrationRecordId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  calibrationWorkOrders(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Calibration', sourceRecordId: calibrationRecordId }); }

  @Post('calibration/records/:calibrationRecordId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromCalibration(@CurrentUser() user: RequestUser, @Param('calibrationRecordId') calibrationRecordId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Calibration', sourceRecordId: calibrationRecordId }); }

  @Get('relief-devices/tests/:testId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  reliefWorkOrders(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Relief Device Test', sourceRecordId: testId }); }

  @Post('relief-devices/tests/:testId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromRelief(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Relief Device Test', sourceRecordId: testId }); }

  @Get('safeguard-tests/:testId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  safeguardWorkOrders(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Safeguard Test', sourceRecordId: testId }); }

  @Post('safeguard-tests/:testId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromSafeguard(@CurrentUser() user: RequestUser, @Param('testId') testId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Safeguard Test', sourceRecordId: testId }); }

  @Get('bypass-impairments/:impairmentId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderView)
  impairmentWorkOrders(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Query() query: QueryMap) { return this.workOrders.list(user, { ...query, sourceModule: 'Bypass / Impairment', sourceRecordId: impairmentId }); }

  @Post('bypass-impairments/:impairmentId/work-orders')
  @Permissions(PermissionKeys.MechanicalIntegrityWorkOrderCreate)
  createFromImpairment(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) { return this.workOrders.create(user, { ...body, sourceModule: 'Bypass / Impairment', sourceRecordId: impairmentId }); }
}
