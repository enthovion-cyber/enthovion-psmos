import type { Permit } from '@/services/ptw.service';
import { PermitListItem } from './PermitListItem';

interface PermitRegisterPanelProps {
  permits: Permit[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  page: number;
  onPage: (page: number) => void;
}

export function PermitRegisterPanel({
  permits,
  selectedId,
  loading,
  onSelect,
  page,
  onPage
}: PermitRegisterPanelProps) {
  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] shadow-xs dark:shadow-xl transition-all duration-300">
      {/* Header Sticky Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <h2 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            Active Permits
            <span className="ml-1.5 rounded-md bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-slate-800 dark:text-cyan-400 border border-slate-300 dark:border-slate-700/50">
              {permits.length}
            </span>
          </h2>
        </div>
        <span className="text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Live Monitor
        </span>
      </div>

      {/* Main Content Area */}
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 px-1.5 py-2 space-y-1.5">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="mx-1 h-[76px] animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-900"
            />
          ))
        ) : null}

        {!loading &&
          permits.map((permit) => (
            <div
              key={permit.id}
              className={`rounded-lg transition-all duration-200 border ${
                selectedId === permit.id
                  ? 'border-primary/60 dark:border-cyan-500/40 bg-orange-50/80 dark:bg-cyan-950/20 shadow-sm'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-900/40'
              }`}
            >
              <PermitListItem
                permit={permit}
                selected={selectedId === permit.id}
                onSelect={() => onSelect(permit.id)}
              />
            </div>
          ))}

        {!loading && !permits.length ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="h-8 w-8 text-slate-400 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">No active permits match criteria.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Adjust filter settings to scan wider area sectors.</p>
          </div>
        ) : null}
      </div>

      {/* Footer Navigation Sticky Bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/70 px-4 py-2.5 backdrop-blur-md">
        <button
          className="ptw-toolbar-button h-8 px-2.5 text-[11px]"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Page</span>
          <span className="rounded bg-white dark:bg-slate-950 px-2 py-0.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
            {page}
          </span>
        </div>

        <button
          className="ptw-toolbar-button h-8 px-2.5 text-[11px]"
          disabled={permits.length < 10}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  );
}
