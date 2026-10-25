'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { useSelectWorkspace, useWorkspaceSelection } from '../hooks/useWorkspaceSelection';
import { AuthBrand } from './AuthBrand';

export function WorkspaceSelectPage() {
  const query = useWorkspaceSelection();
  const select = useSelectWorkspace();
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  async function choose(companyId: string) {
    const result = await select.mutateAsync(companyId);
    if (result.siteId !== undefined) setSelectedSite(result.siteId ?? null);
    window.location.href = '/site/select';
  }
  return (
    <section className="w-full max-w-3xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-[var(--psm-shadow-soft)] transition-colors duration-300 dark:border-[#304461] dark:bg-[#172542] sm:p-7">
      <div className="mb-8 lg:hidden"><AuthBrand compact /></div>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--bg-psm-soft)] text-[var(--action-primary)] dark:bg-[#431407] dark:text-orange-300"><Building2 size={22} /></div>
        <div><h1 className="text-2xl font-semibold tracking-tight">Select workspace</h1><p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-slate-300">Choose the active company workspace where you want to continue.</p></div>
      </div>
      {query.isLoading ? <div className="mt-6 flex items-center gap-2 text-sm text-[var(--psm-muted)]"><Loader2 size={17} className="animate-spin" /> Loading workspaces...</div> : null}
      {!query.isLoading && (query.data?.companies ?? []).length === 0 ? <div className="mt-6 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No active workspace is available for this account. Contact your administrator to request access.</div> : null}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(query.data?.companies ?? []).map((company) => (
          <button key={company.id} className="group rounded-lg border border-[var(--border-interactive)] bg-[var(--psm-surface-2)] p-4 text-left transition hover:border-[var(--psm-primary)] hover:bg-[var(--bg-psm-soft)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#355477] dark:bg-[#10213b] dark:hover:bg-[#1d2944]" disabled={company.status !== 'ACTIVE' || select.isPending} onClick={() => void choose(company.id)} title={company.status !== 'ACTIVE' ? 'This workspace is not active.' : `Open ${company.name}`}>
            <div className="flex items-start justify-between gap-3"><div className="font-semibold group-hover:text-[var(--action-primary)]">{company.name}</div>{company.status === 'ACTIVE' ? <CheckCircle2 size={18} className="shrink-0 text-[var(--psm-success)]" /> : null}</div>
            <div className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--psm-muted)]">{company.status ?? 'ACTIVE'} · {company.code ?? 'Workspace'}</div>
          </button>
        ))}
      </div>
      {select.isPending ? <div className="mt-5 flex items-center gap-2 text-sm text-[var(--psm-muted)]"><Loader2 size={17} className="animate-spin" /> Opening workspace...</div> : null}
    </section>
  );
}
