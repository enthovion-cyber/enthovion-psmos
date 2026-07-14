import { foundationService } from '@/services/foundation.service';

export const companySwitchService = {
  switchCompany(companyId: string) {
    return foundationService.switchCompany(companyId);
  }
};
