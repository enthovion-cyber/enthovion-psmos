import { foundationService } from '@/services/foundation.service';

export const siteSwitchService = {
  switchSite(siteId: string | null) {
    return foundationService.switchSite(siteId);
  }
};
