export function HazopBeforeAfterViewer({ before, after }: { before: any; after: any }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (!keys.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">No before/after values captured for this event.</div>;
  return <div className="overflow-x-auto rounded-lg border border-[var(--psm-line)]"><table className="w-full min-w-[560px] text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Old value</th><th className="px-3 py-2 text-left">New value</th></tr></thead><tbody>{keys.map((key) => <tr key={key} className="border-t border-[var(--psm-line)]"><td className="px-3 py-2 font-semibold">{key}</td><td className="px-3 py-2 text-red-200">{format(before?.[key])}</td><td className="px-3 py-2 text-emerald-200">{format(after?.[key])}</td></tr>)}</tbody></table></div>;
}

function format(value: any) {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
