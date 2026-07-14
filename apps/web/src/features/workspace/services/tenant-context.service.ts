import { foundationService } from '@/services/foundation.service';
import type { TenantContext } from '../types/tenant-context.types';

export const tenantContextService = {
  get(): Promise<TenantContext> {
    return foundationService.context() as Promise<TenantContext>;
  },
  refresh(): Promise<TenantContext> {
    return foundationService.refreshContext() as Promise<TenantContext>;
  },
  securityEvents() {
    return foundationService.securityEvents();
  }
};
