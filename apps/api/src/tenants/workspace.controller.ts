import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { FoundationEntityDto } from './dto/foundation-entity.dto';
import { RlsHealthCheckService } from './rls-health-check.service';
import { SessionContextRefreshService } from './session-context-refresh.service';
import { TenantsService } from './tenants.service';

@ApiTags('workspace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller()
export class WorkspaceController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly sessionContextRefresh: SessionContextRefreshService,
    private readonly rlsHealth: RlsHealthCheckService
  ) {}

  @Get('auth/me/workspaces')
  @Permissions(PermissionKeys.TenantContextView)
  workspaces(@CurrentUser() user: RequestUser) {
    return this.tenants.context(user);
  }

  @Get('auth/me/tenant-context')
  @Permissions(PermissionKeys.TenantContextView)
  tenantContext(@CurrentUser() user: RequestUser) {
    return this.tenants.context(user);
  }

  @Get('auth/me/allowed-sites')
  @Permissions(PermissionKeys.TenantContextView)
  async allowedSites(@CurrentUser() user: RequestUser) {
    const context = await this.tenants.context(user);
    return context.sites;
  }

  @Get('auth/me/allowed-companies')
  @Permissions(PermissionKeys.TenantContextView)
  allowedCompanies(@CurrentUser() user: RequestUser) {
    return this.tenants.allowedCompanies(user);
  }

  @Post('auth/me/switch-company')
  @Permissions(PermissionKeys.TenantSwitchCompany)
  switchCompany(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto, @Req() req: RequestLike) {
    return this.tenants.switchCompany(user, dto.companyId ?? '', this.requestMeta(req));
  }

  @Post('auth/me/select-workspace')
  @Permissions(PermissionKeys.TenantSwitchCompany)
  selectWorkspace(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto, @Req() req: RequestLike) {
    return this.tenants.switchCompany(user, dto.companyId ?? '', this.requestMeta(req));
  }

  @Post('auth/me/switch-site')
  @Permissions(PermissionKeys.TenantSwitchSite)
  switchSite(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto, @Req() req: RequestLike) {
    return this.tenants.switchSite(user, dto.siteId ?? null, this.requestMeta(req));
  }

  @Post('auth/me/select-site')
  @Permissions(PermissionKeys.TenantSwitchSite)
  selectSite(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto, @Req() req: RequestLike) {
    return this.tenants.switchSite(user, dto.siteId ?? null, this.requestMeta(req));
  }

  @Get('auth/me/security-events')
  @Permissions(PermissionKeys.TenantContextView)
  securityEvents(@CurrentUser() user: RequestUser) {
    return this.tenants.securityEvents(user);
  }

  @Post('auth/me/refresh-context')
  @Permissions(PermissionKeys.TenantContextView)
  refreshContext(@CurrentUser() user: RequestUser, @Req() req: RequestLike) {
    return this.sessionContextRefresh.refresh(user, this.requestMeta(req));
  }

  @Get('settings/tenant-context/debug')
  @Permissions(PermissionKeys.SettingsManage)
  tenantContextDebug(@CurrentUser() user: RequestUser) {
    return this.tenants.tenantContextDebug(user);
  }

  @Get('settings/rls-health-check')
  @Permissions(PermissionKeys.SettingsManage)
  rlsHealthCheck() {
    return this.rlsHealth.rlsHealth();
  }

  @Get('settings/site-access-health-check')
  @Permissions(PermissionKeys.SettingsManage)
  siteAccessHealthCheck(@CurrentUser() user: RequestUser) {
    return this.rlsHealth.siteAccessHealth(user.tenantId);
  }

  @Post('onboarding/company/start')
  @Permissions(PermissionKeys.CompanyCreate)
  startOnboarding(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createCompany(user.tenantId, user.id, dto);
  }

  @Get('onboarding/company/current')
  @Permissions(PermissionKeys.CompanyView)
  currentOnboarding(@CurrentUser() user: RequestUser) {
    return this.tenants.getCompanySettings(user.tenantId, user.companyIds[0]);
  }

  @Patch('onboarding/company/profile')
  @Permissions(PermissionKeys.CompanyEdit)
  updateOnboardingProfile(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateCompany(user.tenantId, user.id, dto.companyId ?? user.companyIds[0] ?? '', dto);
  }

  @Post('onboarding/company/domain')
  @Permissions(PermissionKeys.CompanyDomainManage)
  addOnboardingDomain(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createDomain(user.tenantId, user.id, dto, dto.companyId ?? user.companyIds[0]);
  }

  @Post('onboarding/company/sites')
  @Permissions(PermissionKeys.SiteCreate)
  addOnboardingSite(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createSite(user.tenantId, user.id, dto);
  }

  @Post('onboarding/company/departments')
  @Permissions(PermissionKeys.DepartmentCreate)
  addOnboardingDepartment(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createDepartment(user.tenantId, user.id, dto);
  }

  @Post('onboarding/company/process-units')
  @Permissions(PermissionKeys.UnitCreate)
  addOnboardingUnit(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createUnit(user.tenantId, user.id, dto);
  }

  @Post('onboarding/company/areas')
  @Permissions(PermissionKeys.AreaCreate)
  addOnboardingArea(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createArea(user.tenantId, user.id, dto);
  }

  @Post('onboarding/company/complete')
  @Permissions(PermissionKeys.CompanyManage)
  completeOnboarding(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.completeOnboarding(user, dto);
  }

  @Get('settings/company')
  @Permissions(PermissionKeys.CompanyView)
  getCompanySettings(@CurrentUser() user: RequestUser) {
    return this.tenants.getCompanySettings(user.tenantId, user.companyIds[0]);
  }

  @Patch('settings/company')
  @Permissions(PermissionKeys.CompanyEdit)
  updateCompanySettings(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateCompanySettings(user.tenantId, user.id, dto, user.companyIds[0]);
  }

  @Get('settings/company/domains')
  @Permissions(PermissionKeys.CompanyDomainView)
  getCompanyDomains(@CurrentUser() user: RequestUser) {
    return this.tenants.listDomains(user.tenantId, user.companyIds[0]);
  }

  @Post('settings/company/domains')
  @Permissions(PermissionKeys.CompanyDomainManage)
  createCompanyDomain(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createDomain(user.tenantId, user.id, dto, user.companyIds[0]);
  }

  @Patch('settings/company/domains/:domainId')
  @Permissions(PermissionKeys.CompanyDomainManage)
  updateCompanyDomain(@CurrentUser() user: RequestUser, @Param('domainId') domainId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateDomain(user.tenantId, user.id, domainId, dto);
  }

  @Post('settings/company/domains/:domainId/verify')
  @Permissions(PermissionKeys.CompanyDomainManage)
  verifyCompanyDomain(@CurrentUser() user: RequestUser, @Param('domainId') domainId: string) {
    return this.tenants.verifyDomain(user.tenantId, user.id, domainId);
  }

  @Delete('settings/company/domains/:domainId')
  @Permissions(PermissionKeys.CompanyDomainManage)
  archiveCompanyDomain(@CurrentUser() user: RequestUser, @Param('domainId') domainId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveDomain(user.tenantId, user.id, domainId, dto.reason);
  }

  @Get('settings/sites')
  @Permissions(PermissionKeys.SiteView)
  sites(@CurrentUser() user: RequestUser) {
    return this.tenants.listSites(user.tenantId);
  }

  @Post('settings/sites')
  @Permissions(PermissionKeys.SiteCreate)
  createSite(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createSite(user.tenantId, user.id, dto);
  }

  @Patch('settings/sites/:siteId')
  @Permissions(PermissionKeys.SiteEdit)
  updateSite(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateSite(user.tenantId, user.id, siteId, dto);
  }

  @Delete('settings/sites/:siteId')
  @Permissions(PermissionKeys.SiteDelete)
  archiveSite(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Site', siteId, dto.reason);
  }

  @Get('settings/departments')
  @Permissions(PermissionKeys.DepartmentView)
  departments(@CurrentUser() user: RequestUser) {
    return this.tenants.listDepartments(user.tenantId);
  }

  @Post('settings/departments')
  @Permissions(PermissionKeys.DepartmentCreate)
  createDepartment(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createDepartment(user.tenantId, user.id, dto);
  }

  @Patch('settings/departments/:departmentId')
  @Permissions(PermissionKeys.DepartmentEdit)
  updateDepartment(@CurrentUser() user: RequestUser, @Param('departmentId') departmentId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateDepartment(user.tenantId, user.id, departmentId, dto);
  }

  @Delete('settings/departments/:departmentId')
  @Permissions(PermissionKeys.DepartmentDelete)
  archiveDepartment(@CurrentUser() user: RequestUser, @Param('departmentId') departmentId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Department', departmentId, dto.reason);
  }

  @Get('settings/process-units')
  @Permissions(PermissionKeys.UnitView)
  units(@CurrentUser() user: RequestUser) {
    return this.tenants.listUnits(user.tenantId);
  }

  @Post('settings/process-units')
  @Permissions(PermissionKeys.UnitCreate)
  createUnit(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createUnit(user.tenantId, user.id, dto);
  }

  @Patch('settings/process-units/:unitId')
  @Permissions(PermissionKeys.UnitEdit)
  updateUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateUnit(user.tenantId, user.id, unitId, dto);
  }

  @Delete('settings/process-units/:unitId')
  @Permissions(PermissionKeys.UnitDelete)
  archiveUnit(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Unit', unitId, dto.reason);
  }

  @Get('settings/areas')
  @Permissions(PermissionKeys.AreaView)
  areas(@CurrentUser() user: RequestUser) {
    return this.tenants.listAreas(user.tenantId);
  }

  @Post('settings/areas')
  @Permissions(PermissionKeys.AreaCreate)
  createArea(@CurrentUser() user: RequestUser, @Body() dto: FoundationEntityDto) {
    return this.tenants.createArea(user.tenantId, user.id, dto);
  }

  @Patch('settings/areas/:areaId')
  @Permissions(PermissionKeys.AreaEdit)
  updateArea(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.updateArea(user.tenantId, user.id, areaId, dto);
  }

  @Delete('settings/areas/:areaId')
  @Permissions(PermissionKeys.AreaDelete)
  archiveArea(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Body() dto: FoundationEntityDto) {
    return this.tenants.archiveEntity(user.tenantId, user.id, 'Area', areaId, dto.reason);
  }

  private requestMeta(req: RequestLike) {
    const userAgent = req.headers['user-agent'];
    return {
      ip: req.ip ?? req.socket?.remoteAddress ?? null,
      userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent ?? null
    };
  }
}

type RequestLike = {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
};
