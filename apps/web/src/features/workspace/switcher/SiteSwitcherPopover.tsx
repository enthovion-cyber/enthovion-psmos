'use client';

import { Check } from 'lucide-react';
import type { FoundationEntity } from '@/services/foundation.service';

export function SiteSwitcherPopover({
  sites,
  activeSiteId,
  corporateView,
  onSelect
}: {
  sites: FoundationEntity[];
  activeSiteId?: string | null;
  corporateView: boolean;
  onSelect: (siteId: string | null) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1.5 shadow-xl">
      {corporateView ? (
        <button type="button" onClick={() => onSelect(null)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-3)]">
          <span>All assigned sites</span>
          {!activeSiteId ? <Check size={15} className="text-info" /> : null}
        </button>
      ) : null}
      {sites.map((site) => (
        <button key={site.id} type="button" onClick={() => onSelect(site.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-3)]">
          <span className="min-w-0">
            <span className="block truncate font-medium">{site.name}</span>
            <span className="block truncate text-xs text-[var(--psm-muted)]">{site.code ?? site.company?.name ?? 'Assigned site'}</span>
          </span>
          {site.id === activeSiteId ? <Check size={15} className="text-info" /> : null}
        </button>
      ))}
      {!sites.length ? <div className="px-3 py-6 text-center text-xs text-[var(--psm-muted)]">No assigned sites available.</div> : null}
    </div>
  );
}
