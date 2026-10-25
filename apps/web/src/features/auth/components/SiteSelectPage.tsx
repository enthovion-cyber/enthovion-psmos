'use client';

import { useAuthStore } from '@/stores/auth.store';
import { CheckCircle2, Factory, Loader2 } from 'lucide-react';
import { useSelectSite, useSiteSelection } from '../hooks/useSiteSelection';
import { AuthBrand } from './AuthBrand';

export function SiteSelectPage() {
  const query = useSiteSelection();
  const select = useSelectSite();
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  async function choose(siteId: string) {
    await select.mutateAsync(siteId);
    setSelectedSite(siteId);
    window.location.href = '/executive';
  }
  return (
    <section className="w-full max-w-3xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-[var(--psm-shadow-soft)] transition-colors duration-300 dark:border-[#304461] dark:bg-[#172542] sm:p-7">
      <div className="mb-8 lg:hidden"><AuthBrand compact /></div>
      <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--bg-psm-soft)] text-[var(--action-primary)] dark:bg-[#431407] dark:text-orange-300"><Factory size={22} /></div><div><h1 className="text-2xl font-semibold tracking-tight">Select site</h1><p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-slate-300">Your site choice is validated by the backend and applies to site-scoped modules.</p></div></div>
      {query.isLoading ? <div className="mt-6 flex items-center gap-2 text-sm text-[var(--psm-muted)]"><Loader2 size={17} className="animate-spin" /> Loading sites...</div> : null}
      {!query.isLoading && (query.data ?? []).length === 0 ? <div className="mt-6 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No active site is available in the selected workspace.</div> : null}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(query.data ?? []).map((site) => (
          <button key={site.id} className="group rounded-lg border border-[var(--border-interactive)] bg-[var(--psm-surface-2)] p-4 text-left transition hover:border-[var(--psm-primary)] hover:bg-[var(--bg-psm-soft)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#355477] dark:bg-[#10213b] dark:hover:bg-[#1d2944]" disabled={site.status !== 'ACTIVE' || select.isPending} onClick={() => void choose(site.id)} title={site.status !== 'ACTIVE' ? 'This site is not active.' : `Open ${site.name}`}>
            <div className="flex items-start justify-between gap-3"><div className="font-semibold group-hover:text-[var(--action-primary)]">{site.name}</div>{site.status === 'ACTIVE' ? <CheckCircle2 size={18} className="shrink-0 text-[var(--psm-success)]" /> : null}</div>
            <div className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--psm-muted)]">{site.code ?? 'Site'} · {site.country ?? 'Country not set'} · {site.status ?? 'ACTIVE'}</div>
          </button>
        ))}
      </div>
      {select.isPending ? <div className="mt-5 flex items-center gap-2 text-sm text-[var(--psm-muted)]"><Loader2 size={17} className="animate-spin" /> Opening site...</div> : null}
    </section>
  );
}
