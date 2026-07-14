'use client';

import { useCompanyOnboarding } from '../hooks/useCompanyOnboarding';
import type { FoundationInput } from '@/services/foundation.service';
import { useMutationToast } from '@/providers/ToastProvider';

export function ReviewCreateWorkspaceStep({ draft }: { draft: FoundationInput }) {
  const onboarding = useCompanyOnboarding();
  const toast = useMutationToast();
  const missing = ['name', 'code', 'country', 'timezone'].filter((key) => !(draft as any)[key]);
  async function create() {
    try {
      await onboarding.start.mutateAsync(draft);
      toast.success('Company workspace created');
    } catch (error) {
      toast.error('Workspace creation failed', error instanceof Error ? error.message : 'Request failed');
    }
  }
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">Review & Create Workspace</h2>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Summary label="Company" value={draft.name} />
        <Summary label="Code" value={draft.code} />
        <Summary label="Domain" value={draft.domain} />
        <Summary label="Site" value={(draft as any).siteName} />
        <Summary label="Department" value={(draft as any).departmentName} />
        <Summary label="Unit / Area" value={[(draft as any).unitName, (draft as any).areaName].filter(Boolean).join(' / ')} />
      </div>
      {missing.length ? <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Missing required fields: {missing.join(', ')}</div> : null}
      <button className="psm-button psm-button-primary mt-5" disabled={Boolean(missing.length) || onboarding.start.isPending} title={missing.length ? 'Complete required workspace fields first' : 'Create workspace'} onClick={create}>{onboarding.start.isPending ? 'Creating...' : 'Create Workspace'}</button>
    </section>
  );
}

function Summary({ label, value }: { label: string; value?: string | null | undefined }) {
  return <div className="rounded-xl border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value || '-'}</div></div>;
}
