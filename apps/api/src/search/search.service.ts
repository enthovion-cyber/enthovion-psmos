import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SearchHistoryDto } from './dto/search-history.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchRepository } from './repositories/search.repository';
import { SearchIndexService } from './search-index.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly db: SupabaseService,
    private readonly permissions: PermissionsService,
    private readonly repository: SearchRepository,
    private readonly index: SearchIndexService
  ) {}

  async query(user: RequestUser, dto: SearchQueryDto) {
    const context = await this.searchContext(user);
    const scopedDto = user.corporateView && !user.selectedSiteId ? dto : { ...dto, siteId: dto.siteId ?? user.selectedSiteId ?? undefined };
    return this.repository.query(user.tenantId, scopedDto, context.modules, context.siteIds);
  }

  async suggestions(user: RequestUser, q: string) {
    const context = await this.searchContext(user);
    return this.repository.suggestions(user.tenantId, q, context.modules, context.siteIds);
  }

  recent(user: RequestUser) {
    return this.repository.recent(user.tenantId, user.id);
  }

  history(user: RequestUser, dto: SearchHistoryDto) {
    return this.repository.addHistory(user.tenantId, user.id, dto.query, dto.selectedRecordId, dto.selectedModule);
  }

  async clearRecent(user: RequestUser) {
    const { error } = await this.repository.clearRecent(user.tenantId, user.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  }

  reindex(user: RequestUser, module: string) {
    return module === 'all'
      ? this.index.reindexFoundation(user.tenantId)
      : this.index.reindexModule(user.tenantId, module);
  }

  private async searchContext(user: RequestUser) {
    const livePermissions = await this.permissions.listForUser(user.id, user.tenantId);
    const siteAccess = await this.db.many<any>(
      this.db.from('UserSite').select('siteId').eq('userId', user.id)
    );
    return {
      modules: allowedModules([...new Set([...(user.permissions ?? []), ...livePermissions])]),
      siteIds: [...new Set([...(user.siteIds ?? []), ...siteAccess.map((access) => access.siteId).filter(Boolean)])]
    };
  }
}

function allowedModules(permissions: string[]) {
  const modules: string[] = [];
  if (permissions.includes('equipment.view')) modules.push('equipment');
  if (permissions.includes('actions.view')) modules.push('actions');
  if (permissions.includes('users.view')) modules.push('users');
  if (permissions.includes('roles.manage')) modules.push('roles');
  if (permissions.includes('settings.manage') || permissions.includes('users.view')) modules.push('companies', 'sites', 'units', 'areas');
  return [...new Set(modules)];
}
