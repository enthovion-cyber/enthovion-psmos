import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiSafeguardImpairmentService } from './mi-safeguard-impairment.service';

@ApiTags('mechanical-integrity-bypass-impairments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/bypass-impairments')
export class MiSafeguardImpairmentController {
  constructor(private readonly impairments: MiSafeguardImpairmentService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  list(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, query);
  }

  @Get('summary')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  summary(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.summary(user, query);
  }

  @Get('active')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  active(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.active(user, query);
  }

  @Get('expired')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  expired(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.expired(user, query);
  }

  @Get('pending-approval')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  pendingApproval(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.pendingApproval(user, query);
  }

  @Get('history')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  historyView(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, query);
  }

  @Get('lookups')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  lookups() {
    return this.impairments.lookups();
  }

  @Get('import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentImport)
  async importTemplate(@Res() response: any) {
    return this.sendCsv(response, await this.impairments.importTemplate());
  }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>, @Res() response: any) {
    return this.sendCsv(response, await this.impairments.exportRows(user, query));
  }

  @Post()
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentCreate)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.impairments.create(user, body);
  }

  @Get(':impairmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  detail(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string) {
    return this.impairments.detail(user, impairmentId);
  }

  @Patch(':impairmentId')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentEdit)
  update(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.update(user, impairmentId, body);
  }

  @Post(':impairmentId/submit')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentSubmit)
  submit(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.submit(user, impairmentId, body);
  }

  @Post(':impairmentId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentApprove)
  approve(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.approve(user, impairmentId, body);
  }

  @Post(':impairmentId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentReject)
  reject(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.reject(user, impairmentId, body);
  }

  @Post(':impairmentId/activate')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentActivate)
  activate(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.activate(user, impairmentId, body);
  }

  @Post(':impairmentId/request-extension')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentExtend)
  requestExtension(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.requestExtension(user, impairmentId, body);
  }

  @Post(':impairmentId/extensions/:extensionId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentApprove)
  approveExtension(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Param('extensionId') extensionId: string, @Body() body: Record<string, any>) {
    return this.impairments.approveExtension(user, impairmentId, extensionId, body);
  }

  @Post(':impairmentId/extensions/:extensionId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentReject)
  rejectExtension(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Param('extensionId') extensionId: string, @Body() body: Record<string, any>) {
    return this.impairments.rejectExtension(user, impairmentId, extensionId, body);
  }

  @Post(':impairmentId/restore')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentRestore)
  restore(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.restore(user, impairmentId, body);
  }

  @Post(':impairmentId/verify-restoration')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentVerifyRestoration)
  verifyRestoration(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.verifyRestoration(user, impairmentId, body);
  }

  @Post(':impairmentId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentClose)
  close(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.close(user, impairmentId, body);
  }

  @Post(':impairmentId/cancel')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentCancel)
  cancel(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.cancel(user, impairmentId, body);
  }

  @Get(':impairmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string) {
    return this.impairments.linkedRecords(user, impairmentId);
  }

  @Post(':impairmentId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentEdit)
  addLinkedRecord(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.addLinkedRecord(user, impairmentId, body);
  }

  @Delete(':impairmentId/linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentEdit)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('impairmentId') impairmentId: string, @Param('linkId') linkId: string, @Body() body: Record<string, any>) {
    return this.impairments.removeLinkedRecord(user, impairmentId, linkId, body);
  }

  private sendCsv(response: any, file: { fileName: string; content: string }) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.send(file.content);
  }
}

@ApiTags('mechanical-integrity-bypass-impairment-scoped')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiSafeguardImpairmentScopedController {
  constructor(private readonly impairments: MiSafeguardImpairmentService) {}

  @Get('equipment/:equipmentId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  equipmentImpairments(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, { ...query, equipmentId });
  }

  @Post('equipment/:equipmentId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentCreate)
  createEquipmentImpairment(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) {
    return this.impairments.create(user, { ...body, equipmentId });
  }

  @Get('sis/sifs/:sifId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  sifImpairments(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, { ...query, safeguardType: 'SIS / SIF', safeguardId: sifId });
  }

  @Post('sis/sifs/:sifId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentCreate)
  createSifImpairment(@CurrentUser() user: RequestUser, @Param('sifId') sifId: string, @Body() body: Record<string, any>) {
    return this.impairments.create(user, { ...body, safeguardType: 'SIS / SIF', safeguardId: sifId });
  }

  @Get('interlocks/:interlockId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  interlockImpairments(@CurrentUser() user: RequestUser, @Param('interlockId') interlockId: string, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, { ...query, safeguardType: 'Interlock', safeguardId: interlockId });
  }

  @Get('critical-alarms/:alarmId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  alarmImpairments(@CurrentUser() user: RequestUser, @Param('alarmId') alarmId: string, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, { ...query, safeguardType: 'Critical Alarm', safeguardId: alarmId });
  }

  @Get('relief-devices/:reliefDeviceId/impairments')
  @Permissions(PermissionKeys.MechanicalIntegrityImpairmentView)
  reliefDeviceImpairments(@CurrentUser() user: RequestUser, @Param('reliefDeviceId') reliefDeviceId: string, @Query() query: Record<string, string | undefined>) {
    return this.impairments.list(user, { ...query, safeguardType: 'PSV / Relief Device', safeguardId: reliefDeviceId });
  }
}
