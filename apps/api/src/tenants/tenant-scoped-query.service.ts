import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { TenantContext } from './tenant-context.service';

@Injectable()
export class TenantScopedQueryService {
  constructor(private readonly db: SupabaseService) {}

  scopeWhere(context: TenantContext, query: any, options?: { companyColumn?: string; siteColumn?: string; companyId?: string | null; siteId?: string | null }) {
    const companyColumn = options?.companyColumn ?? 'companyId';
    const siteColumn = options?.siteColumn ?? 'siteId';
    let scoped = query.eq('tenantId', context.tenantId);
    const companyId = options?.companyId ?? context.activeCompanyId;
    const siteId = options?.siteId ?? context.activeSiteId;
    if (!context.isSuperAdmin && !context.corporateView) {
      if (companyId) {
        if (!context.companyIds.includes(companyId)) throw new ForbiddenException('Company scope is not allowed');
        scoped = scoped.eq(companyColumn, companyId);
      } else if (context.companyIds.length) {
        scoped = scoped.in(companyColumn, context.companyIds);
      }
      if (siteId) {
        if (!context.siteIds.includes(siteId)) throw new ForbiddenException('Site scope is not allowed');
        scoped = scoped.eq(siteColumn, siteId);
      } else if (context.siteIds.length) {
        scoped = scoped.in(siteColumn, context.siteIds);
      }
    }
    return scoped;
  }

  scopeCreate(context: TenantContext, data: Record<string, unknown>, options?: { companyId?: string | null; siteId?: string | null }) {
    const companyId = options?.companyId ?? context.activeCompanyId ?? data.companyId;
    const siteId = options?.siteId ?? context.activeSiteId ?? data.siteId;
    if (companyId && !context.isSuperAdmin && !context.corporateView && !context.companyIds.includes(String(companyId))) {
      throw new ForbiddenException('Company scope is not allowed');
    }
    if (siteId && !context.isSuperAdmin && !context.corporateView && !context.siteIds.includes(String(siteId))) {
      throw new ForbiddenException('Site scope is not allowed');
    }
    return {
      ...data,
      tenantId: context.tenantId,
      companyId: companyId ?? null,
      siteId: siteId ?? null
    };
  }

  async assertRecordAccess(context: TenantContext, table: string, id: string, options?: { companyColumn?: string; siteColumn?: string }) {
    const record = await this.db.single<any>(this.db.from(table).select('*').eq('tenantId', context.tenantId).eq('id', id).maybeSingle());
    if (!record) throw new NotFoundException(`${table} record was not found`);
    const companyId = record[options?.companyColumn ?? 'companyId'];
    const siteId = record[options?.siteColumn ?? 'siteId'];
    if (!context.isSuperAdmin && !context.corporateView && companyId && !context.companyIds.includes(companyId)) {
      throw new ForbiddenException('Record is outside the current user company access scope');
    }
    if (!context.isSuperAdmin && !context.corporateView && siteId && !context.siteIds.includes(siteId)) {
      throw new ForbiddenException('Record is outside the current user site access scope');
    }
    return record;
  }

  assertCompanyAccess(context: TenantContext, companyId?: string | null) {
    if (companyId && !context.isSuperAdmin && !context.corporateView && !context.companyIds.includes(companyId)) throw new ForbiddenException('Company scope is not allowed');
  }

  assertSiteAccess(context: TenantContext, siteId?: string | null) {
    if (siteId && !context.isSuperAdmin && !context.corporateView && !context.siteIds.includes(siteId)) throw new ForbiddenException('Site scope is not allowed');
  }

  getAllowedCompanyIds(context: TenantContext) {
    return context.companyIds;
  }

  getAllowedSiteIds(context: TenantContext) {
    return context.siteIds;
  }
}
