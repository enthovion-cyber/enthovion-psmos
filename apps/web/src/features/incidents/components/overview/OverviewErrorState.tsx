export function OverviewErrorState({ error }: { error?: unknown }) {
  const message = error instanceof Error ? error.message : 'The overview could not be loaded.';
  return <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200"><b>Error loading overview</b><div className="mt-1">{message}</div></div>;
}
