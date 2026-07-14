import type { FoundationContext, FoundationEntity } from '@/services/foundation.service';

export type TenantContext = FoundationContext & {
  activeCompanyId?: string | null;
  activeSiteId?: string | null;
  selectedWorkspace?: FoundationEntity | null;
  selectedSite?: FoundationEntity | null;
  membershipStatus?: string;
  siteAccessLevel?: string;
  requestIp?: string | null;
  userAgent?: string | null;
};

export type ContextSwitchResult = {
  companyId?: string | null;
  siteId?: string | null;
};
