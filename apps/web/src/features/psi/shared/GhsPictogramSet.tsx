export function GhsPictogramSet({ values }: { values?: string[] | null | undefined }) {
  const items = values?.length ? values : ['No pictogram'];
  return <div className="flex flex-wrap gap-1">{items.map((item) => <span key={item} className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-1 text-xs font-semibold">{item}</span>)}</div>;
}
