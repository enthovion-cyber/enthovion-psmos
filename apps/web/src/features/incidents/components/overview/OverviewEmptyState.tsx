export function OverviewEmptyState({ message = 'No overview data is available yet.' }: { message?: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-cyan-300/10 dark:bg-[#071525]">{message}</div>;
}
