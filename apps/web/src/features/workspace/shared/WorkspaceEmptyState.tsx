export function WorkspaceEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{description}</p></div>;
}
