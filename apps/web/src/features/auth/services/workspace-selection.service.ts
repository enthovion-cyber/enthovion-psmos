import { foundationService } from '@/services/foundation.service';

export const workspaceSelectionService = {
  workspaces: () => foundationService.workspaces(),
  sites: () => foundationService.allowedSites(),
  selectWorkspace: (companyId: string) => foundationService.switchCompany(companyId),
  selectSite: (siteId: string | null) => foundationService.switchSite(siteId)
};
