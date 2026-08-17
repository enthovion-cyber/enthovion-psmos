export function CriticalityHistoryTab({ rows }: { rows: Array<Record<string, unknown>> }) {
  return <div className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Criticality History</h2><div className="mt-3 space-y-2 text-sm">{rows.length ? rows.map((row) => <div key={String(row.id)} className="rounded-md border border-border p-3"><div className="font-medium">{String(row.event_title)}</div><div className="text-xs text-muted-foreground">{String(row.created_at ?? '')}</div></div>) : <div className="text-muted-foreground">No history events yet.</div>}</div></div>;
}
