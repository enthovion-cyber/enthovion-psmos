import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['roles', 'admin/roles'])
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions(PermissionKeys.RolesView)
  list(@CurrentUser() user: RequestUser) {
    return this.roles.list(user.tenantId);
  }

  @Get(':id')
  @Permissions(PermissionKeys.RolesView)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.roles.get(user.tenantId, id);
  }

  @Post()
  @Permissions(PermissionKeys.RolesCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateRoleDto) {
    return this.roles.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @Permissions(PermissionKeys.RolesEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(user.tenantId, user.id, id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionKeys.RolesManage)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.roles.delete(user.tenantId, user.id, id);
  }

  @Post(':id/duplicate')
  @Permissions(PermissionKeys.RolesManage)
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('name') name?: string) {
    return this.roles.duplicate(user.tenantId, user.id, id, name);
  }

  @Get(':id/users')
  @Permissions(PermissionKeys.RolesView)
  users(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.roles.usersForRole(user.tenantId, id);
  }

  @Post(':id/permissions')
  @Permissions(PermissionKeys.RolesAssign)
  setPermissions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    return this.roles.setPermissions(user.tenantId, user.id, id, permissionIds ?? []);
  }
}
