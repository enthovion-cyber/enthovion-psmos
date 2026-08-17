'use client';

import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function MiDocumentsHeader({ lastUpdated, onLink, onRefresh }: { lastUpdated?: string | undefined; onLink?: (() => void) | undefined; onRefresh?: (() => void) | undefined }) {
  return <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Mechanical Integrity</p><h1 className="mt-1 text-2xl font-bold">Documents Command Center</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">Controlled document links, required evidence, missing documents, certificate expiry, readiness impact, and waiver workflow.</p><p className="mt-1 text-xs text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not loaded'}</p></div><div className="flex flex-wrap gap-2"><PrimaryButton onClick={onLink}>Link Document</PrimaryButton><ActionButton onClick={onRefresh}>Refresh</ActionButton><a className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold" href="/api/v1/mechanical-integrity/documents/export">Export</a></div></div></header>;
}
