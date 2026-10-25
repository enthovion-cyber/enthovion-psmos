import { RequestUser } from '../common/decorators/current-user.decorator';
import { AiScope } from './ai.types';

/** Builds the retrieval scope server-side from the authenticated user. The model never influences it. */
export function buildAiScope(user: RequestUser): AiScope {
  return {
    tenantId: user.tenantId,
    userId: user.id,
    siteIds: user.corporateView || user.isSuperAdmin || user.isCompanyAdmin ? [...user.siteIds] : user.activeSiteId ? [user.activeSiteId] : [...user.siteIds],
    corporateView: Boolean(user.corporateView),
    activeSiteId: user.activeSiteId ?? null
  };
}

/** Defense in depth: re-check a record against scope after retrieval. */
export function isRecordInScope(scope: AiScope, row: { tenantId: string; siteId?: string | null }): boolean {
  if (row.tenantId !== scope.tenantId) return false;
  if (!row.siteId) return true;
  return scope.siteIds.includes(row.siteId);
}
