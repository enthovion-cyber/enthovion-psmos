'use client';

import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSiteContext } from '../context/useSiteContext';
import { siteSwitchService } from '../services/site-switch.service';
import { useAuthStore } from '@/stores/auth.store';
import { SiteSwitcherPopover } from './SiteSwitcherPopover';
import { ContextSwitchLoadingOverlay } from './ContextSwitchLoadingOverlay';

const moduleQueryRoots = ['dashboard', 'equipment', 'actions', 'documents', 'notifications', 'search', 'ptw', 'moc', 'pssr', 'hazop', 'lopa', 'incidents', 'reports', 'settings', 'foundation', 'workspace', 'iam'];

export function WorkspaceSiteSwitcher() {
  const queryClient = useQueryClient();
  const siteContext = useSiteContext();
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const sites = siteContext.allowedSites;
  const activeSiteId = siteContext.activeSiteId ?? null;
  const activeSite = sites.find((site) => site.id === activeSiteId) ?? null;

  async function switchSite(siteId: string | null) {
    setError(null);
    setSwitching(true);
    try {
      const result = await siteSwitchService.switchSite(siteId);
      setSelectedSite(result.siteId ?? null);
      setOpen(false);
      await Promise.all(moduleQueryRoots.map((root) => queryClient.invalidateQueries({ queryKey: [root] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Site switch failed. Check your access and try again.');
    } finally {
      setSwitching(false);
    }
  }

  if (siteContext.isLoading) {
    return <div className="h-11 w-56 animate-pulse rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]" />;
  }

  return (
    <div className="relative w-full sm:max-w-56">
      {switching ? <ContextSwitchLoadingOverlay label="Switching active site..." /> : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm shadow-sm hover:bg-[var(--psm-surface-2)]">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-info/10 text-info"><Building2 size={17} /></span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-medium">{activeSite?.name ?? (siteContext.corporateView ? 'All assigned sites' : 'Select site')}</span>
            <span className="block truncate text-xs text-[var(--psm-muted)]">{activeSite?.code ?? 'Site context'}</span>
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[var(--psm-muted)] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {error ? <div className="mt-1 rounded-lg border border-danger/25 bg-danger/10 px-2 py-1 text-xs text-danger">{error}</div> : null}
      {open ? <SiteSwitcherPopover sites={sites} activeSiteId={activeSiteId} corporateView={siteContext.corporateView} onSelect={switchSite} /> : null}
    </div>
  );
}
