import type { MarketingCtaAction } from '../types/marketing.types';
import { resolveMarketingCta, storeMarketingIntent } from '../utils/cta-routing';

export const marketingCtaService = {
  resolve(action: MarketingCtaAction, planCode: string | undefined, isAuthenticated: boolean, hasWorkspace: boolean) {
    storeMarketingIntent(action, planCode);
    return resolveMarketingCta({ action, planCode, isAuthenticated, hasWorkspace });
  }
};
