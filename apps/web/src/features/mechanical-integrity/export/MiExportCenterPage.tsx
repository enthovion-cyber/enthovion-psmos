'use client';

import { useState } from 'react';
import { useMiExportMutations, useMiExports } from '../hooks/useMiExports';
import { ExportForm } from './ExportForm';
import { ExportJobsTable } from './ExportJobsTable';
import { ExportPackageTable } from './ExportPackageTable';
import { ExportTypeCards } from './ExportTypeCards';

export function MiExportCenterPage() {
  const query = useMiExports();
  const mutations = useMiExportMutations();
  const [message, setMessage] = useState<string>();

  if (query.isLoading) return <div className="p-6"><div className="h-32 animate-pulse rounded-xl bg-[var(--psm-muted-bg)]" /></div>;
  if (query.error) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Unable to load MI export center. Check permissions and backend availability.</div>;

  return (
    <main className="space-y-5 p-4 lg:p-6">
      <header className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--psm-muted)]">Export center</p>
        <h1 className="mt-1 text-2xl font-semibold">Mechanical Integrity Export</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Create permission-filtered exports, packages, equipment integrity files, and controlled downloads with backend audit/history events.</p>
      </header>
      <ExportTypeCards types={query.data?.exportTypes} summary={query.data?.summary} />
      <ExportForm
        formats={query.data?.exportFormats}
        types={query.data?.exportTypes}
        onSubmit={(input) => mutations.createJob.mutate(input, { onSuccess: (result) => setMessage(`Export created: ${result.job.export_number}`) })}
        saving={mutations.createJob.isPending}
      />
      {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">{message}</div> : null}
      <ExportJobsTable rows={query.data?.jobs} onCancel={(id) => mutations.cancelJob.mutate(id)} />
      <ExportPackageTable rows={query.data?.packages} />
    </main>
  );
}
