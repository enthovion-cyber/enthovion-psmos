export function OverviewLoadingState() {
  return <div className="grid gap-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-cyan-300/10 dark:bg-[#071525]" />)}</div>;
}
