'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Factory } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenantContext } from '../context/useTenantContext';
import { companySwitchService } from '../services/company-switch.service';
import { useAuthStore } from '@/stores/auth.store';
import { ContextSwitchLoadingOverlay } from './ContextSwitchLoadingOverlay';

const moduleQueryRoots = ['dashboard', 'equipment', 'actions', 'documents', 'notifications', 'search', 'ptw', 'moc', 'pssr', 'hazop', 'lopa', 'incidents', 'reports', 'settings', 'foundation', 'workspace', 'iam'];

export function CompanySwitcher() {
  const queryClient = useQueryClient();
  const contextQuery = useTenantContext();
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const companies = contextQuery.data?.companies ?? [];
  const activeCompanyId = contextQuery.data?.activeCompanyId ?? contextQuery.data?.companyIds?.[0] ?? null;
  const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? companies[0] ?? null;

  async function switchCompany(companyId: string) {
    setError(null);
    setSwitching(true);
    try {
      const result = await companySwitchService.switchCompany(companyId);
      setSelectedSite(result.siteId ?? null);
      setOpen(false);
      await Promise.all(moduleQueryRoots.map((root) => queryClient.invalidateQueries({ queryKey: [root] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Company switch failed. Check your workspace access and try again.');
    } finally {
      setSwitching(false);
    }
  }

  if (contextQuery.isLoading) {
    return <div className="hidden h-11 w-52 animate-pulse rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] xl:block" />;
  }

  return (
    <div className="relative hidden w-full max-w-52 xl:block">
      {switching ? <ContextSwitchLoadingOverlay label="Switching company workspace..." /> : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm shadow-sm hover:bg-[var(--psm-surface-2)]">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Factory size={17} /></span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-medium">{activeCompany?.name ?? 'Select company'}</span>
            <span className="block truncate text-xs text-[var(--psm-muted)]">{activeCompany?.code ?? 'Workspace'}</span>
          </span>
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-[var(--psm-muted)]" />
      </button>
      {error ? <div className="mt-1 rounded-lg border border-danger/25 bg-danger/10 px-2 py-1 text-xs text-danger">{error}</div> : null}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1.5 shadow-xl">
          {companies.map((company) => (
            <button key={company.id} type="button" onClick={() => switchCompany(company.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-3)]">
              <span className="min-w-0">
                <span className="block truncate font-medium">{company.name}</span>
                <span className="block truncate text-xs text-[var(--psm-muted)]">{company.code ?? company.status ?? 'Assigned company'}</span>
              </span>
              {company.id === activeCompanyId ? <Check size={15} className="text-info" /> : null}
            </button>
          ))}
          {!companies.length ? <div className="px-3 py-6 text-center text-xs text-[var(--psm-muted)]">No assigned companies available.</div> : null}
        </div>
      ) : null}
    </div>
  );
}
