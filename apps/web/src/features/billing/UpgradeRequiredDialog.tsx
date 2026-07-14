export function UpgradeRequiredDialog({ title, reason }: { title: string; reason: string }) {
  return <div className="psm-panel rounded-xl border border-warning/40 p-5"><h2 className="text-lg font-semibold text-warning">{title}</h2><p className="mt-2 text-sm text-[var(--psm-muted)]">{reason}</p><a className="psm-button psm-button-primary mt-4 inline-flex" href="/settings/billing/plan">View plans</a></div>;
}
