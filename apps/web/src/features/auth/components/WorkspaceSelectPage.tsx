'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useSelectWorkspace, useWorkspaceSelection } from '../hooks/useWorkspaceSelection';

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
    <section className="psm-panel w-full max-w-3xl rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Select workspace</h1>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Only active companies available to your account are shown.</p>
      {query.isLoading ? <div className="mt-4 text-sm text-[var(--psm-muted)]">Loading workspaces...</div> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(query.data?.companies ?? []).map((company) => (
          <button key={company.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-left hover:border-info" disabled={company.status !== 'ACTIVE'} onClick={() => void choose(company.id)}>
            <div className="font-semibold">{company.name}</div>
            <div className="mt-1 text-xs text-[var(--psm-muted)]">{company.status ?? 'ACTIVE'} · {company.code ?? 'Workspace'}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
