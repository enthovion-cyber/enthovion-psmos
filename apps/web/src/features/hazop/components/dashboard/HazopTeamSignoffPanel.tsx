import Link from 'next/link';

export function HazopTeamSignoffPanel({ signoff }: { signoff: any }) {
  const rows = signoff?.rows ?? [];
  return (
    <section className="h-[270px] flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 shadow-sm">
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="mb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--psm-text)]">Team / Sign-Off Pending</h3>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {signoff?.pending ?? rows.length}
            </span>
          </div>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</span>
        </div>
        <div className="space-y-1.5 overflow-y-auto scrollbar-thin pr-1 flex-1">
          {rows.slice(0, 8).map((row: any) => (
            <Link 
              key={row.id} 
              href={`/hazop/${row.study_id}?tab=Review%20%26%20Sign-Off`} 
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 px-2.5 py-1.5 hover:bg-[var(--psm-surface-2)] transition"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--psm-text)]">
                  {row.study?.study_number ?? row.study_number ?? row.signoff_role}
                </span>
                <span className="block truncate text-[11px] text-[var(--psm-muted)]">
                  {row.signoff_role ?? row.discipline ?? 'Reviewer'}
                </span>
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                row.status === 'Signed' 
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {row.status}
              </span>
            </Link>
          ))}
          {!rows.length && (
            <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs text-[var(--psm-muted)]">
              No pending sign-offs.
            </div>
          )}
        </div>
      </div>
      <div className="pt-2 text-[10px] text-[var(--psm-muted)] border-t border-[var(--psm-line)] shrink-0">
        Multi-discipline review authorization
      </div>
    </section>
  );
}
