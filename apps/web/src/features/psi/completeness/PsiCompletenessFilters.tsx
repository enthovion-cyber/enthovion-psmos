'use client';

export function PsiCompletenessFilters({ search, onSearch }: { search?: string; onSearch?: (value: string) => void }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Search PSI completeness</label>
      <input value={search ?? ''} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search requirement, gap, source record, module, owner..." className="mt-2 min-h-10 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm text-[var(--psm-fg)] outline-none focus:border-primary" />
    </div>
  );
}
