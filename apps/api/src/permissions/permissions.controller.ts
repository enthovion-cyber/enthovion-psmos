import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from './constants/permission-keys';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get('permissions')
  @Permissions(PermissionKeys.PermissionsView)
  list(@CurrentUser() user: RequestUser) {
    return this.permissions.list(user.tenantId);
  }

  @Get('admin/permissions')
  @Permissions(PermissionKeys.PermissionsView)
  adminList(@CurrentUser() user: RequestUser) {
    return this.permissions.list(user.tenantId);
  }

  @Get('me/permissions')
  mePermissions(@CurrentUser() user: RequestUser) {
    return this.permissions.listForUser(user.id, user.tenantId);
  }

  @Get('auth/me/permissions')
  authMePermissions(@CurrentUser() user: RequestUser) {
    return this.permissions.profileEffectiveForUser(user.id, user.tenantId);
  }

  @Get('auth/me/navigation')
  authMeNavigation(@CurrentUser() user: RequestUser) {
    return this.permissions.navigationForUser(user.id, user.tenantId);
  }

  @Post('auth/check-permission')
  checkPermission(@CurrentUser() user: RequestUser, @Body('permission') permission: string) {
    return this.permissions.check(user.id, user.tenantId, permission);
  }

  @Get('admin/users/:id/effective-permissions')
  @Permissions(PermissionKeys.PermissionsView)
  userEffectivePermissions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query('includeDenied') includeDenied?: string) {
    return this.permissions.effectiveForUser(id, user.tenantId, { includeDenied: includeDenied === 'true' });
  }
}
