import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SiteGuard } from '../common/guards/site.guard';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CompanySwitchService } from './company-switch.service';
import { CurrentTenantContextService } from './current-tenant-context.service';
import { EffectivePermissionService } from './effective-permission.service';
import { NavigationBuilderService } from './navigation-builder.service';
import { PermissionGuardService } from './permission-guard.service';
import { RlsHealthCheckService } from './rls-health-check.service';
import { SessionContextRefreshService } from './session-context-refresh.service';
import { SiteAccessService } from './site-access.service';
import { SiteContextService } from './site-context.service';
import { SiteSwitchService } from './site-switch.service';
import { TenantAccessService } from './tenant-access.service';
import { TenantAuditService } from './tenant-audit.service';
import { TenantContextService } from './tenant-context.service';
import { TenantScopedQueryService } from './tenant-scoped-query.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { WorkspaceController } from './workspace.controller';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule],
  controllers: [TenantsController, WorkspaceController],
  providers: [
    TenantsService,
    TenantContextService,
    CurrentTenantContextService,
    SiteContextService,
    CompanySwitchService,
    SiteSwitchService,
    TenantAccessService,
    SiteAccessService,
    TenantScopedQueryService,
    PermissionGuardService,
    EffectivePermissionService,
    NavigationBuilderService,
    TenantAuditService,
    RlsHealthCheckService,
    SessionContextRefreshService,
    SiteGuard
  ],
  exports: [
    TenantsService,
    TenantContextService,
    CurrentTenantContextService,
    SiteContextService,
    TenantAccessService,
    SiteAccessService,
    TenantScopedQueryService,
    PermissionGuardService,
    EffectivePermissionService,
    NavigationBuilderService,
    SiteGuard
  ]
})
export class TenantsModule {}
