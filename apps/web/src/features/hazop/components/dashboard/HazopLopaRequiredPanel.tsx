import Link from 'next/link';

export function HazopLopaRequiredPanel({ studies }: { studies: any[] }) {
  return (
    <section className="h-[270px] flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 shadow-sm">
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="mb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--psm-text)]">LOPA Required</h3>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {studies.length}
            </span>
          </div>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</span>
        </div>
        <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1 flex-1">
          {studies.slice(0, 6).map((study) => (
            <Link 
              key={study.id} 
              href={`/hazop/${study.id}?tab=Risk%20Ranking`} 
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5 hover:bg-[var(--psm-surface-2)] transition"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--psm-text)]">{study.study_number}</span>
                <span className="block truncate text-[11px] text-[var(--psm-muted)]">{study.title}</span>
              </div>
              <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-300 shrink-0">
                {study.lopaRequiredCount ?? 0} gaps
              </span>
            </Link>
          ))}
          {!studies.length && (
            <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs text-[var(--psm-muted)]">
              No pending LOPA required studies.
            </div>
          )}
        </div>
      </div>
      <div className="pt-2 text-[10px] text-[var(--psm-muted)] border-t border-[var(--psm-line)] shrink-0">
        IEC 61511 Safety Integrity Level gap
      </div>
    </section>
  );
}
