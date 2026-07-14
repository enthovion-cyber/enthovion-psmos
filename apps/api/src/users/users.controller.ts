import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { ApprovalDelegationDto } from './dto/approval-delegation.dto';
import { BulkImportUsersDto } from './dto/bulk-import-users.dto';
import { ContractorAccessDto } from './dto/contractor-access.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRoleDto } from './dto/user-role.dto';
import { UserSiteAccessDto } from './dto/user-site-access.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['users', 'admin/users'])
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions(PermissionKeys.UsersRead)
  list(@CurrentUser() user: RequestUser) {
    return this.users.list(user.tenantId);
  }

  @Get('access-reference')
  @Permissions(PermissionKeys.UsersRead)
  accessReference(@CurrentUser() user: RequestUser) {
    return this.users.accessReference(user.tenantId);
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.getProfile(user.id);
  }

  @Post()
  @Permissions(PermissionKeys.UsersCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    return this.users.create(user.tenantId, user.id, dto);
  }

  @Post('invite')
  @Permissions(PermissionKeys.UsersCreate)
  invite(@CurrentUser() user: RequestUser, @Body() dto: InviteUserDto) {
    return this.users.invite(user.tenantId, user.id, dto);
  }

  @Post('bulk-import')
  @Permissions(PermissionKeys.UsersCreate)
  bulkImport(@CurrentUser() user: RequestUser, @Body() dto: BulkImportUsersDto) {
    return this.users.bulkImport(user.tenantId, user.id, dto.users);
  }

  @Get('bulk-template')
  @Permissions(PermissionKeys.UsersRead)
  bulkTemplate() {
    return this.users.bulkTemplate();
  }

  @Post('bulk-upload')
  @Permissions(PermissionKeys.UsersCreate)
  createBulkUpload(@CurrentUser() user: RequestUser, @Body() dto: BulkImportUsersDto) {
    return this.users.createBulkJob(user.tenantId, user.id, { ...(dto.fileName ? { fileName: dto.fileName } : {}), users: dto.users });
  }

  @Get('bulk-upload/:jobId')
  @Permissions(PermissionKeys.UsersRead)
  getBulkUpload(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.users.getBulkJob(user.tenantId, jobId);
  }

  @Post('bulk-upload/:jobId/validate')
  @Permissions(PermissionKeys.UsersCreate)
  validateBulkUpload(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.users.validateBulkJob(user.tenantId, user.id, jobId);
  }

  @Post('bulk-upload/:jobId/import')
  @Permissions(PermissionKeys.UsersCreate)
  importBulkUpload(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.users.importBulkJob(user.tenantId, user.id, jobId);
  }

  @Get('bulk-upload/:jobId/error-report')
  @Permissions(PermissionKeys.UsersRead)
  bulkErrorReport(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.users.bulkErrorReport(user.tenantId, jobId);
  }

  @Get('export')
  @Permissions(PermissionKeys.UsersExport)
  exportUsers(@CurrentUser() user: RequestUser) {
    return this.users.exportUsers(user.tenantId);
  }

  @Get(':id')
  @Permissions(PermissionKeys.UsersRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.getById(user.tenantId, id);
  }

  @Get(':id/audit')
  @Permissions(PermissionKeys.AuditRead)
  audit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.userAudit(user.tenantId, id);
  }

  @Get(':id/security-events')
  @Permissions(PermissionKeys.AuditRead)
  securityEvents(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.securityEvents(user.tenantId, id);
  }

  @Patch(':id')
  @Permissions(PermissionKeys.UsersManage)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(user.tenantId, user.id, id, dto);
  }

  @Post(':id/suspend')
  @Permissions(PermissionKeys.UsersManage)
  suspend(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.setStatus(user.tenantId, user.id, id, 'SUSPENDED');
  }

  @Post(':id/deactivate')
  @Permissions(PermissionKeys.UsersDeactivate)
  deactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.setStatus(user.tenantId, user.id, id, 'DEACTIVATED');
  }

  @Post(':id/reactivate')
  @Permissions(PermissionKeys.UsersManage)
  reactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.setStatus(user.tenantId, user.id, id, 'ACTIVE');
  }

  @Post(':id/archive')
  @Permissions(PermissionKeys.UsersDelete)
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.users.archive(user.tenantId, user.id, id, reason);
  }

  @Post(':id/restore')
  @Permissions(PermissionKeys.UsersManage)
  restore(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.restore(user.tenantId, user.id, id);
  }

  @Delete(':id')
  @Permissions(PermissionKeys.UsersDelete)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query('reason') reason?: string) {
    return this.users.deleteUser(user.tenantId, user.id, id, reason);
  }

  @Get(':id/removal-impact')
  @Permissions(PermissionKeys.UsersRead)
  removalImpact(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.removalImpact(user.tenantId, id);
  }

  @Post(':id/reset-password')
  @Permissions(PermissionKeys.UsersResetPassword)
  resetPassword(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('generateTemporaryPassword') generateTemporaryPassword?: boolean) {
    return this.users.adminResetPassword(user.tenantId, user.id, id, Boolean(generateTemporaryPassword));
  }

  @Post(':id/resend-invite')
  @Permissions(PermissionKeys.UsersInvite)
  resendInvite(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.resendInvite(user.tenantId, user.id, id);
  }

  @Post(':id/invite')
  @Permissions(PermissionKeys.UsersInvite)
  inviteExistingUser(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.inviteExistingUser(user.tenantId, user.id, id);
  }

  @Post(':id/force-logout')
  @Permissions(PermissionKeys.UsersManage)
  forceLogout(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.users.forceLogout(user.tenantId, user.id, id, reason);
  }

  @Post(':id/test-permission')
  @Permissions(PermissionKeys.UsersRead)
  testPermission(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('permission') permission: string) {
    return this.users.testPermission(user.tenantId, id, permission);
  }

  @Post(':id/module-permissions/preset')
  @Permissions(PermissionKeys.PermissionsEdit)
  applyModulePreset(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { moduleKey: string; presetName: string; companyId?: string; siteId?: string }
  ) {
    return this.users.applyModulePreset(user.tenantId, user.id, id, dto);
  }

  @Post(':id/permissions')
  @Permissions(PermissionKeys.PermissionsEdit)
  addPermissionOverride(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { permissionKeys?: string[]; permissionKey?: string; effect?: 'allow' | 'deny'; companyId?: string; siteId?: string; reason?: string }
  ) {
    return this.users.addPermissionOverride(user.tenantId, user.id, id, dto);
  }

  @Delete(':id/permissions/:overrideId')
  @Permissions(PermissionKeys.PermissionsEdit)
  removePermissionOverride(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('overrideId') overrideId: string) {
    return this.users.removePermissionOverride(user.tenantId, user.id, id, overrideId);
  }

  @Patch(':id/access-scope')
  @Permissions(PermissionKeys.UsersManage)
  updateAccessScope(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { companyIds?: string[]; siteIds?: string[]; unitIds?: string[]; areaIds?: string[]; replace?: boolean }
  ) {
    return this.users.updateAccessScope(user.tenantId, user.id, id, dto);
  }

  @Post(':id/roles')
  @Permissions(PermissionKeys.UsersManage)
  assignRole(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UserRoleDto) {
    return this.users.assignRole(user.tenantId, user.id, id, dto);
  }

  @Delete(':id/roles/:roleId')
  @Permissions(PermissionKeys.UsersManage)
  removeRole(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('roleId') roleId: string) {
    return this.users.removeRole(user.tenantId, user.id, id, roleId);
  }

  @Post(':id/site-access')
  @Permissions(PermissionKeys.UsersManage)
  assignSiteAccess(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UserSiteAccessDto) {
    return this.users.assignSiteAccess(user.tenantId, user.id, id, dto);
  }

  @Delete(':id/site-access/:siteId')
  @Permissions(PermissionKeys.UsersManage)
  removeSiteAccess(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('siteId') siteId: string) {
    return this.users.removeSiteAccess(user.tenantId, user.id, id, siteId);
  }

  @Post(':id/department/:departmentId')
  @Permissions(PermissionKeys.UsersManage)
  assignDepartment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('departmentId') departmentId: string) {
    return this.users.assignDepartment(user.tenantId, user.id, id, departmentId);
  }

  @Post(':id/delegations')
  @Permissions(PermissionKeys.UsersManage)
  assignApprovalDelegation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApprovalDelegationDto) {
    return this.users.assignApprovalDelegation(user.tenantId, user.id, id, dto);
  }

  @Post(':id/contractor-access')
  @Permissions(PermissionKeys.UsersManage)
  assignContractorAccess(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ContractorAccessDto) {
    return this.users.assignContractorAccess(user.tenantId, user.id, id, dto);
  }
}
