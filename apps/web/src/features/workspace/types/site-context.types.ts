import type { FoundationEntity } from '@/services/foundation.service';

export type SiteContext = {
  activeSiteId?: string | null;
  selectedSite?: FoundationEntity | null;
  allowedSites: FoundationEntity[];
  corporateView: boolean;
};
