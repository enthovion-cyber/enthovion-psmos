'use client';

import { useTenantContext } from './useTenantContext';

export function useSiteContext() {
  const query = useTenantContext();
  const sites = query.data?.sites ?? [];
  const activeSiteId = query.data?.activeSiteId ?? query.data?.selectedSiteId ?? null;
  return {
    ...query,
    activeSiteId,
    selectedSite: sites.find((site) => site.id === activeSiteId) ?? null,
    allowedSites: sites,
    corporateView: Boolean(query.data?.corporateView)
  };
}
