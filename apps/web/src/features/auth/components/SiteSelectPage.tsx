'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useSelectSite, useSiteSelection } from '../hooks/useSiteSelection';

export function SiteSelectPage() {
  const query = useSiteSelection();
  const select = useSelectSite();
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  async function choose(siteId: string) {
    await select.mutateAsync(siteId);
    setSelectedSite(siteId);
    window.location.href = '/dashboard';
  }
  return (
    <section className="psm-panel w-full max-w-3xl rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Select site</h1>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Your selected site is validated by the backend and used for site-scoped modules.</p>
      {query.isLoading ? <div className="mt-4 text-sm text-[var(--psm-muted)]">Loading sites...</div> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(query.data ?? []).map((site) => (
          <button key={site.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-left hover:border-info" disabled={site.status !== 'ACTIVE'} onClick={() => void choose(site.id)}>
            <div className="font-semibold">{site.name}</div>
            <div className="mt-1 text-xs text-[var(--psm-muted)]">{site.code ?? 'Site'} · {site.country ?? 'Country not set'} · {site.status ?? 'ACTIVE'}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
