import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { FoundationEntityDto } from './dto/foundation-entity.dto';
import { TenantsService } from './tenants.service';

@ApiTags('foundation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('foundation')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('context')
  context(@CurrentUser() user: RequestUser) {
    return this.tenants.context(user);
  }

  @Get('companies')
  @Permissions(PermissionKeys.SettingsManage)
  companies(@CurrentUser() user: RequestUser) {
    return this.tenants.listCompanies(user.tenantId);
  }

  @Post('companies')
  @Permissions(PermissionKeys.SettingsManage)
  createCompany(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createCompany(user.tenantId, user.id, dto);
  }

  @Patch('companies/:id')
  @Permissions(PermissionKeys.SettingsManage)
  updateCompany(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateCompany(user.tenantId, user.id, id, dto);
  }

  @Get('sites')
  @Permissions(PermissionKeys.SettingsManage)
  sites(@CurrentUser() user: RequestUser) {
    return this.tenants.listSites(user.tenantId);
  }

  @Post('sites')
  @Permissions(PermissionKeys.SettingsManage)
  createSite(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createSite(user.tenantId, user.id, dto);
  }

  @Patch('sites/:id')
  @Permissions(PermissionKeys.SettingsManage)
  updateSite(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateSite(user.tenantId, user.id, id, dto);
  }

  @Delete('sites/:id')
  @Permissions(PermissionKeys.SiteDelete)
  archiveSite(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Site', id, dto.reason);
  }

  @Get('departments')
  @Permissions(PermissionKeys.SettingsManage)
  departments(@CurrentUser() user: RequestUser) {
    return this.tenants.listDepartments(user.tenantId);
  }

  @Post('departments')
  @Permissions(PermissionKeys.SettingsManage)
  createDepartment(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createDepartment(user.tenantId, user.id, dto);
  }

  @Patch('departments/:id')
  @Permissions(PermissionKeys.SettingsManage)
  updateDepartment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateDepartment(user.tenantId, user.id, id, dto);
  }

  @Delete('departments/:id')
  @Permissions(PermissionKeys.DepartmentDelete)
  archiveDepartment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Department', id, dto.reason);
  }

  @Get('units')
  @Permissions(PermissionKeys.SettingsManage)
  units(@CurrentUser() user: RequestUser) {
    return this.tenants.listUnits(user.tenantId);
  }

  @Post('units')
  @Permissions(PermissionKeys.SettingsManage)
  createUnit(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createUnit(user.tenantId, user.id, dto);
  }

  @Patch('units/:id')
  @Permissions(PermissionKeys.SettingsManage)
  updateUnit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateUnit(user.tenantId, user.id, id, dto);
  }

  @Delete('units/:id')
  @Permissions(PermissionKeys.UnitDelete)
  archiveUnit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Unit', id, dto.reason);
  }

  @Get('areas')
  @Permissions(PermissionKeys.SettingsManage)
  areas(@CurrentUser() user: RequestUser) {
    return this.tenants.listAreas(user.tenantId);
  }

  @Post('areas')
  @Permissions(PermissionKeys.SettingsManage)
  createArea(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createArea(user.tenantId, user.id, dto);
  }

  @Patch('areas/:id')
  @Permissions(PermissionKeys.SettingsManage)
  updateArea(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateArea(user.tenantId, user.id, id, dto);
  }

  @Delete('areas/:id')
  @Permissions(PermissionKeys.AreaDelete)
  archiveArea(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Area', id, dto.reason);
  }
}
