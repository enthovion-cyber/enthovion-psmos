export function OverviewRestrictedState({ snapshot }: { snapshot?: Record<string, unknown> }) {
  return <div className="rounded-xl border border-purple-400/25 bg-purple-500/10 p-6 text-sm text-purple-700 dark:text-purple-200"><b>Restricted / redacted view</b><div className="mt-1">Only safe incident metadata is visible for your account.</div>{snapshot ? <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-white/60 p-3 text-xs dark:bg-black/20">{JSON.stringify(snapshot, null, 2)}</pre> : null}</div>;
}
