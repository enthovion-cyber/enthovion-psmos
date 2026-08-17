import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function MiReliefDeviceSyncDiffPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <PsiCard title="MI Relief Device Sync / Change Detection" subtitle="Synchronization events and compare-only results from Mechanical Integrity relief devices.">
      {!rows.length ? <PsiEmptyState title="No MI sync events" message="Use Compare MI to detect device status, set pressure, capacity, bypass, impairment, and test status differences." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => <div key={String(row.id ?? row.created_at)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{String(row.sync_type ?? row.status ?? 'MI sync')}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{String(row.created_at ?? '')}</p><pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(row.diff_json ?? row.metadata_json ?? row, null, 2)}</pre></div>)}
        </div>
      )}
    </PsiCard>
  );
}
